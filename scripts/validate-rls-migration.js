#!/usr/bin/env node

/**
 * RLS Migration Validation Script
 * 
 * This script validates that the RLS migration file contains all necessary
 * policies and security measures according to the design specification.
 * 
 * Usage:
 *   node scripts/validate-rls-migration.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20260111000002_row_level_security.sql');

// Expected RLS components based on design specification
const EXPECTED_COMPONENTS = {
  tables: [
    'public.profiles',
    'public.accounts', 
    'public.sessions',
    'public.calculations',
    'public.tool_usage',
    'public.custom_ads'
  ],
  
  policies: {
    'public.profiles': [
      'Users can view own profile',
      'Users can update own profile',
      'Users can insert own profile'
    ],
    'public.accounts': [
      'Users can view own accounts',
      'Users can insert own accounts',
      'Users can update own accounts',
      'Users can delete own accounts'
    ],
    'public.sessions': [
      'Users can view own sessions',
      'Users can insert own sessions',
      'Users can update own sessions',
      'Users can delete own sessions'
    ],
    'public.calculations': [
      'Users can view own calculations',
      'Users can insert own calculations',
      'Users can update own calculations',
      'Users can delete own calculations'
    ],
    'public.tool_usage': [
      'Allow anonymous tool usage tracking',
      'Authenticated users can view usage stats'
    ],
    'public.custom_ads': [
      'Anyone can view active ads',
      'Service role can manage ads',
      'Allow ad analytics updates'
    ]
  },

  functions: [
    'public.is_owner',
    'public.is_authenticated',
    'public.is_service_role'
  ],

  securityMeasures: [
    'REVOKE ALL ON SCHEMA auth FROM PUBLIC',
    'GRANT USAGE ON SCHEMA public TO authenticated',
    'GRANT USAGE ON SCHEMA public TO anon'
  ]
};

class RLSMigrationValidator {
  constructor() {
    this.migrationContent = '';
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  loadMigrationFile() {
    try {
      if (!fs.existsSync(MIGRATION_FILE)) {
        throw new Error(`Migration file not found: ${MIGRATION_FILE}`);
      }

      this.migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
      this.log(`Loaded migration file: ${MIGRATION_FILE}`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to load migration file: ${error.message}`, 'error');
      this.errors.push(`Migration file loading: ${error.message}`);
      return false;
    }
  }

  validateRLSEnabled() {
    this.log('Validating RLS is enabled on all tables...');
    
    let allTablesEnabled = true;
    
    for (const table of EXPECTED_COMPONENTS.tables) {
      const rlsPattern = new RegExp(`ALTER TABLE ${table.replace('.', '\\.')} ENABLE ROW LEVEL SECURITY`, 'i');
      
      if (rlsPattern.test(this.migrationContent)) {
        this.successes.push(`RLS enabled on ${table}`);
      } else {
        this.errors.push(`RLS not enabled on ${table}`);
        allTablesEnabled = false;
      }
    }

    if (allTablesEnabled) {
      this.log('✅ RLS enabled on all required tables', 'success');
    } else {
      this.log('❌ RLS not enabled on some tables', 'error');
    }

    return allTablesEnabled;
  }

  validatePolicies() {
    this.log('Validating RLS policies...');
    
    let allPoliciesPresent = true;

    for (const [table, policies] of Object.entries(EXPECTED_COMPONENTS.policies)) {
      this.log(`  Checking policies for ${table}...`);
      
      for (const policyName of policies) {
        const policyPattern = new RegExp(`CREATE POLICY "${policyName}" ON ${table.replace('.', '\\.')}`, 'i');
        
        if (policyPattern.test(this.migrationContent)) {
          this.successes.push(`Policy found: "${policyName}" on ${table}`);
        } else {
          this.errors.push(`Missing policy: "${policyName}" on ${table}`);
          allPoliciesPresent = false;
        }
      }
    }

    if (allPoliciesPresent) {
      this.log('✅ All required policies are present', 'success');
    } else {
      this.log('❌ Some required policies are missing', 'error');
    }

    return allPoliciesPresent;
  }

  validateSecurityFunctions() {
    this.log('Validating security helper functions...');
    
    let allFunctionsPresent = true;

    for (const functionName of EXPECTED_COMPONENTS.functions) {
      const functionPattern = new RegExp(`CREATE OR REPLACE FUNCTION ${functionName.replace('.', '\\.')}`, 'i');
      
      if (functionPattern.test(this.migrationContent)) {
        this.successes.push(`Security function found: ${functionName}`);
      } else {
        this.errors.push(`Missing security function: ${functionName}`);
        allFunctionsPresent = false;
      }
    }

    if (allFunctionsPresent) {
      this.log('✅ All security functions are present', 'success');
    } else {
      this.log('❌ Some security functions are missing', 'error');
    }

    return allFunctionsPresent;
  }

  validateSecurityMeasures() {
    this.log('Validating additional security measures...');
    
    let allMeasuresPresent = true;

    for (const measure of EXPECTED_COMPONENTS.securityMeasures) {
      const measurePattern = new RegExp(measure.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      if (measurePattern.test(this.migrationContent)) {
        this.successes.push(`Security measure found: ${measure}`);
      } else {
        this.errors.push(`Missing security measure: ${measure}`);
        allMeasuresPresent = false;
      }
    }

    if (allMeasuresPresent) {
      this.log('✅ All security measures are present', 'success');
    } else {
      this.log('❌ Some security measures are missing', 'error');
    }

    return allMeasuresPresent;
  }

  validatePolicyStructure() {
    this.log('Validating policy structure and syntax...');
    
    const issues = [];

    // Check for proper USING and WITH CHECK clauses
    const policyPatterns = [
      {
        name: 'SELECT policies with USING clause',
        pattern: /CREATE POLICY.*FOR SELECT.*USING\s*\(/gi,
        required: true
      },
      {
        name: 'INSERT policies with WITH CHECK clause',
        pattern: /CREATE POLICY.*FOR INSERT.*WITH CHECK\s*\(/gi,
        required: true
      },
      {
        name: 'UPDATE policies with both USING and WITH CHECK',
        pattern: /CREATE POLICY.*FOR UPDATE.*USING\s*\(.*\)\s*WITH CHECK\s*\(/gi,
        required: true
      },
      {
        name: 'DELETE policies with USING clause',
        pattern: /CREATE POLICY.*FOR DELETE.*USING\s*\(/gi,
        required: true
      }
    ];

    for (const { name, pattern, required } of policyPatterns) {
      const matches = this.migrationContent.match(pattern);
      if (matches && matches.length > 0) {
        this.successes.push(`${name}: ${matches.length} found`);
      } else if (required) {
        issues.push(`No ${name} found`);
      }
    }

    // Check for auth.uid() usage
    const authUidPattern = /auth\.uid\(\)/gi;
    const authUidMatches = this.migrationContent.match(authUidPattern);
    if (authUidMatches && authUidMatches.length > 0) {
      this.successes.push(`auth.uid() used ${authUidMatches.length} times`);
    } else {
      issues.push('auth.uid() not found in policies');
    }

    // Check for proper role checks
    const roleCheckPattern = /auth\.role\(\)/gi;
    const roleCheckMatches = this.migrationContent.match(roleCheckPattern);
    if (roleCheckMatches && roleCheckMatches.length > 0) {
      this.successes.push(`auth.role() used ${roleCheckMatches.length} times`);
    } else {
      this.warnings.push('auth.role() not found - may be intentional');
    }

    if (issues.length === 0) {
      this.log('✅ Policy structure validation passed', 'success');
      return true;
    } else {
      issues.forEach(issue => this.errors.push(`Policy structure: ${issue}`));
      this.log('❌ Policy structure validation failed', 'error');
      return false;
    }
  }

  validateComments() {
    this.log('Validating documentation comments...');
    
    const commentPatterns = [
      /COMMENT ON POLICY/gi,
      /COMMENT ON FUNCTION/gi,
      /COMMENT ON TABLE/gi
    ];

    let hasComments = false;
    for (const pattern of commentPatterns) {
      if (pattern.test(this.migrationContent)) {
        hasComments = true;
        break;
      }
    }

    if (hasComments) {
      this.log('✅ Documentation comments found', 'success');
      this.successes.push('Migration includes documentation comments');
    } else {
      this.warnings.push('No documentation comments found');
      this.log('⚠️ No documentation comments found', 'warning');
    }

    return true;
  }

  generateReport() {
    this.log('\n' + '='.repeat(60));
    this.log('RLS MIGRATION VALIDATION REPORT');
    this.log('='.repeat(60));

    this.log(`\n📊 SUMMARY:`);
    this.log(`   ✅ Successes: ${this.successes.length}`);
    this.log(`   ⚠️  Warnings:  ${this.warnings.length}`);
    this.log(`   ❌ Errors:    ${this.errors.length}`);

    if (this.successes.length > 0) {
      this.log(`\n✅ SUCCESSES (${this.successes.length}):`);
      this.successes.forEach(success => this.log(`   • ${success}`));
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(warning => this.log(`   • ${warning}`));
    }

    if (this.errors.length > 0) {
      this.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach(error => this.log(`   • ${error}`));
    }

    const isValid = this.errors.length === 0;
    
    this.log('\n' + '='.repeat(60));
    if (isValid) {
      this.log('🎉 VALIDATION RESULT: PASSED', 'success');
      this.log('The RLS migration is complete and ready for deployment.');
    } else {
      this.log('💥 VALIDATION RESULT: FAILED', 'error');
      this.log('The RLS migration has issues that need to be addressed.');
    }
    this.log('='.repeat(60));

    return isValid;
  }

  async validate() {
    try {
      this.log('🔒 Starting RLS Migration Validation...\n');

      if (!this.loadMigrationFile()) {
        return false;
      }

      const validations = [
        this.validateRLSEnabled(),
        this.validatePolicies(),
        this.validateSecurityFunctions(),
        this.validateSecurityMeasures(),
        this.validatePolicyStructure(),
        this.validateComments()
      ];

      const allValid = validations.every(result => result);
      
      return this.generateReport();

    } catch (error) {
      this.log(`Validation error: ${error.message}`, 'error');
      return false;
    }
  }
}

// Main execution
async function main() {
  try {
    const validator = new RLSMigrationValidator();
    const isValid = await validator.validate();
    
    process.exit(isValid ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Validation interrupted by user');
  process.exit(1);
});

// Run the validation
if (require.main === module) {
  main();
}

module.exports = { RLSMigrationValidator };