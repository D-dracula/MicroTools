import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailContent } from "./article-detail-content";
import { getArticleBySlug } from "@/lib/blog/article-service";
import type { Article } from "@/lib/blog/types";

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinecalc.com";

/**
 * Generate article page metadata
 * Requirements: 5.1, 5.2, 5.3
 */
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  
  try {
    const article = await getArticleBySlug(slug);
    
    if (!article) {
      return {
        title: locale === "ar" ? "المقال غير موجود" : "Article Not Found",
      };
    }

    const articleUrl = `${baseUrl}/${locale}/blog/${article.slug}`;
    
    return {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.summary,
      openGraph: {
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.summary,
        type: "article",
        url: articleUrl,
        images: article.thumbnailUrl ? [
          {
            url: article.thumbnailUrl,
            width: 1200,
            height: 630,
            alt: article.title,
          }
        ] : undefined,
        publishedTime: article.createdAt.toISOString(),
        modifiedTime: article.updatedAt.toISOString(),
        authors: [locale === "ar" ? "باين كالك" : "PineCalc"],
        tags: article.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.summary,
        images: article.thumbnailUrl ? [article.thumbnailUrl] : undefined,
      },
      alternates: {
        canonical: articleUrl,
        languages: {
          "en": `${baseUrl}/en/blog/${article.slug}`,
          "ar": `${baseUrl}/ar/blog/${article.slug}`,
        },
      },
    };
  } catch (error) {
    console.error("Error generating article metadata:", error);
    return {
      title: locale === "ar" ? "المقال غير موجود" : "Article Not Found",
    };
  }
}

/**
 * Generate Article JSON-LD structured data
 * Requirements: 5.3
 */
function generateArticleStructuredData(article: Article, locale: string) {
  const articleUrl = `${baseUrl}/${locale}/blog/${article.slug}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    image: article.thumbnailUrl || `${baseUrl}/logo.svg`,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: locale === "ar" ? "باين كالك" : "PineCalc",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: locale === "ar" ? "باين كالك" : "PineCalc",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: article.category,
    keywords: article.tags.join(", "),
    wordCount: article.content.split(/\s+/).length,
    inLanguage: locale === "ar" ? "ar-SA" : "en-US",
  };
}

/**
 * Generate Breadcrumb JSON-LD structured data
 */
function generateBreadcrumbStructuredData(article: Article, locale: string) {
  const blogLabel = locale === "ar" ? "المدونة" : "Blog";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "ar" ? "الرئيسية" : "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: blogLabel,
        item: `${baseUrl}/${locale}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${baseUrl}/${locale}/blog/${article.slug}`,
      },
    ],
  };
}

/**
 * Article Detail Page
 * Requirements: 1.3, 10.3, 10.4, 10.5, 10.6
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  
  // Fetch article data
  let article: Article | null = null;
  
  try {
    article = await getArticleBySlug(slug);
  } catch (error) {
    console.error("Error fetching article:", error);
  }
  
  // Return 404 if article not found
  if (!article) {
    notFound();
  }
  
  // Generate structured data
  const articleStructuredData = generateArticleStructuredData(article, locale);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(article, locale);

  return (
    <>
      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
        }}
      />
      
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      
      {/* Article Content */}
      <ArticleDetailContent article={article} locale={locale} />
    </>
  );
}
