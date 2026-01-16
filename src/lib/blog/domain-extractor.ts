/**
 * Extract domain names from URLs for source citations
 * 
 * Requirements: 6.3
 * - Extract clean domain from URL
 * - Remove www. prefix
 * - Handle various URL formats
 */

/**
 * Extract domain from a URL
 * 
 * @param url - The full URL
 * @returns The domain name (without www.)
 * 
 * @example
 * extractDomain("https://www.example.com/path") // "example.com"
 * extractDomain("http://blog.example.co.uk/article") // "blog.example.co.uk"
 * extractDomain("example.com") // "example.com"
 */
export function extractDomain(url: string): string {
  try {
    // Handle URLs without protocol
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    
    const urlObj = new URL(urlWithProtocol);
    let domain = urlObj.hostname;
    
    // Remove www. prefix
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch {
    // If URL parsing fails, try basic string extraction
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    if (match && match[1]) {
      return match[1].replace(/^www\./, '');
    }
    
    // Fallback: return cleaned input
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/, '').split('/')[0];
  }
}

/**
 * Extract domain and validate URL
 * 
 * @param url - The URL to validate and extract from
 * @returns Object with domain and validity status
 * 
 * @example
 * extractDomainSafe("https://example.com") // { domain: "example.com", isValid: true }
 * extractDomainSafe("not a url") // { domain: "not a url", isValid: false }
 */
export function extractDomainSafe(url: string): {
  domain: string;
  isValid: boolean;
} {
  try {
    const domain = extractDomain(url);
    // Basic validation: domain should have at least one dot
    const isValid = domain.includes('.') && domain.length > 3;
    return { domain, isValid };
  } catch {
    return { domain: url, isValid: false };
  }
}
