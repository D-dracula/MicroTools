# Implementation Plan: AI Merchant Tools

## Overview

This implementation plan covers five AI-powered tools for e-commerce merchants using OpenRouter API. Each tool follows the existing Micro-Tools patterns with separated business logic, AI service integration, and UI components.

## Tasks

- [x] 1. Set up OpenRouter API Integration
  - [x] 1.1 Create OpenRouter client module
    - Create `src/lib/ai-tools/openrouter-client.ts`
    - Implement `validateApiKey`, `chat`, `estimateTokens` functions
    - Configure default model (claude-3-haiku) and fallback options
    - Handle rate limiting and retries
    - _Requirements: 1.1, 1.3, 1.6_
  - [x] 1.2 Create API key encryption module
    - Create `src/lib/ai-tools/encryption.ts`
    - Implement `encryptApiKey`, `decryptApiKey` functions using Web Crypto API
    - Store/retrieve from localStorage securely
    - _Requirements: 1.2_
  - [ ]* 1.3 Write property tests for encryption round-trip
    - **Property 1: API Key Encryption Round-Trip**
    - **Validates: Requirements 1.2**
  - [x] 1.4 Create API Key Manager UI component
    - Create `src/components/tools/shared/api-key-manager.tsx`
    - Add input field with show/hide toggle
    - Add validation status indicator
    - Add usage display (if available from API)
    - _Requirements: 1.1, 1.4, 1.5_

- [ ] 2. Checkpoint - Verify OpenRouter Integration
  - Ensure API key validation works
  - Test encryption/decryption
  - Ask the user if questions arise

- [x] 3. Create File Parser Module
  - [x] 3.1 Create unified file parser
    - Create `src/lib/ai-tools/file-parser.ts`
    - Implement CSV parsing with Papa Parse
    - Implement Excel parsing with SheetJS
    - Implement text file parsing
    - Auto-detect file format and platform (Salla, Zid, Shopify)
    - _Requirements: 7.1, 7.2_
  - [x] 3.2 Create file validation module
    - Create `src/lib/ai-tools/file-validation.ts`
    - Implement size validation (10MB limit)
    - Implement format validation
    - Implement required columns detection
    - _Requirements: 7.2, 7.3, 7.5_
  - [ ]* 3.3 Write property tests for file parser
    - **Property 3: File Format Validation**
    - **Validates: Requirements 7.2, 7.3**
  - [x] 3.4 Create file upload component
    - Create `src/components/tools/shared/ai-file-upload.tsx`
    - Add drag-and-drop support
    - Add progress indicator
    - Add file preview
    - _Requirements: 7.1, 7.4_

- [ ] 4. Checkpoint - Verify File Parser
  - Test CSV, Excel, and text file parsing
  - Test file size validation
  - Ask the user if questions arise

- [-] 5. Implement Smart Profit Audit
  - [x] 5.1 Create business logic module
    - Create `src/lib/ai-tools/smart-profit-audit.ts`
    - Implement `analyzeProfit` function
    - Create AI prompt for expense classification
    - Calculate net profit per order
    - Identify losing products
    - Generate recommendations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 5.2 Write property tests for profit calculation
    - **Property 4: Net Profit Calculation Correctness**
    - **Property 5: Expense Classification Output Validity**
    - **Validates: Requirements 2.3, 2.4, 2.2**
  - [ ] 5.3 Create UI component
    - Create `src/components/tools/smart-profit-audit.tsx`
    - Add file upload for sales data
    - Add API key input (using shared component)
    - Display analysis results with charts
    - Show losing products with reasons
    - Display AI recommendations
    - _Requirements: 2.5, 2.7_
  - [x] 5.4 Add translations for Smart Profit Audit
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include SEO content (~300 words):
      - `whatIs`: ما هو محلل الأرباح الشامل؟ أداة ذكية تحلل ملفات مبيعاتك
      - `howItWorks`: كيف يعمل؟ ارفع ملف المبيعات والذكاء الاصطناعي يصنف المصاريف
      - `whyNeed`: لماذا تحتاجه؟ لاكتشاف أين تضيع أموالك بدون إدخال يدوي
    - _Requirements: 8.4_

- [ ] 6. Checkpoint - Verify Smart Profit Audit
  - Test with sample Salla/Zid export files
  - Verify expense classification accuracy
  - Ask the user if questions arise

- [x] 7. Implement AI Review Insight
  - [x] 7.1 Create business logic module
    - Create `src/lib/ai-tools/review-insight.ts`
    - Implement `analyzeReviews` function
    - Create AI prompt for sentiment analysis
    - Extract pain points and praised features
    - Generate product improvement suggestions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 7.2 Write property tests for sentiment analysis
    - **Property 6: Sentiment Analysis Output Validity**
    - **Validates: Requirements 3.2, 3.3, 3.4**
  - [x] 7.3 Create UI component
    - Create `src/components/tools/review-insight.tsx`
    - Add file upload for reviews
    - Display sentiment distribution chart
    - Show pain points with severity
    - Show praised features
    - Display AI recommendations
    - _Requirements: 3.6, 3.7_
  - [x] 7.4 Add translations for AI Review Insight
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include SEO content (~300 words):
      - `whatIs`: ما هو محلل مراجعات المنافسين؟ أداة لتحليل تعليقات العملاء
      - `howItWorks`: كيف يعمل؟ تحليل المشاعر واستخراج نقاط الألم
      - `whyNeed`: لماذا تحتاجه؟ لاختيار المنتج المناسب قبل الاستيراد
    - _Requirements: 8.4_

- [ ] 8. Checkpoint - Verify AI Review Insight
  - Test with Arabic and English reviews
  - Verify sentiment accuracy
  - Ask the user if questions arise

- [x] 9. Implement AI Catalog Cleaner
  - [x] 9.1 Create business logic module
    - Create `src/lib/ai-tools/catalog-cleaner.ts`
    - Implement `cleanCatalog` function
    - Create AI prompt for translation and cleaning
    - Generate SEO keywords
    - Track changes for preview
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 9.2 Write property tests for catalog cleaning
    - **Property 7: Catalog Cleaning Output Validity**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  - [x] 9.3 Create UI component
    - Create `src/components/tools/catalog-cleaner.tsx`
    - Add file upload for supplier catalog
    - Show before/after preview
    - Add progress indicator for large files
    - Provide download button
    - _Requirements: 4.5, 4.6, 4.7_
  - [x] 9.4 Add translations for AI Catalog Cleaner
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include SEO content (~300 words):
      - `whatIs`: ما هو منظف بيانات المنتجات؟ أداة لترجمة وتنسيق الكتالوج
      - `howItWorks`: كيف يعمل؟ ترجمة بيعية وليست حرفية + كلمات مفتاحية SEO
      - `whyNeed`: لماذا تحتاجه؟ لرفع مئات المنتجات في دقائق بدلاً من أيام
    - _Requirements: 8.4_

- [ ] 10. Checkpoint - Verify AI Catalog Cleaner
  - Test with English supplier catalog
  - Verify Arabic translation quality
  - Ask the user if questions arise

- [x] 11. Implement AI Inventory Forecaster
  - [x] 11.1 Create business logic module
    - Create `src/lib/ai-tools/inventory-forecaster.ts`
    - Implement `forecastInventory` function
    - Create AI prompt for seasonality detection
    - Calculate stockout dates
    - Generate order recommendations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 11.2 Write property tests for stockout prediction
    - **Property 8: Stockout Date Calculation Correctness**
    - **Validates: Requirements 5.3, 5.5**
  - [x] 11.3 Create UI component
    - Create `src/components/tools/inventory-forecaster.tsx`
    - Add file upload for sales history
    - Display stock timeline chart
    - Show urgent alerts prominently
    - Display seasonality insights
    - _Requirements: 5.7_
  - [x] 11.4 Add translations for AI Inventory Forecaster
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include SEO content (~300 words):
      - `whatIs`: ما هو متنبئ المخزون؟ أداة للتنبؤ بنفاد المخزون
      - `howItWorks`: كيف يعمل؟ تحليل أنماط المبيعات والموسمية
      - `whyNeed`: لماذا تحتاجه؟ لتجنب توقف المبيعات بسبب نفاد المخزون
    - _Requirements: 8.4_

- [ ] 12. Checkpoint - Verify AI Inventory Forecaster
  - Test with 3-month sales data
  - Verify stockout predictions
  - Ask the user if questions arise

- [x] 13. Implement Ad Spend Auditor
  - [x] 13.1 Create business logic module
    - Create `src/lib/ai-tools/ad-spend-auditor.ts`
    - Implement `auditAdSpend` function
    - Create AI prompt for campaign analysis
    - Calculate true ROI and CPA
    - Identify profitable/unprofitable campaigns
    - Generate optimization recommendations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [ ]* 13.2 Write property tests for ROI calculation
    - **Property 9: ROI Calculation Correctness**
    - **Validates: Requirements 6.2, 6.3**
  - [x] 13.3 Create UI component
    - Create `src/components/tools/ad-spend-auditor.tsx`
    - Add file uploads for ad reports and sales data
    - Display campaign performance table
    - Show profitable vs unprofitable campaigns
    - Display wasted budget amount
    - Show AI recommendations
    - _Requirements: 6.5, 6.7_
  - [x] 13.4 Add translations for Ad Spend Auditor
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include SEO content (~300 words):
      - `whatIs`: ما هو محلل أداء الحملات؟ أداة لمقارنة تكلفة الإعلان مع الأرباح
      - `howItWorks`: كيف يعمل؟ حساب ROI الحقيقي وليس فقط ROAS
      - `whyNeed`: لماذا تحتاجه؟ لتوفير ميزانية الإعلانات المهدرة
    - _Requirements: 8.4_

- [ ] 14. Checkpoint - Verify Ad Spend Auditor
  - Test with Facebook/TikTok ad reports
  - Verify ROI calculations
  - Ask the user if questions arise

- [x] 15. Integration and Export Features
  - [x] 15.1 Create export manager module
    - Create `src/lib/ai-tools/export-manager.ts`
    - Implement Excel export with xlsx library
    - Implement PDF export for reports
    - Implement copy-to-clipboard
    - _Requirements: 8.1, 8.2_
  - [x] 15.2 Create share buttons component
    - Create `src/components/tools/shared/ai-share-buttons.tsx`
    - Add WhatsApp share with summary
    - Add Twitter share with summary
    - _Requirements: 8.3_
  - [x] 15.3 Register all tools in tools configuration
    - Update `src/lib/tools.ts` to include all 5 AI tools
    - Add proper categories (AI Tools) and slugs
    - _Requirements: All_
  - [x] 15.4 Export components from index
    - Update `src/components/tools/index.ts` to export all new components
    - _Requirements: All_

- [x] 16. Final Checkpoint - Complete Integration Testing
  - Ensure all tests pass
  - Verify all tools appear in the tools grid
  - Test Arabic and English translations
  - Verify export and share functionality
  - Test API key persistence across sessions
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- All tools require OpenRouter API key - shared component handles this
- Each tool follows the pattern: business logic in `src/lib/ai-tools/`, UI in `src/components/tools/`
- AI prompts should be in Arabic for better Arabic output quality
- Token usage should be estimated before processing to warn users about costs
- Property tests use fast-check with minimum 100 iterations
- File size limit is 10MB to prevent excessive API costs

## Dependencies to Install

```bash
npm install papaparse xlsx jspdf
npm install -D @types/papaparse
```

