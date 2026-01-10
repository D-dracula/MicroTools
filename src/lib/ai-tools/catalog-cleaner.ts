/**
 * AI Catalog Cleaner Module
 * Translates and cleans supplier product catalogs using AI
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { chat, chatWithTools, estimateTokens, ChatMessage } from './openrouter-client';
import { getLanguageInstruction } from './shared-utils';

// Types
export interface ProductRecord {
  id: string;
  title: string;
  description: string;
  category?: string;
  price?: number;
  sku?: string;
  [key: string]: unknown;
}

export interface CatalogInput {
  products: ProductRecord[];
  sourceLanguage: 'en' | 'ar' | 'mixed';
  targetLanguage: string; // User-selected target language (e.g., 'ar', 'en', 'fr')
}

export interface CleanedProduct {
  id: string;
  originalTitle: string;
  cleanedTitle: string;
  originalDescription: string;
  cleanedDescription: string;
  seoKeywords: string[];
  changes: string[];
  category?: string;
  price?: number;
  sku?: string;
}

export interface CatalogCleanerResult {
  cleanedProducts: CleanedProduct[];
  processingStats: {
    totalProducts: number;
    translated: number;
    cleaned: number;
    keywordsGenerated: number;
  };
  tokensUsed: number;
  processingTime: number;
}

export interface CleaningProgress {
  current: number;
  total: number;
  currentProduct?: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
}


// Symbols to remove from titles
const SYMBOLS_TO_REMOVE = [
  '®', '™', '©', '℠', '℗', '†', '‡', '§', '¶',
  '★', '☆', '✓', '✔', '✗', '✘', '●', '○', '◆', '◇',
  '【', '】', '「', '」', '『', '』', '〖', '〗',
  '《', '》', '〈', '〉', '⟨', '⟩',
  '♠', '♣', '♥', '♦', '♪', '♫', '♬',
  '→', '←', '↑', '↓', '↔', '⇒', '⇐', '⇑', '⇓',
  '▶', '◀', '▲', '▼', '►', '◄',
  '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰',
  '❤', '❥', '❦', '❧', '☀', '☁', '☂', '☃',
  '⚡', '⚠', '⚙', '⚛', '⚜', '⚝',
];

// AI System Prompt for catalog cleaning
const CATALOG_CLEANER_SYSTEM_PROMPT_BASE = `You are a specialist in optimizing product data for e-commerce stores.

Your tasks:
1. Translate titles and descriptions to the target language in an attractive sales style (not literal translation)
2. Clean titles from strange symbols and bad formatting
3. Create SEO keywords suitable for the target market

Translation rules:
- Use sales language that attracts buyers
- Avoid literal translation, write as a local merchant would write
- Add words like "original", "high quality", "warranty" when appropriate
- Preserve the basic meaning of the product

Cleaning rules:
- Remove strange symbols (®, ™, ©, ★, etc.)
- Unify formatting (spaces, punctuation)
- Remove duplicate text
- Shorten very long titles

SEO rules:
- Create 3-5 keywords for each product
- Include product name, category, and usage

Return the result in JSON format only without any additional text:
{
  "cleanedTitle": "Cleaned title",
  "cleanedDescription": "Cleaned description",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "changes": ["Change 1", "Change 2"]
}`;

/**
 * Get catalog cleaner prompt with response language instruction
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
function getCatalogCleanerPrompt(responseLanguage?: string): string {
  const languageInstruction = getLanguageInstruction(responseLanguage);
  return `${CATALOG_CLEANER_SYSTEM_PROMPT_BASE}\n\n${languageInstruction}`;
}


/**
 * Remove unwanted symbols from text
 */
export function removeSymbols(text: string): string {
  let cleaned = text;
  for (const symbol of SYMBOLS_TO_REMOVE) {
    cleaned = cleaned.split(symbol).join('');
  }
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Check if text contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicPattern.test(text);
}

/**
 * Check if text is primarily English
 */
export function isPrimarilyEnglish(text: string): boolean {
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return englishChars > arabicChars;
}

/**
 * Detect source language of products
 */
export function detectSourceLanguage(products: ProductRecord[]): 'en' | 'ar' | 'mixed' {
  let englishCount = 0;
  let arabicCount = 0;
  
  for (const product of products.slice(0, 10)) { // Sample first 10
    const text = `${product.title} ${product.description}`;
    if (isPrimarilyEnglish(text)) {
      englishCount++;
    } else if (containsArabic(text)) {
      arabicCount++;
    }
  }
  
  if (englishCount > arabicCount * 2) return 'en';
  if (arabicCount > englishCount * 2) return 'ar';
  return 'mixed';
}

/**
 * Estimate tokens for a batch of products
 */
export function estimateBatchTokens(data: Record<string, unknown>[]): number {
  const systemTokens = estimateTokens(CATALOG_CLEANER_SYSTEM_PROMPT_BASE);
  let totalTokens = 0;
  
  for (const row of data.slice(0, 10)) { // Sample first 10 rows
    const record = row as Record<string, unknown>;
    const title = String(record['title'] || record['Title'] || record['name'] || '');
    const description = String(record['description'] || record['Description'] || '');
    const productText = `Title: ${title}\nDescription: ${description}`;
    totalTokens += systemTokens + estimateTokens(productText) + 200; // 200 for response
  }
  
  return totalTokens * (data.length / 10); // Scale up for all products
}


/**
 * Clean a single product using AI
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
async function cleanSingleProduct(
  product: ProductRecord,
  apiKey: string,
  responseLanguage?: string
): Promise<CleanedProduct> {
  const userMessage = `Clean and translate this product:

Title: ${product.title}
Description: ${product.description}
${product.category ? `Category: ${product.category}` : ''}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: getCatalogCleanerPrompt(responseLanguage) },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await chat(apiKey, messages, {
      temperature: 0.7,
      maxTokens: 500
    });

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      id: product.id,
      originalTitle: product.title,
      cleanedTitle: parsed.cleanedTitle || removeSymbols(product.title),
      originalDescription: product.description,
      cleanedDescription: parsed.cleanedDescription || removeSymbols(product.description),
      seoKeywords: parsed.seoKeywords || [],
      changes: parsed.changes || [],
      category: product.category,
      price: product.price,
      sku: product.sku
    };
  } catch (error) {
    // Fallback: basic cleaning without AI
    const changes: string[] = [];
    const cleanedTitle = removeSymbols(product.title);
    const cleanedDescription = removeSymbols(product.description);
    
    if (cleanedTitle !== product.title) {
      changes.push('Removed symbols from title');
    }
    if (cleanedDescription !== product.description) {
      changes.push('Removed symbols from description');
    }

    return {
      id: product.id,
      originalTitle: product.title,
      cleanedTitle,
      originalDescription: product.description,
      cleanedDescription,
      seoKeywords: [],
      changes: changes.length > 0 ? changes : ['AI processing failed'],
      category: product.category,
      price: product.price,
      sku: product.sku
    };
  }
}


/**
 * Clean entire catalog with progress tracking - simplified single file approach
 */
export async function cleanCatalog(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[],
  options: { 
    locale?: string; 
    onProgress?: (progress: CleaningProgress) => void 
  } = {}
): Promise<CatalogCleanerResult> {
  const { locale = 'en', onProgress } = options;
  const startTime = Date.now();
  let tokensUsed = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [Catalog Cleaner] Starting analysis...');
  console.log(`📊 Data: ${data.length} rows`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1: Parse products from data
  const products: ProductRecord[] = data.map((row, index) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record['id'] || record['ID'] || record['sku'] || record['SKU'] || index + 1),
      title: String(record['title'] || record['Title'] || record['name'] || record['Name'] || record['product_name'] || ''),
      description: String(record['description'] || record['Description'] || record['desc'] || ''),
      category: record['category'] || record['Category'] ? String(record['category'] || record['Category']) : undefined,
      price: record['price'] || record['Price'] ? Number(record['price'] || record['Price']) : undefined,
      sku: record['sku'] || record['SKU'] ? String(record['sku'] || record['SKU']) : undefined,
    };
  }).filter(p => p.title.trim() !== '');

  if (products.length === 0) {
    throw new Error('No valid products found in the data');
  }

  const cleanedProducts: CleanedProduct[] = [];
  
  const stats = {
    totalProducts: products.length,
    translated: 0,
    cleaned: 0,
    keywordsGenerated: 0
  };

  // Process products one by one with progress updates
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Update progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: products.length,
        currentProduct: product.title.substring(0, 50),
        status: 'processing'
      });
    }

    try {
      const cleaned = await cleanSingleProduct(product, apiKey, locale);
      cleanedProducts.push(cleaned);

      // Update stats
      if (cleaned.cleanedTitle !== cleaned.originalTitle) {
        stats.cleaned++;
        if (containsArabic(cleaned.cleanedTitle) && isPrimarilyEnglish(cleaned.originalTitle)) {
          stats.translated++;
        }
      }
      if (cleaned.seoKeywords.length > 0) {
        stats.keywordsGenerated++;
      }

      // Estimate tokens used
      tokensUsed += estimateTokens(cleaned.originalTitle + cleaned.originalDescription) + 
                    estimateTokens(cleaned.cleanedTitle + cleaned.cleanedDescription);

      // Small delay to avoid rate limiting
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      // Add product with error
      cleanedProducts.push({
        id: product.id,
        originalTitle: product.title,
        cleanedTitle: removeSymbols(product.title),
        originalDescription: product.description,
        cleanedDescription: removeSymbols(product.description),
        seoKeywords: [],
        changes: ['Error during processing'],
        category: product.category,
        price: product.price,
        sku: product.sku
      });
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      current: products.length,
      total: products.length,
      status: 'complete'
    });
  }

  return {
    cleanedProducts,
    processingStats: stats,
    tokensUsed,
    processingTime: Date.now() - startTime
  };
}


/**
 * Clean products in batches for better performance
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
export async function cleanCatalogBatch(
  input: CatalogInput,
  apiKey: string,
  batchSize: number = 5,
  onProgress?: (progress: CleaningProgress) => void,
  responseLanguage?: string
): Promise<CatalogCleanerResult> {
  const startTime = Date.now();
  const cleanedProducts: CleanedProduct[] = [];
  let tokensUsed = 0;
  
  const stats = {
    totalProducts: input.products.length,
    translated: 0,
    cleaned: 0,
    keywordsGenerated: 0
  };

  // Process in batches
  for (let i = 0; i < input.products.length; i += batchSize) {
    const batch = input.products.slice(i, i + batchSize);
    
    // Update progress
    if (onProgress) {
      onProgress({
        current: i,
        total: input.products.length,
        currentProduct: `Processing ${batch.length} products...`,
        status: 'processing'
      });
    }

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(product => cleanSingleProduct(product, apiKey, responseLanguage))
    );

    for (const cleaned of batchResults) {
      cleanedProducts.push(cleaned);
      
      if (cleaned.cleanedTitle !== cleaned.originalTitle) {
        stats.cleaned++;
        if (containsArabic(cleaned.cleanedTitle) && isPrimarilyEnglish(cleaned.originalTitle)) {
          stats.translated++;
        }
      }
      if (cleaned.seoKeywords.length > 0) {
        stats.keywordsGenerated++;
      }
      
      tokensUsed += estimateTokens(cleaned.originalTitle + cleaned.originalDescription) + 
                    estimateTokens(cleaned.cleanedTitle + cleaned.cleanedDescription);
    }

    // Delay between batches
    if (i + batchSize < input.products.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (onProgress) {
    onProgress({
      current: input.products.length,
      total: input.products.length,
      status: 'complete'
    });
  }

  return {
    cleanedProducts,
    processingStats: stats,
    tokensUsed,
    processingTime: Date.now() - startTime
  };
}

/**
 * Validate cleaned product output
 */
export function validateCleanedProduct(
  product: CleanedProduct,
  targetLanguage: string = 'en'
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check title is cleaned (no forbidden symbols)
  for (const symbol of SYMBOLS_TO_REMOVE) {
    if (product.cleanedTitle.includes(symbol)) {
      errors.push(`Title contains forbidden symbol: ${symbol}`);
    }
  }

  // Check SEO keywords
  if (product.seoKeywords.length < 3) {
    errors.push('Product should have at least 3 SEO keywords');
  }

  // Check translation if source was different language
  if (targetLanguage === 'ar' && isPrimarilyEnglish(product.originalTitle) && !containsArabic(product.cleanedTitle)) {
    errors.push('Title was not translated to Arabic');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Export cleaned catalog to CSV format
 */
export function exportToCsv(products: CleanedProduct[]): string {
  const headers = ['ID', 'Original Title', 'Cleaned Title', 'Original Description', 'Cleaned Description', 'SEO Keywords', 'Changes'];
  const rows = products.map(p => [
    p.id,
    `"${p.originalTitle.replace(/"/g, '""')}"`,
    `"${p.cleanedTitle.replace(/"/g, '""')}"`,
    `"${p.originalDescription.replace(/"/g, '""')}"`,
    `"${p.cleanedDescription.replace(/"/g, '""')}"`,
    `"${p.seoKeywords.join(', ')}"`,
    `"${p.changes.join(', ')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
