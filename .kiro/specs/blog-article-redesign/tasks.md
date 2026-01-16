# Implementation Plan: Blog Article Redesign

## Overview

This implementation plan breaks down the blog article redesign into discrete coding tasks. The implementation follows a bottom-up approach: first creating the foundational components (icons, callouts), then the author section, followed by typography enhancements, and finally integration into the article page.

## Tasks

- [x] 1. Create SVG Icons Component
  - [x] 1.1 Create article-icons.tsx with SVG icon components
    - Create QuoteIcon, BulletIcon, TipIcon, WarningIcon, InfoIcon, NoteIcon, CheckIcon
    - Each icon accepts className, size, and aria-hidden props
    - Use currentColor for fill to inherit text color
    - Export all icons from the file
    - _Requirements: 4.2, 4.3, 4.4, 4.6_
  
  - [ ]* 1.2 Write property test for SVG icon accessibility
    - **Property 8: SVG Icon Accessibility**
    - Test that all icons have aria-hidden="true" by default
    - **Validates: Requirements 4.7, 9.2**

- [x] 2. Create Callout Box Component
  - [x] 2.1 Create article-callout.tsx component
    - Implement ArticleCallout component with type prop (tip, warning, info, note)
    - Use appropriate SVG icons from article-icons.tsx
    - Apply type-specific styling (colors, borders)
    - Support RTL layout with proper icon positioning
    - Add ARIA role="note" for accessibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 2.2 Write property test for callout accessibility
    - **Property 9: Callout Accessibility**
    - Test that callouts have appropriate ARIA roles
    - **Validates: Requirements 5.6, 9.3**

- [x] 3. Create Author Section Component
  - [x] 3.1 Add ArticleAuthor type to types.ts
    - Add ArticleAuthor interface with name, avatar, role, bio fields
    - Update Article interface to include optional author field
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.2 Create article-author.tsx component
    - Implement ArticleAuthor component with author, publishedAt, locale props
    - Display author avatar (or placeholder), name, role
    - Implement fallback to PineCalc when author not provided
    - Support RTL layout
    - Add proper accessibility labels
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 3.3 Write property test for author section content
    - **Property 11: Author Section Content**
    - Test that author name is displayed when provided
    - Test fallback to "PineCalc" when author not provided
    - **Validates: Requirements 6.1, 6.7**

- [x] 4. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhance Font Configuration
  - [x] 5.1 Update layout.tsx with additional fonts
    - Add Source Serif 4 font for English headings
    - Add IBM Plex Sans Arabic font for Arabic body text
    - Define CSS variables for font families
    - Apply font variables to body element
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 5.2 Create article-typography.css stylesheet
    - Define CSS custom properties for typography (font sizes, line heights, spacing)
    - Create drop cap styles for first paragraph (RTL and LTR)
    - Create blockquote styles with quote icon background
    - Create custom list bullet styles
    - Create code block and inline code styles
    - Create emphasis and strong text styles
    - Add dark mode overrides
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 6. Enhance ArticleContent Component
  - [x] 6.1 Update article-content.tsx with enhanced typography
    - Import article-typography.css
    - Add locale prop for RTL/LTR detection
    - Apply typography CSS classes to article element
    - Ensure drop cap is applied via CSS (remove JS-based approach)
    - Remove any emoji characters from content processing
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 4.1_
  
  - [ ]* 6.2 Write property test for no emoji characters
    - **Property 4: No Emoji Characters**
    - Test that rendered content does not contain emoji Unicode characters
    - **Validates: Requirements 4.1**
  
  - [ ]* 6.3 Write property test for heading hierarchy
    - **Property 2: Heading Font Hierarchy**
    - Test that h2 > h3 > h4 font sizes
    - **Validates: Requirements 1.8**
  
  - [ ]* 6.4 Write property test for line height
    - **Property 3: Line Height Within Range**
    - Test that body text line-height is between 1.6 and 1.8
    - **Validates: Requirements 1.5**

- [x] 7. Checkpoint - Ensure typography tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrate Components into Article Page
  - [x] 8.1 Update article-detail-content.tsx
    - Import ArticleAuthor component
    - Add ArticleAuthor section after hero, before main content
    - Pass article.author and locale to ArticleAuthor
    - Pass locale to ArticleContent component
    - _Requirements: 6.5_
  
  - [ ]* 8.2 Write property test for RTL/LTR layout support
    - **Property 10: RTL/LTR Layout Support**
    - Test that blockquotes have correct border side based on locale
    - Test that list bullets are positioned correctly
    - **Validates: Requirements 4.5, 5.5**

- [ ] 9. Add Translations
  - [x] 9.1 Update en.json with author-related translations
    - Add "author" section with name, role, bio, writtenBy labels
    - Add callout labels (tip, warning, info, note)
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ] 9.2 Update ar.json with author-related translations
    - Add Arabic translations for author section
    - Add Arabic translations for callout labels
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 10. Dark Mode and Accessibility
  - [ ]* 10.1 Write property test for dark mode contrast
    - **Property 13: Dark Mode Contrast**
    - Test that text/background contrast meets WCAG AA in dark mode
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 9.1**
  
  - [ ]* 10.2 Write property test for heading hierarchy validity
    - **Property 14: Heading Hierarchy Validity**
    - Test that headings follow proper h2 > h3 > h4 hierarchy
    - **Validates: Requirements 9.4**

- [ ] 11. Responsive Design Verification
  - [ ]* 11.1 Write property test for responsive line length
    - **Property 15: Responsive Line Length**
    - Test that article max-width constrains line length appropriately
    - **Validates: Requirements 8.2**

- [ ] 12. Final Checkpoint - Full Integration Test
  - Ensure all tests pass, ask the user if questions arise.
  - Verify article page renders correctly in both locales
  - Verify dark mode styling works correctly
  - Verify responsive layout on mobile/tablet/desktop

- [x] 13. Export Components
  - [x] 13.1 Update blog components index
    - Export ArticleIcons from components/blog/index.ts (if exists)
    - Export ArticleCallout from components/blog/index.ts
    - Export ArticleAuthor from components/blog/index.ts
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript and follows existing project patterns
- All components support RTL (Arabic) and LTR (English) layouts
- Dark mode support is built into all styling
