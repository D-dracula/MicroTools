/**
 * Similarity Calculation Utilities
 * 
 * وظائف حساب التشابه بين النصوص والمواضيع
 */

import { STOP_WORDS, KEYWORD_SIMILARITY_WEIGHT, NGRAM_SIMILARITY_WEIGHT } from '../constants/config';
import type { ExistingArticleInfo } from '../types';

// ============================================================================
// Keyword Extraction
// ============================================================================

/**
 * استخراج الكلمات المفتاحية من النص
 * يزيل الكلمات الشائعة ويطبع النص
 * 
 * @param text - النص المراد استخراج الكلمات منه
 * @returns مصفوفة من الكلمات المفتاحية
 */
export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 20); // الاحتفاظ بأفضل 20 كلمة مفتاحية
}

// ============================================================================
// Jaccard Similarity
// ============================================================================

/**
 * حساب تشابه Jaccard بين مجموعتين من الكلمات المفتاحية
 * يعيد قيمة بين 0 (لا تشابه) و 1 (متطابق)
 * 
 * @param keywords1 - المجموعة الأولى من الكلمات المفتاحية
 * @param keywords2 - المجموعة الثانية من الكلمات المفتاحية
 * @returns درجة التشابه (0-1)
 */
export function calculateJaccardSimilarity(
  keywords1: string[],
  keywords2: string[]
): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ============================================================================
// N-gram Similarity
// ============================================================================

/**
 * استخراج bigrams (تسلسلات من كلمتين) من النص
 * 
 * @param text - النص المراد استخراج bigrams منه
 * @returns مجموعة من bigrams
 */
function getBigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }

  return bigrams;
}

/**
 * حساب تشابه n-gram لمطابقة أفضل للعبارات
 * يستخدم bigrams (تسلسلات من كلمتين) لمزيد من السياق
 * 
 * @param text1 - النص الأول
 * @param text2 - النص الثاني
 * @returns درجة التشابه (0-1)
 */
export function calculateNgramSimilarity(text1: string, text2: string): number {
  const bigrams1 = getBigrams(text1);
  const bigrams2 = getBigrams(text2);

  if (bigrams1.size === 0 || bigrams2.size === 0) return 0;

  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) intersection++;
  }

  const union = bigrams1.size + bigrams2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ============================================================================
// Combined Similarity
// ============================================================================

/**
 * حساب درجة التشابه المركبة بين موضوعين
 * يستخدم كلاً من تشابه الكلمات المفتاحية و n-gram لدقة أفضل
 * 
 * @param newTopic - الموضوع الجديد
 * @param existingArticle - المقالة الموجودة
 * @returns درجة التشابه المركبة (0-1)
 */
export function calculateTopicSimilarity(
  newTopic: { title: string; text?: string },
  existingArticle: ExistingArticleInfo
): number {
  // تشابه العنوان (وزن أعلى)
  const newTitleKeywords = extractKeywords(newTopic.title);
  const titleSimilarity = calculateJaccardSimilarity(
    newTitleKeywords,
    existingArticle.keywords
  );

  // تشابه N-gram للعنوان
  const ngramSimilarity = calculateNgramSimilarity(
    newTopic.title,
    existingArticle.title
  );

  // الدرجة المركبة: 50% كلمات مفتاحية، 50% n-gram
  return (
    titleSimilarity * KEYWORD_SIMILARITY_WEIGHT +
    ngramSimilarity * NGRAM_SIMILARITY_WEIGHT
  );
}
