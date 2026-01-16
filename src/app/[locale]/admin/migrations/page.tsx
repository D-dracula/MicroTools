import type { Metadata } from "next";
import { MigrationsAdminContent } from "./migrations-admin-content";

interface MigrationsAdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for migrations admin page
 */
export async function generateMetadata({ params }: MigrationsAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "إدارة الترحيل | لوحة الإدارة" : "Migration Manager | Admin Dashboard",
  };
}

/**
 * Migrations Admin Page
 * 
 * Admin page for managing database migrations.
 * Provides migration listing, execution, and rollback actions.
 * 
 * Requirements: 6.1
 */
export default function MigrationsAdminPage() {
  return <MigrationsAdminContent />;
}
