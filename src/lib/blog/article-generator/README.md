# Article Generator Feature

مولد المقالات - نظام ذكي لإنشاء مقالات تجارة إلكترونية عالية الجودة باستخدام الذكاء الاصطناعي.

## البنية

```
article-generator/
├── README.md                    # هذا الملف
├── core/                        # المنطق الأساسي
│   ├── generator.ts            # منطق إنشاء المقالات
│   ├── deduplication.ts        # نظام منع التكرار
│   ├── topic-selection.ts      # اختيار المواضيع
│   └── content-cleaner.ts      # تنظيف المحتوى
├── api/                         # نقاط النهاية API
│   └── generate-route.ts       # POST /api/blog/generate
├── types/                       # أنواع TypeScript
│   └── index.ts                # جميع الأنواع المشتركة
├── utils/                       # وظائف مساعدة
│   ├── scoring.ts              # حساب النقاط
│   ├── similarity.ts           # حساب التشابه
│   └── validation.ts           # التحقق من الصحة
├── constants/                   # الثوابت
│   └── index.ts                # جميع الثوابت
└── tests/                       # الاختبارات
    ├── generator.test.ts
    ├── deduplication.test.ts
    └── topic-selection.test.ts
```

## الميزات

- ✅ إنشاء مقالات 1500-2500 كلمة
- ✅ منع التكرار باستخدام Jaccard و N-gram
- ✅ اختيار ذكي للمواضيع بناءً على الصلة والحداثة
- ✅ تصنيف تلقائي للفئات
- ✅ إعادة محاولة تلقائية عند الفشل
- ✅ تحسين SEO
- ✅ تنظيف المحتوى من علامات الذكاء الاصطناعي

## الاستخدام

```typescript
import { generateFullArticle } from '@/features/article-generator';

const result = await generateFullArticle(
  adminId,
  apiKey,
  exaResults,
  { category: 'marketing', maxRetries: 2 }
);
```

## المتطلبات

راجع `.kiro/specs/article-generator/requirements.md` للحصول على المتطلبات الكاملة.

## التصميم

راجع `.kiro/specs/article-generator/design.md` للحصول على وثيقة التصميم الكاملة.
