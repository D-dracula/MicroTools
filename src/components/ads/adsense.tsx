"use client";

import { useEffect, useRef } from "react";

// AdSense configukration
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";

interface AdSenseProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "horizontal" | "vertical";
  fullWidthResponsive?: boolean;
  className?: string;
}

/**
 * Google AdSense Component with lazy loading
 * Requirements: 14.1, 14.2, 14.3, 14.5
 */
export function AdSense({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Skip if no client ID configured or already loaded
    if (!ADSENSE_CLIENT_ID || isLoaded.current) {
      return;
    }

    // Lazy load AdSense script (Requirement 14.5)
    const loadAdSenseScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="adsbygoogle"]')) {
        pushAd();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = pushAd;
      script.onerror = () => {
        // Handle ad blocker gracefully (Requirement 16.6)
        console.log("AdSense script blocked or failed to load");
      };
      document.head.appendChild(script);
    };

    const pushAd = () => {
      try {
        if (adRef.current && !isLoaded.current) {
          // @ts-expect-error - adsbygoogle is added by the script
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (error) {
        // Handle errors gracefully (Requirement 16.6)
        console.log("AdSense push error:", error);
      }
    };

    // Use Intersection Observer for lazy loading (Requirement 14.5)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadAdSenseScript();
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px" }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Don't render if no client ID (graceful degradation)
  if (!ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}

export default AdSense;
