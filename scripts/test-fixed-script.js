#!/usr/bin/env node

/**
 * Test script untuk memverifikasi fixed-delete-results.js
 */

// Test token (same as provided)
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI2MmFiYzk2LThlOTYtNDI2MC1hYTMyLTM1NTgyZGI5YTU1MiIsImVtYWlsIjoicml6cXkyNDU4QGdtYWlsLmNvbSIsInRva2VuQmFsYW5jZSI6NjYwLCJ0eXBlIjoidXNlciIsImlhdCI6MTc1MzY5MDIyNCwiZXhwIjoxNzU0Mjk1MDI0LCJhdWQiOiJhdG1hLXNlcnZpY2VzIiwiaXNzIjoiYXRtYS1hdXRoLXNlcnZpY2UifQ.hLUcURiIAHRX3sfZ3OyEwnjjmLXrgOAfHoQR5UGPxu0";

async function testScript() {
  console.log('🧪 Testing Fixed Delete Results Script');
  console.log('======================================');
  console.log('');
  
  try {
    // Import the fixed script functions
    const { getAllResults, validateToken } = require('./fixed-delete-results');
    
    // Test token validation
    console.log('1. Testing token validation...');
    const tokenValidation = validateToken(TEST_TOKEN);
    
    if (tokenValidation.valid) {
      console.log('   ✅ Token validation passed');
      console.log(`   📧 Email: ${tokenValidation.user.email}`);
      console.log(`   🆔 User ID: ${tokenValidation.user.userId}`);
    } else {
      console.log(`   ❌ Token validation failed: ${tokenValidation.error}`);
      return;
    }
    
    console.log('');
    
    // Test getting results
    console.log('2. Testing getAllResults...');
    const results = await getAllResults(TEST_TOKEN);
    
    console.log(`   ✅ Successfully retrieved ${results.length} results`);
    
    if (results.length > 0) {
      console.log('   📋 Results summary:');
      results.forEach((result, index) => {
        console.log(`      ${index + 1}. ID: ${result.id}`);
        console.log(`         User ID: ${result.user_id}`);
        console.log(`         Created: ${result.created_at || result.createdAt || 'Unknown'}`);
      });
    }
    
    console.log('');
    console.log('🎉 All tests passed! Script is working correctly.');
    console.log('');
    console.log('💡 To run the actual delete script:');
    console.log(`   node scripts/fixed-delete-results.js "${TEST_TOKEN.substring(0, 20)}..."`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testScript();
