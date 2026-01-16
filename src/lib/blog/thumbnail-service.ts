/**
 * Thumbnail Service
 * 
 * Handles article thumbnail assignment and fallback generation.
 * Uses Unsplash for high-quality, professional images.
 * 
 * Requirements: 3.1, 3.2
 * - Assign relevant thumbnail images based on category
 * - Support placeholder thumbnails when AI generation is unavailable
 * - Generate gradient fallbacks for failed images
 */

import type { ArticleCategory } from './types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Unsplash image URLs for each category
 * High-quality, professional e-commerce related images
 * Using Unsplash Source API for reliable, fast loading
 */
export const CATEGORY_UNSPLASH_IMAGES: Record<ArticleCategory, string[]> = {
  'marketing': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80', // Marketing dashboard
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop&q=80', // Social media marketing
    'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=600&fit=crop&q=80', // Digital marketing
    'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop&q=80', // Marketing strategy
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80', // Analytics dashboard
  ],
  'seller-tools': [
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&q=80', // Tech workspace
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80', // Dashboard analytics
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop&q=80', // Data visualization
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&q=80', // Business tools
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop&q=80', // Software interface
  ],
  'logistics': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&q=80', // Warehouse
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=600&fit=crop&q=80', // Shipping boxes
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&h=600&fit=crop&q=80', // Delivery truck
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop&q=80', // Logistics center
    'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&h=600&fit=crop&q=80', // Package delivery
  ],
  'trends': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80', // Growth chart
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&q=80', // Stock market
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&q=80', // Business trends
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop&q=80', // Innovation
    'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&h=600&fit=crop&q=80', // Future tech
  ],
  'case-studies': [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80', // Team meeting
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&q=80', // Business presentation
    'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=600&fit=crop&q=80', // Success story
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop&q=80', // Business growth
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop&q=80', // Team success
  ],
};

/**
 * Category-based placeholder thumbnail paths (fallback)
 * These are SVG placeholders stored in public/images/blog/
 * 
 * Requirements: 3.2
 */
export const CATEGORY_THUMBNAILS: Record<ArticleCategory, string> = {
  'marketing': '/images/blog/marketing-placeholder.svg',
  'seller-tools': '/images/blog/tools-placeholder.svg',
  'logistics': '/images/blog/logistics-placeholder.svg',
  'trends': '/images/blog/trends-placeholder.svg',
  'case-studies': '/images/blog/case-studies-placeholder.svg',
};

/**
 * Gradient fallbacks for each category
 * Used when thumbnail images fail to load
 * 
 * Requirements: 3.4 (fallback gradient with category icon)
 */
export const CATEGORY_GRADIENTS: Record<ArticleCategory, string> = {
  'marketing': 'from-purple-500 to-pink-500',
  'seller-tools': 'from-cyan-500 to-blue-500',
  'logistics': 'from-emerald-500 to-teal-500',
  'trends': 'from-orange-500 to-red-500',
  'case-studies': 'from-indigo-500 to-purple-500',
};

/**
 * Category icons (Lucide icon names)
 * Used in gradient fallbacks
 */
export const CATEGORY_ICONS: Record<ArticleCategory, string> = {
  'marketing': 'megaphone',
  'seller-tools': 'wrench',
  'logistics': 'truck',
  'trends': 'trending-up',
  'case-studies': 'file-text',
};

/**
 * Category display names for alt text
 */
export const CATEGORY_NAMES: Record<ArticleCategory, { en: string; ar: string }> = {
  'marketing': { en: 'Marketing', ar: 'التسويق' },
  'seller-tools': { en: 'Seller Tools', ar: 'أدوات البائع' },
  'logistics': { en: 'Logistics', ar: 'اللوجستيات' },
  'trends': { en: 'Trends', ar: 'الاتجاهات' },
  'case-studies': { en: 'Case Studies', ar: 'دراسات الحالة' },
};

// ============================================================================
// Thumbnail Selection
// ============================================================================

/**
 * Get a random Unsplash image URL for a category
 * 
 * @param category - Article category
 * @returns Random Unsplash image URL for the category
 */
export function getRandomUnsplashImage(category: ArticleCategory): string {
  const images = CATEGORY_UNSPLASH_IMAGES[category] || CATEGORY_UNSPLASH_IMAGES['trends'];
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

/**
 * Get thumbnail URL for a category
 * Now returns a high-quality Unsplash image
 * 
 * @param category - Article category
 * @returns Thumbnail URL path
 * 
 * Requirements: 3.1, 3.2
 */
export function getThumbnailForCategory(category: ArticleCategory): string {
  return getRandomUnsplashImage(category);
}

/**
 * Get gradient class for a category
 * 
 * @param category - Article category
 * @returns Tailwind gradient classes
 * 
 * Requirements: 3.4
 */
export function getGradientForCategory(category: ArticleCategory): string {
  return CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS['trends'];
}

/**
 * Get icon name for a category
 * 
 * @param category - Article category
 * @returns Lucide icon name
 */
export function getIconForCategory(category: ArticleCategory): string {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['trends'];
}

/**
 * Get category display name
 * 
 * @param category - Article category
 * @param locale - Language locale ('en' or 'ar')
 * @returns Localized category name
 */
export function getCategoryName(category: ArticleCategory, locale: string = 'en'): string {
  const names = CATEGORY_NAMES[category] || CATEGORY_NAMES['trends'];
  return locale === 'ar' ? names.ar : names.en;
}

// ============================================================================
// Thumbnail Validation
// ============================================================================

/**
 * Check if a thumbnail URL is valid
 * 
 * @param url - Thumbnail URL to validate
 * @returns True if URL appears valid
 */
export function isValidThumbnailUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Check for valid URL format
  try {
    // Handle relative URLs
    if (url.startsWith('/')) {
      return url.length > 1;
    }
    
    // Handle absolute URLs
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Get thumbnail with fallback
 * 
 * @param thumbnailUrl - Primary thumbnail URL
 * @param category - Article category for fallback
 * @returns Valid thumbnail URL or category placeholder
 */
export function getThumbnailWithFallback(
  thumbnailUrl: string | null | undefined,
  category: ArticleCategory
): string {
  if (isValidThumbnailUrl(thumbnailUrl)) {
    return thumbnailUrl!;
  }
  return getThumbnailForCategory(category);
}

// ============================================================================
// Gradient Fallback Generation
// ============================================================================

/**
 * Generate inline gradient style for fallback
 * 
 * @param category - Article category
 * @returns CSS gradient string
 */
export function generateGradientStyle(category: ArticleCategory): string {
  const gradientMap: Record<ArticleCategory, string> = {
    'marketing': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    'seller-tools': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'logistics': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    'trends': 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    'case-studies': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  };
  
  return gradientMap[category] || gradientMap['trends'];
}

/**
 * Get thumbnail info for rendering
 * 
 * @param thumbnailUrl - Primary thumbnail URL
 * @param category - Article category
 * @returns Object with thumbnail info for rendering
 */
export function getThumbnailInfo(
  thumbnailUrl: string | null | undefined,
  category: ArticleCategory
): {
  url: string;
  gradient: string;
  gradientStyle: string;
  icon: string;
  categoryName: { en: string; ar: string };
  hasValidUrl: boolean;
} {
  const hasValidUrl = isValidThumbnailUrl(thumbnailUrl);
  
  return {
    url: hasValidUrl ? thumbnailUrl! : getThumbnailForCategory(category),
    gradient: getGradientForCategory(category),
    gradientStyle: generateGradientStyle(category),
    icon: getIconForCategory(category),
    categoryName: CATEGORY_NAMES[category] || CATEGORY_NAMES['trends'],
    hasValidUrl,
  };
}

// ============================================================================
// SVG Placeholder Generation
// ============================================================================

/**
 * Generate SVG placeholder content for a category
 * This can be used to create placeholder images programmatically
 * 
 * @param category - Article category
 * @param width - SVG width (default: 800)
 * @param height - SVG height (default: 450, 16:9 ratio)
 * @returns SVG string
 */
export function generatePlaceholderSvg(
  category: ArticleCategory,
  width: number = 800,
  height: number = 450
): string {
  const gradientColors: Record<ArticleCategory, { start: string; end: string }> = {
    'marketing': { start: '#a855f7', end: '#ec4899' },
    'seller-tools': { start: '#06b6d4', end: '#3b82f6' },
    'logistics': { start: '#10b981', end: '#14b8a6' },
    'trends': { start: '#f97316', end: '#ef4444' },
    'case-studies': { start: '#6366f1', end: '#a855f7' },
  };
  
  const colors = gradientColors[category] || gradientColors['trends'];
  const categoryName = CATEGORY_NAMES[category]?.en || 'Article';
  
  // Icon paths for each category (simplified)
  const iconPaths: Record<ArticleCategory, string> = {
    'marketing': 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    'seller-tools': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    'logistics': 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'trends': 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    'case-studies': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  };
  
  const iconPath = iconPaths[category] || iconPaths['trends'];
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="grad-${category}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.start};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.end};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad-${category})"/>
  <g transform="translate(${width/2 - 24}, ${height/2 - 40})" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="${iconPath}"/>
  </g>
  <text x="${width/2}" y="${height/2 + 40}" font-family="system-ui, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.9">${categoryName}</text>
</svg>`;
}

/**
 * Generate data URL for placeholder SVG
 * 
 * @param category - Article category
 * @returns Data URL string
 */
export function generatePlaceholderDataUrl(category: ArticleCategory): string {
  const svg = generatePlaceholderSvg(category);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}
