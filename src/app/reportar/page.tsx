"use client";

import { Check, Crosshair, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_META,
  ESTADO_NAMES,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export default function ReportarPage() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [estado, setEstado] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  function locate() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no permite ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Ubicación añadida (se mostrará de forma aproximada).");
      },
      () => toast.error("No pudimos obtener tu ubicación."),
    );
  }

  async function submit() {
    if (text.trim().length < 3) {
      toast.error("Cuéntanos qué está pasando.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          category: category || undefined,
          estado: estado || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      const { id } = (await res.json()) as { id: string };
      setTicket(id);
    } catch {
      toast.error("No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (ticket) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader
          right={
            <Button asChild size="sm" variant="ghost">
              <Link href="/">Ver mapa</Link>
            </Button>
          }
        />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-[420px] border border-border bg-card">
            <div className="flex flex-col items-center gap-4 border-b border-border px-6 py-8 text-center">
              <div className="flex size-11 items-center justify-center border border-emerald-500/40 text-emerald-500">
                <Check className="size-5" />
              </div>
              <div className="space-y-1">
                <h1 className="text-[18px] font-medium tracking-tight">
                  Reporte recibido
                </h1>
                <p className="text-[13px] text-muted-foreground">
                  Gracias por ayudar a tu comunidad.
                </p>
              </div>
              <div className="flex items-center gap-2 border border-border bg-background px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Folio
                </span>
                <span className="font-mono text-sm font-medium tracking-tight">
                  {ticket}
                </span>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Un equipo de voluntarios lo revisará. Si procede, aparecerá en
                el mapa público{" "}
                <span className="text-foreground">
                  sin tus datos personales
                </span>
                . Nunca compartimos tu identidad ni tu ubicación exacta.
              </p>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Ver el mapa</Link>
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setTicket(null);
                  setText("");
                  setCategory("");
                  setEstado("");
                  setCoords(null);
                }}
              >
                Otro reporte
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        right={
          <Button asChild size="sm" variant="ghost">
            <Link href="/">Ver mapa</Link>
          </Button>
        }
      />
      <main className="flex flex-1 items-start justify-center p-4 sm:items-center">
        <div className="w-full max-w-[460px] border border-border bg-card">
          <div className="border-b border-border px-6 py-5">
            <h1 className="text-[18px] font-medium tracking-tight">
              Reportar un problema
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Cortes de luz o agua, escasez de medicinas, alimentos o
              combustible. Es anónimo.
            </p>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                ¿Qué está pasando?
              </span>
              <Textarea
                placeholder="Ej: Sin luz desde hace 2 días en El Paraíso, Caracas."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Categoría
              </span>
              <div className="grid grid-cols-2 gap-px border border-border bg-border">
                {CATEGORIES.map((c) => {
                  const on = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(on ? "" : c)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors",
                        on
                          ? "bg-secondary text-foreground"
                          : "bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <span
                        className="size-2.5 shrink-0 border border-black/10"
                        style={{
                          backgroundColor: CATEGORY_META[c].color,
                          opacity: on ? 1 : 0.5,
                        }}
                      />
                      <span className="flex-1">{CATEGORY_LABELS[c]}</span>
                      {on ? <Check className="size-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Estado
              </span>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tu estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_NAMES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={locate}
              className={cn(
                "flex w-full items-center gap-2.5 border px-3 py-2.5 text-left text-[13px] transition-colors",
                coords
                  ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {coords ? (
                <MapPin className="size-4 text-emerald-500" />
              ) : (
                <Crosshair className="size-4" />
              )}
              <span className="flex-1">
                {coords
                  ? "Ubicación añadida"
                  : "Añadir mi ubicación (opcional)"}
              </span>
              {coords ? <Check className="size-3.5 text-emerald-500" /> : null}
            </button>

            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Tu ubicación exacta nunca se publica: en el mapa se muestra de
              forma aproximada para proteger tu privacidad.
            </p>
          </div>

          <div className="border-t border-border p-4">
            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar reporte"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
