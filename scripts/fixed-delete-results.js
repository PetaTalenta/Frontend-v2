#!/usr/bin/env node

/**
 * Fixed script untuk menghapus semua hasil assessment
 * Usage: node scripts/fixed-delete-results.js [token]
 * 
 * Script ini telah diperbaiki berdasarkan debug hasil API
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
 * Make HTTP request with better error handling
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FutureGuide-Fixed/1.0',
        ...options.headers
      }
    };

    console.log(`🔍 Request: ${requestOptions.method} ${url}`);

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Response: ${res.statusCode} ${res.statusMessage}`);
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          console.log(`⚠️  Response parsing error: ${error.message}`);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message,
            success: false
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
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
 * Get all assessment results with improved error handling
 */
async function getAllResults(token) {
  console.log('📋 Mengambil daftar semua hasil assessment...');
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    // Try proxy first (for development) - limit max 100
    console.log('🔄 Mencoba proxy endpoint...');
    let url = `${API_CONFIG.PROXY_URL}/archive/results?limit=100`;
    let result = await makeRequest(url, { headers });

    // If proxy fails, try direct API
    if (!result.success) {
      console.log('   ⚠️  Proxy gagal, mencoba API langsung...');
      url = `${API_CONFIG.BASE_URL}/api/archive/results?limit=100`;
      result = await makeRequest(url, { headers });
    }

    console.log(`📊 API Response Status: ${result.status}`);
    console.log(`📊 API Response Success: ${result.success}`);
    console.log(`📊 API Response Data Success: ${result.data?.success}`);

    if (result.success && result.data && result.data.success) {
      const results = result.data.data?.results || [];
      console.log(`   ✅ Berhasil mengambil ${results.length} hasil assessment`);
      
      // Log first result for debugging
      if (results.length > 0) {
        console.log(`   🔍 Sample result ID: ${results[0].id}`);
        console.log(`   🔍 Sample result user_id: ${results[0].user_id}`);
      }
      
      return results;
    } else if (result.status === 401) {
      throw new Error('Token tidak valid atau sudah expired');
    } else {
      // More detailed error information
      const errorMsg = result.data?.message || result.data?.error || `HTTP ${result.status}`;
      console.log(`❌ API Error Details:`, result.data);
      throw new Error(`API error: ${result.status} - ${errorMsg}`);
    }
  } catch (error) {
    console.log(`💥 Exception in getAllResults: ${error.message}`);
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
    if (!result.success) {
      url = `${API_CONFIG.BASE_URL}/api/archive/results/${resultId}`;
      result = await makeRequest(url, { 
        method: 'DELETE',
        headers 
      });
    }

    return {
      success: result.success && result.data?.success,
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
    return { valid: false, error: 'Token tidak diberikan' };
  }
  
  // Check if it's a JWT
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Token format tidak valid' };
  }
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return {
      valid: true,
      user: {
        email: payload.email,
        userId: payload.id || payload.sub || payload.userId,
        expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown'
      }
    };
  } catch (error) {
    return { valid: false, error: 'Tidak dapat parse JWT payload' };
  }
}

/**
 * Main function
 */
async function main() {
  const token = process.argv[2];
  
  console.log('🗑️  Fixed Delete All Assessment Results');
  console.log('======================================');
  console.log('');
  
  if (!token) {
    console.log('\n❌ Token tidak diberikan');
    console.log('Usage: node scripts/fixed-delete-results.js <token>');
    console.log('\nUntuk mendapatkan token:');
    console.log('1. Login ke aplikasi');
    console.log('2. Buka browser console (F12)');
    console.log('3. Jalankan: localStorage.getItem("token")');
    console.log('4. Copy token dan jalankan script ini');
    process.exit(1);
  }
  
  // Validate token
  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    console.log(`❌ ${tokenValidation.error}`);
    process.exit(1);
  }
  
  console.log('✅ Token valid');
  console.log(`📧 User: ${tokenValidation.user.email}`);
  console.log(`🆔 User ID: ${tokenValidation.user.userId}`);
  console.log(`⏰ Expires: ${tokenValidation.user.expires}`);
  console.log('');
  
  try {
    // Get all results
    const results = await getAllResults(token);
    
    if (results.length === 0) {
      console.log('\n✅ Tidak ada hasil assessment yang perlu dihapus');
      rl.close();
      return;
    }
    
    // Show results summary
    console.log('\n📊 Ringkasan hasil assessment:');
    results.forEach((result, index) => {
      const date = result.created_at || result.createdAt ? 
        new Date(result.created_at || result.createdAt).toLocaleDateString() : 
        'Unknown date';
      const name = result.assessment_name || result.assessmentName || 'Unknown Assessment';
      console.log(`   ${index + 1}. ${result.id} - ${name} (${date})`);
    });
    
    // Ask for confirmation
    const confirmation = await askQuestion(`\n⚠️  Anda akan menghapus ${results.length} hasil assessment. Lanjutkan? (y/N): `);
    
    if (confirmation.toLowerCase() !== 'y' && confirmation.toLowerCase() !== 'yes') {
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

module.exports = { getAllResults, deleteResult, validateToken };
