"use client";

import { Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <div className="relative w-full max-w-md" role="search">
      <label htmlFor="tool-search" className="sr-only">
        {t("searchPlaceholder")}
      </label>
      <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-400" aria-hidden="true" />
      <Input
        id="tool-search"
        type="search"
        placeholder={t("searchPlaceholder")}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="ps-12 h-12 text-base rounded-xl border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 bg-white dark:bg-card shadow-lg shadow-purple-500/5 placeholder:text-muted-foreground"
        aria-label={locale === "ar" ? "البحث عن أداة" : "Search for a tool"}
      />
    </div>
  );
}
