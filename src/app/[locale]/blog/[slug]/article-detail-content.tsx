"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, BookOpen, Share2, TrendingUp, Package, Megaphone, BarChart3, FileText } from "lucide-react";
import { ArticleContent } from "@/components/blog/article-content";
import { ArticleAuthor } from "@/components/blog/article-author";
import { ArticleSources } from "@/components/blog/article-sources";
import { ArticleShare } from "@/components/blog/article-share";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { AdSlot } from "@/components/ads/ad-slot";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/blog/types";

interface ArticleDetailContentProps {
  article: Article;
  locale: string;
}

// Category colors for visual distinction - professional and subtle
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string; icon: React.ElementType }> = {
  "marketing": { 
    bg: "bg-purple-500/10", 
    text: "text-purple-600 dark:text-purple-400", 
    border: "border-purple-500/30",
    gradient: "from-purple-600 via-pink-500 to-rose-500",
    icon: Megaphone
  },
  "seller-tools": { 
    bg: "bg-cyan-500/10", 
    text: "text-cyan-600 dark:text-cyan-400", 
    border: "border-cyan-500/30",
    gradient: "from-cyan-600 via-blue-500 to-indigo-500",
    icon: BarChart3
  },
  "logistics": { 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-600 dark:text-emerald-400", 
    border: "border-emerald-500/30",
    gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    icon: Package
  },
  "trends": { 
    bg: "bg-orange-500/10", 
    text: "text-orange-600 dark:text-orange-400", 
    border: "border-orange-500/30",
    gradient: "from-orange-600 via-amber-500 to-yellow-500",
    icon: TrendingUp
  },
  "case-studies": { 
    bg: "bg-indigo-500/10", 
    text: "text-indigo-600 dark:text-indigo-400", 
    border: "border-indigo-500/30",
    gradient: "from-indigo-600 via-violet-500 to-purple-500",
    icon: FileText
  },
};

// Category gradients for hero section backgrounds
const CATEGORY_GRADIENTS: Record<string, string> = {
  "marketing": "from-purple-600 to-pink-500",
  "seller-tools": "from-cyan-600 to-blue-500",
  "logistics": "from-emerald-600 to-teal-500",
  "trends": "from-orange-600 to-amber-500",
  "case-studies": "from-indigo-600 to-violet-500",
};

/**
 * ArticleDetailContent Component
 * 
 * Client component that renders the full article with:
 * - Side-by-side Hero section with thumbnail and content
 * - Article metadata (date, reading time, category, tags)
 * - Ad placement below title (Requirements: 10.3)
 * - Full article content
 * - Sidebar ad on desktop (Requirements: 10.4)
 * - Ad before sources section (Requirements: 10.5)
 * - Sources section
 * - Share buttons
 * 
 * Requirements: 1.3, 10.3, 10.4, 10.5, 10.6
 */
export function ArticleDetailContent({ article, locale }: ArticleDetailContentProps) {
  const t = useTranslations("blog");
  const isRTL = locale === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  
  // Get category config
  const categoryConfig = CATEGORY_COLORS[article.category] || CATEGORY_COLORS["trends"];
  const CategoryIcon = categoryConfig.icon;

  // Format date based on locale
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, Record<string, string>> = {
      "marketing": { en: "Marketing", ar: "التسويق" },
      "seller-tools": { en: "Seller Tools", ar: "أدوات البائعين" },
      "logistics": { en: "Logistics", ar: "اللوجستيات" },
      "trends": { en: "Trends", ar: "الاتجاهات" },
      "case-studies": { en: "Case Studies", ar: "دراسات حالة" },
    };
    return categoryMap[category]?.[locale] || category;
  };

  // Reading time label for screen readers
  const readingTimeLabel = locale === "ar" 
    ? `${article.readingTime} دقائق للقراءة`
    : `${article.readingTime} minutes read`;

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <ReadingProgress targetSelector="#article-content" />

      {/* Skip to main content link for keyboard users */}
      <a 
        href="#article-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        {locale === "ar" ? "انتقل إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>

      {/* Hero Section - Side by Side Design */}
      <header className="relative overflow-hidden" aria-labelledby="article-title">
        {/* Background with gradient and pattern */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryConfig.gradient} opacity-[0.08]`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
        
        {/* Decorative shapes */}
        <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${categoryConfig.gradient} opacity-10 rounded-full blur-3xl`} />
        <div className={`absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr ${categoryConfig.gradient} opacity-10 rounded-full blur-3xl`} />
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* Back to Blog Link */}
          <nav className="mb-6" aria-label={t("breadcrumb")}>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1"
              aria-label={t("backToBlog")}
            >
              <BackArrow className="w-4 h-4" aria-hidden="true" />
              <span>{t("backToBlog")}</span>
            </Link>
          </nav>

          {/* Side by Side Layout */}
          <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-center ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
            
            {/* Content Side */}
            <div className="flex-1 space-y-6">
              {/* Category Badge with Icon */}
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${categoryConfig.gradient} text-white shadow-lg`}>
                  <CategoryIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${categoryConfig.bg} ${categoryConfig.text} ${categoryConfig.border} border px-3 py-1`}
                  aria-label={`${t("category")}: ${getCategoryLabel(article.category)}`}
                >
                  {getCategoryLabel(article.category)}
                </Badge>
              </div>
              
              {/* Title */}
              <h1 
                id="article-title"
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight"
              >
                {article.title}
              </h1>
              
              {/* Summary */}
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {article.summary}
              </p>
              
              {/* Metadata */}
              <div 
                className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2"
                aria-label={t("articleInfo")}
              >
                {/* Published Date */}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <time dateTime={article.createdAt.toISOString()}>
                    {formatDate(article.createdAt)}
                  </time>
                </div>
                
                {/* Reading Time */}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full" aria-label={readingTimeLabel}>
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>{t("readingTime", { minutes: article.readingTime })}</span>
                </div>
                
                {/* Sources Count */}
                {article.sources && article.sources.length > 0 && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    <span>{article.sources.length} {locale === "ar" ? "مصادر" : "sources"}</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {article.tags.slice(0, 4).map((tag, index) => (
                    <Link
                      key={index}
                      href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}
                      className="text-xs bg-muted hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-full transition-colors"
                      aria-label={`${t("filterByTag")}: ${tag}`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Image Side */}
            <div className="w-full lg:w-[45%] flex-shrink-0">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                {/* Gradient fallback */}
                <div className={`absolute inset-0 bg-gradient-to-br ${categoryConfig.gradient}`} />
                
                {/* Pattern overlay on gradient */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_0%,transparent_70%)]" />
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-white/20 rounded-full" />
                  <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-white/20 rounded-full" />
                  <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-white/20 rounded-full" />
                </div>
                
                {/* Category icon on gradient fallback */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <CategoryIcon className="w-24 h-24 text-white/30" aria-hidden="true" />
                </div>
                
                {/* Actual image */}
                {article.thumbnailUrl && (
                  <Image
                    src={article.thumbnailUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                
                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom border gradient */}
        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent`} />
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
          {/* Main Content Column */}
          <main id="article-content" className="flex-1 min-w-0" tabIndex={-1}>
            {/* Ad Banner Below Title - Requirements: 10.3 */}
            <div className="mb-8" role="complementary" aria-label={t("advertisement") || "Advertisement"}>
              <AdSlot
                placement="tool-bottom"
                locale={locale}
                fallbackToAdSense={true}
                adSenseSlot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT}
                className="max-w-[720px] mx-auto"
              />
            </div>

            {/* Author Section - Requirements: 6.5 */}
            <section className="mb-8" aria-labelledby="author-heading">
              <h2 id="author-heading" className="sr-only">
                {locale === "ar" ? "معلومات الكاتب" : "Author information"}
              </h2>
              <ArticleAuthor
                author={article.author}
                publishedAt={article.createdAt}
                locale={locale}
              />
            </section>

            {/* Article Content */}
            <ArticleContent content={article.content} locale={locale} />

            {/* Ad Before Sources - Requirements: 10.5 */}
            <div className="my-8" role="complementary" aria-label={t("advertisement") || "Advertisement"}>
              <AdSlot
                placement="tool-bottom"
                locale={locale}
                fallbackToAdSense={true}
                adSenseSlot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_BOTTOM_SLOT}
                className="max-w-[720px] mx-auto"
              />
            </div>

            {/* Sources Section */}
            {article.sources && article.sources.length > 0 && (
              <section className="mt-8" aria-labelledby="sources-heading">
                <h2 id="sources-heading" className="sr-only">{t("sources")}</h2>
                <ArticleSources sources={article.sources} />
              </section>
            )}

            {/* Share Section */}
            <section className="mt-8" aria-labelledby="share-heading">
              <h2 id="share-heading" className="sr-only">{t("shareArticle")}</h2>
              <ArticleShare
                title={article.title}
                slug={article.slug}
                summary={article.summary}
              />
            </section>
          </main>

          {/* Sidebar - Desktop Only (>1280px) - Requirements: 10.4, 10.6 */}
          <aside 
            className="hidden xl:block w-[300px] flex-shrink-0"
            aria-label={t("sidebar")}
          >
            <div className="sticky top-4 space-y-6">
              {/* Table of Contents */}
              <TableOfContents 
                contentSelector="#article-content article" 
                locale={locale}
              />

              {/* Sidebar Ad - Requirements: 10.4 */}
              <div role="complementary" aria-label={t("advertisement") || "Advertisement"}>
                <AdSlot
                  placement="tool-sidebar"
                  locale={locale}
                  fallbackToAdSense={true}
                  adSenseSlot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SIDEBAR_SLOT}
                  className="w-full"
                />
              </div>
              
              {/* Article Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 border">
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  {t("articleInfo")}
                </h3>
                
                <dl className="space-y-3 text-sm">
                  {/* Category */}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      {t("category")}
                    </dt>
                    <dd>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(article.category)}
                      </Badge>
                    </dd>
                  </div>
                  
                  {/* Reading Time */}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      {t("readingTimeLabel")}
                    </dt>
                    <dd className="font-medium">
                      {t("readingTime", { minutes: article.readingTime })}
                    </dd>
                  </div>
                  
                  {/* Published Date */}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                      {t("published")}
                    </dt>
                    <dd className="font-medium text-xs">
                      <time dateTime={article.createdAt.toISOString()}>
                        {formatDate(article.createdAt)}
                      </time>
                    </dd>
                  </div>
                  
                  {/* Sources Count */}
                  {article.sources && article.sources.length > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">
                        {t("sources")}
                      </dt>
                      <dd className="font-medium">
                        {article.sources.length}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Tags Card */}
              {article.tags && article.tags.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    {t("tags")}
                  </h3>
                  <div className="flex flex-wrap gap-2" role="list">
                    {article.tags.map((tag, index) => (
                      <Link
                        key={index}
                        href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}
                        role="listitem"
                      >
                        <Badge 
                          variant="secondary" 
                          className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
