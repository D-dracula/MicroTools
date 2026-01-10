/**
 * Property-Based Tests for Terms of Service Generator
 * 
 * Feature: marketing-content-tools, Property 8: Terms Document Generation
 * Validates: Requirements 9.1, 9.5
 */

import fc from 'fast-check';
import { generateTermsOfService, TermsClause } from './terms-generator';

/**
 * Custom arbitrary for store names
 */
function storeName(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 1, 
    maxLength: 50 
  }).filter(s => s.trim().length > 0);
}

/**
 * Custom arbitrary for terms clauses
 */
function termsClauses(): fc.Arbitrary<TermsClause[]> {
  const allClauses: TermsClause[] = ['payment', 'delivery', 'liability', 'intellectual_property', 'privacy', 'disputes', 'modifications'];
  return fc.subarray(allClauses, { minLength: 1 });
}

describe('Terms of Service Generator Properties', () => {
  /**
   * Property 8: Terms Document Generation
   * 
   * For any store information and selected clauses, the generated terms of service 
   * SHALL contain all selected clause sections and include the provided store information.
   * 
   * Validates: Requirements 9.1, 9.5
   */
  it('Property 8: generates complete terms with store info and all selected clauses', () => {
    fc.assert(
      fc.property(
        storeName(),
        fc.webUrl(),
        fc.emailAddress(),
        termsClauses(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (name, url, email, clauses, language) => {
          const result = generateTermsOfService({
            storeName: name,
            storeUrl: url,
            contactEmail: email,
            clauses,
            language,
          });

          expect(result.isComplete).toBe(true);
          
          // Store name should appear in the document
          expect(result.document).toContain(name);
          
          // Store URL should appear in the document
          expect(result.document).toContain(url);
          
          // Contact email should appear when privacy or disputes clause is selected
          const emailClauses: TermsClause[] = ['privacy', 'disputes'];
          const hasEmailClause = clauses.some(c => emailClauses.includes(c));
          if (hasEmailClause) {
            expect(result.document).toContain(email);
          }
          
          // Should have sections (intro + selected clauses)
          expect(result.sections.length).toBeGreaterThanOrEqual(clauses.length + 1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8b: Each section has title and content
   */
  it('Property 8b: all sections have titles and content', () => {
    fc.assert(
      fc.property(
        storeName(),
        fc.webUrl(),
        fc.emailAddress(),
        termsClauses(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (name, url, email, clauses, language) => {
          const result = generateTermsOfService({
            storeName: name,
            storeUrl: url,
            contactEmail: email,
            clauses,
            language,
          });

          if (result.isComplete) {
            for (const section of result.sections) {
              expect(section.title).toBeDefined();
              expect(section.title.length).toBeGreaterThan(0);
              expect(section.content).toBeDefined();
              expect(section.content.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8c: Custom terms are included when provided
   */
  it('Property 8c: includes custom terms when provided', () => {
    fc.assert(
      fc.property(
        storeName(),
        fc.webUrl(),
        fc.emailAddress(),
        termsClauses(),
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (name, url, email, clauses, customTerms, language) => {
          const result = generateTermsOfService({
            storeName: name,
            storeUrl: url,
            contactEmail: email,
            clauses,
            customTerms,
            language,
          });

          if (result.isComplete && customTerms.trim()) {
            expect(result.document).toContain(customTerms.trim());
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
