import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://micro-tools.com'
  const locales = ['ar', 'en']
  const now = new Date()

  const entries: MetadataRoute.Sitemap = []

  // Homepage for each locale
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    })
  }

  // All tools for each locale
  for (const locale of locales) {
    for (const tool of tools) {
      entries.push({
        url: `${baseUrl}/${locale}/tools/${tool.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  }

  return entries
}
