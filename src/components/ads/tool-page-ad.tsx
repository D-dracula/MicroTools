"use client";

import { AdSlot } from "./ad-slot";

interface ToolPageAdProps {
  locale: string;
  position: "sidebar" | "bottom";
}

/**
 * Tool Page Ad Component
 * Client component wrapper for AdSlot on tool pages
 * Requirements: 16.2, 16.5
 */
export function ToolPageAd({ locale, position }: ToolPageAdProps) {
  const placement = position === "sidebar" ? "tool-sidebar" : "tool-bottom";
  const adSenseSlot = position === "sidebar"
    ? process.env.NEXT_PUBLIC_ADSENSE_TOOL_SIDEBAR_SLOT
    : process.env.NEXT_PUBLIC_ADSENSE_TOOL_BOTTOM_SLOT;

  return (
    <AdSlot
      placement={placement}
      locale={locale}
      fallbackToAdSense={true}
      adSenseSlot={adSenseSlot}
      className={position === "sidebar" ? "sticky top-4" : "mt-8"}
    />
  );
}

export default ToolPageAd;
