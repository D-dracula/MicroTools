-- ============================================================================
-- Supabase Migration: Initial Schema Creation
-- Generated from Prisma schema for Micro-Tools application
-- Date: 2026-01-11
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Public Tables (Application Data)
-- ============================================================================

-- Profiles table (extends auth.users)
-- This table stores additional user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    image VARCHAR(500),
    email_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (OAuth and credential accounts)
-- Stores external account information for NextAuth.js integration
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT accounts_provider_provider_account_id_key UNIQUE (provider, provider_account_id)
);

-- Sessions table (user sessions)
-- Stores active user sessions for NextAuth.js
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calculations table (user calculations)
-- Stores calculation results from various tools
CREATE TABLE IF NOT EXISTS public.calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_slug VARCHAR(100) NOT NULL,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT calculations_tool_slug_check CHECK (length(tool_slug) > 0),
    CONSTRAINT calculations_inputs_check CHECK (inputs IS NOT NULL AND jsonb_typeof(inputs) = 'object'),
    CONSTRAINT calculations_outputs_check CHECK (outputs IS NOT NULL AND jsonb_typeof(outputs) = 'object')
);

-- Tool usage tracking table
-- Tracks usage statistics for analytics
CREATE TABLE IF NOT EXISTS public.tool_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_slug VARCHAR(100) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tool_usage_tool_slug_check CHECK (length(tool_slug) > 0),
    CONSTRAINT tool_usage_user_type_check CHECK (user_type IN ('guest', 'authenticated'))
);

-- Custom ads table
-- Stores custom advertisement content and analytics
CREATE TABLE IF NOT EXISTS public.custom_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Bilingual content
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500) NOT NULL,
    
    -- Scheduling
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT custom_ads_placement_check CHECK (length(placement) > 0),
    CONSTRAINT custom_ads_priority_check CHECK (priority >= 0),
    CONSTRAINT custom_ads_title_ar_check CHECK (length(title_ar) > 0),
    CONSTRAINT custom_ads_title_en_check CHECK (length(title_en) > 0),
    CONSTRAINT custom_ads_image_url_check CHECK (length(image_url) > 0),
    CONSTRAINT custom_ads_link_url_check CHECK (length(link_url) > 0),
    CONSTRAINT custom_ads_impressions_check CHECK (impressions >= 0),
    CONSTRAINT custom_ads_clicks_check CHECK (clicks >= 0),
    CONSTRAINT custom_ads_date_range_check CHECK (
        start_date IS NULL OR end_date IS NULL OR start_date <= end_date
    )
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON public.accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON public.accounts(created_at);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON public.sessions(session_token);

-- Calculations indexes
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_tool_slug ON public.calculations(tool_slug);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON public.calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_calculations_user_tool ON public.calculations(user_id, tool_slug);

-- Tool usage indexes
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_slug ON public.tool_usage(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON public.tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_type ON public.tool_usage(user_type);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_date ON public.tool_usage(tool_slug, created_at);

-- Custom ads indexes
CREATE INDEX IF NOT EXISTS idx_custom_ads_placement ON public.custom_ads(placement);
CREATE INDEX IF NOT EXISTS idx_custom_ads_is_active ON public.custom_ads(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_ads_priority ON public.custom_ads(priority DESC);
CREATE INDEX IF NOT EXISTS idx_custom_ads_start_date ON public.custom_ads(start_date);
CREATE INDEX IF NOT EXISTS idx_custom_ads_end_date ON public.custom_ads(end_date);
CREATE INDEX IF NOT EXISTS idx_custom_ads_active_placement ON public.custom_ads(is_active, placement, priority DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_custom_ads_active_schedule ON public.custom_ads(is_active, start_date, end_date) 
WHERE is_active = true;

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER custom_ads_updated_at
    BEFORE UPDATE ON public.custom_ads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to sync user profile with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, created_at, updated_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with additional information';
COMMENT ON TABLE public.accounts IS 'OAuth and credential accounts for NextAuth.js integration';
COMMENT ON TABLE public.sessions IS 'User sessions for NextAuth.js session management';
COMMENT ON TABLE public.calculations IS 'Stored calculation results from various tools';
COMMENT ON TABLE public.tool_usage IS 'Analytics tracking for tool usage statistics';
COMMENT ON TABLE public.custom_ads IS 'Custom advertisement content and analytics';

COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN public.calculations.tool_slug IS 'Identifier for the calculation tool (e.g., profit-margin-calculator)';
COMMENT ON COLUMN public.calculations.inputs IS 'Input parameters used for the calculation';
COMMENT ON COLUMN public.calculations.outputs IS 'Calculated results and derived values';
COMMENT ON COLUMN public.tool_usage.user_type IS 'Type of user: guest or authenticated';
COMMENT ON COLUMN public.custom_ads.placement IS 'Ad placement location (e.g., landing-hero, tool-sidebar)';
COMMENT ON COLUMN public.custom_ads.priority IS 'Display priority (higher numbers shown first)';