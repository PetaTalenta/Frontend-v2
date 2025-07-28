#!/usr/bin/env node

/**
 * Demo script untuk menunjukkan cara penggunaan delete-all-results.js
 * Usage: node scripts/demo-delete-usage.js
 * 
 * Script ini akan menunjukkan:
 * 1. Cara mendapatkan token dengan aman
 * 2. Cara menggunakan script delete-all-results
 * 3. Contoh output yang diharapkan
 */

const readline = require('readline');

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
 * Display instructions for getting token
 */
function displayTokenInstructions() {
  console.log('🔐 Cara Mendapatkan Token Authentication');
  console.log('======================================');
  console.log('');
  console.log('1. Buka aplikasi PetaTalenta di browser');
  console.log('2. Login dengan akun Anda:');
  console.log('   Email: rizqy2458@gmail.com');
  console.log('   Password: kiana1234');
  console.log('');
  console.log('3. Setelah login berhasil, buka Developer Console (F12)');
  console.log('4. Pilih tab "Console"');
  console.log('5. Jalankan command berikut:');
  console.log('   localStorage.getItem("token")');
  console.log('');
  console.log('6. Copy token yang muncul (tanpa tanda kutip)');
  console.log('');
}

/**
 * Display usage examples
 */
function displayUsageExamples() {
  console.log('🚀 Cara Menggunakan Script Delete');
  console.log('=================================');
  console.log('');
  console.log('Setelah mendapatkan token, gunakan salah satu cara berikut:');
  console.log('');
  console.log('📋 Windows Command Prompt:');
  console.log('   scripts\\run-delete-all-results.bat "PASTE_TOKEN_HERE"');
  console.log('');
  console.log('💙 Windows PowerShell:');
  console.log('   .\\scripts\\run-delete-all-results.ps1 "PASTE_TOKEN_HERE"');
  console.log('');
  console.log('🐧 Linux/Mac:');
  console.log('   ./scripts/run-delete-all-results.sh "PASTE_TOKEN_HERE"');
  console.log('');
  console.log('📜 Direct Node.js:');
  console.log('   node scripts/delete-all-results.js "PASTE_TOKEN_HERE"');
  console.log('');
}

/**
 * Display test instructions
 */
function displayTestInstructions() {
  console.log('🧪 Test Script Terlebih Dahulu');
  console.log('==============================');
  console.log('');
  console.log('Sebelum menghapus data, test script terlebih dahulu:');
  console.log('');
  console.log('   node scripts/test-delete-all-results.js "PASTE_TOKEN_HERE"');
  console.log('');
  console.log('Test ini akan memverifikasi:');
  console.log('✅ Token validation');
  console.log('✅ API connectivity');
  console.log('✅ Delete functionality (dry run)');
  console.log('✅ Rate limiting');
  console.log('✅ Error handling');
  console.log('');
}

/**
 * Display expected output
 */
function displayExpectedOutput() {
  console.log('📊 Contoh Output yang Diharapkan');
  console.log('================================');
  console.log('');
  console.log('🗑️  Delete All Assessment Results');
  console.log('==================================');
  console.log('');
  console.log('🔐 Token info:');
  console.log('   User: rizqy2458@gmail.com');
  console.log('   Expires: 2024-01-20T10:30:00.000Z');
  console.log('');
  console.log('📋 Mengambil daftar semua hasil assessment...');
  console.log('   ✅ Berhasil mengambil 3 hasil assessment');
  console.log('');
  console.log('📊 Ringkasan hasil assessment:');
  console.log('   1. 550e8400-e29b-41d4-a716-446655440001 - AI-Driven Talent Mapping (15/01/2024)');
  console.log('   2. 550e8400-e29b-41d4-a716-446655440002 - RIASEC Assessment (14/01/2024)');
  console.log('   3. 550e8400-e29b-41d4-a716-446655440003 - Big Five Assessment (13/01/2024)');
  console.log('');
  console.log('⚠️  Anda akan menghapus 3 hasil assessment. Lanjutkan? (y/N): y');
  console.log('');
  console.log('🗑️  Memulai penghapusan...');
  console.log('[1/3] Menghapus 550e8400-e29b-41d4-a716-446655440001...');
  console.log('[1/3] ✅ Berhasil dihapus');
  console.log('[2/3] Menghapus 550e8400-e29b-41d4-a716-446655440002...');
  console.log('[2/3] ✅ Berhasil dihapus');
  console.log('[3/3] Menghapus 550e8400-e29b-41d4-a716-446655440003...');
  console.log('[3/3] ✅ Berhasil dihapus');
  console.log('');
  console.log('📊 Ringkasan penghapusan:');
  console.log('   ✅ Berhasil: 3');
  console.log('   ❌ Gagal: 0');
  console.log('');
  console.log('🎉 Semua hasil assessment berhasil dihapus!');
  console.log('');
}

/**
 * Display safety warnings
 */
function displaySafetyWarnings() {
  console.log('⚠️  PERINGATAN KEAMANAN');
  console.log('=======================');
  console.log('');
  console.log('🚨 PENTING:');
  console.log('• Script ini akan menghapus SEMUA hasil assessment secara PERMANEN');
  console.log('• Data yang sudah dihapus TIDAK DAPAT dikembalikan');
  console.log('• Pastikan Anda benar-benar ingin menghapus semua data');
  console.log('• Disarankan untuk backup data terlebih dahulu jika diperlukan');
  console.log('');
  console.log('🔒 Keamanan Token:');
  console.log('• Jangan share token dengan orang lain');
  console.log('• Token akan expired setelah beberapa waktu');
  console.log('• Jika token expired, login ulang untuk mendapatkan token baru');
  console.log('');
}

/**
 * Interactive demo
 */
async function runInteractiveDemo() {
  console.log('🎯 Demo Interaktif');
  console.log('==================');
  console.log('');
  
  const hasToken = await askQuestion('Apakah Anda sudah memiliki token? (y/N): ');
  
  if (hasToken.toLowerCase() === 'y' || hasToken.toLowerCase() === 'yes') {
    console.log('');
    console.log('✅ Bagus! Anda bisa langsung menggunakan script.');
    console.log('');
    
    const wantTest = await askQuestion('Apakah Anda ingin test script terlebih dahulu? (Y/n): ');
    
    if (wantTest.toLowerCase() !== 'n' && wantTest.toLowerCase() !== 'no') {
      console.log('');
      console.log('🧪 Jalankan command berikut untuk test:');
      console.log('   node scripts/test-delete-all-results.js "PASTE_TOKEN_HERE"');
      console.log('');
    }
    
    const wantDelete = await askQuestion('Apakah Anda siap untuk menghapus semua hasil assessment? (y/N): ');
    
    if (wantDelete.toLowerCase() === 'y' || wantDelete.toLowerCase() === 'yes') {
      console.log('');
      console.log('🗑️  Jalankan salah satu command berikut:');
      console.log('');
      console.log('Windows CMD:');
      console.log('   scripts\\run-delete-all-results.bat "PASTE_TOKEN_HERE"');
      console.log('');
      console.log('PowerShell:');
      console.log('   .\\scripts\\run-delete-all-results.ps1 "PASTE_TOKEN_HERE"');
      console.log('');
      console.log('Direct Node.js:');
      console.log('   node scripts/delete-all-results.js "PASTE_TOKEN_HERE"');
      console.log('');
    } else {
      console.log('');
      console.log('✅ Baik, Anda bisa menjalankan script kapan saja.');
    }
  } else {
    console.log('');
    console.log('📋 Silakan ikuti langkah-langkah di atas untuk mendapatkan token terlebih dahulu.');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🗑️  Delete All Assessment Results - Demo Usage');
  console.log('===============================================');
  console.log('');
  console.log('Demo ini akan menunjukkan cara menggunakan script delete-all-results.js');
  console.log('dengan akun: rizqy2458@gmail.com');
  console.log('');
  
  // Display instructions
  displayTokenInstructions();
  displayUsageExamples();
  displayTestInstructions();
  displaySafetyWarnings();
  displayExpectedOutput();
  
  // Interactive demo
  await runInteractiveDemo();
  
  console.log('');
  console.log('📚 Dokumentasi Lengkap:');
  console.log('   scripts/DELETE_ALL_RESULTS_GUIDE.md');
  console.log('   DELETE_ALL_RESULTS_SUMMARY.md');
  console.log('');
  console.log('✅ Demo selesai. Terima kasih!');
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Demo error:', error.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = { 
  displayTokenInstructions, 
  displayUsageExamples, 
  displayTestInstructions,
  displaySafetyWarnings,
  displayExpectedOutput 
};
