-- ============================================================================
-- Supabase Migration: Performance Optimization
-- Additional indexes, functions, and optimizations for better performance
-- Date: 2026-01-11
-- ============================================================================

-- ============================================================================
-- Advanced Indexes for Complex Queries
-- ============================================================================

-- Partial indexes for active ads (more efficient for common queries)
CREATE INDEX IF NOT EXISTS idx_custom_ads_active_current ON public.custom_ads(placement, priority DESC)
WHERE is_active = true 
AND (start_date IS NULL OR start_date <= NOW())
AND (end_date IS NULL OR end_date >= NOW());

-- Index for calculation analytics by date ranges
CREATE INDEX IF NOT EXISTS idx_calculations_date_range ON public.calculations(created_at, tool_slug)
WHERE created_at >= (NOW() - INTERVAL '1 year');

-- Index for tool usage analytics
CREATE INDEX IF NOT EXISTS idx_tool_usage_analytics ON public.tool_usage(tool_slug, user_type, created_at);

-- Index for session cleanup (expired sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_expired ON public.sessions(expires)
WHERE expires < NOW();

-- Covering index for user calculations (includes commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_calculations_user_covering ON public.calculations(user_id, created_at DESC)
INCLUDE (tool_slug, outputs);

-- ============================================================================
-- Database Functions for Common Operations
-- ============================================================================

-- Function to get user calculation count by tool
CREATE OR REPLACE FUNCTION public.get_user_calculation_count(
    p_user_id UUID,
    p_tool_slug TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    calculation_count INTEGER;
BEGIN
    IF p_tool_slug IS NULL THEN
        SELECT COUNT(*) INTO calculation_count
        FROM public.calculations
        WHERE user_id = p_user_id;
    ELSE
        SELECT COUNT(*) INTO calculation_count
        FROM public.calculations
        WHERE user_id = p_user_id AND tool_slug = p_tool_slug;
    END IF;
    
    RETURN COALESCE(calculation_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tool usage statistics
CREATE OR REPLACE FUNCTION public.get_tool_usage_stats(
    p_tool_slug TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_usage BIGINT,
    guest_usage BIGINT,
    authenticated_usage BIGINT,
    daily_average NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_usage,
        COUNT(*) FILTER (WHERE user_type = 'guest') as guest_usage,
        COUNT(*) FILTER (WHERE user_type = 'authenticated') as authenticated_usage,
        ROUND(COUNT(*)::NUMERIC / p_days, 2) as daily_average
    FROM public.tool_usage
    WHERE tool_slug = p_tool_slug
    AND created_at >= (NOW() - (p_days || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active ads for a placement
CREATE OR REPLACE FUNCTION public.get_active_ads(p_placement TEXT)
RETURNS TABLE(
    id UUID,
    title_ar VARCHAR,
    title_en VARCHAR,
    description_ar TEXT,
    description_en TEXT,
    image_url VARCHAR,
    link_url VARCHAR,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.title_ar,
        ca.title_en,
        ca.description_ar,
        ca.description_en,
        ca.image_url,
        ca.link_url,
        ca.priority
    FROM public.custom_ads ca
    WHERE ca.placement = p_placement
    AND ca.is_active = true
    AND (ca.start_date IS NULL OR ca.start_date <= NOW())
    AND (ca.end_date IS NULL OR ca.end_date >= NOW())
    ORDER BY ca.priority DESC, ca.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment ad impressions/clicks atomically
CREATE OR REPLACE FUNCTION public.increment_ad_metric(
    p_ad_id UUID,
    p_metric_type TEXT -- 'impressions' or 'clicks'
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_metric_type = 'impressions' THEN
        UPDATE public.custom_ads
        SET impressions = impressions + 1,
            updated_at = NOW()
        WHERE id = p_ad_id
        AND is_active = true;
    ELSIF p_metric_type = 'clicks' THEN
        UPDATE public.custom_ads
        SET clicks = clicks + 1,
            updated_at = NOW()
        WHERE id = p_ad_id
        AND is_active = true;
    ELSE
        RETURN FALSE;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.sessions
    WHERE expires < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for user profile with calculation stats
CREATE OR REPLACE VIEW public.user_profile_stats AS
SELECT 
    p.id,
    p.name,
    p.image,
    p.created_at,
    COUNT(c.id) as total_calculations,
    COUNT(DISTINCT c.tool_slug) as tools_used,
    MAX(c.created_at) as last_calculation_date
FROM public.profiles p
LEFT JOIN public.calculations c ON p.id = c.user_id
GROUP BY p.id, p.name, p.image, p.created_at;

-- View for tool popularity statistics
CREATE OR REPLACE VIEW public.tool_popularity_stats AS
SELECT 
    tu.tool_slug,
    COUNT(*) as total_usage,
    COUNT(*) FILTER (WHERE tu.user_type = 'guest') as guest_usage,
    COUNT(*) FILTER (WHERE tu.user_type = 'authenticated') as authenticated_usage,
    COUNT(DISTINCT DATE(tu.created_at)) as active_days,
    MAX(tu.created_at) as last_used,
    COUNT(DISTINCT c.user_id) as unique_users_with_calculations
FROM public.tool_usage tu
LEFT JOIN public.calculations c ON tu.tool_slug = c.tool_slug
GROUP BY tu.tool_slug;

-- View for ad performance metrics
CREATE OR REPLACE VIEW public.ad_performance_stats AS
SELECT 
    ca.id,
    ca.placement,
    ca.title_en,
    ca.title_ar,
    ca.impressions,
    ca.clicks,
    CASE 
        WHEN ca.impressions > 0 THEN ROUND((ca.clicks::NUMERIC / ca.impressions) * 100, 2)
        ELSE 0
    END as ctr_percentage,
    ca.created_at,
    ca.is_active,
    CASE
        WHEN ca.start_date IS NULL AND ca.end_date IS NULL THEN 'Always Active'
        WHEN ca.start_date IS NOT NULL AND ca.end_date IS NULL THEN 'Active Since ' || ca.start_date::DATE
        WHEN ca.start_date IS NULL AND ca.end_date IS NOT NULL THEN 'Active Until ' || ca.end_date::DATE
        ELSE 'Scheduled: ' || ca.start_date::DATE || ' to ' || ca.end_date::DATE
    END as schedule_info
FROM public.custom_ads ca;

-- ============================================================================
-- Materialized Views for Heavy Analytics (Optional)
-- ============================================================================

-- Materialized view for daily tool usage statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_tool_usage_stats AS
SELECT 
    DATE(created_at) as usage_date,
    tool_slug,
    user_type,
    COUNT(*) as usage_count
FROM public.tool_usage
GROUP BY DATE(created_at), tool_slug, user_type
ORDER BY usage_date DESC, tool_slug, user_type;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_tool_usage_stats_date ON public.daily_tool_usage_stats(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tool_usage_stats_tool ON public.daily_tool_usage_stats(tool_slug);

-- ============================================================================
-- Scheduled Jobs (using pg_cron if available)
-- ============================================================================

-- Note: pg_cron extension needs to be enabled by Supabase admin
-- These are example scheduled jobs that can be set up

-- Schedule to refresh materialized view daily at 1 AM
-- SELECT cron.schedule('refresh-daily-stats', '0 1 * * *', 'REFRESH MATERIALIZED VIEW public.daily_tool_usage_stats;');

-- Schedule to clean up expired sessions daily at 2 AM
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT public.cleanup_expired_sessions();');

-- ============================================================================
-- Performance Monitoring Functions
-- ============================================================================

-- Function to get table sizes for monitoring
CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    index_size TEXT,
    table_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Permissions for New Functions and Views
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_calculation_count(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tool_usage_stats(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_ads(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_metric(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_sizes() TO service_role;

-- Grant select permissions on views
GRANT SELECT ON public.user_profile_stats TO authenticated;
GRANT SELECT ON public.tool_popularity_stats TO authenticated;
GRANT SELECT ON public.ad_performance_stats TO service_role;
GRANT SELECT ON public.daily_tool_usage_stats TO authenticated;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON FUNCTION public.get_user_calculation_count(UUID, TEXT) IS 
'Returns the count of calculations for a user, optionally filtered by tool';

COMMENT ON FUNCTION public.get_tool_usage_stats(TEXT, INTEGER) IS 
'Returns usage statistics for a specific tool over a given number of days';

COMMENT ON FUNCTION public.get_active_ads(TEXT) IS 
'Returns active advertisements for a specific placement, ordered by priority';

COMMENT ON FUNCTION public.increment_ad_metric(UUID, TEXT) IS 
'Atomically increments impression or click count for an advertisement';

COMMENT ON VIEW public.user_profile_stats IS 
'Provides user profiles with aggregated calculation statistics';

COMMENT ON VIEW public.tool_popularity_stats IS 
'Shows popularity metrics for all tools based on usage data';

COMMENT ON MATERIALIZED VIEW public.daily_tool_usage_stats IS 
'Pre-aggregated daily usage statistics for performance optimization';