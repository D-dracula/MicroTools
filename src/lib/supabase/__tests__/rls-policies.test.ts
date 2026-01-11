/**
 * @jest-environment node
 */

import fs from 'fs'
import path from 'path'

// RLS Migration Validation Tests
// These tests validate the RLS migration file structure and completeness

const MIGRATION_FILE = path.join(__dirname, '../../../../supabase/migrations/20260111000002_row_level_security.sql')

describe('Row Level Security (RLS) Migration Validation', () => {
  let migrationContent: string

  beforeAll(() => {
    // Load the migration file
    migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf8')
  })

  describe('RLS Enablement', () => {
    const expectedTables = [
      'public.profiles',
      'public.accounts',
      'public.sessions',
      'public.calculations',
      'public.tool_usage',
      'public.custom_ads'
    ]

    it('should enable RLS on all required tables', () => {
      expectedTables.forEach(table => {
        const rlsPattern = new RegExp(`ALTER TABLE ${table.replace('.', '\\.')} ENABLE ROW LEVEL SECURITY`, 'i')
        expect(migrationContent).toMatch(rlsPattern)
      })
    })
  })

  describe('Security Policies', () => {
    const expectedPolicies = {
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
    }

    Object.entries(expectedPolicies).forEach(([table, policies]) => {
      describe(`${table} policies`, () => {
        policies.forEach(policyName => {
          it(`should have policy: "${policyName}"`, () => {
            const policyPattern = new RegExp(`CREATE POLICY "${policyName}" ON ${table.replace('.', '\\.')}`, 'i')
            expect(migrationContent).toMatch(policyPattern)
          })
        })
      })
    })
  })

  describe('Security Functions', () => {
    const expectedFunctions = [
      'public.is_owner',
      'public.is_authenticated',
      'public.is_service_role'
    ]

    expectedFunctions.forEach(functionName => {
      it(`should define security function: ${functionName}`, () => {
        const functionPattern = new RegExp(`CREATE OR REPLACE FUNCTION ${functionName.replace('.', '\\.')}`, 'i')
        expect(migrationContent).toMatch(functionPattern)
      })
    })
  })

  describe('Authentication Checks', () => {
    it('should use auth.uid() for user identification', () => {
      const authUidPattern = /auth\.uid\(\)/gi
      const matches = migrationContent.match(authUidPattern)
      expect(matches).toBeTruthy()
      expect(matches!.length).toBeGreaterThan(10) // Should be used in multiple policies
    })

    it('should use auth.role() for role-based access', () => {
      const authRolePattern = /auth\.role\(\)/gi
      const matches = migrationContent.match(authRolePattern)
      expect(matches).toBeTruthy()
      expect(matches!.length).toBeGreaterThan(0)
    })

    it('should use auth.jwt() for service role checks', () => {
      const authJwtPattern = /auth\.jwt\(\)/gi
      const matches = migrationContent.match(authJwtPattern)
      expect(matches).toBeTruthy()
    })
  })

  describe('Security Measures', () => {
    it('should revoke public access to auth schema', () => {
      expect(migrationContent).toMatch(/REVOKE ALL ON SCHEMA auth FROM PUBLIC/i)
    })

    it('should grant appropriate schema usage', () => {
      expect(migrationContent).toMatch(/GRANT USAGE ON SCHEMA public TO authenticated/i)
      expect(migrationContent).toMatch(/GRANT USAGE ON SCHEMA public TO anon/i)
    })

    it('should grant table permissions for authenticated users', () => {
      expect(migrationContent).toMatch(/GRANT.*ON public\.profiles TO authenticated/i)
      expect(migrationContent).toMatch(/GRANT.*ON public\.calculations TO authenticated/i)
    })

    it('should grant sequence permissions', () => {
      expect(migrationContent).toMatch(/GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated/i)
      expect(migrationContent).toMatch(/GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon/i)
    })
  })

  describe('Policy Structure Validation', () => {
    it('should have SELECT policies with USING clauses', () => {
      // Look for SELECT policies (may be multi-line)
      const selectPolicies = migrationContent.match(/CREATE POLICY[^;]*FOR SELECT[^;]*USING[^;]*;/gis)
      expect(selectPolicies).toBeTruthy()
      expect(selectPolicies!.length).toBeGreaterThan(5)
    })

    it('should have INSERT policies with WITH CHECK clauses', () => {
      // Look for INSERT policies (may be multi-line)
      const insertPolicies = migrationContent.match(/CREATE POLICY[^;]*FOR INSERT[^;]*WITH CHECK[^;]*;/gis)
      expect(insertPolicies).toBeTruthy()
      expect(insertPolicies!.length).toBeGreaterThan(3)
    })

    it('should have UPDATE policies with both USING and WITH CHECK clauses', () => {
      // Look for UPDATE policies (may be multi-line)
      const updatePolicies = migrationContent.match(/CREATE POLICY[^;]*FOR UPDATE[^;]*USING[^;]*WITH CHECK[^;]*;/gis)
      expect(updatePolicies).toBeTruthy()
      expect(updatePolicies!.length).toBeGreaterThan(3)
    })

    it('should have DELETE policies with USING clauses', () => {
      // Look for DELETE policies (may be multi-line)
      const deletePolicies = migrationContent.match(/CREATE POLICY[^;]*FOR DELETE[^;]*USING[^;]*;/gis)
      expect(deletePolicies).toBeTruthy()
      expect(deletePolicies!.length).toBeGreaterThan(2)
    })
  })

  describe('Documentation', () => {
    it('should include policy comments', () => {
      expect(migrationContent).toMatch(/COMMENT ON POLICY/i)
    })

    it('should include function comments', () => {
      expect(migrationContent).toMatch(/COMMENT ON FUNCTION/i)
    })

    it('should include descriptive comments throughout', () => {
      // Check for section headers and explanatory comments
      expect(migrationContent).toMatch(/Enable Row Level Security/i)
      expect(migrationContent).toMatch(/Security Functions/i)
      expect(migrationContent).toMatch(/Additional Security Measures/i)
    })
  })

  describe('User Isolation Validation', () => {
    it('should enforce user isolation in profiles table', () => {
      expect(migrationContent).toMatch(/auth\.uid\(\) = id/i)
    })

    it('should enforce user isolation in user-related tables', () => {
      expect(migrationContent).toMatch(/auth\.uid\(\) = user_id/i)
    })

    it('should allow anonymous access where appropriate', () => {
      expect(migrationContent).toMatch(/WITH CHECK \(true\)/i) // Anonymous tool usage
    })

    it('should restrict admin operations to service role', () => {
      expect(migrationContent).toMatch(/service_role/i)
    })
  })
})