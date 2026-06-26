import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkPassword, createSession, getModerator } from "@/lib/auth";

export const metadata = { title: "Acceso de voluntarios · Misión Venezuela" };

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const alias = String(formData.get("alias") ?? "").trim() || "voluntario";
  const next = String(formData.get("next") ?? "/moderation");

  if (!checkPassword(password)) {
    redirect("/moderation/login?error=1");
  }
  // The alias becomes the moderator's audit/verify identity.
  await createSession(alias.slice(0, 40));
  redirect(next.startsWith("/moderation") ? next : "/moderation");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await getModerator()) redirect("/moderation");
  const { error, next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acceso de voluntarios</CardTitle>
          <CardDescription>
            Consola de moderación de Misión Venezuela. Solo personas
            autorizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next ?? "/moderation"} />
            <label className="text-sm font-medium" htmlFor="alias">
              Alias
            </label>
            <input
              id="alias"
              name="alias"
              placeholder="p. ej. maria-caracas"
              className="border-input bg-transparent rounded-md border px-3 py-2 text-sm"
              autoComplete="off"
            />
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="border-input bg-transparent rounded-md border px-3 py-2 text-sm"
            />
            {error ? (
              <p className="text-destructive text-sm">Contraseña incorrecta.</p>
            ) : null}
            <Button type="submit" className="mt-2">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
