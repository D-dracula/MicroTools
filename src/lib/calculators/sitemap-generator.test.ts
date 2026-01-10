/**
 * Sitemap Generator Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Properties 14, 15 from design document
 */

import * as fc from 'fast-check';
import { generateSitemap, validateUrl, type SitemapUrl, type ChangeFrequency } from './sitemap-generator';

// Generator for valid URLs
const validUrlArbitrary = fc.record({
  protocol: fc.constantFrom('https://', 'http://'),
  domain: fc.constantFrom('example.com', 'test.org', 'site.net', 'mysite.io'),
  path: fc.constantFrom('', '/', '/page', '/about', '/contact', '/products/item'),
}).map(({ protocol, domain, path }) => protocol + domain + path);

// Generator for valid SitemapUrl objects
const sitemapUrlArbitrary = fc.record({
  loc: validUrlArbitrary,
  priority: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
  changefreq: fc.option(
    fc.constantFrom<ChangeFrequency>('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'),
    { nil: undefined }
  ),
});

describe('Sitemap Generator Properties', () => {
  /**
   * Feature: content-technical-tools, Property 14: Generated XML is valid and parseable
   * For any list of valid URLs, the generated sitemap SHALL be valid XML
   * that can be parsed without errors.
   * **Validates: Requirements 9.1, 9.2**
   */
  describe('Property 14: Generated XML is valid and parseable', () => {
    it('generated XML has correct structure', () => {
      fc.assert(
        fc.property(
          fc.array(sitemapUrlArbitrary, { minLength: 1, maxLength: 20 }),
          (urls: SitemapUrl[]) => {
            const result = generateSitemap({ urls, autoLastmod: false });
            
            if (!result.isValid) return true; // Skip invalid inputs
            
            // Check XML declaration
            const hasDeclaration = result.xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>');
            
            // Check urlset element
            const hasUrlset = result.xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            const hasClosingUrlset = result.xml.includes('</urlset>');
            
            // Check url elements
            const hasUrlElements = result.xml.includes('<url>') && result.xml.includes('</url>');
            const hasLocElements = result.xml.includes('<loc>') && result.xml.includes('</loc>');
            
            return hasDeclaration && hasUrlset && hasClosingUrlset && hasUrlElements && hasLocElements;
          }
        ),
        { numRuns: 100 }
      );
    });


    it('all valid URLs appear in output', () => {
      fc.assert(
        fc.property(
          fc.array(sitemapUrlArbitrary, { minLength: 1, maxLength: 20 }),
          (urls: SitemapUrl[]) => {
            const result = generateSitemap({ urls, autoLastmod: false });
            
            if (!result.isValid) return true;
            
            // Each valid URL should appear in the XML
            return urls.every(url => {
              if (!validateUrl(url.loc)) return true; // Skip invalid URLs
              return result.xml.includes(url.loc);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('URL count matches valid URLs', () => {
      fc.assert(
        fc.property(
          fc.array(sitemapUrlArbitrary, { minLength: 1, maxLength: 20 }),
          (urls: SitemapUrl[]) => {
            const result = generateSitemap({ urls, autoLastmod: false });
            const validUrlCount = urls.filter(u => validateUrl(u.loc)).length;
            
            return result.urlCount === Math.min(validUrlCount, 100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: content-technical-tools, Property 15: URL limit enforcement
   * For any input with more than 100 URLs, the sitemap generator SHALL either
   * reject the input or generate a valid sitemap with at most 100 URLs.
   * **Validates: Requirements 9.7**
   */
  describe('Property 15: URL limit enforcement', () => {
    it('limits output to 100 URLs maximum', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 200 }),
          (count: number) => {
            // Generate array of valid URLs
            const urls: SitemapUrl[] = Array.from({ length: count }, (_, i) => ({
              loc: `https://example.com/page${i}`,
            }));
            
            const result = generateSitemap({ urls, autoLastmod: false });
            
            // Should have at most 100 URLs in output
            return result.urlCount <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('reports error when exceeding limit', () => {
      const urls: SitemapUrl[] = Array.from({ length: 150 }, (_, i) => ({
        loc: `https://example.com/page${i}`,
      }));
      
      const result = generateSitemap({ urls, autoLastmod: false });
      
      // Should have an error about too many URLs
      expect(result.errors.some(e => e.error.includes('Too many URLs'))).toBe(true);
    });

    it('exactly 100 URLs is valid', () => {
      const urls: SitemapUrl[] = Array.from({ length: 100 }, (_, i) => ({
        loc: `https://example.com/page${i}`,
      }));
      
      const result = generateSitemap({ urls, autoLastmod: false });
      
      expect(result.isValid).toBe(true);
      expect(result.urlCount).toBe(100);
    });

    it('empty input is invalid', () => {
      const result = generateSitemap({ urls: [], autoLastmod: false });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
