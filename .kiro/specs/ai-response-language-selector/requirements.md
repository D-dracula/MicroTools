# Requirements Document

## Introduction

This feature adds language and currency selectors to all AI-powered tools, allowing users to choose their preferred language for AI responses and currency for financial calculations. Both preferences are persisted in the browser's local storage for a consistent experience across sessions.

## Glossary

- **Language_Selector**: A dropdown component that displays available languages and allows users to select their preferred response language
- **Currency_Selector**: A dropdown component that displays available currencies and allows users to select their preferred currency for financial displays
- **AI_Tool**: Any tool in the application that uses AI (OpenRouter) to generate responses (Smart Profit Audit, Ad Spend Auditor, Inventory Forecaster, Review Insight, Catalog Cleaner)
- **Response_Language**: The language in which AI-generated content (insights, recommendations, explanations) should be written
- **Display_Currency**: The currency used for formatting financial values in AI responses and calculations
- **Local_Storage**: Browser storage mechanism used to persist user preferences across sessions

## Requirements

### Requirement 1: Language Selector Component

**User Story:** As a user, I want to see a language selection dropdown in AI tools, so that I can choose my preferred response language.

#### Acceptance Criteria

1. WHEN an AI tool page loads, THE Language_Selector SHALL display a dropdown with predefined language options
2. THE Language_Selector SHALL include the following languages: Arabic (العربية), English, French (Français), Spanish (Español), German (Deutsch), Turkish (Türkçe), Urdu (اردو), Chinese (中文)
3. WHEN a user clicks the Language_Selector, THE Language_Selector SHALL display all available language options
4. THE Language_Selector SHALL display the currently selected language with its native name
5. WHERE a user wants a language not in the list, THE Language_Selector SHALL provide an "Other" option with a text input field

### Requirement 2: Language Preference Persistence

**User Story:** As a user, I want my language preference to be saved, so that I don't have to select it every time I use an AI tool.

#### Acceptance Criteria

1. WHEN a user selects a language, THE System SHALL save the selection to browser local storage immediately
2. WHEN an AI tool page loads, THE Language_Selector SHALL retrieve and display the previously saved language preference
3. IF no language preference exists in local storage, THEN THE Language_Selector SHALL default to the current locale (ar or en)
4. WHEN a user enters a custom language in the "Other" field, THE System SHALL save that custom language to local storage

### Requirement 3: AI Response Language Integration

**User Story:** As a user, I want AI responses to be generated in my selected language, so that I can understand the insights better.

#### Acceptance Criteria

1. WHEN an AI tool generates a response, THE System SHALL include the selected language in the AI prompt
2. THE AI_Tool SHALL instruct the AI model to respond in the user's selected language
3. WHEN the selected language changes, THE System SHALL use the new language for subsequent AI requests
4. THE System SHALL pass the response language to all AI processing functions (analyzeProfit, analyzeReviews, forecastInventory, etc.)

### Requirement 4: UI/UX Consistency

**User Story:** As a user, I want the language selector to have a consistent appearance across all AI tools, so that I have a familiar experience.

#### Acceptance Criteria

1. THE Language_Selector SHALL use the same styling as other form elements in the application
2. THE Language_Selector SHALL support RTL layout when the page is in Arabic mode
3. THE Language_Selector SHALL display a globe/language icon to indicate its purpose
4. THE Language_Selector SHALL be positioned prominently near the top of the AI tool interface
5. WHEN the language selector value changes, THE System SHALL provide visual feedback (toast notification) confirming the change

### Requirement 5: Shared Component Architecture

**User Story:** As a developer, I want reusable language and currency selector components, so that I can easily add them to any AI tool.

#### Acceptance Criteria

1. THE Language_Selector and Currency_Selector SHALL be implemented as shared components in `src/components/tools/shared/`
2. THE System SHALL export hooks `useResponseLanguage()` and `useDisplayCurrency()` for accessing preferences
3. THE Components SHALL accept optional `onChange` callback props for custom handling
4. THE Components SHALL be exported from the shared components index file
5. THE System SHALL provide a combined `AIPreferencesSelector` component that includes both selectors

### Requirement 6: Currency Selector Component

**User Story:** As a user, I want to select my preferred currency in AI tools, so that financial values are displayed in my local currency.

#### Acceptance Criteria

1. WHEN an AI tool page loads, THE Currency_Selector SHALL display a dropdown with predefined currency options
2. THE Currency_Selector SHALL include common currencies: SAR (ر.س), USD ($), EUR (€), GBP (£), AED (د.إ), EGP (ج.م), KWD (د.ك), QAR (ر.ق), BHD (د.ب), OMR (ر.ع)
3. WHEN a user clicks the Currency_Selector, THE Currency_Selector SHALL display all available currency options with their symbols
4. THE Currency_Selector SHALL display the currently selected currency with its symbol and code
5. WHERE a user wants a currency not in the list, THE Currency_Selector SHALL provide an "Other" option with a text input field for currency code

### Requirement 7: Currency Preference Persistence

**User Story:** As a user, I want my currency preference to be saved, so that I don't have to select it every time I use an AI tool.

#### Acceptance Criteria

1. WHEN a user selects a currency, THE System SHALL save the selection to browser local storage immediately
2. WHEN an AI tool page loads, THE Currency_Selector SHALL retrieve and display the previously saved currency preference
3. IF no currency preference exists in local storage, THEN THE Currency_Selector SHALL default to SAR for Arabic locale and USD for English locale
4. WHEN a user enters a custom currency code in the "Other" field, THE System SHALL save that custom currency to local storage

### Requirement 8: Currency Integration with AI Tools

**User Story:** As a user, I want AI responses to use my selected currency, so that financial insights are relevant to my business.

#### Acceptance Criteria

1. WHEN an AI tool displays financial values, THE System SHALL format them using the selected currency
2. THE AI_Tool SHALL pass the selected currency to all financial calculation functions
3. WHEN the selected currency changes, THE System SHALL use the new currency for subsequent calculations and displays
4. THE System SHALL pass the display currency to all AI processing functions that handle financial data
