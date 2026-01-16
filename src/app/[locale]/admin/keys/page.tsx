import type { Metadata } from "next";
import { KeysAdminContent } from "./keys-admin-content";

interface KeysAdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for keys admin page
 */
export async function generateMetadata({ params }: KeysAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "مفاتيح API | لوحة الإدارة" : "API Keys | Admin Dashboard",
  };
}

/**
 * Keys Admin Page
 * 
 * Admin page for managing API keys and environment variables.
 * Displays key status, allows testing, and shows warnings for missing keys.
 * 
 * Requirements: 10.1
 */
export default function KeysAdminPage() {
  return <KeysAdminContent />;
}
