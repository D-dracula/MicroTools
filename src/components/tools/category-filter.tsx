"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { categories, ToolCategory } from "@/lib/tools";

interface CategoryFilterProps {
  selectedCategory: ToolCategory | null;
  onCategoryChange: (category: ToolCategory | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className={selectedCategory === null 
          ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30" 
          : "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600"
        }
      >
        {t("common.all")}
      </Button>
      {categories.map((category) => (
        <Button
          key={category.key}
          variant={selectedCategory === category.key ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.key)}
          className={selectedCategory === category.key 
            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30" 
            : "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600"
          }
        >
          {t(category.labelKey)}
        </Button>
      ))}
    </div>
  );
}
