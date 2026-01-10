"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LucideIcon, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ToolCardProps {
  slug: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  categoryKey: string;
}

export function ToolCard({
  slug,
  icon: Icon,
  titleKey,
  descriptionKey,
  categoryKey,
}: ToolCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <article>
      <Link 
        href={`/${locale}/tools/${slug}`}
        aria-label={`${t(titleKey)} - ${t(descriptionKey)}`}
      >
        <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-2 cursor-pointer group bg-white dark:bg-card border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                {t(categoryKey)}
              </span>
            </div>
            <CardTitle className="text-xl mt-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {t(titleKey)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2 text-base text-muted-foreground">
              {t(descriptionKey)}
            </CardDescription>
            <div className="flex items-center gap-2 mt-5 text-purple-600 dark:text-purple-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true">
              <span>{t("common.tryNow")}</span>
              <Arrow className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </article>
  );
}
