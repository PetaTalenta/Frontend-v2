// Test script untuk profile API
const fetch = require('node-fetch');

async function testProfileAPI() {
  try {
    console.log('Testing profile API proxy...');
    
    // Test GET profile endpoint
    const response = await fetch('http://localhost:3002/api/proxy/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('Response body:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testProfileAPI();
