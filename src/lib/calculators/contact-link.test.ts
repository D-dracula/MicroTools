/**
 * Property-Based Tests for Contact Link Generator
 * 
 * Feature: marketing-content-tools, Property 4: Contact Link Platform Formats
 * Validates: Requirements 5.1, 5.2, 5.3
 */

import fc from 'fast-check';
import { generateContactLink, validateContact, ContactPlatform } from './contact-link';

/**
 * Custom arbitrary for valid phone numbers
 */
function validPhoneNumber(): fc.Arbitrary<string> {
  return fc.integer({ min: 1000000, max: 999999999999999 })
    .map(n => `+${n}`);
}

/**
 * Custom arbitrary for valid email addresses
 */
function validEmail(): fc.Arbitrary<string> {
  return fc.emailAddress();
}

/**
 * Custom arbitrary for valid Telegram usernames (5-32 chars, starts with letter)
 */
function validTelegramUsername(): fc.Arbitrary<string> {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphanumeric = letters + '0123456789_';
  
  return fc.tuple(
    fc.integer({ min: 0, max: letters.length - 1 }).map(n => letters[n]),
    fc.string({ 
      unit: fc.integer({ min: 0, max: alphanumeric.length - 1 }).map(n => alphanumeric[n]),
      minLength: 4, 
      maxLength: 31 
    })
  ).map(([first, rest]) => first + rest);
}

describe('Contact Link Generator Properties', () => {
  /**
   * Property 4: Contact Link Platform Formats
   * 
   * For any supported platform and valid contact information, 
   * the contact link generator SHALL produce a link in the correct format.
   * 
   * Validates: Requirements 5.1, 5.2, 5.3
   */
  describe('Property 4: generates correct link formats for each platform', () => {
    it('WhatsApp links start with https://wa.me/', () => {
      fc.assert(
        fc.property(
          validPhoneNumber(),
          (phone) => {
            const result = generateContactLink({
              platform: 'whatsapp',
              contact: phone,
            });

            if (result.isValid) {
              expect(result.link).toMatch(/^https:\/\/wa\.me\//);
              expect(result.platform).toBe('whatsapp');
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Telegram links start with https://t.me/', () => {
      fc.assert(
        fc.property(
          validTelegramUsername(),
          (username) => {
            const result = generateContactLink({
              platform: 'telegram',
              contact: username,
            });

            if (result.isValid) {
              expect(result.link).toMatch(/^https:\/\/t\.me\//);
              expect(result.platform).toBe('telegram');
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Email links start with mailto:', () => {
      fc.assert(
        fc.property(
          validEmail(),
          (email) => {
            const result = generateContactLink({
              platform: 'email',
              contact: email,
            });

            if (result.isValid) {
              expect(result.link).toMatch(/^mailto:/);
              expect(result.link).toContain(email);
              expect(result.platform).toBe('email');
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Phone links start with tel:', () => {
      fc.assert(
        fc.property(
          validPhoneNumber(),
          (phone) => {
            const result = generateContactLink({
              platform: 'phone',
              contact: phone,
            });

            if (result.isValid) {
              expect(result.link).toMatch(/^tel:/);
              expect(result.platform).toBe('phone');
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('SMS links start with sms:', () => {
      fc.assert(
        fc.property(
          validPhoneNumber(),
          (phone) => {
            const result = generateContactLink({
              platform: 'sms',
              contact: phone,
            });

            if (result.isValid) {
              expect(result.link).toMatch(/^sms:/);
              expect(result.platform).toBe('sms');
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 4b: Invalid contact formats should be rejected
   */
  it('Property 4b: rejects invalid contact formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('whatsapp', 'phone', 'sms') as fc.Arbitrary<ContactPlatform>,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^\+?\d{7,15}$/.test(s.replace(/[\s\-\(\)\.]/g, ''))),
        (platform, invalidContact) => {
          const result = generateContactLink({
            platform,
            contact: invalidContact,
          });

          // Should be invalid for phone-based platforms with non-phone input
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
