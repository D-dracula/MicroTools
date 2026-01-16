"use client";

import { useLocale } from "next-intl";
import { KeysManager } from "@/components/admin/keys-manager";

/**
 * Keys Admin Content Component
 * 
 * Client component wrapper for the API keys manager.
 * Handles locale detection and passes it to KeysManager.
 * 
 * Requirements: 10.1
 */
export function KeysAdminContent() {
  const locale = useLocale();
  
  return <KeysManager locale={locale} />;
}
