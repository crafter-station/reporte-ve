"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicReport } from "@/db/schema";
import { env } from "@/env";
import { PUBLIC_REPORTS_CHANNEL, type ReportEvent } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_META,
  type Category,
  VENEZUELA_CENTER,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

const DEFAULT_STYLE =
  env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";

function markerEl(report: PublicReport): HTMLElement {
  const meta = CATEGORY_META[(report.category as Category) ?? "other"];
  const el = document.createElement("div");
  el.style.cssText = `
    display:flex;align-items:center;justify-content:center;
    width:28px;height:28px;border-radius:9999px;cursor:pointer;
    background:${meta.color};color:#fff;font-size:15px;
    box-shadow:0 1px 4px rgba(0,0,0,.4);border:2px solid #fff;`;
  el.textContent = meta.emoji;
  el.title = report.summary ?? "";
  return el;
}

export function ReportMap({
  initialReports,
}: {
  initialReports: PublicReport[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [active, setActive] = useState<Set<Category>>(new Set(CATEGORIES));
  const [reports, setReports] = useState<PublicReport[]>(initialReports);

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center: [VENEZUELA_CENTER.lng, VENEZUELA_CENTER.lat],
      zoom: VENEZUELA_CENTER.zoom,
      attributionControl: { compact: true },
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Live updates: append newly published reports as they happen.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(PUBLIC_REPORTS_CHANNEL)
      .on("broadcast", { event: "report-event" }, ({ payload }) => {
        const evt = payload as ReportEvent;
        if (evt.type === "report:published") {
          setReports((prev) =>
            prev.some((r) => r.id === evt.report.id)
              ? prev
              : [evt.report, ...prev],
          );
        } else if (evt.type === "report:removed") {
          setReports((prev) => prev.filter((r) => r.id !== evt.id));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.lat != null &&
          r.lng != null &&
          active.has((r.category as Category) ?? "other"),
      ),
    [reports, active],
  );

  // Reconcile markers with the visible set.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const next = new Set(visible.map((r) => r.id));

    for (const [id, marker] of markers) {
      if (!next.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
    for (const r of visible) {
      if (markers.has(r.id) || r.lat == null || r.lng == null) continue;
      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: false,
      }).setHTML(
        `<div style="font:13px system-ui;max-width:220px">
           <strong>${CATEGORY_LABELS[(r.category as Category) ?? "other"]}</strong>
           ${r.severity ? ` · ${r.severity}` : ""}
           <div style="margin-top:4px">${r.summary ?? ""}</div>
           <div style="margin-top:4px;color:#666">${[r.parroquia, r.municipio, r.estado].filter(Boolean).join(", ")}</div>
         </div>`,
      );
      const marker = new maplibregl.Marker({ element: markerEl(r) })
        .setLngLat([r.lng, r.lat])
        .setPopup(popup)
        .addTo(map);
      markers.set(r.id, marker);
    }
  }, [visible]);

  function toggle(cat: Category) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Category filter chips */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 rounded-lg bg-background/85 p-2 backdrop-blur">
        {CATEGORIES.map((cat) => {
          const on = active.has(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition",
                on
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground",
              )}
              style={
                on
                  ? {
                      backgroundColor: CATEGORY_META[cat].color,
                      color: "#fff",
                      borderColor: CATEGORY_META[cat].color,
                    }
                  : undefined
              }
            >
              <span>{CATEGORY_META[cat].emoji}</span>
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-3 left-3 z-10 rounded-md bg-background/85 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
        {visible.length} reporte{visible.length === 1 ? "" : "s"} en vivo
      </div>
    </div>
  );
}
