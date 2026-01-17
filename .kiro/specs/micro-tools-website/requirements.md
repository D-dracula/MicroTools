# Requirements Document

## Introduction

موقع ويب احترافي للأدوات المصغرة (Micro-tools Website) مخصص للتجارة الإلكترونية. يوفر الموقع مجموعة من الأدوات المجانية مع Backend احترافي يدعم المصادقة، حفظ البيانات، والتحليلات. مبني باستخدام Next.js 14 مع API Routes وقاعدة بيانات PostgreSQL.

## Glossary

- **Micro_Tools_Website**: موقع الأدوات المصغرة الرئيسي
- **Tool_Page**: صفحة الأداة الفردية
- **Landing_Page**: الصفحة الرئيسية للموقع
- **Profit_Margin_Calculator**: حاسبة هامش الربح
- **Locale_Switcher**: مبدل اللغة
- **Tool_Card**: بطاقة عرض الأداة في الشبكة
- **Theme_Switcher**: مبدل الوضع (فاتح/داكن)
- **API_Server**: خادم الـ API المبني على Next.js API Routes
- **Database**: قاعدة بيانات PostgreSQL مع Prisma ORM
- **Auth_System**: نظام المصادقة باستخدام NextAuth.js
- **User**: المستخدم المسجل في النظام
- **Calculation_History**: سجل الحسابات المحفوظة للمستخدم
- **Analytics_Service**: خدمة تتبع استخدام الأدوات
- **Ad_System**: نظام الإعلانات المتكامل
- **Ad_Slot**: مكان عرض الإعلان في الصفحة
- **Custom_Ad**: إعلان مخصص يديره المسؤول
- **AdSense_Unit**: وحدة إعلانية من Google AdSense

## Requirements

### Requirement 1: Project Setup and Configuration

**User Story:** As a developer, I want a properly configured Next.js 14 project with App Router, so that I can build a modern, performant website.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL use Next.js 14 with App Router architecture
2. THE Micro_Tools_Website SHALL use Tailwind CSS for styling
3. THE Micro_Tools_Website SHALL include shadcn/ui component library
4. THE Micro_Tools_Website SHALL use lucide-react for icons
5. THE Micro_Tools_Website SHALL configure Cairo font for Arabic text and Inter font for English text

### Requirement 2: Internationalization (i18n)

**User Story:** As a user, I want to browse the website in Arabic or English, so that I can use the tools in my preferred language.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL support Arabic (ar) and English (en) languages using next-intl
2. WHEN the locale is Arabic, THE Micro_Tools_Website SHALL render content in RTL direction
3. WHEN the locale is English, THE Micro_Tools_Website SHALL render content in LTR direction
4. THE Locale_Switcher SHALL allow users to switch between Arabic and English
5. WHEN a user switches language, THE Micro_Tools_Website SHALL persist the language preference
6. THE Micro_Tools_Website SHALL store translations in JSON files for each locale

### Requirement 3: Theme Support (Dark Mode)

**User Story:** As a user, I want to switch between light and dark modes, so that I can use the website comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL support both light and dark themes
2. THE Theme_Switcher SHALL allow users to toggle between light and dark modes
3. WHEN a user selects a theme, THE Micro_Tools_Website SHALL persist the preference
4. THE Micro_Tools_Website SHALL respect system theme preference by default

### Requirement 4: Landing Page

**User Story:** As a visitor, I want to see all available tools on the homepage, so that I can quickly find and access the tool I need.

#### Acceptance Criteria

1. THE Landing_Page SHALL display a hero section with website branding and description
2. THE Landing_Page SHALL display a search bar for finding tools quickly
3. THE Landing_Page SHALL organize tools into categories (Financial, Images, Text, etc.)
4. THE Landing_Page SHALL display a grid of Tool_Cards showing all available tools
5. WHEN a user types in the search bar, THE Landing_Page SHALL filter tools in real-time
6. WHEN a user clicks on a Tool_Card, THE Micro_Tools_Website SHALL navigate to the corresponding Tool_Page
7. THE Tool_Card SHALL display an icon, title, category badge, and brief description for each tool
8. THE Landing_Page SHALL use adequate whitespace for a modern SaaS-like appearance

### Requirement 5: Tool Page Structure

**User Story:** As a user, I want each tool to have its own dedicated page, so that I can use the tool without distractions.

#### Acceptance Criteria

1. THE Tool_Page SHALL display the tool's title and description
2. THE Tool_Page SHALL contain the interactive tool component
3. THE Tool_Page SHALL include a back navigation to the Landing_Page
4. THE Tool_Page SHALL be fully functional for guest users without requiring registration
5. THE Tool_Page SHALL NOT require authentication to use any tool functionality

### Requirement 6: Profit Margin Calculator Tool

**User Story:** As an e-commerce seller, I want to calculate profit margins, so that I can price my products correctly.

#### Acceptance Criteria

1. THE Profit_Margin_Calculator SHALL accept cost price as input
2. THE Profit_Margin_Calculator SHALL accept selling price as input
3. WHEN both prices are entered, THE Profit_Margin_Calculator SHALL calculate and display the profit amount
4. WHEN both prices are entered, THE Profit_Margin_Calculator SHALL calculate and display the profit margin percentage
5. WHEN both prices are entered, THE Profit_Margin_Calculator SHALL calculate and display the markup percentage
6. IF the selling price is less than cost price, THEN THE Profit_Margin_Calculator SHALL indicate a loss
7. THE Profit_Margin_Calculator SHALL validate that inputs are positive numbers
8. THE Profit_Margin_Calculator SHALL update calculations in real-time as user types

### Requirement 7: User Authentication (Optional)

**User Story:** As a user, I want to optionally create an account, so that I can save my calculations and access them later.

#### Acceptance Criteria

1. THE Auth_System SHALL allow users to register with email and password
2. THE Auth_System SHALL allow users to login with email and password
3. THE Auth_System SHALL support OAuth login with Google
4. WHEN a user registers, THE Auth_System SHALL validate email format and password strength
5. WHEN a user logs in successfully, THE Auth_System SHALL create a secure session
6. THE Auth_System SHALL provide logout functionality
7. IF login credentials are invalid, THEN THE Auth_System SHALL display an appropriate error message
8. THE Auth_System SHALL hash passwords before storing in the Database
9. THE Micro_Tools_Website SHALL NOT require authentication to access or use any tool

### Requirement 8: Calculation History (Optional Feature)

**User Story:** As an authenticated user, I want to optionally save my calculations, so that I can reference them later.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL allow guest users to use all tools without any restrictions
2. WHERE a user is authenticated, THE Micro_Tools_Website SHALL display a "Save" button after calculations
3. THE Calculation_History SHALL store the tool type, inputs, outputs, and timestamp
4. THE User SHALL be able to view their saved calculations in a history page
5. THE User SHALL be able to delete individual calculations from history
6. THE Calculation_History SHALL be associated with the authenticated User
7. WHERE a user is a guest, THE Micro_Tools_Website MAY display a non-intrusive prompt suggesting login benefits

### Requirement 9: API Endpoints

**User Story:** As a developer, I want well-structured API endpoints, so that the frontend can communicate with the backend efficiently.

#### Acceptance Criteria

1. THE API_Server SHALL provide RESTful endpoints for all operations
2. THE API_Server SHALL validate all incoming requests
3. THE API_Server SHALL return appropriate HTTP status codes
4. THE API_Server SHALL return JSON responses with consistent structure
5. IF an API request fails, THEN THE API_Server SHALL return a descriptive error message
6. THE API_Server SHALL implement rate limiting to prevent abuse
7. THE API_Server SHALL require authentication for protected endpoints

### Requirement 10: Database Schema

**User Story:** As a system architect, I want a well-designed database schema, so that data is stored efficiently and securely.

#### Acceptance Criteria

1. THE Database SHALL store User records with id, email, password hash, name, and timestamps
2. THE Database SHALL store Calculation_History records linked to Users
3. THE Database SHALL use proper indexes for frequently queried fields
4. THE Database SHALL enforce referential integrity between tables
5. WHEN a User is deleted, THE Database SHALL cascade delete their Calculation_History

### Requirement 11: Analytics and Usage Tracking

**User Story:** As a website owner, I want to track tool usage, so that I can understand which tools are most popular.

#### Acceptance Criteria

1. THE Analytics_Service SHALL track each tool usage event
2. THE Analytics_Service SHALL record the tool type, timestamp, and user type (guest/authenticated)
3. THE Analytics_Service SHALL NOT store personally identifiable information for guests
4. THE API_Server SHALL provide an endpoint to retrieve usage statistics (admin only)

### Requirement 12: SEO Optimization

**User Story:** As a website owner, I want proper SEO metadata for each page and language, so that the website ranks well in search engines.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL generate unique metadata for each page
2. THE Micro_Tools_Website SHALL generate locale-specific metadata for Arabic and English
3. THE Micro_Tools_Website SHALL include Open Graph tags for social sharing
4. THE Micro_Tools_Website SHALL include proper title and description meta tags
5. THE Micro_Tools_Website SHALL use semantic HTML structure

### Requirement 13: Responsive Design

**User Story:** As a user, I want the website to work well on all devices, so that I can use the tools on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL be fully responsive across mobile, tablet, and desktop screens
2. THE Tool_Card grid SHALL adapt to different screen sizes
3. THE Profit_Margin_Calculator SHALL be usable on mobile devices
4. THE Navigation SHALL be accessible on all screen sizes

### Requirement 14: Performance Optimization

**User Story:** As a user, I want the website to load quickly, so that I can use tools without waiting.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL use Dynamic Imports for tool components
2. THE Tool_Page SHALL only load the specific tool's code when accessed
3. THE Micro_Tools_Website SHALL lazy-load images and non-critical components
4. THE Micro_Tools_Website SHALL achieve a Lighthouse performance score of 90+

### Requirement 15: UI Consistency (Brand Guidelines)

**User Story:** As a visitor, I want a consistent visual experience, so that the website feels professional and trustworthy.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL use a consistent color palette across all pages
2. THE Micro_Tools_Website SHALL use consistent typography (Cairo for Arabic, Inter for English)
3. THE Micro_Tools_Website SHALL use consistent button styles, spacing, and border radius
4. THE Tool components SHALL follow a unified layout pattern
5. THE Micro_Tools_Website SHALL maintain visual consistency between light and dark modes

### Requirement 16: Advertising System (Google AdSense)

**User Story:** As a website owner, I want to display Google AdSense ads, so that I can generate passive revenue from the website.

#### Acceptance Criteria

1. THE Micro_Tools_Website SHALL integrate Google AdSense script in the application
2. THE Ad_System SHALL display AdSense_Units in designated Ad_Slots
3. THE Ad_System SHALL support responsive ad units that adapt to screen size
4. THE Ad_System SHALL NOT display ads that interfere with tool functionality
5. THE Ad_System SHALL lazy-load ads to maintain page performance
6. THE Ad_System SHALL respect user's ad blocker without breaking the site

### Requirement 17: Custom Advertising System

**User Story:** As a website owner, I want to manage custom ads, so that I can sell ad space directly to advertisers or promote my own products.

#### Acceptance Criteria

1. THE Ad_System SHALL support Custom_Ads with image, title, description, and link
2. THE Database SHALL store Custom_Ad records with placement, priority, and active status
3. THE Ad_System SHALL display Custom_Ads in designated Ad_Slots based on priority
4. WHERE both AdSense and Custom_Ad are configured for the same slot, THE Ad_System SHALL display Custom_Ad with higher priority
5. THE Admin SHALL be able to create, update, and delete Custom_Ads via API
6. THE Custom_Ad SHALL support scheduling with start and end dates
7. THE Ad_System SHALL track impressions and clicks for Custom_Ads
8. THE Custom_Ad SHALL support both Arabic and English content

### Requirement 18: Ad Placement Strategy

**User Story:** As a website owner, I want strategic ad placements, so that ads are visible but not intrusive.

#### Acceptance Criteria

1. THE Landing_Page SHALL have an Ad_Slot below the hero section
2. THE Tool_Page SHALL have an Ad_Slot in the sidebar (desktop) or below the tool (mobile)
3. THE Ad_System SHALL NOT display more than 3 ads per page
4. THE Ad_System SHALL maintain adequate spacing between ads and content
5. THE Ad_System SHALL NOT display ads that cover or obstruct tool inputs/outputs
