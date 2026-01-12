import type { Tool } from './tools'

// Generate JSON-LD structured data for tools
export function generateToolStructuredData(tool: Tool, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: getToolTitle(tool, locale),
    description: getToolDescription(tool, locale),
    url: `${baseUrl}/${locale}/tools/${tool.slug}`,
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
    featureList: getToolFeatures(tool, locale),
    category: getToolCategory(tool.category, locale),
    inLanguage: locale === 'ar' ? 'ar-SA' : 'en-US'
  }
}

// Generate JSON-LD for website
export function generateWebsiteStructuredData(locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'
  
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
    inLanguage: locale === 'ar' ? 'ar-SA' : 'en-US'
  }
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

// Helper functions
function getToolTitle(tool: Tool, locale: string): string {
  // This would ideally come from translation files
  const titles: Record<string, Record<string, string>> = {
    'profit-margin-calculator': {
      ar: 'حاسبة هامش الربح',
      en: 'Profit Margin Calculator'
    },
    'payment-gateway-calculator': {
      ar: 'حاسبة رسوم بوابات الدفع',
      en: 'Payment Gateway Calculator'
    },
    // Add more tools as needed
  }
  
  return titles[tool.slug]?.[locale] || tool.slug
}

function getToolDescription(tool: Tool, locale: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    'profit-margin-calculator': {
      ar: 'احسب هامش الربح ونسبة الزيادة بسهولة. أداة مجانية لأصحاب المتاجر الإلكترونية',
      en: 'Calculate profit margin and markup easily. Free tool for e-commerce store owners'
    },
    'payment-gateway-calculator': {
      ar: 'احسب رسوم بوابات الدفع المختلفة وقارن بينها لاختيار الأنسب لمتجرك',
      en: 'Calculate different payment gateway fees and compare them to choose the best for your store'
    },
    // Add more tools as needed
  }
  
  return descriptions[tool.slug]?.[locale] || `${tool.slug} tool`
}

function getToolFeatures(tool: Tool, locale: string): string[] {
  const features: Record<string, Record<string, string[]>> = {
    'profit-margin-calculator': {
      ar: ['حساب هامش الربح', 'حساب نسبة الزيادة', 'مقارنة الأسعار', 'حفظ الحسابات'],
      en: ['Calculate profit margin', 'Calculate markup', 'Price comparison', 'Save calculations']
    },
    'payment-gateway-calculator': {
      ar: ['مقارنة الرسوم', 'حساب التكلفة الإجمالية', 'دعم العملات المختلفة', 'تحليل الأرباح'],
      en: ['Compare fees', 'Calculate total cost', 'Multi-currency support', 'Profit analysis']
    },
    // Add more tools as needed
  }
  
  return features[tool.slug]?.[locale] || []
}

function getToolCategory(category: string, locale: string): string {
  const categories: Record<string, Record<string, string>> = {
    financial: { ar: 'أدوات مالية', en: 'Financial Tools' },
    logistics: { ar: 'أدوات لوجستية', en: 'Logistics Tools' },
    images: { ar: 'أدوات الصور', en: 'Image Tools' },
    marketing: { ar: 'أدوات التسويق', en: 'Marketing Tools' },
    content: { ar: 'أدوات المحتوى', en: 'Content Tools' },
    ai: { ar: 'أدوات الذكاء الاصطناعي', en: 'AI Tools' }
  }
  
  return categories[category]?.[locale] || category
}