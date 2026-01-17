# Implementation Plan: Marketing & Content Tools

## Overview

This implementation plan covers 14 new tools divided into Marketing Tools (7) and Content Tools (7). The implementation follows the existing project patterns and builds incrementally, with each task building on previous work.

## Tasks

- [-] 1. Setup and Infrastructure
  - [x] 1.1 Add new tool categories to tools.ts
    - Add "marketing" and "content" categories to ToolCategory type
    - Add category labels to categories array
    - Import required Lucide icons
    - _Requirements: All tools need category registration_

  - [x] 1.2 Install required dependencies
    - Install qrcode library for QR code generation
    - Install fast-check for property-based testing
    - _Requirements: 3.1, 3.5 (QR generation)_

  - [x] 1.3 Add translation keys structure for new tools
    - Add marketing tools section to ar.json and en.json
    - Add content tools section to ar.json and en.json
    - Include SEO content placeholders for all tools
    - Add category labels for "marketing" and "content" in both languages
    - Ensure all keys follow existing naming conventions
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 2. Marketing Tools - Link Generators

  - [x] 2.1 Implement WhatsApp Link Generator logic
    - Create src/lib/calculators/whatsapp-link.ts
    - Implement generateWhatsAppLink function
    - Implement validatePhoneNumber function
    - Implement formatWhatsAppMessage function with Arabic/English templates
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

  - [x]* 2.2 Write property test for WhatsApp Link Generator
    - **Property 1: WhatsApp Link Generation Validity**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 2.3 Create WhatsApp Link Generator component
    - Create src/components/tools/whatsapp-link-generator.tsx
    - Implement form with phone number, country code, product name inputs
    - Add optional fields (price, quantity, custom message)
    - Integrate QR code display
    - Add copy-to-clipboard functionality
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 2.4 Implement UTM Builder logic
    - Create src/lib/calculators/utm-builder.ts
    - Implement buildUTMUrl function
    - Implement validateUrl function
    - Implement encodeUTMParams function
    - Add TikTok and Snapchat presets
    - _Requirements: 2.1, 2.2, 2.4, 2.6_

  - [x]* 2.5 Write property test for UTM Builder
    - **Property 2: UTM URL Generation and Encoding**
    - **Validates: Requirements 2.1, 2.4, 2.6**

  - [x] 2.6 Create UTM Builder component
    - Create src/components/tools/utm-builder.tsx
    - Implement form with URL and UTM parameter inputs
    - Add preset buttons for TikTok/Snapchat
    - Add validation feedback for missing required fields
    - Add copy-to-clipboard functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 3. Checkpoint - Marketing Link Generators
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Marketing Tools - QR and Contact Links

  - [x] 4.1 Implement QR Code Generator logic
    - Create src/lib/calculators/qr-code.ts
    - Implement generateQRCode function using qrcode library
    - Implement logo embedding with size validation
    - Implement color customization
    - Generate both PNG and SVG formats
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 4.2 Write property test for QR Code Generator

    - **Property 3: QR Code Round-Trip**
    - **Validates: Requirements 3.1**

  - [x] 4.3 Create QR Code Generator component
    - Create src/components/tools/qr-code-generator.tsx
    - Implement form with URL/text input
    - Add color pickers for foreground/background
    - Add logo upload with preview
    - Add download buttons for PNG/SVG
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.4 Implement Link Shortener logic
    - Create src/lib/calculators/link-shortener.ts
    - Implement generateShortCode function
    - Implement createShortLink function
    - Implement validateAlias function
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.5 Create Link Shortener component
    - Create src/components/tools/link-shortener.tsx
    - Implement form with URL and optional alias inputs
    - Add influencer name field
    - Display shortened link with copy button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.6 Implement Contact Link Generator logic
    - Create src/lib/calculators/contact-link.ts
    - Implement generateContactLink function for all platforms
    - Implement validateContact function per platform
    - _Requirements: 5.1, 5.2, 5.3_

  - [x]* 4.7 Write property test for Contact Link Generator
    - **Property 4: Contact Link Platform Formats**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 4.8 Create Contact Link Generator component
    - Create src/components/tools/contact-link-generator.tsx
    - Implement platform selector (WhatsApp, Telegram, Email, Phone, SMS)
    - Add contact input with platform-specific validation
    - Add optional message/subject fields
    - Display generated link with QR code
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Checkpoint - QR and Contact Links
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Marketing Tools - Calculators

  - [x] 6.1 Implement Conversion Rate Calculator logic
    - Create src/lib/calculators/conversion-rate.ts
    - Implement calculateConversionRate function
    - Add benchmark comparison logic
    - Implement getRecommendations function
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x]* 6.2 Write property test for Conversion Rate Calculator
    - **Property 5: Conversion Rate Calculation**
    - **Validates: Requirements 6.1, 6.4**

  - [x] 6.3 Create Conversion Rate Calculator component
    - Create src/components/tools/conversion-rate-calculator.tsx
    - Implement form with visitors and conversions inputs
    - Add time period selector
    - Display rate with benchmark comparison
    - Show recommendations based on rate
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.4 Implement LTV Calculator logic
    - Create src/lib/calculators/ltv-calculator.ts
    - Implement calculateLTV function
    - Implement LTV:CAC ratio calculation
    - Implement getLTVRecommendations function
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [x]* 6.5 Write property test for LTV Calculator
    - **Property 6: LTV Calculation and Warning**
    - **Validates: Requirements 7.1, 7.2, 7.5**

  - [x] 6.6 Create LTV Calculator component
    - Create src/components/tools/ltv-calculator.tsx
    - Implement form with AOV, frequency, lifespan inputs
    - Add optional CAC input
    - Display LTV with ratio and benchmarks
    - Show warning when LTV < CAC
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Checkpoint - Marketing Calculators
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Content Tools - Policy Generators

  - [x] 8.1 Implement Refund Policy Generator logic
    - Create src/lib/calculators/policy-generator.ts
    - Implement generateRefundPolicy function
    - Create policy templates for Arabic and English
    - Add Saudi e-commerce regulation compliance
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x]* 8.2 Write property test for Refund Policy Generator
    - **Property 7: Policy Document Completeness**
    - **Validates: Requirements 8.1, 8.5**

  - [x] 8.3 Create Refund Policy Generator component
    - Create src/components/tools/refund-policy-generator.tsx
    - Implement form with store name, return window, conditions
    - Add refund method selector
    - Add product category customization
    - Display generated policy with copy/download buttons
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.4 Implement Terms of Service Generator logic
    - Create src/lib/calculators/terms-generator.ts
    - Implement generateTermsOfService function
    - Create clause templates for Arabic
    - Include standard e-commerce clauses
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x]* 8.5 Write property test for Terms Generator
    - **Property 8: Terms Document Generation**
    - **Validates: Requirements 9.1, 9.5**

  - [x] 8.6 Create Terms of Service Generator component
    - Create src/components/tools/terms-generator.tsx
    - Implement form with store info inputs
    - Add clause selector checkboxes
    - Add custom terms textarea
    - Display generated document with copy/download buttons
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Checkpoint - Policy Generators
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Content Tools - Text Utilities

  - [x] 10.1 Implement Description Cleaner logic
    - Create src/lib/calculators/description-cleaner.ts
    - Implement cleanDescription function
    - Add options for selective cleaning
    - Track removed items for reporting
    - _Requirements: 10.1, 10.2, 10.3_

  - [x]* 10.2 Write property test for Description Cleaner
    - **Property 9: Description Cleaning Preservation**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 10.3 Create Description Cleaner component
    - Create src/components/tools/description-cleaner.tsx
    - Implement textarea for input
    - Add cleaning option checkboxes
    - Display before/after comparison
    - Add copy button for cleaned text
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 10.4 Implement SEO Title Validator logic
    - Create src/lib/calculators/seo-validator.ts
    - Implement validateSEOTitle function
    - Implement detectKeywordStuffing function
    - Implement calculateSEOScore function
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x]* 10.5 Write property test for SEO Title Validator
    - **Property 10: SEO Title Validation Consistency**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

  - [x] 10.6 Create SEO Title Validator component
    - Create src/components/tools/seo-title-validator.tsx
    - Implement input field with character counter
    - Display score with visual indicator
    - Show issues list with severity
    - Display improvement suggestions
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Checkpoint - Text Utilities
  - All tests pass

- [x] 12. Content Tools - FAQ and Word Counter

  - [x] 12.1 Implement FAQ Generator logic
    - Create src/lib/calculators/faq-generator.ts
    - Implement generateFAQ function
    - Implement generateFAQSchema function for JSON-LD
    - Implement validateSchema function
    - Add pre-built FAQ templates
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [x]* 12.2 Write property test for FAQ Generator
    - **Property 11: FAQ Schema Validity**
    - **Validates: Requirements 12.1, 12.2, 12.5**

  - [x] 12.3 Create FAQ Generator component
    - Create src/components/tools/faq-generator.tsx
    - Implement dynamic Q&A input fields
    - Add template selector for common topics
    - Display formatted FAQ text
    - Display JSON-LD schema with copy button
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 12.4 Implement Word Counter logic
    - Create src/lib/calculators/word-counter.ts
    - Implement countWords function
    - Implement countArabicWords function
    - Implement calculateReadingTime function
    - Add SEO recommendations based on length
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 12.5 Write property test for Word Counter
    - **Property 12: Word Count Accuracy**
    - **Validates: Requirements 13.1, 13.4, 13.5**

  - [x] 12.6 Create Word Counter component
    - Create src/components/tools/word-counter.tsx
    - Implement textarea for input
    - Display word, character, sentence counts
    - Display reading time estimate
    - Show SEO status indicator
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 13. Checkpoint - FAQ and Word Counter
  - All tests pass

- [x] 14. Content Tools - Content Ideas

  - [x] 14.1 Implement Content Idea Generator logic
    - Create src/lib/calculators/content-ideas.ts
    - Create content templates for each store category
    - Implement getContentIdeas function
    - Organize ideas by type and platform
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

  - [x]* 14.2 Write property test for Content Idea Generator
    - **Property 13: Content Ideas Categorization**
    - **Validates: Requirements 14.1, 14.5**

  - [x] 14.3 Create Content Idea Generator component
    - Create src/components/tools/content-idea-generator.tsx
    - Implement category selector
    - Display ideas grouped by type and platform
    - Add copy button for each template
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 15. Integration and Registration

  - [x] 15.1 Register all new tools in tools.ts
    - Add all 14 tools to the tools array
    - Verify icon imports
    - Verify category assignments
    - _Requirements: All tools_

  - [x] 15.2 Export all components from index.ts
    - Add exports for all 14 new tool components
    - _Requirements: All tools_

  - [x] 15.3 Update tool-page-content.tsx
    - Add cases for all 14 new tool slugs
    - Import and render corresponding components
    - _Requirements: All tools_

- [x] 16. I18N - Internationalization and Translations

  - [x] 16.1 Add complete Arabic translations (ar.json)
    - Add all tool titles and descriptions in Arabic
    - Add all form labels, placeholders, and button texts
    - Add all result labels and status messages
    - Add all error messages in Arabic
    - Add SEO content (~300 words per tool) explaining:
      - ما هي هذه الأداة؟
      - كيف يتم الحساب؟ (المعادلة)
      - لماذا يحتاجها التاجر؟
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 16.2 Add complete English translations (en.json)
    - Add all tool titles and descriptions in English
    - Add all form labels, placeholders, and button texts
    - Add all result labels and status messages
    - Add all error messages in English
    - Add SEO content (~300 words per tool) explaining:
      - What is this tool?
      - How is it calculated? (Formula)
      - Why do merchants need it?
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 16.3 Ensure RTL support for Arabic
    - Verify all components render correctly in RTL mode
    - Test form layouts in Arabic locale
    - Verify number formatting for Arabic locale
    - Added dir="ltr" to number inputs in ltv-calculator.tsx and refund-policy-generator.tsx
    - _Requirements: All tools need proper RTL support_

- [-] 17. Share and Copy Functionality

  - [-] 17.1 Enhance shared components for new tools
    - Ensure ResultCard supports all new result types
    - Add "Download as Image" functionality
    - Verify share buttons work with new tools
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 18. Final Checkpoint
  - All 55 tests pass across 13 test suites
  - Verify all 14 tools are accessible and functional
  - Verify Arabic and English translations are complete
  - Verify SEO content is displayed correctly
  - Test RTL layout for Arabic locale
  - Verify all copy/share functionality works in both languages

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- **I18N is critical**: All tools must support Arabic (RTL) and English (LTR) with complete translations
- **SEO content is essential**: Each tool needs ~300 words explaining what it is, how it works, and why merchants need it
