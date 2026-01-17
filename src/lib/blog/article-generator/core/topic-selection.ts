/**
 * Topic Selection System
 * 
 * نظام اختيار أفضل موضوع من نتائج البحث
 */

import { validateSearchResults, classifyCategory } from '../utils/validation';
import { scoreTopicResult } from '../utils/scoring';
import { filterDuplicateTopics } from './deduplication';
import type { ExaSearchResult } from '@/lib/blog/types';
import type {
  ScoredTopic,
  ExistingArticleInfo,
} from '../types';

// ============================================================================
// Process Search Results
// ============================================================================

/**
 * معالجة نتائج بحث Exa
 * يصفي النتائج التي تحتوي على محتوى غير كافٍ
 * 
 * @param searchResults - نتائج من بحث Exa
 * @returns مصفوفة من نتائج البحث الصالحة
 */
export function processExaResults(
  searchResults: ExaSearchResult[]
): ExaSearchResult[] {
  return validateSearchResults(searchResults);
}

// ============================================================================
// Select Best Topic
// ============================================================================

/**
 * اختيار أفضل موضوع من نتائج البحث
 * 
 * @param results - نتائج بحث Exa
 * @param existingArticles - مقالات موجودة اختيارية لمنع التكرار
 * @returns أفضل موضوع مع النقاط
 */
export function selectBestTopic(
  results: ExaSearchResult[],
  existingArticles?: ExistingArticleInfo[]
): ScoredTopic | null {
  if (!results || results.length === 0) {
    return null;
  }

  // تصفية المكررات إذا تم توفير مقالات موجودة
  let filteredResults = results;
  if (existingArticles && existingArticles.length > 0) {
    const { filtered, skipped } = filterDuplicateTopics(results, existingArticles);
    filteredResults = filtered;

    if (filteredResults.length === 0) {
      console.log(
        '⚠️ All topics were duplicates. Skipped topics:',
        skipped.map(s => s.title)
      );
      return null;
    }
  }

  // تسجيل وترتيب جميع المواضيع
  const scoredTopics: ScoredTopic[] = filteredResults.map(result => {
    const scores = scoreTopicResult(result);

    return {
      title: result.title,
      url: result.url,
      text: result.text,
      publishedDate: result.publishedDate,
      ...scores,
      suggestedCategory: classifyCategory(result.title, result.text),
    };
  });

  // الترتيب حسب الدرجة المركبة (الأعلى أولاً)
  scoredTopics.sort((a, b) => b.combinedScore - a.combinedScore);

  return scoredTopics[0];
}
