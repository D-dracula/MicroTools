/**
 * Blog Utilities for Admin Dashboard
 * 
 * Pure functions for article filtering and validation.
 * These functions are used by the admin blog API and can be tested independently.
 * 
 * Requirements: 3.1, 3.5, 3.6
 */

import type { ArticleCategory } from '@/lib/blog/types';
import { ARTICLE_CATEGORIES, isArticleCategory } from '@/lib/blog/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Admin article list item for display
 */
export interface AdminArticleListItem {
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

/**
 * Filter criteria for articles
 */
export interface ArticleFilterCriteria {
  status?: 'all' | 'published' | 'draft';
  category?: ArticleCategory | 'all';
  search?: string;
}

/**
 * Required fields for article display (Property 4)
 */
export const REQUIRED_ARTICLE_FIELDS = [
  'id',
  'title',
  'isPublished', // status
  'createdAt',   // date
  'category',
] as const;

export type RequiredArticleField = typeof REQUIRED_ARTICLE_FIELDS[number];

// ============================================================================
// Property 4: Article List Display Completeness
// ============================================================================

/**
 * Check if an article has all required fields for display
 * 
 * Property 4: Article List Display Completeness
 * For any list of blog articles, the Blog Manager SHALL display all required 
 * fields (title, status, date, category) for each article in the list.
 * 
 * @param article - Article to validate
 * @returns Object with isComplete flag and missing fields
 * 
 * Validates: Requirements 3.1
 */
export function validateArticleDisplayFields(article: AdminArticleListItem): {
  isComplete: boolean;
  missingFields: string[];
  hasValidValues: boolean;
  invalidFields: string[];
} {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  // Check required fields exist
  if (!article.id || typeof article.id !== 'string') {
    missingFields.push('id');
  }
  
  if (!article.title || typeof article.title !== 'string') {
    missingFields.push('title');
  } else if (article.title.trim().length === 0) {
    invalidFields.push('title (empty)');
  }

  if (typeof article.isPublished !== 'boolean') {
    missingFields.push('isPublished');
  }

  if (!article.createdAt || typeof article.createdAt !== 'string') {
    missingFields.push('createdAt');
  } else {
    // Validate date format
    const date = new Date(article.createdAt);
    if (isNaN(date.getTime())) {
      invalidFields.push('createdAt (invalid date)');
    }
  }

  if (!article.category || typeof article.category !== 'string') {
    missingFields.push('category');
  } else if (!isArticleCategory(article.category)) {
    invalidFields.push(`category (invalid: ${article.category})`);
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    hasValidValues: invalidFields.length === 0,
    invalidFields,
  };
}

/**
 * Validate all articles in a list have required display fields
 * 
 * @param articles - Array of articles to validate
 * @returns Validation result with details
 */
export function validateArticleListCompleteness(articles: AdminArticleListItem[]): {
  allComplete: boolean;
  allValid: boolean;
  incompleteArticles: Array<{ id: string; missingFields: string[] }>;
  invalidArticles: Array<{ id: string; invalidFields: string[] }>;
} {
  const incompleteArticles: Array<{ id: string; missingFields: string[] }> = [];
  const invalidArticles: Array<{ id: string; invalidFields: string[] }> = [];

  for (const article of articles) {
    const validation = validateArticleDisplayFields(article);
    
    if (!validation.isComplete) {
      incompleteArticles.push({
        id: article.id || 'unknown',
        missingFields: validation.missingFields,
      });
    }
    
    if (!validation.hasValidValues) {
      invalidArticles.push({
        id: article.id || 'unknown',
        invalidFields: validation.invalidFields,
      });
    }
  }

  return {
    allComplete: incompleteArticles.length === 0,
    allValid: invalidArticles.length === 0,
    incompleteArticles,
    invalidArticles,
  };
}

// ============================================================================
// Property 5: Article Filtering Correctness
// ============================================================================

/**
 * Filter articles by status
 * 
 * @param articles - Array of articles
 * @param status - Status filter ('all', 'published', 'draft')
 * @returns Filtered articles
 */
export function filterByStatus(
  articles: AdminArticleListItem[],
  status: 'all' | 'published' | 'draft'
): AdminArticleListItem[] {
  if (status === 'all') {
    return articles;
  }
  
  return articles.filter(article => {
    if (status === 'published') {
      return article.isPublished === true;
    }
    if (status === 'draft') {
      return article.isPublished === false;
    }
    return true;
  });
}

/**
 * Filter articles by category
 * 
 * @param articles - Array of articles
 * @param category - Category filter (ArticleCategory or 'all')
 * @returns Filtered articles
 */
export function filterByCategory(
  articles: AdminArticleListItem[],
  category: ArticleCategory | 'all'
): AdminArticleListItem[] {
  if (category === 'all') {
    return articles;
  }
  
  return articles.filter(article => article.category === category);
}

/**
 * Filter articles by search query (case-insensitive)
 * Searches in title and summary
 * 
 * @param articles - Array of articles
 * @param search - Search query
 * @returns Filtered articles
 */
export function filterBySearch(
  articles: AdminArticleListItem[],
  search: string
): AdminArticleListItem[] {
  const trimmedSearch = search.trim().toLowerCase();
  
  if (!trimmedSearch) {
    return articles;
  }
  
  return articles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(trimmedSearch);
    const summaryMatch = article.summary.toLowerCase().includes(trimmedSearch);
    return titleMatch || summaryMatch;
  });
}

/**
 * Apply all filter criteria to articles
 * 
 * Property 5: Article Filtering Correctness
 * For any filter criteria (status, category) and search query, the Blog Manager 
 * SHALL return only articles that match ALL specified criteria.
 * 
 * @param articles - Array of articles
 * @param criteria - Filter criteria
 * @returns Filtered articles matching ALL criteria
 * 
 * Validates: Requirements 3.5, 3.6
 */
export function filterArticles(
  articles: AdminArticleListItem[],
  criteria: ArticleFilterCriteria
): AdminArticleListItem[] {
  let result = [...articles];

  // Apply status filter
  if (criteria.status && criteria.status !== 'all') {
    result = filterByStatus(result, criteria.status);
  }

  // Apply category filter
  if (criteria.category && criteria.category !== 'all') {
    result = filterByCategory(result, criteria.category);
  }

  // Apply search filter
  if (criteria.search && criteria.search.trim()) {
    result = filterBySearch(result, criteria.search);
  }

  return result;
}

/**
 * Check if an article matches all filter criteria
 * 
 * @param article - Article to check
 * @param criteria - Filter criteria
 * @returns True if article matches all criteria
 */
export function articleMatchesCriteria(
  article: AdminArticleListItem,
  criteria: ArticleFilterCriteria
): boolean {
  // Check status
  if (criteria.status && criteria.status !== 'all') {
    if (criteria.status === 'published' && !article.isPublished) {
      return false;
    }
    if (criteria.status === 'draft' && article.isPublished) {
      return false;
    }
  }

  // Check category
  if (criteria.category && criteria.category !== 'all') {
    if (article.category !== criteria.category) {
      return false;
    }
  }

  // Check search
  if (criteria.search && criteria.search.trim()) {
    const searchLower = criteria.search.trim().toLowerCase();
    const titleMatch = article.title.toLowerCase().includes(searchLower);
    const summaryMatch = article.summary.toLowerCase().includes(searchLower);
    if (!titleMatch && !summaryMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Verify that filtered results match criteria
 * 
 * @param filteredArticles - Articles after filtering
 * @param criteria - Filter criteria that was applied
 * @returns Verification result
 */
export function verifyFilterResults(
  filteredArticles: AdminArticleListItem[],
  criteria: ArticleFilterCriteria
): {
  allMatch: boolean;
  nonMatchingArticles: Array<{ id: string; reason: string }>;
} {
  const nonMatchingArticles: Array<{ id: string; reason: string }> = [];

  for (const article of filteredArticles) {
    // Check status
    if (criteria.status && criteria.status !== 'all') {
      if (criteria.status === 'published' && !article.isPublished) {
        nonMatchingArticles.push({
          id: article.id,
          reason: `Expected published, got draft`,
        });
        continue;
      }
      if (criteria.status === 'draft' && article.isPublished) {
        nonMatchingArticles.push({
          id: article.id,
          reason: `Expected draft, got published`,
        });
        continue;
      }
    }

    // Check category
    if (criteria.category && criteria.category !== 'all') {
      if (article.category !== criteria.category) {
        nonMatchingArticles.push({
          id: article.id,
          reason: `Expected category ${criteria.category}, got ${article.category}`,
        });
        continue;
      }
    }

    // Check search
    if (criteria.search && criteria.search.trim()) {
      const searchLower = criteria.search.trim().toLowerCase();
      const titleMatch = article.title.toLowerCase().includes(searchLower);
      const summaryMatch = article.summary.toLowerCase().includes(searchLower);
      if (!titleMatch && !summaryMatch) {
        nonMatchingArticles.push({
          id: article.id,
          reason: `Search "${criteria.search}" not found in title or summary`,
        });
      }
    }
  }

  return {
    allMatch: nonMatchingArticles.length === 0,
    nonMatchingArticles,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { ARTICLE_CATEGORIES, isArticleCategory };
