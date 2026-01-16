import type { Metadata } from "next";
import { GenerateArticleContent } from "./generate-article-content";

interface GenerateArticlePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for article generation page
 */
export async function generateMetadata({ params }: GenerateArticlePageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === "ar" ? "توليد مقال بالذكاء الاصطناعي | لوحة الإدارة" : "Generate Article with AI | Admin Dashboard",
  };
}

/**
 * Generate Article Page
 * 
 * Admin page for generating blog articles using AI.
 */
export default function GenerateArticlePage() {
  return <GenerateArticleContent />;
}
