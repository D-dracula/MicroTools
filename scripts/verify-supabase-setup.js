#!/usr/bin/env node

/**
 * Supabase Setup Verification Script
 * 
 * This script verifies that Supabase is properly configured
 * and can connect to the project.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySupabaseSetup() {
  console.log('🔍 Verifying Supabase setup...\n');

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const optionalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let hasErrors = false;

  console.log('📋 Checking environment variables:');
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: Set`);
    } else {
      console.log(`  ❌ ${envVar}: Missing (Required)`);
      hasErrors = true;
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: Set`);
    } else {
      console.log(`  ⚠️  ${envVar}: Missing (Optional, needed for admin operations)`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Setup incomplete. Please check your environment variables.');
    console.log('💡 Copy .env.example to .env.local and fill in your Supabase credentials.');
    process.exit(1);
  }

  // Test connection
  console.log('\n🔗 Testing Supabase connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }

    console.log('  ✅ Connection successful');
    console.log('  ✅ Authentication client working');

    // Test database access (this will fail until tables are created, but connection should work)
    try {
      const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
      if (dbError && !dbError.message.includes('relation "public.profiles" does not exist')) {
        throw dbError;
      }
      console.log('  ✅ Database client working');
    } catch (dbError) {
      if (dbError.message.includes('relation "public.profiles" does not exist')) {
        console.log('  ⚠️  Database tables not created yet (this is expected before migration)');
      } else {
        throw dbError;
      }
    }

    console.log('\n🎉 Supabase setup verification completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run database schema migration (Task 3)');
    console.log('  2. Set up Row Level Security policies (Task 4)');
    console.log('  3. Configure authentication integration (Task 6)');

  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Verify your Supabase project URL and API keys');
    console.log('  2. Check that your Supabase project is active');
    console.log('  3. Ensure your internet connection is working');
    console.log('  4. Check the Supabase dashboard for any project issues');
    process.exit(1);
  }
}

// Run verification
verifySupabaseSetup().catch(console.error);