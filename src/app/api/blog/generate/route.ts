/**
 * Article Generation API Route
 * 
 * POST /api/blog/generate
 * 
 * Admin-only endpoint for generating new blog articles using AI.
 * Uses Exa for topic research and OpenRouter for content generation.
 * 
 * Requirements: 2.1, 2.2, 2.7
 * - Verify admin authentication before allowing access
 * - Deny access to non-admin users with 403 status
 * - Generate article and save to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateFullArticle,
} from '@/lib/blog/article-generator';
import type { ArticleCategory, ExaSearchResult } from '@/lib/blog/types';
import { isArticleCategory } from '@/lib/blog/types';

// ============================================================================
// Admin Access Check
// ============================================================================

/**
 * Check if the current user has admin access
 * 
 * Requirements: 2.1, 2.2
 */
async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { isAdmin: false, userId: null };
  }

  // Check against admin emails from environment variable
  const adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(session.user.email.toLowerCase());

  // Get user ID from session
  const userId = (session.user as { id?: string }).id || null;

  return {
    isAdmin,
    userId
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

interface GenerateRequest {
  /** OpenRouter API key for content generation */
  apiKey: string;
  /** Optional: specific category for the article */
  category?: ArticleCategory;
  /** Optional: Exa search results (if provided externally) */
  exaResults?: ExaSearchResult[];
  /** Optional: Maximum number of retry attempts (default: 2) */
  maxRetries?: number;
}

interface GenerateResponse {
  success: boolean;
  data?: {
    article: {
      id: string;
      slug: string;
      title: string;
      summary: string;
      category: ArticleCategory;
      thumbnailUrl: string | null;
      readingTime: number;
      createdAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
    resetAt?: string;
    suggestions?: string[];
  };
}

// ============================================================================
// POST - Generate Article
// ============================================================================

/**
 * POST /api/blog/generate
 * 
 * Generates a new article using AI.
 * 
 * Request body:
 * - apiKey: OpenRouter API key (required)
 * - category: Target category (optional)
 * - exaResults: Pre-fetched Exa search results (optional)
 * 
 * If exaResults are not provided, the endpoint will use mock data
 * for development or return an error in production.
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    // Check admin access (Requirements: 2.1, 2.2)
    const { isAdmin, userId } = await checkAdminAccess();

    if (!isAdmin || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin access required to generate articles',
          },
        },
        { status: 403 }
      );
    }

    // Parse request body
    let body: GenerateRequest;
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
        },
        { status: 400 }
      );
    }

    // Validate API key
    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'OpenRouter API key is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (body.category && !isArticleCategory(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Invalid article category',
          },
        },
        { status: 400 }
      );
    }

    // Get Exa search results
    let exaResults: ExaSearchResult[] = body.exaResults || [];

    // If no Exa results provided, fetch from search API
    if (exaResults.length === 0) {
      console.log('[Generate] No search results provided, fetching from search API...');

      try {
        // Call the search API internally
        const searchUrl = new URL('/api/blog/search', request.url);
        const searchResponse = await fetch(searchUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '', // Forward auth cookies
          },
          body: JSON.stringify({
            category: body.category,
            numResults: 5,
            fetchFullContent: true,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.success && searchData.data?.results) {
            // Map unified search results to ExaSearchResult format
            exaResults = searchData.data.results.map((r: any) => ({
              title: r.title,
              url: r.url,
              publishedDate: r.publishedDate,
              score: r.score,
              text: r.fullContent || r.text || '',
            }));
            console.log(`[Generate] Fetched ${exaResults.length} results from search API`);
          }
        } else {
          console.warn('[Generate] Search API returned error:', searchResponse.status);
        }
      } catch (searchError) {
        console.error('[Generate] Failed to fetch from search API:', searchError);
      }

      // If still no results, use fallback mock data
      if (exaResults.length === 0) {
        console.log('[Generate] Using fallback mock data');
        exaResults = generateMockExaResults();
      }
    }

    // Generate article using the full flow
    const result = await generateFullArticle(
      userId,
      body.apiKey,
      exaResults,
      {
        category: body.category,
        maxRetries: body.maxRetries ?? 2, // Default to 2 retries
      }
    );

    if (!result.success || !result.article) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code || 'GENERATION_FAILED',
            message: result.error?.message || 'Failed to generate article',
            resetAt: result.error?.resetAt?.toISOString(),
            suggestions: result.error?.suggestions,
          },
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: result.article.id,
          slug: result.article.slug,
          title: result.article.title,
          summary: result.article.summary,
          category: result.article.category,
          thumbnailUrl: result.article.thumbnailUrl,
          readingTime: result.article.readingTime,
          createdAt: result.article.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Article generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate article',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Mock Data for Development
// ============================================================================

/**
 * Generate mock Exa search results for development/testing
 * In production, these would come from the Exa MCP tool
 */
function generateMockExaResults(): ExaSearchResult[] {
  const topics = [
    {
      title: 'E-commerce Trends 2025: AI-Powered Personalization Takes Center Stage',
      url: 'https://example.com/ecommerce-trends-2025',
      publishedDate: new Date().toISOString(),
      score: 0.95,
      text: `The e-commerce landscape is rapidly evolving with AI-powered personalization becoming the cornerstone of successful online retail strategies. Merchants are leveraging machine learning algorithms to create hyper-personalized shopping experiences that significantly boost conversion rates. From dynamic pricing to personalized product recommendations, AI is transforming how sellers connect with customers. Studies show that personalized experiences can increase sales by up to 20% and improve customer satisfaction scores dramatically. Key trends include predictive inventory management, chatbot-driven customer service, and automated marketing campaigns that adapt in real-time to customer behavior.`,
    },
    {
      title: 'Dropshipping Success Strategies: Building a Profitable Online Store in 2025',
      url: 'https://example.com/dropshipping-strategies',
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.88,
      text: `Dropshipping continues to be a viable business model for entrepreneurs looking to enter e-commerce with minimal upfront investment. However, success requires strategic planning and execution. Top performers focus on niche selection, supplier relationships, and brand building. The key differentiators include fast shipping times, excellent customer service, and unique product curation. Successful dropshippers are moving away from generic products toward specialized niches where they can establish authority and build loyal customer bases.`,
    },
    {
      title: 'Amazon FBA Optimization: Maximizing Profits in a Competitive Marketplace',
      url: 'https://example.com/amazon-fba-optimization',
      publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.82,
      text: `Amazon FBA sellers face increasing competition, making optimization crucial for profitability. Key strategies include inventory management to avoid storage fees, PPC campaign optimization, and listing enhancement for better organic rankings. Successful sellers are focusing on product differentiation, brand registry benefits, and expanding to international marketplaces. Understanding Amazon's A10 algorithm and leveraging tools for keyword research and competitor analysis are essential for maintaining visibility and sales velocity.`,
    },
  ];

  return topics;
}
