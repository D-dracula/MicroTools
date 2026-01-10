/**
 * Property-Based Tests for Description Cleaner
 * 
 * Feature: marketing-content-tools, Property 9: Description Cleaning Preservation
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import fc from 'fast-check';
import { cleanDescription, CleanerOptions } from './description-cleaner';

/**
 * Custom arbitrary for text with various elements
 */
function textWithElements(): fc.Arbitrary<string> {
  return fc.tuple(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.boolean(),
    fc.boolean(),
  ).map(([text, addEmoji, addUrl]) => {
    let result = text;
    if (addEmoji) result += ' 😀 🎉 ';
    if (addUrl) result += ' https://example.com ';
    return result;
  });
}

/**
 * Custom arbitrary for cleaner options
 */
function cleanerOptions(): fc.Arbitrary<CleanerOptions> {
  return fc.record({
    removeEmojis: fc.boolean(),
    removeSpecialChars: fc.boolean(),
    removeExtraSpaces: fc.boolean(),
    removeUrls: fc.boolean(),
    preserveLineBreaks: fc.boolean(),
    preserveBulletPoints: fc.boolean(),
  });
}

describe('Description Cleaner Properties', () => {
  /**
   * Property 9: Description Cleaning Preservation
   * 
   * For any input text and cleaning options, the description cleaner SHALL:
   * - Remove only the elements specified in options
   * - Preserve elements not specified for removal
   * - When preserveLineBreaks is true, line breaks SHALL remain in output
   * - When preserveBulletPoints is true, bullet points SHALL remain in output
   * 
   * Validates: Requirements 10.1, 10.2, 10.3
   */
  it('Property 9: preserves line breaks when preserveLineBreaks is true', () => {
    // Generate strings with actual letters to ensure content remains after cleaning
    const alphanumericString = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
      return fc.string({ 
        unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
        minLength: 3, 
        maxLength: 50 
      }).filter(s => /[a-zA-Z0-9]/.test(s.trim()));
    };

    fc.assert(
      fc.property(
        alphanumericString(),
        alphanumericString(),
        (line1, line2) => {
          const textWithLineBreaks = `${line1}\n${line2}`;
          
          const result = cleanDescription({
            text: textWithLineBreaks,
            options: {
              removeEmojis: true,
              removeSpecialChars: true,
              removeExtraSpaces: true,
              removeUrls: true,
              preserveLineBreaks: true,
              preserveBulletPoints: true,
            },
          });

          // Line breaks should be preserved when both lines have content
          const cleanedLine1 = line1.trim();
          const cleanedLine2 = line2.trim();
          if (cleanedLine1.length > 0 && cleanedLine2.length > 0) {
            expect(result.cleanedText).toContain('\n');
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9b: Removes line breaks when preserveLineBreaks is false
   */
  it('Property 9b: removes line breaks when preserveLineBreaks is false', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (line1, line2) => {
          const textWithLineBreaks = `${line1}\n\n\n${line2}`;
          
          const result = cleanDescription({
            text: textWithLineBreaks,
            options: {
              removeEmojis: false,
              removeSpecialChars: false,
              removeExtraSpaces: true,
              removeUrls: false,
              preserveLineBreaks: false,
              preserveBulletPoints: true,
            },
          });

          // Multiple newlines should be collapsed to spaces
          expect(result.cleanedText).not.toContain('\n\n\n');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9c: Preserves bullet points when preserveBulletPoints is true
   */
  it('Property 9c: preserves bullet points when preserveBulletPoints is true', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (text) => {
          const textWithBullets = `• ${text}\n• Another point`;
          
          const result = cleanDescription({
            text: textWithBullets,
            options: {
              removeEmojis: true,
              removeSpecialChars: true,
              removeExtraSpaces: true,
              removeUrls: true,
              preserveLineBreaks: true,
              preserveBulletPoints: true,
            },
          });

          // Bullet points should be preserved
          expect(result.cleanedText).toContain('•');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9d: Removes URLs when removeUrls is true
   */
  it('Property 9d: removes URLs when removeUrls is true', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (text, url) => {
          const textWithUrl = `${text} ${url} more text`;
          
          const result = cleanDescription({
            text: textWithUrl,
            options: {
              removeEmojis: false,
              removeSpecialChars: false,
              removeExtraSpaces: true,
              removeUrls: true,
              preserveLineBreaks: true,
              preserveBulletPoints: true,
            },
          });

          // URL should be removed
          expect(result.cleanedText).not.toContain(url);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9e: Cleaned text length is always <= original length
   */
  it('Property 9e: cleaned text length is always <= original length', () => {
    fc.assert(
      fc.property(
        textWithElements(),
        cleanerOptions(),
        (text, options) => {
          const result = cleanDescription({ text, options });

          expect(result.cleanedLength).toBeLessThanOrEqual(result.originalLength);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
