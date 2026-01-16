/**
 * TypeScript types and interfaces for the Blog Articles System
 * 
 * This file defines all data models, enums, and type definitions
 * used throughout the blog feature.
 */

// ============================================================================
// Article Category Enum
// ============================================================================

/**
 * Article category types
 * Matches the database constraint for articles.category
 */
export type ArticleCategory = 
  | 'marketing'
  | 'seller-tools'
  | 'logistics'
  | 'trends'
  | 'case-studies';

/**
 * All available article categories
 */
export const ARTICLE_CATEGORIES: readonly ArticleCategory[] = [
  'marketing',
  'seller-tools',
  'logistics',
  'trends',
  'case-studies',
] as const;

// ============================================================================
// Article Author Interface
// ============================================================================

/**
 * Article author information
 * Used for displaying author details in article pages
 * 
 * Requirements:
 * - 6.1: Author name display
 * - 6.2: Author avatar display (with default placeholder)
 * - 6.3: Author role/title display (optional)
 * - 6.4: Author bio display (optional)
 */
export interface ArticleAuthor {
  /** Author's display name */
  name: string;
  /** URL to author's avatar image */
  avatar?: string;
  /** Author's role or title */
  role?: string;
  /** Brief author biography */
  bio?: string;
}

// ============================================================================
// Article Source Interface
// ============================================================================

/**
 * Source citation from Exa search results
 * Stored in articles.sources JSONB field
 */
export interface ArticleSource {
  /** Full URL of the source */
  url: string;
  /** Title of the source article/page */
  title: string;
  /** Domain name extracted from URL (e.g., "example.com") */
  domain: string;
}

// ============================================================================
// Article Data Models
// ============================================================================

/**
 * Complete article data model
 * Matches the database schema for public.articles table
 */
export interface Article {
  /** Unique identifier */
  id: string;
  /** URL-friendly slug (lowercase, alphanumeric with hyphens) */
  slug: string;
  /** Article title (max 500 characters) */
  title: string;
  /** Brief summary/excerpt */
  summary: string;
  /** Full article content (markdown or HTML) */
  content: string;
  /** Article category */
  category: ArticleCategory;
  /** Array of tags for filtering */
  tags: string[];
  /** URL to thumbnail image (16:9 aspect ratio) */
  thumbnailUrl: string | null;
  /** Estimated reading time in minutes */
  readingTime: number;
  /** Array of source citations */
  sources: ArticleSource[];
  /** SEO meta title (max 70 characters) */
  metaTitle: string;
  /** SEO meta description (max 160 characters) */
  metaDescription: string;
  /** Whether the article is published and visible */
  isPublished: boolean;
  /** Article author information */
  author?: ArticleAuthor;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Article list item for cards and previews
 * Lighter version without full content
 */
export interface ArticleListItem {
  /** Unique identifier */
  id: string;
  /** URL-friendly slug */
  slug: string;
  /** Article title */
  title: string;
  /** Brief summary */
  summary: string;
  /** Article category */
  category: ArticleCategory;
  /** Array of tags */
  tags: string[];
  /** URL to thumbnail image */
  thumbnailUrl: string | null;
  /** Estimated reading time in minutes */
  readingTime: number;
  /** Creation timestamp */
  createdAt: Date;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Paginated articles response
 */
export interface PaginatedArticles {
  /** Array of articles for current page */
  articles: ArticleListItem[];
  /** Total number of articles matching the query */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of articles per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Article list query options
 */
export interface ArticleListOptions {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of articles per page */
  pageSize?: number;
  /** Filter by category */
  category?: ArticleCategory;
  /** Filter by tag */
  tag?: string;
  /** Search query for title/content */
  search?: string;
  /** Only return published articles */
  publishedOnly?: boolean;
}

// ============================================================================
// Article Generation Types
// ============================================================================

/**
 * Article generation request
 */
export interface GenerateArticleRequest {
  /** Optional: specific topic to generate (let AI choose if not provided) */
  topic?: string;
  /** Optional: target category for the article */
  category?: ArticleCategory;
}

/**
 * Generation progress status
 */
export type GenerationStatus = 
  | 'searching'           // Searching Exa for topics
  | 'selecting'           // Selecting best topic
  | 'generating'          // Generating article content
  | 'creating-thumbnail'  // Creating thumbnail
  | 'saving'              // Saving to database
  | 'complete'            // Done
  | 'error';              // Failed

/**
 * Generation progress update
 */
export interface GenerationProgress {
  /** Current status */
  status: GenerationStatus;
  /** Progress message */
  message: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Exa search result
 */
export interface ExaSearchResult {
  /** Article/page title */
  title: string;
  /** Full URL */
  url: string;
  /** Publication date */
  publishedDate: string;
  /** Relevance score */
  score: number;
  /** Excerpt or full text */
  text: string;
}

/**
 * Unified search result from multiple sources (NewsAPI + Exa)
 */
export interface UnifiedSearchResult {
  /** Article/page title */
  title: string;
  /** Full URL */
  url: string;
  /** Publication date */
  publishedDate: string;
  /** Combined relevance + recency score */
  score: number;
  /** Excerpt or full text */
  text: string;
  /** Source of the result */
  source: 'exa' | 'newsapi' | 'fallback';
  /** Name of the news source (for NewsAPI) */
  sourceName?: string;
  /** Author name */
  author?: string;
  /** Image URL */
  imageUrl?: string;
}

/**
 * Article generation log entry
 * Matches public.article_generation_log table
 */
export interface ArticleGenerationLog {
  /** Unique identifier */
  id: string;
  /** Admin user ID who initiated generation */
  adminId: string;
  /** Generation timestamp */
  generatedAt: Date;
  /** Topic that was generated */
  topic: string | null;
  /** Whether generation succeeded */
  success: boolean;
  /** Error message if failed */
  errorMessage: string | null;
}

// ============================================================================
// Category Metadata
// ============================================================================

/**
 * Category with article count
 */
export interface CategoryWithCount {
  /** Category identifier */
  category: ArticleCategory;
  /** Number of published articles in this category */
  count: number;
}

// ============================================================================
// Database Row Types (snake_case from Supabase)
// ============================================================================

/**
 * Article row from database (snake_case)
 * Used for mapping between database and application types
 */
export interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  thumbnail_url: string | null;
  reading_time: number;
  sources: unknown; // JSONB
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Article generation log row from database (snake_case)
 */
export interface ArticleGenerationLogRow {
  id: string;
  admin_id: string;
  generated_at: string;
  topic: string | null;
  success: boolean;
  error_message: string | null;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a string is a valid ArticleCategory
 */
export function isArticleCategory(value: string): value is ArticleCategory {
  return ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}

/**
 * Type guard to check if a value is a valid ArticleSource
 */
export function isArticleSource(value: unknown): value is ArticleSource {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const source = value as Record<string, unknown>;
  return (
    typeof source.url === 'string' &&
    typeof source.title === 'string' &&
    typeof source.domain === 'string'
  );
}

/**
 * Type guard to check if an array contains valid ArticleSources
 */
export function isArticleSourceArray(value: unknown): value is ArticleSource[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(isArticleSource);
}

// ============================================================================
// Mapper Functions
// ============================================================================

/**
 * Map database row to Article model
 */
export function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category as ArticleCategory,
    tags: row.tags,
    thumbnailUrl: row.thumbnail_url,
    readingTime: row.reading_time,
    sources: isArticleSourceArray(row.sources) ? row.sources : [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isPublished: row.is_published,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map database row to ArticleListItem model
 */
export function mapArticleListItemRow(row: ArticleRow): ArticleListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category as ArticleCategory,
    tags: row.tags,
    thumbnailUrl: row.thumbnail_url,
    readingTime: row.reading_time,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Map Article to ArticleListItem
 */
export function articleToListItem(article: Article): ArticleListItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    category: article.category,
    tags: article.tags,
    thumbnailUrl: article.thumbnailUrl,
    readingTime: article.readingTime,
    createdAt: article.createdAt,
  };
}

/**
 * Map database row to ArticleGenerationLog model
 */
export function mapGenerationLogRow(row: ArticleGenerationLogRow): ArticleGenerationLog {
  return {
    id: row.id,
    adminId: row.admin_id,
    generatedAt: new Date(row.generated_at),
    topic: row.topic,
    success: row.success,
    errorMessage: row.error_message,
  };
}
