# Implementation Plan: New Calculator Tools

## Overview

خطة تنفيذ 10 أدوات حاسبة جديدة مع محتوى SEO وميزة المشاركة. التنفيذ يبدأ بالمكونات المشتركة ثم كل أداة على حدة.

## Tasks

- [x] 1. Setup Shared Components
  - [x] 1.1 Install html2canvas dependency
    - Run `npm install html2canvas`
    - Add types if needed
    - _Requirements: 1.9, 13.8_

  - [x] 1.2 Create SEO Content component
    - Create `src/components/tools/shared/seo-content.tsx`
    - Render SEO content with semantic HTML (article, section, h2, h3)
    - Support Arabic and English content from translations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.10_

  - [x] 1.3 Create Result Card component
    - Create `src/components/tools/shared/result-card.tsx`
    - Display tool name, inputs, outputs in clean format
    - Include site branding and timestamp
    - Design for social sharing aesthetics
    - _Requirements: 1.10, 1.11, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.10_

  - [x] 1.4 Create Share Buttons component
    - Create `src/components/tools/shared/share-buttons.tsx`
    - Implement "Copy Result" with Clipboard API
    - Implement "Download as Image" with html2canvas
    - Show success toast notifications
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 13.7, 13.8, 13.9, 13.11_

- [x] 2. Checkpoint - Shared Components Complete
  - Test copy functionality
  - Test image download
  - Verify SEO content rendering

- [x] 3. Net Profit Calculator (After Returns)
  - [x] 3.1 Create calculator logic
    - Create `src/lib/calculators/net-profit.ts`
    - Implement net profit formula with return rate
    - Implement input validation
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 3.2 Write property test for net profit calculation
    - **Property 1: Net Profit Calculation Mathematical Correctness**
    - **Validates: Requirements 2.5, 2.6, 2.7, 2.8**

  - [x] 3.3 Create NetProfitCalculator component
    - Create `src/components/tools/net-profit-calculator.tsx`
    - Input fields: revenue, product cost, return rate, processing cost
    - Display: net profit, effective margin, return losses
    - Include SEO content and share buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.9_

  - [x] 3.4 Add translations for Net Profit Calculator
    - Add Arabic translations in `messages/ar.json`
    - Add English translations in `messages/en.json`
    - Include SEO content (~300 words)
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

  - [x] 3.5 Register tool in tools registry
    - Add tool definition in `src/lib/tools.ts`
    - _Requirements: 2.1_

- [x] 4. Payment Gateway Fee Calculator
  - [x] 4.1 Create calculator logic
    - Create `src/lib/calculators/payment-gateway.ts`
    - Implement fee calculation for Tab, Paytabs, Moyasar, HyperPay
    - Include 2026 fee rates
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 4.2 Write property test for payment gateway calculation
    - **Property 3: Payment Gateway Fee Calculation Correctness**
    - **Property 4: Payment Gateway Comparison Completeness**
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.8**

  - [x] 4.3 Create PaymentGatewayCalculator component
    - Create `src/components/tools/payment-gateway-calculator.tsx`
    - Provider selector, payment method selector
    - Comparison table for all providers
    - _Requirements: 3.1, 3.2, 3.3, 3.8_

  - [x] 4.4 Add translations for Payment Gateway Calculator
    - Add Arabic and English translations
    - Include SEO content
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

  - [x] 4.5 Register tool in tools registry
    - _Requirements: 3.1_

- [x] 5. Import Duty Estimator
  - [x] 5.1 Create calculator logic
    - Create `src/lib/calculators/import-duty.ts`
    - Implement CIF, duty, VAT calculations
    - Include country and category rates
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [ ]* 5.2 Write property test for import duty calculation
    - **Property 5: Import Duty Calculation Correctness**
    - **Validates: Requirements 4.6, 4.7, 4.8, 4.9**

  - [x] 5.3 Create ImportDutyEstimator component
    - Create `src/components/tools/import-duty-estimator.tsx`
    - Country and category selectors
    - Breakdown display
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.4 Add translations for Import Duty Estimator
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

  - [x] 5.5 Register tool in tools registry

- [x] 6. Checkpoint - First 3 Tools Complete
  - Test all calculators
  - Verify SEO content displays correctly
  - Test share functionality

- [x] 7. PayPal Fee Calculator
  - [x] 7.1 Create calculator logic
    - Create `src/lib/calculators/paypal-fee.ts`
    - Implement PayPal 2026 fee structure
    - Include currency conversion fees
    - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

  - [ ]* 7.2 Write property test for PayPal fee calculation
    - **Property 6: PayPal Fee Calculation Correctness**
    - **Validates: Requirements 5.5, 5.6, 5.7, 5.8, 5.9**

  - [x] 7.3 Create PayPalFeeCalculator component
    - Create `src/components/tools/paypal-fee-calculator.tsx`
    - Currency selectors, transaction type
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.4 Add translations and register tool

- [x] 8. Ad Break-Even Calculator
  - [x] 8.1 Create calculator logic
    - Create `src/lib/calculators/ad-breakeven.ts`
    - Implement break-even, traffic, CPC calculations
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

  - [ ]* 8.2 Write property test for ad break-even calculation
    - **Property 7: Ad Break-Even Calculation Correctness**
    - **Property 14: Negative Profit Error Handling**
    - **Validates: Requirements 6.5, 6.6, 6.7, 6.8, 6.10**

  - [x] 8.3 Create AdBreakEvenCalculator component
    - Create `src/components/tools/ad-breakeven-calculator.tsx`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 8.4 Add translations and register tool

- [x] 9. Shipping Comparator
  - [x] 9.1 Create calculator logic
    - Create `src/lib/calculators/shipping.ts`
    - Implement volumetric weight calculation
    - Include carrier rates (Aramex, SMSA, DHL, FedEx, Saudi Post)
    - _Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11_

  - [ ]* 9.2 Write property test for shipping calculation
    - **Property 8: Shipping Weight Calculation Correctness**
    - **Validates: Requirements 7.5, 7.6**

  - [x] 9.3 Create ShippingComparator component
    - Create `src/components/tools/shipping-comparator.tsx`
    - Carrier comparison table with highlights
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.9, 7.10_

  - [x] 9.4 Add translations and register tool

- [x] 10. Saudi VAT Calculator
  - [x] 10.1 Create calculator logic
    - Create `src/lib/calculators/saudi-vat.ts`
    - Implement add/extract VAT modes
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 10.2 Write property test for VAT calculation
    - **Property 9: Saudi VAT Round-Trip Correctness**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6, 8.7**

  - [x] 10.3 Create SaudiVATCalculator component
    - Create `src/components/tools/saudi-vat-calculator.tsx`
    - Mode toggle (Add/Extract)
    - _Requirements: 8.1, 8.2_

  - [x] 10.4 Add translations and register tool

- [x] 11. Checkpoint - 6 Tools Complete
  - Test all calculators
  - Verify mobile responsiveness
  - Test RTL layout

- [x] 12. FBA Storage Calculator
  - [x] 12.1 Create calculator logic
    - Create `src/lib/calculators/fba-storage.ts`
    - Implement cubic feet, monthly fees, surcharges
    - _Requirements: 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12_

  - [ ]* 12.2 Write property test for FBA storage calculation
    - **Property 10: FBA Storage Calculation Correctness**
    - **Validates: Requirements 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11**

  - [x] 12.3 Create FBAStorageCalculator component
    - Create `src/components/tools/fba-storage-calculator.tsx`
    - Size tier selector, monthly breakdown
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 12.4 Add translations and register tool

- [x] 13. Fair Pricing Calculator
  - [x] 13.1 Create calculator logic
    - Create `src/lib/calculators/fair-pricing.ts`
    - Implement fair price formula
    - _Requirements: 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12_

  - [ ]* 13.2 Write property test for fair pricing calculation
    - **Property 11: Fair Pricing Calculation Correctness**
    - **Property 15: Invalid Fee Percentage Error Handling**
    - **Validates: Requirements 10.6, 10.7, 10.8, 10.10**

  - [x] 13.3 Create FairPricingCalculator component
    - Create `src/components/tools/fair-pricing-calculator.tsx`
    - Preset suggestions for common scenarios
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.11_

  - [x] 13.4 Add translations and register tool

- [x] 14. ROI Calculator
  - [x] 14.1 Create calculator logic
    - Create `src/lib/calculators/roi.ts`
    - Implement ROI, annualized ROI, payback period
    - _Requirements: 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11_

  - [ ]* 14.2 Write property test for ROI calculation
    - **Property 12: ROI Calculation Correctness**
    - **Property 16: Negative ROI Warning**
    - **Validates: Requirements 11.5, 11.6, 11.7, 11.8, 11.10**

  - [x] 14.3 Create ROICalculator component
    - Create `src/components/tools/roi-calculator.tsx`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 14.4 Add translations and register tool
    - Add Arabic translations in `messages/ar.json`
    - Add English translations in `messages/en.json`
    - Include SEO content (~300 words)
    - Register tool in `src/lib/tools.ts`
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 15. Input Validation Property Test
  - [ ]* 15.1 Write property test for input validation
    - **Property 2: Input Validation Rejects Invalid Values**
    - **Validates: Requirements 2.10, 3.10, 4.11, 5.11, 6.11, 7.11, 8.9, 9.12, 10.12, 11.11**

- [ ] 16. Final Checkpoint
  - Run all tests
  - Test all 10 calculators
  - Verify SEO content for all tools
  - Test share functionality on all tools
  - Verify responsive design
  - Test RTL/LTR layouts

## Notes

- Tasks marked with `*` are optional property-based tests
- Each tool follows the same pattern: logic → component → translations → register
- All tools use shared SEO and Share components
- SEO content should be ~300 words per tool in both languages
- Share feature uses html2canvas for image generation
- Tools can be added to the existing tools registry in `src/lib/tools.ts`

