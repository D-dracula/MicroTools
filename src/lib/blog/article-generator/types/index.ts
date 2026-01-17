/**
 * Article Generator Types
 * 
 * جميع الأنواع المستخدمة في نظام مولد المقالات
 */

import type {
  Article,
  ArticleCategory,
  ArticleSource,
  ExaSearchResult,
  GenerationStatus,
  GenerationProgress,
} from '@/lib/blog/types';

// Import isArticleCategory as a value (not type)
import { isArticleCategory } from '@/lib/blog/types';

// Re-export types from blog/types
export type {
  Article,
  ArticleCategory,
  ArticleSource,
  ExaSearchResult,
  GenerationStatus,
  GenerationProgress,
};

// Re-export isArticleCategory function
export { isArticleCategory };


// ============================================================================
// Topic Types
// ============================================================================

/** موضوع مع نقاط للاختيار */
export interface ScoredTopic {
  title: string;
  url: string;
  text: string;
  publishedDate: string;
  relevanceScore: number;
  recencyScore: number;
  combinedScore: number;
  suggestedCategory: ArticleCategory;
}

// ============================================================================
// Generation Types
// ============================================================================

/** نتيجة إنشاء المقالة */
export interface GenerationResult {
  success: boolean;
  article?: Article;
  error?: GenerationError;
}

/** أنواع أخطاء الإنشاء */
export interface GenerationError {
  code:
  | 'RATE_LIMIT_EXCEEDED'
  | 'EXA_SEARCH_FAILED'
  | 'NO_TOPICS_FOUND'
  | 'CONTENT_GENERATION_FAILED'
  | 'SAVE_FAILED'
  | 'UNAUTHORIZED';
  message: string;
  resetAt?: Date;
  suggestions?: string[];
}

/** خيارات إنشاء المقالة */
export interface GenerationOptions {
  category?: ArticleCategory;
  maxRetries?: number;
  onProgress?: ProgressCallback;
}

/** دالة رد الاتصال للتقدم */
export type ProgressCallback = (progress: GenerationProgress) => void;

// ============================================================================
// Deduplication Types
// ============================================================================

/** معلومات المقالة الموجودة لمنع التكرار */
export interface ExistingArticleInfo {
  title: string;
  keywords: string[];
  urls: string[];
}

/** نتيجة فحص التكرار */
export interface DuplicationCheckResult {
  isDuplicate: boolean;
  similarTo?: string;
  similarity: number;
}

/** نتيجة تصفية المواضيع المكررة */
export interface FilteredTopicsResult {
  filtered: ExaSearchResult[];
  skipped: SkippedTopic[];
}

/** موضوع تم تخطيه بسبب التكرار */
export interface SkippedTopic {
  title: string;
  similarTo: string;
  similarity: number;
}

// ============================================================================
// Rate Limit Types
// ============================================================================

/** نتيجة فحص الحد الأقصى */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  generatedToday: number;
}

// ============================================================================
// Article Data Types
// ============================================================================

/** بيانات المقالة المولدة */
export interface GeneratedArticleData {
  title: string;
  summary: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  sources: ArticleSource[];
  metaTitle: string;
  metaDescription: string;
}

// ============================================================================
// API Types
// ============================================================================

/** طلب إنشاء مقالة */
export interface GenerateArticleRequest {
  apiKey: string;
  category?: ArticleCategory;
  exaResults?: ExaSearchResult[];
  maxRetries?: number;
}

/** استجابة إنشاء مقالة */
export interface GenerateArticleResponse {
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
