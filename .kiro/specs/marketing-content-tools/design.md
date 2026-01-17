# Design Document: Marketing & Content Tools

## Overview

This design document outlines the architecture and implementation details for 14 new tools divided into two categories:
1. **Marketing & Links Tools** (7 tools) - For increasing sales and tracking campaigns
2. **Content & Policy Tools** (7 tools) - For legal text and content optimization

All tools follow the existing project patterns using Next.js 14 with App Router, TypeScript, React components with shadcn/ui, and next-intl for internationalization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
├─────────────────────────────────────────────────────────────────┤
│  /[locale]/tools/[slug]/page.tsx                                │
│  ├── tool-page-content.tsx (dynamic tool loader)                │
│  └── Individual Tool Components                                  │
├─────────────────────────────────────────────────────────────────┤
│                     Tool Components Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Marketing  │ │   Content   │ │   Shared    │               │
│  │   Tools     │ │    Tools    │ │ Components  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                          │
│  src/lib/calculators/                                           │
│  ├── whatsapp-link.ts                                           │
│  ├── utm-builder.ts                                             │
│  ├── qr-code.ts                                                 │
│  ├── link-shortener.ts                                          │
│  ├── contact-link.ts                                            │
│  ├── conversion-rate.ts                                         │
│  ├── ltv-calculator.ts                                          │
│  ├── policy-generator.ts                                        │
│  ├── terms-generator.ts                                         │
│  ├── description-cleaner.ts                                     │
│  ├── seo-validator.ts                                           │
│  ├── faq-generator.ts                                           │
│  ├── word-counter.ts                                            │
│  └── content-ideas.ts                                           │
├─────────────────────────────────────────────────────────────────┤
│                    Shared Utilities                              │
│  ├── QR Code Generation (qrcode library)                        │
│  ├── Clipboard API                                              │
│  └── Export Utilities (existing)                                │
└─────────────────────────────────────────────────────────────────┘
```

### New Tool Categories

The existing `ToolCategory` type will be extended:

```typescript
export type ToolCategory = "financial" | "logistics" | "images" | "text" | "conversion" | "marketing" | "content";
```

## Components and Interfaces

### 1. WhatsApp Link Generator

```typescript
// src/lib/calculators/whatsapp-link.ts

interface WhatsAppLinkInput {
  phoneNumber: string;      // International format without +
  countryCode: string;      // e.g., "966" for Saudi Arabia
  productName: string;
  price?: number;
  quantity?: number;
  customMessage?: string;
  language: 'ar' | 'en';
}

interface WhatsAppLinkResult {
  link: string;             // wa.me link
  message: string;          // Pre-filled message
  qrCodeDataUrl: string;    // Base64 QR code image
  isValid: boolean;
  error?: string;
}

function generateWhatsAppLink(input: WhatsAppLinkInput): WhatsAppLinkResult;
function validatePhoneNumber(phoneNumber: string, countryCode: string): boolean;
function formatWhatsAppMessage(input: WhatsAppLinkInput): string;
```

### 2. UTM Builder

```typescript
// src/lib/calculators/utm-builder.ts

interface UTMParams {
  url: string;
  source: string;           // utm_source (required)
  medium: string;           // utm_medium (required)
  campaign: string;         // utm_campaign (required)
  term?: string;            // utm_term (optional)
  content?: string;         // utm_content (optional)
}

interface UTMPreset {
  name: string;
  source: string;
  medium: string;
  description: string;
}

interface UTMResult {
  fullUrl: string;
  isValid: boolean;
  missingParams: string[];
  error?: string;
}

const UTM_PRESETS: Record<string, UTMPreset> = {
  tiktok_organic: { name: 'TikTok Organic', source: 'tiktok', medium: 'social', description: '...' },
  tiktok_paid: { name: 'TikTok Ads', source: 'tiktok', medium: 'cpc', description: '...' },
  snapchat_organic: { name: 'Snapchat Organic', source: 'snapchat', medium: 'social', description: '...' },
  snapchat_paid: { name: 'Snapchat Ads', source: 'snapchat', medium: 'cpc', description: '...' },
};

function buildUTMUrl(params: UTMParams): UTMResult;
function validateUrl(url: string): boolean;
function encodeUTMParams(params: UTMParams): string;
```

### 3. QR Code Generator

```typescript
// src/lib/calculators/qr-code.ts

interface QRCodeInput {
  content: string;          // URL or text to encode
  size?: number;            // Default 256
  foregroundColor?: string; // Default #000000
  backgroundColor?: string; // Default #FFFFFF
  logo?: string;            // Base64 image data
  logoSize?: number;        // Percentage of QR code (max 30%)
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default 'H' for logo support
}

interface QRCodeResult {
  dataUrl: string;          // Base64 PNG
  svgString: string;        // SVG markup
  isValid: boolean;
  logoWarning?: string;     // Warning if logo might affect scannability
}

function generateQRCode(input: QRCodeInput): Promise<QRCodeResult>;
function validateLogoSize(logoSize: number): { isValid: boolean; warning?: string };
```

### 4. Link Shortener

```typescript
// src/lib/calculators/link-shortener.ts

interface ShortenInput {
  originalUrl: string;
  customAlias?: string;
  influencerName?: string;
}

interface ShortenResult {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  isValid: boolean;
  error?: string;
}

function generateShortCode(): string;
function createShortLink(input: ShortenInput): ShortenResult;
function validateAlias(alias: string): { isValid: boolean; error?: string };
```

### 5. Contact Link Generator

```typescript
// src/lib/calculators/contact-link.ts

type ContactPlatform = 'whatsapp' | 'telegram' | 'email' | 'phone' | 'sms';

interface ContactLinkInput {
  platform: ContactPlatform;
  contact: string;          // Phone number, email, or username
  message?: string;         // Pre-filled message (where supported)
  subject?: string;         // Email subject
}

interface ContactLinkResult {
  link: string;
  platform: ContactPlatform;
  qrCodeDataUrl: string;
  isValid: boolean;
  error?: string;
}

const PLATFORM_FORMATS: Record<ContactPlatform, (input: ContactLinkInput) => string> = {
  whatsapp: (input) => `https://wa.me/${input.contact}?text=${encodeURIComponent(input.message || '')}`,
  telegram: (input) => `https://t.me/${input.contact}`,
  email: (input) => `mailto:${input.contact}?subject=${encodeURIComponent(input.subject || '')}&body=${encodeURIComponent(input.message || '')}`,
  phone: (input) => `tel:${input.contact}`,
  sms: (input) => `sms:${input.contact}?body=${encodeURIComponent(input.message || '')}`,
};

function generateContactLink(input: ContactLinkInput): ContactLinkResult;
function validateContact(platform: ContactPlatform, contact: string): boolean;
```

### 6. Conversion Rate Calculator

```typescript
// src/lib/calculators/conversion-rate.ts

interface ConversionRateInput {
  visitors: number;
  conversions: number;
  timePeriod?: 'day' | 'week' | 'month' | 'year';
}

interface ConversionRateResult {
  rate: number;             // Percentage
  isValid: boolean;
  benchmark: BenchmarkComparison;
  recommendations: string[];
  error?: string;
}

interface BenchmarkComparison {
  industry: string;
  averageRate: number;
  status: 'below' | 'average' | 'above' | 'excellent';
}

const ECOMMERCE_BENCHMARKS = {
  poor: 1,
  average: 2.5,
  good: 4,
  excellent: 6,
};

function calculateConversionRate(input: ConversionRateInput): ConversionRateResult;
function getRecommendations(rate: number): string[];
```

### 7. Customer Lifetime Value Calculator

```typescript
// src/lib/calculators/ltv-calculator.ts

interface LTVInput {
  averageOrderValue: number;
  purchaseFrequency: number;  // Per year
  customerLifespan: number;   // In years
  customerAcquisitionCost?: number;
}

interface LTVResult {
  ltv: number;
  ltvCacRatio?: number;
  isHealthy: boolean;
  recommendations: string[];
  warning?: string;
}

function calculateLTV(input: LTVInput): LTVResult;
function getLTVRecommendations(ltv: number, cac?: number): string[];
```

### 8. Refund Policy Generator

```typescript
// src/lib/calculators/policy-generator.ts

interface RefundPolicyInput {
  storeName: string;
  returnWindow: number;       // Days
  conditions: RefundCondition[];
  refundMethod: 'original' | 'store_credit' | 'both';
  productCategories?: string[];
  language: 'ar' | 'en';
}

type RefundCondition = 
  | 'unused'
  | 'original_packaging'
  | 'with_receipt'
  | 'no_sale_items'
  | 'no_personalized';

interface RefundPolicyResult {
  policy: string;           // Generated policy text
  sections: PolicySection[];
  isComplete: boolean;
}

interface PolicySection {
  title: string;
  content: string;
}

function generateRefundPolicy(input: RefundPolicyInput): RefundPolicyResult;
```

### 9. Terms of Service Generator

```typescript
// src/lib/calculators/terms-generator.ts

interface TermsInput {
  storeName: string;
  storeUrl: string;
  contactEmail: string;
  clauses: TermsClause[];
  customTerms?: string;
  language: 'ar' | 'en';
}

type TermsClause = 
  | 'payment'
  | 'delivery'
  | 'liability'
  | 'intellectual_property'
  | 'privacy'
  | 'disputes'
  | 'modifications';

interface TermsResult {
  document: string;
  sections: TermsSection[];
  isComplete: boolean;
}

function generateTermsOfService(input: TermsInput): TermsResult;
```

### 10. Description Cleaner

```typescript
// src/lib/calculators/description-cleaner.ts

interface CleanerInput {
  text: string;
  options: CleanerOptions;
}

interface CleanerOptions {
  removeEmojis: boolean;
  removeSpecialChars: boolean;
  removeExtraSpaces: boolean;
  removeUrls: boolean;
  preserveLineBreaks: boolean;
  preserveBulletPoints: boolean;
}

interface CleanerResult {
  cleanedText: string;
  originalLength: number;
  cleanedLength: number;
  removedItems: RemovedItem[];
}

interface RemovedItem {
  type: string;
  count: number;
}

function cleanDescription(input: CleanerInput): CleanerResult;
```

### 11. SEO Title Validator

```typescript
// src/lib/calculators/seo-validator.ts

interface SEOTitleInput {
  title: string;
  language: 'ar' | 'en';
}

interface SEOTitleResult {
  score: number;            // 0-100
  issues: SEOIssue[];
  suggestions: string[];
  lengthStatus: 'short' | 'optimal' | 'long';
  characterCount: number;
}

interface SEOIssue {
  type: 'length' | 'keyword_stuffing' | 'special_chars' | 'capitalization';
  severity: 'warning' | 'error';
  message: string;
}

function validateSEOTitle(input: SEOTitleInput): SEOTitleResult;
function detectKeywordStuffing(title: string): boolean;
function calculateSEOScore(issues: SEOIssue[]): number;
```

### 12. FAQ Generator

```typescript
// src/lib/calculators/faq-generator.ts

interface FAQInput {
  questions: FAQItem[];
  language: 'ar' | 'en';
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQResult {
  formattedText: string;
  schemaMarkup: string;     // JSON-LD
  isValidSchema: boolean;
}

function generateFAQ(input: FAQInput): FAQResult;
function generateFAQSchema(items: FAQItem[]): string;
function validateSchema(schema: string): boolean;
```

### 13. Word Counter

```typescript
// src/lib/calculators/word-counter.ts

interface WordCountInput {
  text: string;
  language: 'ar' | 'en';
}

interface WordCountResult {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  seoStatus: 'short' | 'optimal' | 'long';
  recommendations: string[];
}

function countWords(input: WordCountInput): WordCountResult;
function countArabicWords(text: string): number;
function calculateReadingTime(wordCount: number): number;
```

### 14. Content Idea Generator

```typescript
// src/lib/calculators/content-ideas.ts

type StoreCategory = 
  | 'fashion'
  | 'electronics'
  | 'beauty'
  | 'food'
  | 'home'
  | 'sports'
  | 'kids'
  | 'general';

type ContentType = 
  | 'product_announcement'
  | 'promotion'
  | 'seasonal'
  | 'engagement'
  | 'educational';

type Platform = 'instagram' | 'twitter' | 'tiktok' | 'snapchat' | 'general';

interface ContentIdea {
  title: string;
  template: string;
  type: ContentType;
  platform: Platform;
  tips: string[];
}

interface ContentIdeasResult {
  ideas: ContentIdea[];
  byType: Record<ContentType, ContentIdea[]>;
  byPlatform: Record<Platform, ContentIdea[]>;
}

function getContentIdeas(category: StoreCategory, language: 'ar' | 'en'): ContentIdeasResult;
```

## Data Models

### Tool Registration

```typescript
// Addition to src/lib/tools.ts

// New tools to add to the tools array
const newMarketingTools: Tool[] = [
  {
    slug: "whatsapp-link-generator",
    icon: MessageCircle,
    titleKey: "tools.whatsappLinkGenerator.title",
    descriptionKey: "tools.whatsappLinkGenerator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "utm-builder",
    icon: Link2,
    titleKey: "tools.utmBuilder.title",
    descriptionKey: "tools.utmBuilder.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "qr-code-generator",
    icon: QrCode,
    titleKey: "tools.qrCodeGenerator.title",
    descriptionKey: "tools.qrCodeGenerator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "link-shortener",
    icon: Scissors,
    titleKey: "tools.linkShortener.title",
    descriptionKey: "tools.linkShortener.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "contact-link-generator",
    icon: Phone,
    titleKey: "tools.contactLinkGenerator.title",
    descriptionKey: "tools.contactLinkGenerator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "conversion-rate-calculator",
    icon: TrendingUp,
    titleKey: "tools.conversionRateCalculator.title",
    descriptionKey: "tools.conversionRateCalculator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
  {
    slug: "ltv-calculator",
    icon: Users,
    titleKey: "tools.ltvCalculator.title",
    descriptionKey: "tools.ltvCalculator.description",
    category: "marketing",
    categoryKey: "categories.marketing",
  },
];

const newContentTools: Tool[] = [
  {
    slug: "refund-policy-generator",
    icon: FileText,
    titleKey: "tools.refundPolicyGenerator.title",
    descriptionKey: "tools.refundPolicyGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "terms-generator",
    icon: ScrollText,
    titleKey: "tools.termsGenerator.title",
    descriptionKey: "tools.termsGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "description-cleaner",
    icon: Eraser,
    titleKey: "tools.descriptionCleaner.title",
    descriptionKey: "tools.descriptionCleaner.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "seo-title-validator",
    icon: Search,
    titleKey: "tools.seoTitleValidator.title",
    descriptionKey: "tools.seoTitleValidator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "faq-generator",
    icon: HelpCircle,
    titleKey: "tools.faqGenerator.title",
    descriptionKey: "tools.faqGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "word-counter",
    icon: Type,
    titleKey: "tools.wordCounter.title",
    descriptionKey: "tools.wordCounter.description",
    category: "content",
    categoryKey: "categories.content",
  },
  {
    slug: "content-idea-generator",
    icon: Lightbulb,
    titleKey: "tools.contentIdeaGenerator.title",
    descriptionKey: "tools.contentIdeaGenerator.description",
    category: "content",
    categoryKey: "categories.content",
  },
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: WhatsApp Link Generation Validity

*For any* valid phone number (with country code) and product name, the WhatsApp link generator SHALL produce a link that:
- Starts with `https://wa.me/`
- Contains the properly formatted phone number
- Has a URL-encoded message containing the product name
- For invalid phone numbers, returns an error and no link

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: UTM URL Generation and Encoding

*For any* valid destination URL and UTM parameters (source, medium, campaign), the UTM builder SHALL produce a URL that:
- Preserves the original destination URL
- Appends properly formatted UTM parameters
- URL-encodes all parameter values (special characters are escaped)
- For invalid URLs, returns an error

**Validates: Requirements 2.1, 2.4, 2.6**

### Property 3: QR Code Round-Trip

*For any* input string (URL or text), generating a QR code and then decoding it SHALL return the original input string.

**Validates: Requirements 3.1**

### Property 4: Contact Link Platform Formats

*For any* supported platform (WhatsApp, Telegram, Email, Phone, SMS) and valid contact information, the contact link generator SHALL produce a link in the correct format for that platform, and invalid contact formats SHALL be rejected.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Conversion Rate Calculation

*For any* non-negative visitor count and conversion count where conversions ≤ visitors, the conversion rate SHALL equal (conversions / visitors) × 100. When conversions > visitors, an error SHALL be returned.

**Validates: Requirements 6.1, 6.4**

### Property 6: LTV Calculation and Warning

*For any* positive average order value, purchase frequency, and customer lifespan, LTV SHALL equal AOV × frequency × lifespan. When CAC is provided and LTV < CAC, a warning SHALL be displayed.

**Validates: Requirements 7.1, 7.2, 7.5**

### Property 7: Policy Document Completeness

*For any* set of policy options selected, the generated refund policy SHALL contain sections addressing all selected options, and the store name SHALL appear in the document.

**Validates: Requirements 8.1, 8.5**

### Property 8: Terms Document Generation

*For any* store information and selected clauses, the generated terms of service SHALL contain all selected clause sections and include the provided store information.

**Validates: Requirements 9.1, 9.5**

### Property 9: Description Cleaning Preservation

*For any* input text and cleaning options, the description cleaner SHALL:
- Remove only the elements specified in options
- Preserve elements not specified for removal
- When preserveLineBreaks is true, line breaks SHALL remain in output
- When preserveBulletPoints is true, bullet points SHALL remain in output

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 10: SEO Title Validation Consistency

*For any* product title, the SEO validator SHALL:
- Return lengthStatus='short' when length < 50 characters
- Return lengthStatus='optimal' when length is 50-60 characters
- Return lengthStatus='long' when length > 60 characters
- Detect keyword stuffing when any word appears more than 3 times
- Calculate a score between 0-100 based on issues found

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 11: FAQ Schema Validity

*For any* list of question-answer pairs, the FAQ generator SHALL produce:
- Formatted text containing all questions and answers
- Valid JSON-LD schema that parses without errors
- Schema containing all provided Q&A pairs

**Validates: Requirements 12.1, 12.2, 12.5**

### Property 12: Word Count Accuracy

*For any* input text, the word counter SHALL:
- Return accurate word count (for both Arabic and English)
- Return character count equal to text.length
- Return reading time approximately equal to wordCount / 200 minutes
- Arabic text word counting SHALL handle Arabic word boundaries correctly

**Validates: Requirements 13.1, 13.4, 13.5**

### Property 13: Content Ideas Categorization

*For any* store category, the content idea generator SHALL return ideas that are properly categorized by both content type and platform, with no idea appearing in an incorrect category.

**Validates: Requirements 14.1, 14.5**

## Error Handling

### Input Validation Errors

All tools SHALL validate inputs before processing:

```typescript
interface ValidationError {
  field: string;
  message: string;
  code: 'required' | 'invalid_format' | 'out_of_range' | 'invalid_value';
}

function validateInput<T>(input: T, schema: ValidationSchema): ValidationError[];
```

### Error Display Pattern

```typescript
// Consistent error display across all tools
interface ToolError {
  type: 'validation' | 'processing' | 'network';
  message: string;
  field?: string;
}

// UI component for error display
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>{error.message}</AlertDescription>
</Alert>
```

### Graceful Degradation

- QR code generation: If logo embedding fails, generate QR without logo and show warning
- Link shortener: If custom alias taken, suggest alternatives
- Policy generators: If optional fields missing, generate with defaults

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Input validation for all tools
- Edge cases (empty inputs, boundary values)
- Error conditions and error messages
- Localization (Arabic/English output)

### Property-Based Tests

Using `fast-check` library for property-based testing:

```typescript
import fc from 'fast-check';

// Example: WhatsApp Link Generation
describe('WhatsApp Link Generator Properties', () => {
  it('Property 1: generates valid WhatsApp links for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 9, maxLength: 15 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (phoneNumber, productName) => {
          const result = generateWhatsAppLink({
            phoneNumber,
            countryCode: '966',
            productName,
            language: 'en'
          });
          
          if (result.isValid) {
            expect(result.link).toMatch(/^https:\/\/wa\.me\/966\d+/);
            expect(result.link).toContain(encodeURIComponent(productName));
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with design document reference
- Format: `Feature: marketing-content-tools, Property {number}: {property_text}`

### Testing Libraries

- Jest for unit tests
- fast-check for property-based tests
- React Testing Library for component tests
