import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/env";

/**
 * Minimal moderator session for the MVP: a signed, httpOnly cookie issued when
 * someone enters the shared MODERATOR_PASSWORD. This is deliberately simple —
 * the intended upgrade path is Supabase Auth with per-volunteer accounts.
 */
const COOKIE = "mv_mod";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function sign(value: string): string {
  return createHmac("sha256", env.MODERATOR_SESSION_SECRET)
    .update(value)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Validate the submitted password against the configured one. */
export function checkPassword(password: string): boolean {
  return safeEqual(password, env.MODERATOR_PASSWORD);
}

/** Issue a session cookie. `id` becomes the moderator's audit/verify identity. */
export async function createSession(id: string): Promise<void> {
  const issued = `${id}.${Date.now()}`;
  const token = `${issued}.${sign(issued)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Returns the moderator id if a valid session exists, else null. */
export async function getModerator(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!safeEqual(sig, sign(payload))) return null;

  const [id, ts] = payload.split(".");
  if (!id || !ts) return null;
  if (Date.now() - Number(ts) > MAX_AGE * 1000) return null;
  return id;
}

/** Cookie name, exported so proxy.ts can do a cheap presence check. */
export const SESSION_COOKIE = COOKIE;
