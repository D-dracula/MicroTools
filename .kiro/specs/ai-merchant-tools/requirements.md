# Requirements Document

## Introduction

مجموعة من الأدوات الذكية المدعومة بالذكاء الاصطناعي (OpenRouter API) المصممة خصيصاً للتجار وأصحاب المتاجر الإلكترونية. تتميز هذه الأدوات بقدرتها على تحليل الملفات تلقائياً واستخراج رؤى قيمة دون الحاجة لإدخال البيانات يدوياً.

**ملاحظة مهمة**: كل مستخدم يجب أن يدخل مفتاح OpenRouter API الخاص به لاستخدام هذه الأدوات.

## Glossary

- **Smart_Profit_Audit**: محلل الأرباح الشامل - يحلل ملفات المبيعات ويصنف المصاريف تلقائياً
- **AI_Review_Insight**: محلل مراجعات المنافسين - يحلل تعليقات العملاء ويستخرج نقاط الألم
- **AI_Catalog_Cleaner**: منظف بيانات المنتجات - يترجم وينسق بيانات المنتجات
- **AI_Inventory_Forecaster**: متنبئ المخزون - يتنبأ بنفاد المخزون بناءً على أنماط المبيعات
- **Ad_Spend_Auditor**: محلل أداء الحملات - يقارن تكلفة الإعلان مع الأرباح الفعلية
- **OpenRouter_API**: خدمة API للوصول لنماذج الذكاء الاصطناعي المختلفة
- **Sentiment_Analysis**: تحليل المشاعر - تحديد إيجابية أو سلبية النص
- **Pain_Points**: نقاط الألم - المشاكل المتكررة التي يشتكي منها العملاء
- **Seasonality**: الموسمية - أنماط المبيعات المرتبطة بفترات زمنية معينة

## Requirements

### Requirement 1: OpenRouter API Integration

**User Story:** As a merchant, I want to use my own OpenRouter API key, so that I can access AI features securely and control my usage costs.

#### Acceptance Criteria

1. WHEN a user first accesses any AI tool, THE System SHALL prompt them to enter their OpenRouter API key
2. THE System SHALL securely store the API key in the user's browser local storage (encrypted)
3. WHEN the API key is invalid or expired, THE System SHALL display a clear error message with instructions
4. THE System SHALL allow users to update or remove their API key from settings
5. THE System SHALL display estimated token usage before processing large files
6. WHEN API calls fail, THE System SHALL provide retry options and fallback suggestions

### Requirement 2: Smart Profit Audit (محلل الأرباح الشامل)

**User Story:** As a merchant, I want to upload my sales export file and get AI-powered profit analysis, so that I can discover where my money is being lost without manual data entry.

#### Acceptance Criteria

1. WHEN a user uploads a sales CSV/Excel file (from Salla, Zid, or Shopify), THE Smart_Profit_Audit SHALL parse and validate the file format
2. THE Smart_Profit_Audit SHALL use AI to automatically classify expenses into categories: payment gateway fees, shipping costs, taxes, refunds
3. THE Smart_Profit_Audit SHALL calculate real net profit for each individual order
4. THE Smart_Profit_Audit SHALL identify products that are losing money due to high shipping costs or payment gateway fees
5. WHEN analysis is complete, THE Smart_Profit_Audit SHALL display a summary showing: total revenue, total costs by category, net profit, and loss-making products
6. THE Smart_Profit_Audit SHALL provide AI-generated recommendations to improve profitability
7. THE Smart_Profit_Audit SHALL allow exporting results to Excel with full breakdown

### Requirement 3: AI Review Insight (محلل مراجعات المنافسين)

**User Story:** As a merchant, I want to analyze competitor reviews using AI, so that I can identify product weaknesses and opportunities before importing products.

#### Acceptance Criteria

1. WHEN a user uploads a text file or CSV containing customer reviews, THE AI_Review_Insight SHALL parse and process the reviews
2. THE AI_Review_Insight SHALL perform sentiment analysis to categorize reviews as positive, negative, or neutral
3. THE AI_Review_Insight SHALL extract recurring pain points and complaints from negative reviews
4. THE AI_Review_Insight SHALL identify frequently praised features from positive reviews
5. THE AI_Review_Insight SHALL generate product improvement suggestions based on the analysis
6. WHEN analysis is complete, THE AI_Review_Insight SHALL display: sentiment distribution chart, top pain points list, top praised features, and AI recommendations
7. THE AI_Review_Insight SHALL support both Arabic and English reviews

### Requirement 4: AI Catalog Cleaner (منظف بيانات المنتجات)

**User Story:** As a merchant, I want to clean and translate my supplier's product catalog using AI, so that I can upload hundreds of products to my store in minutes instead of days.

#### Acceptance Criteria

1. WHEN a user uploads a supplier catalog file (CSV/Excel), THE AI_Catalog_Cleaner SHALL parse product titles and descriptions
2. THE AI_Catalog_Cleaner SHALL translate titles and descriptions from English to sales-oriented Arabic (not literal translation)
3. THE AI_Catalog_Cleaner SHALL clean and format titles by removing strange symbols and standardizing format
4. THE AI_Catalog_Cleaner SHALL generate SEO keywords for each product to improve Google ranking
5. THE AI_Catalog_Cleaner SHALL allow users to preview changes before downloading
6. WHEN processing is complete, THE AI_Catalog_Cleaner SHALL provide a downloadable file in the same format as input
7. THE AI_Catalog_Cleaner SHALL show progress indicator for large files with estimated time remaining

### Requirement 5: AI Inventory Forecaster (متنبئ المخزون)

**User Story:** As a merchant, I want AI to predict when my inventory will run out, so that I can reorder in time and avoid sales interruptions.

#### Acceptance Criteria

1. WHEN a user uploads sales data for the past 3 months, THE AI_Inventory_Forecaster SHALL analyze sales patterns
2. THE AI_Inventory_Forecaster SHALL detect seasonality patterns (Ramadan, Eid, summer, etc.)
3. THE AI_Inventory_Forecaster SHALL predict the expected stockout date for each product
4. THE AI_Inventory_Forecaster SHALL generate alerts like: "You should order 500 additional units now to cover Ramadan"
5. WHEN stockout is predicted within lead time, THE AI_Inventory_Forecaster SHALL display urgent warnings
6. THE AI_Inventory_Forecaster SHALL provide recommended order quantities based on predicted demand
7. THE AI_Inventory_Forecaster SHALL display a visual timeline showing predicted stock levels

### Requirement 6: Ad Spend Auditor (محلل أداء الحملات)

**User Story:** As a merchant, I want AI to analyze my ad campaigns against actual profits, so that I can identify truly profitable campaigns and stop wasting ad budget.

#### Acceptance Criteria

1. WHEN a user uploads ad report files (Facebook/TikTok) and sales data, THE Ad_Spend_Auditor SHALL match campaigns with actual orders
2. THE Ad_Spend_Auditor SHALL calculate true ROI for each campaign (not just ROAS)
3. THE Ad_Spend_Auditor SHALL identify campaigns where customer acquisition cost exceeds product profit margin
4. THE Ad_Spend_Auditor SHALL generate recommendations like: "Stop Campaign A because acquisition cost is higher than profit margin"
5. WHEN analysis is complete, THE Ad_Spend_Auditor SHALL display: campaign performance table, profitable vs unprofitable campaigns, and total wasted budget
6. THE Ad_Spend_Auditor SHALL provide AI-generated optimization suggestions
7. THE Ad_Spend_Auditor SHALL allow exporting the analysis report

### Requirement 7: File Upload and Processing

**User Story:** As a user, I want a smooth file upload experience with clear feedback, so that I can easily provide data for AI analysis.

#### Acceptance Criteria

1. THE System SHALL support drag-and-drop file upload for all AI tools
2. THE System SHALL validate file formats before processing (CSV, XLSX, XLS, TXT)
3. WHEN a file exceeds size limits (10MB), THE System SHALL display an error with suggestions
4. THE System SHALL show upload progress and processing status
5. WHEN file format is not recognized, THE System SHALL provide sample file templates for download
6. THE System SHALL preserve uploaded data only for the current session (no server storage)

### Requirement 8: Export and Sharing

**User Story:** As a merchant, I want to export and share AI analysis results, so that I can discuss them with partners or save them for reference.

#### Acceptance Criteria

1. WHEN analysis is complete, THE System SHALL provide download options based on tool type:
   - Smart Profit Audit: Excel with full breakdown
   - AI Review Insight: PDF report with charts
   - AI Catalog Cleaner: CSV/Excel in original format
   - AI Inventory Forecaster: Excel with predictions
   - Ad Spend Auditor: Excel with campaign analysis
2. THE System SHALL provide copy-to-clipboard for key insights
3. THE System SHALL provide WhatsApp and Twitter share links with summary text
4. THE System SHALL support both Arabic and English for all exports

### Requirement 9: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when something goes wrong, so that I can fix issues and complete my analysis.

#### Acceptance Criteria

1. WHEN AI processing fails, THE System SHALL display user-friendly error messages in Arabic
2. WHEN API rate limits are reached, THE System SHALL inform user and suggest waiting time
3. THE System SHALL provide tooltips and help text explaining each tool's purpose
4. WHEN processing takes longer than expected, THE System SHALL show progress updates
5. IF the uploaded file has missing required columns, THEN THE System SHALL specify which columns are needed

