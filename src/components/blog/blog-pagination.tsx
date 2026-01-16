"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BlogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: BlogPaginationProps) {
  const t = useTranslations("blog");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Icon components based on RTL
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

  return (
    <nav 
      className="flex items-center justify-center gap-2 mt-8"
      aria-label={t("pagination")}
    >
      {/* First page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label={t("firstPage")}
        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
      >
        <FirstIcon className="h-4 w-4" />
      </Button>

      {/* Previous page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t("previousPage")}
        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
      >
        <PrevIcon className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              aria-label={`${t("page")} ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
              className={isActive 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30 min-w-[2.5rem]" 
                : "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 min-w-[2.5rem]"
              }
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      {/* Next page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t("nextPage")}
        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
      >
        <NextIcon className="h-4 w-4" />
      </Button>

      {/* Last page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label={t("lastPage")}
        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
      >
        <LastIcon className="h-4 w-4" />
      </Button>
    </nav>
  );
}
