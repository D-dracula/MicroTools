# Implementation Plan: Blog Articles System

## Overview

This implementation plan breaks down the blog articles feature into incremental tasks. Each task builds on previous work, ensuring the system is functional at each checkpoint. The plan follows the existing Micro-Tools patterns for consistency.

## Tasks

- [x] 1. Database Setup
  - [x] 1.1 Create Supabase migration for articles table
    - Create `articles` table with all required columns (id, slug, title, summary, content, category, tags, thumbnail_url, reading_time, sources, meta_title, meta_description, is_published, timestamps)
    - Create `article_generation_log` table for rate limiting
    - Add indexes for performance (category, created_at, tags GIN index)
    - _Requirements: 1.1, 2.8_

  - [x] 1.2 Create TypeScript types for articles
    - Define `ArticleCategory` type
    - Define `Article`, `ArticleListItem`, `ArticleSource` interfaces
    - Define `PaginatedArticles` response type
    - Define `GenerationStatus` type
    - Export from `src/lib/blog/types.ts`
    - _Requirements: 1.1_

  - [ ]* 1.3 Write property test for article persistence round-trip
    - **Property 1: Article Persistence Round-Trip**
    - **Validates: Requirements 1.1**

- [x] 2. Core Article Service
  - [x] 2.1 Implement ArticleService for CRUD operations
    - Create `src/lib/blog/article-service.ts`
    - Implement `getArticles(options)` with pagination, filtering, search
    - Implement `getArticleBySlug(slug)`
    - Implement `createArticle(data)`
    - Implement `getCategories()` with article counts
    - Use existing Supabase client patterns
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 4.1_

  - [ ]* 2.2 Write property tests for article listing
    - **Property 2: Article Listing Order**
    - **Property 3: Category Filtering Correctness**
    - **Property 4: Search Results Relevance**
    - **Validates: Requirements 1.2, 1.4, 1.5**

  - [x] 2.3 Implement utility functions
    - Create `src/lib/blog/slug-generator.ts` - SEO-friendly slug creation
    - Create `src/lib/blog/reading-time.ts` - Calculate reading time from content
    - Create `src/lib/blog/domain-extractor.ts` - Extract domain from URLs
    - _Requirements: 5.4, 5.5, 6.3_

  - [ ]* 2.4 Write property tests for utilities
    - **Property 14: Reading Time Calculation**
    - **Property 15: Slug Generation**
    - **Property 16: Source Domain Extraction**
    - **Validates: Requirements 5.4, 5.5, 6.3**

- [ ] 3. Checkpoint - Database and Service Layer
  - Ensure all tests pass, ask the user if questions arise.
  - Verify database migration works
  - Test CRUD operations manually

- [x] 4. API Routes
  - [x] 4.1 Create articles list API route
    - Create `src/app/api/blog/articles/route.ts`
    - Handle GET with query params (page, pageSize, category, tag, search)
    - Return paginated articles
    - _Requirements: 1.2, 1.4, 1.5_

  - [x] 4.2 Create single article API route
    - Create `src/app/api/blog/articles/[slug]/route.ts`
    - Handle GET by slug
    - Return full article with sources
    - _Requirements: 1.3_

  - [x] 4.3 Create categories API route
    - Create `src/app/api/blog/categories/route.ts`
    - Return categories with article counts
    - _Requirements: 4.1, 4.2_

- [x] 5. Blog UI Components
  - [x] 5.1 Create ArticleCard component
    - Create `src/components/blog/article-card.tsx`
    - Display thumbnail with 16:9 aspect ratio
    - Show title, summary, category badge, tags, reading time
    - Implement gradient fallback for failed thumbnails
    - Match existing ToolCard design patterns
    - _Requirements: 3.3, 3.4, 4.4, 5.4, 7.5_

  - [x] 5.2 Create ArticleCardSkeleton component
    - Create `src/components/blog/article-card-skeleton.tsx`
    - Skeleton loading state matching ArticleCard layout
    - _Requirements: 8.1_

  - [x] 5.3 Create ArticleGrid component
    - Create `src/components/blog/article-grid.tsx`
    - Responsive grid (1/2/3 columns)
    - Insert ad slots every 6 articles
    - Handle empty state
    - _Requirements: 7.1, 10.2, 1.6_

  - [ ]* 5.4 Write property test for ad placement intervals
    - **Property 18: Ad Placement Intervals**
    - **Validates: Requirements 10.2**

  - [x] 5.5 Create CategoryFilter component
    - Create `src/components/blog/category-filter.tsx`
    - Display category buttons with counts
    - Handle selection state
    - Match existing CategoryFilter pattern from tools
    - _Requirements: 4.2, 4.3_

  - [x] 5.6 Create BlogSearch component
    - Create `src/components/blog/blog-search.tsx`
    - Search input with debounce
    - Match existing SearchBar pattern
    - _Requirements: 1.5_

  - [x] 5.7 Create BlogHero component
    - Create `src/components/blog/blog-hero.tsx`
    - Hero section with title and description
    - Match landing page hero style
    - _Requirements: 7.5_

  - [x] 5.8 Create BlogPagination component
    - Create `src/components/blog/blog-pagination.tsx`
    - Page navigation controls
    - _Requirements: 1.2_

- [x] 6. Blog Listing Page
  - [x] 6.1 Create blog page
    - Create `src/app/[locale]/blog/page.tsx`
    - Integrate BlogHero, CategoryFilter, BlogSearch, ArticleGrid, BlogPagination
    - Add ad banner below hero section
    - Generate metadata for SEO
    - _Requirements: 1.2, 10.1, 5.1_

  - [x] 6.2 Add translations for blog
    - Add blog translations to `messages/en.json`
    - Include page title, description, category names, empty states
    - _Requirements: 7.5_

- [ ] 7. Checkpoint - Blog Listing Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify blog page renders correctly
  - Test filtering and search
  - Test pagination
  - Test responsive layout

- [x] 8. Article Detail Components
  - [x] 8.1 Create ArticleContent component
    - Create `src/components/blog/article-content.tsx`
    - Render article content with proper typography
    - Max width 720px for readability
    - _Requirements: 7.2_

  - [x] 8.2 Create ArticleSources component
    - Create `src/components/blog/article-sources.tsx`
    - Display sources with domain names
    - Links open in new tab
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 8.3 Create ArticleShare component
    - Create `src/components/blog/article-share.tsx`
    - Twitter, LinkedIn, Copy Link buttons
    - Show toast on copy
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 8.4 Write property test for share URL formatting
    - **Property 17: Share URL Formatting**
    - **Validates: Requirements 9.2**

- [x] 9. Article Detail Page
  - [x] 9.1 Create article detail page
    - Create `src/app/[locale]/blog/[slug]/page.tsx`
    - Display full article with ArticleContent
    - Add ArticleSources section
    - Add ArticleShare buttons
    - Add ad placements (below title, sidebar on desktop, before sources)
    - _Requirements: 1.3, 10.3, 10.4, 10.5, 10.6_

  - [x] 9.2 Generate article page metadata
    - Dynamic meta title and description
    - Open Graph tags with thumbnail
    - Article schema JSON-LD
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 9.3 Write property test for SEO metadata
    - **Property 12: SEO Metadata Uniqueness**
    - **Property 13: SEO Metadata Presence**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 10. Checkpoint - Article Pages Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify article detail page renders correctly
  - Test share functionality
  - Test ad placements
  - Verify SEO metadata

- [x] 11. Article Generation Service
  - [x] 11.1 Create ArticleGeneratorService
    - Create `src/lib/blog/article-generator.ts`
    - Implement `searchTopics(apiKey)` using Exa MCP
    - Implement `selectBestTopic(results)` with scoring
    - Implement `generateArticle(apiKey, topic)` using OpenRouter
    - Implement `checkRateLimit(adminId)` 
    - _Requirements: 2.3, 2.4, 2.5, 2.8_

  - [ ]* 11.2 Write property tests for generation
    - **Property 6: Topic Selection Optimality**
    - **Property 7: Article Word Count Range**
    - **Property 8: Source Citation Inclusion**
    - **Property 9: Rate Limiting Enforcement**
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.8**

  - [x] 11.3 Create ThumbnailService
    - Create `src/lib/blog/thumbnail-service.ts`
    - Implement category placeholder selection
    - Implement gradient fallback generation
    - _Requirements: 3.1, 3.2_

  - [ ]* 11.4 Write property test for thumbnail assignment
    - **Property 10: Thumbnail Assignment**
    - **Validates: Requirements 3.1**

- [x] 12. Generation API and Admin UI
  - [x] 12.1 Create generation API route
    - Create `src/app/api/blog/generate/route.ts`
    - Verify admin authentication
    - Check rate limit
    - Call ArticleGeneratorService
    - Return generated article or error
    - _Requirements: 2.1, 2.2, 2.7, 2.8_

  - [ ]* 12.2 Write property test for admin authorization
    - **Property 5: Admin Authorization**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 12.3 Create GenerateArticleButton component
    - Create `src/components/blog/admin/generate-article-button.tsx`
    - Button visible only to admins
    - Opens generation dialog
    - _Requirements: 2.1_

  - [x] 12.4 Create GenerationProgress component
    - Create `src/components/blog/admin/generation-progress.tsx`
    - Display progress steps (searching, selecting, generating, saving)
    - Show error state with retry option
    - _Requirements: 8.2, 8.3, 8.5_

  - [x] 12.5 Integrate admin generation into blog page
    - Add GenerateArticleButton to blog page (admin only)
    - Handle generation flow
    - Refresh article list on success
    - _Requirements: 2.7_

- [x] 13. Checkpoint - Generation Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Test full generation flow
  - Verify rate limiting works
  - Test error handling

- [x] 14. SEO and Sitemap
  - [x] 14.1 Add blog articles to sitemap
    - Update sitemap generation to include blog articles
    - Add lastmod from article updated_at
    - _Requirements: 5.6_

  - [ ]* 14.2 Write property test for sitemap inclusion
    - Verify new articles appear in sitemap
    - **Validates: Requirements 5.6**

- [x] 15. Accessibility and Polish
  - [x] 15.1 Add ARIA labels and keyboard navigation
    - Add aria-labels to all interactive elements
    - Ensure keyboard navigation works
    - Test with screen reader
    - _Requirements: 7.3, 7.4_

  - [x] 15.2 Create placeholder thumbnail images
    - Create SVG placeholders for each category
    - Add to `public/images/blog/`
    - _Requirements: 3.2_

- [x] 16. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Full end-to-end testing
  - Verify all requirements are met
  - Test on mobile and desktop

## Notes

- Tasks marked with `*` are optional property-based tests
- Each checkpoint ensures incremental validation
- The implementation follows existing Micro-Tools patterns for consistency
- Exa MCP integration uses the existing MCP tools in the project
- OpenRouter integration reuses existing `openrouter-client.ts`
