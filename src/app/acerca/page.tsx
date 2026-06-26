import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Acerca · Misión Venezuela" };

export default function AcercaPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <Link href="/" className="text-muted-foreground text-sm">
          ← Volver al mapa
        </Link>
        <h1 className="text-2xl font-semibold">Misión Venezuela</h1>
        <p className="text-muted-foreground">
          Plataforma ciudadana, abierta y <strong>privada por diseño</strong>{" "}
          para mapear cortes de electricidad y agua, y la escasez de medicinas,
          alimentos y combustible en Venezuela.
        </p>
      </div>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-base font-semibold">Inspirado en Mission 4636</h2>
        <p>
          Tras el terremoto de Haití en 2010, miles de voluntarios de la
          diáspora tradujeron, clasificaron y geolocalizaron mensajes SMS para
          dirigir la ayuda. Adaptamos ese mismo concepto —{" "}
          <em>
            ingreso → clasificación → geolocalización → verificación →
            publicación
          </em>
          — a la realidad venezolana: reportes por WhatsApp, procesados por una
          comunidad, mostrados en un mapa público.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-base font-semibold">Privacidad primero</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nunca almacenamos tu número de teléfono; solo un hash.</li>
          <li>
            Tu ubicación exacta jamás se publica: se muestra de forma
            aproximada.
          </li>
          <li>
            Cada reporte es revisado por voluntarios antes de aparecer en el
            mapa.
          </li>
          <li>
            Eliminamos automáticamente datos personales del texto público.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-base font-semibold">Código abierto</h2>
        <p>
          Todo el proyecto es de código abierto. Puedes verlo, auditarlo y
          contribuir en{" "}
          <a
            className="underline"
            href="https://github.com/crafter-station/mission-ve"
          >
            github.com/crafter-station/mission-ve
          </a>
          .
        </p>
      </section>

      <Button asChild>
        <Link href="/reportar">Reportar un problema</Link>
      </Button>
    </main>
  );
}
