"use client";

import { useLocale } from "next-intl";
import { ErrorMonitor } from "@/components/admin/error-monitor";

/**
 * Errors Admin Content Component
 * 
 * Client component wrapper for the error monitor.
 * Handles locale detection and passes it to ErrorMonitor.
 * 
 * Requirements: 5.1
 */
export function ErrorsAdminContent() {
  const locale = useLocale();
  
  return <ErrorMonitor locale={locale} />;
}
