/**
 * Shared Utilities for AI Tools
 * Reusable functions for data processing, validation, and AI interactions
 */

import { chat } from './openrouter-client';

// ============================================
// Types
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
  };
}

export interface DataQualityInfo {
  skippedRows: number;
  totalRows: number;
  warnings: string[];
  explanation?: string;
}

export interface ColumnMapping {
  [key: string]: string | string[];
}

// ============================================
// Number & Date Parsing
// ============================================

/**
 * Parse a value to number, handling various formats
 */
export function parseNumber(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const str = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(str) || 0;
}

/**
 * Parse a value to date string (YYYY-MM-DD)
 */
export function parseDate(value: unknown): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const dateStr = String(value);
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

// ============================================
// Data Sampling
// ============================================

/**
 * Select diverse sample rows for AI analysis
 * Picks rows that represent different scenarios in the data
 */
export function selectDiverseSample(
  data: Record<string, unknown>[],
  headers: string[],
  count: number = 9,
  options: {
    valueKeywords?: string[];
    costKeywords?: string[];
  } = {}
): Record<string, unknown>[] {
  if (data.length <= count) return data;

  const {
    valueKeywords = ['total', 'price', 'amount', 'revenue', 'sales'],
    costKeywords = ['shipping', 'fee', 'tax', 'cost'],
  } = options;

  const samples: Record<string, unknown>[] = [];
  const usedIndices = new Set<number>();

  // Find numeric columns
  const numericColumns = headers.filter(h => {
    const val = data[0]?.[h];
    return typeof val === 'number' || !isNaN(parseFloat(String(val)));
  });

  // Find main value column
  const valueCol = numericColumns.find(h => 
    valueKeywords.some(kw => h.toLowerCase().includes(kw))
  ) || numericColumns[0];

  // Find cost columns
  const costColumns = headers.filter(h => 
    costKeywords.some(kw => h.toLowerCase().includes(kw))
  );

  // Helper to add sample
  const addSample = (idx: number) => {
    if (idx >= 0 && idx < data.length && !usedIndices.has(idx)) {
      samples.push(data[idx]);
      usedIndices.add(idx);
      return true;
    }
    return false;
  };

  // 1. First row (typical example)
  addSample(0);

  // 2. Row with highest value
  if (valueCol) {
    let maxIdx = 0, maxVal = -Infinity;
    data.forEach((row, idx) => {
      const val = parseNumber(row[valueCol]);
      if (val > maxVal && !usedIndices.has(idx)) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    addSample(maxIdx);
  }

  // 3. Row with lowest positive value
  if (valueCol) {
    let minIdx = 0, minVal = Infinity;
    data.forEach((row, idx) => {
      const val = parseNumber(row[valueCol]);
      if (val > 0 && val < minVal && !usedIndices.has(idx)) {
        minVal = val;
        minIdx = idx;
      }
    });
    addSample(minIdx);
  }

  // 4. Row with zero or negative value
  const negativeIdx = data.findIndex((row, idx) => {
    if (usedIndices.has(idx)) return false;
    const val = valueCol ? parseNumber(row[valueCol]) : 0;
    return val <= 0;
  });
  addSample(negativeIdx);

  // 5. Row with most cost columns filled
  if (costColumns.length > 0) {
    let maxCostIdx = -1, maxCostCount = 0;
    data.forEach((row, idx) => {
      if (usedIndices.has(idx)) return;
      const costCount = costColumns.filter(col => parseNumber(row[col]) > 0).length;
      if (costCount > maxCostCount) {
        maxCostCount = costCount;
        maxCostIdx = idx;
      }
    });
    addSample(maxCostIdx);
  }

  // 6. Middle row
  addSample(Math.floor(data.length / 2));

  // 7. Last quarter row
  addSample(Math.floor(data.length * 0.75));

  // 8+. Random rows to fill remaining
  let attempts = 0;
  while (samples.length < count && samples.length < data.length && attempts < 100) {
    const randomIdx = Math.floor(Math.random() * data.length);
    addSample(randomIdx);
    attempts++;
  }

  return samples;
}

/**
 * Format sample rows for AI prompt
 */
export function formatSampleForAI(
  headers: string[],
  sampleRows: Record<string, unknown>[],
  totalRows: number
): string {
  return `Columns: ${headers.join(', ')}

Sample rows (${sampleRows.length} diverse examples):
${sampleRows.map((row, i) => 
  `Row ${i + 1}: ${headers.map(h => `${h}: ${row[h] ?? 'N/A'}`).join(' | ')}`
).join('\n')}

Total rows in file: ${totalRows}`;
}

// ============================================
// Data Validation
// ============================================

/**
 * Validate CSV/spreadsheet data
 */
export function validateData(
  data: Record<string, unknown>[],
  headers: string[],
  options: {
    requiredKeywords?: string[];
    minRows?: number;
    maxRows?: number;
  } = {}
): ValidationResult {
  const {
    requiredKeywords = [],
    minRows = 1,
    maxRows = 50000,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  let validRows = 0;

  // Check if data exists
  if (!data || data.length === 0) {
    errors.push('الملف فارغ أو لا يحتوي على بيانات');
    return { isValid: false, errors, warnings, stats: { totalRows: 0, validRows: 0, skippedRows: 0 } };
  }

  // Check headers
  if (!headers || headers.length === 0) {
    errors.push('لم يتم العثور على أسماء الأعمدة');
    return { isValid: false, errors, warnings, stats: { totalRows: data.length, validRows: 0, skippedRows: data.length } };
  }

  // Check for required columns
  for (const keyword of requiredKeywords) {
    const hasColumn = headers.some(h => h.toLowerCase().includes(keyword.toLowerCase()));
    if (!hasColumn) {
      warnings.push(`لم يتم العثور على عمود يحتوي على "${keyword}"`);
    }
  }

  // Check row count limits
  if (data.length < minRows) {
    errors.push(`الملف يحتوي على ${data.length} صف فقط (الحد الأدنى: ${minRows})`);
  }

  if (data.length > maxRows) {
    warnings.push(`الملف كبير جداً (${data.length} صف). سيتم معالجة أول ${maxRows} صف فقط.`);
  }

  // Count valid rows (rows with at least one numeric value)
  for (const row of data) {
    const hasValue = Object.values(row).some(v => {
      const num = parseNumber(v);
      return num !== 0;
    });
    if (hasValue) validRows++;
  }

  if (validRows === 0) {
    errors.push('لم يتم العثور على صفوف تحتوي على بيانات رقمية');
  }

  const skippedRows = data.length - validRows;
  if (skippedRows > data.length * 0.3) {
    warnings.push(`${skippedRows} صف (${Math.round(skippedRows / data.length * 100)}%) لا يحتوي على بيانات صالحة`);
  }

  return {
    isValid: errors.length === 0 && validRows > 0,
    errors,
    warnings,
    stats: { totalRows: data.length, validRows, skippedRows },
  };
}

/**
 * Validate column mapping from AI
 */
export function validateColumnMapping(
  mapping: Record<string, unknown>,
  headers: string[],
  requiredFields: string[] = []
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mapping) {
    errors.push('لم يتم الحصول على تعيين الأعمدة من AI');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!mapping[field]) {
      warnings.push(`لم يتم تحديد عمود لـ "${field}"`);
    }
  }

  // Check if mapped columns exist in headers
  for (const [field, column] of Object.entries(mapping)) {
    if (typeof column === 'string' && !headers.includes(column)) {
      warnings.push(`العمود "${column}" (${field}) غير موجود في الملف`);
    }
    if (Array.isArray(column)) {
      for (const col of column) {
        if (!headers.includes(col)) {
          warnings.push(`العمود "${col}" غير موجود في الملف`);
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ============================================
// AI Problem Explanation
// ============================================

/**
 * Ask AI to explain data problems to user in simple terms
 */
export async function explainDataProblem(
  apiKey: string,
  context: {
    toolName: string;
    headers: string[];
    sampleRow?: Record<string, unknown>;
    errors: string[];
    warnings: string[];
    skippedRows: number;
    totalRows: number;
  },
  locale: string = 'en'
): Promise<string> {
  const isArabic = locale === 'ar';
  
  const prompt = isArabic 
    ? `أنت مساعد ودود تشرح المشاكل التقنية بلغة بسيطة للتجار.

المستخدم يستخدم أداة "${context.toolName}" ورفع ملف بيانات وواجه مشاكل.

معلومات الملف:
- أسماء الأعمدة: ${context.headers.join(', ')}
- إجمالي الصفوف: ${context.totalRows}
- الصفوف المتخطاة: ${context.skippedRows}

المشاكل:
${context.errors.length > 0 ? '❌ أخطاء: ' + context.errors.join(', ') : ''}
${context.warnings.length > 0 ? '⚠️ تحذيرات: ' + context.warnings.join(', ') : ''}

اكتب رسالة قصيرة (3-4 جمل) تشرح:
1. ما المشكلة
2. كيف يحلها المستخدم
3. مثال على الشكل الصحيح

اكتب بالعربية بأسلوب ودود.`
    : `You are a friendly assistant explaining technical issues in simple terms.

The user is using "${context.toolName}" tool and uploaded a data file with issues.

File info:
- Columns: ${context.headers.join(', ')}
- Total rows: ${context.totalRows}
- Skipped rows: ${context.skippedRows}

Issues:
${context.errors.length > 0 ? '❌ Errors: ' + context.errors.join(', ') : ''}
${context.warnings.length > 0 ? '⚠️ Warnings: ' + context.warnings.join(', ') : ''}

Write a short message (3-4 sentences) explaining:
1. What the problem is
2. How to fix it
3. Example of correct format

Be friendly and helpful.`;

  try {
    const response = await chat(apiKey, [
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: 500 });
    
    return response.content;
  } catch {
    return generateFallbackExplanation(context, locale);
  }
}

/**
 * Generate fallback explanation without AI
 */
export function generateFallbackExplanation(
  context: {
    errors: string[];
    warnings: string[];
    skippedRows: number;
    totalRows: number;
  },
  locale: string = 'en'
): string {
  const isArabic = locale === 'ar';
  const parts: string[] = [];

  if (context.errors.length > 0) {
    parts.push(isArabic 
      ? `❌ وجدنا مشكلة: ${context.errors[0]}`
      : `❌ Found an issue: ${context.errors[0]}`
    );
  }

  if (context.skippedRows > 0) {
    const pct = Math.round((context.skippedRows / context.totalRows) * 100);
    parts.push(isArabic
      ? `⚠️ تم تخطي ${context.skippedRows} صف (${pct}%) لعدم احتوائها على بيانات صالحة.`
      : `⚠️ Skipped ${context.skippedRows} rows (${pct}%) due to invalid data.`
    );
  }

  if (context.warnings.length > 0) {
    parts.push(isArabic
      ? `💡 نصيحة: ${context.warnings[0]}`
      : `💡 Tip: ${context.warnings[0]}`
    );
  }

  return parts.join('\n\n');
}

// ============================================
// Keyword Classification
// ============================================

export type ClassificationCategory = string;

export interface ClassificationPatterns {
  [category: string]: string[];
}

/**
 * Classify labels using keyword matching
 */
export function keywordClassify<T extends string>(
  labels: string[],
  patterns: Record<T, string[]>,
  defaultCategory: T
): Record<string, T> {
  const results: Record<string, T> = {};

  for (const label of labels) {
    const labelLower = label.toLowerCase();
    let matched = false;

    for (const [category, keywords] of Object.entries(patterns) as [T, string[]][]) {
      if (keywords.some(kw => labelLower.includes(kw.toLowerCase()))) {
        results[label] = category;
        matched = true;
        break;
      }
    }

    if (!matched) {
      results[label] = defaultCategory;
    }
  }

  return results;
}

/**
 * Classify with keywords first, then AI for unknowns
 */
export async function smartClassify<T extends string>(
  apiKey: string,
  labels: string[],
  patterns: Record<T, string[]>,
  defaultCategory: T,
  aiPrompt: string
): Promise<Record<string, T>> {
  // Step 1: Keyword classification
  const keywordResults = keywordClassify(labels, patterns, defaultCategory);
  
  // Step 2: Find unknowns (classified as default)
  const unknowns = labels.filter(l => keywordResults[l] === defaultCategory);
  
  if (unknowns.length === 0) {
    console.log('   ⚡ All labels classified by keywords');
    return keywordResults;
  }

  // Step 3: Ask AI for unknowns only
  console.log(`   🤖 ${unknowns.length} unknown labels, asking AI...`);
  
  try {
    const response = await chat(apiKey, [
      { role: 'system', content: aiPrompt },
      { role: 'user', content: `Classify: ${unknowns.join(', ')}\n\nReturn JSON: {"classifications": {"label": "category"}}` }
    ], { temperature: 0.1, maxTokens: 500 });
    
    const parsed = JSON.parse(response.content);
    const aiResults = parsed.classifications || {};
    
    return { ...keywordResults, ...aiResults };
  } catch {
    return keywordResults;
  }
}

// ============================================
// Logging Utilities
// ============================================

/**
 * Log a processing step with emoji
 */
export function logStep(step: number, total: number, message: string, data?: unknown) {
  const emoji = ['📌', '🤖', '🧮', '📊', '📈', '📉', '💡', '✅', '❌', '⚠️'][step % 10];
  console.log(`\n${emoji} [Step ${step}/${total}] ${message}`);
  if (data) {
    console.log('   ', data);
  }
}

/**
 * Log completion with timing
 */
export function logComplete(toolName: string, startTime: number, stats?: Record<string, unknown>) {
  const duration = Date.now() - startTime;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ [${toolName}] Complete!`);
  console.log(`⏱️  Duration: ${duration}ms`);
  if (stats) {
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`📊 ${key}: ${value}`);
    });
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================
// Response Language Utilities
// ============================================

/**
 * Language code to full name mapping
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  ar: 'Arabic',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  tr: 'Turkish',
  ur: 'Urdu',
  zh: 'Chinese',
  hi: 'Hindi',
  pt: 'Portuguese',
  it: 'Italian',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
};

/**
 * Get language instruction for AI prompts
 * This instruction tells the AI to respond in the user's preferred language
 */
export function getLanguageInstruction(responseLanguage?: string): string {
  if (!responseLanguage) {
    return 'Respond in the same language as the user\'s data.';
  }
  
  // Handle custom languages (format: "custom:LanguageName")
  if (responseLanguage.startsWith('custom:')) {
    const customLang = responseLanguage.replace('custom:', '');
    return `IMPORTANT: You MUST respond in ${customLang}. All text, recommendations, insights, and explanations should be written in ${customLang}.`;
  }
  
  const langName = LANGUAGE_NAMES[responseLanguage] || responseLanguage;
  return `IMPORTANT: You MUST respond in ${langName}. All text, recommendations, insights, and explanations should be written in ${langName}.`;
}

// ============================================
// Formatting Utilities (Locale-aware)
// ============================================

/**
 * Format currency with locale and currency support
 */
export function formatCurrency(
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with locale support
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format date with locale support
 */
export function formatDate(dateStr: string, locale: string = 'en-US'): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format percentage with locale support
 */
export function formatPercentage(value: number, locale: string = 'en-US'): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

// ============================================
// Label Utilities (Multi-language)
// ============================================

/**
 * Get label in specified locale with fallback to English
 */
export function getLabel(
  key: string,
  labels: Record<string, Record<string, string>>,
  locale: string
): string {
  return labels[key]?.[locale] || labels[key]?.['en'] || key;
}

/**
 * Common labels used across AI tools
 * Add more languages as needed
 */
export const COMMON_LABELS: Record<string, Record<string, string>> = {
  // Expense categories
  payment_gateway: { en: 'Payment Gateway Fees' },
  shipping: { en: 'Shipping Costs' },
  tax: { en: 'Taxes' },
  refund: { en: 'Refunds' },
  other: { en: 'Other' },
  
  // Sentiment
  positive: { en: 'Positive' },
  negative: { en: 'Negative' },
  neutral: { en: 'Neutral' },
  
  // Severity
  high: { en: 'High' },
  medium: { en: 'Medium' },
  low: { en: 'Low' },
  
  // Urgency
  critical: { en: 'Critical' },
  warning: { en: 'Warning' },
  normal: { en: 'Normal' },
  
  // Trends
  increasing: { en: 'Increasing' },
  stable: { en: 'Stable' },
  decreasing: { en: 'Decreasing' },
};

/**
 * Get common label by key
 */
export function getCommonLabel(key: string, locale: string): string {
  return getLabel(key, COMMON_LABELS, locale);
}

// ============================================
// Color Utilities (for UI)
// ============================================

/**
 * Status colors (profitable/break_even/unprofitable)
 */
export const STATUS_COLORS: Record<string, string> = {
  profitable: 'text-green-600 bg-green-50 border-green-200',
  break_even: 'text-amber-600 bg-amber-50 border-amber-200',
  unprofitable: 'text-red-600 bg-red-50 border-red-200',
};

/**
 * Sentiment colors (positive/negative/neutral)
 */
export const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600',
};

/**
 * Severity colors (high/medium/low)
 */
export const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-yellow-500',
};

/**
 * Urgency colors (critical/warning/normal)
 */
export const URGENCY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  normal: 'text-green-600 bg-green-50 border-green-200',
};

/**
 * Get color by key from a color map
 */
export function getColor(key: string, colorMap: Record<string, string>, fallback: string = ''): string {
  return colorMap[key] || fallback;
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  return getColor(status, STATUS_COLORS);
}

/**
 * Get sentiment color
 */
export function getSentimentColor(sentiment: string): string {
  return getColor(sentiment, SENTIMENT_COLORS);
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  return getColor(severity, SEVERITY_COLORS);
}

/**
 * Get urgency color
 */
export function getUrgencyColor(urgency: string): string {
  return getColor(urgency, URGENCY_COLORS);
}
