/**
 * Environment Check Script
 * Tests if environment variables are properly configured
 */

const BASE_URL = process.env.TEST_URL || 'https://pinecalc.com';

async function checkHealth() {
  console.log('🔍 Checking API health...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    console.log('Health Check Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}

async function testRegisterWithDetails() {
  console.log('\n🔍 Testing registration with detailed error...\n');
  
  const uniqueEmail = `test-${Date.now()}@example.com`;
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'TestPass123!',
        name: 'Test User',
      }),
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(data, null, 2));
    } catch {
      console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

async function main() {
  console.log(`Testing: ${BASE_URL}\n`);
  console.log('='.repeat(50));
  
  await checkHealth();
  await testRegisterWithDetails();
}

main().catch(console.error);
