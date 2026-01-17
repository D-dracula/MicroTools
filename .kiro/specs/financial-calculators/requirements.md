# Requirements Document

## Introduction

مجموعة من 10 حاسبات مالية متخصصة للتجارة الإلكترونية. تُضاف هذه الأدوات إلى موقع Micro-Tools الحالي وتتبع نفس البنية والتصميم. جميع الأدوات تعمل بدون تسجيل دخول وتدعم اللغتين العربية والإنجليزية.

## Glossary

- **Net_Profit_Calculator**: حاسبة الربح الحقيقي بعد المرتجعات
- **Payment_Gateway_Calculator**: حاسبة رسوم بوابات الدفع المحلية (تاب/بيتابس)
- **Import_Duty_Estimator**: مقدر رسوم الجمارك والضرائب الدولية
- **PayPal_Fee_Calculator**: حاسبة رسوم باي بال الدولية
- **Ad_BreakEven_Calculator**: حاسبة نقطة التعادل للإعلانات الممولة
- **Shipping_Comparator**: مقارن رسوم الشحن بين الشركات
- **Saudi_VAT_Calculator**: حاسبة ضريبة القيمة المضافة للسعودية
- **FBA_Storage_Calculator**: حاسبة رسوم التخزين الطويل (Amazon FBA)
- **Fair_Pricing_Calculator**: حاسبة سعر المنتج العادل للمبتدئين
- **ROI_Calculator**: حاسبة العائد على الاستثمار للمشاريع

## Requirements

### Requirement 1: Net Profit Calculator (After Returns)

**User Story:** As an e-commerce seller, I want to calculate my real profit after accounting for returns, so that I can understand my actual earnings.

#### Acceptance Criteria

1. THE Net_Profit_Calculator SHALL accept gross revenue as input
2. THE Net_Profit_Calculator SHALL accept total cost of goods sold (COGS) as input
3. THE Net_Profit_Calculator SHALL accept return rate percentage as input
4. THE Net_Profit_Calculator SHALL accept return processing cost per item as input
5. WHEN all inputs are provided, THE Net_Profit_Calculator SHALL calculate net revenue after returns
6. WHEN all inputs are provided, THE Net_Profit_Calculator SHALL calculate total return costs
7. WHEN all inputs are provided, THE Net_Profit_Calculator SHALL calculate actual net profit
8. THE Net_Profit_Calculator SHALL display profit margin percentage after returns
9. THE Net_Profit_Calculator SHALL validate that all inputs are positive numbers
10. IF return rate exceeds 100%, THEN THE Net_Profit_Calculator SHALL display an error

### Requirement 2: Local Payment Gateway Fee Calculator (Tab/Paytabs)

**User Story:** As a Saudi/GCC merchant, I want to calculate payment gateway fees for Tab and Paytabs, so that I can choose the best option and price my products correctly.

#### Acceptance Criteria

1. THE Payment_Gateway_Calculator SHALL accept transaction amount as input
2. THE Payment_Gateway_Calculator SHALL accept number of transactions as input
3. THE Payment_Gateway_Calculator SHALL calculate fees for Tab gateway (2.9% + 1 SAR per transaction)
4. THE Payment_Gateway_Calculator SHALL calculate fees for Paytabs gateway (2.5% + 0.5 SAR per transaction)
5. WHEN calculations are complete, THE Payment_Gateway_Calculator SHALL display side-by-side comparison
6. THE Payment_Gateway_Calculator SHALL highlight the cheaper option
7. THE Payment_Gateway_Calculator SHALL calculate monthly fee totals
8. THE Payment_Gateway_Calculator SHALL display net amount after fees for each gateway
9. THE Payment_Gateway_Calculator SHALL validate that transaction amount is positive
10. THE Payment_Gateway_Calculator SHALL support SAR currency display

### Requirement 3: Global Import Duty Estimator

**User Story:** As an importer, I want to estimate customs duties and taxes for international shipments, so that I can calculate total landed cost.

#### Acceptance Criteria

1. THE Import_Duty_Estimator SHALL accept product value (FOB) as input
2. THE Import_Duty_Estimator SHALL accept shipping cost as input
3. THE Import_Duty_Estimator SHALL accept insurance cost as input
4. THE Import_Duty_Estimator SHALL accept destination country selection (Saudi Arabia, UAE, Kuwait, Bahrain, Oman, Qatar)
5. THE Import_Duty_Estimator SHALL accept product category selection
6. WHEN inputs are provided, THE Import_Duty_Estimator SHALL calculate CIF value (Cost + Insurance + Freight)
7. WHEN inputs are provided, THE Import_Duty_Estimator SHALL calculate customs duty based on country and category
8. WHEN inputs are provided, THE Import_Duty_Estimator SHALL calculate VAT/GST based on destination country
9. THE Import_Duty_Estimator SHALL display total landed cost
10. THE Import_Duty_Estimator SHALL display breakdown of all fees and taxes
11. THE Import_Duty_Estimator SHALL validate that all monetary inputs are non-negative

### Requirement 4: PayPal International Fee Calculator (2026 Update)

**User Story:** As an international seller, I want to calculate PayPal fees for cross-border transactions, so that I can price my products correctly.

#### Acceptance Criteria

1. THE PayPal_Fee_Calculator SHALL accept transaction amount as input
2. THE PayPal_Fee_Calculator SHALL accept sender currency selection
3. THE PayPal_Fee_Calculator SHALL accept receiver currency selection
4. THE PayPal_Fee_Calculator SHALL calculate standard PayPal fee (4.4% + fixed fee based on currency)
5. THE PayPal_Fee_Calculator SHALL calculate currency conversion fee (4% spread)
6. WHEN currencies differ, THE PayPal_Fee_Calculator SHALL calculate total cross-border fees
7. THE PayPal_Fee_Calculator SHALL display net amount received
8. THE PayPal_Fee_Calculator SHALL display total fee percentage
9. THE PayPal_Fee_Calculator SHALL support major currencies (USD, EUR, GBP, SAR, AED)
10. THE PayPal_Fee_Calculator SHALL validate that transaction amount is positive

### Requirement 5: Ad Campaign Break-Even Calculator

**User Story:** As a marketer, I want to calculate the break-even point for my ad campaigns, so that I can set realistic budgets and targets.

#### Acceptance Criteria

1. THE Ad_BreakEven_Calculator SHALL accept product selling price as input
2. THE Ad_BreakEven_Calculator SHALL accept product cost as input
3. THE Ad_BreakEven_Calculator SHALL accept ad spend budget as input
4. THE Ad_BreakEven_Calculator SHALL accept average conversion rate as input
5. WHEN inputs are provided, THE Ad_BreakEven_Calculator SHALL calculate profit per sale
6. WHEN inputs are provided, THE Ad_BreakEven_Calculator SHALL calculate required sales to break even
7. WHEN inputs are provided, THE Ad_BreakEven_Calculator SHALL calculate required traffic (visitors)
8. WHEN inputs are provided, THE Ad_BreakEven_Calculator SHALL calculate maximum cost per click (CPC) for profitability
9. THE Ad_BreakEven_Calculator SHALL display ROAS (Return on Ad Spend) at break-even
10. THE Ad_BreakEven_Calculator SHALL validate that conversion rate is between 0 and 100
11. IF profit per sale is zero or negative, THEN THE Ad_BreakEven_Calculator SHALL display a warning

### Requirement 6: Shipping Carrier Cost Comparator

**User Story:** As an e-commerce seller, I want to compare shipping costs between different carriers, so that I can choose the most cost-effective option.

#### Acceptance Criteria

1. THE Shipping_Comparator SHALL accept package weight (kg) as input
2. THE Shipping_Comparator SHALL accept package dimensions (L x W x H in cm) as input
3. THE Shipping_Comparator SHALL accept origin city selection
4. THE Shipping_Comparator SHALL accept destination city selection
5. THE Shipping_Comparator SHALL calculate volumetric weight
6. THE Shipping_Comparator SHALL use the higher of actual or volumetric weight for pricing
7. THE Shipping_Comparator SHALL calculate estimated cost for Aramex
8. THE Shipping_Comparator SHALL calculate estimated cost for SMSA
9. THE Shipping_Comparator SHALL calculate estimated cost for DHL
10. THE Shipping_Comparator SHALL display comparison table with all carriers
11. THE Shipping_Comparator SHALL highlight the cheapest option
12. THE Shipping_Comparator SHALL validate that weight and dimensions are positive

### Requirement 7: Saudi VAT Calculator (15%)

**User Story:** As a Saudi business owner, I want to calculate VAT for my transactions, so that I can ensure compliance and correct pricing.

#### Acceptance Criteria

1. THE Saudi_VAT_Calculator SHALL accept amount as input
2. THE Saudi_VAT_Calculator SHALL accept calculation mode (add VAT to amount OR extract VAT from amount)
3. WHEN mode is "add VAT", THE Saudi_VAT_Calculator SHALL calculate VAT amount (15% of input)
4. WHEN mode is "add VAT", THE Saudi_VAT_Calculator SHALL display total amount including VAT
5. WHEN mode is "extract VAT", THE Saudi_VAT_Calculator SHALL calculate VAT portion from VAT-inclusive amount
6. WHEN mode is "extract VAT", THE Saudi_VAT_Calculator SHALL display original amount before VAT
7. THE Saudi_VAT_Calculator SHALL display VAT amount clearly
8. THE Saudi_VAT_Calculator SHALL support bulk calculation for multiple items
9. THE Saudi_VAT_Calculator SHALL validate that amount is positive
10. THE Saudi_VAT_Calculator SHALL display amounts in SAR format

### Requirement 8: Amazon FBA Long-term Storage Fee Calculator

**User Story:** As an Amazon FBA seller, I want to calculate long-term storage fees, so that I can manage inventory and avoid excessive fees.

#### Acceptance Criteria

1. THE FBA_Storage_Calculator SHALL accept product dimensions (L x W x H in inches) as input
2. THE FBA_Storage_Calculator SHALL accept number of units as input
3. THE FBA_Storage_Calculator SHALL accept storage duration (months) as input
4. THE FBA_Storage_Calculator SHALL accept product size tier (standard/oversize) as input
5. WHEN inputs are provided, THE FBA_Storage_Calculator SHALL calculate cubic feet per unit
6. WHEN storage duration is 271-365 days, THE FBA_Storage_Calculator SHALL apply aged inventory surcharge
7. WHEN storage duration exceeds 365 days, THE FBA_Storage_Calculator SHALL apply long-term storage fee
8. THE FBA_Storage_Calculator SHALL display monthly storage cost breakdown
9. THE FBA_Storage_Calculator SHALL display total storage fees for the period
10. THE FBA_Storage_Calculator SHALL recommend removal if fees exceed product value threshold
11. THE FBA_Storage_Calculator SHALL validate that all inputs are positive

### Requirement 9: Fair Product Pricing Calculator (For Beginners)

**User Story:** As a new e-commerce seller, I want a simple tool to calculate a fair selling price, so that I can ensure profitability without complex calculations.

#### Acceptance Criteria

1. THE Fair_Pricing_Calculator SHALL accept product cost as input
2. THE Fair_Pricing_Calculator SHALL accept desired profit margin percentage as input
3. THE Fair_Pricing_Calculator SHALL accept shipping cost per item as input
4. THE Fair_Pricing_Calculator SHALL accept payment gateway fee percentage as input
5. THE Fair_Pricing_Calculator SHALL accept platform fee percentage (if applicable) as input
6. WHEN inputs are provided, THE Fair_Pricing_Calculator SHALL calculate minimum selling price
7. WHEN inputs are provided, THE Fair_Pricing_Calculator SHALL calculate recommended selling price
8. THE Fair_Pricing_Calculator SHALL display profit breakdown per sale
9. THE Fair_Pricing_Calculator SHALL display effective profit margin after all fees
10. THE Fair_Pricing_Calculator SHALL provide pricing suggestions (budget/standard/premium)
11. THE Fair_Pricing_Calculator SHALL validate that profit margin is between 0 and 500
12. THE Fair_Pricing_Calculator SHALL validate that fee percentages are between 0 and 100

### Requirement 10: Business ROI Calculator

**User Story:** As a business owner, I want to calculate ROI for my investments, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE ROI_Calculator SHALL accept initial investment amount as input
2. THE ROI_Calculator SHALL accept expected revenue as input
3. THE ROI_Calculator SHALL accept operating costs as input
4. THE ROI_Calculator SHALL accept time period (months) as input
5. WHEN inputs are provided, THE ROI_Calculator SHALL calculate net profit
6. WHEN inputs are provided, THE ROI_Calculator SHALL calculate ROI percentage
7. WHEN inputs are provided, THE ROI_Calculator SHALL calculate payback period
8. THE ROI_Calculator SHALL display monthly ROI breakdown
9. THE ROI_Calculator SHALL display annualized ROI
10. IF ROI is negative, THEN THE ROI_Calculator SHALL display a loss warning
11. THE ROI_Calculator SHALL validate that initial investment is positive
12. THE ROI_Calculator SHALL validate that time period is at least 1 month

### Requirement 11: Common Tool Requirements

**User Story:** As a user, I want all calculators to have consistent behavior and accessibility.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL display all calculators in the financial category
2. EACH calculator SHALL update results in real-time as user types
3. EACH calculator SHALL be fully functional without authentication
4. EACH calculator SHALL support Arabic and English languages
5. EACH calculator SHALL be responsive on mobile devices
6. EACH calculator SHALL display clear input labels and result descriptions
7. WHERE a user is authenticated, EACH calculator SHALL allow saving calculations
8. EACH calculator SHALL handle edge cases gracefully without crashing
9. EACH calculator SHALL use consistent number formatting based on locale

