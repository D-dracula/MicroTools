/**
 * Admin Blog Articles API Route
 * 
 * GET /api/admin/blog - List all articles with admin filters
 * DELETE /api/admin/blog - Delete an article by ID
 * 
 * Admin-only endpoint for managing blog articles.
 * 
 * Requirements: 3.1, 3.5, 3.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type { ArticleRow, ArticleCategory } from '@/lib/blog/types';
import { isArticleCategory, mapArticleRow } from '@/lib/blog/types';
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware';

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

interface AdminArticlesResponse {
  success: boolean;
  data?: {
    articles: AdminArticleListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}

// ============================================================================
// GET - List Articles with Admin Filters
// ============================================================================

/**
 * GET /api/admin/blog
 * 
 * List all articles with admin-specific filters:
 * - status: 'all' | 'published' | 'draft'
 * - category: ArticleCategory
 * - search: string (searches title and summary)
 * - page: number
 * - pageSize: number
 * 
 * Requirements: 3.1, 3.5, 3.6
 */
async function getBlogHandler(request: NextRequest, context: AdminContext): Promise<NextResponse<AdminArticlesResponse>> {
  const { requestId } = context;

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);
    const status = searchParams.get('status') || 'all'; // 'all' | 'published' | 'draft'
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    // Validate page and pageSize
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAGE',
            message: 'Invalid page number',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !isArticleCategory(category)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Invalid category',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('articles' as any)
      .select('*', { count: 'exact' });

    // Apply status filter (Requirement 3.5)
    if (status === 'published') {
      query = query.eq('is_published', true);
    } else if (status === 'draft') {
      query = query.eq('is_published', false);
    }
    // 'all' - no filter applied

    // Apply category filter (Requirement 3.5)
    if (category) {
      query = query.eq('category', category);
    }

    // Apply search filter (Requirement 3.6)
    if (search && search.trim()) {
      // Search in title and summary using ilike for case-insensitive search
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    // Apply ordering (newest first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
          },
          requestId,
        },
        { status: 500 }
      );
    }

    // Map database rows to admin article list items
    const articles: AdminArticleListItem[] = ((data || []) as unknown as ArticleRow[]).map((row: ArticleRow) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      category: row.category as ArticleCategory,
      tags: row.tags,
      thumbnailUrl: row.thumbnail_url,
      readingTime: row.reading_time,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        articles,
        total,
        page,
        pageSize,
        totalPages,
      },
      requestId,
    });
  } catch (error) {
    console.error('Admin blog API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Article
// ============================================================================

/**
 * DELETE /api/admin/blog
 * 
 * Delete an article by ID
 * 
 * Request body:
 * - id: string (article ID to delete)
 * 
 * Requirements: 3.4
 */
async function deleteBlogHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userEmail, requestId } = context;

  try {
    // Parse request body
    let body: { id: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON in request body',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate article ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // First, get the article to verify it exists
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles' as any)
      .select('id, title')
      .eq('id', body.id)
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
          requestId,
        },
        { status: 404 }
      );
    }

    // Delete the article
    const { error: deleteError } = await supabase
      .from('articles' as any)
      .delete()
      .eq('id', body.id);

    if (deleteError) {
      console.error('Error deleting article:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: deleteError.message,
          },
          requestId,
        },
        { status: 500 }
      );
    }

    // Log the action
    const articleData = existingArticle as unknown as { id: string; title: string };
    console.log(`[Admin] Article deleted: ${articleData.title} (${body.id}) by ${userEmail}`);

    return NextResponse.json({
      success: true,
      data: {
        id: body.id,
        message: 'Article deleted successfully',
      },
      requestId,
    });
  } catch (error) {
    console.error('Admin blog delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Article Status
// ============================================================================

/**
 * PATCH /api/admin/blog
 * 
 * Update article status (publish/unpublish)
 * 
 * Request body:
 * - id: string (article ID)
 * - isPublished: boolean
 */
async function patchBlogHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userEmail, requestId } = context;

  try {
    // Parse request body
    let body: { id: string; isPublished?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON in request body',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate article ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.isPublished === 'boolean') {
      updateData.is_published = body.isPublished;
    }

    // Update the article
    const { data, error } = await supabase
      .from('articles' as any)
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating article:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: error.message,
          },
          requestId,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
          requestId,
        },
        { status: 404 }
      );
    }

    // Log the action
    const updatedArticle = data as unknown as ArticleRow;
    console.log(`[Admin] Article updated: ${updatedArticle.title} (${body.id}) by ${userEmail}`);

    return NextResponse.json({
      success: true,
      data: {
        article: mapArticleRow(updatedArticle),
      },
      requestId,
    });
  } catch (error) {
    console.error('Admin blog update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export Handlers with Admin Middleware
// Requirements: 11.1, 11.2, 11.3, 11.4
// ============================================================================

export const GET = withAdminMiddleware(getBlogHandler, {
  endpoint: '/api/admin/blog',
  action: 'view_blog',
  rateLimit: true,
  logRequests: true,
});

export const DELETE = withAdminMiddleware(deleteBlogHandler, {
  endpoint: '/api/admin/blog',
  action: 'delete_article',
  rateLimit: true,
  logRequests: true,
});

export const PATCH = withAdminMiddleware(patchBlogHandler, {
  endpoint: '/api/admin/blog',
  action: 'update_article',
  rateLimit: true,
  logRequests: true,
});
