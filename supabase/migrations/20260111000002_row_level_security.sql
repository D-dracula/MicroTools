-- ============================================================================
-- Supabase Migration: Row Level Security (RLS) Policies
-- Implements security policies for data access control
-- Date: 2026-01-11
-- ============================================================================

-- ============================================================================
-- Enable Row Level Security on all tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_ads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Profiles Table Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but policy needed)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Accounts Table Policies
-- ============================================================================

-- Users can view their own accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts" ON public.accounts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts" ON public.accounts
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own accounts" ON public.accounts
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- Sessions Table Policies
-- ============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.sessions
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.sessions
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- Calculations Table Policies
-- ============================================================================

-- Users can view their own calculations
CREATE POLICY "Users can view own calculations" ON public.calculations
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own calculations
CREATE POLICY "Users can insert own calculations" ON public.calculations
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own calculations
CREATE POLICY "Users can update own calculations" ON public.calculations
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own calculations
CREATE POLICY "Users can delete own calculations" ON public.calculations
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- Tool Usage Table Policies
-- ============================================================================

-- Allow anonymous usage tracking (no user_id required)
-- This table tracks usage statistics and doesn't contain sensitive data
CREATE POLICY "Allow anonymous tool usage tracking" ON public.tool_usage
    FOR INSERT 
    WITH CHECK (true);

-- Only authenticated users can view aggregated usage data
-- This could be used for analytics dashboards
CREATE POLICY "Authenticated users can view usage stats" ON public.tool_usage
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- Custom Ads Table Policies
-- ============================================================================

-- Anyone can view active ads (public content)
CREATE POLICY "Anyone can view active ads" ON public.custom_ads
    FOR SELECT 
    USING (
        is_active = true 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    );

-- Only service role can manage ads (admin functionality)
CREATE POLICY "Service role can manage ads" ON public.custom_ads
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow updating impression and click counts (for analytics)
CREATE POLICY "Allow ad analytics updates" ON public.custom_ads
    FOR UPDATE 
    USING (
        is_active = true 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    )
    WITH CHECK (
        is_active = true 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    );

-- ============================================================================
-- Security Functions
-- ============================================================================

-- Function to check if user owns a resource
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if request is from service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Additional Security Measures
-- ============================================================================

-- Prevent direct access to auth schema from public
REVOKE ALL ON SCHEMA auth FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM PUBLIC;

-- Grant necessary permissions for RLS policies
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculations TO authenticated;
GRANT SELECT ON public.tool_usage TO authenticated;
GRANT INSERT ON public.tool_usage TO authenticated, anon;
GRANT SELECT ON public.custom_ads TO authenticated, anon;
GRANT UPDATE (impressions, clicks) ON public.custom_ads TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
'Allows users to view only their own profile data';

COMMENT ON POLICY "Users can view own calculations" ON public.calculations IS 
'Ensures users can only access their own calculation history';

COMMENT ON POLICY "Anyone can view active ads" ON public.custom_ads IS 
'Public access to active advertisements within their scheduled time range';

COMMENT ON POLICY "Allow anonymous tool usage tracking" ON public.tool_usage IS 
'Permits anonymous usage tracking for analytics without exposing user data';

COMMENT ON FUNCTION public.is_owner(UUID) IS 
'Security helper function to verify resource ownership';

COMMENT ON FUNCTION public.is_authenticated() IS 
'Security helper function to check user authentication status';

COMMENT ON FUNCTION public.is_service_role() IS 
'Security helper function to verify service role access';