import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'
import { routing } from '@/i18n/routing'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://micro-tools.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date()
  
  // Base pages for each locale
  const basePages: MetadataRoute.Sitemap = [
    // Home pages
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar`,
          en: `${baseUrl}/en`,
        },
      },
    },
    // About pages
    {
      url: `${baseUrl}/ar/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/about`,
          en: `${baseUrl}/en/about`,
        },
      },
    },
    // Contact pages
    {
      url: `${baseUrl}/ar/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/contact`,
          en: `${baseUrl}/en/contact`,
        },
      },
    },
    // Privacy pages
    {
      url: `${baseUrl}/ar/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/privacy`,
          en: `${baseUrl}/en/privacy`,
        },
      },
    },
    // Terms pages
    {
      url: `${baseUrl}/ar/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/terms`,
          en: `${baseUrl}/en/terms`,
        },
      },
    },
  ]

  // Tool pages for each locale
  const toolPages: MetadataRoute.Sitemap = tools.flatMap((tool) => [
    {
      url: `${baseUrl}/ar/tools/${tool.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/tools/${tool.slug}`,
          en: `${baseUrl}/en/tools/${tool.slug}`,
        },
      },
    },
  ])

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = [
    'financial',
    'logistics', 
    'images',
    'text',
    'conversion',
    'marketing',
    'content',
    'ai'
  ].flatMap((category) => [
    {
      url: `${baseUrl}/ar/tools?category=${category}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/tools?category=${category}`,
          en: `${baseUrl}/en/tools?category=${category}`,
        },
      },
    },
  ])

  // Tools listing page
  const toolsListingPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/ar/tools`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/tools`,
          en: `${baseUrl}/en/tools`,
        },
      },
    },
  ]

  return [
    ...basePages,
    ...toolsListingPages,
    ...toolPages,
    ...categoryPages,
  ]
}