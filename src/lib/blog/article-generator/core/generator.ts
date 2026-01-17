/**
 * Article Content Generator
 * 
 * المنطق الأساسي لإنشاء محتوى المقالات باستخدام الذكاء الاصطناعي
 * 
 * @version 2.0
 */

import { chat } from '@/lib/ai-tools/openrouter-client';
import { createArticle } from '@/lib/blog/article-service';
import { getThumbnailForCategory } from '@/lib/blog/thumbnail-service';
import { extractDomain } from '@/lib/blog/domain-extractor';
import { MIN_WORD_COUNT } from '../constants/config';
import { ARTICLE_GENERATION_SYSTEM_PROMPT, buildUserPrompt } from '../constants/prompts';
import { cleanArticleContent } from '../utils/content-cleaner';
import { getExistingArticlesForDedup } from './deduplication';
import { processExaResults, selectBestTopic } from './topic-selection';
import type {
    ArticleCategory,
    ArticleSource,
    ExaSearchResult,
    GenerationStatus,
} from '@/lib/blog/types';
import { isArticleCategory } from '@/lib/blog/types';
import type {
    ScoredTopic,
    GenerationResult,
    ProgressCallback,
    GenerationError,
} from '../types';

// ============================================================================
// Article Generation
// ============================================================================

/**
 * Generate article content using OpenRouter
 */
export async function generateArticle(
    apiKey: string,
    topic: ScoredTopic,
    category?: ArticleCategory,
    existingTitles?: string[],
    retryAttempt: number = 0
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
    if (retryAttempt > 0) {
        console.log(`🔄 Retry attempt ${retryAttempt} for article generation`);
    }

    const targetCategory = category && isArticleCategory(category)
        ? category
        : topic.suggestedCategory;

    // Build uniqueness instruction
    const uniquenessInstruction = existingTitles && existingTitles.length > 0
        ? `\n\nIMPORTANT - UNIQUENESS REQUIREMENT:
Your article must be UNIQUE and DIFFERENT from these existing articles:
${existingTitles.slice(0, 10).map(t => `- "${t}"`).join('\n')}

Create a fresh perspective, different angle, or new approach to the topic.`
        : '';

    const systemPrompt = ARTICLE_GENERATION_SYSTEM_PROMPT + uniquenessInstruction;
    const userPrompt = buildUserPrompt(topic);

    const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt },
    ];

    let response;
    try {
        response = await chat(apiKey, messages, {
            temperature: 0.7,
            maxTokens: 6000,
        });

        if (!response || !response.content) {
            throw new Error('AI returned empty response');
        }
    } catch (chatError) {
        console.error('OpenRouter API error:', chatError);
        throw new Error(`Failed to generate article content: ${chatError instanceof Error ? chatError.message : 'Unknown error'}`);
    }

    // Parse JSON response
    let articleData;
    try {
        const content = response.content.trim();
        console.log('AI Response length:', content.length);

        let jsonString = content;

        // Extract JSON from code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1].trim();
        } else {
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                jsonString = content.substring(firstBrace, lastBrace + 1);
            }
        }

        // Clean JSON
        jsonString = jsonString
            .replace(/[\u0000-\u001F]+/g, ' ')
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');

        articleData = JSON.parse(jsonString);

        if (!articleData || typeof articleData !== 'object') {
            throw new Error('Parsed data is not an object');
        }
    } catch (parseError) {
        console.error('Failed to parse article response:', parseError);

        // Fallback extraction
        const content = response.content.trim();
        let extractedTitle = topic.title;
        let extractedContent = '';

        const titlePatterns = [/"title"\s*:\s*"([^"]+)"/, /^#\s+(.+)$/m];
        for (const pattern of titlePatterns) {
            const match = content.match(pattern);
            if (match && match[1]?.length > 10) {
                extractedTitle = match[1].trim();
                break;
            }
        }

        const contentPatterns = [/"content"\s*:\s*"([\s\S]+?)"\s*,?\s*"tags"/];
        for (const pattern of contentPatterns) {
            const match = content.match(pattern);
            if (match && match[1]?.length > 500) {
                extractedContent = match[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .trim();
                break;
            }
        }

        if (!extractedContent || extractedContent.length < 500) {
            throw new Error('Failed to parse generated article content');
        }

        articleData = {
            title: extractedTitle.substring(0, 100),
            summary: topic.text.substring(0, 200),
            content: extractedContent,
            tags: [],
            metaTitle: extractedTitle.substring(0, 60),
            metaDescription: topic.text.substring(0, 155),
        };
    }

    if (!articleData.title || !articleData.content) {
        throw new Error('Generated article missing required fields');
    }

    // Validate word count
    const wordCount = articleData.content.split(/\s+/).filter((w: string) => w.length > 0).length;
    console.log(`📝 Generated article word count: ${wordCount}`);

    if (wordCount < MIN_WORD_COUNT * 0.8) {
        console.warn(`⚠️ Article too short: ${wordCount} words (minimum: ${MIN_WORD_COUNT})`);
    }

    const sources: ArticleSource[] = [{
        url: topic.url,
        title: topic.title,
        domain: extractDomain(topic.url),
    }];

    return {
        title: cleanArticleContent(articleData.title),
        summary: cleanArticleContent(articleData.summary || articleData.title),
        content: cleanArticleContent(articleData.content),
        category: targetCategory,
        tags: Array.isArray(articleData.tags) ? articleData.tags.map((t: string) => t.toLowerCase()).slice(0, 5) : [],
        sources,
        metaTitle: cleanArticleContent(articleData.metaTitle || articleData.title).substring(0, 70),
        metaDescription: cleanArticleContent(articleData.metaDescription || articleData.summary || '').substring(0, 160),
    };
}

// ============================================================================
// Full Generation Flow
// ============================================================================

/**
 * Full article generation flow
 */
export async function generateFullArticle(
    adminId: string,
    apiKey: string,
    exaResults: ExaSearchResult[],
    options: {
        category?: ArticleCategory;
        topic?: string;
        maxRetries?: number;
    } = {},
    onProgress?: ProgressCallback
): Promise<GenerationResult> {
    const maxRetries = options.maxRetries ?? 2;

    const updateProgress = (status: GenerationStatus, message: string, progress: number, error?: string) => {
        if (onProgress) {
            onProgress({ status, message, progress, error });
        }
    };

    try {
        // Step 1: Fetch existing articles
        updateProgress('searching', 'Fetching existing articles...', 5);
        const existingArticles = await getExistingArticlesForDedup();
        console.log(`📚 Loaded ${existingArticles.length} existing articles for deduplication`);

        // Step 2: Process search results
        updateProgress('searching', 'Processing search results...', 10);
        const processedResults = processExaResults(exaResults);

        if (processedResults.length === 0) {
            return {
                success: false,
                error: {
                    code: 'NO_TOPICS_FOUND',
                    message: 'No valid topics found in search results',
                },
            };
        }

        // Step 3: Select best topic
        updateProgress('selecting', 'Selecting best unique topic...', 30);
        const selectedTopic = selectBestTopic(processedResults, existingArticles);

        if (!selectedTopic) {
            return {
                success: false,
                error: {
                    code: 'NO_TOPICS_FOUND',
                    message: 'All topics were duplicates of existing articles',
                    suggestions: ['Try a different search query', 'Search for more specific topics'],
                },
            };
        }

        console.log(`✅ Selected topic: "${selectedTopic.title}"`);

        // Step 4: Generate article with retry
        updateProgress('generating', 'Generating article content...', 50);
        let articleData;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    updateProgress('generating', `Retrying (attempt ${attempt + 1}/${maxRetries + 1})...`, 50 + (attempt * 10));
                }

                articleData = await generateArticle(
                    apiKey,
                    selectedTopic,
                    options.category,
                    existingArticles.map(a => a.title),
                    attempt
                );

                console.log(`✅ Article generated successfully`);
                break;
            } catch (genError) {
                lastError = genError instanceof Error ? genError : new Error('Unknown error');
                console.error(`❌ Attempt ${attempt + 1} failed:`, lastError.message);

                if (attempt === maxRetries) {
                    const error: GenerationError = {
                        code: 'CONTENT_GENERATION_FAILED',
                        message: `Failed after ${maxRetries + 1} attempts: ${lastError.message}`,
                        suggestions: ['Check your OpenRouter API key', 'Try again later'],
                    };
                    return { success: false, error };
                }

                const waitTime = Math.min(2000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        if (!articleData) {
            return {
                success: false,
                error: {
                    code: 'CONTENT_GENERATION_FAILED',
                    message: lastError?.message || 'Failed to generate article',
                },
            };
        }

        // Step 5: Assign thumbnail
        updateProgress('creating-thumbnail', 'Assigning thumbnail...', 80);
        const thumbnailUrl = getThumbnailForCategory(articleData.category);

        // Step 6: Save to database
        updateProgress('saving', 'Saving to database...', 90);
        let savedArticle;
        try {
            savedArticle = await createArticle({
                ...articleData,
                thumbnailUrl,
                isPublished: true,
            });
        } catch (saveError) {
            return {
                success: false,
                error: {
                    code: 'SAVE_FAILED',
                    message: saveError instanceof Error ? saveError.message : 'Unknown error',
                },
            };
        }

        updateProgress('complete', 'Article generated successfully!', 100);

        return {
            success: true,
            article: savedArticle,
        };
    } catch (error) {
        console.error('Article generation error:', error);
        return {
            success: false,
            error: {
                code: 'CONTENT_GENERATION_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            },
        };
    }
}

/**
 * Retry article generation for a specific topic
 */
export async function retryArticleGeneration(
    apiKey: string,
    topic: ScoredTopic,
    options: {
        category?: ArticleCategory;
        existingTitles?: string[];
        maxRetries?: number;
    } = {}
): Promise<{
    success: boolean;
    articleData?: {
        title: string;
        summary: string;
        content: string;
        category: ArticleCategory;
        tags: string[];
        sources: ArticleSource[];
        metaTitle: string;
        metaDescription: string;
    };
    error?: string;
}> {
    const maxRetries = options.maxRetries ?? 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const articleData = await generateArticle(
                apiKey,
                topic,
                options.category,
                options.existingTitles,
                attempt
            );

            return { success: true, articleData };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (attempt < maxRetries) {
                const waitTime = Math.min(2000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    return {
        success: false,
        error: lastError?.message || 'Failed to regenerate article',
    };
}
