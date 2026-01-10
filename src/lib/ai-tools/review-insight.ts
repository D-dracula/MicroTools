/**
 * AI Review Insight Module
 * Sentiment analysis and pain point extraction from customer reviews
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { chat, chatWithTools, estimateTokens, ChatMessage } from './openrouter-client';
import { getLanguageInstruction, selectDiverseSample, formatSampleForAI } from './shared-utils';

// Types
export interface ReviewRecord {
  id: string;
  text: string;
  rating?: number;
  date?: string;
  source?: string;
}

export interface ReviewsInput {
  reviews: ReviewRecord[];
  language: 'ar' | 'en' | 'mixed';
  source?: string;
}

export type SentimentType = 'positive' | 'negative' | 'neutral';
export type SeverityLevel = 'high' | 'medium' | 'low';

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface PainPoint {
  issue: string;
  frequency: number;
  severity: SeverityLevel;
  exampleReviews: string[];
}

export interface PraisedFeature {
  feature: string;
  frequency: number;
  exampleReviews: string[];
}

export interface ReviewAnalysis {
  reviewId: string;
  text: string;
  sentiment: SentimentType;
  rating?: number;
  extractedIssues: string[];
  extractedPraises: string[];
}

export interface ReviewInsightResult {
  sentimentDistribution: SentimentDistribution;
  painPoints: PainPoint[];
  praisedFeatures: PraisedFeature[];
  productImprovements: string[];
  competitorWeaknesses: string[];
  marketOpportunities: string[];
  reviewAnalysis: ReviewAnalysis[];
  tokensUsed: number;
  processingTime: number;
}

// AI Prompt Templates
const SENTIMENT_ANALYSIS_SYSTEM_PROMPT = `You are an analyst specializing in customer review analysis. Your task is to analyze sentiment and extract useful information.

For each review, identify:
1. Sentiment: positive, negative, or neutral
2. Issues mentioned: list of problems or complaints
3. Positives mentioned: list of praised features

Return the result in JSON format only without any additional text.
Format: {"reviews": [{"id": "...", "sentiment": "...", "issues": [...], "praises": [...]}]}`;

// Note: This prompt is a template. Use getInsightsPrompt(responseLanguage) to get the localized version.
const INSIGHTS_SYSTEM_PROMPT_BASE = `You are a business consultant specializing in market analysis. Based on customer review analysis, provide valuable insights.

Provide:
1. Main pain points (painPoints): recurring issues with severity assessment
2. Praised features (praisedFeatures): what customers love
3. Product improvement suggestions (improvements): how to improve the product
4. Competitor weaknesses (weaknesses): opportunities to differentiate
5. Market opportunities (opportunities): opportunities to exploit

Return the result in JSON format only.`;

/**
 * Get insights prompt with response language instruction
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
function getInsightsPrompt(responseLanguage?: string): string {
  const languageInstruction = getLanguageInstruction(responseLanguage);
  return `${INSIGHTS_SYSTEM_PROMPT_BASE}\n\n${languageInstruction}`;
}

const REVIEWS_DATA_PARSER_SYSTEM_PROMPT = `You are a data analyst specializing in customer reviews. Your task is to understand and analyze review data from any file regardless of column names.

Analyze the provided data and extract for each row:
- text: review text (look for the longest text in the row)
- rating: rating (number from 1-5) if available
- date: date if available
- source: source if available

Return the result in JSON format:
{"reviews": [{"text": "...", "rating": 0, "date": "", "source": ""}]}`;

/**
 * Parse reviews from file data using AI
 */
export async function parseReviewsData(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[]
): Promise<ReviewsInput> {
  // Select diverse sample rows for AI (9 rows representing different scenarios)
  const sampleRows = selectDiverseSample(data, headers, 9);
  const dataPreview = formatSampleForAI(headers, sampleRows, data.length);

  const messages: ChatMessage[] = [
    { role: 'system', content: REVIEWS_DATA_PARSER_SYSTEM_PROMPT },
    { role: 'user', content: `Analyze the following review data:\n\n${dataPreview}` }
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.1, maxTokens: 4000 });
    const parsed = JSON.parse(response.content);
    
    if (parsed.reviews && Array.isArray(parsed.reviews)) {
      const reviews: ReviewRecord[] = [];
      let hasArabic = false;
      let hasEnglish = false;

      for (let i = 0; i < parsed.reviews.length; i++) {
        const r = parsed.reviews[i];
        const text = String(r.text || '').trim();
        if (!text || text.length < 5) continue;

        reviews.push({
          id: `review-${i + 1}`,
          text,
          rating: r.rating ? Number(r.rating) : undefined,
          date: r.date ? String(r.date) : undefined,
          source: r.source ? String(r.source) : undefined,
        });

        const arabicPattern = /[\u0600-\u06FF]/;
        if (arabicPattern.test(text)) hasArabic = true;
        else hasEnglish = true;
      }

      const language: ReviewsInput['language'] = 
        hasArabic && hasEnglish ? 'mixed' : 
        hasArabic ? 'ar' : 'en';

      return { reviews, language };
    }
  } catch {
    // Fallback to basic parsing
  }

  return fallbackParseReviews(data, headers);
}

/**
 * Fallback parsing without AI
 */
function fallbackParseReviews(data: Record<string, unknown>[], headers: string[]): ReviewsInput {
  const reviews: ReviewRecord[] = [];
  let hasArabic = false;
  let hasEnglish = false;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // Find the longest text value as the review
    let longestText = '';
    let rating: number | undefined;

    for (const [, value] of Object.entries(row)) {
      const strVal = String(value || '').trim();
      if (strVal.length > longestText.length) {
        longestText = strVal;
      }
      const numVal = parseFloat(strVal);
      if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
        rating = numVal;
      }
    }

    if (longestText.length >= 5) {
      reviews.push({
        id: `review-${i + 1}`,
        text: longestText,
        rating,
      });

      const arabicPattern = /[\u0600-\u06FF]/;
      if (arabicPattern.test(longestText)) hasArabic = true;
      else hasEnglish = true;
    }
  }

  const language: ReviewsInput['language'] = 
    hasArabic && hasEnglish ? 'mixed' : 
    hasArabic ? 'ar' : 'en';

  return { reviews, language };
}

/**
 * Parse plain text reviews (one per line)
 */
export function parseTextReviews(text: string): ReviewsInput {
  const lines = text.split('\n').filter(line => line.trim().length > 5);
  const reviews: ReviewRecord[] = lines.map((line, index) => ({
    id: `review-${index + 1}`,
    text: line.trim(),
  }));

  // Detect language
  const arabicPattern = /[\u0600-\u06FF]/;
  const hasArabic = reviews.some(r => arabicPattern.test(r.text));
  const hasEnglish = reviews.some(r => !arabicPattern.test(r.text));
  
  const language: ReviewsInput['language'] = 
    hasArabic && hasEnglish ? 'mixed' : 
    hasArabic ? 'ar' : 'en';

  return { reviews, language };
}

/**
 * Analyze sentiment using AI
 */
export async function analyzeSentiment(
  apiKey: string,
  reviews: ReviewRecord[]
): Promise<ReviewAnalysis[]> {
  if (reviews.length === 0) return [];

  // Process in batches to avoid token limits
  const batchSize = 20;
  const results: ReviewAnalysis[] = [];

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const batchResults = await analyzeSentimentBatch(apiKey, batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Analyze a batch of reviews
 */
async function analyzeSentimentBatch(
  apiKey: string,
  reviews: ReviewRecord[]
): Promise<ReviewAnalysis[]> {
  const reviewsText = reviews.map((r, i) => 
    `${i + 1}. [ID: ${r.id}] ${r.text.substring(0, 500)}`
  ).join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: SENTIMENT_ANALYSIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Analyze the following reviews:\n\n${reviewsText}\n\nReturn the result in JSON format.`,
    },
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.1, maxTokens: 2000 });
    const parsed = JSON.parse(response.content);
    
    return reviews.map((review, index) => {
      const analysis = parsed.reviews?.[index] || {};
      return {
        reviewId: review.id,
        text: review.text,
        sentiment: validateSentiment(analysis.sentiment),
        rating: review.rating,
        extractedIssues: Array.isArray(analysis.issues) ? analysis.issues : [],
        extractedPraises: Array.isArray(analysis.praises) ? analysis.praises : [],
      };
    });
  } catch {
    // Fallback: use keyword-based sentiment analysis
    return reviews.map(review => keywordAnalyzeSentiment(review));
  }
}

/**
 * Validate sentiment value
 */
function validateSentiment(sentiment: unknown): SentimentType {
  const valid: SentimentType[] = ['positive', 'negative', 'neutral'];
  if (typeof sentiment === 'string' && valid.includes(sentiment as SentimentType)) {
    return sentiment as SentimentType;
  }
  return 'neutral';
}

/**
 * Keyword-based sentiment analysis fallback
 */
function keywordAnalyzeSentiment(review: ReviewRecord): ReviewAnalysis {
  const text = review.text.toLowerCase();
  
  const positiveKeywords = [
    'excellent', 'great', 'amazing', 'love', 'perfect', 'best', 'recommend', 'happy',
    'ممتاز', 'رائع', 'جميل', 'أحب', 'مثالي', 'أفضل', 'أنصح', 'سعيد', 'شكرا'
  ];
  
  const negativeKeywords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'broken', 'poor',
    'سيء', 'فظيع', 'أكره', 'أسوأ', 'محبط', 'مكسور', 'ضعيف', 'مشكلة', 'تأخير'
  ];

  const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
  const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;

  // Also consider rating if available
  let sentiment: SentimentType = 'neutral';
  if (review.rating !== undefined) {
    if (review.rating >= 4) sentiment = 'positive';
    else if (review.rating <= 2) sentiment = 'negative';
  } else {
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
  }

  return {
    reviewId: review.id,
    text: review.text,
    sentiment,
    rating: review.rating,
    extractedIssues: [],
    extractedPraises: [],
  };
}

/**
 * Calculate sentiment distribution
 */
export function calculateSentimentDistribution(
  analyses: ReviewAnalysis[]
): SentimentDistribution {
  const distribution: SentimentDistribution = {
    positive: 0,
    negative: 0,
    neutral: 0,
    total: analyses.length,
  };

  for (const analysis of analyses) {
    distribution[analysis.sentiment]++;
  }

  return distribution;
}

/**
 * Extract pain points from analyses
 */
export function extractPainPoints(analyses: ReviewAnalysis[]): PainPoint[] {
  const issueMap = new Map<string, { count: number; examples: string[] }>();

  // Collect all issues from negative reviews
  for (const analysis of analyses) {
    if (analysis.sentiment === 'negative' || analysis.extractedIssues.length > 0) {
      for (const issue of analysis.extractedIssues) {
        const normalized = issue.toLowerCase().trim();
        if (normalized.length < 3) continue;
        
        const existing = issueMap.get(normalized) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(analysis.text.substring(0, 150));
        }
        issueMap.set(normalized, existing);
      }
    }
  }

  // Convert to PainPoint array and sort by frequency
  const painPoints: PainPoint[] = Array.from(issueMap.entries())
    .map(([issue, data]) => ({
      issue,
      frequency: data.count,
      severity: determineSeverity(data.count, analyses.length),
      exampleReviews: data.examples,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return painPoints;
}

/**
 * Determine severity based on frequency
 */
function determineSeverity(count: number, total: number): SeverityLevel {
  const percentage = (count / total) * 100;
  if (percentage >= 20) return 'high';
  if (percentage >= 10) return 'medium';
  return 'low';
}

/**
 * Extract praised features from analyses
 */
export function extractPraisedFeatures(analyses: ReviewAnalysis[]): PraisedFeature[] {
  const featureMap = new Map<string, { count: number; examples: string[] }>();

  // Collect all praises from positive reviews
  for (const analysis of analyses) {
    if (analysis.sentiment === 'positive' || analysis.extractedPraises.length > 0) {
      for (const praise of analysis.extractedPraises) {
        const normalized = praise.toLowerCase().trim();
        if (normalized.length < 3) continue;
        
        const existing = featureMap.get(normalized) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(analysis.text.substring(0, 150));
        }
        featureMap.set(normalized, existing);
      }
    }
  }

  // Convert to PraisedFeature array and sort by frequency
  const praisedFeatures: PraisedFeature[] = Array.from(featureMap.entries())
    .map(([feature, data]) => ({
      feature,
      frequency: data.count,
      exampleReviews: data.examples,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return praisedFeatures;
}

/**
 * Generate insights using AI with Tool Use for calculations
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
export async function generateInsights(
  apiKey: string,
  sentimentDistribution: SentimentDistribution,
  painPoints: PainPoint[],
  praisedFeatures: PraisedFeature[],
  responseLanguage?: string
): Promise<{
  improvements: string[];
  weaknesses: string[];
  opportunities: string[];
}> {
  // Calculate percentages using precise math
  const positivePercent = sentimentDistribution.total > 0 
    ? ((sentimentDistribution.positive / sentimentDistribution.total) * 100).toFixed(1)
    : '0.0';
  const negativePercent = sentimentDistribution.total > 0 
    ? ((sentimentDistribution.negative / sentimentDistribution.total) * 100).toFixed(1)
    : '0.0';
  const neutralPercent = sentimentDistribution.total > 0 
    ? ((sentimentDistribution.neutral / sentimentDistribution.total) * 100).toFixed(1)
    : '0.0';

  const analysisContext = `
Review Analysis:
- Total Reviews: ${sentimentDistribution.total}
- Positive: ${sentimentDistribution.positive} (${positivePercent}%)
- Negative: ${sentimentDistribution.negative} (${negativePercent}%)
- Neutral: ${sentimentDistribution.neutral} (${neutralPercent}%)

Main Pain Points:
${painPoints.slice(0, 5).map(p => `- ${p.issue} (${p.frequency} times, severity: ${p.severity})`).join('\n')}

Praised Features:
${praisedFeatures.slice(0, 5).map(f => `- ${f.feature} (${f.frequency} times)`).join('\n')}
`;

  const systemPrompt = `${getInsightsPrompt(responseLanguage)}

IMPORTANT: When you need to calculate percentages, ratios, or any mathematical operations, use the 'calculate' tool instead of calculating yourself. This ensures accuracy.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: analysisContext },
  ];

  try {
    // Use chatWithTools for AI to use calculator when needed
    const response = await chatWithTools(apiKey, messages, { 
      temperature: 0.7, 
      maxTokens: 2000,
      enableCalculator: true,
    });
    const parsed = JSON.parse(response.content);
    
    return {
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    };
  } catch {
    // Fallback to regular chat then fallback insights
    try {
      const response = await chat(apiKey, messages, { temperature: 0.7, maxTokens: 2000 });
      const parsed = JSON.parse(response.content);
      return {
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      };
    } catch {
      return generateFallbackInsights(painPoints, praisedFeatures, responseLanguage);
    }
  }
}

/**
 * Generate fallback insights without AI
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
function generateFallbackInsights(
  painPoints: PainPoint[],
  praisedFeatures: PraisedFeature[],
  responseLanguage?: string
): {
  improvements: string[];
  weaknesses: string[];
  opportunities: string[];
} {
  const improvements: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  // For fallback, we use simple language detection - Arabic if responseLanguage is 'ar'
  const isArabic = responseLanguage === 'ar';

  // Generate improvements from pain points
  for (const point of painPoints.slice(0, 3)) {
    if (point.severity === 'high') {
      improvements.push(isArabic
        ? `معالجة مشكلة "${point.issue}" بشكل عاجل - تم ذكرها ${point.frequency} مرة`
        : `Address "${point.issue}" urgently - mentioned ${point.frequency} times`);
      weaknesses.push(isArabic
        ? `نقطة ضعف رئيسية: ${point.issue}`
        : `Major weakness: ${point.issue}`);
    }
  }

  // Generate opportunities from praised features
  for (const feature of praisedFeatures.slice(0, 3)) {
    opportunities.push(isArabic
      ? `تعزيز ميزة "${feature.feature}" التي يحبها العملاء`
      : `Enhance "${feature.feature}" feature that customers love`);
  }

  if (improvements.length === 0) {
    improvements.push(isArabic
      ? 'راجع المراجعات السلبية لتحديد فرص التحسين'
      : 'Review negative feedback to identify improvement opportunities');
  }

  if (opportunities.length === 0) {
    opportunities.push(isArabic
      ? 'ركز على الميزات التي يمدحها العملاء في التسويق'
      : 'Focus on features customers praise in your marketing');
  }

  return { improvements, weaknesses, opportunities };
}

/**
 * Main analysis function - simplified single file approach
 */
export async function analyzeReviews(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[],
  options: { locale?: string; rawText?: string } = {}
): Promise<ReviewInsightResult> {
  const { locale = 'en', rawText } = options;
  const startTime = Date.now();
  let tokensUsed = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [Review Insight] Starting analysis...');
  console.log(`📊 Data: ${data.length} rows`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1: Parse reviews data
  let reviewsInput: ReviewsInput;
  if (rawText) {
    reviewsInput = parseTextReviews(rawText);
  } else {
    reviewsInput = await parseReviewsData(apiKey, data, headers);
    tokensUsed += estimateTokens(JSON.stringify(data.slice(0, 9))) * 2;
  }

  // Step 2: Analyze sentiment for all reviews
  const reviewAnalysis = await analyzeSentiment(apiKey, reviewsInput.reviews);
  tokensUsed += estimateTokens(reviewsInput.reviews.map(r => r.text).join(' ')) * 2;

  // Step 3: Calculate sentiment distribution
  const sentimentDistribution = calculateSentimentDistribution(reviewAnalysis);

  // Step 4: Extract pain points
  const painPoints = extractPainPoints(reviewAnalysis);

  // Step 5: Extract praised features
  const praisedFeatures = extractPraisedFeatures(reviewAnalysis);

  // Step 6: Generate AI insights
  const insights = await generateInsights(
    apiKey,
    sentimentDistribution,
    painPoints,
    praisedFeatures,
    locale
  );
  tokensUsed += 2000; // Approximate for insights generation

  return {
    sentimentDistribution,
    painPoints,
    praisedFeatures,
    productImprovements: insights.improvements,
    competitorWeaknesses: insights.weaknesses,
    marketOpportunities: insights.opportunities,
    reviewAnalysis,
    tokensUsed,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Estimate tokens for analysis
 */
export function estimateAnalysisTokens(data: Record<string, unknown>[]): number {
  // Estimate based on data size
  const dataTokens = estimateTokens(JSON.stringify(data.slice(0, 9))) * 3;
  const insightsTokens = 2000;
  
  return dataTokens + insightsTokens;
}

/**
 * Get sentiment label
 * Note: For multi-language support, use translations from messages/*.json
 * This function provides English fallback labels only
 */
export function getSentimentLabel(sentiment: SentimentType, locale: string = 'en'): string {
  const labels: Record<SentimentType, Record<string, string>> = {
    positive: { en: 'Positive' },
    negative: { en: 'Negative' },
    neutral: { en: 'Neutral' },
  };
  return labels[sentiment][locale] || labels[sentiment]['en'];
}

/**
 * Get severity label
 * Note: For multi-language support, use translations from messages/*.json
 * This function provides English fallback labels only
 */
export function getSeverityLabel(severity: SeverityLevel, locale: string = 'en'): string {
  const labels: Record<SeverityLevel, Record<string, string>> = {
    high: { en: 'High' },
    medium: { en: 'Medium' },
    low: { en: 'Low' },
  };
  return labels[severity][locale] || labels[severity]['en'];
}

/**
 * Get sentiment color for UI
 */
export function getSentimentColor(sentiment: SentimentType): string {
  const colors: Record<SentimentType, string> = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };
  return colors[sentiment];
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: SeverityLevel): string {
  const colors: Record<SeverityLevel, string> = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500',
  };
  return colors[severity];
}
