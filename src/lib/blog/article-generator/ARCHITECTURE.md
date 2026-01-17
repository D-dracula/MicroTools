# Article Generator Architecture

## نظرة عامة معمارية

مولد المقالات مصمم بنهج معماري نظيف ومعياري يفصل المسؤوليات ويسهل الصيانة والاختبار.

## الطبقات المعمارية

```
┌─────────────────────────────────────────────────────────┐
│                     API Layer                            │
│  (POST /api/blog/generate)                              │
│  - Request validation                                    │
│  - Authentication check                                  │
│  - Response formatting                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Core Layer                             │
│  - Topic Selection (topic-selection.ts)                 │
│  - Deduplication (deduplication.ts)                     │
│  - Content Generation (generator.ts)                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Utils Layer                             │
│  - Scoring (scoring.ts)                                 │
│  - Similarity (similarity.ts)                           │
│  - Validation (validation.ts)                           │
│  - Content Cleaner (content-cleaner.ts)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                              │
│  - Supabase Client                                      │
│  - Database Operations                                   │
│  - External APIs (OpenRouter, Exa)                      │
└─────────────────────────────────────────────────────────┘
```

## تدفق البيانات

### 1. إنشاء مقالة جديدة

```
User Request
    │
    ▼
API Route (/api/blog/generate)
    │
    ├─► Check Admin Access
    │
    ├─► Validate Request
    │
    ▼
Topic Selection
    │
    ├─► Process Exa Results
    │
    ├─► Fetch Existing Articles
    │
    ├─► Filter Duplicates
    │
    ├─► Score Topics
    │
    └─► Select Best Topic
    │
    ▼
Content Generation
    │
    ├─► Build AI Prompt
    │
    ├─► Call OpenRouter API
    │
    ├─► Parse Response
    │
    ├─► Clean Content
    │
    └─► Validate Output
    │
    ▼
Save to Database
    │
    ├─► Create Article Record
    │
    ├─► Generate Slug
    │
    ├─► Calculate Reading Time
    │
    └─► Assign Thumbnail
    │
    ▼
Return Response
```

### 2. منع التكرار

```
New Topic
    │
    ▼
Fetch Existing Articles (last 500)
    │
    ▼
For Each Existing Article:
    │
    ├─► Check URL Match (100% duplicate)
    │
    ├─► Extract Keywords
    │
    ├─► Calculate Jaccard Similarity
    │
    ├─► Calculate N-gram Similarity
    │
    └─► Combine Scores (50/50)
    │
    ▼
Compare with Threshold (0.35)
    │
    ├─► If >= 0.35: Mark as Duplicate
    │
    └─► If < 0.35: Mark as Unique
```

## المكونات الرئيسية

### 1. Topic Selection (`core/topic-selection.ts`)

**المسؤولية:** اختيار أفضل موضوع من نتائج البحث

**الوظائف:**
- `processExaResults()`: تصفية النتائج غير الصالحة
- `selectBestTopic()`: اختيار الموضوع الأفضل بناءً على النقاط

**الخوارزمية:**
```
Combined Score = (Relevance × 0.6) + (Recency × 0.4)

Recency Score:
- 0 days: 1.0
- 1-7 days: 0.9
- 8-30 days: 0.7
- 31-60 days: 0.5
- 61-90 days: 0.3
- 90+ days: 0.1
```

### 2. Deduplication (`core/deduplication.ts`)

**المسؤولية:** منع إنشاء مقالات مكررة

**الوظائف:**
- `getExistingArticlesForDedup()`: جلب المقالات الموجودة
- `checkTopicDuplication()`: فحص موضوع واحد
- `filterDuplicateTopics()`: تصفية قائمة مواضيع

**الخوارزمية:**
```
Similarity = (Jaccard × 0.5) + (N-gram × 0.5)

Jaccard Similarity:
- Intersection / Union of keywords

N-gram Similarity:
- Bigrams (2-word sequences)
- Intersection / Union of bigrams

Threshold: 0.35
```

### 3. Scoring (`utils/scoring.ts`)

**المسؤولية:** حساب النقاط للمواضيع

**الوظائف:**
- `calculateRecencyScore()`: حساب درجة الحداثة
- `calculateCombinedScore()`: دمج الدرجات
- `scoreTopicResult()`: تسجيل موضوع كامل

### 4. Similarity (`utils/similarity.ts`)

**المسؤولية:** حساب التشابه بين النصوص

**الوظائف:**
- `extractKeywords()`: استخراج الكلمات المفتاحية
- `calculateJaccardSimilarity()`: حساب تشابه Jaccard
- `calculateNgramSimilarity()`: حساب تشابه N-gram
- `calculateTopicSimilarity()`: حساب التشابه المركب

### 5. Content Cleaner (`utils/content-cleaner.ts`)

**المسؤولية:** تنظيف المحتوى من علامات الذكاء الاصطناعي

**الوظائف:**
- `cleanArticleContent()`: تنظيف المحتوى الرئيسي
- `cleanTitle()`: تنظيف العنوان
- `cleanSummary()`: تنظيف الملخص
- `cleanTags()`: تنظيف الوسوم

## أنماط التصميم المستخدمة

### 1. Separation of Concerns
كل ملف له مسؤولية واحدة واضحة

### 2. Pure Functions
معظم الوظائف نقية (pure) بدون آثار جانبية

### 3. Dependency Injection
الاعتماديات تُمرر كمعاملات بدلاً من الاستيراد المباشر

### 4. Single Responsibility Principle
كل وظيفة تقوم بمهمة واحدة فقط

### 5. Open/Closed Principle
سهل التوسع بدون تعديل الكود الموجود

## الأداء والتحسين

### 1. Caching
- تخزين المقالات الموجودة مؤقتاً لتقليل استعلامات قاعدة البيانات

### 2. Batch Processing
- معالجة المواضيع دفعة واحدة بدلاً من واحداً تلو الآخر

### 3. Early Exit
- التوقف عند العثور على تطابق 100% (URL match)

### 4. Lazy Loading
- تحميل البيانات فقط عند الحاجة

## الأمان

### 1. Authentication
- التحقق من صلاحيات المسؤول قبل السماح بالوصول

### 2. Input Validation
- التحقق من صحة جميع المدخلات

### 3. Rate Limiting
- حد أقصى لعدد المقالات المولدة يومياً

### 4. API Key Protection
- عدم تخزين مفاتيح API في قاعدة البيانات

## قابلية الاختبار

### 1. Unit Tests
- اختبارات لكل وظيفة على حدة

### 2. Integration Tests
- اختبارات للتكامل بين المكونات

### 3. Mocking
- محاكاة الاعتماديات الخارجية

### 4. Test Coverage
- تغطية اختبارية عالية (>80%)

## التوسع المستقبلي

### 1. Multi-Language Support
- دعم لغات متعددة للمقالات

### 2. Custom Prompts
- السماح بتخصيص prompts الذكاء الاصطناعي

### 3. A/B Testing
- اختبار نسخ مختلفة من المقالات

### 4. Analytics Integration
- تتبع أداء المقالات المولدة

### 5. Scheduled Generation
- جدولة إنشاء المقالات تلقائياً
