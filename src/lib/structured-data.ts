import { routing } from '@/i18n/routing'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'

/**
 * Helper function to convert locale code to language name
 * Supports 13+ languages for future expansion
 */
function getLanguageName(locale: string): string {
  const languageMap: Record<string, string> = {
    'ar': 'Arabic',
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'pl': 'Polish',
    'id': 'Indonesian',
    'ms': 'Malay',
    'th': 'Thai',
    'vi': 'Vietnamese',
  }
  return languageMap[locale] || locale.toUpperCase()
}

/**
 * Helper function to get locale code for inLanguage field
 */
function getLocaleCode(locale: string): string {
  const localeMap: Record<string, string> = {
    'ar': 'ar-SA',
    'en': 'en-US',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'hi': 'hi-IN',
    'tr': 'tr-TR',
  }
  return localeMap[locale] || `${locale}-${locale.toUpperCase()}`
}

interface ToolStructuredDataParams {
  slug: string
  name: string
  description: string
  category: string
  locale: string
}

// Generate JSON-LD structured data for tools (Requirements 4.1, 4.2, 4.3, 4.5, 5.5)
export function generateToolStructuredData(params: ToolStructuredDataParams) {
  const { slug, name, description, category, locale } = params
  
  // Generate sameAs links for all locales from routing.ts (Requirement 4.5)
  const sameAs = routing.locales
    .filter(l => l !== locale)
    .map(l => `${baseUrl}/${l}/tools/${slug}`)
  
  // Set inLanguage based on current locale (Requirement 4.3)
  const inLanguage = getLocaleCode(locale)
  
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
      availability: 'https://schema.org/InStock'
    },
    provider: {
      '@type': 'Organization',
      name: locale === 'ar' ? 'باين كالك' : 'PineCalc',
      url: baseUrl
    },
    inLanguage,
    sameAs,
  }
}

// Generate JSON-LD for website
export function generateWebsiteStructuredData(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'ar' ? 'باين كالك' : 'PineCalc',
    description: locale === 'ar' 
      ? 'أدوات مجانية لأصحاب المتاجر الإلكترونية - حاسبات الأرباح والتكاليف'
      : 'Free business tools for e-commerce store owners - profit calculators and cost analysis',
    url: `${baseUrl}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/${locale}/tools?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: locale === 'ar' ? 'باين كالك' : 'PineCalc',
      url: baseUrl
    },
    inLanguage: getLocaleCode(locale)
  }
}

/**
 * Generate Organization Schema - Scalable for future languages
 * Reads available languages from routing.ts automatically
 * Social links and contact info are optional (read from env)
 */
export function generateOrganizationStructuredData(locale: string) {
  // Read available languages from routing.ts (auto-scales when adding new languages)
  const availableLanguages = routing.locales.map(getLanguageName)
  
  // Read social links from environment variables (optional)
  const socialLinks = [
    process.env.NEXT_PUBLIC_TWITTER_URL,
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    process.env.NEXT_PUBLIC_LINKEDIN_URL,
    process.env.NEXT_PUBLIC_YOUTUBE_URL,
    process.env.NEXT_PUBLIC_TIKTOK_URL,
  ].filter(Boolean) as string[]
  
  // Read contact email from environment (optional)
  const contactEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
  
  // Build the Organization schema
  const organizationSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: locale === 'ar' ? 'باين كالك' : 'PineCalc',
    alternateName: ['PineCalc', 'باين كالك', 'Pine Calc', 'Pinecalc'],
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.svg`,
      width: '512',
      height: '512'
    },
    description: locale === 'ar' 
      ? 'أدوات مجانية لأصحاب المتاجر الإلكترونية - حاسبات الأرباح والتكاليف والتسويق'
      : 'Free business tools for e-commerce store owners - profit calculators, cost analysis, and marketing tools',
    
    // Founding information
    foundingDate: '2024',
    
    // Area served - worldwide
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide'
    },
    
    // Service type
    knowsAbout: [
      'E-commerce',
      'Profit Calculation',
      'Business Tools',
      'Marketing Tools',
      'Cost Analysis',
      locale === 'ar' ? 'التجارة الإلكترونية' : 'Online Business',
      locale === 'ar' ? 'حاسبات الأرباح' : 'Profit Calculators',
    ],
  }
  
  // Add social links if available
  if (socialLinks.length > 0) {
    organizationSchema.sameAs = socialLinks
  }
  
  // Add contact point if email is available
  if (contactEmail) {
    organizationSchema.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: contactEmail,
      availableLanguage: availableLanguages,
    }
  } else {
    // Even without email, include available languages
    organizationSchema.availableLanguage = availableLanguages
  }
  
  return organizationSchema
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
  locale: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}
