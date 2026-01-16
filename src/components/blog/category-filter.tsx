"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ArticleCategory, CategoryWithCount } from "@/lib/blog/types";

interface CategoryFilterProps {
  categories: CategoryWithCount[];
  selectedCategory: ArticleCategory | null;
  onCategoryChange: (category: ArticleCategory | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const t = useTranslations();

  // Handle keyboard navigation within the filter group
  const handleKeyDown = (
    e: React.KeyboardEvent,
    category: ArticleCategory | null,
    index: number
  ) => {
    const buttons = document.querySelectorAll('[role="radio"]');
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (index + 1) % buttons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (index - 1 + buttons.length) % buttons.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = buttons.length - 1;
        break;
      default:
        return;
    }

    const nextButton = buttons[nextIndex] as HTMLButtonElement;
    nextButton?.focus();
  };

  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <nav 
      aria-label={t("blog.filterByCategory")}
      className="flex flex-wrap gap-2 justify-center"
    >
      <div 
        role="radiogroup" 
        aria-label={t("blog.categoryFilter")}
        className="flex flex-wrap gap-2 justify-center"
      >
        {/* All button */}
        <Button
          role="radio"
          aria-checked={selectedCategory === null}
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          onKeyDown={(e) => handleKeyDown(e, null, 0)}
          tabIndex={selectedCategory === null ? 0 : -1}
          className={selectedCategory === null 
            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2" 
            : "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          }
        >
          {t("common.all")}
          <span className="ms-2 text-xs opacity-75" aria-hidden="true">
            ({totalCount})
          </span>
          <span className="sr-only">
            {t("blog.articlesCount", { count: totalCount })}
          </span>
        </Button>

        {/* Category buttons */}
        {categories.map((category, index) => (
          <Button
            key={category.category}
            role="radio"
            aria-checked={selectedCategory === category.category}
            variant={selectedCategory === category.category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.category)}
            onKeyDown={(e) => handleKeyDown(e, category.category, index + 1)}
            tabIndex={selectedCategory === category.category ? 0 : -1}
            className={selectedCategory === category.category 
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2" 
              : "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            }
          >
            {t(`blog.categories.${category.category}`)}
            <span className="ms-2 text-xs opacity-75" aria-hidden="true">
              ({category.count})
            </span>
            <span className="sr-only">
              {t("blog.articlesCount", { count: category.count })}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
