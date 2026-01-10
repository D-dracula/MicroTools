/**
 * SEO Product Title Validator Logic
 * 
 * Validates product titles for SEO compliance and provides
 * improvement suggestions.
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

export interface SEOTitleInput {
  title: string;
  language: 'ar' | 'en';
}

export type SEOIssueType = 'length' | 'keyword_stuffing' | 'special_chars' | 'capitalization';
export type SEOIssueSeverity = 'warning' | 'error';

export interface SEOIssue {
  type: SEOIssueType;
  severity: SEOIssueSeverity;
  message: string;
}

export type LengthStatus = 'short' | 'optimal' | 'long';

export interface SEOTitleResult {
  score: number;            // 0-100
  issues: SEOIssue[];
  suggestions: string[];
  lengthStatus: LengthStatus;
  characterCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// SEO title length thresholds
const MIN_OPTIMAL_LENGTH = 50;
const MAX_OPTIMAL_LENGTH = 60;
const MAX_RECOMMENDED_LENGTH = 70;

// Keyword stuffing threshold - word appears more than this many times
const KEYWORD_STUFFING_THRESHOLD = 3;

// Minimum word length to consider for keyword stuffing
const MIN_WORD_LENGTH_FOR_STUFFING = 3;

/**
 * Validates SEO title inputs.
 */
export function validateSEOInputs(input: Partial<SEOTitleInput>): ValidationResult {
  if (!input.title || typeof input.title !== 'string') {
    return { isValid: false, error: 'Title is required' };
  }

  if (input.title.trim().length === 0) {
    return { isValid: false, error: 'Title cannot be empty' };
  }

  return { isValid: true };
}

/**
 * Determines the length status of a title.
 */
export function getLengthStatus(length: number): LengthStatus {
  if (length < MIN_OPTIMAL_LENGTH) {
    return 'short';
  } else if (length <= MAX_OPTIMAL_LENGTH) {
    return 'optimal';
  } else {
    return 'long';
  }
}

/**
 * Detects keyword stuffing in a title.
 * Returns true if any word appears more than KEYWORD_STUFFING_THRESHOLD times.
 */
export function detectKeywordStuffing(title: string): boolean {
  // Normalize and split into words
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length >= MIN_WORD_LENGTH_FOR_STUFFING);

  // Count word occurrences
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  // Check if any word exceeds threshold
  for (const count of wordCounts.values()) {
    if (count > KEYWORD_STUFFING_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the most repeated words for reporting.
 */
function getMostRepeatedWords(title: string): Array<{ word: string; count: number }> {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length >= MIN_WORD_LENGTH_FOR_STUFFING);

  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  return Array.from(wordCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/**
 * Detects excessive special characters in title.
 */
function detectExcessiveSpecialChars(title: string): boolean {
  // Count special characters (excluding basic punctuation)
  const specialChars = title.match(/[!@#$%^&*()_+=\[\]{}|\\<>~`]/g);
  const specialCount = specialChars ? specialChars.length : 0;
  
  // More than 3 special characters is excessive
  return specialCount > 3;
}

/**
 * Detects ALL CAPS usage in title.
 */
function detectAllCaps(title: string): boolean {
  // Extract only letter characters
  const letters = title.replace(/[^\p{L}]/gu, '');
  if (letters.length < 5) return false;
  
  // Check if more than 50% are uppercase
  const upperCount = (title.match(/\p{Lu}/gu) || []).length;
  return upperCount > letters.length * 0.5;
}

/**
 * Calculates SEO score based on issues found.
 * Starts at 100 and deducts points for each issue.
 */
export function calculateSEOScore(issues: SEOIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === 'error') {
      score -= 25;
    } else if (issue.severity === 'warning') {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generates suggestions based on issues found.
 */
function generateSuggestions(
  issues: SEOIssue[],
  lengthStatus: LengthStatus,
  characterCount: number,
  language: 'ar' | 'en'
): string[] {
  const suggestions: string[] = [];

  if (language === 'ar') {
    if (lengthStatus === 'short') {
      suggestions.push(`أضف ${MIN_OPTIMAL_LENGTH - characterCount} حرف إضافي للوصول للطول المثالي`);
      suggestions.push('أضف كلمات وصفية مثل اللون أو الحجم أو المادة');
    } else if (lengthStatus === 'long') {
      suggestions.push(`قلل ${characterCount - MAX_OPTIMAL_LENGTH} حرف للوصول للطول المثالي`);
      suggestions.push('احذف الكلمات غير الضرورية مع الحفاظ على المعنى');
    }

    const hasKeywordStuffing = issues.some(i => i.type === 'keyword_stuffing');
    if (hasKeywordStuffing) {
      suggestions.push('استخدم مرادفات بدلاً من تكرار نفس الكلمة');
    }

    const hasSpecialChars = issues.some(i => i.type === 'special_chars');
    if (hasSpecialChars) {
      suggestions.push('استخدم الشرطة (-) أو الفاصلة (،) بدلاً من الرموز الخاصة');
    }

    const hasCapsIssue = issues.some(i => i.type === 'capitalization');
    if (hasCapsIssue) {
      suggestions.push('استخدم الأحرف الكبيرة فقط في بداية الكلمات المهمة');
    }

    if (issues.length === 0 && lengthStatus === 'optimal') {
      suggestions.push('عنوانك ممتاز! جاهز للنشر');
    }
  } else {
    if (lengthStatus === 'short') {
      suggestions.push(`Add ${MIN_OPTIMAL_LENGTH - characterCount} more characters to reach optimal length`);
      suggestions.push('Include descriptive words like color, size, or material');
    } else if (lengthStatus === 'long') {
      suggestions.push(`Remove ${characterCount - MAX_OPTIMAL_LENGTH} characters to reach optimal length`);
      suggestions.push('Remove unnecessary words while keeping the meaning');
    }

    const hasKeywordStuffing = issues.some(i => i.type === 'keyword_stuffing');
    if (hasKeywordStuffing) {
      suggestions.push('Use synonyms instead of repeating the same word');
    }

    const hasSpecialChars = issues.some(i => i.type === 'special_chars');
    if (hasSpecialChars) {
      suggestions.push('Use hyphens (-) or commas (,) instead of special characters');
    }

    const hasCapsIssue = issues.some(i => i.type === 'capitalization');
    if (hasCapsIssue) {
      suggestions.push('Use title case - capitalize only the first letter of important words');
    }

    if (issues.length === 0 && lengthStatus === 'optimal') {
      suggestions.push('Your title is excellent! Ready to publish');
    }
  }

  return suggestions;
}

/**
 * Validates an SEO product title and returns analysis results.
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function validateSEOTitle(input: SEOTitleInput): SEOTitleResult {
  const validation = validateSEOInputs(input);
  
  if (!validation.isValid) {
    return {
      score: 0,
      issues: [{
        type: 'length',
        severity: 'error',
        message: validation.error || 'Invalid input',
      }],
      suggestions: [],
      lengthStatus: 'short',
      characterCount: 0,
    };
  }

  const { title, language } = input;
  const characterCount = title.length;
  const lengthStatus = getLengthStatus(characterCount);
  const issues: SEOIssue[] = [];

  // Check length issues
  if (lengthStatus === 'short') {
    issues.push({
      type: 'length',
      severity: 'warning',
      message: language === 'ar'
        ? `العنوان قصير جداً (${characterCount} حرف). الطول المثالي 50-60 حرف`
        : `Title is too short (${characterCount} chars). Optimal length is 50-60 characters`,
    });
  } else if (characterCount > MAX_RECOMMENDED_LENGTH) {
    issues.push({
      type: 'length',
      severity: 'error',
      message: language === 'ar'
        ? `العنوان طويل جداً (${characterCount} حرف). قد يتم اقتطاعه في نتائج البحث`
        : `Title is too long (${characterCount} chars). It may be truncated in search results`,
    });
  } else if (lengthStatus === 'long') {
    issues.push({
      type: 'length',
      severity: 'warning',
      message: language === 'ar'
        ? `العنوان أطول من المثالي (${characterCount} حرف). الطول المثالي 50-60 حرف`
        : `Title is longer than optimal (${characterCount} chars). Optimal length is 50-60 characters`,
    });
  }

  // Check keyword stuffing
  if (detectKeywordStuffing(title)) {
    const repeatedWords = getMostRepeatedWords(title);
    const wordList = repeatedWords.map(w => `"${w.word}" (${w.count}x)`).join(', ');
    issues.push({
      type: 'keyword_stuffing',
      severity: 'error',
      message: language === 'ar'
        ? `تكرار مفرط للكلمات: ${wordList}`
        : `Keyword stuffing detected: ${wordList}`,
    });
  }

  // Check special characters
  if (detectExcessiveSpecialChars(title)) {
    issues.push({
      type: 'special_chars',
      severity: 'warning',
      message: language === 'ar'
        ? 'يحتوي العنوان على رموز خاصة كثيرة قد تؤثر على SEO'
        : 'Title contains excessive special characters that may affect SEO',
    });
  }

  // Check ALL CAPS (only for English or mixed content)
  if (detectAllCaps(title)) {
    issues.push({
      type: 'capitalization',
      severity: 'warning',
      message: language === 'ar'
        ? 'تجنب استخدام الأحرف الكبيرة بشكل مفرط'
        : 'Avoid using ALL CAPS - it looks like shouting',
    });
  }

  const score = calculateSEOScore(issues);
  const suggestions = generateSuggestions(issues, lengthStatus, characterCount, language);

  return {
    score,
    issues,
    suggestions,
    lengthStatus,
    characterCount,
  };
}

/**
 * Gets score status label and color class.
 */
export function getScoreStatus(score: number, language: 'ar' | 'en'): { label: string; colorClass: string } {
  if (score >= 90) {
    return {
      label: language === 'ar' ? 'ممتاز' : 'Excellent',
      colorClass: 'text-green-600',
    };
  } else if (score >= 70) {
    return {
      label: language === 'ar' ? 'جيد' : 'Good',
      colorClass: 'text-blue-600',
    };
  } else if (score >= 50) {
    return {
      label: language === 'ar' ? 'متوسط' : 'Average',
      colorClass: 'text-yellow-600',
    };
  } else {
    return {
      label: language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement',
      colorClass: 'text-red-600',
    };
  }
}

/**
 * Gets length status label.
 */
export function getLengthStatusLabel(status: LengthStatus, language: 'ar' | 'en'): string {
  const labels: Record<LengthStatus, { ar: string; en: string }> = {
    short: { ar: 'قصير', en: 'Short' },
    optimal: { ar: 'مثالي', en: 'Optimal' },
    long: { ar: 'طويل', en: 'Long' },
  };
  return labels[status][language];
}

/**
 * Gets issue type label.
 */
export function getIssueTypeLabel(type: SEOIssueType, language: 'ar' | 'en'): string {
  const labels: Record<SEOIssueType, { ar: string; en: string }> = {
    length: { ar: 'الطول', en: 'Length' },
    keyword_stuffing: { ar: 'تكرار الكلمات', en: 'Keyword Stuffing' },
    special_chars: { ar: 'رموز خاصة', en: 'Special Characters' },
    capitalization: { ar: 'الأحرف الكبيرة', en: 'Capitalization' },
  };
  return labels[type][language];
}
