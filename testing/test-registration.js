/**
 * Test script for registration API
 * This script helps debug registration issues by testing the API directly
 */

const API_BASE_URL = 'http://localhost:3000';

async function testRegistration() {
  console.log('🧪 Testing Registration API...\n');

  const testCases = [
    {
      name: 'Valid Registration',
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    },
    {
      name: 'Invalid Email Format',
      data: {
        email: 'invalid-email',
        password: 'password123'
      }
    },
    {
      name: 'Short Password',
      data: {
        email: 'test2@example.com',
        password: '123'
      }
    },
    {
      name: 'Missing Email',
      data: {
        password: 'password123'
      }
    },
    {
      name: 'Missing Password',
      data: {
        email: 'test3@example.com'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`📤 Request data:`, testCase.data);

    try {
      const response = await fetch(`${API_BASE_URL}/api/proxy/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });

      const data = await response.json();

      console.log(`📥 Response status: ${response.status}`);
      console.log(`📥 Response data:`, JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('✅ Test passed');
      } else {
        console.log('❌ Test failed (expected for validation tests)');
      }

    } catch (error) {
      console.error('🚨 Network error:', error.message);
    }

    console.log('─'.repeat(50));
  }
}

// Test external API directly
async function testExternalAPI() {
  console.log('\n🌐 Testing External API directly...\n');

  const testData = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    username: `test${Date.now()}`
  };

  try {
    const response = await fetch('https://api.futureguide.id/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FutureGuide-Frontend/1.0',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    console.log(`📥 External API status: ${response.status}`);
    console.log(`📥 External API data:`, JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('🚨 External API error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Registration Tests\n');
  
  await testRegistration();
  await testExternalAPI();
  
  console.log('\n✨ Tests completed!');
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - fetch is available in Node.js 18+
  runTests().catch(console.error);
} else {
  // Browser environment
  window.testRegistration = runTests;
  console.log('Run testRegistration() in the browser console to start tests');
}
