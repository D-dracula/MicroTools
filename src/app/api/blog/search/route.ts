/**
 * Blog Topic Search API Route - Multi-Source Search with Deep Content
 * 
 * POST /api/blog/search
 * 
 * Admin-only endpoint for searching e-commerce topics using multiple sources:
 * - NewsAPI.org: Fresh news articles (last 7 days)
 * - Exa AI: Deep neural search for educational content
 * 
 * Results are merged, deduplicated, and ranked by recency + relevance.
 * Optionally fetches full content from sources for better article generation.
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
  fetchFullContent?: boolean; // New: fetch full content from sources
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
  fullContent?: string; // New: full fetched content
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
  code?: string;
  message?: string;
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
      `ecommerce marketing strategies ${currentYear}`,
      `social media marketing online stores`,
      `digital marketing ecommerce trends`,
      `influencer marketing brands`,
      `email marketing automation retail`,
    ],
    'seller-tools': [
      `ecommerce seller tools ${currentYear}`,
      `Amazon seller software`,
      `ecommerce analytics tools`,
      `inventory management software`,
      `AI tools online sellers`,
    ],
    logistics: [
      `ecommerce shipping solutions ${currentYear}`,
      `fulfillment strategies retail`,
      `dropshipping logistics`,
      `last mile delivery innovations`,
      `supply chain ecommerce`,
    ],
    trends: [
      `ecommerce trends ${currentMonth} ${currentYear}`,
      `future online retail`,
      `emerging ecommerce technologies`,
      `AI ecommerce developments`,
      `social commerce trends`,
    ],
    'case-studies': [
      `ecommerce success stories ${currentYear}`,
      `online business growth`,
      `Amazon seller success`,
      `Shopify store success`,
      `D2C brand growth`,
    ],
    default: [
      `ecommerce news ${currentYear}`,
      `online selling tips`,
      `marketplace trends`,
      `ecommerce business growth`,
      `digital commerce innovations`,
    ],
  };

  return category ? baseQueries[category] : baseQueries.default;
}

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
// NewsAPI Search (Fixed for Free Plan)
// ============================================================================

async function searchWithNewsApi(
  apiKey: string,
  query: string,
  numResults: number = 5
): Promise<UnifiedSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Get articles from last 30 days
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    // Enhanced query to ensure e-commerce relevance
    // Add e-commerce keywords to improve relevance
    const enhancedQuery = query.toLowerCase().includes('ecommerce') || 
                          query.toLowerCase().includes('e-commerce') ||
                          query.toLowerCase().includes('online store') ||
                          query.toLowerCase().includes('seller')
      ? query
      : `${query} AND (ecommerce OR "e-commerce" OR "online store" OR "online retail" OR Amazon OR Shopify)`;

    const params = new URLSearchParams({
      q: enhancedQuery,
      from: fromDateStr,
      sortBy: 'relevancy', // Changed to relevancy for better results
      language: 'en',
      pageSize: String(Math.min(numResults * 3, 30)), // Get more to filter
      apiKey,
    });

    console.log(`[NewsAPI] Searching: "${enhancedQuery}"`);

    const response = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const data: NewsApiResponse = await response.json();

    if (!response.ok || data.status !== 'ok') {
      console.log('[NewsAPI] Error:', data.code, data.message);
      return [];
    }

    if (!data.articles || data.articles.length === 0) {
      console.log('[NewsAPI] No articles found');
      return [];
    }

    console.log(`[NewsAPI] Found ${data.articles.length} articles`);

    // Filter and map results - with relevance check
    const ecommerceKeywords = ['ecommerce', 'e-commerce', 'online store', 'retail', 'seller', 
      'amazon', 'shopify', 'dropshipping', 'marketplace', 'shopping', 'merchant', 'commerce',
      'woocommerce', 'ebay', 'etsy', 'fulfillment', 'inventory', 'checkout', 'cart'];
    
    return data.articles
      .filter(article => {
        if (!article.title || !article.url || !article.description) return false;
        if (article.title.includes('[Removed]')) return false;
        if (article.description.length < 50) return false;
        
        // Check if article is relevant to e-commerce
        const content = `${article.title} ${article.description}`.toLowerCase();
        const isRelevant = ecommerceKeywords.some(keyword => content.includes(keyword));
        
        if (!isRelevant) {
          console.log(`[NewsAPI] Filtered out (not e-commerce): ${article.title.substring(0, 50)}...`);
        }
        
        return isRelevant;
      })
      .slice(0, numResults)
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
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('[NewsAPI] Request timeout');
      } else {
        console.error('[NewsAPI] Error:', error.message);
      }
    }
    
    return [];
  }
}


// ============================================================================
// Exa Search (Enhanced with more content)
// ============================================================================

async function searchWithExa(
  apiKey: string,
  query: string,
  numResults: number = 5
): Promise<UnifiedSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Get articles from last 30 days
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    // Enhance query for better e-commerce results
    const enhancedQuery = `${query} e-commerce online retail business`;

    console.log(`[Exa] Searching: "${enhancedQuery}"`);
    console.log(`[Exa] API Key present: ${!!apiKey}`);

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query: enhancedQuery,
        numResults,
        type: 'neural',
        useAutoprompt: true,
        startPublishedDate: fromDateStr,
        excludeDomains: EXCLUDED_DOMAINS,
        contents: {
          text: {
            maxCharacters: 3000,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[Exa] Error:', response.status, errorText);
      return [];
    }

    const data: ExaApiResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('[Exa] No results found in response');
      return [];
    }

    console.log(`[Exa] ✅ Found ${data.results.length} results`);

    return data.results
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
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Exa] Request timeout after 30s');
      } else {
        console.error('[Exa] Error:', error.message);
      }
    }
    
    return [];
  }
}


// ============================================================================
// Deep Content Fetching (NEW)
// ============================================================================

/**
 * Fetch full content from a URL using simple fetch
 * This enriches the search results with more context for better article generation
 */
async function fetchFullContent(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MicroToolsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Extract text content from HTML (simple extraction)
    const textContent = extractTextFromHtml(html);
    
    // Return first 5000 characters
    return textContent.substring(0, 5000);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Simple HTML to text extraction
 */
function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and other non-content elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Try to extract article content
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  } else {
    // Try main content
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      text = mainMatch[1];
    }
  }

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Enrich results with full content from top sources
 */
async function enrichResultsWithContent(
  results: UnifiedSearchResult[],
  maxToEnrich: number = 3
): Promise<UnifiedSearchResult[]> {
  const topResults = results.slice(0, maxToEnrich);
  const restResults = results.slice(maxToEnrich);

  console.log(`[Content] Fetching full content for top ${topResults.length} results...`);

  const enrichedResults = await Promise.all(
    topResults.map(async (result) => {
      const fullContent = await fetchFullContent(result.url);
      if (fullContent && fullContent.length > result.text.length) {
        console.log(`[Content] Enriched: ${result.title.substring(0, 50)}... (+${fullContent.length - result.text.length} chars)`);
        return { ...result, fullContent, text: fullContent };
      }
      return result;
    })
  );

  return [...enrichedResults, ...restResults];
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
    
    if (hoursSincePublished <= 24) return 1.0;
    if (hoursSincePublished <= 48) return 0.95;
    if (hoursSincePublished <= 72) return 0.9;
    if (hoursSincePublished <= 168) return 0.8;
    if (hoursSincePublished <= 336) return 0.6;
    if (hoursSincePublished <= 720) return 0.4;
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
    const normalizedUrl = result.url.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalizedUrl)) continue;
    
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
    // Prioritize results with more content
    const contentBonus = (r: UnifiedSearchResult) => r.text.length > 1000 ? 0.1 : 0;
    // Slight bonus for NewsAPI (fresher)
    const sourceBonus = (r: UnifiedSearchResult) => r.source === 'newsapi' ? 0.05 : 0;
    
    const scoreA = a.score + contentBonus(a) + sourceBonus(a);
    const scoreB = b.score + contentBonus(b) + sourceBonus(b);
    
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
      text: `The e-commerce landscape is rapidly evolving with AI-powered personalization becoming the cornerstone of successful online retail strategies. Merchants are leveraging machine learning algorithms to create hyper-personalized shopping experiences that significantly boost conversion rates. From dynamic pricing to personalized product recommendations, AI is transforming how sellers connect with customers. Studies show that personalized experiences can increase sales by up to 20% and improve customer satisfaction scores dramatically.`,
      source: 'fallback',
    },
    {
      title: 'Social Commerce Revolution: Selling on TikTok, Instagram, and Beyond',
      url: 'https://example.com/social-commerce',
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.88,
      text: `Social commerce is reshaping how consumers discover and purchase products. Platforms like TikTok Shop, Instagram Shopping, and Pinterest are becoming primary sales channels for many brands. The integration of entertainment and shopping creates unique opportunities for sellers who can create engaging content. Live shopping events and influencer partnerships are driving significant sales growth.`,
      source: 'fallback',
    },
    {
      title: 'Dropshipping Success Strategies: Building a Profitable Online Store',
      url: 'https://example.com/dropshipping-strategies',
      publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.82,
      text: `Dropshipping continues to be a viable business model for entrepreneurs looking to enter e-commerce with minimal upfront investment. However, success requires strategic planning and execution. Top performers focus on niche selection, supplier relationships, and brand building. The key differentiators include fast shipping times and excellent customer service.`,
      source: 'fallback',
    },
  ];
}


// ============================================================================
// POST - Multi-Source Search with Deep Content
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

    // Check for API keys (from request or environment)
    const exaKey = body.exaKey || process.env.EXA_API_KEY;
    const newsApiKey = body.newsApiKey || process.env.NEWSAPI_KEY;
    
    const hasExaKey = !!exaKey;
    const hasNewsApiKey = !!newsApiKey;
    
    if (!hasExaKey && !hasNewsApiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_API_KEY', message: 'At least one API key required' } },
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
    console.log(`[Blog Search] Sources: Exa=${hasExaKey}, NewsAPI=${hasNewsApiKey}`);

    // Search in parallel from both sources
    const searchPromises: Promise<UnifiedSearchResult[]>[] = [];
    const sourcesUsed: string[] = [];

    if (hasExaKey) {
      searchPromises.push(searchWithExa(exaKey!, searchQuery, body.numResults || 5));
      sourcesUsed.push('exa');
    }

    if (hasNewsApiKey) {
      searchPromises.push(searchWithNewsApi(newsApiKey!, searchQuery, body.numResults || 5));
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
    let uniqueResults = deduplicateResults(allResults);
    let rankedResults = rankResults(uniqueResults);

    // Optionally fetch full content for top results
    if (body.fetchFullContent !== false && rankedResults.length > 0) {
      rankedResults = await enrichResultsWithContent(rankedResults, 3);
    }

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
