/**
 * Scoring Utilities
 * 
 * وظائف حساب النقاط للمواضيع والمقالات
 */

import { RELEVANCE_WEIGHT, RECENCY_WEIGHT } from '../constants/config';

// ============================================================================
// Recency Score
// ============================================================================

/**
 * حساب درجة الحداثة بناءً على تاريخ النشر
 * الأحدث = درجة أعلى (0-1)
 * 
 * @param publishedDate - تاريخ النشر بصيغة ISO
 * @returns درجة الحداثة (0-1)
 */
export function calculateRecencyScore(publishedDate: string): number {
  if (!publishedDate) return 0.5; // افتراضي للتواريخ غير المعروفة

  try {
    const published = new Date(publishedDate);
    const now = new Date();
    const daysSincePublished =
      (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);

    // الدرجة تنخفض مع العمر:
    // 1.0 لليوم، ~0.5 لـ 30 يوماً، ~0.1 لـ 90+ يوماً
    if (daysSincePublished <= 0) return 1.0;
    if (daysSincePublished <= 7) return 0.9;
    if (daysSincePublished <= 30) return 0.7;
    if (daysSincePublished <= 60) return 0.5;
    if (daysSincePublished <= 90) return 0.3;
    return 0.1;
  } catch {
    return 0.5;
  }
}

// ============================================================================
// Combined Score
// ============================================================================

/**
 * حساب الدرجة المركبة من درجة الصلة والحداثة
 * 
 * @param relevanceScore - درجة الصلة (0-1)
 * @param recencyScore - درجة الحداثة (0-1)
 * @returns الدرجة المركبة (0-1)
 */
export function calculateCombinedScore(
  relevanceScore: number,
  recencyScore: number
): number {
  return (
    relevanceScore * RELEVANCE_WEIGHT +
    recencyScore * RECENCY_WEIGHT
  );
}

// ============================================================================
// Topic Scoring
// ============================================================================

/**
 * حساب جميع النقاط لموضوع
 * 
 * @param topic - الموضوع المراد تسجيله
 * @returns كائن يحتوي على جميع النقاط
 */
export function scoreTopicResult(topic: {
  publishedDate: string;
  score?: number;
}): {
  relevanceScore: number;
  recencyScore: number;
  combinedScore: number;
} {
  const recencyScore = calculateRecencyScore(topic.publishedDate);
  const relevanceScore = topic.score || 0.5;
  const combinedScore = calculateCombinedScore(relevanceScore, recencyScore);

  return {
    relevanceScore,
    recencyScore,
    combinedScore,
  };
}
