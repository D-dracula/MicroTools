/**
 * External search provider integrations (NewsAPI, Exa)
 */

import type { UnifiedSearchResult, ExaApiResponse, NewsApiResponse } from './search-types';
import { EXCLUDED_DOMAINS } from './search-constants';
import { calculateRecencyScore } from './search-utils';

/**
 * Search with NewsAPI (Free Plan Compatible)
 */
export async function searchWithNewsApi(
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

    // Build e-commerce focused query
    const ecommerceContext = '(ecommerce OR "e-commerce" OR "online store" OR "online selling" OR Shopify OR WooCommerce OR "Amazon seller" OR dropshipping)';
    
    const queryLower = query.toLowerCase();
    const hasEcommerceTerms = ['ecommerce', 'e-commerce', 'online store', 'shopify', 'amazon', 'seller', 'dropshipping', 'woocommerce'].some(term => queryLower.includes(term));
    
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
      pageSize: String(Math.min(numResults * 4, 40)),
      apiKey,
    });

    console.log(`[NewsAPI] Searching: "${finalQuery.substring(0, 100)}..."`);

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

/**
 * Search with Exa AI
 */
export async function searchWithExa(
  apiKey: string,
  query: string,
  numResults: number = 5
): Promise<UnifiedSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const enhancedQuery = `${query} e-commerce online retail business`;

    console.log(`[Exa] Searching: "${enhancedQuery}"`);

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
