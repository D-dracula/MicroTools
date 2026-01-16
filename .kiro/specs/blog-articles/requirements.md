# Requirements Document

## Introduction

This document defines the requirements for an AI-powered blog/articles system for the Micro-Tools platform. The system enables automatic article generation using Exa AI for research and OpenRouter for content creation, with admin-only generation capabilities and public read access. Articles focus on e-commerce, digital marketing, and seller tools topics.

## Glossary

- **Article_Generator**: The AI service that creates articles using Exa research and OpenRouter content generation
- **Exa_Search**: The Exa AI web search service used to find trending topics and gather research
- **Article_Store**: The Supabase database storage for persisted articles
- **Admin_User**: A user with administrative privileges who can generate new articles
- **Public_User**: Any visitor who can read published articles
- **Article_Card**: A UI component displaying article preview with thumbnail, title, and metadata
- **Article_Page**: The full article view with complete content and sources
- **Thumbnail_Generator**: Service that creates article thumbnails using AI or placeholder images

## Requirements

### Requirement 1: Article Storage and Retrieval

**User Story:** As a public user, I want to browse and read saved articles, so that I can learn about e-commerce topics without waiting for generation.

#### Acceptance Criteria

1. THE Article_Store SHALL persist articles with title, slug, summary, content, category, tags, sources, thumbnail_url, reading_time, and timestamps
2. WHEN a user visits the blog page, THE System SHALL display a paginated list of published articles sorted by creation date (newest first)
3. WHEN a user clicks an article card, THE System SHALL navigate to the full article page with complete content
4. THE System SHALL support filtering articles by category
5. THE System SHALL support searching articles by title and content keywords
6. WHEN no articles match the filter/search criteria, THE System SHALL display an appropriate empty state message

### Requirement 2: Article Generation (Admin Only)

**User Story:** As an admin, I want to generate new articles using AI, so that I can keep the blog updated with fresh, relevant content.

#### Acceptance Criteria

1. WHEN an admin accesses the article generation feature, THE System SHALL verify admin authentication before allowing access
2. IF a non-admin user attempts to access generation, THEN THE System SHALL deny access and display an unauthorized message
3. WHEN an admin initiates article generation, THE Exa_Search SHALL search for trending e-commerce topics
4. THE Article_Generator SHALL analyze Exa results and select the most relevant topic based on recency and relevance scores
5. WHEN a topic is selected, THE Article_Generator SHALL create an article with 800-1200 words using OpenRouter
6. THE Article_Generator SHALL include source citations from Exa search results
7. WHEN generation completes, THE System SHALL save the article to Article_Store and display it to the admin
8. THE System SHALL limit article generation to 5 articles per day to prevent API abuse

### Requirement 3: Article Thumbnails

**User Story:** As a user, I want to see visual thumbnails for articles, so that the blog looks professional and engaging.

#### Acceptance Criteria

1. WHEN an article is generated, THE Thumbnail_Generator SHALL create or assign a relevant thumbnail image
2. THE System SHALL support placeholder thumbnails based on article category when AI generation is unavailable
3. THE Article_Card SHALL display the thumbnail with proper aspect ratio (16:9)
4. WHEN a thumbnail fails to load, THE System SHALL display a fallback gradient with category icon

### Requirement 4: Article Categories and Tags

**User Story:** As a user, I want to filter articles by category, so that I can find content relevant to my interests.

#### Acceptance Criteria

1. THE System SHALL support the following categories: Marketing, Seller Tools, Logistics, Trends, Case Studies
2. WHEN displaying the blog page, THE System SHALL show category filter buttons
3. WHEN a user selects a category, THE System SHALL filter articles to show only that category
4. THE System SHALL display article tags as clickable badges on article cards
5. WHEN a user clicks a tag, THE System SHALL filter articles containing that tag

### Requirement 5: Article Metadata and SEO

**User Story:** As a site owner, I want articles to be SEO-optimized, so that they rank well in search engines and drive organic traffic.

#### Acceptance Criteria

1. THE System SHALL generate unique meta titles and descriptions for each article
2. THE System SHALL include Open Graph tags for social media sharing
3. THE System SHALL generate article schema markup (JSON-LD) for rich search results
4. THE System SHALL include estimated reading time on article cards and pages
5. THE System SHALL generate SEO-friendly slugs from article titles
6. THE System SHALL add articles to the sitemap automatically

### Requirement 6: Article Sources and Citations

**User Story:** As a reader, I want to see article sources, so that I can verify information and explore topics further.

#### Acceptance Criteria

1. WHEN an article is generated, THE System SHALL store source URLs from Exa search results
2. THE Article_Page SHALL display a "Sources" section at the end with clickable links
3. THE System SHALL display source domain names for credibility indication
4. WHEN a source link is clicked, THE System SHALL open it in a new tab

### Requirement 7: Responsive and Accessible Design

**User Story:** As a user, I want the blog to work well on all devices and be accessible, so that I can read articles anywhere.

#### Acceptance Criteria

1. THE Blog_Page SHALL display articles in a responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)
2. THE Article_Page SHALL have a readable content width (max 720px) with comfortable typography
3. THE System SHALL support keyboard navigation for all interactive elements
4. THE System SHALL include proper ARIA labels for screen readers
5. THE System SHALL maintain consistent design with existing Micro-Tools UI patterns

### Requirement 8: Loading and Error States

**User Story:** As a user, I want clear feedback during loading and errors, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN articles are loading, THE System SHALL display skeleton loading cards
2. WHEN article generation is in progress, THE System SHALL display a progress indicator with status messages
3. IF article generation fails, THEN THE System SHALL display a clear error message with retry option
4. IF article loading fails, THEN THE System SHALL display an error state with refresh option
5. WHEN Exa search returns no results, THE System SHALL notify the admin and suggest alternative topics

### Requirement 9: Share Functionality

**User Story:** As a reader, I want to share articles, so that I can spread useful content to my network.

#### Acceptance Criteria

1. THE Article_Page SHALL include share buttons for Twitter, LinkedIn, and copy link
2. WHEN a user clicks a share button, THE System SHALL open the appropriate share dialog with pre-filled content
3. WHEN a user copies the link, THE System SHALL show a confirmation toast message
4. THE System SHALL include the article thumbnail in social share previews via Open Graph tags

### Requirement 10: Advertisement Placements

**User Story:** As a site owner, I want strategic ad placements in the blog, so that I can monetize the content while maintaining good user experience.

#### Acceptance Criteria

1. THE Blog_Page SHALL display a horizontal ad banner below the hero section (before article grid)
2. THE Blog_Page SHALL display an ad slot after every 6 articles in the grid
3. THE Article_Page SHALL display a horizontal ad banner below the article title/metadata section
4. THE Article_Page SHALL display a sidebar ad on desktop (sticky position) for screens wider than 1280px
5. THE Article_Page SHALL display an ad banner at the end of article content (before sources section)
6. WHEN on mobile devices, THE System SHALL hide sidebar ads and show only inline ad placements
7. THE System SHALL use the existing LandingAd component pattern for consistent ad styling
8. THE System SHALL ensure ads do not disrupt reading flow or content accessibility
