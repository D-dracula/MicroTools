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
import { isArticleCategory } from '@/lib/blog/types';
import type { SearchRequest, AISearchPlan, AITopicSelection, UnifiedSearchResult, AIFilterStats } from '@/lib/blog/search-types';
import { getDynamicQueries, getFallbackResults } from '@/lib/blog/search-constants';
import { searchWithNewsApi, searchWithExa } from '@/lib/blog/search-providers';
import { deduplicateResults, rankResults, enrichResultsWithContent } from '@/lib/blog/search-utils';
import { generateSearchQueries, selectBestTopic, filterSearchResults } from '@/lib/blog/search-ai-agent';

/**
 * Check if user has admin access
 */
async function checkAdminAccess(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(session.user.email.toLowerCase());
}

/**
 * POST - AI-Managed Multi-Source Search
 */
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

    // Check for API keys
    const exaKey = body.exaKey || process.env.EXA_API_KEY;
    const newsApiKey = body.newsApiKey || process.env.NEWSAPI_KEY;
    const openRouterKey = body.openRouterKey || process.env.OPENROUTER_API_KEY;
    
    const hasExaKey = !!exaKey;
    const hasNewsApiKey = !!newsApiKey;
    const hasOpenRouterKey = !!openRouterKey;
    const useAIAgent = body.useAIFilter !== false && hasOpenRouterKey;
    
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
    let aiFilterStats: AIFilterStats = {
      totalResults: 0,
      filteredResults: 0,
      rejectedResults: 0,
      filteringEnabled: useAIAgent,
    };

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
    // STEP 1: AI Agent generates smart search queries
    // ========================================================================
    let searchQueries: string[] = [];
    
    if (useAIAgent) {
      console.log('[AI Agent] Step 1: Generating smart search queries...');
      aiSearchPlan = await generateSearchQueries(
        openRouterKey!, 
        body.category, 
        body.query,
        existingTitles
      );
      searchQueries = aiSearchPlan.queries;
      sourcesUsed.push('ai-agent');
      console.log(`[AI Agent] Generated queries: ${searchQueries.join(' | ')}`);
    } else {
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
        allSearchPromises.push(searchWithExa(exaKey!, query, 10));
      }
      if (hasNewsApiKey) {
        allSearchPromises.push(searchWithNewsApi(newsApiKey!, query, 10));
      }
    }

    if (hasExaKey) sourcesUsed.push('exa');
    if (hasNewsApiKey) sourcesUsed.push('newsapi');

    const searchResults = await Promise.all(allSearchPromises);
    let allResults = searchResults.flat();
    
    console.log(`[Blog Search] Raw results: ${allResults.length}`);

    // If no results, use fallback
    if (allResults.length === 0) {
      console.log('[Blog Search] No results, using fallback');
      allResults = getFallbackResults();
    }

    // Deduplicate and rank results
    const uniqueResults = deduplicateResults(allResults);
    console.log(`[Blog Search] After deduplication: ${uniqueResults.length}`);
    
    let rankedResults = rankResults(uniqueResults);

    // ========================================================================
    // STEP 2.5: AI Agent filters results for relevance (NEW)
    // ========================================================================
    if (useAIAgent && rankedResults.length > 0 && !rankedResults.every(r => r.source === 'fallback')) {
      const beforeFilterCount = rankedResults.length;
      console.log(`[AI Filter] Step 2.5: Filtering ${beforeFilterCount} results for relevance...`);
      
      rankedResults = await filterSearchResults(
        openRouterKey!,
        rankedResults,
        body.category,
        existingTitles
      );
      
      const afterFilterCount = rankedResults.length;
      aiFilterStats = {
        totalResults: beforeFilterCount,
        filteredResults: afterFilterCount,
        rejectedResults: beforeFilterCount - afterFilterCount,
        filteringEnabled: true,
      };
      
      console.log(`[AI Filter] ✅ Kept ${afterFilterCount}/${beforeFilterCount} results (rejected ${beforeFilterCount - afterFilterCount})`);
    }

    // ========================================================================
    // STEP 3: AI Agent selects the best topic
    // ========================================================================
    let selectedTopic: UnifiedSearchResult | null = null;
    
    if (useAIAgent && rankedResults.length > 0 && !rankedResults.every(r => r.source === 'fallback')) {
      console.log(`[AI Agent] Step 2: Selecting best topic from ${rankedResults.length} results...`);
      const { selected, analysis } = await selectBestTopic(
        openRouterKey!, 
        rankedResults,
        body.category,
        existingTitles
      );
      
      if (selected && analysis && analysis.relevanceScore >= 40) {
        selectedTopic = selected;
        aiTopicSelection = analysis;
        
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

    const usingFallback = rankedResults.every(r => r.source === 'fallback');

    console.log(`[Blog Search] ✅ Final: ${rankedResults.length} results (AI Agent: ${useAIAgent})`);

    // ========================================================================
    // Return response with AI analysis
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        query: searchQueries[0],
        results: rankedResults,
        totalResults: rankedResults.length,
        sourcesUsed,
        usingFallback,
        aiAgentUsed: useAIAgent,
        aiAnalysis: useAIAgent ? {
          searchPlan: aiSearchPlan,
          filterStats: aiFilterStats,
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
            ? `AI selected: "${aiTopicSelection.title}" (${aiTopicSelection.relevanceScore}% relevant, filtered ${aiFilterStats.rejectedResults} irrelevant results)`
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
