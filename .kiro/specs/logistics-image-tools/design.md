# Design Document: أدوات اللوجستيات والصور

## Overview

هذا التصميم يغطي 14 أداة جديدة لموقع أدوات التجارة الإلكترونية، مقسمة إلى:
- **أدوات اللوجستيات والمقاسات** (7 أدوات): تحويلات وحسابات الشحن والمقاسات
- **أدوات الصور والبراند** (7 أدوات): معالجة الصور وتحسينها

جميع الأدوات تشترك في:
- واجهة مستخدم متسقة مع الأدوات الحالية
- دعم اللغتين العربية والإنجليزية
- محتوى SEO تعليمي (~300 كلمة)
- ميزات المشاركة والتصدير (نسخ/صورة/PDF/Excel)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Tool Pages  │  │ Components  │  │ Shared Components       │  │
│  │ [locale]/   │  │ /tools/     │  │ - SEOContent            │  │
│  │ tools/[slug]│  │ *-tool.tsx  │  │ - ShareButtons          │  │
│  └─────────────┘  └─────────────┘  │ - ExportButtons         │  │
│                                     │ - ResultCard            │  │
│                                     └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Calculator Logic                          ││
│  │  /lib/calculators/                                          ││
│  │  - logistics/ (size, volumetric, dimension, weight, etc.)   ││
│  │  - image/ (webp, compress, resize, color, watermark, etc.)  ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Export Services                           ││
│  │  /lib/export/                                                ││
│  │  - pdf-generator.ts (jsPDF)                                 ││
│  │  - excel-generator.ts (xlsx)                                ││
│  │  - image-generator.ts (html2canvas)                         ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Image Processing (Client-Side)               ││
│  │  - Canvas API for basic operations                          ││
│  │  - Web Workers for heavy processing                         ││
│  │  - Browser-image-compression library                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
micro-tools/src/
├── components/tools/
│   ├── logistics/
│   │   ├── size-converter.tsx
│   │   ├── volumetric-calculator.tsx
│   │   ├── dimension-converter.tsx
│   │   ├── last-mile-calculator.tsx
│   │   ├── weight-converter.tsx
│   │   ├── lead-time-tracker.tsx
│   │   └── cbm-calculator.tsx
│   ├── image/
│   │   ├── webp-converter.tsx
│   │   ├── image-compressor.tsx
│   │   ├── social-resizer.tsx
│   │   ├── color-extractor.tsx
│   │   ├── watermark-creator.tsx
│   │   ├── favicon-generator.tsx
│   │   └── bulk-image-tool.tsx
│   └── shared/
│       ├── seo-content.tsx (existing)
│       ├── share-buttons.tsx (existing)
│       ├── result-card.tsx (existing)
│       └── export-buttons.tsx (new)
├── lib/
│   ├── calculators/
│   │   ├── logistics/
│   │   │   ├── size-conversion.ts
│   │   │   ├── volumetric-weight.ts
│   │   │   ├── dimension-conversion.ts
│   │   │   ├── last-mile-cost.ts
│   │   │   ├── weight-conversion.ts
│   │   │   ├── lead-time.ts
│   │   │   └── cbm-calculation.ts
│   │   └── image/
│   │       ├── webp-conversion.ts
│   │       ├── image-compression.ts
│   │       ├── social-resize.ts
│   │       ├── color-extraction.ts
│   │       ├── watermark.ts
│   │       ├── favicon-generation.ts
│   │       └── image-transform.ts
│   └── export/
│       ├── pdf-generator.ts
│       ├── excel-generator.ts
│       └── image-generator.ts
└── messages/
    ├── ar.json (add new tool translations)
    └── en.json (add new tool translations)
```

## Components and Interfaces

### Shared Export Component

```typescript
// components/tools/shared/export-buttons.tsx
interface ExportButtonsProps {
  data: ExportData;
  filename: string;
  title: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportImage?: () => void;
  onCopyText?: () => void;
}

interface ExportData {
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  metadata?: {
    toolName: string;
    date: string;
    locale: string;
  };
}
```

### Tool Category Types

```typescript
// types/tools.ts
export type ToolCategory = "financial" | "logistics" | "images" | "text" | "conversion";

// Update existing categories array
export const categories = [
  { key: "financial", labelKey: "categories.financial" },
  { key: "logistics", labelKey: "categories.logistics" },
  { key: "images", labelKey: "categories.images" },
  { key: "text", labelKey: "categories.text" },
  { key: "conversion", labelKey: "categories.conversion" },
];
```


## Data Models

### Logistics Tools Data Models

```typescript
// lib/calculators/logistics/types.ts

// Size Conversion
interface SizeConversionInput {
  category: 'men-clothing' | 'women-clothing' | 'kids-clothing' | 'shoes';
  sourceSystem: 'CN' | 'US' | 'EU' | 'UK';
  size: string;
  measurements?: {
    chest?: number;
    waist?: number;
    hip?: number;
    footLength?: number;
  };
}

interface SizeConversionResult {
  CN: string;
  US: string;
  EU: string;
  UK: string;
  recommendedSize?: string;
  measurementRange?: {
    chest: [number, number];
    waist: [number, number];
    hip: [number, number];
  };
}

// Volumetric Weight
interface VolumetricWeightInput {
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  unit: 'cm' | 'inch';
  weightUnit: 'kg' | 'lb';
}

interface VolumetricWeightResult {
  volumetricWeight: number;
  actualWeight: number;
  chargeableWeight: number;
  isVolumetricHigher: boolean;
  carrierComparison: {
    carrier: string;
    divisor: number;
    volumetricWeight: number;
    chargeableWeight: number;
  }[];
}

// Dimension Conversion
interface DimensionConversionInput {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'inch';
}

interface DimensionConversionResult {
  cm: { length: number; width: number; height: number; volume: number };
  inch: { length: number; width: number; height: number; volume: number };
  recommendedBoxSize?: string;
}

// Last Mile Cost
interface LastMileCostInput {
  weight: number;
  length: number;
  width: number;
  height: number;
  region: 'city' | 'suburban' | 'remote';
  provider?: string;
}

interface LastMileCostResult {
  chargeableWeight: number;
  providerComparison: {
    provider: string;
    baseFee: number;
    weightFee: number;
    zoneSurcharge: number;
    totalCost: number;
    deliveryTime: string;
  }[];
  cheapest: string;
  fastest: string;
  warnings?: string[];
}

// Weight Conversion
interface WeightConversionInput {
  value: number;
  unit: 'g' | 'oz' | 'lb' | 'kg';
}

interface WeightConversionResult {
  grams: number;
  ounces: number;
  pounds: number;
  kilograms: number;
  shippingCategory: 'light' | 'medium' | 'heavy';
  reference?: string;
}

// Lead Time
interface LeadTimeInput {
  supplierLocation: string;
  processingDays: number;
  shippingMethod: 'air' | 'sea' | 'express';
  destinationCountry: string;
  orderDate?: Date;
}

interface LeadTimeResult {
  totalDays: number;
  breakdown: {
    processing: number;
    shipping: number;
    customs: number;
    lastMile: number;
  };
  estimatedDelivery: Date;
  peakSeasonWarning?: string;
}

// CBM Calculator
interface CBMInput {
  containerType: '20ft' | '40ft' | '40ft-hc';
  cartons: {
    length: number;
    width: number;
    height: number;
    quantity: number;
  }[];
}

interface CBMResult {
  containerCapacity: number;
  totalCBM: number;
  utilizationPercentage: number;
  remainingCBM: number;
  cartonsPerContainer: number;
  overflow: boolean;
  suggestion?: string;
}
```

### Image Tools Data Models

```typescript
// lib/calculators/image/types.ts

// WebP Conversion
interface WebPConversionInput {
  file: File;
  quality: 'low' | 'medium' | 'high' | 'lossless';
  preserveMetadata: boolean;
}

interface WebPConversionResult {
  originalSize: number;
  convertedSize: number;
  savingsPercentage: number;
  convertedBlob: Blob;
  dimensions: { width: number; height: number };
}

// Image Compression
interface ImageCompressionInput {
  file: File;
  targetSize?: number; // in KB
  quality?: number; // 0-100
}

interface ImageCompressionResult {
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  compressedBlob: Blob;
  qualityWarning?: boolean;
}

// Social Media Resize
interface SocialResizeInput {
  file: File;
  platforms: ('instagram-feed' | 'instagram-story' | 'instagram-landscape' | 
              'snapchat-snap' | 'snapchat-story' | 
              'twitter-post' | 'twitter-header')[];
  cropPosition: 'center' | 'top' | 'bottom' | 'custom';
  customPosition?: { x: number; y: number };
}

interface SocialResizeResult {
  resizedImages: {
    platform: string;
    dimensions: { width: number; height: number };
    blob: Blob;
  }[];
}

// Color Extraction
interface ColorExtractionInput {
  file: File;
  colorCount: number; // 5-10
}

interface ColorExtractionResult {
  colors: {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
    percentage: number;
  }[];
  complementary: string[];
  analogous: string[];
}

// Watermark
interface WatermarkInput {
  file: File;
  watermark: File | string; // File for logo, string for text
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'tiled';
  opacity: number; // 0-100
  size: number; // percentage of image
  rotation: number; // degrees
  fontSettings?: {
    family: string;
    size: number;
    color: string;
  };
}

interface WatermarkResult {
  watermarkedBlob: Blob;
  positionWarning?: boolean;
}

// Favicon Generation
interface FaviconInput {
  file: File;
}

interface FaviconResult {
  favicons: {
    size: number;
    blob: Blob;
    format: 'ico' | 'png';
  }[];
  appleTouchIcon: Blob;
  htmlSnippet: string;
}

// Bulk Image Transform
interface BulkTransformInput {
  files: File[];
  operation: 'flip-horizontal' | 'flip-vertical' | 'rotate-90' | 'rotate-180' | 'rotate-270' | 'rotate-custom';
  customAngle?: number;
}

interface BulkTransformResult {
  transformedImages: {
    originalName: string;
    blob: Blob;
  }[];
  processedCount: number;
}
```

### Export Data Models

```typescript
// lib/export/types.ts

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  logo?: string;
  data: {
    section: string;
    items: { label: string; value: string }[];
  }[];
  footer?: string;
  locale: 'ar' | 'en';
}

interface ExcelExportOptions {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  locale: 'ar' | 'en';
}

interface ImageExportOptions {
  elementId: string;
  filename: string;
  format: 'png' | 'jpeg';
  quality?: number;
  includeBranding: boolean;
}
```


## Calculation Logic

### Logistics Calculations

#### Size Conversion Tables

```typescript
// lib/calculators/logistics/size-conversion.ts

const SIZE_CHARTS = {
  'men-clothing': {
    CN: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    US: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    EU: ['44', '46', '48', '50', '52', '54'],
    UK: ['34', '36', '38', '40', '42', '44'],
    measurements: {
      chest: [[86, 91], [91, 96], [96, 101], [101, 106], [106, 111], [111, 116]],
      waist: [[71, 76], [76, 81], [81, 86], [86, 91], [91, 96], [96, 101]],
    }
  },
  'women-clothing': {
    CN: ['S', 'M', 'L', 'XL', 'XXL'],
    US: ['2-4', '6-8', '10-12', '14-16', '18-20'],
    EU: ['34-36', '38-40', '42-44', '46-48', '50-52'],
    UK: ['6-8', '10-12', '14-16', '18-20', '22-24'],
    measurements: {
      bust: [[80, 84], [84, 88], [88, 92], [92, 96], [96, 100]],
      waist: [[60, 64], [64, 68], [68, 72], [72, 76], [76, 80]],
      hip: [[86, 90], [90, 94], [94, 98], [98, 102], [102, 106]],
    }
  },
  'shoes': {
    CN: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    US_men: ['4', '4.5', '5', '5.5', '6', '7', '8', '9', '10', '11', '12'],
    US_women: ['5', '5.5', '6', '6.5', '7', '8', '9', '10', '11', '12', '13'],
    EU: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    UK: ['2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11'],
    footLength: [22.5, 23, 23.5, 24, 24.5, 25.5, 26, 27, 27.5, 28.5, 29.5],
  }
};

export function convertSize(input: SizeConversionInput): SizeConversionResult {
  const chart = SIZE_CHARTS[input.category];
  const sourceIndex = chart[input.sourceSystem].indexOf(input.size);
  
  return {
    CN: chart.CN[sourceIndex],
    US: chart.US[sourceIndex],
    EU: chart.EU[sourceIndex],
    UK: chart.UK[sourceIndex],
  };
}

export function recommendSizeByMeasurement(
  category: string, 
  measurements: Record<string, number>
): string {
  // Find size where measurements fall within range
  const chart = SIZE_CHARTS[category];
  // Implementation logic...
}
```

#### Volumetric Weight Calculation

```typescript
// lib/calculators/logistics/volumetric-weight.ts

const CARRIER_DIVISORS = {
  'DHL': 5000,
  'FedEx': 5000,
  'UPS': 5000,
  'Aramex': 6000,
  'SMSA': 5000,
  'Saudi Post': 6000,
};

export function calculateVolumetricWeight(input: VolumetricWeightInput): VolumetricWeightResult {
  // Convert to cm if needed
  const l = input.unit === 'inch' ? input.length * 2.54 : input.length;
  const w = input.unit === 'inch' ? input.width * 2.54 : input.width;
  const h = input.unit === 'inch' ? input.height * 2.54 : input.height;
  
  // Convert weight to kg if needed
  const actualWeight = input.weightUnit === 'lb' ? input.actualWeight * 0.453592 : input.actualWeight;
  
  const carrierComparison = Object.entries(CARRIER_DIVISORS).map(([carrier, divisor]) => {
    const volumetricWeight = (l * w * h) / divisor;
    return {
      carrier,
      divisor,
      volumetricWeight: Math.round(volumetricWeight * 100) / 100,
      chargeableWeight: Math.max(volumetricWeight, actualWeight),
    };
  });
  
  const standardVolumetric = (l * w * h) / 5000;
  
  return {
    volumetricWeight: Math.round(standardVolumetric * 100) / 100,
    actualWeight,
    chargeableWeight: Math.max(standardVolumetric, actualWeight),
    isVolumetricHigher: standardVolumetric > actualWeight,
    carrierComparison,
  };
}
```

#### CBM Calculation

```typescript
// lib/calculators/logistics/cbm-calculation.ts

const CONTAINER_SPECS = {
  '20ft': { length: 5.9, width: 2.35, height: 2.39, capacity: 33 },
  '40ft': { length: 12.03, width: 2.35, height: 2.39, capacity: 67 },
  '40ft-hc': { length: 12.03, width: 2.35, height: 2.69, capacity: 76 },
};

export function calculateCBM(input: CBMInput): CBMResult {
  const container = CONTAINER_SPECS[input.containerType];
  
  // Calculate total CBM of cartons
  const totalCBM = input.cartons.reduce((sum, carton) => {
    const cbm = (carton.length * carton.width * carton.height) / 1000000; // cm to m³
    return sum + (cbm * carton.quantity);
  }, 0);
  
  const utilizationPercentage = (totalCBM / container.capacity) * 100;
  const remainingCBM = container.capacity - totalCBM;
  const overflow = totalCBM > container.capacity;
  
  let suggestion: string | undefined;
  if (overflow) {
    if (input.containerType === '20ft') {
      suggestion = 'Consider upgrading to 40ft container or splitting into 2 shipments';
    } else if (input.containerType === '40ft') {
      suggestion = 'Consider upgrading to 40ft HC or splitting into 2 shipments';
    } else {
      suggestion = 'Consider splitting into multiple containers';
    }
  }
  
  return {
    containerCapacity: container.capacity,
    totalCBM: Math.round(totalCBM * 100) / 100,
    utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
    remainingCBM: Math.round(remainingCBM * 100) / 100,
    cartonsPerContainer: input.cartons.reduce((sum, c) => sum + c.quantity, 0),
    overflow,
    suggestion,
  };
}
```

### Image Processing Logic

#### WebP Conversion (Client-Side)

```typescript
// lib/calculators/image/webp-conversion.ts

const QUALITY_SETTINGS = {
  low: 0.6,
  medium: 0.8,
  high: 0.92,
  lossless: 1.0,
};

export async function convertToWebP(input: WebPConversionInput): Promise<WebPConversionResult> {
  const quality = QUALITY_SETTINGS[input.quality];
  
  // Create canvas and draw image
  const img = await createImageBitmap(input.file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  // Convert to WebP
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/webp', quality);
  });
  
  return {
    originalSize: input.file.size,
    convertedSize: blob.size,
    savingsPercentage: Math.round((1 - blob.size / input.file.size) * 100),
    convertedBlob: blob,
    dimensions: { width: img.width, height: img.height },
  };
}
```

#### Color Extraction

```typescript
// lib/calculators/image/color-extraction.ts

export async function extractColors(input: ColorExtractionInput): Promise<ColorExtractionResult> {
  const img = await createImageBitmap(input.file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Scale down for performance
  const scale = Math.min(1, 100 / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // Color quantization using median cut algorithm
  const colors = quantizeColors(pixels, input.colorCount);
  
  // Calculate percentages
  const totalPixels = canvas.width * canvas.height;
  const colorResults = colors.map(color => ({
    hex: rgbToHex(color.r, color.g, color.b),
    rgb: { r: color.r, g: color.g, b: color.b },
    hsl: rgbToHsl(color.r, color.g, color.b),
    percentage: Math.round((color.count / totalPixels) * 100),
  }));
  
  // Generate complementary and analogous colors
  const dominantHsl = colorResults[0].hsl;
  const complementary = [hslToHex((dominantHsl.h + 180) % 360, dominantHsl.s, dominantHsl.l)];
  const analogous = [
    hslToHex((dominantHsl.h + 30) % 360, dominantHsl.s, dominantHsl.l),
    hslToHex((dominantHsl.h - 30 + 360) % 360, dominantHsl.s, dominantHsl.l),
  ];
  
  return { colors: colorResults, complementary, analogous };
}
```

#### Social Media Resize Presets

```typescript
// lib/calculators/image/social-resize.ts

const PLATFORM_SIZES = {
  'instagram-feed': { width: 1080, height: 1080 },
  'instagram-story': { width: 1080, height: 1920 },
  'instagram-landscape': { width: 1080, height: 566 },
  'snapchat-snap': { width: 1080, height: 1920 },
  'snapchat-story': { width: 1080, height: 1920 },
  'twitter-post': { width: 1200, height: 675 },
  'twitter-header': { width: 1500, height: 500 },
};

export async function resizeForSocialMedia(input: SocialResizeInput): Promise<SocialResizeResult> {
  const img = await createImageBitmap(input.file);
  const results: SocialResizeResult['resizedImages'] = [];
  
  for (const platform of input.platforms) {
    const targetSize = PLATFORM_SIZES[platform];
    const canvas = document.createElement('canvas');
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    
    const ctx = canvas.getContext('2d')!;
    
    // Calculate crop area based on position
    const { sx, sy, sw, sh } = calculateCropArea(
      img.width, img.height,
      targetSize.width, targetSize.height,
      input.cropPosition,
      input.customPosition
    );
    
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetSize.width, targetSize.height);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
    });
    
    results.push({
      platform,
      dimensions: targetSize,
      blob,
    });
  }
  
  return { resizedImages: results };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unit Conversion Round-Trip

*For any* valid dimension or weight value, converting from one unit system to another and back should return the original value (within floating-point tolerance of 0.01).

**Validates: Requirements 2.3, 3.1, 3.2, 5.1, 5.2**

```typescript
// Example: cm → inch → cm should equal original
const original = 100; // cm
const inInches = original / 2.54;
const backToCm = inInches * 2.54;
assert(Math.abs(original - backToCm) < 0.01);
```

### Property 2: Volumetric Weight Formula Correctness

*For any* valid package dimensions (L, W, H > 0), the volumetric weight should equal (L × W × H) / divisor, and the chargeable weight should be the maximum of volumetric and actual weight.

**Validates: Requirements 2.1, 2.2, 2.5**

```typescript
// chargeableWeight = max(volumetricWeight, actualWeight)
assert(result.chargeableWeight === Math.max(result.volumetricWeight, result.actualWeight));
```

### Property 3: CBM Calculation Invariant

*For any* set of cartons, the total CBM should equal the sum of individual carton CBMs, and utilization percentage should be (totalCBM / containerCapacity) × 100.

**Validates: Requirements 7.2, 7.4**

```typescript
// totalCBM = sum of (L × W × H / 1000000) × quantity for each carton
// utilizationPercentage = (totalCBM / containerCapacity) × 100
assert(result.utilizationPercentage === (result.totalCBM / result.containerCapacity) * 100);
```

### Property 4: Lead Time Sum Property

*For any* lead time calculation, the total days should equal the sum of all breakdown components (processing + shipping + customs + lastMile).

**Validates: Requirements 6.1, 6.4**

```typescript
const breakdown = result.breakdown;
const sum = breakdown.processing + breakdown.shipping + breakdown.customs + breakdown.lastMile;
assert(result.totalDays === sum);
```

### Property 5: Size Conversion Bidirectionality

*For any* valid size in any system, converting to another system and back should return the original size or an equivalent size.

**Validates: Requirements 1.2, 1.4**

```typescript
// CN → US → CN should return original or equivalent
const cnSize = 'L';
const usSize = convertSize({ sourceSystem: 'CN', size: cnSize }).US;
const backToCn = convertSize({ sourceSystem: 'US', size: usSize }).CN;
assert(cnSize === backToCn);
```

### Property 6: Image Dimension Preservation

*For any* image processing operation that doesn't explicitly resize (WebP conversion, compression without resize), the output dimensions should match the input dimensions.

**Validates: Requirements 8.6, 14.5**

```typescript
// WebP conversion should preserve dimensions
assert(result.dimensions.width === originalImage.width);
assert(result.dimensions.height === originalImage.height);
```

### Property 7: Image Compression Size Reduction

*For any* image compression with quality < 100%, the output file size should be less than or equal to the input file size.

**Validates: Requirements 8.3, 9.2**

```typescript
// Compressed size should be <= original size
assert(result.compressedSize <= result.originalSize);
// If target size specified, output should be at or below target
if (input.targetSize) {
  assert(result.compressedSize <= input.targetSize * 1024);
}
```

### Property 8: Social Media Resize Dimensions

*For any* social media resize operation, the output image dimensions should exactly match the platform's specified dimensions.

**Validates: Requirements 10.2, 10.3, 10.4**

```typescript
// Output dimensions must match platform specs exactly
const platformSpecs = PLATFORM_SIZES[platform];
assert(result.dimensions.width === platformSpecs.width);
assert(result.dimensions.height === platformSpecs.height);
```

### Property 9: Color Extraction Count and Percentage

*For any* color extraction, the number of colors returned should be between 5 and 10, and the sum of percentages should be approximately 100% (within 5% tolerance due to rounding).

**Validates: Requirements 11.1, 11.3**

```typescript
assert(result.colors.length >= 5 && result.colors.length <= 10);
const totalPercentage = result.colors.reduce((sum, c) => sum + c.percentage, 0);
assert(Math.abs(totalPercentage - 100) <= 5);
```

### Property 10: Favicon Multi-Size Generation

*For any* favicon generation, all required sizes (16, 32, 48, 64, 128, 256, 180 for Apple) should be generated with correct dimensions.

**Validates: Requirements 13.1, 13.3, 13.5**

```typescript
const requiredSizes = [16, 32, 48, 64, 128, 256];
for (const size of requiredSizes) {
  const favicon = result.favicons.find(f => f.size === size);
  assert(favicon !== undefined);
}
assert(result.appleTouchIcon !== undefined); // 180x180
```

### Property 11: Batch Processing Completeness

*For any* batch operation (conversion, compression, watermarking, transform), the number of output items should equal the number of input items.

**Validates: Requirements 3.5, 8.4, 9.4, 10.6, 12.5, 14.4**

```typescript
assert(result.processedImages.length === input.files.length);
```

### Property 12: Image Rotation Dimension Swap

*For any* 90° or 270° rotation, the output width should equal the input height and vice versa. For 180° rotation, dimensions should remain unchanged.

**Validates: Requirements 14.1, 14.2**

```typescript
if (rotation === 90 || rotation === 270) {
  assert(output.width === input.height);
  assert(output.height === input.width);
} else if (rotation === 180) {
  assert(output.width === input.width);
  assert(output.height === input.height);
}
```

### Property 13: Last Mile Cost Breakdown Sum

*For any* last mile cost calculation, the total cost should equal the sum of base fee, weight fee, and zone surcharge.

**Validates: Requirements 4.2, 4.4**

```typescript
for (const provider of result.providerComparison) {
  const sum = provider.baseFee + provider.weightFee + provider.zoneSurcharge;
  assert(Math.abs(provider.totalCost - sum) < 0.01);
}
```

### Property 14: Weight Category Assignment

*For any* weight conversion, the shipping category should be correctly assigned based on weight thresholds (light: <500g, medium: 500g-2kg, heavy: >2kg).

**Validates: Requirements 5.5**

```typescript
if (result.grams < 500) {
  assert(result.shippingCategory === 'light');
} else if (result.grams <= 2000) {
  assert(result.shippingCategory === 'medium');
} else {
  assert(result.shippingCategory === 'heavy');
}
```


## Error Handling

### Input Validation Errors

```typescript
// Common validation errors for all tools
interface ValidationError {
  field: string;
  message: string;
  code: 'REQUIRED' | 'INVALID_TYPE' | 'OUT_OF_RANGE' | 'INVALID_FORMAT';
}

// Logistics tools validation
function validateDimensions(l: number, w: number, h: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (l <= 0) errors.push({ field: 'length', message: 'Length must be positive', code: 'OUT_OF_RANGE' });
  if (w <= 0) errors.push({ field: 'width', message: 'Width must be positive', code: 'OUT_OF_RANGE' });
  if (h <= 0) errors.push({ field: 'height', message: 'Height must be positive', code: 'OUT_OF_RANGE' });
  return errors;
}

// Image tools validation
function validateImageFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    errors.push({ field: 'file', message: 'Invalid image format', code: 'INVALID_FORMAT' });
  }
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push({ field: 'file', message: 'File too large (max 50MB)', code: 'OUT_OF_RANGE' });
  }
  
  return errors;
}
```

### Processing Errors

```typescript
// Image processing errors
class ImageProcessingError extends Error {
  constructor(
    message: string,
    public code: 'CANVAS_ERROR' | 'MEMORY_ERROR' | 'FORMAT_ERROR' | 'TIMEOUT'
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Handle large images with Web Workers
async function processLargeImage(file: File, operation: Function): Promise<Blob> {
  if (file.size > 10 * 1024 * 1024) { // > 10MB
    // Use Web Worker to prevent UI blocking
    return processInWorker(file, operation);
  }
  return operation(file);
}
```

### Export Errors

```typescript
// PDF/Excel generation errors
class ExportError extends Error {
  constructor(
    message: string,
    public format: 'PDF' | 'EXCEL' | 'IMAGE',
    public cause?: Error
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

// Graceful fallback for export failures
async function exportWithFallback(
  data: ExportData,
  format: 'PDF' | 'EXCEL'
): Promise<Blob | string> {
  try {
    if (format === 'PDF') {
      return await generatePDF(data);
    } else {
      return await generateExcel(data);
    }
  } catch (error) {
    // Fallback to text/CSV
    console.error(`${format} export failed, falling back to text`, error);
    return generateTextFallback(data);
  }
}
```

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Individual calculation functions with specific inputs
- Edge cases (zero values, maximum values, empty inputs)
- Error handling and validation
- Format conversions (HEX/RGB/HSL)

### Property-Based Tests

Using `fast-check` library for property-based testing:

```typescript
import fc from 'fast-check';

// Property test for unit conversion round-trip
describe('Unit Conversion Properties', () => {
  it('cm to inch round-trip preserves value', () => {
    fc.assert(
      fc.property(fc.float({ min: 0.1, max: 10000 }), (cm) => {
        const inch = cm / 2.54;
        const backToCm = inch * 2.54;
        return Math.abs(cm - backToCm) < 0.01;
      }),
      { numRuns: 100 }
    );
  });
  
  // Feature: logistics-image-tools, Property 1: Unit Conversion Round-Trip
  // Validates: Requirements 2.3, 3.1, 3.2, 5.1, 5.2
});

// Property test for volumetric weight
describe('Volumetric Weight Properties', () => {
  it('chargeable weight is max of volumetric and actual', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 200 }), // length
        fc.float({ min: 1, max: 200 }), // width
        fc.float({ min: 1, max: 200 }), // height
        fc.float({ min: 0.1, max: 100 }), // actual weight
        (l, w, h, actualWeight) => {
          const result = calculateVolumetricWeight({
            length: l, width: w, height: h,
            actualWeight, unit: 'cm', weightUnit: 'kg'
          });
          return result.chargeableWeight === Math.max(result.volumetricWeight, actualWeight);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: logistics-image-tools, Property 2: Volumetric Weight Formula Correctness
  // Validates: Requirements 2.1, 2.2, 2.5
});
```

### Integration Tests

Integration tests will cover:
- Full tool workflows (input → calculation → display → export)
- Multi-step operations (batch processing)
- Export functionality (PDF, Excel, Image generation)

### Test Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.property.test.ts'],
    coverage: {
      include: ['src/lib/calculators/**', 'src/lib/export/**'],
      exclude: ['**/*.d.ts'],
    },
  },
});
```

## SEO Content Structure

Each tool will have SEO content following this structure:

```typescript
interface SEOContent {
  whatIs: {
    title: string; // "ما هي هذه الأداة؟"
    content: string; // ~100 words explaining the tool
  };
  formula: {
    title: string; // "كيف يتم الحساب؟"
    content: string; // ~100 words with formula and example
  };
  whyNeed: {
    title: string; // "لماذا يحتاجها التاجر؟"
    content: string; // ~100 words on business value
  };
}
```

### Example SEO Content (Volumetric Weight Calculator)

```json
{
  "seo": {
    "whatIs": "ما هي حاسبة الوزن الحجمي؟",
    "whatIsContent": "حاسبة الوزن الحجمي هي أداة أساسية لكل تاجر يشحن منتجات. شركات الشحن لا تحاسبك فقط على الوزن الفعلي للطرد، بل تأخذ بعين الاعتبار المساحة التي يشغلها في الطائرة أو الشاحنة. الوزن الحجمي (Dimensional Weight) هو طريقة لحساب 'وزن' الطرد بناءً على حجمه، وليس ثقله الفعلي. شركات الشحن تحاسبك على الأعلى بين الوزن الفعلي والوزن الحجمي، وهذا ما يسمى 'الوزن المحاسب' (Chargeable Weight).",
    "formula": "كيف يتم حساب الوزن الحجمي؟",
    "formulaContent": "المعادلة المستخدمة: الوزن الحجمي = (الطول × العرض × الارتفاع) ÷ 5000 (بالسنتيمتر والكيلوجرام). على سبيل المثال، طرد بأبعاد 40×30×20 سم: الوزن الحجمي = (40×30×20) ÷ 5000 = 24000 ÷ 5000 = 4.8 كجم. إذا كان الوزن الفعلي للطرد 2 كجم فقط، ستدفع على أساس 4.8 كجم! بعض الشركات مثل أرامكس تستخدم قاسم 6000 بدلاً من 5000، مما يعطي وزناً حجمياً أقل.",
    "whyNeed": "لماذا يحتاجها التاجر؟",
    "whyNeedContent": "فهم الوزن الحجمي يساعدك على: تقدير تكاليف الشحن بدقة قبل تسعير منتجاتك، اختيار التغليف المناسب لتقليل الوزن الحجمي، مقارنة شركات الشحن بناءً على القاسم المستخدم، تجنب المفاجآت عند استلام فاتورة الشحن. المنتجات الخفيفة كبيرة الحجم (مثل الوسائد والألعاب) غالباً ما يكون وزنها الحجمي أعلى بكثير من وزنها الفعلي."
  }
}
```

## Export Implementation

### PDF Generator (English Only)

```typescript
// lib/export/pdf-generator.ts
// Using jsPDF for English-only PDF generation

import jsPDF from 'jspdf';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  data: { section: string; items: { label: string; value: string }[] }[];
  footer?: string;
}

export async function generatePDF(options: PDFExportOptions): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  
  // Header
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Micro Tools - micro-tools.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(new Date().toLocaleDateString('en-US'), pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(options.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(options.subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  }
  
  // Sections
  for (const section of options.data) {
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text(section.section, 20, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    for (const item of section.items) {
      doc.setTextColor(100);
      doc.text(item.label + ':', 25, yPos);
      doc.setTextColor(0);
      doc.text(item.value, 100, yPos);
      yPos += 7;
      
      // Check for page break
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    }
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Micro Tools | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc.output('blob');
}
```

**Note**: Using `jsPDF` for English-only PDF generation:
1. Lightweight and fast
2. No font embedding required for English
3. Simple API for basic document generation
```

### Excel Generator

```typescript
// lib/export/excel-generator.ts
import * as XLSX from 'xlsx';

export function generateExcel(options: ExcelExportOptions): Blob {
  const wb = XLSX.utils.book_new();
  
  // Create worksheet data
  const wsData = [options.headers, ...options.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set RTL for Arabic
  if (options.locale === 'ar') {
    ws['!dir'] = 'rtl';
  }
  
  // Auto-size columns
  const colWidths = options.headers.map((h, i) => ({
    wch: Math.max(h.length, ...options.rows.map(r => String(r[i]).length)) + 2
  }));
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName);
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
```

### Image Generator

```typescript
// lib/export/image-generator.ts
import html2canvas from 'html2canvas';

export async function generateImage(options: ImageExportOptions): Promise<Blob> {
  const element = document.getElementById(options.elementId);
  if (!element) throw new Error('Element not found');
  
  // Add branding if needed
  if (options.includeBranding) {
    const branding = document.createElement('div');
    branding.className = 'export-branding';
    branding.innerHTML = `
      <div style="text-align: center; padding: 10px; background: #f5f5f5; border-top: 1px solid #ddd;">
        <span>أدوات التجارة - micro-tools.com</span>
      </div>
    `;
    element.appendChild(branding);
  }
  
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  
  // Remove branding element after capture
  if (options.includeBranding) {
    element.querySelector('.export-branding')?.remove();
  }
  
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      `image/${options.format}`,
      options.quality || 0.92
    );
  });
}
```
