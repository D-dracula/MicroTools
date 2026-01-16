import type { Metadata } from "next";
import { ErrorsAdminContent } from "./errors-admin-content";

interface ErrorsAdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for errors admin page
 */
export async function generateMetadata({ params }: ErrorsAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "مراقبة الأخطاء | لوحة الإدارة" : "Error Monitor | Admin Dashboard",
  };
}

/**
 * Errors Admin Page
 * 
 * Admin page for monitoring and managing system errors.
 * Provides error listing, filtering, and resolution actions.
 * 
 * Requirements: 5.1
 */
export default function ErrorsAdminPage() {
  return <ErrorsAdminContent />;
}
