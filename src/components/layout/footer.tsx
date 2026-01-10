"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Heart } from "lucide-react";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-muted/30" role="contentinfo">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo and Description */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity group"
              aria-label={t("common.siteName")}
            >
              <Image
                src="/logo.svg"
                alt={t("common.siteName")}
                width={32}
                height={32}
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span>{t("common.siteName")}</span>
            </Link>
            <p className="text-sm text-muted-foreground text-center md:text-start max-w-xs">
              {t("common.siteDescription")}
            </p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground md:items-end">
            <p className="flex items-center gap-1">
              {t("footer.madeWith")} <Heart className="h-4 w-4 text-red-500 fill-red-500" aria-label={locale === "ar" ? "حب" : "love"} />
            </p>
            <p>
              © {currentYear} {t("common.siteName")}
            </p>
            <p className="text-xs">{t("footer.copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
