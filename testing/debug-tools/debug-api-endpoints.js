#!/usr/bin/env node

/**
 * Debug script untuk test API endpoints
 * Usage: node scripts/debug-api-endpoints.js [token]
 */

const https = require('https');
const http = require('http');

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://api.futureguide.id',
  PROXY_URL: 'http://localhost:3000/api/proxy',
  TIMEOUT: 30000
};

// Endpoints to test
const ENDPOINTS_TO_TEST = [
  {
    name: 'Archive Results (Proxy)',
    url: `${API_CONFIG.PROXY_URL}/archive/results`,
    method: 'GET'
  },
  {
    name: 'Archive Results (Direct)',
    url: `${API_CONFIG.BASE_URL}/api/archive/results`,
    method: 'GET'
  },
  {
    name: 'Archive Results with params (Proxy)',
    url: `${API_CONFIG.PROXY_URL}/archive/results?limit=10&page=1`,
    method: 'GET'
  },
  {
    name: 'Archive Results with params (Direct)',
    url: `${API_CONFIG.BASE_URL}/api/archive/results?limit=10&page=1`,
    method: 'GET'
  },
  {
    name: 'Auth Profile (Direct)',
    url: `${API_CONFIG.BASE_URL}/api/auth/profile`,
    method: 'GET'
  },
  {
    name: 'Archive Stats (Direct)',
    url: `${API_CONFIG.BASE_URL}/api/archive/stats`,
    method: 'GET'
  }
];

/**
 * Make HTTP request with detailed logging
 */
function makeRequest(endpoint, token) {
  return new Promise((resolve, reject) => {
    const isHttps = endpoint.url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Debug/1.0',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    console.log(`🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Method: ${endpoint.method}`);
    console.log(`   Headers: ${JSON.stringify(options.headers, null, 2)}`);

    const req = client.request(endpoint.url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`   Response Body: ${JSON.stringify(jsonData, null, 2)}`);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            endpoint: endpoint
          });
        } catch (error) {
          console.log(`   Response Body (Raw): ${data}`);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message,
            endpoint: endpoint
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   Error: ${error.message}`);
      reject({
        error: error.message,
        endpoint: endpoint
      });
    });

    req.setTimeout(API_CONFIG.TIMEOUT, () => {
      req.destroy();
      console.log(`   Timeout: Request timed out after ${API_CONFIG.TIMEOUT}ms`);
      reject({
        error: 'Request timeout',
        endpoint: endpoint
      });
    });

    req.end();
  });
}

/**
 * Test all endpoints
 */
async function testAllEndpoints(token) {
  console.log('🧪 Testing API Endpoints');
  console.log('========================');
  console.log('');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    try {
      const result = await makeRequest(endpoint, token);
      results.push(result);
      console.log(`   ✅ ${result.status < 400 ? 'Success' : 'Error'}`);
    } catch (error) {
      results.push(error);
      console.log(`   ❌ Failed: ${error.error}`);
    }
    
    console.log('');
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Analyze results and provide recommendations
 */
function analyzeResults(results) {
  console.log('📊 Analysis & Recommendations');
  console.log('=============================');
  console.log('');
  
  const successful = results.filter(r => r.status && r.status < 400);
  const failed = results.filter(r => !r.status || r.status >= 400 || r.error);
  
  console.log(`✅ Successful requests: ${successful.length}`);
  console.log(`❌ Failed requests: ${failed.length}`);
  console.log('');
  
  if (successful.length > 0) {
    console.log('✅ Working endpoints:');
    successful.forEach(result => {
      console.log(`   • ${result.endpoint.name} (${result.status})`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('❌ Failed endpoints:');
    failed.forEach(result => {
      const status = result.status || 'Network Error';
      const name = result.endpoint ? result.endpoint.name : 'Unknown';
      console.log(`   • ${name} (${status})`);
      
      if (result.data && typeof result.data === 'object') {
        console.log(`     Error: ${result.data.message || result.data.error || 'Unknown error'}`);
      }
    });
    console.log('');
  }
  
  // Specific recommendations
  console.log('💡 Recommendations:');
  
  const archiveResults = results.filter(r => 
    r.endpoint && r.endpoint.name.includes('Archive Results')
  );
  
  const workingArchive = archiveResults.find(r => r.status && r.status < 400);
  const failedArchive = archiveResults.filter(r => !r.status || r.status >= 400);
  
  if (workingArchive) {
    console.log(`   ✅ Use endpoint: ${workingArchive.endpoint.url}`);
    console.log(`   ✅ Method: ${workingArchive.endpoint.method}`);
  } else if (failedArchive.length > 0) {
    console.log('   ❌ All archive endpoints failed');
    
    // Check specific error codes
    const error400 = failedArchive.find(r => r.status === 400);
    const error401 = failedArchive.find(r => r.status === 401);
    const error404 = failedArchive.find(r => r.status === 404);
    
    if (error400) {
      console.log('   🔧 Error 400: Check request format, parameters, or endpoint URL');
    }
    if (error401) {
      console.log('   🔧 Error 401: Check token validity or authentication headers');
    }
    if (error404) {
      console.log('   🔧 Error 404: Endpoint may not exist or URL is incorrect');
    }
  }
  
  // Check if auth profile works (to verify token)
  const authProfile = results.find(r => 
    r.endpoint && r.endpoint.name.includes('Auth Profile')
  );
  
  if (authProfile && authProfile.status === 200) {
    console.log('   ✅ Token authentication is working');
  } else if (authProfile && authProfile.status === 401) {
    console.log('   ❌ Token authentication failed - token may be invalid');
  }
  
  console.log('');
}

/**
 * Validate token format
 */
function validateToken(token) {
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT format' };
  }
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return {
      valid: true,
      payload: payload
    };
  } catch (error) {
    return { valid: false, error: 'Cannot parse JWT payload' };
  }
}

/**
 * Main function
 */
async function main() {
  const token = process.argv[2];
  
  console.log('🔍 API Endpoints Debug Tool');
  console.log('===========================');
  console.log('');
  
  if (!token) {
    console.log('❌ No token provided');
    console.log('Usage: node scripts/debug-api-endpoints.js <token>');
    console.log('');
    console.log('This will test various API endpoints to identify issues.');
    process.exit(1);
  }
  
  // Validate token
  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    console.log(`❌ Token validation failed: ${tokenValidation.error}`);
    process.exit(1);
  }
  
  console.log('✅ Token format is valid');
  console.log(`📧 Email: ${tokenValidation.payload.email}`);
  console.log(`⏰ Expires: ${new Date(tokenValidation.payload.exp * 1000).toISOString()}`);
  console.log('');
  
  // Test all endpoints
  const results = await testAllEndpoints(token);
  
  // Analyze results
  analyzeResults(results);
  
  console.log('✅ Debug completed');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Debug script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testAllEndpoints, analyzeResults, validateToken };
