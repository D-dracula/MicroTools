/**
 * Deduplication System
 * 
 * نظام منع تكرار المواضيع والمقالات
 */

import { createAdminClient } from '@/lib/supabase/client';
import { SIMILARITY_THRESHOLD, DUPLICATE_CHECK_LIMIT } from '../constants/config';
import { extractKeywords, calculateTopicSimilarity } from '../utils/similarity';
import type { ExaSearchResult } from '@/lib/blog/types';
import type {
  ExistingArticleInfo,
  DuplicationCheckResult,
  FilteredTopicsResult,
} from '../types';

// ============================================================================
// Fetch Existing Articles
// ============================================================================

/**
 * جلب عناوين المقالات الموجودة والكلمات المفتاحية من قاعدة البيانات
 * 
 * @returns مصفوفة من معلومات المقالات الموجودة لمنع التكرار
 */
export async function getExistingArticlesForDedup(): Promise<ExistingArticleInfo[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('articles' as any)
    .select('title, sources')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(DUPLICATE_CHECK_LIMIT);

  if (error) {
    console.error('Failed to fetch existing articles for dedup:', error);
    return [];
  }

  return (data || []).map((row: any) => {
    const sources = Array.isArray(row.sources) ? row.sources : [];
    const urls = sources.map((s: any) => s.url).filter(Boolean);
    return {
      title: row.title,
      keywords: extractKeywords(row.title),
      urls,
    };
  });
}

// ============================================================================
// Check Topic Duplication
// ============================================================================

/**
 * التحقق من أن الموضوع مشابه جداً للمقالات الموجودة
 * 
 * @param topic - الموضوع الجديد للتحقق منه
 * @param existingArticles - قائمة المقالات الموجودة
 * @returns كائن مع علامة isDuplicate والمقالة الأكثر تشابهاً إن وجدت
 */
export function checkTopicDuplication(
  topic: { title: string; url?: string; text?: string },
  existingArticles: ExistingArticleInfo[]
): DuplicationCheckResult {
  let maxSimilarity = 0;
  let mostSimilarTitle = '';

  for (const existing of existingArticles) {
    // 1. التحقق من تطابق URL (100% مكرر إذا تطابق URL)
    if (topic.url && existing.urls.includes(topic.url)) {
      maxSimilarity = 1.0;
      mostSimilarTitle = existing.title;
      break;
    }

    // 2. التحقق من تشابه العنوان
    const similarity = calculateTopicSimilarity(topic, existing);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarTitle = existing.title;
    }

    // تسجيل التطابقات العالية للتصحيح
    if (similarity >= SIMILARITY_THRESHOLD * 0.8) {
      console.log(
        `🔍 Similarity check: "${topic.title}" vs "${existing.title}" = ${(similarity * 100).toFixed(1)}%`
      );
    }
  }

  const isDuplicate = maxSimilarity >= SIMILARITY_THRESHOLD;

  if (isDuplicate) {
    console.log(
      `❌ DUPLICATE DETECTED: "${topic.title}" is ${(maxSimilarity * 100).toFixed(1)}% similar to "${mostSimilarTitle}"`
    );
  } else if (maxSimilarity > 0.2) {
    console.log(
      `✅ UNIQUE: "${topic.title}" (max similarity: ${(maxSimilarity * 100).toFixed(1)}% with "${mostSimilarTitle}")`
    );
  }

  return {
    isDuplicate,
    similarTo: isDuplicate ? mostSimilarTitle : undefined,
    similarity: maxSimilarity,
  };
}

// ============================================================================
// Filter Duplicate Topics
// ============================================================================

/**
 * تصفية المواضيع المكررة من نتائج البحث
 * 
 * @param results - نتائج بحث Exa
 * @param existingArticles - المقالات الموجودة للمقارنة
 * @returns النتائج المصفاة مع إزالة المكررات
 */
export function filterDuplicateTopics(
  results: ExaSearchResult[],
  existingArticles: ExistingArticleInfo[]
): FilteredTopicsResult {
  const filtered: ExaSearchResult[] = [];
  const skipped: Array<{ title: string; similarTo: string; similarity: number }> = [];

  for (const result of results) {
    const dupCheck = checkTopicDuplication(
      { title: result.title, url: result.url, text: result.text },
      existingArticles
    );

    if (dupCheck.isDuplicate) {
      skipped.push({
        title: result.title,
        similarTo: dupCheck.similarTo || '',
        similarity: dupCheck.similarity,
      });
      console.log(
        `⚠️ Skipping duplicate topic: "${result.title}" (${(dupCheck.similarity * 100).toFixed(0)}% similar to "${dupCheck.similarTo}")`
      );
    } else {
      filtered.push(result);
    }
  }

  if (skipped.length > 0) {
    console.log(
      `📊 Topic deduplication: ${filtered.length} unique, ${skipped.length} duplicates skipped`
    );
  }

  return { filtered, skipped };
}
