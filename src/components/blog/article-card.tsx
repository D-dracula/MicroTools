"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArticleListItem } from "@/lib/blog/types";
import { useState, useCallback } from "react";

interface ArticleCardProps {
  article: ArticleListItem;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [imageError, setImageError] = useState(false);

  // Generate gradient fallback based on category
  const getCategoryGradient = (category: string): string => {
    const gradients: Record<string, string> = {
      'marketing': 'from-purple-500 via-pink-500 to-rose-500',
      'seller-tools': 'from-blue-500 via-cyan-500 to-teal-500',
      'logistics': 'from-orange-500 via-amber-500 to-yellow-500',
      'trends': 'from-green-500 via-emerald-500 to-teal-500',
      'case-studies': 'from-indigo-500 via-purple-500 to-pink-500',
    };
    return gradients[category] || 'from-gray-500 via-gray-600 to-gray-700';
  };

  const categoryGradient = getCategoryGradient(article.category);
  
  // Format reading time for screen readers
  const readingTimeLabel = locale === "ar" 
    ? `${article.readingTime} دقائق للقراءة`
    : `${article.readingTime} minutes read`;
  
  // Category label for screen readers
  const categoryLabel = t(`blog.categories.${article.category}`);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const link = e.currentTarget.querySelector('a');
      if (link) {
        link.click();
      }
    }
  }, []);

  return (
    <article 
      aria-labelledby={`article-title-${article.id}`}
      onKeyDown={handleKeyDown}
    >
      <Link 
        href={`/${locale}/blog/${article.slug}`}
        aria-label={`${t("blog.readArticle")}: ${article.title}. ${categoryLabel}. ${readingTimeLabel}`}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-lg block"
      >
        <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-2 cursor-pointer group bg-white dark:bg-card border-2 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2">
          {/* Thumbnail with 16:9 aspect ratio */}
          <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br" aria-hidden="true">
            {article.thumbnailUrl && !imageError ? (
              <Image
                src={article.thumbnailUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              // Gradient fallback
              <div className={`w-full h-full bg-gradient-to-br ${categoryGradient} flex items-center justify-center`}>
                <div className="text-white text-center p-6">
                  <div className="text-4xl font-bold mb-2">
                    {article.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm opacity-90">
                    {categoryLabel}
                  </div>
                </div>
              </div>
            )}
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* Category Badge */}
              <Badge 
                variant="secondary"
                className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50"
                aria-label={`${t("blog.category")}: ${categoryLabel}`}
              >
                {categoryLabel}
              </Badge>

              {/* Reading Time */}
              <div 
                className="flex items-center gap-1 text-xs text-muted-foreground"
                aria-label={readingTimeLabel}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span aria-hidden="true">{article.readingTime} {t("blog.minRead")}</span>
              </div>
            </div>

            <CardTitle 
              id={`article-title-${article.id}`}
              className="text-xl line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
            >
              {article.title}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CardDescription className="line-clamp-3 text-base text-muted-foreground mb-4">
              {article.summary}
            </CardDescription>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div 
                className="flex flex-wrap gap-2 mb-4"
                role="list"
                aria-label={t("blog.tags")}
              >
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    role="listitem"
                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Read More Link - Visual only */}
            <div 
              className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" 
              aria-hidden="true"
            >
              <span>{t("blog.readMore")}</span>
              <Arrow className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </article>
  );
}
