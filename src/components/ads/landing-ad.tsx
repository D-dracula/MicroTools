"use client";

import { AdSlot } from "./ad-slot";

interface LandingAdProps {
  locale: string;
}

/**
 * Landing Page Ad Component
 * Client component wrapper for AdSlot on landing page
 * Requirements: 16.1
 */
export function LandingAd({ locale }: LandingAdProps) {
  return (
    <AdSlot
      placement="landing-hero"
      locale={locale}
      fallbackToAdSense={true}
      adSenseSlot={process.env.NEXT_PUBLIC_ADSENSE_LANDING_SLOT}
      className="max-w-4xl mx-auto"
    />
  );
}

export default LandingAd;
