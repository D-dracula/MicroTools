"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchBar } from "./search-bar";
import { CategoryFilter } from "./category-filter";
import { ToolCard } from "./tool-card";
import { tools, ToolCategory } from "@/lib/tools";

export function ToolsGrid() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // Filter by category
      if (selectedCategory && tool.category !== selectedCategory) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = t(tool.titleKey).toLowerCase();
        const description = t(tool.descriptionKey).toLowerCase();
        const category = t(tool.categoryKey).toLowerCase();
        const slug = tool.slug.toLowerCase();

        return (
          title.includes(query) ||
          description.includes(query) ||
          category.includes(query) ||
          slug.includes(query)
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory, t]);

  return (
    <div className="flex flex-col gap-8">
      {/* Search and Filter Section */}
      <div className="flex flex-col items-center gap-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <ToolCard
            key={tool.slug}
            slug={tool.slug}
            icon={tool.icon}
            titleKey={tool.titleKey}
            descriptionKey={tool.descriptionKey}
            categoryKey={tool.categoryKey}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t("common.noResults") || "No tools found"}
        </div>
      )}
    </div>
  );
}
