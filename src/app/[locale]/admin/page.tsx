import type { Metadata } from "next";
import { AdminOverviewContent } from "./admin-overview-content";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for admin overview page
 */
export async function generateMetadata({ params }: AdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "نظرة عامة | لوحة الإدارة" : "Overview | Admin Dashboard",
  };
}

/**
 * Admin Overview Page
 * 
 * Main landing page for the admin dashboard.
 * Shows key metrics and quick actions.
 */
export default function AdminPage() {
  return <AdminOverviewContent />;
}
