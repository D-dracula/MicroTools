-- ============================================================================
-- Supabase Migration: Blog Articles System
-- Created for AI-powered blog/articles feature
-- Date: 2026-01-14
-- ============================================================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Articles Table
-- ============================================================================

-- Articles table stores blog articles with full content and metadata
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    reading_time INTEGER NOT NULL,
    sources JSONB DEFAULT '[]',
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT articles_slug_check CHECK (length(slug) > 0 AND slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT articles_title_check CHECK (length(title) > 0 AND length(title) <= 500),
    CONSTRAINT articles_summary_check CHECK (length(summary) > 0),
    CONSTRAINT articles_content_check CHECK (length(content) > 0),
    CONSTRAINT articles_category_check CHECK (
        category IN ('marketing', 'seller-tools', 'logistics', 'trends', 'case-studies')
    ),
    CONSTRAINT articles_reading_time_check CHECK (reading_time > 0),
    CONSTRAINT articles_sources_check CHECK (
        sources IS NOT NULL AND jsonb_typeof(sources) = 'array'
    ),
    CONSTRAINT articles_meta_title_check CHECK (
        meta_title IS NULL OR (length(meta_title) > 0 AND length(meta_title) <= 70)
    ),
    CONSTRAINT articles_meta_description_check CHECK (
        meta_description IS NULL OR (length(meta_description) > 0 AND length(meta_description) <= 160)
    )
);

-- ============================================================================
-- Article Generation Log Table
-- ============================================================================

-- Article generation log for rate limiting and tracking
CREATE TABLE IF NOT EXISTS public.article_generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    topic VARCHAR(500),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT generation_log_topic_check CHECK (
        topic IS NULL OR length(topic) > 0
    )
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON public.articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_published_category ON public.articles(is_published, category, created_at DESC)
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_articles_published_created ON public.articles(is_published, created_at DESC)
WHERE is_published = true;

-- Full-text search index for title and content
CREATE INDEX IF NOT EXISTS idx_articles_search ON public.articles 
USING GIN(to_tsvector('english', title || ' ' || summary || ' ' || content));

-- Article generation log indexes
CREATE INDEX IF NOT EXISTS idx_generation_log_admin_date ON public.article_generation_log(admin_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_log_success ON public.article_generation_log(success);
CREATE INDEX IF NOT EXISTS idx_generation_log_generated_at ON public.article_generation_log(generated_at DESC);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on articles
CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate article sources structure
CREATE OR REPLACE FUNCTION public.validate_article_sources()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if sources is an array of objects with required fields
    IF NEW.sources IS NOT NULL AND jsonb_typeof(NEW.sources) = 'array' THEN
        -- Validate each source has url, title, and domain
        IF EXISTS (
            SELECT 1 FROM jsonb_array_elements(NEW.sources) AS source
            WHERE NOT (
                source ? 'url' AND 
                source ? 'title' AND 
                source ? 'domain' AND
                jsonb_typeof(source->'url') = 'string' AND
                jsonb_typeof(source->'title') = 'string' AND
                jsonb_typeof(source->'domain') = 'string'
            )
        ) THEN
            RAISE EXCEPTION 'Invalid sources format: each source must have url, title, and domain fields';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate sources before insert/update
CREATE TRIGGER validate_article_sources_trigger
    BEFORE INSERT OR UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_article_sources();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.articles IS 'Blog articles with AI-generated content, metadata, and sources';
COMMENT ON TABLE public.article_generation_log IS 'Log of article generation attempts for rate limiting and analytics';

COMMENT ON COLUMN public.articles.id IS 'Unique identifier for the article';
COMMENT ON COLUMN public.articles.slug IS 'URL-friendly slug (lowercase, alphanumeric with hyphens)';
COMMENT ON COLUMN public.articles.title IS 'Article title (max 500 characters)';
COMMENT ON COLUMN public.articles.summary IS 'Brief summary/excerpt of the article';
COMMENT ON COLUMN public.articles.content IS 'Full article content in markdown or HTML';
COMMENT ON COLUMN public.articles.category IS 'Article category: marketing, seller-tools, logistics, trends, or case-studies';
COMMENT ON COLUMN public.articles.tags IS 'Array of tags for filtering and discovery';
COMMENT ON COLUMN public.articles.thumbnail_url IS 'URL to article thumbnail image (16:9 aspect ratio)';
COMMENT ON COLUMN public.articles.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN public.articles.sources IS 'Array of source citations from Exa search [{url, title, domain}]';
COMMENT ON COLUMN public.articles.meta_title IS 'SEO meta title (max 70 characters)';
COMMENT ON COLUMN public.articles.meta_description IS 'SEO meta description (max 160 characters)';
COMMENT ON COLUMN public.articles.is_published IS 'Whether the article is published and visible to users';
COMMENT ON COLUMN public.articles.created_at IS 'Timestamp when the article was created';
COMMENT ON COLUMN public.articles.updated_at IS 'Timestamp when the article was last updated';

COMMENT ON COLUMN public.article_generation_log.admin_id IS 'ID of the admin user who initiated generation';
COMMENT ON COLUMN public.article_generation_log.generated_at IS 'Timestamp when generation was initiated';
COMMENT ON COLUMN public.article_generation_log.topic IS 'Topic that was generated (if successful)';
COMMENT ON COLUMN public.article_generation_log.success IS 'Whether generation completed successfully';
COMMENT ON COLUMN public.article_generation_log.error_message IS 'Error message if generation failed';
