K# Implementation Plan: Micro-Tools Website

## Overview

خطة تنفيذ موقع الأدوات المصغرة للتجارة الإلكترونية مع Backend احترافي ونظام إعلانات متكامل. التنفيذ يتبع نهج تدريجي يبدأ بالأساسيات ثم يضيف الميزات المتقدمة.

## Tasks

- [-] 1. Project Setup and Configuration
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and App Router
    - Run `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router
    - Configure `next.config.ts` for next-intl plugin
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Install and configure dependencies
    - Install: `next-intl`, `next-themes`, `prisma`, `@prisma/client`, `next-auth`, `bcryptjs`, `zod`
    - Install: `lucide-react`, `@radix-ui/react-*` (shadcn dependencies)
    - _Requirements: 1.3, 1.4_

  - [x] 1.3 Setup shadcn/ui components
    - Run `npx shadcn@latest init`
    - Add components: button, card, input, label, dropdown-menu, toast
    - _Requirements: 1.3_

  - [x] 1.4 Configure fonts (Cairo + Inter)
    - Setup Google Fonts in root layout
    - Configure font variables for Arabic and English
    - _Requirements: 1.5_

- [x] 2. Internationalization (i18n) Setup
  - [x] 2.1 Configure next-intl routing and middleware
    - Create `src/i18n/routing.ts` with locales ['ar', 'en']
    - Create `src/i18n/request.ts` for request config
    - Create `src/middleware.ts` for locale routing
    - _Requirements: 2.1_

  - [x] 2.2 Create translation files
    - Create `messages/ar.json` with all Arabic translations
    - Create `messages/en.json` with all English translations
    - _Requirements: 2.6_

  - [ ]* 2.3 Write property test for translation completeness
    - **Property 8: Translation Completeness**
    - **Validates: Requirements 2.1**

  - [x] 2.4 Create locale layout with RTL/LTR support
    - Create `src/app/[locale]/layout.tsx`
    - Apply `dir="rtl"` for Arabic, `dir="ltr"` for English
    - _Requirements: 2.2, 2.3_

- [x] 3. Theme and Layout Components
  - [x] 3.1 Setup next-themes for dark mode
    - Install `next-themes`
    - Create ThemeProvider wrapper
    - _Requirements: 3.1, 3.4_

  - [x] 3.2 Create Header component
    - Logo, navigation links
    - LocaleSwitcher component
    - ThemeSwitcher component
    - _Requirements: 2.4, 3.2_

  - [x] 3.3 Create Footer component
    - Site info, links, copyright
    - _Requirements: 4.5_

- [x] 4. Checkpoint - Basic Setup Complete
  - Ensure project runs without errors
  - Verify RTL/LTR switching works
  - Verify dark mode works

- [x] 5. Database and Prisma Setup
  - [x] 5.1 Initialize Prisma with PostgreSQL
    - Run `npx prisma init`
    - Configure DATABASE_URL in `.env`
    - _Requirements: 10.1_

  - [x] 5.2 Create Prisma schema
    - Define User, Account, Session models (NextAuth)
    - Define Calculation model
    - Define ToolUsage model
    - Define CustomAd model
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 5.3 Run initial migration
    - Run `npx prisma migrate dev`
    - Generate Prisma client
    - _Requirements: 10.1_

  - [x] 5.4 Create Prisma client singleton
    - Create `src/lib/prisma.ts`
    - _Requirements: 10.1_

- [x] 6. Authentication System
  - [x] 6.1 Configure NextAuth.js
    - Create `src/lib/auth.ts` with NextAuth config
    - Setup Credentials provider (email/password)
    - Setup Google OAuth provider
    - Create `src/app/api/auth/[...nextauth]/route.ts`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 6.2 Create validation schemas
    - Create `src/lib/validations/auth.ts` with Zod schemas
    - Register schema (email, password strength)
    - Login schema
    - _Requirements: 7.4_

  - [ ]* 6.3 Write property test for password hashing
    - **Property 7: Password Security**
    - **Validates: Requirements 7.8**

  - [x] 6.4 Create registration API endpoint
    - Create `src/app/api/auth/register/route.ts`
    - Hash password with bcrypt
    - Validate input with Zod
    - _Requirements: 7.1, 7.4, 7.8_

  - [x] 6.5 Create auth UI components
    - Create `src/components/auth/login-form.tsx`
    - Create `src/components/auth/register-form.tsx`
    - Create `src/components/layout/user-menu.tsx`
    - _Requirements: 7.1, 7.2, 7.6, 7.7_

  - [x] 6.6 Create auth pages
    - Create `src/app/[locale]/auth/login/page.tsx`
    - Create `src/app/[locale]/auth/register/page.tsx`
    - _Requirements: 7.1, 7.2_

- [ ] 7. Checkpoint - Auth System Complete
  - Test registration flow
  - Test login/logout flow
  - Verify session persistence

- [x] 8. Landing Page
  - [x] 8.1 Create ToolCard component
    - Display icon, title, category badge, description
    - Link to tool page
    - _Requirements: 4.7_

  - [x] 8.2 Create tools registry with categories
    - Create `src/lib/tools.ts` with tool definitions
    - Define categories: Financial, Images, Text, etc.
    - _Requirements: 4.3, 4.4_

  - [x] 8.3 Create SearchBar component
    - Real-time filtering of tools
    - Support Arabic and English search
    - _Requirements: 4.2, 4.5_

  - [x] 8.4 Create Landing Page
    - Hero section with branding
    - Search bar
    - Category filters
    - Tools grid with ToolCards
    - _Requirements: 4.1, 4.4, 4.6, 4.8_

- [x] 9. Profit Margin Calculator Tool
  - [x] 9.1 Create calculator logic
    - Create `src/lib/calculators/profit-margin.ts`
    - Implement profit, margin, markup calculations
    - Implement input validation
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 9.2 Write property test for calculation correctness
    - **Property 1: Profit Calculation Mathematical Correctness**
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**

  - [ ]* 9.3 Write property test for input validation
    - **Property 2: Input Validation Rejects Invalid Values**
    - **Validates: Requirements 6.7**

  - [x] 9.4 Create ProfitMarginCalculator component
    - Use Dynamic Import for lazy loading
    - Input fields for cost and selling price
    - Real-time calculation display
    - Save button (for authenticated users)
    - _Requirements: 6.1, 6.2, 6.8, 8.2, 14.1, 14.2_

  - [x] 9.5 Create tool page with dynamic routing
    - Create `src/app/[locale]/tools/[slug]/page.tsx`
    - Dynamic routing for tools
    - Back navigation
    - Consistent UI layout
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 15.4_

  - [ ]* 9.6 Write property test for tool accessibility
    - **Property 3: Tool Accessibility Without Authentication**
    - **Validates: Requirements 5.4, 5.5, 7.9**

- [ ] 10. Checkpoint - Core Tools Complete
  - Test calculator functionality
  - Verify guest access works
  - Test on mobile devices

- [x] 11. Calculation History API
  - [x] 11.1 Create calculation validation schema
    - Create `src/lib/validations/calculations.ts`
    - _Requirements: 9.2_

  - [x] 11.2 Create calculations API endpoints
    - Create `src/app/api/calculations/route.ts` (GET, POST)
    - Create `src/app/api/calculations/[id]/route.ts` (GET, DELETE)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

  - [ ]* 11.3 Write property test for API validation
    - **Property 5: API Request Validation**
    - **Validates: Requirements 9.2, 9.3, 9.7**

  - [ ]* 11.4 Write property test for API response structure
    - **Property 6: API Response Structure Consistency**
    - **Validates: Requirements 9.4, 9.5**

  - [ ]* 11.5 Write property test for user isolation
    - **Property 4: Calculation History User Isolation**
    - **Validates: Requirements 8.5, 8.6**

  - [x] 11.6 Create Dashboard page
    - Create `src/app/[locale]/dashboard/page.tsx`
    - Display calculation history
    - Delete functionality
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 12. Analytics System
  - [x] 12.1 Create analytics API endpoint
    - Create `src/app/api/analytics/route.ts`
    - Track tool usage
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 12.2 Integrate analytics tracking
    - Track usage on tool page load
    - _Requirements: 11.1, 11.2_

- [ ] 13. Checkpoint - Backend Complete
  - Test calculation save/load
  - Test history page
  - Verify analytics tracking

- [x] 14. Advertising System
  - [x] 14.1 Setup Google AdSense
    - Create AdSense component with lazy loading
    - Configure ad units
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

  - [x] 14.2 Create Custom Ads API
    - Create `src/app/api/ads/route.ts` (GET, POST)
    - Create `src/app/api/ads/[id]/route.ts` (PUT, DELETE)
    - Create impression/click tracking endpoints
    - _Requirements: 15.1, 15.2, 15.5, 15.7_

  - [x] 14.3 Create AdSlot component
    - Fetch active custom ad for placement
    - Fallback to AdSense if no custom ad
    - Track impressions
    - _Requirements: 15.3, 15.4, 16.4_

  - [ ]* 14.4 Write property test for ad scheduling
    - **Property 10: Custom Ad Scheduling**
    - **Validates: Requirements 15.6**

  - [ ]* 14.5 Write property test for ad priority
    - **Property 11: Ad Priority Resolution**
    - **Validates: Requirements 15.4**

  - [x] 14.6 Integrate ads into pages
    - Add AdSlot to Landing Page (below hero)
    - Add AdSlot to Tool Page (sidebar/bottom)
    - _Requirements: 16.1, 16.2, 16.3, 16.5_

- [x] 15. SEO Optimization
  - [x] 15.1 Create metadata generation
    - Create `src/lib/metadata.ts`
    - Generate locale-specific metadata
    - _Requirements: 12.1, 12.2_

  - [x] 15.2 Add metadata to pages
    - Landing page metadata
    - Tool page metadata
    - Auth pages metadata
    - _Requirements: 12.3, 12.4_

  - [x] 15.3 Ensure semantic HTML
    - Use proper heading hierarchy
    - Add ARIA labels where needed
    - _Requirements: 12.5_

- [x] 16. Rate Limiting
  - [x] 16.1 Implement rate limiting middleware
    - Create rate limiter for API routes
    - _Requirements: 9.6_

- [ ] 17. Final Checkpoint
  - Run all tests
  - Test complete user flows
  - Verify responsive design
  - Test RTL/LTR layouts
  - Verify ad placements

## Notes

- Tasks marked with `*` are optional property-based tests
- Each checkpoint ensures incremental validation
- All tools work for guests without authentication
- Authentication is only required for saving calculations
- Use Dynamic Imports for all tool components to optimize performance
- Maintain UI consistency across all tools using shared components
- Tools can be easily added by:
  1. Adding tool definition in `src/lib/tools.ts`
  2. Creating tool component in `src/components/tools/`
  3. Adding translations in `messages/ar.json` and `messages/en.json`
