import type { Metadata } from "next";
import { BlogAdminContent } from "./blog-admin-content";

interface BlogAdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for blog admin page
 */
export async function generateMetadata({ params }: BlogAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "إدارة المقالات | لوحة الإدارة" : "Blog Manager | Admin Dashboard",
  };
}

/**
 * Blog Admin Page
 * 
 * Admin page for managing blog articles.
 * Provides CRUD operations for articles.
 * 
 * Requirements: 3.1
 */
export default function BlogAdminPage() {
  return <BlogAdminContent />;
}
