#!/usr/bin/env node

/**
 * Script untuk menghapus semua hasil assessment yang ada
 * Usage: node scripts/delete-all-results.js [token]
 * 
 * Script ini akan:
 * 1. Mengambil semua hasil assessment dari user yang sedang login
 * 2. Menghapus satu per satu menggunakan DELETE /api/archive/results/:resultId
 * 3. Memberikan feedback progress dan hasil
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

// Configuration
const API_CONFIG = {
  BASE_URL: 'https://api.chhrone.web.id',
  PROXY_URL: 'http://localhost:3000/api/proxy',
  TIMEOUT: 30000,
  RATE_LIMIT_DELAY: 1000 // 1 second delay between requests to respect rate limits
};

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
 * Get all assessment results for the authenticated user
 */
async function getAllResults(token) {
  console.log('📋 Mengambil daftar semua hasil assessment...');
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Try proxy first (for development) - limit max 100 per API spec
    let url = `${API_CONFIG.PROXY_URL}/archive/results?limit=100`;
    let result = await makeRequest(url, { headers });

    // If proxy fails, try direct API
    if (result.status !== 200) {
      console.log('   ⚠️  Proxy gagal, mencoba API langsung...');
      url = `${API_CONFIG.BASE_URL}/api/archive/results?limit=100`;
      result = await makeRequest(url, { headers });
    }

    if (result.status === 200 && result.data.success) {
      const results = result.data.data.results || [];
      console.log(`   ✅ Berhasil mengambil ${results.length} hasil assessment`);
      return results;
    } else if (result.status === 401) {
      throw new Error('Token tidak valid atau sudah expired');
    } else {
      throw new Error(`API error: ${result.status} - ${result.data?.message || 'Unknown error'}`);
    }
  } catch (error) {
    throw new Error(`Gagal mengambil daftar hasil: ${error.message}`);
  }
}

/**
 * Delete a single assessment result
 */
async function deleteResult(resultId, token) {
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Try proxy first (for development)
    let url = `${API_CONFIG.PROXY_URL}/archive/results/${resultId}`;
    let result = await makeRequest(url, { 
      method: 'DELETE',
      headers 
    });
    
    // If proxy fails, try direct API
    if (result.status !== 200) {
      url = `${API_CONFIG.BASE_URL}/api/archive/results/${resultId}`;
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
 * Ask for user confirmation
 */
function askConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
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
  
  console.log('🗑️  Delete All Assessment Results');
  console.log('==================================');
  
  if (!token) {
    console.log('\n❌ Token tidak diberikan');
    console.log('Usage: node scripts/delete-all-results.js <token>');
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
    // Get all results
    const results = await getAllResults(token);
    
    if (results.length === 0) {
      console.log('\n✅ Tidak ada hasil assessment yang perlu dihapus');
      return;
    }
    
    // Show results summary
    console.log('\n📊 Ringkasan hasil assessment:');
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.id} - ${result.assessmentName || 'Unknown'} (${new Date(result.createdAt).toLocaleDateString()})`);
    });
    
    // Ask for confirmation
    const confirmation = await askConfirmation(`\n⚠️  Anda akan menghapus ${results.length} hasil assessment. Lanjutkan? (y/N): `);
    
    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('❌ Dibatalkan oleh user');
      return;
    }
    
    // Delete all results
    console.log('\n🗑️  Memulai penghapusan...');
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const progress = `[${i + 1}/${results.length}]`;
      
      console.log(`${progress} Menghapus ${result.id}...`);
      
      const deleteResponse = await deleteResult(result.id, token);
      
      if (deleteResponse.success) {
        console.log(`${progress} ✅ Berhasil dihapus`);
        successCount++;
      } else {
        console.log(`${progress} ❌ Gagal: ${deleteResponse.error || deleteResponse.message}`);
        failCount++;
        errors.push({
          id: result.id,
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
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = { getAllResults, deleteResult, validateToken };
