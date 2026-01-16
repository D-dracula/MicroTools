"use client";

import { useTranslations, useLocale } from "next-intl";
import { ArticleCard } from "./article-card";
import { ArticleCardSkeleton } from "./article-card-skeleton";
import { AdSlot } from "@/components/ads";
import type { ArticleListItem } from "@/lib/blog/types";
import { FileText } from "lucide-react";

interface ArticleGridProps {
  articles: ArticleListItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ArticleGrid({ 
  articles, 
  isLoading = false,
  emptyMessage 
}: ArticleGridProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Show loading skeletons
  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="status"
        aria-label={t("blog.loadingArticles")}
        aria-busy="true"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
        <span className="sr-only">{t("blog.loadingArticles")}</span>
      </div>
    );
  }

  // Show empty state
  if (articles.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-16 px-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <FileText className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          {t("blog.noArticles")}
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {emptyMessage || t("blog.noArticlesDescription")}
        </p>
      </div>
    );
  }

  // Render articles with ad slots every 6 articles
  const renderItems = () => {
    const items: React.ReactElement[] = [];
    
    articles.forEach((article, index) => {
      // Add article card
      items.push(
        <ArticleCard key={article.id} article={article} />
      );

      // Insert ad slot after every 6 articles (but not after the last article)
      if ((index + 1) % 6 === 0 && index < articles.length - 1) {
        items.push(
          <div 
            key={`ad-${index}`} 
            className="col-span-1 md:col-span-2 lg:col-span-3"
            role="complementary"
            aria-label={t("common.advertisement")}
          >
            <AdSlot 
              placement="landing-hero"
              locale={locale}
              className="my-4"
            />
          </div>
        );
      }
    });

    return items;
  };

  return (
    <section 
      aria-label={t("blog.articlesList")}
      aria-live="polite"
    >
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="feed"
        aria-busy={isLoading}
      >
        {renderItems()}
      </div>
    </section>
  );
}
