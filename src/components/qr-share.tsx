"use client";

import { Check, Copy, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Header action that shows a QR code linking straight to the report form.
 * Lets someone with a phone scan and open `/reportar` without typing a URL —
 * handy for posters, shared screens, or in-person outreach.
 */
export function QrShare({ path = "/reportar" }: { path?: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // The absolute URL is only knowable on the client (depends on the origin).
  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Mostrar código QR para reportar"
        >
          <QrCode className="size-[18px]" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escanea para reportar</DialogTitle>
          <DialogDescription>
            Apunta la cámara de tu teléfono al código para abrir el formulario
            de reporte.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            {url ? (
              <QRCodeSVG
                value={url}
                size={208}
                level="M"
                marginSize={0}
                fgColor="#0a0a0a"
                bgColor="#ffffff"
              />
            ) : (
              <div className="size-[208px] animate-pulse rounded bg-muted" />
            )}
          </div>

          <div className="flex w-full items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {url || "…"}
            </code>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={copy}
              aria-label="Copiar enlace"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
