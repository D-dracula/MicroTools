/**
 * Article Generator Constants
 * 
 * جميع الثوابت المستخدمة في نظام مولد المقالات
 */

import type { ArticleCategory } from '../types';

// ============================================================================
// Word Count
// ============================================================================

/** الحد الأدنى لعدد الكلمات في المقالة */
export const MIN_WORD_COUNT = 1500;

/** الحد الأقصى لعدد الكلمات في المقالة */
export const MAX_WORD_COUNT = 2500;

// ============================================================================
// Search Queries
// ============================================================================

/** استعلامات البحث عن مواضيع التجارة الإلكترونية */
export const TOPIC_SEARCH_QUERIES = [
    'e-commerce seller tips strategies 2025',
    'online marketplace trends digital marketing',
    'dropshipping business growth tactics',
    'Amazon FBA seller optimization',
    'e-commerce logistics shipping solutions',
    'social media marketing for online stores',
    'product pricing strategies e-commerce',
    'customer retention e-commerce business',
];

// ============================================================================
// Category Keywords
// ============================================================================

/** الكلمات المفتاحية لتصنيف الفئات */
export const CATEGORY_KEYWORDS: Record<ArticleCategory, string[]> = {
    'marketing': [
        'marketing', 'advertising', 'social media', 'SEO', 'content',
        'brand', 'promotion', 'campaign', 'audience', 'engagement'
    ],
    'seller-tools': [
        'tools', 'software', 'automation', 'analytics', 'dashboard',
        'platform', 'integration', 'app', 'plugin', 'extension'
    ],
    'logistics': [
        'shipping', 'logistics', 'fulfillment', 'warehouse', 'delivery',
        'supply chain', 'inventory', 'FBA', 'dropshipping', 'freight'
    ],
    'trends': [
        'trends', 'future', 'prediction', 'growth', 'market',
        'industry', 'innovation', 'emerging', '2025', '2026'
    ],
    'case-studies': [
        'case study', 'success story', 'example', 'how', 'achieved',
        'results', 'strategy', 'implementation', 'real-world'
    ],
};

// ============================================================================
// Deduplication
// ============================================================================

/** عتبة التشابه لاعتبار موضوع مكرر (0-1) */
export const SIMILARITY_THRESHOLD = 0.35;

/** عدد المقالات الأخيرة للتحقق من التكرار */
export const DUPLICATE_CHECK_LIMIT = 500;

// ============================================================================
// Stop Words
// ============================================================================

/** الكلمات الشائعة التي يتم تجاهلها في حساب التشابه */
export const STOP_WORDS = new Set([
    // Common English words
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
    // Generic filler words
    'guide', 'tips', 'best', 'top', 'new', 'ultimate', 'complete',
]);

// ============================================================================
// Retry Configuration
// ============================================================================

/** الحد الأقصى لعدد محاولات إعادة المحاولة */
export const MAX_RETRY_ATTEMPTS = 2;

/** التأخير الأساسي بين المحاولات (بالميلي ثانية) */
export const BASE_RETRY_DELAY = 2000;

// ============================================================================
// Scoring Weights
// ============================================================================

/** وزن درجة الصلة في الدرجة المركبة */
export const RELEVANCE_WEIGHT = 0.6;

/** وزن درجة الحداثة في الدرجة المركبة */
export const RECENCY_WEIGHT = 0.4;

/** وزن تشابه الكلمات المفتاحية في حساب التشابه */
export const KEYWORD_SIMILARITY_WEIGHT = 0.5;

/** وزن تشابه N-gram في حساب التشابه */
export const NGRAM_SIMILARITY_WEIGHT = 0.5;
