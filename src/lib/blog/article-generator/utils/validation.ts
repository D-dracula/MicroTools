/**
 * Validation Utilities
 * 
 * وظائف التحقق من صحة البيانات
 */

import type { ExaSearchResult, ArticleCategory } from '@/lib/blog/types';
import { CATEGORY_KEYWORDS } from '../constants/config';

// ============================================================================
// Search Results Validation
// ============================================================================

/**
 * التحقق من صحة نتائج البحث
 * يصفي النتائج التي تحتوي على محتوى غير كافٍ
 * 
 * @param results - نتائج البحث من Exa
 * @returns نتائج صالحة فقط
 */
export function validateSearchResults(
  results: ExaSearchResult[]
): ExaSearchResult[] {
  return results.filter(result =>
    result.title &&
    result.url &&
    result.text &&
    result.text.length > 100
  );
}

// ============================================================================
// Category Classification
// ============================================================================

/**
 * تحديد فئة المقالة بناءً على الكلمات المفتاحية في المحتوى
 * 
 * @param title - عنوان المقالة
 * @param text - نص المقالة
 * @returns الفئة المقترحة
 */
export function classifyCategory(title: string, text: string): ArticleCategory {
  const content = `${title} ${text}`.toLowerCase();

  let bestCategory: ArticleCategory = 'trends'; // افتراضي
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((acc, keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = content.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as ArticleCategory;
    }
  }

  return bestCategory;
}

// ============================================================================
// Content Validation
// ============================================================================

/**
 * التحقق من أن المحتوى يحتوي على الحد الأدنى من الكلمات
 * 
 * @param content - محتوى المقالة
 * @param minWords - الحد الأدنى لعدد الكلمات
 * @returns true إذا كان المحتوى صالحاً
 */
export function validateContentLength(
  content: string,
  minWords: number
): boolean {
  const wordCount = content.trim().split(/\s+/).length;
  return wordCount >= minWords;
}

/**
 * التحقق من أن المحتوى يحتوي على عناصر HTML مطلوبة
 * 
 * @param content - محتوى المقالة
 * @returns true إذا كان المحتوى يحتوي على عناصر HTML
 */
export function validateHtmlElements(content: string): boolean {
  // التحقق من وجود عناصر HTML أساسية
  const hasHeadings = /<h[2-3]>/i.test(content);
  const hasParagraphs = /<p>|##/i.test(content);

  return hasHeadings && hasParagraphs;
}

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * التحقق من صحة مفتاح API
 * 
 * @param apiKey - مفتاح API
 * @returns true إذا كان المفتاح صالحاً
 */
export function validateApiKey(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.length > 0;
}
