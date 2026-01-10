/**
 * Word Counter Logic
 * 
 * Counts words, characters, sentences, and provides SEO recommendations.
 * Supports both Arabic and English text counting.
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

export interface WordCountInput {
  text: string;
  language: 'ar' | 'en';
}

export interface WordCountResult {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  seoStatus: 'short' | 'optimal' | 'long';
  recommendations: string[];
}

// Average reading speed in words per minute
const READING_SPEED_WPM = 200;

// SEO thresholds for product descriptions
const SEO_MIN_WORDS = 100;
const SEO_OPTIMAL_MIN = 150;
const SEO_OPTIMAL_MAX = 300;
const SEO_MAX_WORDS = 500;

/**
 * Counts words in English text.
 * Requirements: 13.1
 */
export function countEnglishWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  
  // Split by whitespace and filter empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Counts words in Arabic text.
 * Handles Arabic word boundaries correctly.
 * Requirements: 13.4
 */
export function countArabicWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  
  // Remove diacritics (tashkeel) for accurate counting
  const cleanText = text.replace(/[\u064B-\u065F\u0670]/g, '');
  
  // Split by whitespace and filter empty strings
  // Arabic words are separated by spaces just like English
  const words = cleanText.trim().split(/\s+/).filter(word => {
    // Filter out strings that are only punctuation or numbers
    return word.length > 0 && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(word);
  });
  
  // Also count non-Arabic words (like numbers or English words mixed in)
  const nonArabicWords = cleanText.trim().split(/\s+/).filter(word => {
    return word.length > 0 && 
           !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(word) &&
           /[a-zA-Z0-9]/.test(word);
  });
  
  return words.length + nonArabicWords.length;
}

/**
 * Counts words based on language detection or specified language.
 * Requirements: 13.1, 13.4
 */
export function countWords(text: string, language?: 'ar' | 'en'): number {
  if (!text || text.trim() === '') return 0;
  
  // If language is specified, use appropriate counter
  if (language === 'ar') {
    return countArabicWords(text);
  }
  if (language === 'en') {
    return countEnglishWords(text);
  }
  
  // Auto-detect: check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  
  if (hasArabic) {
    return countArabicWords(text);
  }
  
  return countEnglishWords(text);
}

/**
 * Counts sentences in text.
 * Requirements: 13.1
 */
export function countSentences(text: string): number {
  if (!text || text.trim() === '') return 0;
  
  // Match sentence-ending punctuation (including Arabic)
  // Arabic uses ؟ for question mark and ۔ for period (though . is common too)
  const sentences = text.split(/[.!?؟۔]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Counts paragraphs in text.
 * Requirements: 13.1
 */
export function countParagraphs(text: string): number {
  if (!text || text.trim() === '') return 0;
  
  // Split by double newlines or more
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return Math.max(paragraphs.length, 1); // At least 1 paragraph if there's text
}

/**
 * Calculates estimated reading time in minutes.
 * Requirements: 13.5
 */
export function calculateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.ceil(wordCount / READING_SPEED_WPM);
}

/**
 * Determines SEO status based on word count.
 * Requirements: 13.2, 13.3
 */
export function getSEOStatus(wordCount: number): 'short' | 'optimal' | 'long' {
  if (wordCount < SEO_MIN_WORDS) return 'short';
  if (wordCount > SEO_MAX_WORDS) return 'long';
  if (wordCount >= SEO_OPTIMAL_MIN && wordCount <= SEO_OPTIMAL_MAX) return 'optimal';
  return wordCount < SEO_OPTIMAL_MIN ? 'short' : 'long';
}

/**
 * Generates SEO recommendations based on word count.
 * Requirements: 13.2
 */
export function getSEORecommendations(wordCount: number, language: 'ar' | 'en'): string[] {
  const recommendations: string[] = [];
  
  if (language === 'ar') {
    if (wordCount < SEO_MIN_WORDS) {
      recommendations.push(`الوصف قصير جداً (${wordCount} كلمة). يُنصح بـ ${SEO_OPTIMAL_MIN}-${SEO_OPTIMAL_MAX} كلمة للحصول على ترتيب أفضل في محركات البحث.`);
      recommendations.push('أضف المزيد من التفاصيل حول المنتج مثل المميزات والفوائد وطريقة الاستخدام.');
    } else if (wordCount < SEO_OPTIMAL_MIN) {
      recommendations.push(`الوصف جيد لكن يمكن تحسينه. أضف ${SEO_OPTIMAL_MIN - wordCount} كلمة إضافية للوصول للطول المثالي.`);
    } else if (wordCount > SEO_MAX_WORDS) {
      recommendations.push(`الوصف طويل جداً (${wordCount} كلمة). قد يفقد القارئ اهتمامه. حاول اختصاره إلى ${SEO_OPTIMAL_MAX} كلمة.`);
      recommendations.push('ركز على المعلومات الأساسية واحذف التكرار.');
    } else if (wordCount >= SEO_OPTIMAL_MIN && wordCount <= SEO_OPTIMAL_MAX) {
      recommendations.push('طول الوصف مثالي لمحركات البحث! ✓');
      recommendations.push('تأكد من تضمين الكلمات المفتاحية المهمة بشكل طبيعي.');
    } else {
      recommendations.push('طول الوصف جيد. يمكنك إضافة المزيد من التفاصيل إذا لزم الأمر.');
    }
  } else {
    if (wordCount < SEO_MIN_WORDS) {
      recommendations.push(`Description is too short (${wordCount} words). Aim for ${SEO_OPTIMAL_MIN}-${SEO_OPTIMAL_MAX} words for better SEO ranking.`);
      recommendations.push('Add more details about the product such as features, benefits, and usage instructions.');
    } else if (wordCount < SEO_OPTIMAL_MIN) {
      recommendations.push(`Good start! Add ${SEO_OPTIMAL_MIN - wordCount} more words to reach optimal length.`);
    } else if (wordCount > SEO_MAX_WORDS) {
      recommendations.push(`Description is too long (${wordCount} words). Readers may lose interest. Try to shorten it to ${SEO_OPTIMAL_MAX} words.`);
      recommendations.push('Focus on essential information and remove redundancy.');
    } else if (wordCount >= SEO_OPTIMAL_MIN && wordCount <= SEO_OPTIMAL_MAX) {
      recommendations.push('Description length is optimal for SEO! ✓');
      recommendations.push('Make sure to include important keywords naturally.');
    } else {
      recommendations.push('Description length is good. You can add more details if needed.');
    }
  }
  
  return recommendations;
}

/**
 * Main function to count words and provide analysis.
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
export function analyzeText(input: WordCountInput): WordCountResult {
  const { text, language } = input;
  
  if (!text || text.trim() === '') {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      seoStatus: 'short',
      recommendations: [],
    };
  }
  
  const wordCount = countWords(text, language);
  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;
  const sentenceCount = countSentences(text);
  const paragraphCount = countParagraphs(text);
  const readingTimeMinutes = calculateReadingTime(wordCount);
  const seoStatus = getSEOStatus(wordCount);
  const recommendations = getSEORecommendations(wordCount, language);
  
  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes,
    seoStatus,
    recommendations,
  };
}
