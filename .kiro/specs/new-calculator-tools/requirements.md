# Requirements Document

## Introduction

إضافة 10 أدوات حاسبة جديدة لموقع الأدوات المصغرة للتجارة الإلكترونية. كل أداة تتضمن:
- الحاسبة التفاعلية نفسها
- محتوى نصي SEO (~300 كلمة) يشرح الأداة والمعادلة وأهميتها للتاجر
- ميزة المشاركة (نسخ النتيجة / تحميل كصورة)

## Glossary

- **Calculator_Tool**: أداة حاسبة تفاعلية
- **SEO_Content**: محتوى نصي مُحسّن لمحركات البحث
- **Share_Feature**: ميزة مشاركة النتائج
- **Result_Card**: بطاقة عرض النتائج القابلة للمشاركة
- **Net_Profit_Calculator**: حاسبة الربح الحقيقي بعد المرتجعات
- **Payment_Gateway_Calculator**: حاسبة رسوم بوابات الدفع المحلية
- **Import_Duty_Estimator**: مقدر رسوم الجمارك والضرائب الدولية
- **PayPal_Fee_Calculator**: حاسبة رسوم باي بال الدولية
- **Ad_BreakEven_Calculator**: حاسبة نقطة التعادل للإعلانات
- **Shipping_Comparator**: مقارن رسوم الشحن بين الشركات
- **Saudi_VAT_Calculator**: حاسبة ضريبة القيمة المضافة السعودية
- **FBA_Storage_Calculator**: حاسبة رسوم التخزين الطويل Amazon FBA
- **Fair_Pricing_Calculator**: حاسبة سعر المنتج العادل للمبتدئين
- **ROI_Calculator**: حاسبة العائد على الاستثمار

## Requirements

### Requirement 1: Shared Components for All Tools

**User Story:** As a developer, I want reusable components for SEO content and sharing, so that all tools have consistent functionality.

#### Acceptance Criteria

1. THE Calculator_Tool SHALL include a SEO_Content section below the calculator
2. THE SEO_Content SHALL contain approximately 300 words explaining the tool
3. THE SEO_Content SHALL explain what the tool does
4. THE SEO_Content SHALL explain the calculation formula/method
5. THE SEO_Content SHALL explain why merchants need this tool
6. THE Share_Feature SHALL provide a "Copy Result" button
7. THE Share_Feature SHALL provide a "Download as Image" button
8. WHEN a user clicks "Copy Result", THE Share_Feature SHALL copy formatted text to clipboard
9. WHEN a user clicks "Download as Image", THE Share_Feature SHALL generate and download a PNG image of the Result_Card
10. THE Result_Card SHALL display results in a clean, branded format suitable for sharing
11. THE Result_Card SHALL include the site logo/name for brand recognition

### Requirement 2: Net Profit Calculator (After Returns)

**User Story:** As an e-commerce seller, I want to calculate my real profit after accounting for returns, so that I can understand my true profitability.

#### Acceptance Criteria

1. THE Net_Profit_Calculator SHALL accept total revenue as input
2. THE Net_Profit_Calculator SHALL accept product cost as input
3. THE Net_Profit_Calculator SHALL accept return rate percentage as input
4. THE Net_Profit_Calculator SHALL accept return processing cost per item as input
5. WHEN all inputs are provided, THE Net_Profit_Calculator SHALL calculate net profit using formula: `NetProfit = Revenue × (1 - ReturnRate) - ProductCost - (Revenue × ReturnRate × ProcessingCost)`
6. THE Net_Profit_Calculator SHALL display net profit amount
7. THE Net_Profit_Calculator SHALL display effective profit margin percentage
8. THE Net_Profit_Calculator SHALL display total return losses
9. IF return rate exceeds 50%, THEN THE Net_Profit_Calculator SHALL display a warning
10. THE Net_Profit_Calculator SHALL validate all inputs are positive numbers

### Requirement 3: Local Payment Gateway Fee Calculator (Tab/Paytabs)

**User Story:** As a Saudi/Gulf merchant, I want to calculate payment gateway fees for local providers, so that I can price my products correctly.

#### Acceptance Criteria

1. THE Payment_Gateway_Calculator SHALL accept transaction amount as input
2. THE Payment_Gateway_Calculator SHALL allow selection of gateway provider (Tab, Paytabs, Moyasar, HyperPay)
3. THE Payment_Gateway_Calculator SHALL accept payment method (Mada, Visa/MC, Apple Pay)
4. WHEN inputs are provided, THE Payment_Gateway_Calculator SHALL calculate fees based on provider rates
5. THE Payment_Gateway_Calculator SHALL display transaction fee amount
6. THE Payment_Gateway_Calculator SHALL display net amount after fees
7. THE Payment_Gateway_Calculator SHALL display fee percentage
8. THE Payment_Gateway_Calculator SHALL show comparison table of all providers for same transaction
9. THE Payment_Gateway_Calculator SHALL use current 2026 fee rates for each provider
10. THE Payment_Gateway_Calculator SHALL validate transaction amount is positive

### Requirement 4: Global Import Duty Estimator

**User Story:** As an importer, I want to estimate customs duties and taxes, so that I can calculate total landed cost of products.

#### Acceptance Criteria

1. THE Import_Duty_Estimator SHALL accept product value (FOB) as input
2. THE Import_Duty_Estimator SHALL accept shipping cost as input
3. THE Import_Duty_Estimator SHALL accept insurance cost as input
4. THE Import_Duty_Estimator SHALL allow selection of destination country (Saudi, UAE, Kuwait, etc.)
5. THE Import_Duty_Estimator SHALL allow selection of product category
6. WHEN inputs are provided, THE Import_Duty_Estimator SHALL calculate CIF value: `CIF = FOB + Shipping + Insurance`
7. THE Import_Duty_Estimator SHALL calculate customs duty based on country and category rates
8. THE Import_Duty_Estimator SHALL calculate VAT on (CIF + Duty)
9. THE Import_Duty_Estimator SHALL display total landed cost
10. THE Import_Duty_Estimator SHALL display breakdown of all fees
11. THE Import_Duty_Estimator SHALL validate all monetary inputs are non-negative

### Requirement 5: PayPal International Fee Calculator (2026 Update)

**User Story:** As an international seller, I want to calculate PayPal fees accurately, so that I can set correct prices for international customers.

#### Acceptance Criteria

1. THE PayPal_Fee_Calculator SHALL accept transaction amount as input
2. THE PayPal_Fee_Calculator SHALL accept sender currency
3. THE PayPal_Fee_Calculator SHALL accept receiver currency
4. THE PayPal_Fee_Calculator SHALL allow selection of transaction type (Goods/Services, Friends/Family)
5. WHEN inputs are provided, THE PayPal_Fee_Calculator SHALL calculate PayPal fee: `Fee = (Amount × PercentageFee) + FixedFee`
6. THE PayPal_Fee_Calculator SHALL calculate currency conversion fee if currencies differ
7. THE PayPal_Fee_Calculator SHALL display total fees
8. THE PayPal_Fee_Calculator SHALL display net amount received
9. THE PayPal_Fee_Calculator SHALL display effective fee percentage
10. THE PayPal_Fee_Calculator SHALL use 2026 PayPal fee structure
11. THE PayPal_Fee_Calculator SHALL validate amount is positive

### Requirement 6: Ad Campaign Break-Even Calculator

**User Story:** As a marketer, I want to calculate break-even point for ad campaigns, so that I can set realistic advertising budgets.

#### Acceptance Criteria

1. THE Ad_BreakEven_Calculator SHALL accept product selling price as input
2. THE Ad_BreakEven_Calculator SHALL accept product cost as input
3. THE Ad_BreakEven_Calculator SHALL accept ad spend budget as input
4. THE Ad_BreakEven_Calculator SHALL accept expected conversion rate as input
5. WHEN inputs are provided, THE Ad_BreakEven_Calculator SHALL calculate profit per sale: `ProfitPerSale = SellingPrice - Cost`
6. THE Ad_BreakEven_Calculator SHALL calculate break-even sales: `BreakEvenSales = AdSpend / ProfitPerSale`
7. THE Ad_BreakEven_Calculator SHALL calculate required traffic: `RequiredTraffic = BreakEvenSales / ConversionRate`
8. THE Ad_BreakEven_Calculator SHALL calculate maximum CPC: `MaxCPC = ProfitPerSale × ConversionRate`
9. THE Ad_BreakEven_Calculator SHALL display all calculated metrics
10. IF profit per sale is zero or negative, THEN THE Ad_BreakEven_Calculator SHALL display error message
11. THE Ad_BreakEven_Calculator SHALL validate all inputs are positive

### Requirement 7: Shipping Carrier Cost Comparator

**User Story:** As a seller, I want to compare shipping costs between carriers, so that I can choose the most cost-effective option.

#### Acceptance Criteria

1. THE Shipping_Comparator SHALL accept package weight as input
2. THE Shipping_Comparator SHALL accept package dimensions (L×W×H) as input
3. THE Shipping_Comparator SHALL accept origin city/region
4. THE Shipping_Comparator SHALL accept destination city/region
5. WHEN inputs are provided, THE Shipping_Comparator SHALL calculate volumetric weight: `VolumetricWeight = (L × W × H) / 5000`
6. THE Shipping_Comparator SHALL use the greater of actual or volumetric weight
7. THE Shipping_Comparator SHALL display shipping cost for multiple carriers (Aramex, SMSA, DHL, FedEx, Saudi Post)
8. THE Shipping_Comparator SHALL display estimated delivery time for each carrier
9. THE Shipping_Comparator SHALL highlight the cheapest option
10. THE Shipping_Comparator SHALL highlight the fastest option
11. THE Shipping_Comparator SHALL validate weight and dimensions are positive

### Requirement 8: Saudi VAT Calculator (15%)

**User Story:** As a Saudi merchant, I want to calculate VAT correctly, so that I can comply with tax regulations and price products accurately.

#### Acceptance Criteria

1. THE Saudi_VAT_Calculator SHALL accept amount as input
2. THE Saudi_VAT_Calculator SHALL allow selection of calculation mode (Add VAT / Extract VAT)
3. WHEN "Add VAT" mode is selected, THE Saudi_VAT_Calculator SHALL calculate: `TotalWithVAT = Amount × 1.15`
4. WHEN "Extract VAT" mode is selected, THE Saudi_VAT_Calculator SHALL calculate: `AmountBeforeVAT = Amount / 1.15`
5. THE Saudi_VAT_Calculator SHALL display VAT amount
6. THE Saudi_VAT_Calculator SHALL display amount before VAT
7. THE Saudi_VAT_Calculator SHALL display total amount with VAT
8. THE Saudi_VAT_Calculator SHALL use fixed 15% VAT rate
9. THE Saudi_VAT_Calculator SHALL validate amount is positive

### Requirement 9: Amazon FBA Long-term Storage Fee Calculator

**User Story:** As an Amazon FBA seller, I want to calculate long-term storage fees, so that I can manage inventory and avoid excessive fees.

#### Acceptance Criteria

1. THE FBA_Storage_Calculator SHALL accept product dimensions (L×W×H in inches) as input
2. THE FBA_Storage_Calculator SHALL accept number of units as input
3. THE FBA_Storage_Calculator SHALL accept storage duration in months as input
4. THE FBA_Storage_Calculator SHALL allow selection of product size tier (Standard/Oversize)
5. WHEN inputs are provided, THE FBA_Storage_Calculator SHALL calculate cubic feet: `CubicFeet = (L × W × H) / 1728 × Units`
6. THE FBA_Storage_Calculator SHALL calculate monthly storage fee based on size tier and season
7. IF storage duration > 6 months, THEN THE FBA_Storage_Calculator SHALL add aged inventory surcharge
8. IF storage duration > 12 months, THEN THE FBA_Storage_Calculator SHALL add long-term storage fee
9. THE FBA_Storage_Calculator SHALL display monthly fee breakdown
10. THE FBA_Storage_Calculator SHALL display total storage cost
11. THE FBA_Storage_Calculator SHALL display cost per unit
12. THE FBA_Storage_Calculator SHALL validate all inputs are positive

### Requirement 10: Fair Product Pricing Calculator (For Beginners)

**User Story:** As a new seller, I want a simple tool to calculate fair product pricing, so that I can ensure profitability without complex calculations.

#### Acceptance Criteria

1. THE Fair_Pricing_Calculator SHALL accept product cost as input
2. THE Fair_Pricing_Calculator SHALL accept desired profit margin percentage as input
3. THE Fair_Pricing_Calculator SHALL accept shipping cost per item as input
4. THE Fair_Pricing_Calculator SHALL accept payment gateway fee percentage as input
5. THE Fair_Pricing_Calculator SHALL accept platform fee percentage (if applicable) as input
6. WHEN inputs are provided, THE Fair_Pricing_Calculator SHALL calculate fair selling price using formula: `SellingPrice = (Cost + Shipping) / (1 - ProfitMargin - GatewayFee - PlatformFee)`
7. THE Fair_Pricing_Calculator SHALL display recommended selling price
8. THE Fair_Pricing_Calculator SHALL display profit amount per sale
9. THE Fair_Pricing_Calculator SHALL display breakdown of all costs and fees
10. IF total fees exceed 100%, THEN THE Fair_Pricing_Calculator SHALL display error
11. THE Fair_Pricing_Calculator SHALL provide preset suggestions for common scenarios
12. THE Fair_Pricing_Calculator SHALL validate all inputs are non-negative

### Requirement 11: Business ROI Calculator

**User Story:** As a business owner, I want to calculate ROI for investments, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE ROI_Calculator SHALL accept initial investment amount as input
2. THE ROI_Calculator SHALL accept expected revenue/return as input
3. THE ROI_Calculator SHALL accept time period in months as input
4. THE ROI_Calculator SHALL accept ongoing costs as input
5. WHEN inputs are provided, THE ROI_Calculator SHALL calculate net profit: `NetProfit = Revenue - Investment - OngoingCosts`
6. THE ROI_Calculator SHALL calculate ROI percentage: `ROI = (NetProfit / Investment) × 100`
7. THE ROI_Calculator SHALL calculate annualized ROI if period differs from 12 months
8. THE ROI_Calculator SHALL calculate payback period in months
9. THE ROI_Calculator SHALL display all calculated metrics
10. IF ROI is negative, THEN THE ROI_Calculator SHALL display warning with loss amount
11. THE ROI_Calculator SHALL validate investment amount is positive

### Requirement 12: SEO Content Structure

**User Story:** As a website owner, I want SEO-optimized content for each tool, so that the tools rank well in search engines.

#### Acceptance Criteria

1. THE SEO_Content SHALL be structured with proper heading hierarchy (H2, H3)
2. THE SEO_Content SHALL include the tool name in Arabic and English
3. THE SEO_Content SHALL explain the purpose of the tool in simple terms
4. THE SEO_Content SHALL include the mathematical formula with explanation
5. THE SEO_Content SHALL include a practical example with numbers
6. THE SEO_Content SHALL explain business benefits for merchants
7. THE SEO_Content SHALL include relevant keywords naturally
8. THE SEO_Content SHALL be approximately 300 words per tool
9. THE SEO_Content SHALL be available in both Arabic and English
10. THE SEO_Content SHALL use semantic HTML (article, section tags)

### Requirement 13: Share Feature Implementation

**User Story:** As a user, I want to share my calculation results, so that I can send them to partners or post in merchant groups.

#### Acceptance Criteria

1. THE Share_Feature SHALL display a Result_Card with clean formatting
2. THE Result_Card SHALL include the tool name
3. THE Result_Card SHALL include all input values
4. THE Result_Card SHALL include all calculated results
5. THE Result_Card SHALL include the site branding (logo/name)
6. THE Result_Card SHALL include a timestamp
7. WHEN "Copy Result" is clicked, THE Share_Feature SHALL copy text in readable format
8. WHEN "Download as Image" is clicked, THE Share_Feature SHALL use html2canvas to generate PNG
9. THE Share_Feature SHALL show success toast after copy/download
10. THE Result_Card design SHALL be visually appealing for social sharing
11. THE Share_Feature SHALL work on both mobile and desktop

