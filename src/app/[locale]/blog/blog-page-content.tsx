"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { 
  BlogHero, 
  CategoryFilter, 
  BlogSearch, 
  ArticleGrid, 
  BlogPagination 
} from "@/components/blog";
import { GenerateArticleButton } from "@/components/blog/admin";
import { LandingAd } from "@/components/ads";
import { Breadcrumb } from "@/components/seo";
import type { ArticleListItem, ArticleCategory, CategoryWithCount } from "@/lib/blog/types";

interface BlogPageContentProps {
  locale: string;
  initialPage: number;
  initialCategory?: string;
  initialSearch?: string;
}

export function BlogPageContent({ 
  locale, 
  initialPage,
  initialCategory,
  initialSearch 
}: BlogPageContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(
    initialCategory as ArticleCategory || null
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");

  // Breadcrumb
  const breadcrumbItems = [
    { label: t('blog.title') }
  ];

  // Update URL when filters change
  const updateURL = useCallback((page: number, category: ArticleCategory | null, search: string) => {
    const params = new URLSearchParams();
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    if (category) {
      params.set('category', category);
    }
    
    if (search) {
      params.set('search', search);
    }

    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(newURL, { scroll: false });
  }, [pathname, router]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('pageSize', '12');
      
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/blog/articles?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data.articles);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedCategory, searchQuery]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/blog/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  // Handle article generated - refresh the list
  const handleArticleGenerated = useCallback(() => {
    // Refresh articles list to show the new article
    fetchArticles();
    // Also refresh categories in case a new category was added
    fetchCategories();
  }, [fetchArticles, fetchCategories]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch articles when filters change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Handle category change
  const handleCategoryChange = (category: ArticleCategory | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateURL(1, category, searchQuery);
  };

  // Handle search change
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
    updateURL(1, selectedCategory, search);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(page, selectedCategory, searchQuery);
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} locale={locale} />

        {/* Hero Section */}
        <BlogHero />

        {/* Admin Generate Article Button */}
        <div className="flex justify-end my-4">
          <GenerateArticleButton onArticleGenerated={handleArticleGenerated} />
        </div>

        {/* Ad Banner Below Hero */}
        <div className="my-8">
          <LandingAd locale={locale} />
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <BlogSearch 
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Articles Grid */}
        <ArticleGrid 
          articles={articles}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12">
            <BlogPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
