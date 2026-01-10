"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CustomAdDisplay } from "./custom-ad-display";

// Lazy load AdSense component (Requirement 14.5)
const AdSense = dynamic(() => import("./adsense"), {
  ssr: false,
  loading: () => <AdSlotSkeleton />,
});

// Ad placement types
type AdPlacement = "landing-hero" | "tool-sidebar" | "tool-bottom";

interface CustomAd {
  id: string;
  placement: string;
  priority: number;
  isActive: boolean;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  imageUrl: string;
  linkUrl: string;
}

interface AdSlotProps {
  placement: AdPlacement;
  locale: string;
  fallbackToAdSense?: boolean;
  adSenseSlot?: string;
  className?: string;
}

// Loading skeleton
function AdSlotSkeleton() {
  return (
    <div className="w-full h-32 bg-muted/50 rounded-lg animate-pulse" />
  );
}

/**
 * AdSlot Component
 * Fetches and displays custom ads with AdSense fallback
 * Requirements: 15.3, 15.4, 16.4
 */
export function AdSlot({
  placement,
  locale,
  fallbackToAdSense = true,
  adSenseSlot,
  className = "",
}: AdSlotProps) {
  const [customAd, setCustomAd] = useState<CustomAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(`/api/ads?placement=${placement}`);
        const data = await response.json();

        if (data.success && data.data) {
          setCustomAd(data.data);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [placement]);

  // Show skeleton while loading
  if (isLoading) {
    return <AdSlotSkeleton />;
  }

  // If we have a custom ad, display it (Requirement 15.4 - custom ads have priority)
  if (customAd) {
    return (
      <div className={`ad-slot ad-slot-${placement} ${className}`}>
        <CustomAdDisplay ad={customAd} locale={locale} />
      </div>
    );
  }

  // Fallback to AdSense if configured (Requirement 16.4)
  if (fallbackToAdSense && adSenseSlot && !error) {
    return (
      <div className={`ad-slot ad-slot-${placement} ${className}`}>
        <AdSense
          adSlot={adSenseSlot}
          adFormat={placement === "tool-sidebar" ? "vertical" : "horizontal"}
        />
      </div>
    );
  }

  // No ad to display
  return null;
}

export default AdSlot;
