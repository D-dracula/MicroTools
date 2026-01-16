import type { Metadata } from "next";
import { HealthAdminContent } from "./health-admin-content";

interface HealthAdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for health admin page
 */
export async function generateMetadata({ params }: HealthAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "صحة النظام | لوحة الإدارة" : "System Health | Admin Dashboard",
  };
}

/**
 * Health Admin Page
 * 
 * Admin page for monitoring system health status.
 * Displays service status, API response times, and resource usage.
 * 
 * Requirements: 8.1
 */
export default function HealthAdminPage() {
  return <HealthAdminContent />;
}
