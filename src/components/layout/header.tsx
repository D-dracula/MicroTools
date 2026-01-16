"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Wrench, BookOpen, Shield } from "lucide-react";

import { ThemeSwitcher } from "./theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { useAdminAuth } from "@/lib/admin/use-admin-auth";

export function Header() {
  const t = useTranslations("common");
  const tBlog = useTranslations("blog");
  const tAdmin = useTranslations("admin");
  const locale = useLocale();
  const { isAdmin } = useAdminAuth();

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
          <span className="text-gradient font-extrabold hidden sm:inline">
            {t("siteName")}
          </span>
        </Link>

        {/* Main Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {/* Tools Link */}
          <Link
            href={`/${locale}/tools`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">{t("tools")}</span>
          </Link>

          {/* Blog Link */}
          <Link
            href={`/${locale}/blog`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{tBlog("title")}</span>
          </Link>

          {/* Admin Link - Only visible for admins */}
          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{tAdmin("title")}</span>
            </Link>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* Settings */}
          <LocaleSwitcher />
          <ThemeSwitcher />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
