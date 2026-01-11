#!/usr/bin/env node

/**
 * RLS Policy Testing Script
 * 
 * This script tests Row Level Security policies with different user scenarios.
 * It requires a live Supabase connection to validate actual RLS enforcement.
 * 
 * Usage:
 *   node scripts/test-rls-policies.js
 * 
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Validate environment variables
function validateEnvironment() {
  const missing = [];
  if (!config.supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!config.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`   ${env}`));
    console.error('\nPlease set these in your .env file or environment.');
    process.exit(1);
  }
}

// Create Supabase clients
function createClients() {
  const anonClient = createClient(config.supabaseUrl, config.anonKey);
  const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return { anonClient, adminClient };
}

// Test utilities
class RLSTestSuite {
  constructor(anonClient, adminClient) {
    this.anonClient = anonClient;
    this.adminClient = adminClient;
    this.testUsers = [];
    this.testData = {};
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createTestUser(email, password) {
    try {
      const { data, error } = await this.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (error) throw error;

      this.testUsers.push({ id: data.user.id, email, password });
      await this.log(`Created test user: ${email}`, 'success');
      return data.user;
    } catch (error) {
      await this.log(`Failed to create test user ${email}: ${error.message}`, 'error');
      throw error;
    }
  }

  async signInUser(email, password) {
    try {
      const { data, error } = await this.anonClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await this.log(`Signed in user: ${email}`, 'success');
      return data.user;
    } catch (error) {
      await this.log(`Failed to sign in user ${email}: ${error.message}`, 'error');
      throw error;
    }
  }

  async signOut() {
    try {
      await this.anonClient.auth.signOut();
      await this.log('Signed out user', 'success');
    } catch (error) {
      await this.log(`Failed to sign out: ${error.message}`, 'error');
    }
  }

  async testProfilesRLS() {
    await this.log('Testing Profiles RLS policies...');

    // Create two test users
    const user1Email = `test-user-1-${Date.now()}@example.com`;
    const user2Email = `test-user-2-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    const user1 = await this.createTestUser(user1Email, password);
    const user2 = await this.createTestUser(user2Email, password);

    // Test 1: User can view their own profile
    await this.signInUser(user1Email, password);
    
    const { data: ownProfile, error: ownProfileError } = await this.anonClient
      .from('profiles')
      .select('*')
      .eq('id', user1.id)
      .single();

    if (ownProfileError) {
      await this.log(`❌ User cannot view own profile: ${ownProfileError.message}`, 'error');
    } else {
      await this.log('✅ User can view own profile', 'success');
    }

    // Test 2: User cannot view other user's profile
    const { data: otherProfile, error: otherProfileError } = await this.anonClient
      .from('profiles')
      .select('*')
      .eq('id', user2.id)
      .single();

    if (otherProfile) {
      await this.log('❌ User can view other user\'s profile (RLS violation)', 'error');
    } else {
      await this.log('✅ User cannot view other user\'s profile', 'success');
    }

    // Test 3: User can update their own profile
    const { data: updatedProfile, error: updateError } = await this.anonClient
      .from('profiles')
      .update({ name: 'Updated Name' })
      .eq('id', user1.id)
      .select()
      .single();

    if (updateError) {
      await this.log(`❌ User cannot update own profile: ${updateError.message}`, 'error');
    } else {
      await this.log('✅ User can update own profile', 'success');
    }

    await this.signOut();
  }

  async testCalculationsRLS() {
    await this.log('Testing Calculations RLS policies...');

    // Use existing test users or create new ones
    if (this.testUsers.length < 2) {
      const user1Email = `calc-user-1-${Date.now()}@example.com`;
      const user2Email = `calc-user-2-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      await this.createTestUser(user1Email, password);
      await this.createTestUser(user2Email, password);
    }

    const user1 = this.testUsers[0];
    const user2 = this.testUsers[1];

    // Sign in as user1
    await this.signInUser(user1.email, user1.password);

    // Test 1: User can insert their own calculation
    const calculationData = {
      user_id: user1.id,
      tool_slug: 'profit-calculator',
      inputs: { revenue: 1000, costs: 600 },
      outputs: { profit: 400, margin: 40 }
    };

    const { data: newCalc, error: insertError } = await this.anonClient
      .from('calculations')
      .insert(calculationData)
      .select()
      .single();

    if (insertError) {
      await this.log(`❌ User cannot insert own calculation: ${insertError.message}`, 'error');
    } else {
      await this.log('✅ User can insert own calculation', 'success');
      this.testData.calculationId = newCalc.id;
    }

    // Test 2: User can view their own calculations
    const { data: ownCalcs, error: ownCalcsError } = await this.anonClient
      .from('calculations')
      .select('*')
      .eq('user_id', user1.id);

    if (ownCalcsError) {
      await this.log(`❌ User cannot view own calculations: ${ownCalcsError.message}`, 'error');
    } else {
      await this.log(`✅ User can view own calculations (${ownCalcs.length} found)`, 'success');
    }

    // Test 3: User cannot view other user's calculations
    const { data: otherCalcs, error: otherCalcsError } = await this.anonClient
      .from('calculations')
      .select('*')
      .eq('user_id', user2.id);

    if (otherCalcsError) {
      await this.log(`❌ Error querying other user's calculations: ${otherCalcsError.message}`, 'error');
    } else if (otherCalcs.length > 0) {
      await this.log('❌ User can view other user\'s calculations (RLS violation)', 'error');
    } else {
      await this.log('✅ User cannot view other user\'s calculations', 'success');
    }

    // Test 4: User cannot insert calculation for another user
    const invalidCalcData = {
      user_id: user2.id, // Different user ID
      tool_slug: 'roi-calculator',
      inputs: { investment: 5000, returns: 6000 },
      outputs: { roi: 20 }
    };

    const { data: invalidCalc, error: invalidInsertError } = await this.anonClient
      .from('calculations')
      .insert(invalidCalcData)
      .select()
      .single();

    if (invalidCalc) {
      await this.log('❌ User can insert calculation for another user (RLS violation)', 'error');
    } else {
      await this.log('✅ User cannot insert calculation for another user', 'success');
    }

    await this.signOut();
  }

  async testCustomAdsRLS() {
    await this.log('Testing Custom Ads RLS policies...');

    // Test 1: Anonymous user can view active ads
    const { data: activeAds, error: activeAdsError } = await this.anonClient
      .from('custom_ads')
      .select('*')
      .eq('is_active', true);

    if (activeAdsError) {
      await this.log(`❌ Anonymous user cannot view active ads: ${activeAdsError.message}`, 'error');
    } else {
      await this.log(`✅ Anonymous user can view active ads (${activeAds.length} found)`, 'success');
    }

    // Test 2: Anonymous user cannot view inactive ads
    const { data: inactiveAds, error: inactiveAdsError } = await this.anonClient
      .from('custom_ads')
      .select('*')
      .eq('is_active', false);

    if (inactiveAdsError) {
      await this.log(`❌ Error querying inactive ads: ${inactiveAdsError.message}`, 'error');
    } else if (inactiveAds.length > 0) {
      await this.log('❌ Anonymous user can view inactive ads (RLS violation)', 'error');
    } else {
      await this.log('✅ Anonymous user cannot view inactive ads', 'success');
    }

    // Test 3: Anonymous user cannot insert ads
    const adData = {
      placement: 'test-placement',
      title_ar: 'إعلان تجريبي',
      title_en: 'Test Ad',
      image_url: 'https://example.com/image.jpg',
      link_url: 'https://example.com'
    };

    const { data: newAd, error: insertAdError } = await this.anonClient
      .from('custom_ads')
      .insert(adData)
      .select()
      .single();

    if (newAd) {
      await this.log('❌ Anonymous user can insert ads (RLS violation)', 'error');
    } else {
      await this.log('✅ Anonymous user cannot insert ads', 'success');
    }
  }

  async testToolUsageRLS() {
    await this.log('Testing Tool Usage RLS policies...');

    // Test 1: Anonymous user can insert usage tracking
    const usageData = {
      tool_slug: 'test-calculator',
      user_type: 'guest'
    };

    const { data: newUsage, error: insertUsageError } = await this.anonClient
      .from('tool_usage')
      .insert(usageData)
      .select()
      .single();

    if (insertUsageError) {
      await this.log(`❌ Anonymous user cannot insert usage tracking: ${insertUsageError.message}`, 'error');
    } else {
      await this.log('✅ Anonymous user can insert usage tracking', 'success');
    }

    // Test 2: Anonymous user cannot view usage stats
    const { data: usageStats, error: usageStatsError } = await this.anonClient
      .from('tool_usage')
      .select('*');

    if (usageStats && usageStats.length > 0) {
      await this.log('❌ Anonymous user can view usage stats (RLS violation)', 'error');
    } else {
      await this.log('✅ Anonymous user cannot view usage stats', 'success');
    }

    // Test 3: Authenticated user can view usage stats
    if (this.testUsers.length > 0) {
      const user = this.testUsers[0];
      await this.signInUser(user.email, user.password);

      const { data: authUsageStats, error: authUsageStatsError } = await this.anonClient
        .from('tool_usage')
        .select('*');

      if (authUsageStatsError) {
        await this.log(`❌ Authenticated user cannot view usage stats: ${authUsageStatsError.message}`, 'error');
      } else {
        await this.log(`✅ Authenticated user can view usage stats (${authUsageStats.length} found)`, 'success');
      }

      await this.signOut();
    }
  }

  async testRLSHelperFunctions() {
    await this.log('Testing RLS helper functions...');

    if (this.testUsers.length > 0) {
      const user = this.testUsers[0];
      await this.signInUser(user.email, user.password);

      // Test is_owner function
      const { data: isOwnerResult, error: isOwnerError } = await this.anonClient
        .rpc('is_owner', { user_id: user.id });

      if (isOwnerError) {
        await this.log(`❌ is_owner function error: ${isOwnerError.message}`, 'error');
      } else if (isOwnerResult === true) {
        await this.log('✅ is_owner function works correctly', 'success');
      } else {
        await this.log('❌ is_owner function returned false for own user', 'error');
      }

      // Test is_authenticated function
      const { data: isAuthResult, error: isAuthError } = await this.anonClient
        .rpc('is_authenticated');

      if (isAuthError) {
        await this.log(`❌ is_authenticated function error: ${isAuthError.message}`, 'error');
      } else if (isAuthResult === true) {
        await this.log('✅ is_authenticated function works correctly', 'success');
      } else {
        await this.log('❌ is_authenticated function returned false for authenticated user', 'error');
      }

      await this.signOut();
    }

    // Test is_service_role function with admin client
    const { data: isServiceResult, error: isServiceError } = await this.adminClient
      .rpc('is_service_role');

    if (isServiceError) {
      await this.log(`❌ is_service_role function error: ${isServiceError.message}`, 'error');
    } else if (isServiceResult === true) {
      await this.log('✅ is_service_role function works correctly', 'success');
    } else {
      await this.log('❌ is_service_role function returned false for service role', 'error');
    }
  }

  async cleanup() {
    await this.log('Cleaning up test data...');

    try {
      // Delete test users
      for (const user of this.testUsers) {
        const { error } = await this.adminClient.auth.admin.deleteUser(user.id);
        if (error) {
          await this.log(`Failed to delete user ${user.email}: ${error.message}`, 'error');
        } else {
          await this.log(`Deleted test user: ${user.email}`, 'success');
        }
      }

      // Delete test calculations (if any)
      if (this.testData.calculationId) {
        const { error } = await this.adminClient
          .from('calculations')
          .delete()
          .eq('id', this.testData.calculationId);

        if (error) {
          await this.log(`Failed to delete test calculation: ${error.message}`, 'error');
        } else {
          await this.log('Deleted test calculation', 'success');
        }
      }

      await this.log('Cleanup completed', 'success');
    } catch (error) {
      await this.log(`Cleanup error: ${error.message}`, 'error');
    }
  }

  async runAllTests() {
    try {
      await this.log('Starting RLS Policy Tests...');
      await this.log('='.repeat(50));

      await this.testProfilesRLS();
      await this.log('-'.repeat(30));

      await this.testCalculationsRLS();
      await this.log('-'.repeat(30));

      await this.testCustomAdsRLS();
      await this.log('-'.repeat(30));

      await this.testToolUsageRLS();
      await this.log('-'.repeat(30));

      await this.testRLSHelperFunctions();
      await this.log('-'.repeat(30));

      await this.log('All RLS tests completed!', 'success');
      await this.log('='.repeat(50));

    } catch (error) {
      await this.log(`Test suite error: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🔒 Supabase RLS Policy Test Suite');
    console.log('==================================\n');

    validateEnvironment();
    
    const { anonClient, adminClient } = createClients();
    const testSuite = new RLSTestSuite(anonClient, adminClient);

    await testSuite.runAllTests();

    console.log('\n✅ All tests completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { RLSTestSuite };