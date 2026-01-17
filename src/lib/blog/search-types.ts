/**
 * Type definitions for blog search functionality
 */

import type { ArticleCategory } from './types';

export interface SearchRequest {
  exaKey?: string;
  newsApiKey?: string;
  openRouterKey?: string;
  query?: string;
  category?: ArticleCategory;
  numResults?: number;
  fetchFullContent?: boolean;
  useAIFilter?: boolean;
}

export interface UnifiedSearchResult {
  title: string;
  url: string;
  publishedDate: string;
  score: number;
  text: string;
  source: 'exa' | 'newsapi' | 'fallback';
  sourceName?: string;
  author?: string;
  imageUrl?: string;
  fullContent?: string;
}

export interface ExaApiResponse {
  results: Array<{
    title: string;
    url: string;
    publishedDate?: string;
    score?: number;
    text?: string;
    highlights?: string[];
  }>;
}

export interface NewsApiResponse {
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

export interface AISearchPlan {
  queries: string[];
  reasoning: string;
}

export interface AITopicSelection {
  selectedIndex: number;
  title: string;
  relevanceScore: number;
  uniqueAngle: string;
  suggestedCategory: ArticleCategory;
  reasoning: string;
}

export interface AIFilterStats {
  totalResults: number;
  filteredResults: number;
  rejectedResults: number;
  filteringEnabled: boolean;
}
