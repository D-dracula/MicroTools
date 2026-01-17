# Requirements Document

## Introduction

The Merchant Assistant System is an AI-powered platform that guides e-commerce merchants from product discovery to market-ready listings. It combines three integrated modules: Opportunity Scout (market gap analysis), Logistics Profit Architect (comprehensive cost calculation), and Visual Identity Creator (professional image generation). The system operates through a chat-dashboard interface where merchants interact via conversation while seeing real-time results on a dynamic dashboard.

## Glossary

- **Merchant_Assistant**: The main AI-powered system that orchestrates all three modules
- **Opportunity_Scout**: Module that analyzes market gaps and identifies high-demand products
- **Logistics_Profit_Architect**: Module that calculates comprehensive costs and breakeven points
- **Visual_Identity_Creator**: Module that transforms supplier images into professional product photos
- **Chat_Dashboard**: The unified interface with conversation on the left and dynamic results on the right
- **Breakeven_Point**: The minimum selling price required to avoid losses
- **Market_Gap**: Products with high demand but poor availability or quality
- **Chained_Agent**: Sequential AI tasks that pass results between modules
- **Project_File**: The complete output containing supplier info, cost analysis, and marketing assets
- **Focus_Mode**: UI mode that maximizes a single panel for detailed viewing
- **Progress_Bar**: Visual indicator showing current stage and completion percentage
- **API_Key_Manager**: Component for managing OpenRouter API key with validation and storage
- **Currency_Selector**: Component for selecting display currency with 14+ supported currencies
- **Exa_Key_Manager**: Component for managing Exa search API key with validation
- **SeeDream_Key_Manager**: Component for managing BytePlus SeeDream 4.5 credentials (Access Key ID + Secret Access Key)
- **Response_Language_Selector**: Component for selecting AI response language

## Requirements

### Requirement 1: Chat-Dashboard Interface

**User Story:** As a merchant, I want a unified interface with chat and dashboard panels, so that I can interact naturally while seeing results in real-time.

#### Acceptance Criteria

1. THE Chat_Dashboard SHALL display a conversation panel on the left side occupying 40% of the screen width
2. THE Chat_Dashboard SHALL display a dynamic results panel on the right side occupying 60% of the screen width
3. WHEN the Merchant_Assistant generates results, THE Chat_Dashboard SHALL automatically update the results panel with relevant data
4. THE Chat_Dashboard SHALL support RTL layout for Arabic users
5. WHEN results include tables, THE Chat_Dashboard SHALL render them in an interactive data grid
6. WHEN results include images, THE Chat_Dashboard SHALL display them in a gallery format
7. THE Chat_Dashboard SHALL persist conversation history within the session
8. WHEN the user starts a new project, THE Chat_Dashboard SHALL clear previous results and start fresh
9. THE Chat_Dashboard SHALL include a Focus_Mode button that maximizes the selected panel to full width
10. WHEN Focus_Mode is active, THE Chat_Dashboard SHALL display a minimize button to restore split view
11. THE Chat_Dashboard SHALL display a Progress_Bar showing the three workflow stages (Scout → Calculate → Create)
12. THE Progress_Bar SHALL indicate current stage with visual highlighting and completion percentage
13. THE Chat_Dashboard SHALL support drag-and-drop for uploading supplier images directly into the conversation
14. WHEN files are dropped, THE Chat_Dashboard SHALL validate file types and display preview thumbnails

### Requirement 2: API Key and Preferences Management

**User Story:** As a merchant, I want to manage my API keys and preferences (currency, language), so that I can use the AI, search, and image generation features with my preferred settings.

#### Acceptance Criteria

1. THE Chat_Dashboard SHALL include an API_Key_Manager component for OpenRouter API key input
2. THE API_Key_Manager SHALL validate the OpenRouter API key before allowing AI operations
3. THE API_Key_Manager SHALL securely store the validated keys in local storage with encryption
4. THE API_Key_Manager SHALL display remaining credits and estimated cost for operations
5. THE Chat_Dashboard SHALL include an Exa_Key_Manager component for Exa search API key input
6. THE Exa_Key_Manager SHALL validate the Exa API key before allowing search operations
7. WHEN Exa API key is not provided, THE Opportunity_Scout SHALL display a message requesting the key
8. THE Chat_Dashboard SHALL include a SeeDream_Key_Manager component for BytePlus SeeDream 4.5 credentials
9. THE SeeDream_Key_Manager SHALL accept Access Key ID and Secret Access Key fields
10. THE SeeDream_Key_Manager SHALL validate the SeeDream credentials before allowing image generation
11. WHEN SeeDream credentials are not provided, THE Visual_Identity_Creator SHALL display a message requesting the credentials
12. THE Chat_Dashboard SHALL include a Currency_Selector with support for SAR, USD, EUR, AED, and 10+ other currencies
13. THE Currency_Selector SHALL persist the selected currency preference in local storage
14. THE Chat_Dashboard SHALL include a Response_Language_Selector for AI response language
15. THE Response_Language_Selector SHALL support Arabic, English, French, Spanish, Turkish, and custom languages
16. WHEN preferences are changed, THE Chat_Dashboard SHALL apply them immediately to all displays
17. THE Chat_Dashboard SHALL display all preferences in a collapsible settings panel with three sections (AI Keys, Search & Image Keys, Display Preferences)

### Requirement 3: Opportunity Scout Module

**User Story:** As a merchant, I want to discover products with real market demand, so that I can invest in items that customers actually want.

#### Acceptance Criteria

1. WHEN a merchant specifies a product category, THE Opportunity_Scout SHALL search for market gaps using web search
2. THE Opportunity_Scout SHALL analyze customer complaints about product availability and quality
3. THE Opportunity_Scout SHALL return a ranked list of opportunity products with demand indicators
4. WHEN analyzing market gaps, THE Opportunity_Scout SHALL consider stock availability complaints
5. WHEN analyzing market gaps, THE Opportunity_Scout SHALL consider quality complaints in reviews
6. THE Opportunity_Scout SHALL provide confidence scores for each identified opportunity
7. WHEN no opportunities are found, THE Opportunity_Scout SHALL suggest alternative categories
8. THE Opportunity_Scout SHALL include estimated market size indicators for each opportunity

### Requirement 4: Logistics Profit Architect Module

**User Story:** As a merchant, I want comprehensive cost calculations including all fees, so that I know my exact breakeven point before investing.

#### Acceptance Criteria

1. WHEN a product is selected, THE Logistics_Profit_Architect SHALL calculate total landed cost
2. THE Logistics_Profit_Architect SHALL include purchase price from supplier
3. THE Logistics_Profit_Architect SHALL calculate shipping cost based on actual weight and dimensions
4. THE Logistics_Profit_Architect SHALL include customs duties based on product category and destination
5. THE Logistics_Profit_Architect SHALL include payment gateway fees (percentage + fixed)
6. THE Logistics_Profit_Architect SHALL include VAT calculations for Saudi Arabia (15%)
7. THE Logistics_Profit_Architect SHALL calculate the breakeven selling price
8. WHEN a budget is specified, THE Logistics_Profit_Architect SHALL calculate maximum purchasable quantity
9. THE Logistics_Profit_Architect SHALL provide profit margin analysis at different selling prices
10. IF customs duty rates are unavailable, THEN THE Logistics_Profit_Architect SHALL use conservative estimates and flag uncertainty

### Requirement 5: Visual Identity Creator Module (BytePlus SeeDream 4.5)

**User Story:** As a merchant, I want professional product images from supplier photos using AI image generation, so that my store looks premium without hiring photographers.

#### Acceptance Criteria

1. WHEN supplier image URLs are provided, THE Visual_Identity_Creator SHALL download and process them using BytePlus SeeDream 4.5
2. THE Visual_Identity_Creator SHALL use SeeDream 4.5 to enhance image quality and lighting
3. THE Visual_Identity_Creator SHALL use SeeDream 4.5 to remove or replace unprofessional backgrounds
4. THE Visual_Identity_Creator SHALL generate multiple image variants (white background, lifestyle, etc.) using SeeDream 4.5
5. THE Visual_Identity_Creator SHALL optimize images for e-commerce platforms (size, format)
6. THE Visual_Identity_Creator SHALL store processed images in cloud storage
7. WHEN processing fails, THE Visual_Identity_Creator SHALL provide clear error messages
8. THE Visual_Identity_Creator SHALL support batch processing of multiple product images
9. THE Visual_Identity_Creator SHALL display SeeDream credits usage after processing

### Requirement 6: Chained Agent Workflow

**User Story:** As a merchant, I want to describe my business idea and receive a complete project file, so that I can start selling immediately.

#### Acceptance Criteria

1. WHEN a merchant describes a business idea with category and budget, THE Merchant_Assistant SHALL initiate the chained workflow
2. THE Merchant_Assistant SHALL execute Opportunity_Scout as the first task in the chain
3. THE Merchant_Assistant SHALL pass opportunity results to Logistics_Profit_Architect as the second task
4. THE Merchant_Assistant SHALL pass cost analysis to Visual_Identity_Creator as the third task
5. THE Merchant_Assistant SHALL compile all results into a downloadable Project_File
6. WHEN any task in the chain fails, THE Merchant_Assistant SHALL provide partial results and explain the failure
7. THE Merchant_Assistant SHALL show progress indicators for each task in the chain
8. THE Merchant_Assistant SHALL allow merchants to modify parameters between tasks

### Requirement 7: Project File Generation

**User Story:** As a merchant, I want a complete project file with all analysis and assets, so that I have everything needed to launch my product.

#### Acceptance Criteria

1. THE Project_File SHALL include supplier information with contact details and pricing
2. THE Project_File SHALL include complete cost breakdown with all fees itemized
3. THE Project_File SHALL include breakeven analysis and recommended pricing
4. THE Project_File SHALL include processed product images with download links
5. THE Project_File SHALL include AI-generated marketing descriptions in Arabic and English
6. THE Project_File SHALL be exportable as PDF and Excel formats
7. WHEN exporting, THE Project_File SHALL include all images as attachments or embedded
8. THE Project_File SHALL include a summary dashboard with key metrics

### Requirement 8: Budget-Based Planning

**User Story:** As a merchant, I want to plan my inventory based on my available budget, so that I can maximize my investment efficiently.

#### Acceptance Criteria

1. WHEN a budget is specified, THE Logistics_Profit_Architect SHALL calculate optimal order quantity
2. THE Logistics_Profit_Architect SHALL consider minimum order quantities from suppliers
3. THE Logistics_Profit_Architect SHALL factor in shipping cost tiers (bulk discounts)
4. THE Logistics_Profit_Architect SHALL provide multiple scenarios (conservative, moderate, aggressive)
5. THE Logistics_Profit_Architect SHALL calculate expected ROI for each scenario
6. WHEN budget is insufficient for minimum order, THE Logistics_Profit_Architect SHALL suggest alternatives

### Requirement 9: Multi-Language Support

**User Story:** As a merchant, I want the system to work in Arabic and English, so that I can use it in my preferred language.

#### Acceptance Criteria

1. THE Merchant_Assistant SHALL accept queries in Arabic and English
2. THE Merchant_Assistant SHALL respond in the same language as the user's query
3. THE Visual_Identity_Creator SHALL generate marketing descriptions in both languages
4. THE Project_File SHALL support bilingual export
5. THE Chat_Dashboard SHALL adapt layout direction based on selected language
