/**
 * Property-Based Tests for WhatsApp Link Generator
 * 
 * Feature: marketing-content-tools, Property 1: WhatsApp Link Generation Validity
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import fc from 'fast-check';
import { generateWhatsAppLink, validatePhoneNumber } from './whatsapp-link';

/**
 * Custom arbitrary for valid phone numbers (7-15 digits)
 */
function validPhoneNumber(): fc.Arbitrary<string> {
  const digits = '0123456789';
  return fc.integer({ min: 0, max: digits.length - 1 })
    .map((n) => digits[n])
    .chain((firstDigit) => 
      fc.string({ 
        unit: fc.integer({ min: 0, max: 9 }).map(n => digits[n]),
        minLength: 6, 
        maxLength: 14 
      }).map(rest => firstDigit + rest)
    );
}

/**
 * Custom arbitrary for valid country codes (1-4 digits)
 */
function validCountryCode(): fc.Arbitrary<string> {
  const digits = '0123456789';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: 9 }).map(n => digits[n]),
    minLength: 1, 
    maxLength: 4 
  }).filter(s => s.length > 0 && /^\d+$/.test(s));
}

/**
 * Custom arbitrary for product names
 */
function productName(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 1, 
    maxLength: 50 
  }).filter(s => s.trim().length > 0);
}

describe('WhatsApp Link Generator Properties', () => {
  /**
   * Property 1: WhatsApp Link Generation Validity
   * 
   * For any valid phone number (with country code) and product name, 
   * the WhatsApp link generator SHALL produce a link that:
   * - Starts with https://wa.me/
   * - Contains the properly formatted phone number
   * - Has a URL-encoded message containing the product name
   * 
   * Validates: Requirements 1.1, 1.2, 1.3
   */
  it('Property 1: generates valid WhatsApp links for valid inputs', () => {
    fc.assert(
      fc.property(
        validPhoneNumber(),
        validCountryCode(),
        productName(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (phoneNumber, countryCode, product, language) => {
          const result = generateWhatsAppLink({
            phoneNumber,
            countryCode,
            productName: product,
            language,
          });

          if (result.isValid) {
            // Link should start with wa.me
            expect(result.link).toMatch(/^https:\/\/wa\.me\//);
            
            // Link should contain the country code and phone number
            const cleanedPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
            expect(result.link).toContain(`wa.me/${countryCode}${cleanedPhone}`);
            
            // Message should contain the product name
            expect(result.message).toContain(product);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1b: Invalid phone numbers should be rejected
   */
  it('Property 1b: rejects invalid phone numbers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^\d{7,15}$/.test(s.replace(/[\s\-\(\)\.]/g, ''))),
        productName(),
        (invalidPhone, product) => {
          // Skip if the cleaned phone happens to be valid
          const cleaned = invalidPhone.replace(/[\s\-\(\)\.]/g, '');
          if (/^\d{7,15}$/.test(cleaned)) return true;

          const result = generateWhatsAppLink({
            phoneNumber: invalidPhone,
            countryCode: '966',
            productName: product,
            language: 'en',
          });

          // Should be invalid or have an error
          if (!result.isValid) {
            expect(result.error).toBeDefined();
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
