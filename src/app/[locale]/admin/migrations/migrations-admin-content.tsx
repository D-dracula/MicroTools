"use client";

import { useLocale } from "next-intl";
import { MigrationManager } from "@/components/admin/migration-manager";

/**
 * Migrations Admin Content Component
 * 
 * Client component wrapper for the migration manager.
 * Handles locale detection and passes it to MigrationManager.
 * 
 * Requirements: 6.1
 */
export function MigrationsAdminContent() {
  const locale = useLocale();
  
  return <MigrationManager locale={locale} />;
}
