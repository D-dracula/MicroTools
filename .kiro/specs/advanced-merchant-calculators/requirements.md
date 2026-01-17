# Requirements Document

## Introduction

مجموعة من الأدوات المالية المتقدمة المصممة خصيصاً للتجار وأصحاب المتاجر الإلكترونية. تهدف هذه الأدوات إلى مساعدة التجار في اتخاذ قرارات مالية واستراتيجية أفضل من خلال حسابات دقيقة تشمل تكاليف الإعلانات، تحليل المنافسين، إدارة المخزون، وتأثير الخصومات.

## Glossary

- **Real_Net_Profit_Calculator**: حاسبة صافي الربح الحقيقي التي تحسب الربح بعد خصم جميع التكاليف (إعلانات، شحن، مرتجعات)
- **Market_Price_Analyzer**: أداة تحليل موقع السعر في السوق مقارنة بالمنافسين
- **Safety_Stock_Calculator**: حاسبة مخزون الأمان ونقطة إعادة الطلب
- **Discount_Impact_Simulator**: محاكي تأثير الخصومات على هامش الربح
- **CSV_Parser**: محلل ملفات CSV لاستيراد بيانات الإعلانات
- **Lead_Time**: الوقت المستغرق من طلب المنتج حتى وصوله
- **Reorder_Point**: نقطة إعادة الطلب - الكمية التي يجب عندها طلب مخزون جديد
- **Price_Elasticity**: مرونة السعر - مدى تأثير تغيير السعر على حجم المبيعات
- **Break_Even_Units**: عدد الوحدات المطلوب بيعها لتعويض الخسارة في هامش الربح

## Requirements

### Requirement 1: Real Net Profit Calculator

**User Story:** As a merchant, I want to calculate my real net profit after all expenses including ad spend, shipping, and returns, so that I can understand my true profitability.

#### Acceptance Criteria

1. WHEN a user uploads a CSV file with ad spend data, THE Real_Net_Profit_Calculator SHALL parse the file and extract ad spend amounts
2. WHEN a user enters product cost, shipping cost, and return rate, THE Real_Net_Profit_Calculator SHALL store these values for calculation
3. WHEN all required inputs are provided, THE Real_Net_Profit_Calculator SHALL calculate net profit using the formula: Net Profit = Revenue - (Product Cost + Ad Spend + Shipping Cost + Return Losses)
4. WHEN the CSV file format is invalid, THE Real_Net_Profit_Calculator SHALL display a clear error message indicating the expected format
5. WHEN calculating return losses, THE Real_Net_Profit_Calculator SHALL multiply total revenue by return rate percentage
6. THE Real_Net_Profit_Calculator SHALL display a breakdown showing each cost component and its percentage of revenue
7. WHEN net profit is negative, THE Real_Net_Profit_Calculator SHALL highlight the result in red and show which cost is the largest contributor

### Requirement 2: Market Price Positioning Analyzer

**User Story:** As a merchant, I want to analyze my product price compared to competitors, so that I can optimize my pricing strategy for maximum profit.

#### Acceptance Criteria

1. WHEN a user enters their product price and at least 3 competitor prices, THE Market_Price_Analyzer SHALL calculate the price position percentage
2. THE Market_Price_Analyzer SHALL calculate price position using the formula: Position = (My Price - Min Price) / (Max Price - Min Price) × 100
3. WHEN price position is calculated, THE Market_Price_Analyzer SHALL categorize it as: Budget (0-25%), Value (25-50%), Premium (50-75%), or Luxury (75-100%)
4. THE Market_Price_Analyzer SHALL provide pricing recommendations based on the calculated position
5. WHEN the user's price is below the market average, THE Market_Price_Analyzer SHALL suggest potential price increase opportunities
6. WHEN the user's price is above the market average, THE Market_Price_Analyzer SHALL warn about potential sales volume impact
7. THE Market_Price_Analyzer SHALL display a visual representation showing the user's price relative to competitors

### Requirement 3: Safety Stock and Reorder Point Calculator

**User Story:** As a merchant, I want to calculate my safety stock level and reorder point, so that I can prevent stockouts and maintain continuous sales.

#### Acceptance Criteria

1. WHEN a user enters average daily sales and supplier lead time, THE Safety_Stock_Calculator SHALL calculate the reorder point
2. THE Safety_Stock_Calculator SHALL calculate reorder point using the formula: Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock
3. WHEN calculating safety stock, THE Safety_Stock_Calculator SHALL use the formula: Safety Stock = Average Daily Sales × Safety Days (default 7 days)
4. THE Safety_Stock_Calculator SHALL allow users to customize the safety days buffer
5. WHEN current stock level is provided, THE Safety_Stock_Calculator SHALL indicate if reorder is needed immediately
6. THE Safety_Stock_Calculator SHALL calculate days until stockout based on current inventory and daily sales
7. WHEN days until stockout is less than lead time, THE Safety_Stock_Calculator SHALL display an urgent warning

### Requirement 4: Discount Impact Simulator

**User Story:** As a merchant, I want to simulate the impact of discounts on my profit margin, so that I can make informed decisions about promotional pricing.

#### Acceptance Criteria

1. WHEN a user enters original price, product cost, and discount percentage, THE Discount_Impact_Simulator SHALL calculate the new profit margin
2. THE Discount_Impact_Simulator SHALL calculate original margin using: Original Margin = (Original Price - Cost) / Original Price × 100
3. THE Discount_Impact_Simulator SHALL calculate discounted margin using: Discounted Margin = (Discounted Price - Cost) / Discounted Price × 100
4. THE Discount_Impact_Simulator SHALL calculate break-even units using: Break Even Units = Original Units × (Original Margin / Discounted Margin)
5. WHEN discount is applied, THE Discount_Impact_Simulator SHALL show the percentage increase in sales volume needed to maintain the same total profit
6. THE Discount_Impact_Simulator SHALL display a comparison table showing profit at different sales volumes
7. IF the discount percentage exceeds the profit margin, THEN THE Discount_Impact_Simulator SHALL warn that each sale will result in a loss

### Requirement 5: Data Export and Sharing

**User Story:** As a merchant, I want to export and share my calculation results, so that I can discuss them with partners or save them for future reference.

#### Acceptance Criteria

1. WHEN a calculation is complete, THE System SHALL provide a copy-to-clipboard button for the results
2. THE System SHALL allow exporting results to Excel/CSV format
3. THE System SHALL provide direct share links for WhatsApp and Twitter
4. WHEN exporting to Excel, THE System SHALL include all input values and calculated results
5. THE System SHALL support both Arabic and English languages for all tools

### Requirement 6: Input Validation and Error Handling

**User Story:** As a user, I want clear feedback when I enter invalid data, so that I can correct my inputs and get accurate results.

#### Acceptance Criteria

1. WHEN a user enters a negative number for costs or prices, THE System SHALL display an error message
2. WHEN a user enters a percentage greater than 100 for return rate or discount, THE System SHALL display a warning
3. WHEN required fields are empty, THE System SHALL highlight them and prevent calculation
4. IF CSV file parsing fails, THEN THE System SHALL provide specific error details and format examples
