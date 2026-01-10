# Test Data Files - ملفات البيانات التجريبية

This directory contains example CSV files for testing AI tools in Micro-Tools. Each file demonstrates the correct format and required columns for optimal results.

## AI Tools Example Files - ملفات أمثلة أدوات الذكاء الاصطناعي

### 1. Smart Profit Audit - تدقيق الأرباح الذكي
**File:** `smart-profit-audit-example.csv`

**Required Columns:**
- `OrderID` - معرف الطلب
- `ProductName` - اسم المنتج  
- `Quantity` - الكمية
- `UnitPrice` - سعر الوحدة
- `ShippingCost` - تكلفة الشحن
- `PaymentFee` - رسوم الدفع
- `Tax` - الضريبة
- `RefundAmount` - مبلغ الاسترداد
- `OrderDate` - تاريخ الطلب
- `CustomerID` - معرف العميل

**Use Case:** Analyze order profitability, identify cost patterns, and optimize pricing strategies.

---

### 2. Ad Spend Auditor - مدقق الإعلانات
**File:** `ad-spend-auditor-example.csv`

**Required Columns:**
- `CampaignID` - معرف الحملة
- `CampaignName` - اسم الحملة
- `Platform` - المنصة (Facebook, Google, Instagram, TikTok)
- `AdSpend` - إنفاق الإعلانات
- `Impressions` - مرات الظهور
- `Clicks` - النقرات
- `Conversions` - التحويلات
- `Revenue` - الإيرادات
- `StartDate` - تاريخ البداية
- `EndDate` - تاريخ النهاية

**Use Case:** Evaluate advertising performance, calculate ROAS, and identify best-performing campaigns.

---

### 3. Inventory Forecaster - توقع المخزون
**File:** `inventory-forecaster-example.csv`

**Required Columns:**
- `Date` - التاريخ
- `ProductID` - معرف المنتج
- `ProductName` - اسم المنتج
- `QuantitySold` - الكمية المباعة
- `CurrentStock` - المخزون الحالي
- `ReorderLevel` - مستوى إعادة الطلب
- `UnitCost` - تكلفة الوحدة
- `SellingPrice` - سعر البيع
- `Supplier` - المورد

**Use Case:** Predict inventory needs, prevent stockouts, and optimize reorder timing.

---

### 4. Review Insight - تحليل المراجعات
**File:** `review-insight-example.csv`

**Required Columns:**
- `ReviewID` - معرف المراجعة
- `ProductName` - اسم المنتج
- `Rating` - التقييم (1-5)
- `ReviewText` - نص المراجعة
- `ReviewDate` - تاريخ المراجعة
- `CustomerName` - اسم العميل
- `Verified` - مراجعة موثقة (Yes/No)
- `HelpfulVotes` - الأصوات المفيدة (اختياري)

**Use Case:** Analyze customer sentiment, identify product issues, and improve customer satisfaction.

---

### 5. Catalog Cleaner - منظف الكتالوج
**File:** `catalog-cleaner-example.csv`

**Required Columns:**
- `SKU` - رمز المنتج
- `ProductTitle` - عنوان المنتج
- `Description` - الوصف
- `Category` - الفئة
- `Brand` - العلامة التجارية (اختياري)
- `SupplierPrice` - سعر المورد
- `SellingPrice` - سعر البيع
- `Stock` - المخزون
- `Supplier` - المورد
- `Tags` - العلامات (اختياري)

**Use Case:** Clean product data, standardize descriptions, and optimize catalog structure.

---

## Large Test Files - ملفات الاختبار الكبيرة

For performance testing with larger datasets:
- `large-sales-1000.csv` - 1000 sales records
- `large-ads-100.csv` - 100 ad campaigns  
- `large-inventory-200.csv` - 200 inventory records
- `large-reviews-500.csv` - 500 customer reviews
- `large-catalog-300.csv` - 300 product catalog entries

## Usage Tips - نصائح الاستخدام

1. **Column Names:** Use exact column names or similar variations (e.g., "Order ID" vs "OrderID")
2. **Date Format:** Use YYYY-MM-DD format for dates
3. **Numbers:** Use decimal points for prices (e.g., 19.99)
4. **Text Encoding:** Save files in UTF-8 encoding for Arabic text support
5. **File Size:** Keep files under 10MB for optimal performance

## Supported Formats - التنسيقات المدعومة

- CSV (.csv)
- Excel (.xlsx, .xls)
- Tab-separated (.tsv)

## Language Support - دعم اللغات

All AI tools support:
- English (EN)
- Arabic (AR)
- Mixed language data

The AI will automatically detect and respond in the same language as your data.