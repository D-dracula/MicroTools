/**
 * Article Service - CRUD operations for blog articles
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 4.1
 * 
 * This service handles all database operations for articles using Supabase.
 * It follows the existing Micro-Tools patterns for database access.
 */

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client';
import type {
  Article,
  ArticleListItem,
  ArticleListOptions,
  PaginatedArticles,
  CategoryWithCount,
  ArticleRow,
  ArticleSource,
} from './types';
import {
  mapArticleRow,
  mapArticleListItemRow,
  isArticleCategory,
} from './types';
import { generateSlug, generateUniqueSlugAsync } from './slug-generator';
import { calculateReadingTime } from './reading-time';
import { extractDomain } from './domain-extractor';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// ============================================================================
// Article Retrieval
// ============================================================================

/**
 * Get paginated list of articles with optional filtering
 * 
 * @param options - Query options (pagination, filters, search)
 * @returns Paginated articles response
 * 
 * Requirements: 1.2, 1.4, 1.5
 */
export async function getArticles(
  options: ArticleListOptions = {}
): Promise<PaginatedArticles> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    category,
    tag,
    search,
    publishedOnly = true,
  } = options;

  // Validate and sanitize inputs
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  // Create Supabase client
  const supabase = await createServerSupabaseClient();

  // Build query - select only fields needed for list items
  let query = supabase
    .from('articles' as any)
    .select('id, slug, title, summary, category, tags, thumbnail_url, reading_time, created_at', { count: 'exact' });

  // Apply published filter
  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  // Apply category filter
  if (category && isArticleCategory(category)) {
    query = query.eq('category', category);
  }

  // Apply tag filter
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // Apply search filter (full-text search on title, summary, and content)
  if (search && search.trim()) {
    query = query.textSearch('title', search, {
      type: 'websearch',
      config: 'english',
    });
  }

  // Apply ordering (newest first)
  query = query.order('created_at', { ascending: false });

  // Apply pagination
  const from = (validatedPage - 1) * validatedPageSize;
  const to = from + validatedPageSize - 1;
  query = query.range(from, to);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  // Map database rows to ArticleListItem
  const articles: ArticleListItem[] = (data || []).map((row) => 
    mapArticleListItemRow(row as unknown as ArticleRow)
  );

  // Calculate pagination metadata
  const total = count || 0;
  const totalPages = Math.ceil(total / validatedPageSize);

  return {
    articles,
    total,
    page: validatedPage,
    pageSize: validatedPageSize,
    totalPages,
  };
}

/**
 * Get a single article by its slug
 * 
 * @param slug - Article slug
 * @returns Article or null if not found
 * 
 * Requirements: 1.3
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!slug || !slug.trim()) {
    throw new Error('Article slug is required');
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('articles' as any)
    .select('*')
    .eq('slug', slug.toLowerCase())
    .eq('is_published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Article not found
    }
    throw new Error(`Failed to fetch article: ${error.message}`);
  }

  return mapArticleRow(data as unknown as ArticleRow);
}

// ============================================================================
// Article Creation
// ============================================================================

/**
 * Create data for a new article
 */
export interface CreateArticleData {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  sources?: ArticleSource[];
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

/**
 * Create a new article
 * 
 * @param data - Article data
 * @returns Created article
 * 
 * Requirements: 1.1
 */
export async function createArticle(data: CreateArticleData): Promise<Article> {
  // Validate required fields
  if (!data.title || !data.title.trim()) {
    throw new Error('Article title is required');
  }
  if (!data.summary || !data.summary.trim()) {
    throw new Error('Article summary is required');
  }
  if (!data.content || !data.content.trim()) {
    throw new Error('Article content is required');
  }
  if (!data.category || !isArticleCategory(data.category)) {
    throw new Error('Valid article category is required');
  }

  // Validate field lengths
  if (data.title.length > 500) {
    throw new Error('Article title must be 500 characters or less');
  }
  
  // Auto-truncate meta fields instead of rejecting
  const metaTitle = data.metaTitle 
    ? data.metaTitle.substring(0, 70) 
    : data.title.substring(0, 70);
  
  const metaDescription = data.metaDescription 
    ? data.metaDescription.substring(0, 160) 
    : data.summary.substring(0, 160);

  // Use admin client to bypass RLS for article creation (admin-only operation)
  const supabase = createAdminClient();

  // Generate unique slug from title
  const baseSlug = generateSlug(data.title);
  const slug = await generateUniqueSlugAsync(baseSlug, async (testSlug: string) => {
    const { data: existing } = await supabase
      .from('articles' as any)
      .select('id')
      .eq('slug', testSlug)
      .single();
    return existing !== null;
  });

  // Calculate reading time from content
  const readingTime = calculateReadingTime(data.content);

  // Process sources to ensure domain is extracted
  const sources: ArticleSource[] = (data.sources || []).map((source) => ({
    url: source.url,
    title: source.title,
    domain: source.domain || extractDomain(source.url),
  }));

  // Prepare article data for insertion
  const articleData = {
    slug,
    title: data.title.trim(),
    summary: data.summary.trim(),
    content: data.content.trim(),
    category: data.category,
    tags: data.tags || [],
    thumbnail_url: data.thumbnailUrl || null,
    reading_time: readingTime,
    sources: sources as unknown as any, // JSONB type
    meta_title: metaTitle,
    meta_description: metaDescription,
    is_published: data.isPublished !== undefined ? data.isPublished : true,
  };

  // Insert article
  const { data: insertedData, error } = await supabase
    .from('articles' as any)
    .insert(articleData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create article: ${error.message}`);
  }

  return mapArticleRow(insertedData as unknown as ArticleRow);
}

// ============================================================================
// Sitemap Operations
// ============================================================================

/**
 * Article data for sitemap generation
 * Lightweight version with only slug and updated_at
 */
export interface ArticleSitemapItem {
  /** URL-friendly slug */
  slug: string;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Get all published articles for sitemap generation
 * Returns only slug and updated_at for efficiency
 * 
 * @returns Array of articles with slug and updatedAt
 * 
 * Requirements: 5.6
 */
export async function getArticlesForSitemap(): Promise<ArticleSitemapItem[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('articles' as any)
    .select('slug, updated_at')
    .eq('is_published', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch articles for sitemap:', error.message);
    return []; // Return empty array on error to not break sitemap generation
  }

  // Type assertion for Supabase response
  const rows = data as unknown as Array<{ slug: string; updated_at: string }> | null;
  
  return (rows || []).map((row) => ({
    slug: row.slug,
    updatedAt: new Date(row.updated_at),
  }));
}

// ============================================================================
// Category Operations
// ============================================================================

/**
 * Get all categories with article counts
 * 
 * @returns Array of categories with counts
 * 
 * Requirements: 4.1
 */
export async function getCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createServerSupabaseClient();

  // Get all published articles grouped by category
  const { data, error } = await supabase
    .from('articles' as any)
    .select('category')
    .eq('is_published', true);

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  // Count articles per category
  const categoryCounts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    const category = row.category;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Convert to CategoryWithCount array
  const categories: CategoryWithCount[] = Object.entries(categoryCounts)
    .filter(([category]) => isArticleCategory(category))
    .map(([category, count]) => ({
      category: category as any,
      count,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return categories;
}
