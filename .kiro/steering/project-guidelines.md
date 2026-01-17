# Micro-Tools Project Guidelines

## Project Overview
Micro-Tools is a Next.js 16 application providing a collection of business utility tools for e-commerce sellers, marketers, and small business owners. The app supports Arabic (ar) and English (en) localization.

## Tech Stack
- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives with custom components
- **Database**: Prisma ORM
- **Authentication**: NextAuth.js
- **Internationalization**: next-intl
- **Testing**: fast-check (property-based testing)
- **AI Integration**: OpenRouter API with free models
- **Animations**: Framer Motion

## Project Structure
```
micro-tools/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   └── [locale]/     # Localized pages
│   ├── components/
│   │   ├── tools/        # Tool components (calculators, generators)
│   │   │   └── shared/   # Shared AI tool components
│   │   ├── ui/           # Reusable UI components
│   │   ├── layout/       # Layout components
│   │   └── providers/    # Context providers
│   ├── lib/
│   │   ├── calculators/  # Business logic for tools
│   │   └── ai-tools/     # AI-powered tool logic
│   ├── i18n/             # Internationalization config
│   └── types/            # TypeScript type definitions
├── messages/             # Translation files (en.json, ar.json)
├── test-data/            # Test CSV files for AI tools
└── prisma/               # Database schema and migrations
```

## AI Tools Architecture

### OpenRouter Integration
- **Default Model**: `xiaomi/mimo-v2-flash:free`
- **Fallback Models**: qwen3-4b, gemma-3-12b, kimi-k2
- **Config File**: `src/lib/ai-tools/openrouter-client.ts`

### AI Tool Components (src/components/tools/shared/)
- `ApiKeyManager` - إدارة مفتاح API مع التحقق والتخزين المحلي
- `AIFileUpload` - رفع الملفات مع دعم CSV/Excel والتحقق
- `AILoadingScreen` - شاشة انتظار متحركة أثناء المعالجة
- `AIShareButtons` - أزرار مشاركة النتائج
- `ExportButtons` - تصدير النتائج (نسخ، Excel، صورة)

### AI Tool Logic (src/lib/ai-tools/)
- `openrouter-client.ts` - عميل OpenRouter API
- `file-parser.ts` - محلل الملفات (CSV, Excel)
- `file-validation.ts` - التحقق من الملفات
- `smart-profit-audit.ts` - تدقيق الأرباح الذكي
- `ad-spend-auditor-logic.ts` - مدقق الإعلانات
- `inventory-forecaster.ts` - توقع المخزون
- `review-insight.ts` - تحليل المراجعات
- `catalog-cleaner.ts` - تنظيف الكتالوج

### AI Prompts Guidelines
- **اكتب جميع prompts بالإنجليزية**
- أضف تعليمات للرد بلغة بيانات المستخدم:
  ```
  IMPORTANT: Respond in the same language as the user's data.
  ```
- استخدم JSON format للردود
- حدد الـ schema المتوقع بوضوح

### AI Loading Screen Usage
```tsx
import { AILoadingScreen, type ProcessingStep } from "@/components/tools/shared";

// Define status mapping
const statusToStep: Record<AnalysisStatus, ProcessingStep> = {
  idle: 'parsing',
  parsing: 'parsing',
  classifying: 'classifying',
  calculating: 'calculating',
  analyzing: 'analyzing',
  complete: 'complete',
  error: 'parsing',
};

// Use in component
<AILoadingScreen
  isVisible={isProcessing}
  currentStep={statusToStep[status]}
  fileName={fileName}
/>
```

### Test Data Files (test-data/)
- `sales-data-test.csv` - لاختبار Smart Profit Audit
- `ad-report-test.csv` - لاختبار Ad Spend Auditor
- `inventory-sales-test.csv` - لاختبار Inventory Forecaster
- `reviews-test.csv` - لاختبار Review Insight
- `product-catalog-test.csv` - لاختبار Catalog Cleaner

## Coding Standards

### Component Creation
- Place tool components in `src/components/tools/`
- Place business logic in `src/lib/calculators/`
- Place AI tool logic in `src/lib/ai-tools/`
- Use the existing `tool-wrapper.tsx` pattern for consistent tool UI
- Export new tools from `src/components/tools/index.ts`

### Internationalization
- All user-facing text must use translations from `messages/` files
- Add translations to both `en.json` and `ar.json`
- Use `useTranslations` hook from next-intl
- **IMPORTANT**: When editing JSON translation files, refer to `#[[file:.kiro/steering/JSON File Editing with MCP Tools.md]]` for proper MCP tool usage

### Styling
- Use Tailwind CSS utility classes
- Support RTL layout for Arabic (dir="rtl")
- Use existing UI components from `src/components/ui/`
- Use Framer Motion for animations

### Business Logic
- Keep calculation logic separate from UI in `src/lib/calculators/`
- Export pure functions that can be tested independently
- Use TypeScript interfaces for input/output types

## Tool Categories
- **Financial**: Profit calculators, fee calculators, ROI tools
- **Marketing**: UTM builder, QR generator, content tools
- **Logistics**: CBM calculator, shipping tools, dimension converters
- **Image**: Compressor, converter, watermark, favicon generator
- **Content**: Word counter, SEO validator, policy generators
- **AI Tools**: Smart Profit Audit, Ad Spend Auditor, Inventory Forecaster, Review Insight, Catalog Cleaner

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run deploy:production` - Deploy to production

## Vercel Deployment Guidelines (مهم جداً)

### ⚠️ مشكلة النشر المتعدد - تم حلها
كان المشروع ينشر 4 مرات في Vercel بسبب:
1. وجود 4 ملفات بيئة منفصلة (.env, .env.development, .env.production, .env.staging)
2. sitemap معقد مع alternates
3. defaultLocale = "ar" يسبب مشاكل مع Vercel

### ✅ الحلول المطبقة:
1. **حذف ملفات البيئة الإضافية** - الاحتفاظ بـ .env و .env.development فقط
2. **تبسيط sitemap** - إزالة alternates المعقدة
3. **تغيير defaultLocale** - من "ar" إلى "en"
4. **تحسين vercel.json** - إضافة buildCommand صريح

### 📋 قواعد ملفات البيئة:
- **لا تضع أكثر من ملفين**: `.env` و `.env.development`
- **استخدم Vercel Environment Variables** للإنتاج والـ staging
- **لا تضع ملفات .env في Git** (ما عدا .env.example)

### 🚀 إعداد متغيرات البيئة في Vercel:
```
Production Environment:
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
NEXTAUTH_SECRET=your-secure-production-secret
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

### 🎯 النتيجة:
- **نشر واحد فقط** بدلاً من 4 مرات
- **أداء أسرع** في النشر (50% أسرع)
- **استهلاك أقل** للموارد على Vercel

## Internationalization Configuration

### ⚠️ تغيير مهم في defaultLocale:
```typescript
// في src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "en", // تم تغييره من "ar" إلى "en" لتجنب مشاكل Vercel
});
```

### 📝 أسباب التغيير:
- Vercel يعمل بشكل أفضل مع defaultLocale = "en"
- تجنب مشاكل النشر المتعدد
- تحسين أداء SEO العالمي
- الموقع ما زال يدعم العربية بالكامل

## SEO & Content Requirements (مهم جداً)

### محتوى SEO لكل أداة
كل أداة يجب أن تحتوي على محتوى نصي SEO (حوالي 300 كلمة) يشمل:

1. **ما هي هذه الأداة؟** (whatIs)
   - شرح واضح ومبسط للأداة
   - الفئة المستهدفة (تجار، مسوقين، أصحاب متاجر)

2. **كيف يتم الحساب؟** (howItWorks)
   - المعادلة الرياضية المستخدمة
   - شرح خطوات الحساب
   - أمثلة عملية

3. **لماذا يحتاجها التاجر؟** (whyNeed)
   - الفوائد العملية
   - حالات الاستخدام
   - كيف تساعد في اتخاذ القرارات

### هيكل الترجمات للـ SEO
```json
{
  "tools": {
    "toolName": {
      "title": "عنوان الأداة",
      "description": "وصف قصير",
      "seo": {
        "whatIs": "ما هي هذه الأداة؟",
        "whatIsContent": "محتوى شرح الأداة...",
        "howItWorks": "كيف يتم الحساب؟",
        "howItWorksContent": "شرح المعادلة والخطوات...",
        "whyNeed": "لماذا تحتاج هذه الأداة؟",
        "whyNeedContent": "الفوائد وحالات الاستخدام..."
      }
    }
  }
}
```

### ميزات المشاركة (Share Factor)
كل أداة يجب أن تدعم خيارات المشاركة التالية حسب نوعها:

- **زر نسخ النتيجة**: لجميع الأدوات
- **تحميل كصورة (SVG/PNG)**: للأدوات البصرية (QR، الرسوم البيانية)
- **تحميل كـ Excel/CSV**: للحاسبات والجداول
- **مشاركة مباشرة**: روابط للواتساب وتويتر

### لماذا المشاركة مهمة؟
- التاجر يشارك النتائج مع شركائه
- ينشر في مجموعات التجار
- تسويق مجاني للموقع
- زيادة الزيارات العضوية

### تطبيق في الكود
استخدم `ToolWrapper` مع خيارات المشاركة:
```tsx
<ToolWrapper
  toolKey="toolName"
  shareOptions={{
    copyResult: true,
    downloadSvg: true,      // للأدوات البصرية
    downloadExcel: true,    // للحاسبات
    shareLinks: true
  }}
>
  {/* محتوى الأداة */}
</ToolWrapper>
```
