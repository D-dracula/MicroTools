-- ============================================================================
-- Complete Supabase Setup for Micro-Tools
-- Run this in SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ============================================================================

-- Create public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions on schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    image VARCHAR(500),
    email_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- ============================================================================
-- 2. CALCULATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_slug VARCHAR(100) NOT NULL,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_tool_slug ON public.calculations(tool_slug);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON public.calculations(created_at);

-- ============================================================================
-- 3. TOOL USAGE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tool_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_slug VARCHAR(100) NOT NULL,
    user_type VARCHAR(50) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_slug ON public.tool_usage(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON public.tool_usage(created_at);

-- ============================================================================
-- 4. CUSTOM ADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_ads_placement ON public.custom_ads(placement);
CREATE INDEX IF NOT EXISTS idx_custom_ads_is_active ON public.custom_ads(is_active);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_ads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can insert own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can delete own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Service role full access calculations" ON public.calculations;

DROP POLICY IF EXISTS "Anyone can insert tool usage" ON public.tool_usage;
DROP POLICY IF EXISTS "Service role full access tool_usage" ON public.tool_usage;

DROP POLICY IF EXISTS "Anyone can view active ads" ON public.custom_ads;
DROP POLICY IF EXISTS "Service role full access custom_ads" ON public.custom_ads;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access profiles" ON public.profiles
    FOR ALL USING (
        (SELECT auth.jwt()->>'role') = 'service_role'
    );

-- CALCULATIONS policies
CREATE POLICY "Users can view own calculations" ON public.calculations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON public.calculations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations" ON public.calculations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access calculations" ON public.calculations
    FOR ALL USING (
        (SELECT auth.jwt()->>'role') = 'service_role'
    );

-- TOOL USAGE policies (anyone can insert for analytics)
CREATE POLICY "Anyone can insert tool usage" ON public.tool_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access tool_usage" ON public.tool_usage
    FOR ALL USING (
        (SELECT auth.jwt()->>'role') = 'service_role'
    );

-- CUSTOM ADS policies (public read for active ads)
CREATE POLICY "Anyone can view active ads" ON public.custom_ads
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access custom_ads" ON public.custom_ads
    FOR ALL USING (
        (SELECT auth.jwt()->>'role') = 'service_role'
    );

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS custom_ads_updated_at ON public.custom_ads;
CREATE TRIGGER custom_ads_updated_at
    BEFORE UPDATE ON public.custom_ads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on tables
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, DELETE ON public.calculations TO authenticated;
GRANT ALL ON public.calculations TO service_role;

GRANT INSERT ON public.tool_usage TO anon, authenticated;
GRANT ALL ON public.tool_usage TO service_role;

GRANT SELECT ON public.custom_ads TO anon, authenticated;
GRANT ALL ON public.custom_ads TO service_role;

-- ============================================================================
-- DONE! Your database is now ready.
-- ============================================================================
SELECT 'Database setup completed successfully!' as status;
