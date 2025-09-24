#!/usr/bin/env node

/**
 * Command line script untuk debugging token balance issues
 * Usage: node scripts/debug-token-balance.js [token]
 */

const https = require('https');
const http = require('http');

// Configuration (Mock API removed)
const ENDPOINTS = [
  { url: 'http://localhost:3000/api/proxy/auth/token-balance', name: 'Proxy API' },
  { url: 'https://api.futureguide.id/api/auth/token-balance', name: 'Real API' }
];

/**
 * Make HTTP request
 */
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test single endpoint
 */
async function testEndpoint(endpoint, token) {
  console.log(`\n🔍 Testing ${endpoint.name}...`);
  console.log(`   URL: ${endpoint.url}`);
  
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const result = await makeRequest(endpoint.url, headers);
    
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log(`   ✅ Success`);
      const balance = result.data?.data?.tokenBalance || result.data?.data?.balance;
      if (balance !== undefined) {
        console.log(`   💰 Token Balance: ${balance}`);
      }
      console.log(`   📄 Response:`, JSON.stringify(result.data, null, 2));
    } else if (result.status === 401) {
      console.log(`   ❌ Authentication Failed`);
      console.log(`   📄 Response:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`   ⚠️  Unexpected Status`);
      console.log(`   📄 Response:`, JSON.stringify(result.data, null, 2));
    }
    
    return result;
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Validate token format
 */
function validateToken(token) {
  console.log('\n🔐 Token Validation...');
  
  if (!token) {
    console.log('   ❌ No token provided');
    return false;
  }
  
  console.log(`   📏 Length: ${token.length} characters`);
  console.log(`   🔤 Prefix: ${token.substring(0, 20)}...`);
  
  // Check if it's a JWT
  const parts = token.split('.');
  if (parts.length === 3) {
    console.log('   ✅ JWT format detected');
    
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('   📋 JWT Payload:');
      console.log('      User ID:', payload.sub || payload.userId || 'Not found');
      console.log('      Email:', payload.email || 'Not found');
      console.log('      Expires:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Not found');
      console.log('      Issued:', payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Not found');
    } catch (error) {
      console.log('   ⚠️  Could not parse JWT payload');
    }
  } else {
    console.log('   ⚠️  Unknown token format');
  }
  
  return true;
}

/**
 * Test API health
 */
async function testApiHealth() {
  console.log('\n🏥 API Health Check...');
  
  const healthEndpoints = [
    'http://localhost:3000/api/health',
    'https://api.futureguide.id/api/health'
  ];
  
  for (const endpoint of healthEndpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);
      const result = await makeRequest(endpoint);
      console.log(`   Status: ${result.status} ${result.status === 200 ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  console.log('\n💡 Recommendations:');
  
  const successful = results.filter(r => r.status === 200);
  const failed = results.filter(r => r.status !== 200 || r.error);
  
  if (successful.length === 0) {
    console.log('   🚨 All APIs failed - check authentication and network');
    console.log('   🔧 Try: Re-login to get a fresh token');
    console.log('   🔧 Try: Check if development server is running (npm run dev)');
    console.log('   🔧 Try: Check internet connection for real API');
  } else if (failed.length === 0) {
    console.log('   ✅ All APIs working correctly');
    
    // Check for consistent balances
    const balances = successful.map(r => {
      return r.data?.data?.tokenBalance || r.data?.data?.balance;
    }).filter(b => b !== undefined);
    
    const uniqueBalances = [...new Set(balances)];
    if (uniqueBalances.length === 1) {
      console.log(`   ✅ Consistent token balance: ${uniqueBalances[0]}`);
    } else {
      console.log('   ⚠️  Inconsistent balances between APIs');
      console.log('   🔧 Check database synchronization');
    }
  } else {
    console.log(`   ⚠️  Mixed results: ${successful.length} working, ${failed.length} failing`);
    
    successful.forEach((r, i) => {
      console.log(`   ✅ ${ENDPOINTS[results.indexOf(r)].name} working`);
    });
    
    failed.forEach((r, i) => {
      const endpoint = ENDPOINTS[results.indexOf(r)];
      if (endpoint) {
        console.log(`   ❌ ${endpoint.name} failed`);
      }
    });
  }
  
  console.log('\n📚 For more help, see: docs/TOKEN_BALANCE_TROUBLESHOOTING.md');
}

/**
 * Main function
 */
async function main() {
  const token = process.argv[2];
  
  console.log('🔍 Token Balance Debug Tool');
  console.log('============================');
  
  if (!token) {
    console.log('\n❌ No token provided');
    console.log('Usage: node scripts/debug-token-balance.js <token>');
    console.log('\nTo get your token:');
    console.log('1. Login to the application');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: localStorage.getItem("token")');
    console.log('4. Copy the token and run this script');
    process.exit(1);
  }
  
  // Validate token
  const isValidToken = validateToken(token);
  if (!isValidToken) {
    process.exit(1);
  }
  
  // Test API health
  await testApiHealth();
  
  // Test all endpoints
  console.log('\n🧪 Testing Token Balance Endpoints...');
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint, token);
    results.push(result);
  }
  
  // Generate recommendations
  generateRecommendations(results);
  
  console.log('\n✅ Debug completed');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testEndpoint, validateToken, testApiHealth };
