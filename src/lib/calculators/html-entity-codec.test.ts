/**
 * HTML Entity Codec Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Properties 12, 13 from design document
 */

import * as fc from 'fast-check';
import { encodeHtmlEntities, decodeHtmlEntities } from './html-entity-codec';

describe('HTML Entity Codec Properties', () => {
  /**
   * Feature: content-technical-tools, Property 12: Encode-decode round-trip
   * For any text string, encoding to HTML entities and then decoding
   * SHALL return the original text.
   * **Validates: Requirements 7.1, 7.2**
   */
  describe('Property 12: Encode-decode round-trip', () => {
    it('encoding then decoding returns original text', () => {
      fc.assert(
        fc.property(fc.string(), (text: string) => {
          const encoded = encodeHtmlEntities(text);
          const decoded = decodeHtmlEntities(encoded);
          
          return decoded === text;
        }),
        { numRuns: 100 }
      );
    });

    it('round-trip works for text with special characters', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...'<>&"\' abc123'.split('')), { minLength: 0, maxLength: 100 })
            .map(arr => arr.join('')),
          (text: string) => {
            const encoded = encodeHtmlEntities(text);
            const decoded = decodeHtmlEntities(encoded);
            
            return decoded === text;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty string round-trips correctly', () => {
      const encoded = encodeHtmlEntities('');
      const decoded = decodeHtmlEntities(encoded);
      expect(decoded).toBe('');
    });
  });


  /**
   * Feature: content-technical-tools, Property 13: Encoding idempotence
   * For any text string, encoding HTML entities twice SHALL produce
   * the same result as encoding once (already-encoded entities are preserved).
   * **Validates: Requirements 7.6**
   */
  describe('Property 13: Encoding idempotence', () => {
    it('encoding twice produces same result as encoding once', () => {
      fc.assert(
        fc.property(fc.string(), (text: string) => {
          const encodedOnce = encodeHtmlEntities(text);
          const encodedTwice = encodeHtmlEntities(encodedOnce);
          
          return encodedOnce === encodedTwice;
        }),
        { numRuns: 100 }
      );
    });

    it('already encoded entities are preserved', () => {
      const alreadyEncoded = '&lt;div&gt;Hello &amp; World&lt;/div&gt;';
      const encodedAgain = encodeHtmlEntities(alreadyEncoded);
      
      expect(encodedAgain).toBe(alreadyEncoded);
    });

    it('mixed content encodes correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(
            fc.constant('&lt;'),
            fc.constant('&gt;'),
            fc.constant('&amp;'),
            fc.constant('<'),
            fc.constant('>'),
            fc.constant('&'),
            fc.string({ minLength: 1, maxLength: 5 })
          ), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
          (text: string) => {
            const encodedOnce = encodeHtmlEntities(text);
            const encodedTwice = encodeHtmlEntities(encodedOnce);
            
            return encodedOnce === encodedTwice;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
