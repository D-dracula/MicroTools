/**
 * Constants for blog search functionality
 */

import type { ArticleCategory } from './types';

/** Domains to exclude from Exa search */
export const EXCLUDED_DOMAINS = [
  'pinterest.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'tiktok.com',
  'youtube.com',
  'reddit.com',
];

/** Dynamic search queries based on current date */
export function getDynamicQueries(category?: ArticleCategory): string[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('en', { month: 'long' });
  
  const baseQueries: Record<ArticleCategory | 'default', string[]> = {
    marketing: [
      `ecommerce marketing strategies ${currentYear}`,
      `social media marketing online stores`,
      `digital marketing ecommerce trends`,
      `influencer marketing brands`,
      `email marketing automation retail`,
    ],
    'seller-tools': [
      `ecommerce seller tools ${currentYear}`,
      `Amazon seller software`,
      `ecommerce analytics tools`,
      `inventory management software`,
      `AI tools online sellers`,
    ],
    logistics: [
      `ecommerce shipping solutions ${currentYear}`,
      `fulfillment strategies retail`,
      `dropshipping logistics`,
      `last mile delivery innovations`,
      `supply chain ecommerce`,
    ],
    trends: [
      `ecommerce trends ${currentMonth} ${currentYear}`,
      `future online retail`,
      `emerging ecommerce technologies`,
      `AI ecommerce developments`,
      `social commerce trends`,
    ],
    'case-studies': [
      `ecommerce success stories ${currentYear}`,
      `online business growth`,
      `Amazon seller success`,
      `Shopify store success`,
      `D2C brand growth`,
    ],
    default: [
      `ecommerce news ${currentYear}`,
      `online selling tips`,
      `marketplace trends`,
      `ecommerce business growth`,
      `digital commerce innovations`,
    ],
  };

  return category ? baseQueries[category] : baseQueries.default;
}

/** Fallback results when external APIs are unavailable */
export function getFallbackResults() {
  const currentYear = new Date().getFullYear();
  
  return [
    {
      title: `E-commerce Trends ${currentYear}: AI-Powered Personalization Takes Center Stage`,
      url: 'https://example.com/ecommerce-trends',
      publishedDate: new Date().toISOString(),
      score: 0.95,
      text: `The e-commerce landscape is rapidly evolving with AI-powered personalization becoming the cornerstone of successful online retail strategies. Merchants are leveraging machine learning algorithms to create hyper-personalized shopping experiences that significantly boost conversion rates. From dynamic pricing to personalized product recommendations, AI is transforming how sellers connect with customers. Studies show that personalized experiences can increase sales by up to 20% and improve customer satisfaction scores dramatically.`,
      source: 'fallback' as const,
    },
    {
      title: 'Social Commerce Revolution: Selling on TikTok, Instagram, and Beyond',
      url: 'https://example.com/social-commerce',
      publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.88,
      text: `Social commerce is reshaping how consumers discover and purchase products. Platforms like TikTok Shop, Instagram Shopping, and Pinterest are becoming primary sales channels for many brands. The integration of entertainment and shopping creates unique opportunities for sellers who can create engaging content. Live shopping events and influencer partnerships are driving significant sales growth.`,
      source: 'fallback' as const,
    },
    {
      title: 'Dropshipping Success Strategies: Building a Profitable Online Store',
      url: 'https://example.com/dropshipping-strategies',
      publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 0.82,
      text: `Dropshipping continues to be a viable business model for entrepreneurs looking to enter e-commerce with minimal upfront investment. However, success requires strategic planning and execution. Top performers focus on niche selection, supplier relationships, and brand building. The key differentiators include fast shipping times and excellent customer service.`,
      source: 'fallback' as const,
    },
  ];
}
