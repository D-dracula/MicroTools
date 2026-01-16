/**
 * Article Generator Service
 * 
 * AI-powered article generation using Exa for research and OpenRouter for content creation.
 * 
 * Requirements: 2.3, 2.4, 2.5, 2.8
 * - Search for trending e-commerce topics using Exa
 * - Select best topic based on recency and relevance scores
 * - Generate 800-1200 word articles using OpenRouter
 * - Rate limit to 5 articles per day per admin
 */

import { createAdminClient } from '@/lib/supabase/client';
import { chat } from '@/lib/ai-tools/openrouter-client';
import type {
  Article,
  ArticleCategory,
  ArticleSource,
  ExaSearchResult,
  GenerationStatus,
  GenerationProgress,
} from './types';
import { ARTICLE_CATEGORIES, isArticleCategory } from './types';
import { createArticle } from './article-service';
import { extractDomain } from './domain-extractor';
import { getThumbnailForCategory } from './thumbnail-service';

// ============================================================================
// Constants
// ============================================================================

/** Maximum articles per admin per day */
const DAILY_RATE_LIMIT = 5;

/** Target word count range for generated articles */
const MIN_WORD_COUNT = 800;
const MAX_WORD_COUNT = 1200;

/** E-commerce topic search queries for Exa */
const TOPIC_SEARCH_QUERIES = [
  'e-commerce seller tips strategies 2025',
  'online marketplace trends digital marketing',
  'dropshipping business growth tactics',
  'Amazon FBA seller optimization',
  'e-commerce logistics shipping solutions',
  'social media marketing for online stores',
  'product pricing strategies e-commerce',
  'customer retention e-commerce business',
];

/** Category keywords for topic classification */
const CATEGORY_KEYWORDS: Record<ArticleCategory, string[]> = {
  'marketing': ['marketing', 'advertising', 'social media', 'SEO', 'content', 'brand', 'promotion', 'campaign', 'audience', 'engagement'],
  'seller-tools': ['tools', 'software', 'automation', 'analytics', 'dashboard', 'platform', 'integration', 'app', 'plugin', 'extension'],
  'logistics': ['shipping', 'logistics', 'fulfillment', 'warehouse', 'delivery', 'supply chain', 'inventory', 'FBA', 'dropshipping', 'freight'],
  'trends': ['trends', 'future', 'prediction', 'growth', 'market', 'industry', 'innovation', 'emerging', '2025', '2026'],
  'case-studies': ['case study', 'success story', 'example', 'how', 'achieved', 'results', 'strategy', 'implementation', 'real-world'],
};

/** Similarity threshold for topic deduplication (0-1, higher = more strict) */
const SIMILARITY_THRESHOLD = 0.45;

/** Number of recent articles to check for duplicates */
const DUPLICATE_CHECK_LIMIT = 100;

// ============================================================================
// Types
// ============================================================================

/** Topic with scoring for selection */
export interface ScoredTopic {
  title: string;
  url: string;
  text: string;
  publishedDate: string;
  relevanceScore: number;
  recencyScore: number;
  combinedScore: number;
  suggestedCategory: ArticleCategory;
}

/** Rate limit check result */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  generatedToday: number;
}

/** Article generation result */
export interface GenerationResult {
  success: boolean;
  article?: Article;
  error?: GenerationError;
}

/** Generation error types */
export interface GenerationError {
  code: 'RATE_LIMIT_EXCEEDED' | 'EXA_SEARCH_FAILED' | 'NO_TOPICS_FOUND' | 'CONTENT_GENERATION_FAILED' | 'SAVE_FAILED' | 'UNAUTHORIZED';
  message: string;
  resetAt?: Date;
  suggestions?: string[];
}

/** Progress callback type */
export type ProgressCallback = (progress: GenerationProgress) => void;

/** Existing article info for deduplication */
export interface ExistingArticleInfo {
  title: string;
  keywords: string[];
}

// ============================================================================
// Topic Deduplication System
// ============================================================================

/**
 * Extract keywords from text for similarity comparison
 * Removes common stop words and normalizes text
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
    'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'your', 'our', 'their', 'my', 'his',
    'her', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'any',
    // E-commerce common words (less distinctive)
    'ecommerce', 'e-commerce', 'online', 'store', 'business', 'seller', 'sellers',
    'guide', 'tips', 'strategies', 'best', 'top', 'new', 'ultimate', 'complete',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 20); // Keep top 20 keywords
}

/**
 * Calculate Jaccard similarity between two sets of keywords
 * Returns value between 0 (no similarity) and 1 (identical)
 */
function calculateJaccardSimilarity(keywords1: string[], keywords2: string[]): number {
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

/**
 * Calculate n-gram similarity for better phrase matching
 * Uses bigrams (2-word sequences) for more context
 */
function calculateNgramSimilarity(text1: string, text2: string): number {
  const getBigrams = (text: string): Set<string> => {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
    const bigrams = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.add(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams;
  };

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

/**
 * Calculate combined similarity score between two topics
 * Uses both keyword and n-gram similarity for better accuracy
 */
function calculateTopicSimilarity(
  newTopic: { title: string; text?: string },
  existingArticle: ExistingArticleInfo
): number {
  // Title similarity (weighted higher)
  const newTitleKeywords = extractKeywords(newTopic.title);
  const titleSimilarity = calculateJaccardSimilarity(newTitleKeywords, existingArticle.keywords);
  
  // N-gram similarity for title
  const ngramSimilarity = calculateNgramSimilarity(newTopic.title, existingArticle.title);
  
  // Combined score: 50% keyword, 50% n-gram
  return (titleSimilarity * 0.5) + (ngramSimilarity * 0.5);
}

/**
 * Fetch existing article titles and keywords from database
 * 
 * @returns Array of existing article info for deduplication
 */
export async function getExistingArticlesForDedup(): Promise<ExistingArticleInfo[]> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('articles' as any)
    .select('title')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(DUPLICATE_CHECK_LIMIT);
  
  if (error) {
    console.error('Failed to fetch existing articles for dedup:', error);
    return [];
  }
  
  return (data || []).map((row: any) => ({
    title: row.title,
    keywords: extractKeywords(row.title),
  }));
}

/**
 * Check if a topic is too similar to existing articles
 * 
 * @param topic - New topic to check
 * @param existingArticles - List of existing articles
 * @returns Object with isDuplicate flag and most similar article if found
 */
export function checkTopicDuplication(
  topic: { title: string; text?: string },
  existingArticles: ExistingArticleInfo[]
): { isDuplicate: boolean; similarTo?: string; similarity: number } {
  let maxSimilarity = 0;
  let mostSimilarTitle = '';
  
  for (const existing of existingArticles) {
    const similarity = calculateTopicSimilarity(topic, existing);
    
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarTitle = existing.title;
    }
  }
  
  return {
    isDuplicate: maxSimilarity >= SIMILARITY_THRESHOLD,
    similarTo: maxSimilarity >= SIMILARITY_THRESHOLD ? mostSimilarTitle : undefined,
    similarity: maxSimilarity,
  };
}

/**
 * Filter out duplicate topics from search results
 * 
 * @param results - Exa search results
 * @param existingArticles - Existing articles for comparison
 * @returns Filtered results with duplicates removed
 */
export function filterDuplicateTopics(
  results: ExaSearchResult[],
  existingArticles: ExistingArticleInfo[]
): { filtered: ExaSearchResult[]; skipped: Array<{ title: string; similarTo: string; similarity: number }> } {
  const filtered: ExaSearchResult[] = [];
  const skipped: Array<{ title: string; similarTo: string; similarity: number }> = [];
  
  for (const result of results) {
    const dupCheck = checkTopicDuplication(
      { title: result.title, text: result.text },
      existingArticles
    );
    
    if (dupCheck.isDuplicate) {
      skipped.push({
        title: result.title,
        similarTo: dupCheck.similarTo || '',
        similarity: dupCheck.similarity,
      });
      console.log(`⚠️ Skipping duplicate topic: "${result.title}" (${(dupCheck.similarity * 100).toFixed(0)}% similar to "${dupCheck.similarTo}")`);
    } else {
      filtered.push(result);
    }
  }
  
  if (skipped.length > 0) {
    console.log(`📊 Topic deduplication: ${filtered.length} unique, ${skipped.length} duplicates skipped`);
  }
  
  return { filtered, skipped };
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Check if admin has exceeded daily rate limit
 * 
 * @param adminId - Admin user ID
 * @returns Rate limit status
 * 
 * Requirements: 2.8
 */
export async function checkRateLimit(adminId: string): Promise<RateLimitResult> {
  // Use admin client to bypass RLS for rate limit checking
  const supabase = createAdminClient();
  
  // Get start of current day (UTC)
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  // Count generations today
  const { count, error } = await supabase
    .from('article_generation_log' as any)
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId)
    .gte('generated_at', startOfDay.toISOString())
    .lt('generated_at', endOfDay.toISOString());
  
  if (error) {
    console.error('Failed to check rate limit:', error);
    // Default to allowing if check fails
    return {
      allowed: true,
      remaining: DAILY_RATE_LIMIT,
      resetAt: endOfDay,
      generatedToday: 0,
    };
  }
  
  const generatedToday = count || 0;
  const remaining = Math.max(0, DAILY_RATE_LIMIT - generatedToday);
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt: endOfDay,
    generatedToday,
  };
}

/**
 * Log article generation attempt
 * 
 * @param adminId - Admin user ID
 * @param topic - Topic that was generated
 * @param success - Whether generation succeeded
 * @param errorMessage - Error message if failed
 */
async function logGeneration(
  adminId: string,
  topic: string | null,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  // Use admin client to bypass RLS for logging
  const supabase = createAdminClient();
  
  await supabase
    .from('article_generation_log' as any)
    .insert({
      admin_id: adminId,
      topic,
      success,
      error_message: errorMessage || null,
    });
}

// ============================================================================
// Topic Search and Selection
// ============================================================================

/**
 * Search for trending e-commerce topics using Exa
 * 
 * This function is designed to work with the Exa MCP tool.
 * In production, it will be called from the API route which has access to MCP.
 * 
 * @param searchResults - Results from Exa search (passed from API route)
 * @returns Array of search results
 * 
 * Requirements: 2.3
 */
export function processExaResults(searchResults: ExaSearchResult[]): ExaSearchResult[] {
  // Filter out results with insufficient content
  return searchResults.filter(result => 
    result.title && 
    result.url && 
    result.text && 
    result.text.length > 100
  );
}

/**
 * Calculate recency score based on publication date
 * More recent = higher score (0-1)
 */
function calculateRecencyScore(publishedDate: string): number {
  if (!publishedDate) return 0.5; // Default for unknown dates
  
  try {
    const published = new Date(publishedDate);
    const now = new Date();
    const daysSincePublished = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
    
    // Score decreases with age: 1.0 for today, ~0.5 for 30 days, ~0.1 for 90+ days
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

/**
 * Determine article category based on content keywords
 */
function classifyCategory(title: string, text: string): ArticleCategory {
  const content = `${title} ${text}`.toLowerCase();
  
  let bestCategory: ArticleCategory = 'trends'; // Default
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

/**
 * Select the best topic from search results
 * 
 * @param results - Exa search results
 * @param existingArticles - Optional existing articles for deduplication
 * @returns Best topic with scoring
 * 
 * Requirements: 2.4
 */
export function selectBestTopic(
  results: ExaSearchResult[],
  existingArticles?: ExistingArticleInfo[]
): ScoredTopic | null {
  if (!results || results.length === 0) {
    return null;
  }
  
  // Filter duplicates if existing articles provided
  let filteredResults = results;
  if (existingArticles && existingArticles.length > 0) {
    const { filtered, skipped } = filterDuplicateTopics(results, existingArticles);
    filteredResults = filtered;
    
    if (filteredResults.length === 0) {
      console.log('⚠️ All topics were duplicates. Skipped topics:', skipped.map(s => s.title));
      return null;
    }
  }
  
  // Score and rank all topics
  const scoredTopics: ScoredTopic[] = filteredResults.map(result => {
    const recencyScore = calculateRecencyScore(result.publishedDate);
    const relevanceScore = result.score || 0.5;
    
    // Combined score: 60% relevance, 40% recency
    const combinedScore = (relevanceScore * 0.6) + (recencyScore * 0.4);
    
    return {
      title: result.title,
      url: result.url,
      text: result.text,
      publishedDate: result.publishedDate,
      relevanceScore,
      recencyScore,
      combinedScore,
      suggestedCategory: classifyCategory(result.title, result.text),
    };
  });
  
  // Sort by combined score (highest first)
  scoredTopics.sort((a, b) => b.combinedScore - a.combinedScore);
  
  return scoredTopics[0];
}

// ============================================================================
// Article Generation
// ============================================================================

/**
 * Generate article content using OpenRouter
 * 
 * @param apiKey - OpenRouter API key
 * @param topic - Selected topic with research content
 * @param category - Target category (optional, will use suggested if not provided)
 * @param existingTitles - Optional list of existing article titles to avoid similarity
 * @returns Generated article data
 * 
 * Requirements: 2.5, 2.6
 */
export async function generateArticle(
  apiKey: string,
  topic: ScoredTopic,
  category?: ArticleCategory,
  existingTitles?: string[]
): Promise<{
  title: string;
  summary: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  sources: ArticleSource[];
  metaTitle: string;
  metaDescription: string;
}> {
  const targetCategory = category && isArticleCategory(category) 
    ? category 
    : topic.suggestedCategory;
  
  // Build uniqueness instruction if existing titles provided
  const uniquenessInstruction = existingTitles && existingTitles.length > 0
    ? `\n\nIMPORTANT - UNIQUENESS REQUIREMENT:
Your article must be UNIQUE and DIFFERENT from these existing articles:
${existingTitles.slice(0, 10).map(t => `- "${t}"`).join('\n')}

Create a fresh perspective, different angle, or new approach to the topic. Do NOT repeat similar titles or content structures.`
    : '';

  const systemPrompt = `You are an expert e-commerce content writer. Your task is to create high-quality, informative articles for online sellers and e-commerce business owners.

IMPORTANT GUIDELINES:
1. Write in a professional but accessible tone
2. Include practical, actionable advice
3. Use clear headings and structure
4. Target word count: ${MIN_WORD_COUNT}-${MAX_WORD_COUNT} words
5. Focus on the ${targetCategory} category
6. Include relevant statistics and examples when possible
7. Write content that would be valuable for e-commerce sellers
8. CREATE UNIQUE CONTENT - avoid generic titles and repetitive structures${uniquenessInstruction}

SPECIAL FORMATTING ELEMENTS (Use these to enhance the article):

1. PRO TIPS - Use for important advice:
   <div class="pro-tip">
   <strong>Pro Tip</strong>
   Your tip content here...
   </div>

2. WARNINGS - Use for cautions:
   <div class="warning">
   <strong>Warning</strong>
   Warning content here...
   </div>

3. INFO BOXES - Use for additional information:
   <div class="info">
   <strong>Did You Know?</strong>
   Information content here...
   </div>

4. SUCCESS BOXES - Use for positive outcomes:
   <div class="success">
   <strong>Success Story</strong>
   Success content here...
   </div>

5. CUSTOMER QUOTES/TESTIMONIALS:
   <div class="testimonial">
   "Quote from a seller or expert here..."
   <cite>Name, Title/Company</cite>
   </div>

6. KEY TAKEAWAYS (Use at the end of article):
   <div class="key-takeaways">
   <div class="key-takeaways-title">Key Takeaways</div>
   <ul>
   <li>First key point</li>
   <li>Second key point</li>
   <li>Third key point</li>
   </ul>
   </div>

7. STEP-BY-STEP SECTIONS:
   <div class="steps">
   <div class="step">
   <div class="step-title">Step Title</div>
   Step description here...
   </div>
   <div class="step">
   <div class="step-title">Next Step Title</div>
   Next step description...
   </div>
   </div>

8. HIGHLIGHT BOXES (for statistics):
   <div class="highlight-box">
   <div class="highlight-box-title">Conversion Rate</div>
   <div class="highlight-box-value">+45%</div>
   <div class="highlight-box-description">Average increase for optimized stores</div>
   </div>

ARTICLE STRUCTURE:
- Start with an engaging introduction
- Use ## for main sections (H2)
- Use ### for subsections (H3)
- Include at least 2-3 Pro Tips throughout the article
- Add a Key Takeaways section at the end
- Use testimonials or quotes when relevant

OUTPUT FORMAT (JSON):
{
  "title": "Engaging article title (max 100 chars)",
  "summary": "Brief 2-3 sentence summary (max 200 chars)",
  "content": "Full article content in markdown format with ## headings and special formatting elements",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO title (max 60 chars)",
  "metaDescription": "SEO description (max 155 chars)"
}

RESPOND ONLY WITH VALID JSON. No additional text.`;

  const userPrompt = `Based on this research, write an original article about e-commerce:

RESEARCH TOPIC: ${topic.title}

RESEARCH CONTENT:
${topic.text.substring(0, 2000)}

SOURCE URL: ${topic.url}

Create an original, comprehensive article that expands on this topic with practical insights for e-commerce sellers. The article should be unique and not copy the source directly.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  const response = await chat(apiKey, messages, {
    temperature: 0.7,
    maxTokens: 3000,
  });

  // Parse the JSON response with improved error handling
  let articleData;
  try {
    const content = response.content.trim();
    
    // Log the response for debugging
    console.log('AI Response length:', content.length);
    console.log('AI Response preview:', content.substring(0, 500));
    
    // Try multiple approaches to extract JSON
    let jsonString = content;
    
    // 1. Try to find JSON in code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    } else {
      // 2. Try to extract JSON object directly
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }
    
    // 3. Clean up common issues
    jsonString = jsonString
      .replace(/[\u0000-\u001F]+/g, ' ') // Remove control characters
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    articleData = JSON.parse(jsonString);
  } catch (parseError) {
    console.error('Failed to parse article response:', parseError);
    console.error('Raw response:', response.content.substring(0, 1000));
    
    // Fallback: Create a basic article from the response
    const fallbackContent = response.content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/^\s*\{[\s\S]*?\}\s*$/m, '') // Remove JSON attempts
      .trim();
    
    if (fallbackContent.length > 200) {
      articleData = {
        title: topic.title.substring(0, 100),
        summary: topic.text.substring(0, 200),
        content: fallbackContent,
        tags: [],
        metaTitle: topic.title.substring(0, 60),
        metaDescription: topic.text.substring(0, 155),
      };
    } else {
      throw new Error('Failed to parse generated article content');
    }
  }

  // Validate required fields
  if (!articleData.title || !articleData.content) {
    throw new Error('Generated article missing required fields');
  }

  // Create source from the research
  const sources: ArticleSource[] = [{
    url: topic.url,
    title: topic.title,
    domain: extractDomain(topic.url),
  }];

  return {
    title: articleData.title,
    summary: articleData.summary || articleData.title,
    content: articleData.content,
    category: targetCategory,
    tags: Array.isArray(articleData.tags) ? articleData.tags.slice(0, 5) : [],
    sources,
    metaTitle: articleData.metaTitle || articleData.title.substring(0, 60),
    metaDescription: articleData.metaDescription || (articleData.summary || '').substring(0, 155),
  };
}

// ============================================================================
// Full Generation Flow
// ============================================================================

/**
 * Full article generation flow
 * 
 * This orchestrates the entire generation process:
 * 1. Check rate limit
 * 2. Fetch existing articles for deduplication
 * 3. Search for topics (results passed in)
 * 4. Filter duplicate topics
 * 5. Select best unique topic
 * 6. Generate article content
 * 7. Assign thumbnail
 * 8. Save to database
 * 
 * @param adminId - Admin user ID
 * @param apiKey - OpenRouter API key
 * @param exaResults - Search results from Exa MCP
 * @param options - Generation options
 * @param onProgress - Progress callback
 * @returns Generation result
 */
export async function generateFullArticle(
  adminId: string,
  apiKey: string,
  exaResults: ExaSearchResult[],
  options: {
    category?: ArticleCategory;
    topic?: string;
  } = {},
  onProgress?: ProgressCallback
): Promise<GenerationResult> {
  const updateProgress = (status: GenerationStatus, message: string, progress: number, error?: string) => {
    if (onProgress) {
      onProgress({ status, message, progress, error });
    }
  };

  try {
    // Step 1: Check rate limit
    updateProgress('searching', 'Checking rate limit...', 5);
    const rateLimit = await checkRateLimit(adminId);
    
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Daily limit of ${DAILY_RATE_LIMIT} articles reached. Try again tomorrow.`,
          resetAt: rateLimit.resetAt,
        },
      };
    }

    // Step 2: Fetch existing articles for deduplication
    updateProgress('searching', 'Checking for duplicate topics...', 10);
    const existingArticles = await getExistingArticlesForDedup();
    console.log(`📚 Loaded ${existingArticles.length} existing articles for deduplication`);

    // Step 3: Process search results
    updateProgress('searching', 'Processing search results...', 15);
    const processedResults = processExaResults(exaResults);
    
    if (processedResults.length === 0) {
      await logGeneration(adminId, null, false, 'No valid topics found');
      return {
        success: false,
        error: {
          code: 'NO_TOPICS_FOUND',
          message: 'No suitable topics found from search results.',
          suggestions: TOPIC_SEARCH_QUERIES.slice(0, 3),
        },
      };
    }

    // Step 4: Select best unique topic (with deduplication)
    updateProgress('selecting', 'Selecting unique topic...', 30);
    const selectedTopic = selectBestTopic(processedResults, existingArticles);
    
    if (!selectedTopic) {
      await logGeneration(adminId, null, false, 'All topics were duplicates of existing articles');
      return {
        success: false,
        error: {
          code: 'NO_TOPICS_FOUND',
          message: 'All found topics are too similar to existing articles. Try different search queries.',
          suggestions: TOPIC_SEARCH_QUERIES.slice(3, 6),
        },
      };
    }

    console.log(`✅ Selected unique topic: ${selectedTopic.title} (score: ${selectedTopic.combinedScore.toFixed(2)})`);

    // Step 5: Generate article content
    updateProgress('generating', 'Generating article content...', 50);
    let articleData;
    try {
      // Pass existing titles to help AI create unique content
      const existingTitles = existingArticles.map(a => a.title);
      articleData = await generateArticle(apiKey, selectedTopic, options.category, existingTitles);
    } catch (genError) {
      const errorMessage = genError instanceof Error ? genError.message : 'Unknown error';
      await logGeneration(adminId, selectedTopic.title, false, errorMessage);
      return {
        success: false,
        error: {
          code: 'CONTENT_GENERATION_FAILED',
          message: `Failed to generate article: ${errorMessage}`,
        },
      };
    }

    // Step 6: Assign thumbnail
    updateProgress('creating-thumbnail', 'Assigning thumbnail...', 75);
    const thumbnailUrl = getThumbnailForCategory(articleData.category);

    // Step 7: Save to database
    updateProgress('saving', 'Saving article...', 90);
    let savedArticle: Article;
    try {
      savedArticle = await createArticle({
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        category: articleData.category,
        tags: articleData.tags,
        thumbnailUrl,
        sources: articleData.sources,
        metaTitle: articleData.metaTitle,
        metaDescription: articleData.metaDescription,
        isPublished: true,
      });
    } catch (saveError) {
      const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown error';
      await logGeneration(adminId, selectedTopic.title, false, errorMessage);
      return {
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: `Failed to save article: ${errorMessage}`,
        },
      };
    }

    // Log successful generation
    await logGeneration(adminId, selectedTopic.title, true);

    updateProgress('complete', 'Article generated successfully!', 100);

    return {
      success: true,
      article: savedArticle,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateProgress('error', errorMessage, 0, errorMessage);
    
    return {
      success: false,
      error: {
        code: 'CONTENT_GENERATION_FAILED',
        message: errorMessage,
      },
    };
  }
}

// ============================================================================
// Utility Exports
// ============================================================================

export { TOPIC_SEARCH_QUERIES, DAILY_RATE_LIMIT, MIN_WORD_COUNT, MAX_WORD_COUNT, SIMILARITY_THRESHOLD };
