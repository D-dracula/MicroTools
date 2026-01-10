/**
 * Property-Based Tests for Word Counter
 * 
 * Feature: marketing-content-tools, Property 12: Word Count Accuracy
 * Validates: Requirements 13.1, 13.4, 13.5
 */

import fc from 'fast-check';
import { analyzeText, countWords, countArabicWords, calculateReadingTime } from './word-counter';

/**
 * Custom arbitrary for English text with known word count
 */
function englishWords(count: number): fc.Arbitrary<string> {
  const words = ['hello', 'world', 'test', 'word', 'example', 'text', 'sample', 'data', 'input', 'output'];
  return fc.array(
    fc.constantFrom(...words),
    { minLength: count, maxLength: count }
  ).map(arr => arr.join(' '));
}

/**
 * Custom arbitrary for Arabic text
 */
function arabicText(): fc.Arbitrary<string> {
  const arabicWords = ['مرحبا', 'عالم', 'اختبار', 'كلمة', 'مثال', 'نص', 'عينة', 'بيانات'];
  return fc.array(
    fc.constantFrom(...arabicWords),
    { minLength: 1, maxLength: 20 }
  ).map(arr => arr.join(' '));
}

describe('Word Counter Properties', () => {
  /**
   * Property 12: Word Count Accuracy
   * 
   * For any input text, the word counter SHALL:
   * - Return accurate word count (for both Arabic and English)
   * - Return character count equal to text.length
   * - Return reading time approximately equal to wordCount / 200 minutes
   * - Arabic text word counting SHALL handle Arabic word boundaries correctly
   * 
   * Validates: Requirements 13.1, 13.4, 13.5
   */
  it('Property 12a: character count equals text length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (text, language) => {
          const result = analyzeText({ text, language });

          expect(result.characterCount).toBe(text.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12b: reading time is approximately wordCount / 200', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (wordCount) => {
          const text = Array(wordCount).fill('word').join(' ');
          const result = analyzeText({ text, language: 'en' });

          // Reading time should be ceil(wordCount / 200)
          const expectedTime = Math.ceil(wordCount / 200);
          expect(result.readingTimeMinutes).toBe(expectedTime);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 12c: counts English words correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (expectedCount) => {
          const text = Array(expectedCount).fill('word').join(' ');
          const result = analyzeText({ text, language: 'en' });

          expect(result.wordCount).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 12d: counts Arabic words correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (expectedCount) => {
          const arabicWord = 'كلمة';
          const text = Array(expectedCount).fill(arabicWord).join(' ');
          const result = analyzeText({ text, language: 'ar' });

          expect(result.wordCount).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 12e: empty text returns zero counts', () => {
    const result = analyzeText({ text: '', language: 'en' });

    expect(result.wordCount).toBe(0);
    expect(result.characterCount).toBe(0);
    expect(result.sentenceCount).toBe(0);
    expect(result.readingTimeMinutes).toBe(0);
  });

  it('Property 12f: character count without spaces is always <= character count', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (text, language) => {
          const result = analyzeText({ text, language });

          expect(result.characterCountNoSpaces).toBeLessThanOrEqual(result.characterCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12g: SEO status is determined by word count', () => {
    // Short (< 100 words)
    const shortResult = analyzeText({ text: Array(50).fill('word').join(' '), language: 'en' });
    expect(shortResult.seoStatus).toBe('short');

    // Optimal (150-300 words)
    const optimalResult = analyzeText({ text: Array(200).fill('word').join(' '), language: 'en' });
    expect(optimalResult.seoStatus).toBe('optimal');

    // Long (> 500 words)
    const longResult = analyzeText({ text: Array(600).fill('word').join(' '), language: 'en' });
    expect(longResult.seoStatus).toBe('long');
  });
});
