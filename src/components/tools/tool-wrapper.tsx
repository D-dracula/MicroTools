"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import type { ProfitCalculationOutputs } from "@/lib/calculators/profit-margin";

interface ToolWrapperProps {
  slug: string;
  children: React.ReactElement<{ onSave?: (inputs: Record<string, unknown>, outputs: Record<string, unknown>) => Promise<void> }>;
}

/**
 * Track tool usage for analytics
 * Requirements: 11.1, 11.2, 11.3
 */
async function trackToolUsage(toolSlug: string, userType: "guest" | "authenticated") {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toolSlug,
        userType,
      }),
    });
  } catch (error) {
    // Silently fail - analytics should not affect user experience
    console.error("Failed to track tool usage:", error);
  }
}

/**
 * Wrapper component that provides save functionality to tool components
 * Handles API calls to save calculations and tracks tool usage
 * Requirements: 11.1, 11.2
 */
export function ToolWrapper({ slug, children }: ToolWrapperProps) {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const hasTracked = useRef(false);

  // Track tool usage on page load (Requirements: 11.1, 11.2)
  useEffect(() => {
    // Only track once per component mount and after session status is determined
    if (hasTracked.current || status === "loading") {
      return;
    }

    const userType = session?.user ? "authenticated" : "guest";
    trackToolUsage(slug, userType);
    hasTracked.current = true;
  }, [slug, session, status]);

  const handleSave = useCallback(async (
    inputs: { costPrice: number; sellingPrice: number },
    outputs: ProfitCalculationOutputs
  ) => {
    try {
      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolSlug: slug,
          inputs,
          outputs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save calculation");
      }

      if (data.success) {
        toast.success(t("common.save"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  }, [slug, t]);

  // Clone the child element and pass the onSave prop
  return React.cloneElement(children, { onSave: handleSave as unknown as (inputs: Record<string, unknown>, outputs: Record<string, unknown>) => Promise<void> });
}
