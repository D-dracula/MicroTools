#!/usr/bin/env node

/**
 * Database Operations Test
 * 
 * This script tests basic database operations with Supabase
 * when environment variables are properly configured.
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Database Operations...\n');

// Check if environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Environment variables not configured');
  console.log('ℹ️  Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  console.log('ℹ️  This test requires actual Supabase credentials to verify database connectivity');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   - URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   - Key: ${supabaseKey.substring(0, 20)}...`);

// Test Supabase client creation
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.log('❌ Failed to create Supabase client:', error.message);
  process.exit(1);
}

// Test basic connectivity
async function testConnectivity() {
  try {
    console.log('\n🔗 Testing database connectivity...');
    
    // Try to fetch from a system table (this should work with any Supabase project)
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      // If profiles table doesn't exist, that's expected for a fresh setup
      if (error.code === '42P01') {
        console.log('⚠️  Profiles table not found (expected for fresh setup)');
        console.log('ℹ️  Run migrations to create the required tables');
        return false;
      } else {
        console.log('❌ Database connectivity error:', error.message);
        return false;
      }
    }
    
    console.log('✅ Database connectivity successful');
    return true;
  } catch (error) {
    console.log('❌ Connectivity test failed:', error.message);
    return false;
  }
}

// Test authentication
async function testAuth() {
  try {
    console.log('\n🔐 Testing authentication...');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Auth test failed:', error.message);
      return false;
    }
    
    console.log('✅ Authentication system accessible');
    console.log(`   - Session: ${data.session ? 'Active' : 'None'}`);
    return true;
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const connectivityOk = await testConnectivity();
  const authOk = await testAuth();
  
  console.log('\n📋 Test Results:');
  console.log('================');
  console.log(`Database Connectivity: ${connectivityOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Authentication: ${authOk ? '✅ Working' : '❌ Failed'}`);
  
  if (connectivityOk && authOk) {
    console.log('\n🎉 Basic Supabase integration is working!');
    console.log('ℹ️  To complete setup:');
    console.log('   1. Run database migrations: npm run supabase:migrate');
    console.log('   2. Test authentication flows in the application');
    console.log('   3. Verify RLS policies are working correctly');
  } else {
    console.log('\n⚠️  Some tests failed. Check your Supabase configuration.');
  }
}

runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});