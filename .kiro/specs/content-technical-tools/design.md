# Design Document: Content & Technical Tools

## Overview

هذا المستند يصف التصميم التقني لمجموعة أدوات المحتوى والنصوص والأدوات التقنية في تطبيق Micro-Tools. يتبع التصميم نمط الفصل بين منطق الأعمال (في `src/lib/calculators/`) ومكونات واجهة المستخدم (في `src/components/tools/`).

كل أداة تتضمن:
- منطق أعمال نقي قابل للاختبار
- مكون React مع دعم RTL
- محتوى SEO (ما هي الأداة، كيف تعمل، لماذا يحتاجها التاجر)
- أزرار مشاركة ونسخ

## Architecture

```
micro-tools/src/
├── lib/calculators/
│   ├── case-converter.ts          # Case conversion logic
│   ├── duplicate-remover.ts       # Duplicate line removal logic
│   ├── business-name-generator.ts # Name generation logic
│   ├── color-converter.ts         # Color code conversion logic
│   ├── password-generator.ts      # Password generation logic
│   ├── response-checker.ts        # Website response checking logic
│   ├── html-entity-codec.ts       # HTML encoding/decoding logic
│   ├── robots-validator.ts        # Robots.txt validation logic
│   └── sitemap-generator.ts       # XML sitemap generation logic
│
├── components/tools/
│   ├── case-converter.tsx
│   ├── duplicate-remover.tsx
│   ├── business-name-generator.tsx
│   ├── color-converter.tsx
│   ├── password-generator.tsx
│   ├── response-checker.tsx
│   ├── html-entity-codec.tsx
│   ├── robots-validator.tsx
│   └── sitemap-generator.tsx
│
└── messages/
    ├── en.json  # English translations + SEO content
    └── ar.json  # Arabic translations + SEO content
```

## Components and Interfaces

### 1. Case Converter (محول الحروف)

```typescript
// src/lib/calculators/case-converter.ts

export type CaseType = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'togglecase';

export interface CaseConvertInput {
  text: string;
  caseType: CaseType;
}

export interface CaseConvertResult {
  convertedText: string;
  originalLength: number;
  convertedLength: number;
}

// Pure functions
export function toUpperCase(text: string): string;
export function toLowerCase(text: string): string;
export function toTitleCase(text: string): string;
export function toSentenceCase(text: string): string;
export function toToggleCase(text: string): string;
export function convertCase(input: CaseConvertInput): CaseConvertResult;
```

### 2. Duplicate Line Remover (إزالة السطور المكررة)

```typescript
// src/lib/calculators/duplicate-remover.ts

export interface DuplicateRemoverInput {
  text: string;
  caseSensitive: boolean;
  trimWhitespace: boolean;
}

export interface DuplicateRemoverResult {
  cleanedText: string;
  originalLineCount: number;
  uniqueLineCount: number;
  duplicatesRemoved: number;
}

export function removeDuplicateLines(input: DuplicateRemoverInput): DuplicateRemoverResult;
```

### 3. Business Name Generator (مولد أسماء المتاجر)

```typescript
// src/lib/calculators/business-name-generator.ts

export type BusinessCategory = 'retail' | 'food' | 'fashion' | 'technology' | 'services' | 'general';

export interface NameGeneratorInput {
  keywords: string[];
  category: BusinessCategory;
  language: 'ar' | 'en';
}

export interface GeneratedName {
  name: string;
  pattern: string; // e.g., "prefix + keyword", "keyword + suffix"
}

export interface NameGeneratorResult {
  names: GeneratedName[];
  keyword: string;
  category: BusinessCategory;
}

export function generateBusinessNames(input: NameGeneratorInput): NameGeneratorResult;
```

### 4. Color Code Converter (محول أكواد الألوان)

```typescript
// src/lib/calculators/color-converter.ts

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface ColorConvertResult {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  isValid: boolean;
  error?: string;
}

export function hexToRgb(hex: string): RGB | null;
export function rgbToHex(rgb: RGB): string;
export function rgbToHsl(rgb: RGB): HSL;
export function hslToRgb(hsl: HSL): RGB;
export function parseColor(input: string): ColorConvertResult;
export function normalizeHex(hex: string): string; // Handle 3-digit and # prefix
```

### 5. Password Generator (مولد كلمات المرور)

```typescript
// src/lib/calculators/password-generator.ts

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

export interface PasswordResult {
  password: string;
  strength: PasswordStrength;
  strengthScore: number; // 0-100
  isValid: boolean;
  error?: string;
}

export function generatePassword(options: PasswordOptions): PasswordResult;
export function calculateStrength(password: string): { strength: PasswordStrength; score: number };
```

### 6. Website Response Checker (فاحص استجابة الموقع)

```typescript
// src/lib/calculators/response-checker.ts

export interface ResponseCheckInput {
  url: string;
  timeout?: number; // milliseconds, default 10000
}

export type ResponseStatus = 'fast' | 'moderate' | 'slow' | 'timeout' | 'error';

export interface ResponseCheckResult {
  url: string;
  responseTime: number; // milliseconds
  statusCode: number;
  status: ResponseStatus;
  isAccessible: boolean;
  error?: string;
}

export function normalizeUrl(url: string): string;
export function validateUrl(url: string): boolean;
export function checkResponse(input: ResponseCheckInput): Promise<ResponseCheckResult>;
```

### 7. HTML Entity Encoder/Decoder (مشفر/فاك تشفير HTML)

```typescript
// src/lib/calculators/html-entity-codec.ts

export type CodecMode = 'encode' | 'decode';

export interface HtmlCodecInput {
  text: string;
  mode: CodecMode;
}

export interface HtmlCodecResult {
  result: string;
  originalLength: number;
  resultLength: number;
  entitiesProcessed: number;
}

export function encodeHtmlEntities(text: string): string;
export function decodeHtmlEntities(text: string): string;
export function processHtml(input: HtmlCodecInput): HtmlCodecResult;
```

### 8. Robots.txt Validator (فاحص Robots.txt)

```typescript
// src/lib/calculators/robots-validator.ts

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  line: number;
  message: string;
  severity: ValidationSeverity;
  suggestion?: string;
}

export interface RobotsValidatorResult {
  isValid: boolean;
  issues: ValidationIssue[];
  userAgents: string[];
  sitemaps: string[];
  summary: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export function validateRobotsTxt(content: string): RobotsValidatorResult;
```

### 9. XML Sitemap Generator (مولد Sitemap)

```typescript
// src/lib/calculators/sitemap-generator.ts

export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export interface SitemapUrl {
  loc: string;
  priority?: number; // 0.0 - 1.0
  changefreq?: ChangeFrequency;
  lastmod?: string; // ISO date
}

export interface SitemapGeneratorInput {
  urls: SitemapUrl[];
  autoLastmod?: boolean;
}

export interface SitemapGeneratorResult {
  xml: string;
  urlCount: number;
  isValid: boolean;
  errors: { url: string; error: string }[];
}

export function validateUrl(url: string): boolean;
export function generateSitemap(input: SitemapGeneratorInput): SitemapGeneratorResult;
```

## Data Models

### Translation Structure (messages/*.json)

```json
{
  "tools": {
    "caseConverter": {
      "title": "Case Converter",
      "description": "Convert text between different cases",
      "uppercase": "UPPERCASE",
      "lowercase": "lowercase",
      "titlecase": "Title Case",
      "sentencecase": "Sentence case",
      "togglecase": "tOGGLE cASE",
      "enterText": "Enter your text",
      "convertedText": "Converted Text",
      "seo": {
        "whatIs": "What is Case Converter?",
        "whatIsContent": "...",
        "formula": "How does it work?",
        "formulaContent": "...",
        "whyNeed": "Why do merchants need it?",
        "whyNeedContent": "..."
      }
    }
    // ... similar structure for other tools
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Case Conversion Preserves Non-Alphabetic Characters

*For any* text string containing non-alphabetic characters (numbers, symbols, spaces, punctuation), when any case conversion is applied, all non-alphabetic characters SHALL remain unchanged in their original positions.

**Validates: Requirements 1.7**

### Property 2: Toggle Case Round-Trip

*For any* text string, applying toggle case conversion twice SHALL return the original text exactly.

**Validates: Requirements 1.5**

### Property 3: Uppercase/Lowercase Idempotence

*For any* text string, applying uppercase conversion twice SHALL produce the same result as applying it once. The same applies to lowercase conversion.

**Validates: Requirements 1.1, 1.2**

### Property 4: Duplicate Remover Count Invariant

*For any* text input, the sum of unique lines remaining plus duplicates removed SHALL equal the original line count.

**Validates: Requirements 2.4, 2.5**

### Property 5: Duplicate Remover Output Has No Duplicates

*For any* text input processed by the duplicate remover, the output SHALL contain no duplicate lines (according to the selected comparison mode).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 6: Business Name Generator Minimum Output

*For any* valid keyword and category input, the business name generator SHALL produce at least 10 name suggestions.

**Validates: Requirements 3.3**

### Property 7: Color Conversion Round-Trip (HEX)

*For any* valid HEX color code, converting to RGB and back to HEX SHALL produce an equivalent color code.

**Validates: Requirements 4.1, 4.2**

### Property 8: Color Conversion Round-Trip (RGB-HSL)

*For any* valid RGB color, converting to HSL and back to RGB SHALL produce values within acceptable tolerance (±1 for each component due to rounding).

**Validates: Requirements 4.2, 4.3**

### Property 9: HEX Format Normalization

*For any* valid 3-digit HEX code, the expanded 6-digit form SHALL produce the same RGB values as the original.

**Validates: Requirements 4.6, 4.7**

### Property 10: Password Length Invariant

*For any* requested password length between 8 and 128, the generated password SHALL have exactly that length.

**Validates: Requirements 5.1, 5.2**

### Property 11: Password Character Type Inclusion

*For any* password generation request with specific character types enabled, the generated password SHALL contain at least one character of each enabled type.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6**

### Property 12: HTML Entity Round-Trip

*For any* text string, encoding to HTML entities and then decoding SHALL return the original text.

**Validates: Requirements 7.1, 7.2**

### Property 13: HTML Encoding Idempotence

*For any* text string, encoding HTML entities twice SHALL produce the same result as encoding once (already-encoded entities are preserved).

**Validates: Requirements 7.6**

### Property 14: Sitemap XML Validity

*For any* list of valid URLs, the generated sitemap SHALL be valid XML that can be parsed without errors.

**Validates: Requirements 9.1, 9.2**

### Property 15: Sitemap URL Limit

*For any* input with more than 100 URLs, the sitemap generator SHALL either reject the input or generate a valid sitemap with at most 100 URLs.

**Validates: Requirements 9.7**

### Property 16: Robots.txt Valid Content Passes

*For any* syntactically correct robots.txt content following the standard format, the validator SHALL report isValid as true with no errors.

**Validates: Requirements 8.1, 8.7**

## Error Handling

### Input Validation Errors

| Tool | Error Condition | Response |
|------|-----------------|----------|
| Case Converter | Empty input | Return empty string, no error |
| Duplicate Remover | Empty input | Return empty string, counts = 0 |
| Business Name Generator | Empty keywords | Return error message |
| Color Converter | Invalid color format | Return isValid: false with error message |
| Password Generator | No character types selected | Return isValid: false with error message |
| Password Generator | Length < 8 or > 128 | Return isValid: false with error message |
| Response Checker | Invalid URL format | Return error before making request |
| Response Checker | Timeout | Return status: 'timeout' |
| HTML Entity Codec | Empty input | Return empty string, no error |
| Robots Validator | Empty input | Return isValid: false with error |
| Sitemap Generator | Invalid URL in list | Include in errors array, skip URL |
| Sitemap Generator | > 100 URLs | Return error or truncate with warning |

### Network Errors (Response Checker)

- Connection refused: Return isAccessible: false with appropriate error
- DNS resolution failure: Return error message
- SSL certificate errors: Return error message
- Timeout: Return status: 'timeout' with responseTime = timeout value

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across randomly generated inputs

### Property-Based Testing Configuration

- **Library**: fast-check (already installed in project)
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: content-technical-tools, Property {number}: {property_text}`

### Test File Structure

```
src/lib/calculators/
├── case-converter.ts
├── case-converter.test.ts        # Unit tests + Property tests
├── duplicate-remover.ts
├── duplicate-remover.test.ts
├── business-name-generator.ts
├── business-name-generator.test.ts
├── color-converter.ts
├── color-converter.test.ts
├── password-generator.ts
├── password-generator.test.ts
├── html-entity-codec.ts
├── html-entity-codec.test.ts
├── robots-validator.ts
├── robots-validator.test.ts
├── sitemap-generator.ts
└── sitemap-generator.test.ts
```

### Unit Test Coverage

Each tool should have unit tests for:
- Normal operation with typical inputs
- Edge cases (empty input, single character, very long input)
- Error conditions (invalid input formats)
- Boundary values (min/max lengths, limits)

### Property Test Implementation

Each property test should:
1. Use fast-check's `fc.assert` and `fc.property`
2. Generate appropriate random inputs using fast-check arbitraries
3. Run minimum 100 iterations
4. Include descriptive test name referencing the property number
5. Handle edge cases through generator constraints

Example structure:
```typescript
import * as fc from 'fast-check';

describe('Case Converter Properties', () => {
  // Feature: content-technical-tools, Property 2: Toggle Case Round-Trip
  it('Property 2: applying toggle case twice returns original text', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const toggled = toToggleCase(text);
        const toggledTwice = toToggleCase(toggled);
        return toggledTwice === text;
      }),
      { numRuns: 100 }
    );
  });
});
```
