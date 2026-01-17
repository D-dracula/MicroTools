# Implementation Plan: Advanced Merchant Calculators

## Overview

This implementation plan covers four advanced financial calculators for e-commerce merchants: Real Net Profit Calculator, Market Price Positioning Analyzer, Safety Stock Calculator, and Discount Impact Simulator. Each tool follows the existing Micro-Tools patterns with separated business logic and UI components.

## Tasks

- [x] 1. Set up shared utilities and input validation
  - [x] 1.1 Create input validation module with shared validation functions
    - Create `src/lib/calculators/input-validation.ts`
    - Implement `validatePositiveNumber`, `validatePercentage`, `validateRequiredFields`
    - Return structured validation results with error messages
    - _Requirements: 6.1, 6.2, 6.3_
  - [x]* 1.2 Write property tests for input validation
    - **Property 14: Input Validation for Invalid Values**
    - Test negative values are rejected
    - Test percentages > 100 return warnings
    - **Validates: Requirements 6.1, 6.2**

- [x] 2. Implement CSV Parser for Ad Spend Data
  - [x] 2.1 Create CSV parser module
    - Create `src/lib/calculators/csv-parser.ts`
    - Implement `parseAdCSV` function supporting Facebook, TikTok, Google formats
    - Auto-detect platform from column headers
    - Return `ParsedCSVResult` with total spend and row details
    - _Requirements: 1.1, 1.4_
  - [x]* 2.2 Write property tests for CSV parser
    - **Property 1: CSV Parsing Extracts Correct Ad Spend Totals**
    - **Property 3: Invalid CSV Returns Appropriate Errors**
    - **Validates: Requirements 1.1, 1.4, 6.4**

- [x] 3. Implement Real Net Profit Calculator
  - [x] 3.1 Create business logic module
    - Create `src/lib/calculators/real-net-profit.ts`
    - Implement `calculateRealNetProfit` function
    - Calculate return losses, total costs, cost breakdown percentages
    - Identify largest cost contributor when unprofitable
    - _Requirements: 1.3, 1.5, 1.6, 1.7_
  - [ ]* 3.2 Write property tests for net profit calculation
    - **Property 2: Net Profit Calculation Correctness**
    - Test formula: Net Profit = Revenue - (Product Cost + Ad Spend + Shipping + Return Losses)
    - Test cost breakdown percentages sum correctly
    - **Validates: Requirements 1.3, 1.5, 1.6, 1.7**
  - [x] 3.3 Create UI component
    - Create `src/components/tools/real-net-profit-calculator.tsx`
    - Add file upload for CSV with drag-and-drop support
    - Add manual input fields for costs
    - Display results with cost breakdown chart
    - Highlight negative profit in red
    - _Requirements: 1.2, 1.7_
  - [x] 3.4 Add translations for Real Net Profit Calculator
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include full SEO content (~300 words total):
      - `whatIs` / `whatIsContent`: ما هي حاسبة صافي الربح الحقيقي؟ شرح للتجار وأصحاب المتاجر
      - `howItWorks` / `howItWorksContent`: المعادلة: صافي الربح = الإيرادات - (تكلفة المنتج + الإعلانات + الشحن + خسائر المرتجعات)
      - `whyNeed` / `whyNeedContent`: لماذا يحتاجها التاجر؟ لأن رقم المبيعات في سلة/Shopify قد يكون خادعاً
    - Add field labels, placeholders, error messages, result labels
    - _Requirements: 5.5_

- [ ] 4. Checkpoint - Verify Real Net Profit Calculator
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Market Price Positioning Analyzer
  - [x] 5.1 Create business logic module
    - Create `src/lib/calculators/market-price-analyzer.ts`
    - Implement `analyzeMarketPrice` function
    - Calculate price position, categorization, market average
    - Generate recommendations based on position
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 5.2 Write property tests for market price analyzer
    - **Property 4: Price Position Formula Correctness**
    - **Property 5: Price Position Categorization**
    - **Property 6: Price Recommendations Based on Position**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
  - [x] 5.3 Create UI component
    - Create `src/components/tools/market-price-analyzer.tsx`
    - Add input for user price and dynamic competitor price inputs
    - Display position on visual scale/chart
    - Show recommendations with reasoning
    - _Requirements: 2.7_
  - [x] 5.4 Add translations for Market Price Analyzer
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include full SEO content (~300 words total):
      - `whatIs` / `whatIsContent`: ما هي أداة تحليل موقع السعر؟ أداة لمقارنة سعرك بالمنافسين
      - `howItWorks` / `howItWorksContent`: المعادلة: موقع السعر = (سعري - أقل سعر) / (أعلى سعر - أقل سعر) × 100
      - `whyNeed` / `whyNeedContent`: لماذا يحتاجها التاجر؟ للتسعير النفسي وليس فقط الحسابي
    - Add category labels (Budget, Value, Premium, Luxury) بالعربية والإنجليزية
    - Add recommendation messages
    - _Requirements: 5.5_

- [ ] 6. Checkpoint - Verify Market Price Analyzer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Safety Stock Calculator
  - [x] 7.1 Create business logic module
    - Create `src/lib/calculators/safety-stock-calculator.ts`
    - Implement `calculateSafetyStock` function
    - Calculate safety stock, reorder point, days until stockout
    - Determine urgency level based on stock vs lead time
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_
  - [ ]* 7.2 Write property tests for safety stock calculator
    - **Property 7: Reorder Point Formula Correctness**
    - **Property 8: Safety Stock Formula Correctness**
    - **Property 9: Stock Urgency Determination**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6, 3.7**
  - [x] 7.3 Create UI component
    - Create `src/components/tools/safety-stock-calculator.tsx`
    - Add inputs for daily sales, lead time, safety days, current stock
    - Display reorder point with urgency indicator
    - Show projected stockout date if applicable
    - _Requirements: 3.4_
  - [x] 7.4 Add translations for Safety Stock Calculator
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include full SEO content (~300 words total):
      - `whatIs` / `whatIsContent`: ما هي حاسبة مخزون الأمان؟ أداة لحساب نقطة إعادة الطلب
      - `howItWorks` / `howItWorksContent`: المعادلة: نقطة إعادة الطلب = (المبيعات اليومية × وقت التوريد) + مخزون الأمان
      - `whyNeed` / `whyNeedContent`: لماذا يحتاجها التاجر؟ لمنع نفاذ المخزون وتوقف الإعلانات
    - Add urgency level labels (Normal, Warning, Critical) بالعربية والإنجليزية
    - Add stockout warning messages
    - _Requirements: 5.5_

- [ ] 8. Checkpoint - Verify Safety Stock Calculator
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Discount Impact Simulator
  - [x] 9.1 Create business logic module
    - Create `src/lib/calculators/discount-impact.ts`
    - Implement `simulateDiscountImpact` function
    - Calculate original/discounted margins, break-even units
    - Generate profit comparison table at different volumes
    - Detect and warn when discount exceeds margin
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 9.2 Write property tests for discount impact simulator
    - **Property 10: Margin Calculations Correctness**
    - **Property 11: Break-Even and Sales Increase Calculations**
    - **Property 12: Profit Comparison Table Correctness**
    - **Property 13: Loss Warning When Discount Exceeds Margin**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
  - [x] 9.3 Create UI component
    - Create `src/components/tools/discount-impact-simulator.tsx`
    - Add inputs for price, cost, discount, current sales
    - Display margin comparison (before/after)
    - Show break-even units and sales increase needed
    - Display profit comparison table
    - Show loss warning when applicable
    - _Requirements: 4.7_
  - [x] 9.4 Add translations for Discount Impact Simulator
    - Add entries to `messages/en.json` and `messages/ar.json`
    - Include full SEO content (~300 words total):
      - `whatIs` / `whatIsContent`: ما هي أداة تأثير الخصومات؟ محاكي لتأثير الخصم على الربح
      - `howItWorks` / `howItWorksContent`: المعادلة: الوحدات المطلوبة = المبيعات الحالية × (الهامش الأصلي / الهامش بعد الخصم)
      - `whyNeed` / `whyNeedContent`: لماذا يحتاجها التاجر؟ لمعرفة كم قطعة إضافية يجب بيعها لتعويض الخصم
    - Add warning messages for loss scenarios
    - Add comparison table headers
    - _Requirements: 5.5_

- [ ] 10. Checkpoint - Verify Discount Impact Simulator
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration and Export Features
  - [x] 11.1 Register all tools in tools configuration
    - Update `src/lib/tools.ts` to include all 4 new tools
    - Add proper categories and slugs
    - _Requirements: All_
  - [x] 11.2 Export components from index
    - Update `src/components/tools/index.ts` to export all new components
    - _Requirements: All_
  - [x] 11.3 Add export functionality to each tool
    - Integrate ExportButtons component with Excel/CSV export
    - Implement copy-to-clipboard for results
    - Add WhatsApp and Twitter share links
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Final Checkpoint - Complete Integration Testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all tools appear in the tools grid
  - Test Arabic and English translations
  - Verify export and share functionality

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each tool follows the existing pattern: business logic in `src/lib/calculators/`, UI in `src/components/tools/`
- All tools use the `ToolWrapper` component for consistent UI and share options
- Translations must be added to both `en.json` and `ar.json` with full SEO content
- Property tests use fast-check with minimum 100 iterations
