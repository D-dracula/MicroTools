import type { Metadata } from "next";
import { NewArticleContent } from "./new-article-content";

interface NewArticlePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for new article page
 */
export async function generateMetadata({ params }: NewArticlePageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "إنشاء مقال جديد | لوحة الإدارة" : "Create New Article | Admin Dashboard",
  };
}

/**
 * New Article Page
 * 
 * Admin page for creating new blog articles manually.
 */
export default function NewArticlePage() {
  return <NewArticleContent />;
}
