import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Lazily-initialized Drizzle client.
 *
 * We defer the actual connection until first query so that importing this
 * module (e.g. while Next.js collects page data at build time, when secrets may
 * be absent) never touches the database or requires DATABASE_URL.
 */
type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: DB;
};

function createDb(): DB {
  // Local Supabase uses port 54322; production uses the pooler (6543).
  const isLocalSupabase = env.DATABASE_URL.includes(":54322");
  const isProduction = process.env.NODE_ENV === "production";

  const connectionString =
    isLocalSupabase || env.DATABASE_URL.includes("pgbouncer=true")
      ? env.DATABASE_URL
      : env.DATABASE_URL.includes("?")
        ? `${env.DATABASE_URL}&pgbouncer=true`
        : `${env.DATABASE_URL}?pgbouncer=true`;

  const client =
    globalForDb.client ??
    postgres(connectionString, {
      prepare: false, // Required for transaction pooling mode.
      max: isProduction ? 1 : 10,
      idle_timeout: isProduction ? 0 : 20,
      connect_timeout: 10,
    });

  if (!isProduction) globalForDb.client = client;
  return drizzle(client, { schema });
}

/** Proxy that initializes the real client on first property access. */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const instance = (globalForDb.db ??= createDb());
    return Reflect.get(instance, prop, receiver);
  },
});
