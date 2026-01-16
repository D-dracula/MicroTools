import type { Metadata } from "next";
import { UsersAdminContent } from "./users-admin-content";

interface UsersAdminPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for users admin page
 */
export async function generateMetadata({ params }: UsersAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "إدارة المستخدمين | لوحة الإدارة" : "User Manager | Admin Dashboard",
  };
}

/**
 * Users Admin Page
 * 
 * Admin page for managing platform users.
 * Provides user listing, search, and email confirmation.
 * 
 * Requirements: 4.1
 */
export default function UsersAdminPage() {
  return <UsersAdminContent />;
}
