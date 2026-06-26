import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

/**
 * Sticky top bar for content pages (about, report form, console). The map page
 * renders its own header overlaid on the map.
 */
export function SiteHeader({
  right,
  tagline,
}: {
  right?: ReactNode;
  tagline?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-sidebar/70">
      <Brand tagline={tagline} />
      {right ? <div className="flex items-center gap-1.5">{right}</div> : null}
    </header>
  );
}
