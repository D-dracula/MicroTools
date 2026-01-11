-- Test Schema Management Functions for Supabase
-- 
-- These functions provide test database isolation by creating and managing
-- separate schemas for test execution.
-- 
-- Requirements: 8.2 - Testing Infrastructure

-- Function to create a test schema with all necessary tables
CREATE OR REPLACE FUNCTION create_test_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Create the schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Set search path to include the new schema
  EXECUTE format('SET search_path TO %I, public', schema_name);
  
  -- Create profiles table in test schema
  EXECUTE format('
    CREATE TABLE %I.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      email VARCHAR(255),
      image VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create calculations table in test schema
  EXECUTE format('
    CREATE TABLE %I.calculations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES %I.profiles(id) ON DELETE CASCADE,
      tool_slug VARCHAR(100) NOT NULL,
      inputs JSONB NOT NULL,
      outputs JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  -- Create tool_usage table in test schema
  EXECUTE format('
    CREATE TABLE %I.tool_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_slug VARCHAR(100) NOT NULL,
      user_type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create custom_ads table in test schema
  EXECUTE format('
    CREATE TABLE %I.custom_ads (
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
    )', schema_name);
  
  -- Create accounts table for NextAuth compatibility
  EXECUTE format('
    CREATE TABLE %I.accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES %I.profiles(id) ON DELETE CASCADE,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      provider_account_id VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type VARCHAR(255),
      scope VARCHAR(255),
      id_token TEXT,
      session_state VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(provider, provider_account_id)
    )', schema_name, schema_name);
  
  -- Create sessions table for NextAuth compatibility
  EXECUTE format('
    CREATE TABLE %I.sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_token VARCHAR(255) UNIQUE NOT NULL,
      user_id UUID REFERENCES %I.profiles(id) ON DELETE CASCADE,
      expires TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  -- Create verification_tokens table for NextAuth compatibility
  EXECUTE format('
    CREATE TABLE %I.verification_tokens (
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (identifier, token)
    )', schema_name);
  
  -- Create indexes for performance
  EXECUTE format('CREATE INDEX idx_%I_calculations_user_id ON %I.calculations(user_id)', 
    replace(schema_name, '-', '_'), schema_name);
  EXECUTE format('CREATE INDEX idx_%I_calculations_tool_slug ON %I.calculations(tool_slug)', 
    replace(schema_name, '-', '_'), schema_name);
  EXECUTE format('CREATE INDEX idx_%I_tool_usage_tool_slug ON %I.tool_usage(tool_slug)', 
    replace(schema_name, '-', '_'), schema_name);
  EXECUTE format('CREATE INDEX idx_%I_tool_usage_created_at ON %I.tool_usage(created_at)', 
    replace(schema_name, '-', '_'), schema_name);
  EXECUTE format('CREATE INDEX idx_%I_custom_ads_placement ON %I.custom_ads(placement)', 
    replace(schema_name, '-', '_'), schema_name);
  EXECUTE format('CREATE INDEX idx_%I_custom_ads_is_active ON %I.custom_ads(is_active)', 
    replace(schema_name, '-', '_'), schema_name);
  
  -- Enable RLS on all tables (for testing RLS policies)
  EXECUTE format('ALTER TABLE %I.profiles ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.calculations ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.custom_ads ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.accounts ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ENABLE ROW LEVEL SECURITY', schema_name);
  
  -- Create basic RLS policies for testing
  -- Profiles policies
  EXECUTE format('
    CREATE POLICY test_profiles_select ON %I.profiles
    FOR SELECT USING (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_profiles_insert ON %I.profiles
    FOR INSERT WITH CHECK (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_profiles_update ON %I.profiles
    FOR UPDATE USING (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_profiles_delete ON %I.profiles
    FOR DELETE USING (true)
  ', schema_name);
  
  -- Calculations policies
  EXECUTE format('
    CREATE POLICY test_calculations_select ON %I.calculations
    FOR SELECT USING (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_calculations_insert ON %I.calculations
    FOR INSERT WITH CHECK (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_calculations_update ON %I.calculations
    FOR UPDATE USING (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_calculations_delete ON %I.calculations
    FOR DELETE USING (true)
  ', schema_name);
  
  -- Custom ads policies (public read for testing)
  EXECUTE format('
    CREATE POLICY test_custom_ads_select ON %I.custom_ads
    FOR SELECT USING (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_custom_ads_insert ON %I.custom_ads
    FOR INSERT WITH CHECK (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_custom_ads_update ON %I.custom_ads
    FOR UPDATE USING (true)
  ', schema_name);
  
  EXECUTE format('
    CREATE POLICY test_custom_ads_delete ON %I.custom_ads
    FOR DELETE USING (true)
  ', schema_name);
  
  -- Reset search path
  SET search_path TO public;
  
  RAISE NOTICE 'Test schema % created successfully', schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to drop a test schema and all its contents
CREATE OR REPLACE FUNCTION drop_test_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop the schema and all its contents
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
  
  RAISE NOTICE 'Test schema % dropped successfully', schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up test data from public schema
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS VOID AS $$
BEGIN
  -- Delete test data from all tables (assuming test data has 'test_' prefix)
  DELETE FROM custom_ads WHERE id LIKE 'test_%';
  DELETE FROM tool_usage WHERE id LIKE 'test_%';
  DELETE FROM calculations WHERE id LIKE 'test_%';
  DELETE FROM sessions WHERE id LIKE 'test_%';
  DELETE FROM accounts WHERE id LIKE 'test_%';
  DELETE FROM verification_tokens WHERE identifier LIKE 'test_%';
  DELETE FROM profiles WHERE id LIKE 'test_%';
  
  RAISE NOTICE 'Test data cleaned up from public schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get test schema statistics
CREATE OR REPLACE FUNCTION get_test_schema_stats(schema_name TEXT)
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT
) AS $$
BEGIN
  -- Return row counts for all tables in the test schema
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    COALESCE(
      (SELECT count(*) 
       FROM information_schema.tables ist 
       WHERE ist.table_schema = schema_name 
       AND ist.table_name = t.table_name), 
      0
    ) as row_count
  FROM (
    VALUES 
      ('profiles'),
      ('calculations'),
      ('tool_usage'),
      ('custom_ads'),
      ('accounts'),
      ('sessions'),
      ('verification_tokens')
  ) AS t(table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify test schema integrity
CREATE OR REPLACE FUNCTION verify_test_schema(schema_name TEXT)
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check if schema exists
  SELECT COUNT(*) INTO table_count
  FROM information_schema.schemata 
  WHERE schema_name = $1;
  
  IF table_count = 0 THEN
    RETURN QUERY SELECT 'schema_exists'::TEXT, 'FAIL'::TEXT, 'Schema does not exist'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 'schema_exists'::TEXT, 'PASS'::TEXT, 'Schema exists'::TEXT;
  
  -- Check if all required tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = $1 
  AND table_name IN ('profiles', 'calculations', 'tool_usage', 'custom_ads', 'accounts', 'sessions', 'verification_tokens');
  
  IF table_count = 7 THEN
    RETURN QUERY SELECT 'tables_exist'::TEXT, 'PASS'::TEXT, 'All 7 required tables exist'::TEXT;
  ELSE
    RETURN QUERY SELECT 'tables_exist'::TEXT, 'FAIL'::TEXT, format('Only %s/7 tables exist', table_count)::TEXT;
  END IF;
  
  -- Check if indexes exist
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = $1;
  
  IF index_count >= 6 THEN
    RETURN QUERY SELECT 'indexes_exist'::TEXT, 'PASS'::TEXT, format('%s indexes created', index_count)::TEXT;
  ELSE
    RETURN QUERY SELECT 'indexes_exist'::TEXT, 'WARN'::TEXT, format('Only %s indexes found', index_count)::TEXT;
  END IF;
  
  -- Check if RLS policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = $1;
  
  IF policy_count >= 12 THEN
    RETURN QUERY SELECT 'policies_exist'::TEXT, 'PASS'::TEXT, format('%s RLS policies created', policy_count)::TEXT;
  ELSE
    RETURN QUERY SELECT 'policies_exist'::TEXT, 'WARN'::TEXT, format('Only %s RLS policies found', policy_count)::TEXT;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_test_schema(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION drop_test_schema(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_schema_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_test_schema(TEXT) TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION create_test_schema(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION drop_test_schema(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_test_data() TO service_role;
GRANT EXECUTE ON FUNCTION get_test_schema_stats(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_test_schema(TEXT) TO service_role;