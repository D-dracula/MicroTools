/**
 * Admin Create Article API Route
 * 
 * POST /api/admin/blog/create - Create a new article manually
 * 
 * Admin-only endpoint for creating blog articles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createArticle, type CreateArticleData } from '@/lib/blog/article-service';
import { isArticleCategory, mapArticleRow, type ArticleRow } from '@/lib/blog/types';
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware';

// ============================================================================
// Types
// ============================================================================

interface CreateArticleRequest {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags?: string[];
  thumbnailUrl?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

// ============================================================================
// POST - Create Article
// ============================================================================

/**
 * POST /api/admin/blog/create
 * 
 * Create a new article manually
 */
async function createArticleHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userEmail, requestId } = context;

  try {
    // Parse request body
    let body: CreateArticleRequest;
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

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_TITLE',
            message: 'Article title is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!body.summary || typeof body.summary !== 'string' || !body.summary.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_SUMMARY',
            message: 'Article summary is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string' || !body.content.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CONTENT',
            message: 'Article content is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (!body.category || !isArticleCategory(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Valid article category is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (body.title.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TITLE_TOO_LONG',
            message: 'Article title must be 500 characters or less',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (body.metaTitle && body.metaTitle.length > 70) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'META_TITLE_TOO_LONG',
            message: 'Meta title must be 70 characters or less',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (body.metaDescription && body.metaDescription.length > 160) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'META_DESCRIPTION_TOO_LONG',
            message: 'Meta description must be 160 characters or less',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Prepare article data
    const articleData: CreateArticleData = {
      title: body.title.trim(),
      summary: body.summary.trim(),
      content: body.content.trim(),
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags.filter(t => typeof t === 'string') : [],
      thumbnailUrl: body.thumbnailUrl || null,
      metaTitle: body.metaTitle?.trim(),
      metaDescription: body.metaDescription?.trim(),
      isPublished: body.isPublished ?? false,
    };

    // Create article
    const article = await createArticle(articleData);

    // Log the action
    console.log(`[Admin] Article created: ${article.title} (${article.id}) by ${userEmail}`);

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          category: article.category,
          tags: article.tags,
          thumbnailUrl: article.thumbnailUrl,
          readingTime: article.readingTime,
          isPublished: article.isPublished,
          createdAt: article.createdAt.toISOString(),
        },
      },
      requestId,
    });
  } catch (error) {
    console.error('Admin create article error:', error);
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
// Export Handler with Admin Middleware
// ============================================================================

export const POST = withAdminMiddleware(createArticleHandler, {
  endpoint: '/api/admin/blog/create',
  action: 'create_article',
  rateLimit: true,
  logRequests: true,
});
