/**
 * Blog Topic Search API Route
 * 
 * POST /api/blog/search
 * 
 * Admin-only endpoint for searching e-commerce topics using Exa API.
 * Returns relevant articles and news for content generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { ArticleCategory } from '@/lib/blog/types';
import { isArticleCategory } from '@/lib/blog/types';

// ============================================================================
// Types
// ============================================================================

interface SearchRequest {
  exaKey: string;
  query?: string;
  category?: ArticleCategory;
  numResults?: number;
}

interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate: string;
  score: number;
  text: string;
}

interface ExaApiResponse {
  results: Array<{
    title: string;
    url: string;
    publishedDate?: string;
    score?: number;
    text?: string;
    highlights?: string[];
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SEARCH_QUERIES: Record<ArticleCategory | 'default', string[]> = {
  marketing: [
    'e-commerce marketing strategies 2025',
    'social media marketing for online stores',
    'digital marketing trends e-commerce',
  ],
  'seller-tools': [
    'best e-commerce seller tools 2025',
    'Amazon seller software automation',
    'e-commerce analytics tools',
  ],
  logistics: [
    'e-commerce shipping solutions 2025',
    'fulfillment strategies online retail',
    'dropshipping logistics optimization',
  ],
  trends: [
    'e-commerce trends 2025',
    'future of online retail',
    'emerging e-commerce technologies',
  ],
  'case-studies': [
    'e-commerce success stories',
    'online business case study',
    'Amazon seller success strategies',
  ],
  default: [
    'e-commerce seller tips strategies 2025',
    'online marketplace trends digital marketing',
    'dropshipping business growth tactics',
  ],
};

// ============================================================================
// Admin Access Check
// ============================================================================

async function checkAdminAccess(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  // Check both ADMIN_EMAILS and NEXT_PUBLIC_ADMIN_EMAILS
  const adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(session.user.email.toLowerCase());
}

// ============================================================================
// Exa Search Function with Retry and Timeout
// ============================================================================

async function searchWithExa(
  exaKey: string,
  query: string,
  numResults: number = 5,
  retries: number = 2
): Promise<ExaSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaKey,
      },
      body: JSON.stringify({
        query,
        numResults,
        type: 'neural',
        useAutoprompt: true,
        contents: {
          text: {
            maxCharacters: 1500,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If Exa is down or timing out, use fallback
      if (response.status >= 500 || response.status === 524) {
        console.log('[Exa] Server error, using fallback data');
        return getFallbackResults(query);
      }
      
      const errorText = await response.text();
      throw new Error(`Exa API error: ${response.status}`);
    }

    const data: ExaApiResponse = await response.json();

    return data.results.map((result) => ({
      title: result.title || 'Untitled',
      url: result.url,
      publishedDate: result.publishedDate || new Date().toISOString(),
      score: result.score || 0.5,
      text: result.text || result.highlights?.join(' ') || '',
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout or network errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      console.log('[Exa] Request timeout, using fallback data');
      return getFallbackResults(query);
    }
    
    // Retry on failure
    if (retries > 0) {
      console.log(`[Exa] Retrying... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, 1000));
      return searchWithExa(exaKey, query, numResults, retries - 1);
    }
    
    // Use fallback if all retries failed
    console.log('[Exa] All retries failed, using fallback data');
    return getFallbackResults(query);
  }
}

// ============================================================================
// Fallback Results (when Exa is unavailable)
// ============================================================================

function getFallbackResults(query: string): ExaSearchResult[] {
  const fallbackTopics = [
    {
      title: 'E-commerce Trends 2025: AI-Powered Personalization Takes Center Stage',
      url: 'https://example.com/ecommerce-trends-2025',
      publishedDate: new Date().toISOString(),
      score: 0.95,
      text: `The e-commerce landscape is rapidly evolving with AI-powered personalization becoming the cornerstone of successful online retail strategies. Merchants are leveraging machine learning algorithms to create hyper-personalized shopping experiences that significantly boost conversion rates. From dynamic pricing to personalized product recommendations, AI is transforming how sellers connect with customers. Studies show that personalized experiences can increase sales by up to 20% and improve customer satisfaction scores dramatically. Key trends include predictive inventory management, chatbot-driven customer service, and automated marketing campaigns that adapt in real-time to customer behavior.`,
    },
    {
      title: 'Dropshipping Success Strategies: Building a Profitable Online Store',
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
    {
      title: 'Social Commerce Revolution: Selling on TikTok, Instagram, and Beyond',
      url: 'https://example.com/social-commerce-2025',
      publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.85,
      text: `Social commerce is reshaping how consumers discover and purchase products. Platforms like TikTok Shop, Instagram Shopping, and Pinterest are becoming primary sales channels for many brands. The integration of entertainment and shopping creates unique opportunities for sellers who can create engaging content. Live shopping events, influencer partnerships, and user-generated content are driving significant sales growth. Brands that master social commerce are seeing conversion rates 3x higher than traditional e-commerce channels.`,
    },
    {
      title: 'Sustainable E-commerce: Meeting Consumer Demand for Eco-Friendly Shopping',
      url: 'https://example.com/sustainable-ecommerce',
      publishedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.78,
      text: `Sustainability is no longer optional for e-commerce businesses. Consumers increasingly prefer brands that demonstrate environmental responsibility. Key areas include eco-friendly packaging, carbon-neutral shipping options, and transparent supply chains. Sellers implementing sustainable practices report higher customer loyalty and willingness to pay premium prices. The circular economy model, including resale and refurbishment programs, is gaining traction as a profitable and sustainable business approach.`,
    },
  ];

  // Filter based on query keywords if provided
  if (query) {
    const queryLower = query.toLowerCase();
    const filtered = fallbackTopics.filter(topic => 
      topic.title.toLowerCase().includes(queryLower) ||
      topic.text.toLowerCase().includes(queryLower)
    );
    if (filtered.length > 0) return filtered;
  }

  return fallbackTopics;
}

// ============================================================================
// POST - Search Topics
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    
    console.log('[Blog Search] Admin check result:', isAdmin);
    
    if (!isAdmin) {
      console.log('[Blog Search] Access denied - not admin');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      );
    }

    // Parse request body
    let body: SearchRequest;
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

    // Validate Exa API key
    if (!body.exaKey || typeof body.exaKey !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_EXA_KEY',
            message: 'Exa API key is required',
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

    // Determine search query
    let searchQuery = body.query?.trim();
    
    if (!searchQuery) {
      // Use default queries based on category
      const queries = body.category 
        ? DEFAULT_SEARCH_QUERIES[body.category]
        : DEFAULT_SEARCH_QUERIES.default;
      
      // Pick a random query
      searchQuery = queries[Math.floor(Math.random() * queries.length)];
    }

    // Search with Exa
    const results = await searchWithExa(
      body.exaKey,
      searchQuery,
      body.numResults || 5
    );

    // Check if using fallback (results from example.com)
    const usingFallback = results.some(r => r.url.includes('example.com'));

    // Filter out results with insufficient content
    const validResults = results.filter(
      (result) => result.title && result.url && result.text && result.text.length > 100
    );

    return NextResponse.json({
      success: true,
      data: {
        query: searchQuery,
        results: validResults,
        totalResults: validResults.length,
        usingFallback,
        message: usingFallback ? 'Using cached topics (Exa temporarily unavailable)' : undefined,
      },
    });
  } catch (error) {
    console.error('Blog search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to search topics',
        },
      },
      { status: 500 }
    );
  }
}
