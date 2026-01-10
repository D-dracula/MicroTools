/**
 * XML Sitemap Generator Logic
 * 
 * Generates valid XML sitemaps from a list of URLs.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

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

const MAX_URLS = 100;

/**
 * Validates a URL string.
 * Requirements: 9.3
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Escapes special XML characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gets current date in ISO format (YYYY-MM-DD).
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Validates priority value.
 * Requirements: 9.4
 */
function validatePriority(priority: number | undefined): number {
  if (priority === undefined) return 0.5;
  if (priority < 0) return 0.0;
  if (priority > 1) return 1.0;
  return Math.round(priority * 10) / 10; // Round to 1 decimal
}

/**
 * Generates an XML sitemap from URLs.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */
export function generateSitemap(input: SitemapGeneratorInput): SitemapGeneratorResult {
  const { urls, autoLastmod = true } = input;
  const errors: { url: string; error: string }[] = [];
  const validUrls: SitemapUrl[] = [];
  
  // Handle empty input
  if (!urls || urls.length === 0) {
    return {
      xml: '',
      urlCount: 0,
      isValid: false,
      errors: [{ url: '', error: 'No URLs provided' }],
    };
  }
  
  // Check URL limit - Requirement 9.7
  if (urls.length > MAX_URLS) {
    errors.push({
      url: '',
      error: `Too many URLs. Maximum is ${MAX_URLS}, got ${urls.length}`,
    });
  }
  
  // Process URLs (up to limit)
  const urlsToProcess = urls.slice(0, MAX_URLS);
  
  for (const urlEntry of urlsToProcess) {
    if (!validateUrl(urlEntry.loc)) {
      errors.push({
        url: urlEntry.loc || '(empty)',
        error: 'Invalid URL format',
      });
      continue;
    }
    validUrls.push(urlEntry);
  }
  
  // Generate XML
  const currentDate = getCurrentDate();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const urlEntry of validUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(urlEntry.loc)}</loc>\n`;
    
    // Add lastmod - Requirement 9.5
    if (urlEntry.lastmod) {
      xml += `    <lastmod>${escapeXml(urlEntry.lastmod)}</lastmod>\n`;
    } else if (autoLastmod) {
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
    }
    
    // Add changefreq - Requirement 9.6
    if (urlEntry.changefreq) {
      xml += `    <changefreq>${urlEntry.changefreq}</changefreq>\n`;
    }
    
    // Add priority - Requirement 9.4
    const priority = validatePriority(urlEntry.priority);
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
    
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  
  return {
    xml,
    urlCount: validUrls.length,
    isValid: validUrls.length > 0 && errors.filter(e => !e.url).length === 0,
    errors,
  };
}

/**
 * Parses URLs from text (one per line).
 */
export function parseUrlsFromText(text: string): string[] {
  if (!text) return [];
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
