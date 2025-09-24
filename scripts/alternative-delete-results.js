#!/usr/bin/env node

/**
 * Alternative script untuk menghapus hasil assessment
 * Menggunakan pendekatan berbeda dengan multiple endpoints
 * Usage: node scripts/alternative-delete-results.js [token]
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

// Configuration
const API_CONFIG = {
  BASE_URL: 'https://api.futureguide.id',
  PROXY_URL: 'http://localhost:3000/api/proxy',
  TIMEOUT: 30000,
  RATE_LIMIT_DELAY: 1000 // 1 second delay between requests
};

// Alternative endpoints to try
const ENDPOINTS = {
  // Stats endpoint to get result IDs
  STATS: {
    PROXY: `${API_CONFIG.PROXY_URL}/archive/stats`,
    DIRECT: `${API_CONFIG.BASE_URL}/api/archive/stats`
  },
  // Stats overview endpoint
  STATS_OVERVIEW: {
    PROXY: `${API_CONFIG.PROXY_URL}/archive/stats/overview`,
    DIRECT: `${API_CONFIG.BASE_URL}/api/archive/stats/overview`
  },
  // Unified stats endpoint
  UNIFIED_STATS: {
    PROXY: `${API_CONFIG.PROXY_URL}/archive/api/v1/stats`,
    DIRECT: `${API_CONFIG.BASE_URL}/api/archive/api/v1/stats`
  },
  // Profile endpoint to get user info
  PROFILE: {
    PROXY: `${API_CONFIG.PROXY_URL}/auth/profile`,
    DIRECT: `${API_CONFIG.BASE_URL}/api/auth/profile`
  },
  // Delete result endpoint
  DELETE_RESULT: {
    PROXY: (id) => `${API_CONFIG.PROXY_URL}/archive/results/${id}`,
    DIRECT: (id) => `${API_CONFIG.BASE_URL}/api/archive/results/${id}`
  }
};

/**
 * Create readline interface
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask question and return promise
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Alternative/1.0',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
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

    req.setTimeout(API_CONFIG.TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Get user profile
 */
async function getUserProfile(token) {
  console.log('👤 Mengambil profil user...');
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Try proxy first
    let result = await makeRequest(ENDPOINTS.PROFILE.PROXY, { headers });
    
    // If proxy fails, try direct API
    if (result.status !== 200) {
      console.log('   ⚠️  Proxy gagal, mencoba API langsung...');
      result = await makeRequest(ENDPOINTS.PROFILE.DIRECT, { headers });
    }

    if (result.status === 200 && result.data.success) {
      const profile = result.data.data;
      console.log(`   ✅ Berhasil mengambil profil: ${profile.name || profile.email}`);
      return profile;
    } else if (result.status === 401) {
      throw new Error('Token tidak valid atau sudah expired');
    } else {
      throw new Error(`API error: ${result.status} - ${result.data?.message || 'Unknown error'}`);
    }
  } catch (error) {
    throw new Error(`Gagal mengambil profil: ${error.message}`);
  }
}

/**
 * Get stats to find result IDs
 */
async function getResultsFromStats(token) {
  console.log('📊 Mengambil statistik untuk menemukan hasil assessment...');
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Try all stats endpoints
    const endpoints = [
      { name: 'Stats', url: ENDPOINTS.STATS.PROXY },
      { name: 'Stats', url: ENDPOINTS.STATS.DIRECT },
      { name: 'Stats Overview', url: ENDPOINTS.STATS_OVERVIEW.PROXY },
      { name: 'Stats Overview', url: ENDPOINTS.STATS_OVERVIEW.DIRECT },
      { name: 'Unified Stats', url: ENDPOINTS.UNIFIED_STATS.PROXY },
      { name: 'Unified Stats', url: ENDPOINTS.UNIFIED_STATS.DIRECT }
    ];
    
    let results = [];
    
    for (const endpoint of endpoints) {
      console.log(`   🔍 Mencoba endpoint ${endpoint.name}...`);
      
      try {
        const result = await makeRequest(endpoint.url, { headers });
        
        if (result.status === 200 && result.data.success) {
          console.log(`   ✅ Endpoint ${endpoint.name} berhasil`);
          
          // Extract result IDs from different response formats
          if (result.data.data && result.data.data.results) {
            results = result.data.data.results;
            break;
          } else if (result.data.data && result.data.data.recentResults) {
            results = result.data.data.recentResults;
            break;
          } else if (result.data.data && result.data.data.assessmentResults) {
            results = result.data.data.assessmentResults;
            break;
          } else if (result.data.data && Array.isArray(result.data.data)) {
            results = result.data.data;
            break;
          }
        }
      } catch (error) {
        console.log(`   ❌ Endpoint ${endpoint.name} gagal: ${error.message}`);
      }
    }
    
    if (results.length > 0) {
      console.log(`   ✅ Berhasil menemukan ${results.length} hasil assessment`);
      return results;
    } else {
      throw new Error('Tidak dapat menemukan hasil assessment dari stats');
    }
  } catch (error) {
    throw new Error(`Gagal mengambil stats: ${error.message}`);
  }
}

/**
 * Delete a single result
 */
async function deleteResult(resultId, token) {
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Try proxy first
    let url = ENDPOINTS.DELETE_RESULT.PROXY(resultId);
    let result = await makeRequest(url, { 
      method: 'DELETE',
      headers 
    });
    
    // If proxy fails, try direct API
    if (result.status !== 200) {
      url = ENDPOINTS.DELETE_RESULT.DIRECT(resultId);
      result = await makeRequest(url, { 
        method: 'DELETE',
        headers 
      });
    }

    return {
      success: result.status === 200 && result.data.success,
      status: result.status,
      message: result.data?.message || 'Unknown response',
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate token format
 */
function validateToken(token) {
  if (!token) {
    return false;
  }
  
  // Check if it's a JWT
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('🔐 Token info:');
      console.log(`   User: ${payload.email || 'Unknown'}`);
      console.log(`   Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown'}`);
      return true;
    } catch (error) {
      console.log('⚠️  Token format tidak valid');
      return false;
    }
  }
  
  return false;
}

/**
 * Main function
 */
async function main() {
  const token = process.argv[2];
  
  console.log('🗑️  Alternative Delete All Results');
  console.log('==================================');
  console.log('');
  
  if (!token) {
    console.log('\n❌ Token tidak diberikan');
    console.log('Usage: node scripts/alternative-delete-results.js <token>');
    console.log('\nUntuk mendapatkan token:');
    console.log('1. Login ke aplikasi');
    console.log('2. Buka browser console (F12)');
    console.log('3. Jalankan: localStorage.getItem("token")');
    console.log('4. Copy token dan jalankan script ini');
    process.exit(1);
  }
  
  // Validate token
  if (!validateToken(token)) {
    console.log('❌ Token tidak valid');
    process.exit(1);
  }
  
  try {
    // Get user profile
    const profile = await getUserProfile(token);
    
    // Get results from stats
    const results = await getResultsFromStats(token);
    
    if (results.length === 0) {
      console.log('\n✅ Tidak ada hasil assessment yang perlu dihapus');
      rl.close();
      return;
    }
    
    // Show results summary
    console.log('\n📊 Ringkasan hasil assessment:');
    results.forEach((result, index) => {
      const date = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'Unknown date';
      console.log(`   ${index + 1}. ${result.id} - ${result.assessmentName || result.name || 'Unknown'} (${date})`);
    });
    
    // Ask for confirmation
    const confirmation = await askQuestion(`\n⚠️  Anda akan menghapus ${results.length} hasil assessment. Lanjutkan? (y/N): `);
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('❌ Dibatalkan oleh user');
      rl.close();
      return;
    }
    
    // Delete all results
    console.log('\n🗑️  Memulai penghapusan...');
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const resultId = result.id || result.resultId;
      const progress = `[${i + 1}/${results.length}]`;
      
      console.log(`${progress} Menghapus ${resultId}...`);
      
      const deleteResponse = await deleteResult(resultId, token);
      
      if (deleteResponse.success) {
        console.log(`${progress} ✅ Berhasil dihapus`);
        successCount++;
      } else {
        console.log(`${progress} ❌ Gagal: ${deleteResponse.error || deleteResponse.message}`);
        failCount++;
        errors.push({
          id: resultId,
          error: deleteResponse.error || deleteResponse.message
        });
      }
      
      // Rate limiting - wait between requests
      if (i < results.length - 1) {
        await sleep(API_CONFIG.RATE_LIMIT_DELAY);
      }
    }
    
    // Summary
    console.log('\n📊 Ringkasan penghapusan:');
    console.log(`   ✅ Berhasil: ${successCount}`);
    console.log(`   ❌ Gagal: ${failCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error details:');
      errors.forEach(error => {
        console.log(`   ${error.id}: ${error.error}`);
      });
    }
    
    if (successCount === results.length) {
      console.log('\n🎉 Semua hasil assessment berhasil dihapus!');
    } else if (successCount > 0) {
      console.log('\n⚠️  Penghapusan sebagian berhasil. Periksa error di atas.');
    } else {
      console.log('\n💥 Tidak ada hasil yang berhasil dihapus. Periksa token dan koneksi.');
    }
    
  } catch (error) {
    console.error('\n💥 Script gagal:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = { getUserProfile, getResultsFromStats, deleteResult, validateToken };
