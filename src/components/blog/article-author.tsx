/**
 * Article Author Component
 *
 * Displays author information for blog articles including avatar,
 * name, role, and optional bio. Falls back to PineCalc organization
 * information when no author is provided.
 *
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import Image from "next/image";
import { User } from "lucide-react";
import type { ArticleAuthor as ArticleAuthorType } from "@/lib/blog/types";

interface ArticleAuthorProps {
  /** Author information - falls back to PineCalc if not provided */
  author?: ArticleAuthorType;
  /** Article publication date */
  publishedAt: Date;
  /** Current locale for RTL/LTR and translations */
  locale: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default author information when no author is provided
 * Uses PineCalc as the fallback organization
 *
 * @requirements 6.7
 */
function getDefaultAuthor(locale: string): ArticleAuthorType {
  return {
    name: "PineCalc",
    avatar: "/logo.svg",
    role: locale === "ar" ? "فريق باين كالك" : "PineCalc Team",
  };
}

/**
 * Format date based on locale
 */
function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Get localized labels
 */
function getLabels(locale: string) {
  return {
    writtenBy: locale === "ar" ? "كتبه" : "Written by",
    publishedOn: locale === "ar" ? "نُشر في" : "Published on",
    authorInfo: locale === "ar" ? "معلومات الكاتب" : "Author information",
  };
}

/**
 * ArticleAuthor Component
 *
 * Renders author information with avatar, name, role, and optional bio.
 * Supports RTL layout for Arabic locale and provides proper accessibility.
 *
 * @example
 * ```tsx
 * <ArticleAuthor
 *   author={{ name: "John Doe", role: "Content Writer" }}
 *   publishedAt={new Date()}
 *   locale="en"
 * />
 * ```
 *
 * @example Without author (falls back to PineCalc)
 * ```tsx
 * <ArticleAuthor
 *   publishedAt={new Date()}
 *   locale="ar"
 * />
 * ```
 */
export function ArticleAuthor({
  author,
  publishedAt,
  locale,
  className = "",
}: ArticleAuthorProps) {
  // Use provided author or fall back to PineCalc
  const displayAuthor = author?.name ? author : getDefaultAuthor(locale);
  const labels = getLabels(locale);

  return (
    <div
      className={`
        article-author
        flex items-center gap-4
        py-4
        ${className}
      `.trim()}
      role="region"
      aria-label={labels.authorInfo}
    >
      {/* Author Avatar */}
      <div className="flex-shrink-0">
        {displayAuthor.avatar ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 bg-muted">
            <Image
              src={displayAuthor.avatar}
              alt={displayAuthor.name}
              fill
              className="object-cover"
              sizes="48px"
              onError={(e) => {
                // Hide image on error, fallback icon will show
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* Fallback icon shown when image fails */}
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <User
                className="w-6 h-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          /* Placeholder when no avatar URL provided */
          <div
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20"
            aria-hidden="true"
          >
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Author Info */}
      <div className="flex-1 min-w-0">
        {/* Author Name and Role */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          {/* Name */}
          <span className="font-semibold text-foreground truncate">
            {displayAuthor.name}
          </span>

          {/* Role/Title - Requirements: 6.3 */}
          {displayAuthor.role && (
            <>
              <span
                className="hidden sm:inline text-muted-foreground"
                aria-hidden="true"
              >
                •
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {displayAuthor.role}
              </span>
            </>
          )}
        </div>

        {/* Publication Date */}
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
          <span className="sr-only">{labels.publishedOn}</span>
          <time dateTime={publishedAt.toISOString()}>
            {formatDate(publishedAt, locale)}
          </time>
        </div>

        {/* Bio - Requirements: 6.4 (optional) */}
        {displayAuthor.bio && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {displayAuthor.bio}
          </p>
        )}
      </div>
    </div>
  );
}

export type { ArticleAuthorProps };
