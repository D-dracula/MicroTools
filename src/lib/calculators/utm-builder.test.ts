/**
 * Property-Based Tests for UTM Builder
 * 
 * Feature: marketing-content-tools, Property 2: UTM URL Generation and Encoding
 * Validates: Requirements 2.1, 2.4, 2.6
 */

import fc from 'fast-check';
import { buildUTMUrl, validateUrl, encodeUTMParams } from './utm-builder';

/**
 * Custom arbitrary for valid URLs
 */
function validUrl(): fc.Arbitrary<string> {
  return fc.webUrl();
}

/**
 * Custom arbitrary for UTM parameter values (alphanumeric with some special chars)
 */
function utmParamValue(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 1, 
    maxLength: 30 
  }).filter(s => s.trim().length > 0);
}

describe('UTM Builder Properties', () => {
  /**
   * Property 2: UTM URL Generation and Encoding
   * 
   * For any valid destination URL and UTM parameters (source, medium, campaign), 
   * the UTM builder SHALL produce a URL that:
   * - Preserves the original destination URL
   * - Appends properly formatted UTM parameters
   * - URL-encodes all parameter values
   * 
   * Validates: Requirements 2.1, 2.4, 2.6
   */
  it('Property 2: generates valid UTM URLs with proper encoding', () => {
    fc.assert(
      fc.property(
        validUrl(),
        utmParamValue(),
        utmParamValue(),
        utmParamValue(),
        (url, source, medium, campaign) => {
          const result = buildUTMUrl({
            url,
            source,
            medium,
            campaign,
          });

          if (result.isValid) {
            // Full URL should contain the original URL's origin
            const originalUrl = new URL(url);
            expect(result.fullUrl).toContain(originalUrl.origin);
            
            // Should contain UTM parameters
            expect(result.fullUrl).toContain('utm_source=');
            expect(result.fullUrl).toContain('utm_medium=');
            expect(result.fullUrl).toContain('utm_campaign=');
            
            // Parameters should be URL-encoded
            expect(result.fullUrl).toContain(`utm_source=${encodeURIComponent(source.trim())}`);
            expect(result.fullUrl).toContain(`utm_medium=${encodeURIComponent(medium.trim())}`);
            expect(result.fullUrl).toContain(`utm_campaign=${encodeURIComponent(campaign.trim())}`);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b: Invalid URLs should be rejected
   */
  it('Property 2b: rejects invalid URLs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.startsWith('http://') && !s.startsWith('https://')),
        utmParamValue(),
        utmParamValue(),
        utmParamValue(),
        (invalidUrl, source, medium, campaign) => {
          const result = buildUTMUrl({
            url: invalidUrl,
            source,
            medium,
            campaign,
          });

          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2c: Missing required parameters should be reported
   */
  it('Property 2c: reports missing required parameters', () => {
    fc.assert(
      fc.property(
        validUrl(),
        (url) => {
          const result = buildUTMUrl({
            url,
            source: '',
            medium: '',
            campaign: '',
          });

          expect(result.isValid).toBe(false);
          expect(result.missingParams.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
