/**
 * AI Agent for intelligent search query generation, filtering, and topic selection
 */

import { chat } from '@/lib/ai-tools/openrouter-client';
import type { ArticleCategory } from './types';
import type { AISearchPlan, AITopicSelection, UnifiedSearchResult } from './search-types';
import { getDynamicQueries } from './search-constants';

interface FilteredResult {
  index: number;
  isRelevant: boolean;
  relevanceScore: number;
  reason: string;
}

interface AIFilterResponse {
  results: FilteredResult[];
  summary: string;
}

/**
 * AI Agent Step 1.5: Filter search results for relevance
 * Filters out irrelevant results before topic selection
 */
export async function filterSearchResults(
  apiKey: string,
  results: UnifiedSearchResult[],
  category?: ArticleCategory,
  existingTitles?: string[]
): Promise<UnifiedSearchResult[]> {
  if (results.length === 0) {
    return [];
  }

  // Prepare results for AI analysis
  const resultsForAnalysis = results.map((r, i) => ({
    index: i,
    title: r.title,
    description: r.text.substring(0, 300),
    source: r.sourceName || r.source,
    url: r.url,
  }));

  // Build existing articles context
  const existingArticlesContext = existingTitles && existingTitles.length > 0
    ? `\n\nExisting articles to avoid (${existingTitles.length} total):
${existingTitles.slice(0, 100).map((t, i) => `${i + 1}. "${t}"`).join('\n')}`
    : '';

  const systemPrompt = `You are an expert e-commerce content filter. Your job is to evaluate search results and filter out:

1. ❌ NON-ECOMMERCE TOPICS:
   - General news (politics, sports, entertainment, celebrities)
   - Crime, drugs, illegal activities
   - Airlines, travel, weather
   - TV shows, movies, music
   - Topics not related to online business

2. ❌ DUPLICATE/SIMILAR TOPICS:
   - Topics too similar to existing articles (>30% similarity)
   - Repetitive content with different wording
   - Same strategies/tools already covered

3. ✅ ACCEPT ONLY:
   - E-commerce strategies and tips
   - Online selling tools and platforms
   - Digital marketing for online stores
   - Logistics and fulfillment
   - Success stories and case studies
   - Industry trends and innovations

${existingArticlesContext}

For each result, provide:
- isRelevant: true/false
- relevanceScore: 0-100 (how relevant to e-commerce)
- reason: Brief explanation

RESPOND WITH JSON ONLY:
{
  "results": [
    {
      "index": 0,
      "isRelevant": true,
      "relevanceScore": 85,
      "reason": "Discusses e-commerce marketing strategies"
    }
  ],
  "summary": "Filtered X results: Y relevant, Z rejected"
}`;

  const userPrompt = `Filter these ${resultsForAnalysis.length} search results for e-commerce relevance${category ? ` (category: ${category})` : ''}:

${JSON.stringify(resultsForAnalysis, null, 2)}

Return only results that are highly relevant to e-commerce and NOT similar to existing articles.`;

  try {
    console.log(`[AI Filter] Analyzing ${results.length} results for relevance...`);

    const response = await chat(apiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.2, // Low temperature for consistent filtering
      maxTokens: 2000,
    });

    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const filterResponse = JSON.parse(jsonMatch[0]) as AIFilterResponse;

      // Filter results based on AI analysis
      const filteredResults = filterResponse.results
        .filter((r: FilteredResult) => r.isRelevant && r.relevanceScore >= 60)
        .map((r: FilteredResult) => results[r.index])
        .filter((result): result is UnifiedSearchResult => result !== undefined);

      console.log(`[AI Filter] ✅ ${filterResponse.summary}`);
      console.log(`[AI Filter] Kept ${filteredResults.length}/${results.length} results`);

      return filteredResults;
    }

    throw new Error('Failed to parse AI filter response');
  } catch (error) {
    console.error('[AI Filter] Filtering failed:', error);
    // Fallback: return all results if filtering fails
    console.log('[AI Filter] ⚠️ Returning all results (filtering failed)');
    return results;
  }
}

/**
 * AI Agent Step 1: Generate smart search queries
 * Creates targeted e-commerce queries based on category and trends
 */
export async function generateSearchQueries(
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

  const existingArticlesContext = existingTitles && existingTitles.length > 0
    ? `\n\n🚨 CRITICAL - AVOID THESE EXISTING TOPICS:
We already have ${existingTitles.length} articles. Your search queries MUST find DIFFERENT topics:

${existingTitles.slice(0, 100).map((t, i) => `${i + 1}. "${t}"`).join('\n')}

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
  "reasoning": "Why these specific queries differ from past articles and cover new ground"
}

VARIETY IS KEY: Generate queries that approach the category from different angles (e.g., technical, business, consumer-centric, trend-focused).`;

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
    return {
      queries: getDynamicQueries(category).slice(0, 3),
      reasoning: 'Using default queries (AI generation failed)',
    };
  }
}

/**
 * AI Agent Step 2: Evaluate and select the best topic
 * Analyzes all search results and picks the most valuable topic
 */
export async function selectBestTopic(
  apiKey: string,
  results: UnifiedSearchResult[],
  category?: ArticleCategory,
  existingTitles?: string[]
): Promise<{ selected: UnifiedSearchResult | null; analysis: AITopicSelection | null }> {
  if (results.length === 0) {
    return { selected: null, analysis: null };
  }

  const topicsForAnalysis = results.map((r, i) => ({
    index: i,
    title: r.title,
    description: r.text.substring(0, 400),
    source: r.sourceName || r.source,
    publishedDate: r.publishedDate,
  }));

  const existingArticlesWarning = existingTitles && existingTitles.length > 0
    ? `\n\n🚨 CRITICAL - REJECT DUPLICATE OR SIMILAR TOPICS:
We have ${existingTitles.length} existing articles. You MUST select a topic that is COMPLETELY DIFFERENT:

${existingTitles.slice(0, 150).map((t, i) => `${i + 1}. "${t}"`).join('\n')}

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
      temperature: 0.3,
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
    return {
      selected: results[0],
      analysis: null
    };
  }
}
