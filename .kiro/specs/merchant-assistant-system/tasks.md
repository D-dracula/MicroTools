# Implementation Plan: Merchant Assistant System

## Overview

This implementation plan breaks down the Merchant Assistant System into discrete coding tasks. The system will be built incrementally, starting with shared components, then core modules, and finally integration and workflow orchestration. Each task builds on previous work to ensure no orphaned code.

## Tasks

- [x] 1. Set up project structure and shared types
  - Create directory structure: `src/lib/merchant-assistant/` and `src/components/merchant-assistant/`
  - Define TypeScript interfaces for all modules (ChatMessage, WorkflowStage, ModuleResult, etc.)
  - Create constants file with shipping rates, customs duties, payment fees, and VAT rates
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. Implement API Key Management Components
  - [x] 2.1 Create Exa Key Manager component
    - Implement `exa-key-manager.tsx` with validation, storage, and UI
    - Add Exa API validation function
    - Store encrypted key in localStorage
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 2.2 Create SeeDream Key Manager component
    - Implement `seedream-key-manager.tsx` with Access Key ID and Secret Access Key fields
    - Add BytePlus SeeDream credential validation function
    - Store encrypted credentials in localStorage
    - Display quota/credits remaining
    - _Requirements: 2.8, 2.9, 2.10, 2.11_

  - [ ]* 2.3 Write property test for API Key Validation Idempotence
    - **Property 7: API Key Validation Idempotence**
    - Test that validating same key multiple times returns consistent results
    - **Validates: Requirements 2.2, 2.6, 2.10**

- [x] 3. Implement Logistics Profit Architect Module
  - [x] 3.1 Create cost calculation logic
    - Implement `logistics-profit-architect.ts` with calculateProfit function
    - Calculate shipping cost based on weight and dimensions
    - Calculate customs duty based on product category
    - Calculate payment gateway fees
    - Calculate VAT (15% for Saudi Arabia)
    - Calculate total landed cost and cost per unit
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 3.2 Write property test for Cost Calculation Accuracy
    - **Property 1: Cost Calculation Accuracy**
    - Generate random valid cost inputs
    - Verify sum of components equals total with 0.01 tolerance
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

  - [x] 3.3 Implement breakeven and profit analysis
    - Calculate breakeven selling price
    - Generate profit margin analysis at different price points
    - _Requirements: 4.7, 4.9_

  - [ ]* 3.4 Write property test for Breakeven Price Validity
    - **Property 2: Breakeven Price Validity**
    - Generate random cost breakdowns
    - Verify breakeven >= cost per unit
    - **Validates: Requirements 4.7**

  - [x] 3.5 Implement budget scenario planning
    - Calculate optimal order quantity for given budget
    - Consider minimum order quantities
    - Factor in shipping cost tiers (bulk discounts)
    - Generate conservative, moderate, and aggressive scenarios
    - Calculate expected ROI for each scenario
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 3.6 Write property test for Budget Scenario Consistency
    - **Property 3: Budget Scenario Consistency**
    - Generate random budgets and costs
    - Verify quantity * cost <= budget for all scenarios
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 3.7 Write property test for ROI Calculation Correctness
    - **Property 4: ROI Calculation Correctness**
    - Generate random scenarios
    - Verify ROI = (profit / investment) * 100
    - **Validates: Requirements 8.5**

- [ ] 4. Checkpoint - Ensure profit calculation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Opportunity Scout Module
  - [x] 5.1 Create Exa search integration
    - Implement `opportunity-scout.ts` with searchOpportunities function
    - Integrate with Exa API for market gap search
    - Search for stock availability complaints
    - Search for quality complaints in reviews
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 5.2 Implement opportunity analysis with OpenRouter
    - Use AI to analyze search results and identify opportunities
    - Calculate confidence scores (0-100)
    - Estimate market size indicators
    - Rank opportunities by confidence score
    - _Requirements: 3.2, 3.3, 3.6, 3.8_

  - [ ]* 5.3 Write property test for Opportunity Ranking Consistency
    - **Property 5: Opportunity Ranking Consistency**
    - Generate random opportunity lists
    - Verify sorted by confidence score descending
    - Verify all scores between 0-100
    - **Validates: Requirements 3.3, 3.6, 3.8**

  - [x] 5.4 Implement fallback for no results
    - Suggest alternative categories when no opportunities found
    - _Requirements: 3.7_

- [-] 6. Implement Visual Identity Creator Module (SeeDream 4.5)
  - [x] 6.1 Create BytePlus SeeDream API client
    - Implement `seedream-client.ts` with SeeDreamClient class
    - Add authentication with Access Key ID and Secret Access Key
    - Implement generateWhiteBackground method
    - Implement generateLifestyleImage method
    - Implement enhanceImage method
    - Implement removeBackground method
    - Implement getQuota method
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.2 Create Visual Identity Creator logic
    - Implement `visual-identity-creator.ts` with processImages function
    - Download and validate input images
    - Process images through SeeDream 4.5
    - Optimize output for e-commerce (size, format)
    - Support batch processing
    - Track credits usage
    - _Requirements: 5.5, 5.6, 5.8, 5.9_

  - [ ]* 6.3 Write property test for Image Processing Completeness
    - **Property 13: Image Processing Completeness**
    - Generate random image batches
    - Verify all images processed with valid URLs
    - **Validates: Requirements 5.5, 5.6, 5.8**

  - [x] 6.4 Implement marketing content generation
    - Use OpenRouter to generate bilingual marketing descriptions
    - Generate titles, descriptions, bullet points in Arabic and English
    - Generate SEO keywords
    - _Requirements: 7.5, 9.3_

  - [ ]* 6.5 Write property test for Bilingual Marketing Content
    - **Property 12: Bilingual Marketing Content**
    - Generate random products
    - Verify both Arabic and English content present
    - **Validates: Requirements 9.3, 7.5**

- [ ] 7. Checkpoint - Ensure all module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Chained Workflow Orchestration
  - [x] 8.1 Create intent detection
    - Implement `chained-workflow.ts` with detectIntent function
    - Use OpenRouter to detect user intent (search, calculate, create, full-workflow)
    - Extract parameters from user message
    - _Requirements: 6.1_

  - [x] 8.2 Implement workflow execution
    - Execute modules in order: Scout → Calculate → Create
    - Pass results between stages
    - Handle partial failures gracefully
    - Allow parameter modification between stages
    - _Requirements: 6.2, 6.3, 6.4, 6.6, 6.8_

  - [ ]* 8.3 Write property test for Workflow Stage Progression
    - **Property 6: Workflow Stage Progression**
    - Generate random workflow executions
    - Verify stages progress in order
    - Verify stage doesn't start until previous completes
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [x] 8.3 Implement progress tracking
    - Track progress for each stage
    - Emit progress updates via callback
    - _Requirements: 6.7_

- [x] 9. Implement Project File Generator
  - [x] 9.1 Create project file structure
    - Implement `project-file-generator.ts` with generateProjectFile function
    - Compile results from all three modules
    - Include supplier information, cost breakdown, images, marketing content
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8_

  - [ ]* 9.2 Write property test for Export Content Completeness
    - **Property 10: Export Content Completeness**
    - Generate random project files
    - Verify all required sections present
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.7**

  - [x] 9.3 Implement PDF export
    - Generate PDF with all project data
    - Include embedded images
    - Support bilingual export
    - _Requirements: 7.6, 7.7, 9.4_

  - [x] 9.4 Implement Excel export
    - Generate Excel with structured data
    - Include image links
    - Support bilingual export
    - _Requirements: 7.6, 7.7, 9.4_

- [ ] 10. Checkpoint - Ensure workflow and export tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Chat-Dashboard UI
  - [x] 11.1 Create base Chat-Dashboard component
    - Implement `chat-dashboard.tsx` with split layout (40% chat, 60% results)
    - Support RTL layout for Arabic
    - Implement responsive design
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 11.2 Implement chat panel
    - Message input with send button
    - Message history display
    - Support for file attachments
    - Persist conversation in session
    - _Requirements: 1.7_

  - [ ]* 11.3 Write property test for Session State Persistence
    - **Property 9: Session State Persistence**
    - Generate random session states
    - Verify save → load preserves all messages
    - **Validates: Requirements 1.7**

  - [x] 11.4 Implement results panel
    - Dynamic rendering based on result type
    - Interactive data grid for tables
    - Image gallery for processed images
    - _Requirements: 1.3, 1.5, 1.6_

  - [x] 11.5 Implement Focus Mode
    - Add focus mode button to maximize panels
    - Add minimize button to restore split view
    - _Requirements: 1.9, 1.10_

  - [x] 11.6 Implement Progress Bar
    - Display three workflow stages
    - Highlight current stage
    - Show completion percentage
    - _Requirements: 1.11, 1.12_

  - [ ]* 11.7 Write property test for Progress Bar State Consistency
    - **Property 15: Progress Bar State Consistency**
    - Generate random workflow states
    - Verify progress bar reflects state accurately
    - **Validates: Requirements 1.12**

  - [x] 11.8 Implement drag-and-drop file upload
    - Support drag-and-drop for images
    - Validate file types (jpg, png, webp, gif)
    - Display preview thumbnails
    - _Requirements: 1.13, 1.14_

  - [ ]* 11.9 Write property test for File Type Validation
    - **Property 14: File Type Validation**
    - Generate random file types
    - Verify only valid image types accepted
    - **Validates: Requirements 1.14**

- [x] 12. Implement Settings Panel
  - [x] 12.1 Create collapsible settings panel
    - Three sections: AI Keys, Search & Image Keys, Display Preferences
    - Integrate existing ApiKeyManager for OpenRouter
    - Integrate ExaKeyManager
    - Integrate SeeDreamKeyManager
    - Integrate CurrencySelector
    - Integrate ResponseLanguageSelector
    - _Requirements: 2.1, 2.4, 2.12, 2.13, 2.14, 2.15, 2.17_

  - [ ]* 12.2 Write property test for Currency Formatting Round-Trip
    - **Property 8: Currency Formatting Round-Trip**
    - Generate random amounts and currencies
    - Verify format → parse ≈ original (within 0.01)
    - **Validates: Requirements 2.12, 2.16**

  - [x] 12.3 Implement preference reactivity
    - Apply preference changes immediately to all displays
    - _Requirements: 2.16_

- [x] 13. Implement Multi-Language Support
  - [x] 13.1 Add translations for Merchant Assistant
    - Add Arabic translations to messages/ar.json
    - Add English translations to messages/en.json
    - _Requirements: 9.1, 9.5_

  - [x] 13.2 Implement language-aware responses
    - Detect query language
    - Respond in same language as query
    - _Requirements: 9.2_

  - [ ]* 13.3 Write property test for Response Language Matching
    - **Property 11: Response Language Matching**
    - Generate queries in different languages
    - Verify response language matches input
    - **Validates: Requirements 9.2**

- [x] 14. Create tool page and routing
  - [x] 14.1 Create Merchant Assistant tool page
    - Create `src/app/[locale]/tools/merchant-assistant/page.tsx`
    - Integrate ChatDashboard component
    - Add SEO metadata
    - _Requirements: 1.1_

  - [x] 14.2 Add tool to tools registry
    - Add merchant-assistant to tools.ts
    - Add tool card with icon and description
    - _Requirements: 1.1_

- [ ] 15. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete workflow: describe idea → search → calculate → create → export

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses existing shared components (ApiKeyManager, CurrencySelector, ResponseLanguageSelector)
- BytePlus SeeDream 4.5 requires Access Key ID and Secret Access Key (not a single API key)
