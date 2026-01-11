-- Query Optimization Migration
-- This migration adds database functions and optimizations for better performance

-- Create atomic increment functions for ad metrics
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.custom_ads 
  SET impressions = impressions + 1, updated_at = NOW()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.custom_ads 
  SET clicks = clicks + 1, updated_at = NOW()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get tool usage statistics efficiently
CREATE OR REPLACE FUNCTION get_tool_usage_stats(
  tool_slug_param TEXT,
  start_date_param TIMESTAMPTZ DEFAULT NULL,
  end_date_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  total_usage BIGINT,
  unique_users BIGINT,
  usage_by_user_type JSONB,
  usage_by_date JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_usage AS (
    SELECT *
    FROM public.tool_usage
    WHERE tool_slug = tool_slug_param
      AND (start_date_param IS NULL OR created_at >= start_date_param)
      AND (end_date_param IS NULL OR created_at <= end_date_param)
  ),
  user_type_stats AS (
    SELECT jsonb_object_agg(user_type, count) as usage_by_user_type
    FROM (
      SELECT user_type, COUNT(*) as count
      FROM filtered_usage
      GROUP BY user_type
    ) t
  ),
  date_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', date_trunc('day', created_at)::date,
        'count', count
      ) ORDER BY date_trunc('day', created_at)
    ) as usage_by_date
    FROM (
      SELECT date_trunc('day', created_at) as created_at, COUNT(*) as count
      FROM filtered_usage
      GROUP BY date_trunc('day', created_at)
    ) t
  )
  SELECT 
    (SELECT COUNT(*) FROM filtered_usage)::BIGINT as total_usage,
    (SELECT COUNT(DISTINCT user_type) FROM filtered_usage)::BIGINT as unique_users,
    COALESCE((SELECT usage_by_user_type FROM user_type_stats), '{}'::jsonb) as usage_by_user_type,
    COALESCE((SELECT usage_by_date FROM date_stats), '[]'::jsonb) as usage_by_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for efficient calculation analytics
CREATE OR REPLACE FUNCTION get_user_calculation_summary(user_id_param UUID)
RETURNS TABLE(
  total_calculations BIGINT,
  calculations_by_tool JSONB,
  recent_calculations JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_calculations AS (
    SELECT *
    FROM public.calculations
    WHERE user_id = user_id_param
  ),
  tool_stats AS (
    SELECT jsonb_object_agg(tool_slug, count) as calculations_by_tool
    FROM (
      SELECT tool_slug, COUNT(*) as count
      FROM user_calculations
      GROUP BY tool_slug
    ) t
  ),
  recent_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'tool_slug', tool_slug,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as recent_calculations
    FROM (
      SELECT id, tool_slug, created_at
      FROM user_calculations
      ORDER BY created_at DESC
      LIMIT 10
    ) t
  )
  SELECT 
    (SELECT COUNT(*) FROM user_calculations)::BIGINT as total_calculations,
    COALESCE((SELECT calculations_by_tool FROM tool_stats), '{}'::jsonb) as calculations_by_tool,
    COALESCE((SELECT recent_calculations FROM recent_stats), '[]'::jsonb) as recent_calculations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calculations_user_tool_date 
ON public.calculations(user_id, tool_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calculations_created_at_desc 
ON public.calculations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_usage_slug_date 
ON public.tool_usage(tool_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_usage_user_type_date 
ON public.tool_usage(user_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_ads_placement_priority 
ON public.custom_ads(placement, priority DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_custom_ads_active_priority 
ON public.custom_ads(is_active, priority DESC);

-- Create materialized view for frequently accessed analytics (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS tool_usage_daily_stats AS
SELECT 
  tool_slug,
  date_trunc('day', created_at)::date as usage_date,
  COUNT(*) as daily_usage,
  COUNT(DISTINCT user_type) as unique_user_types
FROM public.tool_usage
GROUP BY tool_slug, date_trunc('day', created_at)
ORDER BY tool_slug, usage_date DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_usage_daily_stats_unique 
ON tool_usage_daily_stats(tool_slug, usage_date);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_tool_usage_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tool_usage_daily_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_ad_impressions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ad_clicks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tool_usage_stats(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_calculation_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_tool_usage_stats() TO authenticated;

-- Grant select on materialized view
GRANT SELECT ON tool_usage_daily_stats TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION increment_ad_impressions(UUID) IS 'Atomically increment ad impression count';
COMMENT ON FUNCTION increment_ad_clicks(UUID) IS 'Atomically increment ad click count';
COMMENT ON FUNCTION get_tool_usage_stats(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get comprehensive tool usage statistics efficiently';
COMMENT ON FUNCTION get_user_calculation_summary(UUID) IS 'Get user calculation summary with tool breakdown';
COMMENT ON MATERIALIZED VIEW tool_usage_daily_stats IS 'Daily aggregated tool usage statistics for performance';