"use client";

import { useLocale } from "next-intl";
import { BlogManager } from "@/components/admin/blog-manager";

/**
 * Blog Admin Content Component
 * 
 * Client component wrapper for the blog manager.
 * Handles locale detection and passes it to BlogManager.
 * 
 * Requirements: 3.1
 */
export function BlogAdminContent() {
  const locale = useLocale();
  
  return <BlogManager locale={locale} />;
}
