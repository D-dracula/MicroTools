"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { ThemeSwitcher } from "./theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-purple-200/50 dark:border-purple-500/20 bg-white/80 dark:bg-background/80 backdrop-blur-xl"
      role="banner"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Site Name */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 font-bold text-xl hover:opacity-80 transition-opacity group"
          aria-label={t("siteName")}
        >
          <Image
            src="/logo.svg"
            alt={t("siteName")}
            width={48}
            height={48}
            className="drop-shadow-lg group-hover:drop-shadow-xl transition-all"
          />
          <span className="text-gradient font-extrabold">
            {t("siteName")}
          </span>
        </Link>

        {/* Navigation and Actions */}
        <nav className="flex items-center gap-1" aria-label={locale === "ar" ? "إعدادات الموقع" : "Site settings"}>
          <LocaleSwitcher />
          <ThemeSwitcher />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
