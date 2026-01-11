-- ============================================================================
-- Supabase Schema Verification Queries
-- Use these queries to manually verify the schema was created correctly
-- ============================================================================

-- Check if all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check table row counts
SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_catalog.pg_get_function_result(p.oid) as return_type,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    p.prosecdef as security_definer
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'
ORDER BY function_name;

-- Check views
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Check materialized views
SELECT 
    schemaname,
    matviewname,
    matviewowner,
    ispopulated
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Check triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check foreign keys
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check table constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY table_name, constraint_type, constraint_name;

-- Check column information
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Test basic functionality
-- (These should return empty results but not error)

-- Test profiles table
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Test calculations table  
SELECT COUNT(*) as calculation_count FROM public.calculations;

-- Test tool_usage table
SELECT COUNT(*) as usage_count FROM public.tool_usage;

-- Test custom_ads table
SELECT COUNT(*) as ads_count FROM public.custom_ads;

-- Test functions (should not error)
SELECT public.get_user_calculation_count('00000000-0000-0000-0000-000000000000'::uuid);

-- Test views (should not error)
SELECT COUNT(*) FROM public.user_profile_stats;
SELECT COUNT(*) FROM public.tool_popularity_stats;
SELECT COUNT(*) FROM public.ad_performance_stats;

-- Check RLS is working (should return empty or error with permission denied)
-- This tests that RLS is actually enforced
SET ROLE anon;
SELECT * FROM public.profiles LIMIT 1;
SELECT * FROM public.calculations LIMIT 1;
RESET ROLE;

-- Performance check - table sizes
SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for any missing indexes on foreign keys
SELECT 
    c.conname AS constraint_name,
    t.relname AS table_name,
    ARRAY_AGG(a.attname ORDER BY a.attnum) AS columns,
    pg_size_pretty(pg_relation_size(t.oid)) AS table_size
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
    AND i.indkey::int2[] @> c.conkey::int2[]
)
GROUP BY c.conname, t.relname, t.oid
ORDER BY pg_relation_size(t.oid) DESC;