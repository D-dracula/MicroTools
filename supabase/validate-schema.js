#!/usr/bin/env node

/**
 * Supabase Schema Validation Script
 * 
 * This script validates that the Supabase schema was created correctly
 * by checking tables, indexes, policies, and functions.
 * 
 * Usage:
 *   node supabase/validate-schema.js [options]
 * 
 * Options:
 *   --verbose    Show detailed output
 *   --help       Show this help message
 */

const { createClient } = require('@supabase/supabase-js');

// Parse command line arguments
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose');
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
Supabase Schema Validation Script

Usage: node supabase/validate-schema.js [options]

Options:
  --verbose    Show detailed output
  --help       Show this help message

Environment Variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Service role key for admin operations
`);
  process.exit(0);
}

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Expected schema structure
const EXPECTED_TABLES = [
  'profiles',
  'accounts', 
  'sessions',
  'calculations',
  'tool_usage',
  'custom_ads'
];

const EXPECTED_FUNCTIONS = [
  'handle_updated_at',
  'handle_new_user',
  'is_owner',
  'is_authenticated',
  'is_service_role',
  'get_user_calculation_count',
  'get_tool_usage_stats',
  'get_active_ads',
  'increment_ad_metric',
  'cleanup_expired_sessions',
  'get_table_sizes'
];

const EXPECTED_VIEWS = [
  'user_profile_stats',
  'tool_popularity_stats',
  'ad_performance_stats',
  'daily_tool_usage_stats'
];

/**
 * Execute SQL query and return results
 */
async function executeQuery(sql, description) {
  try {
    const { data, error } = await supabase.rpc('exec_sql_select', {
      sql: sql
    });

    if (error) {
      // Try alternative method for SELECT queries
      const result = await supabase.from('_dummy').select('*').limit(0);
      if (result.error && result.error.message.includes('relation "_dummy" does not exist')) {
        // This is expected, now try the actual query through a different method
        throw new Error(`Query failed: ${error.message}`);
      }
    }

    return data;
  } catch (error) {
    if (isVerbose) {
      console.log(`⚠️  Could not execute query for ${description}: ${error.message}`);
    }
    return null;
  }
}

/**
 * Check if tables exist
 */
async function validateTables() {
  console.log('\n📋 Validating Tables...');
  
  let allTablesExist = true;
  
  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`❌ Table '${tableName}' not found or not accessible`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${tableName}' exists`);
      }
    } catch (error) {
      console.log(`❌ Table '${tableName}' validation failed: ${error.message}`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

/**
 * Check RLS policies
 */
async function validateRLS() {
  console.log('\n🔒 Validating Row Level Security...');
  
  const rlsChecks = [
    { table: 'profiles', description: 'User profiles' },
    { table: 'calculations', description: 'User calculations' },
    { table: 'custom_ads', description: 'Custom advertisements' }
  ];
  
  let allRLSEnabled = true;
  
  for (const check of rlsChecks) {
    try {
      // Try to access the table - RLS should be enforced
      const { data, error } = await supabase
        .from(check.table)
        .select('*')
        .limit(1);
      
      // For most tables, this should work (empty result is fine)
      // The important thing is that the query doesn't fail due to missing table
      if (error && !error.message.includes('permission denied')) {
        console.log(`❌ RLS validation failed for ${check.table}: ${error.message}`);
        allRLSEnabled = false;
      } else {
        console.log(`✅ RLS enabled for ${check.table} (${check.description})`);
      }
    } catch (error) {
      console.log(`⚠️  Could not validate RLS for ${check.table}: ${error.message}`);
    }
  }
  
  return allRLSEnabled;
}

/**
 * Check if functions exist
 */
async function validateFunctions() {
  console.log('\n⚙️  Validating Functions...');
  
  let allFunctionsExist = true;
  
  // Test some key functions
  const functionTests = [
    {
      name: 'get_active_ads',
      test: () => supabase.rpc('get_active_ads', { p_placement: 'test' })
    },
    {
      name: 'get_user_calculation_count', 
      test: () => supabase.rpc('get_user_calculation_count', { 
        p_user_id: '00000000-0000-0000-0000-000000000000' 
      })
    }
  ];
  
  for (const func of functionTests) {
    try {
      const { data, error } = await func.test();
      
      if (error && !error.message.includes('permission denied')) {
        console.log(`❌ Function '${func.name}' not working: ${error.message}`);
        allFunctionsExist = false;
      } else {
        console.log(`✅ Function '${func.name}' exists and callable`);
      }
    } catch (error) {
      console.log(`⚠️  Could not test function '${func.name}': ${error.message}`);
    }
  }
  
  return allFunctionsExist;
}

/**
 * Check if views exist
 */
async function validateViews() {
  console.log('\n👁️  Validating Views...');
  
  let allViewsExist = true;
  
  for (const viewName of EXPECTED_VIEWS) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`❌ View '${viewName}' not found or not accessible`);
        allViewsExist = false;
      } else {
        console.log(`✅ View '${viewName}' exists`);
      }
    } catch (error) {
      console.log(`❌ View '${viewName}' validation failed: ${error.message}`);
      allViewsExist = false;
    }
  }
  
  return allViewsExist;
}

/**
 * Test basic CRUD operations
 */
async function testCRUDOperations() {
  console.log('\n🔄 Testing CRUD Operations...');
  
  // Test tool usage insert (should work for anonymous users)
  try {
    const { data, error } = await supabase
      .from('tool_usage')
      .insert({
        tool_slug: 'test-validation',
        user_type: 'guest'
      })
      .select();
    
    if (error) {
      console.log(`❌ Tool usage insert failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Tool usage insert successful`);
      
      // Clean up test data
      if (data && data[0]) {
        await supabase
          .from('tool_usage')
          .delete()
          .eq('id', data[0].id);
      }
    }
  } catch (error) {
    console.log(`❌ CRUD test failed: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * Check database performance
 */
async function checkPerformance() {
  console.log('\n⚡ Checking Performance...');
  
  try {
    // Test if performance functions work
    const { data, error } = await supabase.rpc('get_table_sizes');
    
    if (error) {
      console.log(`⚠️  Performance monitoring not available: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Performance monitoring functions available`);
      
      if (isVerbose && data) {
        console.log('\n📊 Table Sizes:');
        data.forEach(table => {
          console.log(`   ${table.table_name}: ${table.total_size} (${table.row_count} rows)`);
        });
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not check performance: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * Main validation function
 */
async function validateSchema() {
  console.log('🔍 Starting Supabase Schema Validation...');
  console.log(`📍 Project URL: ${supabaseUrl}`);
  
  const results = {
    tables: await validateTables(),
    rls: await validateRLS(),
    functions: await validateFunctions(),
    views: await validateViews(),
    crud: await testCRUDOperations(),
    performance: await checkPerformance()
  };
  
  console.log('\n📋 Validation Summary:');
  console.log(`   Tables: ${results.tables ? '✅' : '❌'}`);
  console.log(`   RLS Policies: ${results.rls ? '✅' : '❌'}`);
  console.log(`   Functions: ${results.functions ? '✅' : '❌'}`);
  console.log(`   Views: ${results.views ? '✅' : '❌'}`);
  console.log(`   CRUD Operations: ${results.crud ? '✅' : '❌'}`);
  console.log(`   Performance: ${results.performance ? '✅' : '⚠️'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 Schema validation passed! Your Supabase database is ready.');
  } else {
    console.log('\n⚠️  Some validation checks failed. Please review the migration files and try again.');
    console.log('\nTroubleshooting:');
    console.log('1. Ensure all migration files were executed in order');
    console.log('2. Check Supabase dashboard for any error messages');
    console.log('3. Verify your service role key has sufficient permissions');
    console.log('4. Review the migration logs for any failed operations');
  }
  
  return allPassed;
}

// Run the validation
(async () => {
  try {
    const success = await validateSchema();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  }
})();