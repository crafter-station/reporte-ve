import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { env } from "@/env";

/**
 * Kapso wraps the WhatsApp Cloud API. We talk to it via the official SDK,
 * pointed at Kapso's Meta proxy base URL with our Kapso API key.
 *
 * Returns null when WhatsApp isn't configured (local dev / web-only mode) so
 * callers can no-op gracefully instead of crashing.
 */
let cached: WhatsAppClient | null | undefined;

export function getWhatsAppClient(): WhatsAppClient | null {
  if (cached !== undefined) return cached;
  if (!env.KAPSO_API_KEY) {
    cached = null;
    return null;
  }
  cached = new WhatsAppClient({
    baseUrl: env.KAPSO_BASE_URL,
    kapsoApiKey: env.KAPSO_API_KEY,
  });
  return cached;
}

/** True when we can actually send WhatsApp replies. */
export function whatsAppEnabled(): boolean {
  return Boolean(env.KAPSO_API_KEY && env.KAPSO_PHONE_NUMBER_ID);
}

/**
 * Reply to an inbound message. `contextMessageId` threads the reply to the
 * original message in the user's chat. Best-effort: logs and swallows errors so
 * a failed reply never drops the report we just ingested.
 */
export async function replyText(opts: {
  to: string;
  body: string;
  contextMessageId?: string;
}): Promise<void> {
  const client = getWhatsAppClient();
  if (!client || !env.KAPSO_PHONE_NUMBER_ID) {
    console.info("[whatsapp] reply skipped (not configured):", opts.body);
    return;
  }
  try {
    await client.messages.sendText({
      phoneNumberId: env.KAPSO_PHONE_NUMBER_ID,
      to: opts.to,
      body: opts.body,
      contextMessageId: opts.contextMessageId,
    });
  } catch (err) {
    console.error("[whatsapp] failed to send reply:", err);
  }
}

/** Privacy-first acknowledgement sent back to a reporter. */
export function acknowledgementMessage(ticket: string): string {
  return [
    `🇻🇪 Recibimos tu reporte. Folio: ${ticket}`,
    "",
    "Voluntarios lo revisarán y, si procede, aparecerá en el mapa público SIN tus datos personales.",
    "Nunca compartimos tu número ni tu identidad.",
    "",
    "Si es una emergencia que pone en riesgo tu vida, contacta a los servicios de emergencia locales.",
  ].join("\n");
}
