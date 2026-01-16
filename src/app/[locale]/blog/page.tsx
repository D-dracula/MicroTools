import type { Metadata } from "next";
import { BlogPageContent } from "./blog-page-content";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ 
    page?: string; 
    category?: string; 
    search?: string;
  }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    ar: "المدونة | PineCalc - رؤى ونصائح التجارة الإلكترونية",
    en: "Blog | PineCalc - E-commerce Insights & Tips"
  };
  
  const descriptions = {
    ar: "تعلم من مقالات الخبراء حول البيع عبر الإنترنت والتسويق ونمو الأعمال",
    en: "Learn from expert articles about online selling, marketing, and business growth"
  };

  return {
    title: titles[locale as "ar" | "en"] || titles.en,
    description: descriptions[locale as "ar" | "en"] || descriptions.en,
    openGraph: {
      title: titles[locale as "ar" | "en"] || titles.en,
      description: descriptions[locale as "ar" | "en"] || descriptions.en,
      type: "website",
    },
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const { page, category, search } = await searchParams;

  return (
    <BlogPageContent 
      locale={locale}
      initialPage={page ? parseInt(page, 10) : 1}
      initialCategory={category}
      initialSearch={search}
    />
  );
}
