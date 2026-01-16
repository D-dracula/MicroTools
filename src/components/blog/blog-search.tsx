"use client";

import { Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface BlogSearchProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function BlogSearch({ value, onChange, debounceMs = 300 }: BlogSearchProps) {
  const t = useTranslations("blog");
  const locale = useLocale();
  const [localValue, setLocalValue] = useState(value);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative w-full max-w-md" role="search">
      <label htmlFor="blog-search" className="sr-only">
        {t("searchPlaceholder")}
      </label>
      <Search 
        className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-400" 
        aria-hidden="true" 
      />
      <Input
        id="blog-search"
        type="search"
        placeholder={t("searchPlaceholder")}
        value={localValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value)}
        className="ps-12 h-12 text-base rounded-xl border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-400 bg-white dark:bg-card shadow-lg shadow-purple-500/5 placeholder:text-muted-foreground"
        aria-label={locale === "ar" ? "البحث في المقالات" : "Search articles"}
      />
    </div>
  );
}
