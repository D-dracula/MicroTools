# Google Indexing API Setup Guide

هذا الدليل يشرح كيفية إعداد Google Indexing API لتسريع فهرسة صفحات موقعك.

## المتطلبات

- حساب Google Cloud (مجاني)
- موقع مُثبت في Google Search Console
- صلاحيات Owner في Search Console

## خطوات الإعداد

### 1. إنشاء مشروع Google Cloud

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. اضغط على **Select a project** → **New Project**
3. أدخل اسم المشروع (مثل: `micro-tools-indexing`)
4. اضغط **Create**

### 2. تفعيل Indexing API

1. في Google Cloud Console، اذهب إلى **APIs & Services** → **Library**
2. ابحث عن **Indexing API**
3. اضغط على **Web Search Indexing API**
4. اضغط **Enable**

### 3. إنشاء Service Account

1. اذهب إلى **APIs & Services** → **Credentials**
2. اضغط **Create Credentials** → **Service Account**
3. أدخل:
   - Service account name: `indexing-bot`
   - Service account ID: `indexing-bot`
4. اضغط **Create and Continue**
5. تخطى الخطوات الاختيارية واضغط **Done**

### 4. إنشاء مفتاح JSON

1. في صفحة Credentials، اضغط على Service Account الذي أنشأته
2. اذهب إلى تبويب **Keys**
3. اضغط **Add Key** → **Create new key**
4. اختر **JSON**
5. اضغط **Create**
6. سيتم تحميل ملف JSON - احفظه بأمان!

### 5. إضافة Service Account إلى Search Console

1. افتح ملف JSON الذي حملته
2. انسخ قيمة `client_email` (مثل: `indexing-bot@project-id.iam.gserviceaccount.com`)
3. اذهب إلى [Google Search Console](https://search.google.com/search-console)
4. اختر موقعك
5. اذهب إلى **Settings** → **Users and permissions**
6. اضغط **Add user**
7. الصق البريد الإلكتروني للـ Service Account
8. اختر **Owner** كصلاحية
9. اضغط **Add**

### 6. إعداد متغير البيئة

#### للتطوير المحلي (.env.local):

```bash
# انسخ محتوى ملف JSON كسطر واحد
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

#### لـ Vercel:

1. اذهب إلى Vercel Dashboard → Project Settings → Environment Variables
2. أضف متغير جديد:
   - Name: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: محتوى ملف JSON كاملاً
   - Environment: Production (و Preview إذا أردت)

## الاستخدام

### من سطر الأوامر

```bash
# عرض جميع الروابط القابلة للفهرسة
npm run index:list

# فهرسة جميع الروابط (حد 200 يومياً)
npm run index:all

# فهرسة صفحات الأدوات فقط
npm run index:tools

# فهرسة رابط محدد
npm run index:url https://pinecalc.com/en/tools/profit-margin-calculator
```

### من API (للأدمن)

```bash
# الحصول على حالة الفهرسة
curl -X GET https://your-site.com/api/admin/indexing \
  -H "x-admin-key: YOUR_ADMIN_KEY"

# فهرسة رابط واحد
curl -X POST https://your-site.com/api/admin/indexing \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "single", "url": "https://your-site.com/page"}'

# فهرسة عدة روابط
curl -X POST https://your-site.com/api/admin/indexing \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "batch", "urls": ["url1", "url2"]}'

# فهرسة جميع صفحات الأدوات
curl -X POST https://your-site.com/api/admin/indexing \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "tools"}'
```

## الحدود

| الحد | القيمة |
|------|--------|
| الطلبات اليومية | 200 |
| حجم الدفعة الواحدة | 100 URL |
| معدل الطلبات | ~1 طلب/ثانية |

## استراتيجية الفهرسة المقترحة

### للموقع الجديد:
1. **اليوم 1**: فهرسة الصفحات الرئيسية (الرئيسية، الأدوات، المدونة)
2. **اليوم 2-3**: فهرسة صفحات الأدوات (أهم 100 أداة)
3. **اليوم 4+**: فهرسة مقالات المدونة

### للتحديثات:
- عند إضافة أداة جديدة: `npm run index:url https://site.com/en/tools/new-tool`
- عند نشر مقال: فهرسة رابط المقال مباشرة

## استكشاف الأخطاء

### خطأ: "Permission denied"
- تأكد من إضافة Service Account كـ Owner في Search Console
- انتظر 24 ساعة بعد الإضافة

### خطأ: "Invalid credentials"
- تأكد من صحة محتوى JSON في متغير البيئة
- تأكد من عدم وجود أسطر جديدة في JSON

### خطأ: "Quota exceeded"
- وصلت للحد اليومي (200 طلب)
- انتظر حتى اليوم التالي

## ملاحظات مهمة

1. **الـ API لا يضمن الفهرسة** - هو فقط يُعلم Google بوجود الصفحة
2. **Google قد يتجاهل الطلب** إذا رأى أن الصفحة غير مهمة
3. **استخدم بحكمة** - لا تُرسل نفس الروابط يومياً
4. **راقب Search Console** لمتابعة حالة الفهرسة الفعلية
