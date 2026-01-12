# حل مشكلة النشر المتعدد في Vercel

## المشكلة
كان Vercel ينشر المشروع 4 مرات بسبب:
1. وجود 4 ملفات بيئة منفصلة (.env, .env.development, .env.production, .env.staging)
2. sitemap معقد مع alternates
3. defaultLocale = "ar" يسبب مشاكل مع Vercel

## الحلول المطبقة

### ✅ 1. حذف ملفات البيئة الإضافية
- حذف `.env.production`
- حذف `.env.staging`
- الاحتفاظ بـ `.env` و `.env.development` فقط

### ✅ 2. تحديث .gitignore
```
.env*
!.env.example
```

### ✅ 3. تغيير defaultLocale
```typescript
// من
defaultLocale: "ar"
// إلى
defaultLocale: "en"
```

### ✅ 4. تبسيط sitemap
- إزالة alternates المعقدة
- تبسيط هيكل الصفحات

### ✅ 5. تحديث vercel.json
- إضافة buildCommand و installCommand صريح
- إزالة ignoreCommand المعقد

## إعداد متغيرات البيئة في Vercel

بدلاً من ملفات .env متعددة، استخدم Vercel Environment Variables:

### في Vercel Dashboard:
1. اذهب إلى Project Settings → Environment Variables
2. أضف المتغيرات التالية:

**Production:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
NEXTAUTH_SECRET=your-secure-production-secret
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

**Preview (Staging):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key
NEXTAUTH_SECRET=your-secure-staging-secret
NEXTAUTH_URL=https://your-staging-domain.com
NEXT_PUBLIC_APP_ENV=staging
NODE_ENV=production
```

## النتيجة المتوقعة
- ✅ نشر واحد فقط بدلاً من 4 مرات
- ✅ أداء أسرع في النشر
- ✅ استهلاك أقل للموارد
- ✅ إدارة أبسط للمشروع

## التحقق من النجاح
1. ادفع التغييرات إلى GitHub
2. راقب Vercel Dashboard
3. يجب أن ترى build واحد فقط
4. تأكد من عمل الموقع بشكل طبيعي

## ملاحظات مهمة
- لا تضع ملفات .env في Git (ما عدا .env.example)
- استخدم Vercel Environment Variables للإنتاج
- احتفظ بـ .env.development للتطوير المحلي فقط