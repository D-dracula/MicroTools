"use client";

import { useLocale } from "next-intl";
import { UserManager } from "@/components/admin/user-manager";

/**
 * Users Admin Content Component
 * 
 * Client component wrapper for the user manager.
 * Handles locale detection and passes it to UserManager.
 * 
 * Requirements: 4.1
 */
export function UsersAdminContent() {
  const locale = useLocale();
  
  return <UserManager locale={locale} />;
}
