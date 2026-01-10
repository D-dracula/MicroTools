/**
 * Product Description Cleaner Logic
 * 
 * Cleans product descriptions from unwanted symbols and formatting
 * while preserving essential elements.
 * Requirements: 10.1, 10.2, 10.3
 */

export interface CleanerOptions {
  removeEmojis: boolean;
  removeSpecialChars: boolean;
  removeExtraSpaces: boolean;
  removeUrls: boolean;
  preserveLineBreaks: boolean;
  preserveBulletPoints: boolean;
}

export interface CleanerInput {
  text: string;
  options: CleanerOptions;
}

export interface RemovedItem {
  type: string;
  count: number;
}

export interface CleanerResult {
  cleanedText: string;
  originalLength: number;
  cleanedLength: number;
  removedItems: RemovedItem[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Default cleaning options
 */
export const DEFAULT_CLEANER_OPTIONS: CleanerOptions = {
  removeEmojis: true,
  removeSpecialChars: true,
  removeExtraSpaces: true,
  removeUrls: false,
  preserveLineBreaks: true,
  preserveBulletPoints: true,
};

/**
 * Validates cleaner inputs.
 */
export function validateCleanerInputs(input: Partial<CleanerInput>): ValidationResult {
  if (!input.text || typeof input.text !== 'string') {
    return { isValid: false, error: 'Text input is required' };
  }

  if (!input.options) {
    return { isValid: false, error: 'Cleaning options are required' };
  }

  return { isValid: true };
}

/**
 * Emoji regex pattern - matches most common emojis
 */
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;

/**
 * URL regex pattern
 */
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

/**
 * Special characters regex (excluding Arabic, English, numbers, and basic punctuation)
 */
const SPECIAL_CHARS_REGEX = /[^\p{L}\p{N}\s.,!?;:'"()\-–—•·°%@#$&*+=\[\]{}\/\\<>|\n\r]/gu;

/**
 * Bullet point characters
 */
const BULLET_POINTS = ['•', '·', '●', '○', '◦', '▪', '▫', '►', '▸', '‣', '-', '*', '→', '➤', '➜', '✓', '✔', '✗', '✘'];

/**
 * Counts occurrences of a pattern in text
 */
function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Removes emojis from text
 */
function removeEmojis(text: string): { text: string; count: number } {
  const count = countMatches(text, EMOJI_REGEX);
  const cleanedText = text.replace(EMOJI_REGEX, '');
  return { text: cleanedText, count };
}

/**
 * Removes URLs from text
 */
function removeUrls(text: string): { text: string; count: number } {
  const count = countMatches(text, URL_REGEX);
  const cleanedText = text.replace(URL_REGEX, '');
  return { text: cleanedText, count };
}


/**
 * Removes special characters while optionally preserving bullet points
 */
function removeSpecialChars(text: string, preserveBullets: boolean): { text: string; count: number } {
  let count = 0;
  let cleanedText = text;

  if (preserveBullets) {
    // Create a regex that excludes bullet points - properly escape special regex chars
    const bulletChars = BULLET_POINTS.map(b => {
      // Escape special regex characters
      if (['*', '-', '\\', '[', ']', '^', '$', '.', '|', '?', '+', '(', ')'].includes(b)) {
        return '\\' + b;
      }
      return b;
    }).join('');
    const specialCharsWithoutBullets = new RegExp('[^\\p{L}\\p{N}\\s.,!?;:\'"()\\-–—' + bulletChars + '°%@#$&*+=\\[\\]{}\/\\\\<>|\\n\\r]', 'gu');
    count = countMatches(cleanedText, specialCharsWithoutBullets);
    cleanedText = cleanedText.replace(specialCharsWithoutBullets, '');
  } else {
    count = countMatches(cleanedText, SPECIAL_CHARS_REGEX);
    cleanedText = cleanedText.replace(SPECIAL_CHARS_REGEX, '');
  }

  return { text: cleanedText, count };
}

/**
 * Removes extra spaces (multiple consecutive spaces)
 */
function removeExtraSpaces(text: string, preserveLineBreaks: boolean): { text: string; count: number } {
  let cleanedText = text;
  let count = 0;

  if (preserveLineBreaks) {
    // Replace multiple spaces (not newlines) with single space
    const multipleSpaces = /[^\S\n\r]+/g;
    const matches = cleanedText.match(multipleSpaces);
    if (matches) {
      count = matches.filter(m => m.length > 1).length;
    }
    cleanedText = cleanedText.replace(multipleSpaces, ' ');
    
    // Replace multiple newlines with double newline (paragraph break)
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  } else {
    // Replace all whitespace sequences with single space
    const multipleWhitespace = /\s+/g;
    const matches = cleanedText.match(multipleWhitespace);
    if (matches) {
      count = matches.filter(m => m.length > 1).length;
    }
    cleanedText = cleanedText.replace(multipleWhitespace, ' ');
  }

  // Trim leading/trailing whitespace from each line
  cleanedText = cleanedText.split('\n').map(line => line.trim()).join('\n');
  
  return { text: cleanedText, count };
}

/**
 * Cleans product description based on provided options.
 * Requirements: 10.1, 10.2, 10.3
 */
export function cleanDescription(input: CleanerInput): CleanerResult {
  const validation = validateCleanerInputs(input);
  
  if (!validation.isValid) {
    return {
      cleanedText: input.text || '',
      originalLength: input.text?.length || 0,
      cleanedLength: input.text?.length || 0,
      removedItems: [],
    };
  }

  const { text, options } = input;
  const originalLength = text.length;
  const removedItems: RemovedItem[] = [];
  
  let cleanedText = text;

  // Remove URLs first (before other processing)
  if (options.removeUrls) {
    const result = removeUrls(cleanedText);
    cleanedText = result.text;
    if (result.count > 0) {
      removedItems.push({ type: 'urls', count: result.count });
    }
  }

  // Remove emojis
  if (options.removeEmojis) {
    const result = removeEmojis(cleanedText);
    cleanedText = result.text;
    if (result.count > 0) {
      removedItems.push({ type: 'emojis', count: result.count });
    }
  }

  // Remove special characters
  if (options.removeSpecialChars) {
    const result = removeSpecialChars(cleanedText, options.preserveBulletPoints);
    cleanedText = result.text;
    if (result.count > 0) {
      removedItems.push({ type: 'specialChars', count: result.count });
    }
  }

  // Remove extra spaces (always do this last)
  if (options.removeExtraSpaces) {
    const result = removeExtraSpaces(cleanedText, options.preserveLineBreaks);
    cleanedText = result.text;
    if (result.count > 0) {
      removedItems.push({ type: 'extraSpaces', count: result.count });
    }
  }

  // Final trim
  cleanedText = cleanedText.trim();

  return {
    cleanedText,
    originalLength,
    cleanedLength: cleanedText.length,
    removedItems,
  };
}


/**
 * Gets cleaning option labels for UI.
 */
export function getCleaningOptionLabels(language: 'ar' | 'en'): Record<keyof CleanerOptions, string> {
  const labels: Record<keyof CleanerOptions, { ar: string; en: string }> = {
    removeEmojis: {
      ar: 'إزالة الرموز التعبيرية',
      en: 'Remove emojis',
    },
    removeSpecialChars: {
      ar: 'إزالة الرموز الخاصة',
      en: 'Remove special characters',
    },
    removeExtraSpaces: {
      ar: 'إزالة المسافات الزائدة',
      en: 'Remove extra spaces',
    },
    removeUrls: {
      ar: 'إزالة الروابط',
      en: 'Remove URLs',
    },
    preserveLineBreaks: {
      ar: 'الحفاظ على فواصل الأسطر',
      en: 'Preserve line breaks',
    },
    preserveBulletPoints: {
      ar: 'الحفاظ على النقاط',
      en: 'Preserve bullet points',
    },
  };

  return Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [key, value[language]])
  ) as Record<keyof CleanerOptions, string>;
}

/**
 * Gets removed item type labels for UI.
 */
export function getRemovedItemLabels(language: 'ar' | 'en'): Record<string, string> {
  const labels: Record<string, { ar: string; en: string }> = {
    emojis: { ar: 'رموز تعبيرية', en: 'Emojis' },
    urls: { ar: 'روابط', en: 'URLs' },
    specialChars: { ar: 'رموز خاصة', en: 'Special characters' },
    extraSpaces: { ar: 'مسافات زائدة', en: 'Extra spaces' },
  };

  return Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [key, value[language]])
  ) as Record<string, string>;
}
