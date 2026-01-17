/**
 * Blog Topic Search API Route - Multi-Source Search with AI Filtering
 * 
 * POST /api/blog/search
 * 
 * Admin-only endpoint for searching e-commerce topics using multiple sources:
 * - NewsAPI.org: Fresh news articles (last 7 days)
 * - Exa AI: Deep neural search for educational content
 * - AI Agent: Filters and validates relevance to e-commerce
 * 
 * Results are merged, deduplicated, AI-filtered, and ranked by relevance.
 * Optionally fetches full content from sources for better article generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chat } from '@/lib/ai-tools/openrouter-client';
import type { ArticleCategory } from '@/lib/blog/types';
import { isArticleCategory } from '@/lib/blog/types';

// ============================================================================
// Types
// ============================================================================

interface SearchRequest {
  exaKey?: string;
  newsApiKey?: string;
  openRouterKey?: string; // For AI relevance filtering
  query?: string;
  category?: ArticleCategory;
  numResults?: number;
  fetchFullContent?: boolean;
  useAIFilter?: boolean; // Enable AI-based filtering (default: true)
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
// AI Search Agent - Manages entire search process
// ============================================================================

interface AISearchPlan {
  queries: string[];
  reasoning: string;
}

interface AITopicSelection {
  selectedIndex: number;
  title: string;
  relevanceScore: number;
  uniqueAngle: string;
  suggestedCategory: ArticleCategory;
  reasoning: string;
}

/**
 * AI Agent Step 1: Generate smart search queries
 * Creates targeted e-commerce queries based on category and trends
 * NOW WITH EXISTING ARTICLES AWARENESS
 */
async function generateSearchQueries(
  apiKey: string,
  category?: ArticleCategory,
  userQuery?: string,
  existingTitles?: string[]
): Promise<AISearchPlan> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });

  // Build existing articles context
  const existingArticlesContext = existingTitles && existingTitles.length > 0
    ? `\n\n🚨 CRITICAL - AVOID THESE EXISTING TOPICS:
We already have ${existingTitles.length} articles. Your search queries MUST find DIFFERENT topics:

${existingTitles.slice(0, 15).map((t, i) => `${i + 1}. "${t}"`).join('\n')}

DO NOT generate queries that would find similar topics to these existing articles.
Focus on FRESH angles, NEW trends, DIFFERENT aspects of e-commerce.`
    : '';

  const systemPrompt = `You are an expert e-commerce content strategist. Your job is to generate search queries that will find the BEST, most RELEVANT, and UNIQUE topics for an e-commerce blog.

Current date: ${currentDate}

Target audience: Online sellers, e-commerce merchants, dropshippers, Amazon/Shopify sellers, digital marketers

Your queries should find:
- Fresh, trending e-commerce topics
- Actionable strategies and tips
- Industry news and updates
- Success stories and case studies
- Tool reviews and comparisons

${existingArticlesContext}

Generate 3-4 specific search queries that will return HIGH-QUALITY, UNIQUE e-commerce content.

RESPOND WITH JSON ONLY:
{
  "queries": ["query1", "query2", "query3"],
  "reasoning": "Brief explanation of why these queries will find unique topics"
}`;

  const userPrompt = category 
    ? `Generate search queries for UNIQUE e-commerce blog articles in the "${category}" category.${userQuery ? ` User hint: "${userQuery}"` : ''}`
    : `Generate search queries for UNIQUE trending e-commerce blog topics.${userQuery ? ` User hint: "${userQuery}"` : ''}`;

  try {
    console.log('[AI Agent] Generating search queries...');
    
    const response = await chat(apiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 500,
    });

    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]) as AISearchPlan;
      console.log(`[AI Agent] Generated ${plan.queries.length} queries:`, plan.queries);
      return plan;
    }
    
    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('[AI Agent] Query generation failed:', error);
    // Fallback to default queries
    return {
      queries: getDynamicQueries(category).slice(0, 3),
      reasoning: 'Using default queries (AI generation failed)',
    };
  }
}

/**
 * AI Agent Step 2: Evaluate and select the best topic
 * Analyzes all search results and picks the most valuable topic
 * 
 * @param apiKey - OpenRouter API key
 * @param results - Search results to analyze
 * @param category - Optional target category
 * @param existingTitles - Optional list of existing article titles to avoid
 */
async function selectBestTopic(
  apiKey: string,
  results: UnifiedSearchResult[],
  category?: ArticleCategory,
  existingTitles?: string[]
): Promise<{ selected: UnifiedSearchResult | null; analysis: AITopicSelection | null }> {
  if (results.length === 0) {
    return { selected: null, analysis: null };
  }

  // Prepare topics for AI analysis
  const topicsForAnalysis = results.map((r, i) => ({
    index: i,
    title: r.title,
    description: r.text.substring(0, 400),
    source: r.sourceName || r.source,
    publishedDate: r.publishedDate,
  }));

  // Build existing articles warning if provided
  const existingArticlesWarning = existingTitles && existingTitles.length > 0
    ? `\n\n🚨 CRITICAL - REJECT DUPLICATE OR SIMILAR TOPICS:
We have ${existingTitles.length} existing articles. You MUST select a topic that is COMPLETELY DIFFERENT:

${existingTitles.slice(0, 25).map((t, i) => `${i + 1}. "${t}"`).join('\n')}

REJECTION CRITERIA - DO NOT select topics that:
1. Cover the same subject matter (even with different wording)
2. Discuss similar trends, strategies, or tools
3. Target the same problem or solution
4. Use similar keywords or phrases
5. Would result in repetitive or overlapping content

ACCEPTANCE CRITERIA - ONLY select topics that:
1. Introduce a NEW concept, trend, or strategy
2. Focus on a DIFFERENT aspect of e-commerce
3. Target a DIFFERENT audience segment or use case
4. Provide a FRESH perspective not covered before
5. Are at least 70% DIFFERENT from all existing articles

If ALL search results are too similar to existing articles, respond with selectedIndex: -1`
    : '';

  const systemPrompt = `You are an expert e-commerce content curator. Analyze these search results and select the SINGLE BEST topic for a blog article.

SELECTION CRITERIA (in order of importance):
1. UNIQUENESS: Must be SIGNIFICANTLY DIFFERENT from existing articles (MOST IMPORTANT)
2. RELEVANCE: Must be directly about e-commerce, online selling, or digital commerce
3. VALUE: Provides actionable insights for online sellers
4. FRESHNESS: Recent and timely topics preferred
5. ENGAGEMENT: Topic that readers will find interesting

AUTOMATIC REJECTION - Reject topics about:
- General news not related to e-commerce
- Politics, sports, entertainment, celebrities
- Crime, drugs, illegal activities
- Airlines, travel, weather
- TV shows, movies, music
- Topics too similar to existing articles (similarity > 30%)

${existingArticlesWarning}

RESPOND WITH JSON ONLY:
{
  "selectedIndex": <number>,
  "title": "selected topic title",
  "relevanceScore": <0-100>,
  "uniqueAngle": "suggested unique angle for the article",
  "suggestedCategory": "marketing|seller-tools|logistics|trends|case-studies",
  "reasoning": "why this topic is the best choice and how it differs from existing articles"
}

If NO topics are relevant to e-commerce OR all topics are too similar to existing articles, respond with:
{
  "selectedIndex": -1,
  "title": "",
  "relevanceScore": 0,
  "uniqueAngle": "",
  "suggestedCategory": "trends",
  "reasoning": "No relevant or unique e-commerce topics found"
}`;

  const userPrompt = `Analyze these ${topicsForAnalysis.length} topics and select the BEST one for an e-commerce blog${category ? ` (category: ${category})` : ''}:

${JSON.stringify(topicsForAnalysis, null, 2)}

Select the single best topic that will provide the most value to online sellers.`;

  try {
    console.log(`[AI Agent] Analyzing ${results.length} topics to select the best...`);
    
    const response = await chat(apiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.3, // Lower temperature for more consistent selection
      maxTokens: 800,
    });

    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]) as AITopicSelection;
      
      if (analysis.selectedIndex === -1 || analysis.relevanceScore < 40) {
        console.log('[AI Agent] ❌ No relevant topics found');
        return { selected: null, analysis };
      }
      
      const selected = results[analysis.selectedIndex];
      console.log(`[AI Agent] ✅ Selected: "${analysis.title}" (${analysis.relevanceScore}% relevant)`);
      console.log(`[AI Agent] Angle: ${analysis.uniqueAngle}`);
      
      return { selected, analysis };
    }
    
    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('[AI Agent] Topic selection failed:', error);
    // Fallback: return first result
    return { 
      selected: results[0], 
      analysis: null 
    };
  }
}

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

    // Build a more specific e-commerce focused query
    // Always include e-commerce context to avoid irrelevant results
    const ecommerceContext = '(ecommerce OR "e-commerce" OR "online store" OR "online selling" OR Shopify OR WooCommerce OR "Amazon seller" OR dropshipping)';
    
    // Check if query already has e-commerce terms
    const queryLower = query.toLowerCase();
    const hasEcommerceTerms = ['ecommerce', 'e-commerce', 'online store', 'shopify', 'amazon', 'seller', 'dropshipping', 'woocommerce'].some(term => queryLower.includes(term));
    
    // Build enhanced query
    const enhancedQuery = hasEcommerceTerms 
      ? query 
      : `${query} AND ${ecommerceContext}`;

    // Exclude irrelevant topics
    const excludeTerms = '-drugs -illegal -crime -airline -flight -politics -sports -celebrity -weather -war';
    const finalQuery = `${enhancedQuery} ${excludeTerms}`;

    const params = new URLSearchParams({
      q: finalQuery,
      from: fromDateStr,
      sortBy: 'relevancy',
      language: 'en',
      pageSize: String(Math.min(numResults * 4, 40)), // Get more to filter aggressively
      apiKey,
    });

    console.log(`[NewsAPI] Searching: "${finalQuery.substring(0, 100)}..."`);
    console.log(`[NewsAPI] Original query: "${query}"`);


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

    // Basic filtering - AI Agent will do intelligent relevance filtering
    return data.articles
      .filter(article => {
        if (!article.title || !article.url || !article.description) return false;
        if (article.title.includes('[Removed]')) return false;
        if (article.description.length < 50) return false;
        return true;
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
// POST - AI-Managed Multi-Source Search
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
    const openRouterKey = body.openRouterKey || process.env.OPENROUTER_API_KEY;
    
    const hasExaKey = !!exaKey;
    const hasNewsApiKey = !!newsApiKey;
    const hasOpenRouterKey = !!openRouterKey;
    const useAIAgent = body.useAIFilter !== false && hasOpenRouterKey; // Default: true if key available
    
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

    const sourcesUsed: string[] = [];
    let aiSearchPlan: AISearchPlan | null = null;
    let aiTopicSelection: AITopicSelection | null = null;

    // ========================================================================
    // STEP 0: Fetch existing articles FIRST (before search)
    // ========================================================================
    let existingTitles: string[] = [];
    
    if (useAIAgent) {
      try {
        console.log('[AI Agent] Step 0: Fetching existing articles to avoid duplicates...');
        const { getExistingArticlesForDedup } = await import('@/lib/blog/article-generator');
        const existingArticles = await getExistingArticlesForDedup();
        existingTitles = existingArticles.map(a => a.title);
        console.log(`[AI Agent] ✅ Loaded ${existingTitles.length} existing articles for duplicate avoidance`);
      } catch (error) {
        console.error('[AI Agent] ⚠️ Failed to fetch existing articles:', error);
      }
    }

    // ========================================================================
    // STEP 1: AI Agent generates smart search queries (with existing articles context)
    // ========================================================================
    let searchQueries: string[] = [];
    
    if (useAIAgent) {
      console.log('[AI Agent] Step 1: Generating smart search queries...');
      aiSearchPlan = await generateSearchQueries(
        openRouterKey!, 
        body.category, 
        body.query,
        existingTitles  // ← Pass existing titles to avoid similar queries
      );
      searchQueries = aiSearchPlan.queries;
      sourcesUsed.push('ai-agent');
      console.log(`[AI Agent] Generated queries: ${searchQueries.join(' | ')}`);
    } else {
      // Fallback to static queries
      searchQueries = body.query 
        ? [body.query] 
        : getDynamicQueries(body.category).slice(0, 2);
    }

    // ========================================================================
    // STEP 2: Execute searches with AI-generated queries
    // ========================================================================
    console.log(`[Blog Search] Executing ${searchQueries.length} queries across sources...`);
    
    const allSearchPromises: Promise<UnifiedSearchResult[]>[] = [];
    
    for (const query of searchQueries) {
      if (hasExaKey) {
        allSearchPromises.push(searchWithExa(exaKey!, query, 5));
      }
      if (hasNewsApiKey) {
        allSearchPromises.push(searchWithNewsApi(newsApiKey!, query, 5));
      }
    }

    if (hasExaKey) sourcesUsed.push('exa');
    if (hasNewsApiKey) sourcesUsed.push('newsapi');

    // Wait for all searches
    const searchResults = await Promise.all(allSearchPromises);
    
    // Merge all results
    let allResults = searchResults.flat();
    
    console.log(`[Blog Search] Raw results: ${allResults.length}`);

    // If no results, use fallback
    if (allResults.length === 0) {
      console.log('[Blog Search] No results, using fallback');
      allResults = getFallbackResults();
    }

    // Deduplicate results
    const uniqueResults = deduplicateResults(allResults);
    console.log(`[Blog Search] After deduplication: ${uniqueResults.length}`);
    
    // Rank results by score
    let rankedResults = rankResults(uniqueResults);

    // ========================================================================
    // STEP 3: AI Agent selects the best topic (with existing articles awareness)
    // ========================================================================
    let selectedTopic: UnifiedSearchResult | null = null;
    
    if (useAIAgent && rankedResults.length > 0 && !rankedResults.every(r => r.source === 'fallback')) {
      console.log('[AI Agent] Step 2: Selecting best topic from results...');
      const { selected, analysis } = await selectBestTopic(
        openRouterKey!, 
        rankedResults, 
        body.category,
        existingTitles  // ← Pass existing titles to AI Agent
      );
      
      if (selected && analysis && analysis.relevanceScore >= 40) {
        selectedTopic = selected;
        aiTopicSelection = analysis;
        
        // Move selected topic to top and boost its score
        rankedResults = [
          { ...selected, score: 1.0 },
          ...rankedResults.filter(r => r.url !== selected.url),
        ];
        
        console.log(`[AI Agent] ✅ Selected: "${analysis.title}" (${analysis.relevanceScore}% relevant)`);
        console.log(`[AI Agent] Unique angle: ${analysis.uniqueAngle}`);
      } else {
        console.log('[AI Agent] ⚠️ No highly relevant topic found, using top ranked result');
      }
    }

    // ========================================================================
    // STEP 4: Fetch full content for top results
    // ========================================================================
    if (body.fetchFullContent !== false && rankedResults.length > 0) {
      rankedResults = await enrichResultsWithContent(rankedResults, 3);
    }

    // Check if using fallback
    const usingFallback = rankedResults.every(r => r.source === 'fallback');

    console.log(`[Blog Search] ✅ Final: ${rankedResults.length} results (AI Agent: ${useAIAgent})`);

    // ========================================================================
    // Return response with AI analysis
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        query: searchQueries[0], // Primary query
        results: rankedResults,
        totalResults: rankedResults.length,
        sourcesUsed,
        usingFallback,
        aiAgentUsed: useAIAgent,
        // AI Agent analysis details
        aiAnalysis: useAIAgent ? {
          searchPlan: aiSearchPlan,
          topicSelection: aiTopicSelection,
          selectedTopic: selectedTopic ? {
            title: selectedTopic.title,
            url: selectedTopic.url,
            relevanceScore: aiTopicSelection?.relevanceScore || 0,
            uniqueAngle: aiTopicSelection?.uniqueAngle || '',
            suggestedCategory: aiTopicSelection?.suggestedCategory || body.category,
          } : null,
        } : null,
        message: usingFallback 
          ? 'Using cached topics (external APIs unavailable)' 
          : useAIAgent && aiTopicSelection
            ? `AI selected: "${aiTopicSelection.title}" (${aiTopicSelection.relevanceScore}% relevant)`
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
