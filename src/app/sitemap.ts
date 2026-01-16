import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'
import { routing } from '@/i18n/routing'
import { getArticlesForSitemap } from '@/lib/blog/article-service'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  
  // Blog listing page
  for (const locale of routing.locales) {
    entries.push({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: generateAlternates('/blog') },
    })
  }
  
  // Blog article pages
  // Fetch all published articles for sitemap
  // Requirements: 5.6 - Add articles to sitemap automatically
  try {
    const articles = await getArticlesForSitemap()
    
    for (const article of articles) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${baseUrl}/${locale}/blog/${article.slug}`,
          lastModified: article.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages: generateAlternates(`/blog/${article.slug}`) },
        })
      }
    }
  } catch (error) {
    // Log error but don't fail sitemap generation
    console.error('Failed to fetch blog articles for sitemap:', error)
  }
  
  return entries
}
