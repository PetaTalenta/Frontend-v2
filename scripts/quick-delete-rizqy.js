#!/usr/bin/env node

/**
 * Quick delete script untuk akun rizqy2458@gmail.com
 * Usage: node scripts/quick-delete-rizqy.js [token]
 * 
 * Script ini akan:
 * 1. Meminta token jika tidak diberikan
 * 2. Validasi token untuk akun rizqy2458@gmail.com
 * 3. Menampilkan hasil assessment yang akan dihapus
 * 4. Menghapus semua hasil assessment
 */

const { getAllResults, deleteResult, validateToken } = require('./delete-all-results');
const readline = require('readline');

// Expected user email
const EXPECTED_EMAIL = 'rizqy2458@gmail.com';

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
 * Validate token for specific user
 */
function validateTokenForUser(token) {
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
    
    // Check if token is for the expected user
    if (payload.email !== EXPECTED_EMAIL) {
      return { 
        valid: false, 
        error: `Token untuk user ${payload.email || 'unknown'}, diharapkan ${EXPECTED_EMAIL}` 
      };
    }
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'Token sudah expired' };
    }
    
    return {
      valid: true,
      user: {
        email: payload.email,
        userId: payload.sub || payload.userId,
        expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown'
      }
    };
  } catch (error) {
    return { valid: false, error: 'Tidak dapat parse JWT payload' };
  }
}

/**
 * Display instructions for getting token
 */
function displayInstructions() {
  console.log('🔐 Cara Mendapatkan Token untuk Akun rizqy2458@gmail.com');
  console.log('========================================================');
  console.log('');
  console.log('1. Buka aplikasi PetaTalenta di browser');
  console.log('2. Login dengan:');
  console.log('   📧 Email: rizqy2458@gmail.com');
  console.log('   🔑 Password: kiana1234');
  console.log('');
  console.log('3. Setelah login berhasil, buka Developer Console (F12)');
  console.log('4. Pilih tab "Console"');
  console.log('5. Jalankan command: localStorage.getItem("token")');
  console.log('6. Copy token yang muncul (tanpa tanda kutip)');
  console.log('7. Jalankan script ini dengan token tersebut');
  console.log('');
}

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Delete all results with progress
 */
async function deleteAllResultsWithProgress(results, token) {
  console.log('\n🗑️  Memulai penghapusan...');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const progress = `[${i + 1}/${results.length}]`;
    
    console.log(`${progress} Menghapus ${result.id}...`);
    
    try {
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
    } catch (error) {
      console.log(`${progress} ❌ Error: ${error.message}`);
      failCount++;
      errors.push({
        id: result.id,
        error: error.message
      });
    }
    
    // Rate limiting - wait between requests
    if (i < results.length - 1) {
      await sleep(1000); // 1 second delay
    }
  }
  
  return { successCount, failCount, errors };
}

/**
 * Main function
 */
async function main() {
  let token = process.argv[2];
  
  console.log('🗑️  Quick Delete untuk Akun rizqy2458@gmail.com');
  console.log('================================================');
  console.log('');
  
  // If no token provided, show instructions and ask for it
  if (!token) {
    displayInstructions();
    
    token = await askQuestion('Masukkan token Anda: ');
    console.log('');
  }
  
  // Validate token
  const tokenValidation = validateTokenForUser(token);
  if (!tokenValidation.valid) {
    console.log(`❌ ${tokenValidation.error}`);
    console.log('');
    displayInstructions();
    rl.close();
    process.exit(1);
  }
  
  console.log('✅ Token valid untuk akun rizqy2458@gmail.com');
  console.log(`📧 User: ${tokenValidation.user.email}`);
  console.log(`⏰ Expires: ${tokenValidation.user.expires}`);
  console.log('');
  
  try {
    // Get all results
    console.log('📋 Mengambil daftar hasil assessment...');
    const results = await getAllResults(token);
    
    if (results.length === 0) {
      console.log('✅ Tidak ada hasil assessment yang perlu dihapus');
      rl.close();
      return;
    }
    
    console.log(`📊 Ditemukan ${results.length} hasil assessment:`);
    results.forEach((result, index) => {
      const date = new Date(result.createdAt).toLocaleDateString('id-ID');
      console.log(`   ${index + 1}. ${result.assessmentName || 'Unknown'} (${date})`);
    });
    console.log('');
    
    // Ask for confirmation
    const confirmation = await askQuestion(`⚠️  Anda akan menghapus ${results.length} hasil assessment. Lanjutkan? (y/N): `);
    
    if (confirmation.toLowerCase() !== 'y' && confirmation.toLowerCase() !== 'yes') {
      console.log('❌ Dibatalkan oleh user');
      rl.close();
      return;
    }
    
    // Delete all results
    const deleteResults = await deleteAllResultsWithProgress(results, token);
    
    // Summary
    console.log('\n📊 Ringkasan penghapusan:');
    console.log(`   ✅ Berhasil: ${deleteResults.successCount}`);
    console.log(`   ❌ Gagal: ${deleteResults.failCount}`);
    
    if (deleteResults.errors.length > 0) {
      console.log('\n❌ Error details:');
      deleteResults.errors.forEach(error => {
        console.log(`   ${error.id}: ${error.error}`);
      });
    }
    
    if (deleteResults.successCount === results.length) {
      console.log('\n🎉 Semua hasil assessment berhasil dihapus!');
    } else if (deleteResults.successCount > 0) {
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

module.exports = { validateTokenForUser, deleteAllResultsWithProgress };
