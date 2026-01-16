"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleSource } from "@/lib/blog/types";

/**
 * ArticleSources Component
 * 
 * Displays article sources with domain names for credibility.
 * Links open in new tab for external navigation.
 * 
 * Requirements: 6.2, 6.3, 6.4
 */

interface ArticleSourcesProps {
  sources: ArticleSource[];
}

export function ArticleSources({ sources }: ArticleSourcesProps) {
  const t = useTranslations("blog");

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-[720px] mx-auto border-2">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2" id="sources-section-title">
          <ExternalLink className="w-5 h-5" aria-hidden="true" />
          {t("sources")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-labelledby="sources-section-title">
          <ul className="space-y-3" role="list">
            {sources.map((source, index) => (
              <li key={index} className="group">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200
                    hover:bg-muted/50 hover:shadow-sm border border-transparent hover:border-primary/20
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`${t("source")} ${index + 1}: ${source.title} - ${source.domain}. ${t("opensInNewTab")}`}
                >
                  <span 
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary 
                      flex items-center justify-center text-sm font-semibold mt-0.5"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {source.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      <span>{source.domain}</span>
                      <span className="sr-only">{t("opensInNewTab")}</span>
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
}
