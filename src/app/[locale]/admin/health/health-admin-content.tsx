"use client";

import { useLocale } from "next-intl";
import { SystemHealth } from "@/components/admin/system-health";

/**
 * Health Admin Content Component
 * 
 * Client component wrapper for the system health monitor.
 * Handles locale detection and passes it to SystemHealth.
 * 
 * Requirements: 8.1
 */
export function HealthAdminContent() {
  const locale = useLocale();
  
  return <SystemHealth locale={locale} />;
}
