/**
 * Authentication Testing Script
 * Tests registration, login, and session management
 * 
 * Run with: npx tsx scripts/test-auth.ts
 */

const BASE_URL = process.env.TEST_URL || 'https://pinecalc.com';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Passed',
      duration: Date.now() - start,
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    });
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

// Test 1: Registration API - Missing fields
async function testRegistrationMissingFields() {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.error) {
    throw new Error('Expected error message');
  }
}

// Test 2: Registration API - Invalid email
async function testRegistrationInvalidEmail() {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email',
      password: 'Test1234!',
      name: 'Test User',
    }),
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.error?.includes('email') && !data.details?.some((d: any) => d.field === 'email')) {
    throw new Error('Expected email validation error');
  }
}

// Test 3: Registration API - Weak password
async function testRegistrationWeakPassword() {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: '123', // Too short, no uppercase, no lowercase
      name: 'Test User',
    }),
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.error?.toLowerCase().includes('password') && 
      !data.details?.some((d: any) => d.field === 'password')) {
    throw new Error('Expected password validation error');
  }
}

// Test 4: Registration API - Duplicate email
async function testRegistrationDuplicateEmail() {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'drissgit21@gmail.com', // Existing user
      password: 'Test1234!',
      name: 'Test User',
    }),
  });
  
  if (response.status !== 409) {
    throw new Error(`Expected 409 (conflict), got ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.error?.toLowerCase().includes('exists') && 
      !data.error?.toLowerCase().includes('already')) {
    throw new Error('Expected duplicate user error');
  }
}

// Test 5: Registration API - Valid registration (with unique email)
async function testRegistrationValid() {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'TestPass123!',
      name: 'Test User',
    }),
  });
  
  if (response.status !== 200) {
    const data = await response.json();
    throw new Error(`Expected 200, got ${response.status}: ${data.error || JSON.stringify(data)}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.user?.id) {
    throw new Error('Expected success response with user data');
  }
  
  // Store for cleanup
  console.log(`  Created test user: ${uniqueEmail}`);
}

// Test 6: Login page accessibility
async function testLoginPageAccessible() {
  const response = await fetch(`${BASE_URL}/en/auth/login`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  const html = await response.text();
  if (!html.includes('login') && !html.includes('Login')) {
    throw new Error('Login page content not found');
  }
}

// Test 7: Register page accessibility
async function testRegisterPageAccessible() {
  const response = await fetch(`${BASE_URL}/en/auth/register`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  const html = await response.text();
  if (!html.includes('register') && !html.includes('Register')) {
    throw new Error('Register page content not found');
  }
}

// Test 8: Resend confirmation - Missing email
async function testResendConfirmationMissingEmail() {
  const response = await fetch(`${BASE_URL}/api/auth/resend-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
}

// Test 9: Resend confirmation - Valid email
async function testResendConfirmationValid() {
  const response = await fetch(`${BASE_URL}/api/auth/resend-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' }),
  });
  
  // Should return 200 even if email doesn't exist (security)
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
}

// Test 10: Auth callback - No code
async function testAuthCallbackNoCode() {
  const response = await fetch(`${BASE_URL}/api/auth/callback`, {
    redirect: 'manual',
  });
  
  // Should redirect to login with error
  if (response.status !== 307 && response.status !== 302) {
    throw new Error(`Expected redirect (307/302), got ${response.status}`);
  }
  
  const location = response.headers.get('location');
  if (!location?.includes('error')) {
    throw new Error('Expected redirect to login with error');
  }
}

// Main test runner
async function main() {
  console.log('\n🧪 Authentication Tests');
  console.log('========================');
  console.log(`Testing: ${BASE_URL}\n`);

  // Run all tests
  await runTest('Registration - Missing fields returns 400', testRegistrationMissingFields);
  await runTest('Registration - Invalid email returns 400', testRegistrationInvalidEmail);
  await runTest('Registration - Weak password returns 400', testRegistrationWeakPassword);
  await runTest('Registration - Duplicate email returns 409', testRegistrationDuplicateEmail);
  await runTest('Registration - Valid data creates user', testRegistrationValid);
  await runTest('Login page is accessible', testLoginPageAccessible);
  await runTest('Register page is accessible', testRegisterPageAccessible);
  await runTest('Resend confirmation - Missing email returns 400', testResendConfirmationMissingEmail);
  await runTest('Resend confirmation - Valid email returns 200', testResendConfirmationValid);
  await runTest('Auth callback - No code redirects with error', testAuthCallbackNoCode);

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

main().catch(console.error);
