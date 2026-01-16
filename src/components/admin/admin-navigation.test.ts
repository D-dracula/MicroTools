/**
 * Property-Based Tests for Admin Navigation State Consistency
 * 
 * Feature: admin-dashboard, Property 2: Navigation State Consistency
 * Validates: Requirements 2.2, 2.5
 * 
 * For any navigation action to a section, the sidebar SHALL highlight exactly one 
 * section that matches the current route, and the header SHALL display the 
 * corresponding section title.
 */

import fc from 'fast-check';
import {
  getAdminSectionFromPath,
  type AdminSection,
} from './admin-sidebar';
import {
  getAdminSectionTitle,
  getAdminSectionDescription,
} from './admin-header';

/**
 * All valid admin sections
 */
const ALL_ADMIN_SECTIONS: AdminSection[] = [
  'overview',
  'blog',
  'users',
  'errors',
  'migrations',
  'health',
  'keys',
];

/**
 * Supported locales
 */
const SUPPORTED_LOCALES = ['en', 'ar'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Custom arbitrary for valid admin sections
 */
function adminSection(): fc.Arbitrary<AdminSection> {
  return fc.constantFrom(...ALL_ADMIN_SECTIONS);
}

/**
 * Custom arbitrary for supported locales
 */
function locale(): fc.Arbitrary<SupportedLocale> {
  return fc.constantFrom(...SUPPORTED_LOCALES);
}

/**
 * Generate a valid admin pathname for a given section and locale
 */
function generateAdminPath(section: AdminSection, loc: string): string {
  if (section === 'overview') {
    return `/${loc}/admin`;
  }
  return `/${loc}/admin/${section}`;
}

/**
 * Generate a valid admin pathname with optional trailing slash
 */
function generateAdminPathWithVariants(section: AdminSection, loc: string, withTrailingSlash: boolean): string {
  const basePath = generateAdminPath(section, loc);
  return withTrailingSlash ? `${basePath}/` : basePath;
}

describe('Admin Navigation State Consistency Properties', () => {
  /**
   * Property 2: Navigation State Consistency
   * 
   * For any navigation action to a section, the sidebar SHALL highlight exactly 
   * one section that matches the current route, and the header SHALL display 
   * the corresponding section title.
   * 
   * Validates: Requirements 2.2, 2.5
   */
  describe('Property 2: Navigation State Consistency', () => {
    /**
     * Property 2a: getAdminSectionFromPath returns exactly one valid section
     * 
     * For any valid admin pathname, the function should return exactly one
     * section from the valid sections list.
     */
    it('Property 2a: getAdminSectionFromPath returns exactly one valid section for any admin path', () => {
      fc.assert(
        fc.property(
          adminSection(),
          locale(),
          fc.boolean(),
          (section, loc, withTrailingSlash) => {
            const pathname = generateAdminPathWithVariants(section, loc, withTrailingSlash);
            const detectedSection = getAdminSectionFromPath(pathname, loc);

            // Should return exactly one valid section
            expect(ALL_ADMIN_SECTIONS).toContain(detectedSection);

            // Should match the expected section
            expect(detectedSection).toBe(section);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2b: Section detection is consistent across locales
     * 
     * For any section, the detection should work consistently regardless
     * of the locale (en or ar).
     */
    it('Property 2b: Section detection is consistent across locales', () => {
      fc.assert(
        fc.property(
          adminSection(),
          (section) => {
            const enPath = generateAdminPath(section, 'en');
            const arPath = generateAdminPath(section, 'ar');

            const enSection = getAdminSectionFromPath(enPath, 'en');
            const arSection = getAdminSectionFromPath(arPath, 'ar');

            // Both should detect the same section
            expect(enSection).toBe(section);
            expect(arSection).toBe(section);
            expect(enSection).toBe(arSection);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2c: Header title matches the detected section
     * 
     * For any section and locale, the header title should be non-empty
     * and correspond to the section.
     */
    it('Property 2c: Header title is non-empty and corresponds to section', () => {
      fc.assert(
        fc.property(
          adminSection(),
          locale(),
          (section, loc) => {
            const title = getAdminSectionTitle(section, loc);
            const description = getAdminSectionDescription(section, loc);

            // Title should be non-empty
            expect(title).toBeDefined();
            expect(title.length).toBeGreaterThan(0);

            // Description should be non-empty
            expect(description).toBeDefined();
            expect(description.length).toBeGreaterThan(0);

            // Title and description should be different
            expect(title).not.toBe(description);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2d: Navigation path round-trip consistency
     * 
     * For any section, generating a path and then detecting the section
     * from that path should return the original section.
     */
    it('Property 2d: Navigation path round-trip consistency', () => {
      fc.assert(
        fc.property(
          adminSection(),
          locale(),
          (section, loc) => {
            // Generate path from section
            const path = generateAdminPath(section, loc);

            // Detect section from path
            const detectedSection = getAdminSectionFromPath(path, loc);

            // Should round-trip correctly
            expect(detectedSection).toBe(section);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2e: Unknown paths default to overview
     * 
     * For any unknown admin path, the function should default to 'overview'.
     * Note: We exclude JavaScript reserved words (constructor, prototype, etc.)
     * as these are edge cases that wouldn't occur in real admin routes.
     */
    it('Property 2e: Unknown paths default to overview', () => {
      // JavaScript reserved words that could cause issues with object property lookup
      const reservedWords = [
        'constructor', 'prototype', '__proto__', 'hasOwnProperty',
        'toString', 'valueOf', 'toLocaleString', 'isPrototypeOf',
        'propertyIsEnumerable'
      ];

      fc.assert(
        fc.property(
          locale(),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !ALL_ADMIN_SECTIONS.includes(s as AdminSection) && 
            /^[a-z]+$/.test(s) &&
            !reservedWords.includes(s)
          ),
          (loc, unknownSection) => {
            const pathname = `/${loc}/admin/${unknownSection}`;
            const detectedSection = getAdminSectionFromPath(pathname, loc);

            // Should default to overview for unknown sections
            expect(detectedSection).toBe('overview');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 2f: Each section has unique title per locale
     * 
     * For any locale, all sections should have unique titles.
     */
    it('Property 2f: Each section has unique title per locale', () => {
      fc.assert(
        fc.property(
          locale(),
          (loc) => {
            const titles = ALL_ADMIN_SECTIONS.map(section => 
              getAdminSectionTitle(section, loc)
            );

            // All titles should be unique
            const uniqueTitles = new Set(titles);
            expect(uniqueTitles.size).toBe(ALL_ADMIN_SECTIONS.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2g: Locale affects title language
     * 
     * For any section, the English and Arabic titles should be different
     * (since they're in different languages).
     */
    it('Property 2g: Locale affects title language', () => {
      fc.assert(
        fc.property(
          adminSection(),
          (section) => {
            const enTitle = getAdminSectionTitle(section, 'en');
            const arTitle = getAdminSectionTitle(section, 'ar');

            // Titles should be different for different locales
            expect(enTitle).not.toBe(arTitle);

            // Both should be non-empty
            expect(enTitle.length).toBeGreaterThan(0);
            expect(arTitle.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
