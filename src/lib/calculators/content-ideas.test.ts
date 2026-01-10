/**
 * Property-Based Tests for Content Idea Generator
 * 
 * Feature: marketing-content-tools, Property 13: Content Ideas Categorization
 * Validates: Requirements 14.1, 14.5
 */

import fc from 'fast-check';
import { 
  getContentIdeas, 
  StoreCategory, 
  ContentType, 
  Platform,
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS 
} from './content-ideas';

/**
 * Custom arbitrary for store categories
 */
function storeCategory(): fc.Arbitrary<StoreCategory> {
  return fc.constantFrom('fashion', 'electronics', 'beauty', 'food', 'home', 'sports', 'kids', 'general');
}

/**
 * All content types
 */
const ALL_CONTENT_TYPES: ContentType[] = ['product_announcement', 'promotion', 'seasonal', 'engagement', 'educational'];

/**
 * All platforms
 */
const ALL_PLATFORMS: Platform[] = ['instagram', 'twitter', 'tiktok', 'snapchat', 'general'];

describe('Content Idea Generator Properties', () => {
  /**
   * Property 13: Content Ideas Categorization
   * 
   * For any store category, the content idea generator SHALL return ideas that are 
   * properly categorized by both content type and platform, with no idea appearing 
   * in an incorrect category.
   * 
   * Validates: Requirements 14.1, 14.5
   */
  it('Property 13a: ideas are properly categorized by type', () => {
    fc.assert(
      fc.property(
        storeCategory(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (category, language) => {
          const result = getContentIdeas(category, language);

          // Check that byType contains only valid content types
          for (const type of Object.keys(result.byType) as ContentType[]) {
            expect(ALL_CONTENT_TYPES).toContain(type);
            
            // Each idea in this type category should have the correct type
            for (const idea of result.byType[type]) {
              expect(idea.type).toBe(type);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13b: ideas are properly categorized by platform', () => {
    fc.assert(
      fc.property(
        storeCategory(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (category, language) => {
          const result = getContentIdeas(category, language);

          // Check that byPlatform contains only valid platforms
          for (const platform of Object.keys(result.byPlatform) as Platform[]) {
            expect(ALL_PLATFORMS).toContain(platform);
            
            // Each idea in this platform category should have the correct platform
            for (const idea of result.byPlatform[platform]) {
              expect(idea.platform).toBe(platform);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13c: all ideas appear in both byType and byPlatform', () => {
    fc.assert(
      fc.property(
        storeCategory(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (category, language) => {
          const result = getContentIdeas(category, language);

          for (const idea of result.ideas) {
            // Idea should appear in its type category
            expect(result.byType[idea.type]).toContainEqual(idea);
            
            // Idea should appear in its platform category
            expect(result.byPlatform[idea.platform]).toContainEqual(idea);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13d: each idea has required fields', () => {
    fc.assert(
      fc.property(
        storeCategory(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (category, language) => {
          const result = getContentIdeas(category, language);

          for (const idea of result.ideas) {
            expect(idea.id).toBeDefined();
            expect(idea.id.length).toBeGreaterThan(0);
            
            expect(idea.title).toBeDefined();
            expect(idea.title.length).toBeGreaterThan(0);
            
            expect(idea.template).toBeDefined();
            expect(idea.template.length).toBeGreaterThan(0);
            
            expect(idea.type).toBeDefined();
            expect(ALL_CONTENT_TYPES).toContain(idea.type);
            
            expect(idea.platform).toBeDefined();
            expect(ALL_PLATFORMS).toContain(idea.platform);
            
            expect(idea.tips).toBeDefined();
            expect(Array.isArray(idea.tips)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13e: returns ideas for all categories', () => {
    const categories: StoreCategory[] = ['fashion', 'electronics', 'beauty', 'food', 'home', 'sports', 'kids', 'general'];
    
    for (const category of categories) {
      const result = getContentIdeas(category, 'en');
      
      // Each category should have at least one idea
      expect(result.ideas.length).toBeGreaterThan(0);
    }
  });

  it('Property 13f: language affects output content', () => {
    fc.assert(
      fc.property(
        storeCategory(),
        (category) => {
          const enResult = getContentIdeas(category, 'en');
          const arResult = getContentIdeas(category, 'ar');

          // Same number of ideas
          expect(enResult.ideas.length).toBe(arResult.ideas.length);
          
          // But different content (titles should differ)
          if (enResult.ideas.length > 0) {
            // At least some titles should be different (localized)
            const enTitles = enResult.ideas.map(i => i.title);
            const arTitles = arResult.ideas.map(i => i.title);
            
            // Not all titles should be the same
            const allSame = enTitles.every((t, i) => t === arTitles[i]);
            expect(allSame).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
