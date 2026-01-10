"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface CustomAd {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  imageUrl: string;
  linkUrl: string;
}

interface CustomAdDisplayProps {
  ad: CustomAd;
  locale: string;
  className?: string;
}

/**
 * Custom Ad Display Component
 * Displays a custom ad with impression and click tracking
 * Requirements: 15.3, 15.7, 17.8
 */
export function CustomAdDisplay({ ad, locale, className = "" }: CustomAdDisplayProps) {
  const hasTrackedImpression = useRef(false);

  // Get localized content
  const title = locale === "ar" ? ad.titleAr : ad.titleEn;
  const description = locale === "ar" ? ad.descriptionAr : ad.descriptionEn;

  // Track impression on mount
  useEffect(() => {
    if (hasTrackedImpression.current) return;
    hasTrackedImpression.current = true;

    // Fire and forget impression tracking
    fetch(`/api/ads/${ad.id}/impression`, {
      method: "POST",
    }).catch(() => {
      // Silently fail - don't break the UI for tracking failures
    });
  }, [ad.id]);

  // Handle click tracking
  const handleClick = async () => {
    // Track click before navigation
    try {
      await fetch(`/api/ads/${ad.id}/click`, {
        method: "POST",
      });
    } catch {
      // Silently fail
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block group"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={ad.imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
          <span className="text-xs text-muted-foreground/60 mt-2 block">
            {locale === "ar" ? "إعلان" : "Ad"}
          </span>
        </div>
      </a>
    </Card>
  );
}

export default CustomAdDisplay;
