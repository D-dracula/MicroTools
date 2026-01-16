"use client";

/**
 * Blog Manager Component
 * 
 * Admin component for managing blog articles with:
 * - Article list with all required fields
 * - Filter controls (status, category)
 * - Search input
 * - Generate, edit, delete actions
 * - Progress indicator during operations
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Sparkles,
  MoreHorizontal,
  Calendar,
  Clock,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArticleCategory } from "@/lib/blog/types";
import { ARTICLE_CATEGORIES } from "@/lib/blog/types";

// ============================================================================
// Types
// ============================================================================

interface AdminArticleListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  tags: string[];
  thumbnailUrl: string | null;
  readingTime: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogManagerProps {
  locale: string;
}

type StatusFilter = "all" | "published" | "draft";

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "إدارة المقالات" : "Blog Manager",
    subtitle: isRTL ? "إدارة وتنظيم مقالات المدونة" : "Manage and organize blog articles",
    
    // Filters
    filters: {
      status: isRTL ? "الحالة" : "Status",
      category: isRTL ? "التصنيف" : "Category",
      search: isRTL ? "بحث..." : "Search...",
      all: isRTL ? "الكل" : "All",
      published: isRTL ? "منشور" : "Published",
      draft: isRTL ? "مسودة" : "Draft",
    },
    
    // Categories
    categories: {
      marketing: isRTL ? "التسويق" : "Marketing",
      "seller-tools": isRTL ? "أدوات البائع" : "Seller Tools",
      logistics: isRTL ? "اللوجستيات" : "Logistics",
      trends: isRTL ? "الاتجاهات" : "Trends",
      "case-studies": isRTL ? "دراسات الحالة" : "Case Studies",
    },
    
    // Actions
    actions: {
      generate: isRTL ? "إنشاء مقال" : "Generate Article",
      view: isRTL ? "عرض" : "View",
      publish: isRTL ? "نشر" : "Publish",
      unpublish: isRTL ? "إلغاء النشر" : "Unpublish",
      delete: isRTL ? "حذف" : "Delete",
      refresh: isRTL ? "تحديث" : "Refresh",
    },
    
    // Table headers
    table: {
      article: isRTL ? "المقال" : "Article",
      category: isRTL ? "التصنيف" : "Category",
      status: isRTL ? "الحالة" : "Status",
      date: isRTL ? "التاريخ" : "Date",
      actions: isRTL ? "الإجراءات" : "Actions",
    },
    
    // States
    states: {
      loading: isRTL ? "جاري التحميل..." : "Loading...",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      noArticles: isRTL ? "لا توجد مقالات" : "No articles found",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
    },
    
    // Confirmations
    confirm: {
      delete: isRTL ? "هل أنت متأكد من حذف هذا المقال؟" : "Are you sure you want to delete this article?",
      deleteTitle: isRTL ? "تأكيد الحذف" : "Confirm Delete",
    },
    
    // Stats
    stats: {
      total: isRTL ? "إجمالي المقالات" : "Total Articles",
      published: isRTL ? "منشورة" : "Published",
      draft: isRTL ? "مسودات" : "Drafts",
    },
    
    // Misc
    readingTime: isRTL ? "دقيقة قراءة" : "min read",
    page: isRTL ? "صفحة" : "Page",
    of: isRTL ? "من" : "of",
    previous: isRTL ? "السابق" : "Previous",
    next: isRTL ? "التالي" : "Next",
  };
}

// ============================================================================
// Component
// ============================================================================

export function BlogManager({ locale }: BlogManagerProps) {
  const router = useRouter();
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // State
  const [articles, setArticles] = useState<AdminArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        status: statusFilter,
      });

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/blog?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to fetch articles");
      }

      setArticles(result.data.articles);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Pending delete state for confirmation
  const [pendingDelete, setPendingDelete] = useState<AdminArticleListItem | null>(null);

  // Handle delete - optimized for INP (no blocking confirm)
  const handleDelete = (article: AdminArticleListItem) => {
    // Show confirmation state instead of blocking confirm()
    setPendingDelete(article);
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (!pendingDelete) return;
    
    const article = pendingDelete;
    setPendingDelete(null);
    setIsDeleting(article.id);

    // Defer heavy work to avoid blocking main thread
    requestAnimationFrame(() => {
      (async () => {
        try {
          // Optimistic update - remove from UI immediately
          setArticles((prev) => prev.filter((a) => a.id !== article.id));
          setTotal((prev) => prev - 1);

          const response = await fetch("/api/admin/blog", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: article.id }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            // Revert on error
            fetchArticles();
            throw new Error(result.error?.message || "Failed to delete article");
          }
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to delete article");
        } finally {
          setIsDeleting(null);
        }
      })();
    });
  };

  // Cancel delete
  const cancelDelete = () => {
    setPendingDelete(null);
  };

  // Handle publish/unpublish
  const handleTogglePublish = async (article: AdminArticleListItem) => {
    setIsUpdating(article.id);

    try {
      const response = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          isPublished: !article.isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to update article");
      }

      // Update local state
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, isPublished: !a.isPublished } : a
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update article");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle view article
  const handleView = (article: AdminArticleListItem) => {
    window.open(`/${locale}/blog/${article.slug}`, "_blank");
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get category label
  const getCategoryLabel = (category: ArticleCategory) => {
    return t.categories[category] || category;
  };

  // Get category color
  const getCategoryColor = (category: ArticleCategory) => {
    const colors: Record<ArticleCategory, string> = {
      marketing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      "seller-tools": "bg-green-500/10 text-green-600 dark:text-green-400",
      logistics: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      trends: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      "case-studies": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    };
    return colors[category] || "bg-gray-500/10 text-gray-600";
  };

  // Calculate stats
  const publishedCount = articles.filter((a) => a.isPublished).length;
  const draftCount = articles.filter((a) => !a.isPublished).length;

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchArticles}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.actions.refresh}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/admin/blog/new`)}
          >
            <FileText className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {isRTL ? "مقال يدوي" : "Manual"}
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/${locale}/admin/blog/generate`)}
          >
            <Sparkles className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.actions.generate}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">{t.stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
            <p className="text-xs text-muted-foreground">{t.stats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-amber-600">{draftCount}</p>
            <p className="text-xs text-muted-foreground">{t.stats.draft}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                placeholder={t.filters.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.filters.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filters.all}</SelectItem>
                <SelectItem value="published">{t.filters.published}</SelectItem>
                <SelectItem value="draft">{t.filters.draft}</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.filters.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filters.all}</SelectItem>
                {ARTICLE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.table.article}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t.states.loading}</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{t.states.error}</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchArticles} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.states.retry}
              </Button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">{t.states.noArticles}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Thumbnail */}
                  {article.thumbnailUrl && (
                    <div className="hidden sm:block w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={article.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{article.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {article.summary}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <Badge
                        variant={article.isPublished ? "default" : "secondary"}
                        className="flex-shrink-0"
                      >
                        {article.isPublished ? t.filters.published : t.filters.draft}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className={getCategoryColor(article.category)}>
                        {getCategoryLabel(article.category)}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readingTime} {t.readingTime}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(article)}
                      title={t.actions.view}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePublish(article)}
                      disabled={isUpdating === article.id}
                      title={article.isPublished ? t.actions.unpublish : t.actions.publish}
                    >
                      {isUpdating === article.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : article.isPublished ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(article)}
                      disabled={isDeleting === article.id}
                      className="text-destructive hover:text-destructive"
                      title={t.actions.delete}
                    >
                      {isDeleting === article.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t.page} {page} {t.of} {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t.next}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">{t.confirm.deleteTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t.confirm.delete}</p>
              <p className="font-medium truncate">{pendingDelete.title}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cancelDelete}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  {t.actions.delete}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BlogManager;
