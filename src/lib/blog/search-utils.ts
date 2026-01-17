/**
 * Utility functions for blog search
 */

import type { UnifiedSearchResult } from './search-types';

/**
 * Calculate recency score (0-1, higher = more recent)
 */
export function calculateRecencyScore(publishedDate?: string): number {
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

/**
 * Calculate similarity between two titles
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
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

/**
 * Deduplicate results by URL and similar titles
 */
export function deduplicateResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
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

/**
 * Rank results by combined score
 */
export function rankResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  return results.sort((a, b) => {
    const contentBonus = (r: UnifiedSearchResult) => r.text.length > 1000 ? 0.1 : 0;
    const sourceBonus = (r: UnifiedSearchResult) => r.source === 'newsapi' ? 0.05 : 0;
    
    const scoreA = a.score + contentBonus(a) + sourceBonus(a);
    const scoreB = b.score + contentBonus(b) + sourceBonus(b);
    
    return scoreB - scoreA;
  });
}

/**
 * Extract text content from HTML
 */
export function extractTextFromHtml(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  } else {
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      text = mainMatch[1];
    }
  }

  text = text.replace(/<[^>]+>/g, ' ');
  
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
 * Fetch full content from a URL
 */
export async function fetchFullContent(url: string): Promise<string | null> {
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
    const textContent = extractTextFromHtml(html);
    
    return textContent.substring(0, 5000);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Enrich results with full content from top sources
 */
export async function enrichResultsWithContent(
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
