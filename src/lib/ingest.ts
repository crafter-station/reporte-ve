import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLog,
  type NewReport,
  type PublicReport,
  reports,
} from "@/db/schema";
import { env } from "@/env";
import { auditId, reportId } from "./ids";
import { coarsenCoords, scrubPII } from "./privacy";
import { broadcastReportEvent } from "./realtime";
import type { Source } from "./taxonomy";
import { type Category, estadoCentroid, isCategory } from "./taxonomy";

/** Append an entry to the audit trail. Best-effort; never throws to caller. */
export async function logAudit(
  reportRowId: string,
  action: string,
  actorId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: auditId(),
      reportId: reportRowId,
      actorId: actorId ?? null,
      action,
      details: details ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write entry:", err);
  }
}

export type IngestInput = {
  source: Source;
  sourceRef?: string | null;
  reporterHash?: string | null;
  rawText?: string | null;
  mediaUrl?: string | null;
  // Private storage paths of attached photos (internal-only evidence).
  media?: string[] | null;
  // Reporter-supplied category hints (may include free-text labels).
  categories?: string[] | null;
  estado?: string | null;
  municipio?: string | null;
  parroquia?: string | null;
  // Precise coords (internal only) — e.g. a shared WhatsApp location pin.
  lat?: number | null;
  lng?: number | null;
};

export type IngestResult = {
  id: string;
  deduped: boolean;
};

/**
 * Persist a freshly received report. Idempotent on `sourceRef` so webhook
 * retries (WhatsApp delivers at-least-once) don't create duplicate rows.
 *
 * Every report starts as `pending` with no public coordinates — it only
 * becomes visible after a moderator structures and publishes it.
 */
export async function ingestReport(input: IngestInput): Promise<IngestResult> {
  if (input.sourceRef) {
    const existing = await db.query.reports.findFirst({
      where: eq(reports.sourceRef, input.sourceRef),
      columns: { id: true },
    });
    if (existing) return { id: existing.id, deduped: true };
  }

  const id = reportId();
  const row: NewReport = {
    id,
    source: input.source,
    sourceRef: input.sourceRef ?? null,
    reporterHash: input.reporterHash ?? null,
    rawText: input.rawText ?? null,
    mediaUrl: input.mediaUrl ?? null,
    media: input.media ?? [],
    categories: input.categories ?? [],
    estado: input.estado ?? null,
    municipio: input.municipio ?? null,
    parroquia: input.parroquia ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    status: "pending",
  };

  await db.insert(reports).values(row);
  await logAudit(id, "ingested", undefined, { source: input.source });

  if (env.AUTO_PUBLISH) {
    await autoPublish(id, input);
  }

  return { id, deduped: false };
}

/**
 * AUTO_PUBLISH path — skip the human review queue but KEEP the privacy
 * transforms: scrub PII from the text, coarsen (or estado-centroid) the
 * coordinates, and derive a category. Reporter photos are NOT auto-exposed —
 * `publicMedia` stays empty so an unreviewed image can never leak to the map.
 */
async function autoPublish(id: string, input: IngestInput): Promise<void> {
  const category: Category = input.categories?.find(isCategory) ?? "other";
  const severity = "medium" as const;
  const summary = scrubPII(
    (input.rawText ?? "").trim() || "Reporte sin descripción",
  ).slice(0, 280);

  // Never publish an exact point: coarsen precise coords, else snap to the
  // estado centroid, else leave the pin off (no estado → no public location).
  const coords =
    input.lat != null && input.lng != null
      ? coarsenCoords(input.lat, input.lng)
      : ((input.estado ? estadoCentroid(input.estado) : null) ?? {
          lat: null,
          lng: null,
        });

  const now = new Date();
  await db
    .update(reports)
    .set({
      category,
      severity,
      summary,
      publicLat: coords.lat,
      publicLng: coords.lng,
      status: "published",
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(reports.id, id));

  await logAudit(id, "auto_published", "system", { category, severity });

  const report: PublicReport = {
    id,
    category,
    categories: input.categories ?? [],
    severity,
    summary,
    estado: input.estado ?? null,
    municipio: input.municipio ?? null,
    parroquia: input.parroquia ?? null,
    lat: coords.lat,
    lng: coords.lng,
    media: [],
    createdAt: now,
    publishedAt: now,
  };
  await broadcastReportEvent({ type: "report:published", report });
}
