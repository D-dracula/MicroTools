"use client";

import { useEffect, useState } from "react";

interface ReadingProgressProps {
  /** Target element selector to track progress */
  targetSelector?: string;
  /** Color of the progress bar (CSS variable or color) */
  color?: string;
}

/**
 * ReadingProgress Component
 * 
 * Shows a progress bar at the top of the page indicating
 * how much of the article has been read.
 * 
 * Features:
 * - Smooth animation
 * - Fixed position at top
 * - Customizable color
 * - Accessible (hidden from screen readers as decorative)
 */
export function ReadingProgress({ 
  targetSelector = "article",
  color = "hsl(var(--primary))"
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const calculateProgress = () => {
      const targetRect = target.getBoundingClientRect();
      const targetTop = targetRect.top + window.pageYOffset;
      const targetHeight = targetRect.height;
      const windowHeight = window.innerHeight;
      const scrollY = window.pageYOffset;

      // Start tracking when article comes into view
      const startPoint = targetTop - windowHeight;
      // End when article bottom reaches middle of viewport
      const endPoint = targetTop + targetHeight - windowHeight / 2;

      if (scrollY < startPoint) {
        setProgress(0);
        setIsVisible(false);
      } else if (scrollY > endPoint) {
        setProgress(100);
        setIsVisible(true);
      } else {
        const currentProgress = ((scrollY - startPoint) / (endPoint - startPoint)) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
        setIsVisible(true);
      }
    };

    // Initial calculation
    calculateProgress();

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", calculateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", calculateProgress);
    };
  }, [targetSelector]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none"
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="h-full transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
          opacity: isVisible ? 1 : 0,
          boxShadow: isVisible ? `0 0 10px ${color}` : "none",
        }}
      />
    </div>
  );
}
