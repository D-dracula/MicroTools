/**
 * Robots.txt Validator Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Property 16 from design document
 */

import * as fc from 'fast-check';
import { validateRobotsTxt } from './robots-validator';

// Generator for valid robots.txt content
const validRobotsTxtArbitrary = fc.record({
  userAgent: fc.constantFrom('*', 'Googlebot', 'Bingbot', 'Yandex'),
  rules: fc.array(
    fc.record({
      directive: fc.constantFrom('Allow', 'Disallow'),
      path: fc.constantFrom('/', '/admin/', '/private/', '/api/', ''),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  sitemap: fc.option(
    fc.constantFrom(
      'https://example.com/sitemap.xml',
      'https://test.com/sitemap.xml',
      'https://site.org/sitemap.xml'
    ),
    { nil: undefined }
  ),
}).map(({ userAgent, rules, sitemap }) => {
  let content = `User-agent: ${userAgent}\n`;
  rules.forEach(rule => {
    content += `${rule.directive}: ${rule.path}\n`;
  });
  if (sitemap) {
    content += `Sitemap: ${sitemap}\n`;
  }
  return content;
});

describe('Robots.txt Validator Properties', () => {
  /**
   * Feature: content-technical-tools, Property 16: Valid content passes validation
   * For any syntactically correct robots.txt content following the standard format,
   * the validator SHALL report isValid as true with no errors.
   * **Validates: Requirements 8.1, 8.7**
   */
  describe('Property 16: Valid content passes validation', () => {
    it('valid robots.txt content passes validation', () => {
      fc.assert(
        fc.property(validRobotsTxtArbitrary, (content: string) => {
          const result = validateRobotsTxt(content);
          
          // Should be valid (no errors)
          return result.isValid === true && result.summary.errorCount === 0;
        }),
        { numRuns: 100 }
      );
    });


    it('standard robots.txt formats are valid', () => {
      const validExamples = [
        'User-agent: *\nDisallow: /admin/',
        'User-agent: *\nAllow: /\nDisallow: /private/',
        'User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nAllow: /',
        'User-agent: *\nDisallow:\n\nSitemap: https://example.com/sitemap.xml',
      ];
      
      validExamples.forEach(content => {
        const result = validateRobotsTxt(content);
        expect(result.isValid).toBe(true);
        expect(result.summary.errorCount).toBe(0);
      });
    });

    it('extracts user agents correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('*', 'Googlebot', 'Bingbot'),
          (userAgent: string) => {
            const content = `User-agent: ${userAgent}\nDisallow: /`;
            const result = validateRobotsTxt(content);
            
            return result.userAgents.includes(userAgent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('extracts sitemaps correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/sitemap.xml',
            'https://test.com/sitemap.xml'
          ),
          (sitemapUrl: string) => {
            const content = `User-agent: *\nDisallow: /\nSitemap: ${sitemapUrl}`;
            const result = validateRobotsTxt(content);
            
            return result.sitemaps.includes(sitemapUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty content is invalid', () => {
      const result = validateRobotsTxt('');
      expect(result.isValid).toBe(false);
      expect(result.summary.errorCount).toBeGreaterThan(0);
    });

    it('content without User-agent is invalid', () => {
      const result = validateRobotsTxt('Disallow: /admin/');
      expect(result.isValid).toBe(false);
    });

    it('comments are ignored', () => {
      const content = '# This is a comment\nUser-agent: *\n# Another comment\nDisallow: /';
      const result = validateRobotsTxt(content);
      expect(result.isValid).toBe(true);
    });
  });
});
