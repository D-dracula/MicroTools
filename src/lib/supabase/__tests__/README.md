# Supabase Testing Infrastructure

This directory contains comprehensive testing infrastructure for Supabase integration, including database isolation, property-based testing, and performance validation.

## Overview

The testing infrastructure provides:

- **Test Database Isolation**: Separate test schemas to prevent interference between tests
- **Test Data Factories**: Utilities to create consistent test data
- **Property-Based Testing**: Comprehensive validation using fast-check
- **Performance Testing**: Query optimization and load testing
- **Error Handling Testing**: Comprehensive error scenario validation

## Requirements Validation

This testing infrastructure validates **Requirements 8.2** from the Supabase integration specification:

> WHEN running tests, THE Database_Client SHALL support test database isolation

## Files Structure

```
__tests__/
├── README.md                    # This file
├── test-setup.ts               # Global test configuration and mocks
├── property-based-tests.ts     # Property-based tests using fast-check
├── client.test.ts              # Basic client configuration tests
├── error-handling.test.ts      # Error handling and retry logic tests
├── auth-integration.test.ts    # Authentication integration tests
├── migration-runner.test.ts    # Migration system tests
├── query-optimization.test.ts  # Query performance tests
└── rls-policies.test.ts        # Row Level Security tests
```

## Test Utilities

### TestDatabaseManager

Provides isolated test database environments:

```typescript
import { setupTestEnvironment, cleanupTestEnvironment } from '../test-utils'

// Setup isolated test environment
const testManager = await setupTestEnvironment({
  useTestDatabase: true,
  isolateTests: true,
  cleanupAfterEach: true,
  seedData: false
})

// Use test client
const client = testManager.getClient()

// Cleanup after tests
await cleanupTestEnvironment()
```

### TestDataFactory

Creates consistent test data:

```typescript
import { createTestDataFactory } from '../test-utils'

const factory = createTestDataFactory()

// Create test user
const user = await factory.createUser({
  name: 'Test User',
  email: 'test@example.com'
})

// Create test calculation
const calculation = await factory.createCalculation(user.id, {
  tool_slug: 'profit-calculator',
  inputs: { revenue: 1000, costs: 600 },
  outputs: { profit: 400, margin: 40 }
})
```

### TestUtils

Validation and assertion utilities:

```typescript
import { createTestUtils } from '../test-utils'

const utils = createTestUtils()

// Assert database state
await utils.assertDatabaseState('profiles', 5) // Expect 5 users

// Verify RLS policies
const rlsWorking = await utils.verifyRLSPolicies(userId)
expect(rlsWorking).toBe(true)

// Test connection
const connected = await utils.testConnection()
expect(connected).toBe(true)
```

## Property-Based Testing

Uses fast-check for comprehensive validation:

```typescript
import * as fc from 'fast-check'

// Property: Database operations maintain referential integrity
await fc.assert(
  fc.asyncProperty(
    fc.record({
      userName: fc.string({ minLength: 1, maxLength: 50 }),
      userEmail: fc.emailAddress(),
    }),
    async (userData) => {
      const user = await factory.createUser(userData)
      const calculation = await factory.createCalculation(user.id)
      
      // Verify referential integrity
      expect(calculation.user_id).toBe(user.id)
    }
  ),
  { numRuns: 100 }
)
```

## Running Tests

### Basic Test Execution

```bash
# Run all Supabase tests
npm run test:supabase

# Run with coverage
npm run test:supabase:coverage

# Run with performance tests
npm run test:supabase:performance

# Run full test suite
npm run test:supabase:full

# Run only property-based tests
npm run test:property
```

### Advanced Options

```bash
# Run without database isolation
tsx scripts/test-supabase.ts --no-isolation

# Run with verbose output
tsx scripts/test-supabase.ts --verbose

# Run tests in parallel
tsx scripts/test-supabase.ts --parallel

# Custom timeout
tsx scripts/test-supabase.ts --timeout 60000
```

## Test Configuration

### Environment Variables

Required for testing:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=test
```

### Jest Configuration

Key settings in `jest.config.js`:

```javascript
{
  testTimeout: 30000,           // 30 seconds for property tests
  maxWorkers: 1,                // Sequential execution for DB tests
  setupFilesAfterEnv: [
    '<rootDir>/src/lib/supabase/__tests__/test-setup.ts'
  ]
}
```

## Test Database Schema

The testing infrastructure can create isolated test schemas with:

- All production tables (profiles, calculations, tool_usage, custom_ads, etc.)
- Proper indexes for performance
- RLS policies for security testing
- Foreign key constraints for integrity testing

### Schema Management Functions

Available SQL functions for test schema management:

```sql
-- Create isolated test schema
SELECT create_test_schema('test_schema_name');

-- Drop test schema
SELECT drop_test_schema('test_schema_name');

-- Clean up test data from public schema
SELECT cleanup_test_data();

-- Get test schema statistics
SELECT * FROM get_test_schema_stats('test_schema_name');

-- Verify test schema integrity
SELECT * FROM verify_test_schema('test_schema_name');
```

## Property Test Examples

### Data Integrity Properties

```typescript
// Property: All created users have valid IDs
fc.property(
  fc.record({ name: fc.string(), email: fc.emailAddress() }),
  async (userData) => {
    const user = await factory.createUser(userData)
    expect(user.id).toBeDefined()
    expect(typeof user.id).toBe('string')
    expect(user.id.length).toBeGreaterThan(0)
  }
)

// Property: Calculations maintain referential integrity
fc.property(
  fc.tuple(fc.string(), fc.record({ tool_slug: fc.string() })),
  async ([userId, calcData]) => {
    const calculation = await factory.createCalculation(userId, calcData)
    expect(calculation.user_id).toBe(userId)
  }
)
```

### Performance Properties

```typescript
// Property: Large datasets are handled efficiently
fc.property(
  fc.integer({ min: 50, max: 200 }),
  async (recordCount) => {
    const startTime = Date.now()
    
    const records = await factory.createMultiple('calculations', recordCount, () => ({
      user_id: 'test-user',
      tool_slug: 'test-tool',
      inputs: { value: Math.random() * 1000 },
      outputs: { result: Math.random() * 2000 }
    }))
    
    const duration = Date.now() - startTime
    
    expect(records).toHaveLength(recordCount)
    expect(duration).toBeLessThan(recordCount * 50) // 50ms per record max
  }
)
```

### Error Handling Properties

```typescript
// Property: Invalid operations fail gracefully
fc.property(
  fc.string(),
  async (invalidUserId) => {
    try {
      await factory.createCalculation(invalidUserId, {
        tool_slug: 'test-tool',
        inputs: {},
        outputs: {}
      })
      
      // Should not reach here
      expect(false).toBe(true)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toMatch(/foreign key|constraint|not found/i)
    }
  }
)
```

## Test Reports

Test execution generates detailed reports in `test-results/`:

```json
{
  "timestamp": "2024-01-11T10:30:00.000Z",
  "config": {
    "isolation": true,
    "propertyTests": true,
    "performanceTests": false,
    "coverage": true
  },
  "results": {
    "passed": 45,
    "failed": 0,
    "skipped": 2,
    "duration": 15000,
    "totalDuration": 18500
  },
  "summary": {
    "total": 47,
    "successRate": 100,
    "avgTestTime": 319.15
  }
}
```

## Best Practices

### Test Isolation

- Always use test database isolation for integration tests
- Clean up test data after each test
- Use unique identifiers for test data (timestamps, random strings)

### Property-Based Testing

- Start with simple properties and build complexity
- Use appropriate generators for your data types
- Set reasonable numRuns based on test complexity (20-100)
- Include edge cases in your generators

### Performance Testing

- Set realistic performance thresholds
- Test with varying data sizes
- Monitor query execution times
- Use fewer runs for performance tests (5-10)

### Error Testing

- Test all expected error conditions
- Verify error messages are helpful
- Test retry logic and circuit breakers
- Validate error recovery mechanisms

## Troubleshooting

### Common Issues

1. **Test Database Connection Fails**
   - Check environment variables
   - Verify Supabase project is accessible
   - Ensure service role key has proper permissions

2. **Property Tests Timeout**
   - Increase test timeout in Jest config
   - Reduce numRuns for complex properties
   - Optimize test data creation

3. **Schema Isolation Fails**
   - Check if test schema functions are installed
   - Verify service role permissions
   - Fall back to public schema cleanup

4. **Tests Interfere with Each Other**
   - Ensure maxWorkers: 1 in Jest config
   - Use proper test isolation
   - Clean up test data between tests

### Debug Mode

Enable verbose logging:

```bash
DEBUG=supabase:* npm run test:supabase --verbose
```

This comprehensive testing infrastructure ensures reliable, isolated, and thorough testing of the Supabase integration while maintaining high performance and data integrity standards.