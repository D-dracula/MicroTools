/**
 * Blog Topic Search API Route - Multi-Source Search
 * 
 * POST /api/blog/search
 * 
 * Admin-only endpoint for searching e-commerce topics using multiple sources:
 * - NewsAPI.org: Fresh news articles (last 7 days)
 * - Exa AI: Deep neural search for educational content
 * 
 * Results are merged, deduplicated, and ranked by recency + relevance.
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
  exaKey?: string;
  newsApiKey?: string;
  query?: string;
  category?: ArticleCategory;
  numResults?: number;
}

interface UnifiedSearchResult {
  title: string;
  url: string;
  publishedDate: string;
  score: number;
  text: string;
  source: 'exa' | 'newsapi' | 'fallback';
  sourceName?: string;
  author?: string;
  imageUrl?: string;
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

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

/** Dynamic search queries based on current date */
function getDynamicQueries(category?: ArticleCategory): string[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('en', { month: 'long' });
  
  const baseQueries: Record<ArticleCategory | 'default', string[]> = {
    marketing: [
      `e-commerce marketing strategies ${currentMonth} ${currentYear}`,
      `social media marketing online stores ${currentYear}`,
      `digital marketing trends e-commerce latest`,
      `influencer marketing e-commerce brands`,
      `email marketing automation online retail`,
    ],
    'seller-tools': [
      `best e-commerce seller tools ${currentYear}`,
      `Amazon seller software new features`,
      `e-commerce analytics tools latest`,
      `inventory management software updates`,
      `AI tools for online sellers`,
    ],
    logistics: [
      `e-commerce shipping solutions ${currentYear}`,
      `fulfillment strategies online retail latest`,
      `dropshipping logistics news`,
      `last mile delivery innovations`,
      `supply chain e-commerce updates`,
    ],
    trends: [
      `e-commerce trends ${currentMonth} ${currentYear}`,
      `future of online retail predictions`,
      `emerging e-commerce technologies`,
      `AI in e-commerce latest developments`,
      `social commerce trends ${currentYear}`,
    ],
    'case-studies': [
      `e-commerce success stories ${currentYear}`,
      `online business growth case study`,
      `Amazon seller success strategies`,
      `Shopify store success stories`,
      `D2C brand growth stories`,
    ],
    default: [
      `e-commerce news ${currentMonth} ${currentYear}`,
      `online selling tips latest`,
      `marketplace trends this week`,
      `e-commerce business growth strategies`,
      `digital commerce innovations`,
    ],
  };

  return category ? baseQueries[category] : baseQueries.default;
}

/** Trusted e-commerce news domains for NewsAPI */
const TRUSTED_DOMAINS = [
  'techcrunch.com',
  'forbes.com',
  'businessinsider.com',
  'entrepreneur.com',
  'inc.com',
  'wired.com',
  'theverge.com',
  'cnbc.com',
  'reuters.com',
  'bloomberg.com',
].join(',');

/** Domains to exclude from Exa search */
const EXCLUDED_DOMAINS = [
  'pinterest.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'tiktok.com',
  'youtube.com',
  'reddit.com',
];

// ============================================================================
// Admin Access Check
// ============================================================================

async function checkAdminAccess(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(session.user.email.toLowerCase());
}

// ============================================================================
// NewsAPI Search
// ============================================================================

async function searchWithNewsApi(
  apiKey: string,
  query: string,
  numResults: number = 5
): Promise<UnifiedSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Get articles from last 7 days
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const params = new URLSearchParams({
      q: query,
      from: fromDateStr,
      sortBy: 'publishedAt', // Most recent first
      language: 'en',
      pageSize: String(numResults),
      apiKey,
    });

    // Add trusted domains if not searching for specific topic
    if (!query.includes('site:')) {
      params.set('domains', TRUSTED_DOMAINS);
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[NewsAPI] Error:', response.status, errorData);
      return [];
    }

    const data: NewsApiResponse = await response.json();

    if (data.status !== 'ok' || !data.articles) {
      console.log('[NewsAPI] Invalid response:', data.status);
      return [];
    }

    console.log(`[NewsAPI] Found ${data.articles.length} articles`);

    return data.articles
      .filter(article => article.title && article.url && article.description)
      .map(article => ({
        title: article.title,
        url: article.url,
        publishedDate: article.publishedAt,
        score: calculateRecencyScore(article.publishedAt),
        text: article.content || article.description || '',
        source: 'newsapi' as const,
        sourceName: article.source.name,
        author: article.author || undefined,
        imageUrl: article.urlToImage || undefined,
      }));
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[NewsAPI] Request timeout');
    } else {
      console.error('[NewsAPI] Error:', error);
    }
    
    return [];
  }
}

// ============================================================================
// Exa Search (Enhanced)
// ============================================================================

async function searchWithExa(
  apiKey: string,
  query: string,
  numResults: number = 5
): Promise<UnifiedSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Get articles from last 14 days for Exa (deeper content)
    const fromDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        numResults,
        type: 'neural',
        useAutoprompt: true,
        startPublishedDate: fromDateStr,
        excludeDomains: EXCLUDED_DOMAINS,
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
      console.log('[Exa] Error:', response.status);
      return [];
    }

    const data: ExaApiResponse = await response.json();

    console.log(`[Exa] Found ${data.results?.length || 0} results`);

    return (data.results || [])
      .filter(result => result.title && result.url && result.text)
      .map(result => ({
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate || new Date().toISOString(),
        score: (result.score || 0.5) * calculateRecencyScore(result.publishedDate),
        text: result.text || result.highlights?.join(' ') || '',
        source: 'exa' as const,
      }));
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Exa] Request timeout');
    } else {
      console.error('[Exa] Error:', error);
    }
    
    return [];
  }
}

// ============================================================================
// Scoring & Ranking
// ============================================================================

/** Calculate recency score (0-1, higher = more recent) */
function calculateRecencyScore(publishedDate?: string): number {
  if (!publishedDate) return 0.5;
  
  try {
    const published = new Date(publishedDate);
    const now = new Date();
    const hoursSincePublished = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
    
    // Score based on hours since publication
    if (hoursSincePublished <= 24) return 1.0;      // Last 24 hours
    if (hoursSincePublished <= 48) return 0.95;     // Last 2 days
    if (hoursSincePublished <= 72) return 0.9;      // Last 3 days
    if (hoursSincePublished <= 168) return 0.8;     // Last week
    if (hoursSincePublished <= 336) return 0.6;     // Last 2 weeks
    if (hoursSincePublished <= 720) return 0.4;     // Last month
    return 0.2;
  } catch {
    return 0.5;
  }
}

/** Deduplicate results by URL and similar titles */
function deduplicateResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  const seen = new Map<string, UnifiedSearchResult>();
  const seenTitles = new Set<string>();
  
  for (const result of results) {
    // Skip if URL already seen
    const normalizedUrl = result.url.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalizedUrl)) continue;
    
    // Skip if title is too similar to existing
    const normalizedTitle = result.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    let isDuplicate = false;
    
    for (const existingTitle of seenTitles) {
      if (calculateTitleSimilarity(normalizedTitle, existingTitle) > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.set(normalizedUrl, result);
      seenTitles.add(normalizedTitle);
    }
  }
  
  return Array.from(seen.values());
}

/** Simple title similarity check */
function calculateTitleSimilarity(title1: string, title2: string): number {
  if (title1 === title2) return 1;
  
  const words1 = new Set(title1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(title2.split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }
  
  return intersection / Math.max(words1.size, words2.size);
}

/** Rank results by combined score */
function rankResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  return results.sort((a, b) => {
    // Prioritize NewsAPI (fresher news) slightly
    const sourceBonus = (r: UnifiedSearchResult) => r.source === 'newsapi' ? 0.1 : 0;
    
    const scoreA = a.score + sourceBonus(a);
    const scoreB = b.score + sourceBonus(b);
    
    return scoreB - scoreA;
  });
}

// ============================================================================
// Fallback Results
// ============================================================================

function getFallbackResults(): UnifiedSearchResult[] {
  const currentYear = new Date().getFullYear();
  
  return [
    {
      title: `E-commerce Trends ${currentYear}: AI-Powered Personalization Takes Center Stage`,
      url: 'https://example.com/ecommerce-trends',
      publishedDate: new Date().toISOString(),
      score: 0.95,
      text: `The e-commerce landscape is rapidly evolving with AI-powered personalization becoming the cornerstone of successful online retail strategies. Merchants are leveraging machine learning algorithms to create hyper-personalized shopping experiences that significantly boost conversion rates. From dynamic pricing to personalized product recommendations, AI is transforming how sellers connect with customers.`,
      source: 'fallback',
    },
    {
      title: 'Social Commerce Revolution: Selling on TikTok, Instagram, and Beyond',
      url: 'https://example.com/social-commerce',
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.88,
      text: `Social commerce is reshaping how consumers discover and purchase products. Platforms like TikTok Shop, Instagram Shopping, and Pinterest are becoming primary sales channels for many brands. The integration of entertainment and shopping creates unique opportunities for sellers who can create engaging content.`,
      source: 'fallback',
    },
    {
      title: 'Dropshipping Success Strategies: Building a Profitable Online Store',
      url: 'https://example.com/dropshipping-strategies',
      publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.82,
      text: `Dropshipping continues to be a viable business model for entrepreneurs looking to enter e-commerce with minimal upfront investment. However, success requires strategic planning and execution. Top performers focus on niche selection, supplier relationships, and brand building.`,
      source: 'fallback',
    },
  ];
}

// ============================================================================
// POST - Multi-Source Search
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Parse request body
    let body: SearchRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } },
        { status: 400 }
      );
    }

    // Validate at least one API key
    const hasExaKey = body.exaKey && typeof body.exaKey === 'string';
    const hasNewsApiKey = body.newsApiKey && typeof body.newsApiKey === 'string';
    
    // Also check environment variables for NewsAPI
    const envNewsApiKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY;
    const effectiveNewsApiKey = body.newsApiKey || envNewsApiKey;
    
    if (!hasExaKey && !effectiveNewsApiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_API_KEY', message: 'At least one API key (Exa or NewsAPI) is required' } },
        { status: 400 }
      );
    }

    // Validate category
    if (body.category && !isArticleCategory(body.category)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CATEGORY', message: 'Invalid category' } },
        { status: 400 }
      );
    }

    // Determine search query
    let searchQuery = body.query?.trim();
    
    if (!searchQuery) {
      const queries = getDynamicQueries(body.category);
      searchQuery = queries[Math.floor(Math.random() * queries.length)];
    }

    console.log(`[Blog Search] Query: "${searchQuery}"`);
    console.log(`[Blog Search] Sources: Exa=${hasExaKey}, NewsAPI=${!!effectiveNewsApiKey}`);

    // Search in parallel from both sources
    const searchPromises: Promise<UnifiedSearchResult[]>[] = [];
    const sourcesUsed: string[] = [];

    if (hasExaKey) {
      searchPromises.push(searchWithExa(body.exaKey!, searchQuery, body.numResults || 5));
      sourcesUsed.push('exa');
    }

    if (effectiveNewsApiKey) {
      searchPromises.push(searchWithNewsApi(effectiveNewsApiKey, searchQuery, body.numResults || 5));
      sourcesUsed.push('newsapi');
    }

    // Wait for all searches
    const searchResults = await Promise.all(searchPromises);
    
    // Merge all results
    let allResults = searchResults.flat();
    
    console.log(`[Blog Search] Raw results: ${allResults.length}`);

    // If no results, use fallback
    if (allResults.length === 0) {
      console.log('[Blog Search] No results, using fallback');
      allResults = getFallbackResults();
    }

    // Deduplicate and rank
    const uniqueResults = deduplicateResults(allResults);
    const rankedResults = rankResults(uniqueResults);

    console.log(`[Blog Search] Final results: ${rankedResults.length}`);

    // Check if using fallback
    const usingFallback = rankedResults.every(r => r.source === 'fallback');

    return NextResponse.json({
      success: true,
      data: {
        query: searchQuery,
        results: rankedResults,
        totalResults: rankedResults.length,
        sourcesUsed,
        usingFallback,
        message: usingFallback 
          ? 'Using cached topics (external APIs unavailable)' 
          : `Found ${rankedResults.length} topics from ${sourcesUsed.join(' + ')}`,
      },
    });
  } catch (error) {
    console.error('[Blog Search] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SEARCH_FAILED', message: error instanceof Error ? error.message : 'Search failed' } },
      { status: 500 }
    );
  }
}
