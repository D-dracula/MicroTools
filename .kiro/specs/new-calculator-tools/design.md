# Design Document: New Calculator Tools

## Overview

تصميم 10 أدوات حاسبة جديدة لموقع الأدوات المصغرة مع:
- **Shared Components**: مكونات مشتركة للمحتوى SEO وميزة المشاركة
- **Calculator Logic**: منطق الحسابات لكل أداة في ملفات منفصلة
- **UI Components**: مكونات واجهة المستخدم لكل حاسبة
- **Translations**: ترجمات عربية وإنجليزية لكل أداة

### Key Design Decisions

1. **html2canvas** - لتحويل Result_Card إلى صورة PNG
2. **Clipboard API** - لنسخ النتائج للحافظة
3. **Modular Calculator Logic** - كل حاسبة في ملف منفصل للصيانة السهلة
4. **Shared SEO Component** - مكون موحد لعرض المحتوى النصي
5. **Shared Share Component** - مكون موحد لميزة المشاركة

## Architecture

```
src/
├── components/
│   ├── tools/
│   │   ├── shared/
│   │   │   ├── seo-content.tsx          # SEO content display
│   │   │   ├── result-card.tsx          # Shareable result card
│   │   │   └── share-buttons.tsx        # Copy & Download buttons
│   │   ├── net-profit-calculator.tsx
│   │   ├── payment-gateway-calculator.tsx
│   │   ├── import-duty-estimator.tsx
│   │   ├── paypal-fee-calculator.tsx
│   │   ├── ad-breakeven-calculator.tsx
│   │   ├── shipping-comparator.tsx
│   │   ├── saudi-vat-calculator.tsx
│   │   ├── fba-storage-calculator.tsx
│   │   ├── fair-pricing-calculator.tsx
│   │   └── roi-calculator.tsx
├── lib/
│   └── calculators/
│       ├── net-profit.ts
│       ├── payment-gateway.ts
│       ├── import-duty.ts
│       ├── paypal-fee.ts
│       ├── ad-breakeven.ts
│       ├── shipping.ts
│       ├── saudi-vat.ts
│       ├── fba-storage.ts
│       ├── fair-pricing.ts
│       └── roi.ts
└── messages/
    ├── ar.json  # Add new tool translations
    └── en.json  # Add new tool translations
```

## Components and Interfaces

### Shared Components

#### SEO Content Component

```typescript
// src/components/tools/shared/seo-content.tsx
interface SEOContentProps {
  toolSlug: string;
  locale: 'ar' | 'en';
}

// Renders SEO content from translations with proper semantic HTML
// Uses article, section, h2, h3 tags for SEO
```

#### Result Card Component

```typescript
// src/components/tools/shared/result-card.tsx
interface ResultCardProps {
  toolName: string;
  inputs: Record<string, { label: string; value: string | number }>;
  outputs: Record<string, { label: string; value: string | number; highlight?: boolean }>;
  locale: 'ar' | 'en';
}

// Renders a clean, branded card suitable for sharing
// Includes site logo, timestamp, and formatted results
```

#### Share Buttons Component

```typescript
// src/components/tools/shared/share-buttons.tsx
interface ShareButtonsProps {
  resultCardRef: React.RefObject<HTMLDivElement>;
  copyText: string;
  onCopySuccess?: () => void;
  onDownloadSuccess?: () => void;
}

// Provides "Copy Result" and "Download as Image" buttons
// Uses Clipboard API and html2canvas
```

### Calculator Interfaces

```typescript
// ============ Net Profit Calculator ============
interface NetProfitInputs {
  revenue: number;
  productCost: number;
  returnRate: number;      // percentage (0-100)
  processingCost: number;  // per returned item
}

interface NetProfitOutputs {
  netProfit: number;
  effectiveMargin: number;
  returnLosses: number;
  hasHighReturnRate: boolean;
}

// ============ Payment Gateway Calculator ============
type GatewayProvider = 'tab' | 'paytabs' | 'moyasar' | 'hyperpay';
type PaymentMethod = 'mada' | 'visa_mc' | 'apple_pay';

interface PaymentGatewayInputs {
  amount: number;
  provider: GatewayProvider;
  paymentMethod: PaymentMethod;
}

interface PaymentGatewayOutputs {
  fee: number;
  netAmount: number;
  feePercentage: number;
  comparison: Array<{
    provider: GatewayProvider;
    fee: number;
    netAmount: number;
  }>;
}

// ============ Import Duty Estimator ============
type DestinationCountry = 'saudi' | 'uae' | 'kuwait' | 'bahrain' | 'oman' | 'qatar';
type ProductCategory = 'electronics' | 'clothing' | 'food' | 'cosmetics' | 'general';

interface ImportDutyInputs {
  fobValue: number;
  shippingCost: number;
  insuranceCost: number;
  destinationCountry: DestinationCountry;
  productCategory: ProductCategory;
}

interface ImportDutyOutputs {
  cifValue: number;
  customsDuty: number;
  vatAmount: number;
  totalLandedCost: number;
  breakdown: {
    fob: number;
    shipping: number;
    insurance: number;
    duty: number;
    vat: number;
  };
}

// ============ PayPal Fee Calculator ============
type Currency = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED';
type TransactionType = 'goods_services' | 'friends_family';

interface PayPalFeeInputs {
  amount: number;
  senderCurrency: Currency;
  receiverCurrency: Currency;
  transactionType: TransactionType;
}

interface PayPalFeeOutputs {
  paypalFee: number;
  conversionFee: number;
  totalFees: number;
  netAmount: number;
  effectiveFeePercentage: number;
}

// ============ Ad Break-Even Calculator ============
interface AdBreakEvenInputs {
  sellingPrice: number;
  productCost: number;
  adSpend: number;
  conversionRate: number;  // percentage (0-100)
}

interface AdBreakEvenOutputs {
  profitPerSale: number;
  breakEvenSales: number;
  requiredTraffic: number;
  maxCPC: number;
  isViable: boolean;
}

// ============ Shipping Comparator ============
type ShippingCarrier = 'aramex' | 'smsa' | 'dhl' | 'fedex' | 'saudi_post';

interface ShippingInputs {
  weight: number;  // kg
  length: number;  // cm
  width: number;   // cm
  height: number;  // cm
  originRegion: string;
  destinationRegion: string;
}

interface ShippingOutputs {
  volumetricWeight: number;
  chargeableWeight: number;
  carriers: Array<{
    carrier: ShippingCarrier;
    cost: number;
    deliveryDays: string;
    isCheapest: boolean;
    isFastest: boolean;
  }>;
}

// ============ Saudi VAT Calculator ============
type VATMode = 'add' | 'extract';

interface SaudiVATInputs {
  amount: number;
  mode: VATMode;
}

interface SaudiVATOutputs {
  vatAmount: number;
  amountBeforeVAT: number;
  totalWithVAT: number;
}

// ============ FBA Storage Calculator ============
type SizeTier = 'standard' | 'oversize';

interface FBAStorageInputs {
  length: number;   // inches
  width: number;    // inches
  height: number;   // inches
  units: number;
  storageDuration: number;  // months
  sizeTier: SizeTier;
}

interface FBAStorageOutputs {
  cubicFeet: number;
  monthlyFee: number;
  agedInventorySurcharge: number;
  longTermStorageFee: number;
  totalCost: number;
  costPerUnit: number;
  monthlyBreakdown: Array<{
    month: number;
    fee: number;
    surcharge: number;
  }>;
}

// ============ Fair Pricing Calculator ============
interface FairPricingInputs {
  productCost: number;
  desiredMargin: number;     // percentage
  shippingCost: number;
  gatewayFee: number;        // percentage
  platformFee: number;       // percentage
}

interface FairPricingOutputs {
  recommendedPrice: number;
  profitPerSale: number;
  breakdown: {
    productCost: number;
    shippingCost: number;
    gatewayFeeAmount: number;
    platformFeeAmount: number;
    profit: number;
  };
  isValid: boolean;
  errorMessage?: string;
}

// ============ ROI Calculator ============
interface ROIInputs {
  initialInvestment: number;
  expectedRevenue: number;
  timePeriod: number;  // months
  ongoingCosts: number;
}

interface ROIOutputs {
  netProfit: number;
  roiPercentage: number;
  annualizedROI: number;
  paybackPeriod: number;  // months
  isPositive: boolean;
}
```

## Data Models

### Fee Rate Data

```typescript
// Payment Gateway Rates (2026)
const GATEWAY_RATES = {
  tab: {
    mada: { percentage: 1.5, fixed: 0 },
    visa_mc: { percentage: 2.5, fixed: 0 },
    apple_pay: { percentage: 2.5, fixed: 0 },
  },
  paytabs: {
    mada: { percentage: 1.75, fixed: 0 },
    visa_mc: { percentage: 2.65, fixed: 0 },
    apple_pay: { percentage: 2.65, fixed: 0 },
  },
  moyasar: {
    mada: { percentage: 1.5, fixed: 1 },
    visa_mc: { percentage: 2.5, fixed: 1 },
    apple_pay: { percentage: 2.5, fixed: 1 },
  },
  hyperpay: {
    mada: { percentage: 1.6, fixed: 0 },
    visa_mc: { percentage: 2.4, fixed: 0 },
    apple_pay: { percentage: 2.4, fixed: 0 },
  },
};

// Import Duty Rates by Country
const DUTY_RATES = {
  saudi: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  uae: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  // ... other countries
};

// VAT Rates by Country
const VAT_RATES = {
  saudi: 15,
  uae: 5,
  kuwait: 0,
  bahrain: 10,
  oman: 5,
  qatar: 0,
};

// PayPal Fee Structure (2026)
const PAYPAL_RATES = {
  goods_services: {
    USD: { percentage: 3.49, fixed: 0.49 },
    EUR: { percentage: 3.49, fixed: 0.39 },
    GBP: { percentage: 3.49, fixed: 0.29 },
    SAR: { percentage: 3.49, fixed: 1.99 },
    AED: { percentage: 3.49, fixed: 1.99 },
  },
  friends_family: {
    domestic: { percentage: 0, fixed: 0 },
    international: { percentage: 5, fixed: 0 },
  },
  conversion_fee: 4,  // percentage
};

// FBA Storage Rates (2026)
const FBA_STORAGE_RATES = {
  standard: {
    jan_sep: 0.87,  // per cubic foot
    oct_dec: 2.40,  // peak season
  },
  oversize: {
    jan_sep: 0.56,
    oct_dec: 1.40,
  },
  aged_surcharge: {  // 271-365 days
    standard: 1.50,
    oversize: 0.50,
  },
  long_term: {  // 365+ days
    standard: 6.90,
    oversize: 6.90,
  },
};

// Shipping Carrier Rates (approximate, SAR)
const SHIPPING_RATES = {
  aramex: { baseRate: 25, perKg: 8, deliveryDays: '2-3' },
  smsa: { baseRate: 20, perKg: 7, deliveryDays: '2-4' },
  dhl: { baseRate: 45, perKg: 15, deliveryDays: '1-2' },
  fedex: { baseRate: 40, perKg: 12, deliveryDays: '1-2' },
  saudi_post: { baseRate: 15, perKg: 5, deliveryDays: '3-7' },
};
```

### Translation Structure Addition

```json
// messages/ar.json - additions
{
  "tools": {
    "netProfitCalculator": {
      "title": "حاسبة الربح الحقيقي بعد المرتجعات",
      "description": "احسب ربحك الفعلي بعد خصم تكاليف المرتجعات",
      "revenue": "إجمالي الإيرادات",
      "productCost": "تكلفة المنتجات",
      "returnRate": "نسبة المرتجعات (%)",
      "processingCost": "تكلفة معالجة المرتجع",
      "netProfit": "صافي الربح",
      "effectiveMargin": "هامش الربح الفعلي",
      "returnLosses": "خسائر المرتجعات",
      "highReturnWarning": "تحذير: نسبة المرتجعات مرتفعة جداً!",
      "seo": {
        "whatIs": "ما هي حاسبة الربح الحقيقي بعد المرتجعات؟",
        "whatIsContent": "حاسبة الربح الحقيقي بعد المرتجعات هي أداة أساسية لكل تاجر إلكتروني...",
        "formula": "كيف يتم الحساب؟",
        "formulaContent": "المعادلة: صافي الربح = الإيرادات × (1 - نسبة المرتجعات) - تكلفة المنتجات - (الإيرادات × نسبة المرتجعات × تكلفة المعالجة)",
        "whyNeed": "لماذا يحتاجها التاجر؟",
        "whyNeedContent": "المرتجعات هي التكلفة الخفية التي يتجاهلها معظم التجار..."
      }
    },
    // ... other tools
  },
  "share": {
    "copyResult": "نسخ النتيجة",
    "downloadImage": "تحميل كصورة",
    "copied": "تم النسخ!",
    "downloaded": "تم التحميل!",
    "calculatedOn": "تم الحساب في",
    "poweredBy": "بواسطة أدوات التجارة"
  }
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*


### Property 1: Net Profit Calculation Mathematical Correctness

*For any* valid inputs where revenue > 0, productCost > 0, returnRate ∈ [0, 100], and processingCost >= 0:
- netProfit = revenue × (1 - returnRate/100) - productCost - (revenue × returnRate/100 × processingCost)
- effectiveMargin = (netProfit / (revenue × (1 - returnRate/100))) × 100

**Validates: Requirements 2.5, 2.6, 2.7, 2.8**

### Property 2: Input Validation Rejects Invalid Values

*For any* calculator input that is:
- Not a number (NaN, strings, undefined)
- Negative (where positive is required)
- Outside valid range (e.g., percentage > 100)

The calculator SHALL reject the input and not perform calculations.

**Validates: Requirements 2.10, 3.10, 4.11, 5.11, 6.11, 7.11, 8.9, 9.12, 10.12, 11.11**

### Property 3: Payment Gateway Fee Calculation Correctness

*For any* valid transaction amount and provider/method combination:
- fee = amount × (rate.percentage / 100) + rate.fixed
- netAmount = amount - fee
- feePercentage = (fee / amount) × 100

**Validates: Requirements 3.4, 3.5, 3.6, 3.7**

### Property 4: Payment Gateway Comparison Completeness

*For any* valid transaction amount, the comparison table SHALL include all providers (Tab, Paytabs, Moyasar, HyperPay) with their respective fees calculated correctly.

**Validates: Requirements 3.8**

### Property 5: Import Duty Calculation Correctness

*For any* valid FOB, shipping, insurance, country, and category:
- cifValue = fobValue + shippingCost + insuranceCost
- customsDuty = cifValue × (dutyRate / 100)
- vatAmount = (cifValue + customsDuty) × (vatRate / 100)
- totalLandedCost = cifValue + customsDuty + vatAmount

**Validates: Requirements 4.6, 4.7, 4.8, 4.9**

### Property 6: PayPal Fee Calculation Correctness

*For any* valid amount, currencies, and transaction type:
- paypalFee = (amount × percentageFee / 100) + fixedFee
- conversionFee = (senderCurrency ≠ receiverCurrency) ? amount × 0.04 : 0
- totalFees = paypalFee + conversionFee
- netAmount = amount - totalFees

**Validates: Requirements 5.5, 5.6, 5.7, 5.8, 5.9**

### Property 7: Ad Break-Even Calculation Correctness

*For any* valid sellingPrice, productCost, adSpend, and conversionRate where sellingPrice > productCost:
- profitPerSale = sellingPrice - productCost
- breakEvenSales = adSpend / profitPerSale
- requiredTraffic = breakEvenSales / (conversionRate / 100)
- maxCPC = profitPerSale × (conversionRate / 100)

**Validates: Requirements 6.5, 6.6, 6.7, 6.8**

### Property 8: Shipping Weight Calculation Correctness

*For any* valid weight and dimensions:
- volumetricWeight = (length × width × height) / 5000
- chargeableWeight = max(actualWeight, volumetricWeight)

**Validates: Requirements 7.5, 7.6**

### Property 9: Saudi VAT Round-Trip Correctness

*For any* valid amount:
- addVAT(amount) = amount × 1.15
- extractVAT(amountWithVAT) = amountWithVAT / 1.15
- extractVAT(addVAT(amount)) ≈ amount (within floating point tolerance)

**Validates: Requirements 8.3, 8.4, 8.5, 8.6, 8.7**

### Property 10: FBA Storage Calculation Correctness

*For any* valid dimensions, units, and duration:
- cubicFeet = (length × width × height) / 1728 × units
- monthlyFee = cubicFeet × ratePerCubicFoot
- agedSurcharge = (duration > 6) ? cubicFeet × agedRate : 0
- longTermFee = (duration > 12) ? cubicFeet × longTermRate : 0

**Validates: Requirements 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11**

### Property 11: Fair Pricing Calculation Correctness

*For any* valid productCost, shippingCost, and fee percentages where totalFees < 100%:
- sellingPrice = (productCost + shippingCost) / (1 - desiredMargin/100 - gatewayFee/100 - platformFee/100)
- profitPerSale = sellingPrice × (desiredMargin / 100)

**Validates: Requirements 10.6, 10.7, 10.8**

### Property 12: ROI Calculation Correctness

*For any* valid investment, revenue, timePeriod, and ongoingCosts:
- netProfit = expectedRevenue - initialInvestment - ongoingCosts
- roiPercentage = (netProfit / initialInvestment) × 100
- annualizedROI = roiPercentage × (12 / timePeriod)
- paybackPeriod = initialInvestment / (netProfit / timePeriod)

**Validates: Requirements 11.5, 11.6, 11.7, 11.8**

### Property 13: High Return Rate Warning

*For any* return rate > 50%, the Net_Profit_Calculator SHALL display a warning indicator.

**Validates: Requirements 2.9**

### Property 14: Negative Profit Error Handling

*For any* Ad_BreakEven_Calculator input where sellingPrice <= productCost, the calculator SHALL display an error and not calculate break-even metrics.

**Validates: Requirements 6.10**

### Property 15: Invalid Fee Percentage Error Handling

*For any* Fair_Pricing_Calculator input where (desiredMargin + gatewayFee + platformFee) >= 100, the calculator SHALL display an error.

**Validates: Requirements 10.10**

### Property 16: Negative ROI Warning

*For any* ROI_Calculator result where roiPercentage < 0, the calculator SHALL display a warning with the loss amount.

**Validates: Requirements 11.10**

## Error Handling

### Client-Side Errors
| Error Type | Handling |
|------------|----------|
| Invalid input (negative/NaN) | Display inline validation message, disable calculate |
| Fee percentage >= 100% | Display error message explaining the issue |
| Profit <= 0 for break-even | Display error that product is not profitable |
| Clipboard API not supported | Show fallback message, hide copy button |
| html2canvas failure | Show error toast, suggest screenshot |

### Validation Rules
- All monetary values: Must be positive numbers
- Percentages: Must be between 0 and 100 (or appropriate range)
- Dimensions: Must be positive numbers
- Duration: Must be positive integers

## Testing Strategy

### Unit Tests
- Calculator logic functions for each tool
- Input validation functions
- Fee rate lookups
- Format/display functions

### Property-Based Tests (using fast-check)
- **Property 1-12**: Generate random valid inputs, verify calculation formulas
- **Property 2**: Generate invalid inputs, verify rejection
- **Property 9**: Round-trip test for VAT add/extract
- **Property 13-16**: Generate edge case inputs, verify warnings/errors

### Integration Tests
- Share feature clipboard functionality
- Image generation with html2canvas
- Tool page rendering with SEO content

### Test Configuration
- Property tests: Minimum 100 iterations per property
- Each property test tagged with: `Feature: new-calculator-tools, Property N: [description]`

