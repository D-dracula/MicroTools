/**
 * Business Name Generator Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Property 6 from design document
 */

import * as fc from 'fast-check';
import { generateBusinessNames, type BusinessCategory } from './business-name-generator';

describe('Business Name Generator Properties', () => {
  /**
   * Feature: content-technical-tools, Property 6: Minimum 10 suggestions output
   * For any valid keyword and category input, the business name generator
   * SHALL produce at least 10 name suggestions.
   * **Validates: Requirements 3.3**
   */
  describe('Property 6: Minimum 10 suggestions output', () => {
    const categories: BusinessCategory[] = ['retail', 'food', 'fashion', 'technology', 'services', 'general'];
    const languages: ('ar' | 'en')[] = ['ar', 'en'];

    it('generates at least 10 names for any valid keyword in English', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...categories),
          (keyword: string, category: BusinessCategory) => {
            const result = generateBusinessNames({
              keywords: [keyword],
              category,
              language: 'en',
            });
            
            return result.names.length >= 10;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generates at least 10 names for any valid keyword in Arabic', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...categories),
          (keyword: string, category: BusinessCategory) => {
            const result = generateBusinessNames({
              keywords: [keyword],
              category,
              language: 'ar',
            });
            
            return result.names.length >= 10;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generates at least 10 names for all category and language combinations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...categories),
          fc.constantFrom(...languages),
          (keyword: string, category: BusinessCategory, language: 'ar' | 'en') => {
            const result = generateBusinessNames({
              keywords: [keyword],
              category,
              language,
            });
            
            return result.names.length >= 10;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns empty array for empty keyword', () => {
      categories.forEach(category => {
        languages.forEach(language => {
          const result = generateBusinessNames({
            keywords: [],
            category,
            language,
          });
          
          expect(result.names.length).toBe(0);
        });
      });
    });

    it('all generated names are unique', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.constantFrom(...categories),
          fc.constantFrom(...languages),
          (keyword: string, category: BusinessCategory, language: 'ar' | 'en') => {
            const result = generateBusinessNames({
              keywords: [keyword],
              category,
              language,
            });
            
            const nameSet = new Set(result.names.map(n => n.name));
            return nameSet.size === result.names.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
