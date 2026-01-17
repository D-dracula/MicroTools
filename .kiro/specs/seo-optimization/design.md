# Design Document: SEO Optimization

## Overview

This design implements a comprehensive, scalable SEO system for Micro-Tools that automatically handles multi-language support. The key principle is **"configuration over code"** - adding new languages requires only configuration changes (routing.ts + translation files), not code modifications.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SEO System                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  routing.ts  │───▶│  sitemap.ts  │───▶│ sitemap.xml  │       │
│  │  (locales)   │    │  (dynamic)   │    │ (output)     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                                        │
│         │            ┌──────────────┐    ┌──────────────┐       │
│         └───────────▶│ metadata.ts  │───▶│ <head> tags  │       │
│         │            │  (dynamic)   │    │ (output)     │       │
│         │            └──────────────┘    └──────────────┘       │
│         │                   ▲                                    │
│         │                   │                                    │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │ messages/    │───▶│ structured-  │───▶ JSON-LD               │
│  │ *.json       │    │ data.ts      │                           │
│  └──────────────┘    └──────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Dynamic Sitemap Generator

**File:** `src/app/sitemap.ts`

```typescript
import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'
import { routing } from '@/i18n/routing'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'

// Helper to generate alternates for all locales
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {
    'x-default': `${baseUrl}/${routing.defaultLocale}${path}`,
  }
  
  for (const locale of routing.locales) {
    alternates[locale] = `${baseUrl}/${locale}${path}`
  }
  
  return alternates
}

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date()
  const entries: MetadataRoute.Sitemap = []
  
  // Root page
  entries.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1,
    alternates: { languages: generateAlternates('') },
  })
  
  // Base pages for each locale
  const basePages = ['', '/about', '/contact', '/privacy', '/terms']
  for (const page of basePages) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: currentDate,
        changeFrequency: page === '' ? 'daily' : 'monthly',
        priority: page === '' ? 1 : 0.7,
        alternates: { languages: generateAlternates(page) },
      })
    }
  }
  
  // Tools listing page
  for (const locale of routing.locales) {
    entries.push({
      url: `${baseUrl}/${locale}/tools`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: { languages: generateAlternates('/tools') },
    })
  }
  
  // Tool pages
  for (const tool of tools) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}/tools/${tool.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: generateAlternates(`/tools/${tool.slug}`) },
      })
    }
  }
  
  return entries
}
```

### 2. Dynamic Metadata Generator

**File:** `src/lib/metadata.ts`

```typescript
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'

// Generate alternates for all locales
function generateLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {}
  for (const locale of routing.locales) {
    alternates[locale] = `/${locale}${path}`
  }
  return alternates
}

// Generate tool metadata dynamically from translations
export async function generateToolMetadata(
  locale: string,
  toolSlug: string,
  toolKey: string
): Promise<Metadata> {
  const t = await getTranslations({ locale })
  
  // Try SEO-specific keys first, fall back to regular keys
  const title = t.has(`tools.${toolKey}.seo.title`)
    ? t(`tools.${toolKey}.seo.title`)
    : `${t(`tools.${toolKey}.title`)} - ${t('common.siteName')}`
  
  const description = t.has(`tools.${toolKey}.seo.description`)
    ? t(`tools.${toolKey}.seo.description`)
    : t(`tools.${toolKey}.description`)
  
  const keywords = t.has(`tools.${toolKey}.seo.keywords`)
    ? t(`tools.${toolKey}.seo.keywords`).split(',').map(k => k.trim())
    : []
  
  const siteName = t('common.siteName')
  const path = `/tools/${toolSlug}`
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      siteName,
      title,
      description,
      url: `${baseUrl}/${locale}${path}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}${path}`,
      languages: generateLanguageAlternates(path),
    },
  }
}
```

### 3. Dynamic Structured Data Generator

**File:** `src/lib/structured-data.ts`

```typescript
import { routing } from '@/i18n/routing'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'

interface ToolStructuredDataParams {
  slug: string
  name: string
  description: string
  category: string
  locale: string
}

export function generateToolStructuredData(params: ToolStructuredDataParams) {
  const { slug, name, description, category, locale } = params
  
  // Generate alternate language URLs
  const sameAs = routing.locales
    .filter(l => l !== locale)
    .map(l => `${baseUrl}/${l}/tools/${slug}`)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${baseUrl}/${locale}/tools/${slug}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Organization',
      name: locale === 'ar' ? 'باين كالك' : 'PineCalc',
      url: baseUrl,
    },
    inLanguage: locale === 'ar' ? 'ar-SA' : 'en-US',
    sameAs,
  }
}
```

### 4. SEO Translation Structure

**File:** `messages/ar.json` (example structure)

```json
{
  "tools": {
    "profitMarginCalculator": {
      "title": "حاسبة هامش الربح",
      "description": "احسب هامش الربح ونسبة الربح بسهولة",
      "seo": {
        "title": "حاسبة هامش الربح المجانية - باين كالك",
        "description": "احسب هامش الربح ونسبة الزيادة بدقة. أداة مجانية تساعدك في تحديد الأسعار المناسبة وزيادة أرباحك.",
        "keywords": "حاسبة هامش الربح, حساب الربح, نسبة الزيادة, تسعير المنتجات"
      }
    }
  }
}
```

## Data Models

### SEO Translation Schema

```typescript
interface ToolSEOTranslation {
  title: string        // "{Tool Name} - {Site Name}" format
  description: string  // 150-160 characters, keyword-rich
  keywords: string     // Comma-separated keywords
}

interface ToolTranslation {
  title: string
  description: string
  seo?: ToolSEOTranslation  // Optional, falls back to title/description
}
```

### Sitemap Entry Schema

```typescript
interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
  alternates: {
    languages: Record<string, string>  // { 'ar': '...', 'en': '...', 'x-default': '...' }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sitemap Alternates Completeness

*For any* page entry in the sitemap and *for any* set of locales in routing.locales, the alternates object SHALL contain a URL for each locale plus an x-default entry.

**Validates: Requirements 1.1, 1.2, 1.3, 1.6**

### Property 2: Sitemap URL Format Consistency

*For any* tool with slug S and *for any* locale L, the sitemap URL SHALL match the format `${baseUrl}/${L}/tools/${S}`.

**Validates: Requirements 1.5**

### Property 3: Metadata Translation Fallback

*For any* tool key K and locale L, if `tools.${K}.seo.title` exists in translations, metadata title SHALL equal that value; otherwise, metadata title SHALL equal `${tools.${K}.title} - ${siteName}`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: Metadata Alternates Completeness

*For any* tool page metadata and *for any* set of locales in routing.locales, the alternates.languages object SHALL contain an entry for each locale.

**Validates: Requirements 2.5, 2.6**

### Property 5: SEO Translation Completeness

*For any* tool in the tools list and *for any* locale in routing.locales, the translation file SHALL contain either `tools.${toolKey}.seo.title` or `tools.${toolKey}.title`.

**Validates: Requirements 3.1, 3.2**

### Property 6: SEO Description Length

*For any* tool with an SEO description, the description length SHALL be between 100 and 200 characters.

**Validates: Requirements 3.3, 3.4**

### Property 7: Structured Data Locale Consistency

*For any* tool structured data generated for locale L, the `inLanguage` field SHALL match the locale's language code.

**Validates: Requirements 4.3**

### Property 8: Open Graph Localization

*For any* tool page in locale L, the og:locale meta tag SHALL match the locale, and og:locale:alternate tags SHALL exist for all other locales.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Missing Translation Keys

```typescript
// Fallback chain for metadata
const title = t.has(`tools.${toolKey}.seo.title`)
  ? t(`tools.${toolKey}.seo.title`)
  : t.has(`tools.${toolKey}.title`)
    ? `${t(`tools.${toolKey}.title`)} - ${siteName}`
    : `${toolSlug} | ${siteName}`  // Ultimate fallback
```

### Invalid Locale

```typescript
// In metadata generation
if (!routing.locales.includes(locale)) {
  locale = routing.defaultLocale
}
```

## Testing Strategy

### Unit Tests

1. **Sitemap Generation Tests**
   - Test that sitemap includes all tools
   - Test that alternates are generated for all locales
   - Test x-default points to default locale

2. **Metadata Generation Tests**
   - Test fallback behavior when SEO keys missing
   - Test canonical URL generation
   - Test alternates include all locales

3. **Structured Data Tests**
   - Test JSON-LD schema validity
   - Test inLanguage matches locale

### Property-Based Tests

Using `fast-check` library for property-based testing:

1. **Property 1 Test**: Generate random locale sets, verify alternates completeness
2. **Property 2 Test**: Generate random tool slugs, verify URL format
3. **Property 5 Test**: Iterate all tools, verify translation existence
4. **Property 6 Test**: Iterate all SEO descriptions, verify length bounds

### Integration Tests

1. **Sitemap XML Validation**
   - Fetch /sitemap.xml
   - Validate XML structure
   - Verify xhtml:link elements present

2. **Page Meta Tags Validation**
   - Render tool pages
   - Check hreflang meta tags
   - Verify Open Graph tags
