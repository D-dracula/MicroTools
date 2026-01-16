import type { Metadata } from "next";
import { AdminLayoutContent } from "./admin-layout-content";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for admin pages
 */
export async function generateMetadata({ params }: AdminLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "لوحة الإدارة | Micro-Tools" : "Admin Dashboard | Micro-Tools",
    description: locale === "ar" 
      ? "لوحة إدارة منصة Micro-Tools" 
      : "Micro-Tools Platform Admin Dashboard",
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Admin Layout
 * 
 * Provides the main layout structure for admin pages.
 * Authentication and authorization are handled by AdminLayoutContent.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  
  return (
    <AdminLayoutContent locale={locale}>
      {children}
    </AdminLayoutContent>
  );
}
