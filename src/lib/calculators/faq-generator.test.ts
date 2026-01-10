/**
 * Property-Based Tests for FAQ Generator
 * 
 * Feature: marketing-content-tools, Property 11: FAQ Schema Validity
 * Validates: Requirements 12.1, 12.2, 12.5
 */

import fc from 'fast-check';
import { generateFAQ, generateFAQSchema, validateSchema, FAQItem } from './faq-generator';

/**
 * Custom arbitrary for FAQ items
 */
function faqItem(): fc.Arbitrary<FAQItem> {
  return fc.record({
    question: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
    answer: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10),
  });
}

/**
 * Custom arbitrary for FAQ item arrays
 */
function faqItems(): fc.Arbitrary<FAQItem[]> {
  return fc.array(faqItem(), { minLength: 1, maxLength: 10 });
}

describe('FAQ Generator Properties', () => {
  /**
   * Property 11: FAQ Schema Validity
   * 
   * For any list of question-answer pairs, the FAQ generator SHALL produce:
   * - Formatted text containing all questions and answers
   * - Valid JSON-LD schema that parses without errors
   * - Schema containing all provided Q&A pairs
   * 
   * Validates: Requirements 12.1, 12.2, 12.5
   */
  it('Property 11a: generates valid JSON-LD schema', () => {
    fc.assert(
      fc.property(
        faqItems(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (questions, language) => {
          const result = generateFAQ({ questions, language });

          // Schema should be valid
          expect(result.isValidSchema).toBe(true);
          
          // Schema should parse without errors
          const parsed = JSON.parse(result.schemaMarkup);
          expect(parsed['@context']).toBe('https://schema.org');
          expect(parsed['@type']).toBe('FAQPage');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 11b: schema contains all Q&A pairs', () => {
    fc.assert(
      fc.property(
        faqItems(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (questions, language) => {
          const result = generateFAQ({ questions, language });
          const parsed = JSON.parse(result.schemaMarkup);

          // Should have same number of entities as questions
          expect(parsed.mainEntity.length).toBe(questions.length);
          
          // Each question should be in the schema
          for (let i = 0; i < questions.length; i++) {
            expect(parsed.mainEntity[i].name).toBe(questions[i].question.trim());
            expect(parsed.mainEntity[i].acceptedAnswer.text).toBe(questions[i].answer.trim());
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 11c: formatted text contains all questions and answers', () => {
    fc.assert(
      fc.property(
        faqItems(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (questions, language) => {
          const result = generateFAQ({ questions, language });

          // Each question and answer should appear in formatted text
          for (const qa of questions) {
            expect(result.formattedText).toContain(qa.question.trim());
            expect(result.formattedText).toContain(qa.answer.trim());
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 11d: validateSchema correctly validates schema format', () => {
    fc.assert(
      fc.property(
        faqItems(),
        (questions) => {
          const schema = generateFAQSchema(questions);
          
          // Generated schema should always be valid
          expect(validateSchema(schema)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 11e: invalid schema is rejected', () => {
    // Test with invalid JSON
    expect(validateSchema('not valid json')).toBe(false);
    
    // Test with wrong @type
    expect(validateSchema(JSON.stringify({ '@context': 'https://schema.org', '@type': 'Wrong' }))).toBe(false);
    
    // Test with missing mainEntity
    expect(validateSchema(JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage' }))).toBe(false);
  });
});
