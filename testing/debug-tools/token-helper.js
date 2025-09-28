#!/usr/bin/env node

/**
 * Token Helper Script
 * Membantu user mengambil token dengan berbagai cara
 * Usage: node scripts/token-helper.js
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
 * Display browser instructions
 */
function displayBrowserInstructions() {
  console.log('🌐 Cara Mengambil Token dari Browser');
  console.log('===================================');
  console.log('');
  console.log('1. 🔐 Login ke aplikasi dengan:');
  console.log('   Email: rizqy2458@gmail.com');
  console.log('   Password: kiana1234');
  console.log('');
  console.log('2. 🛠️  Buka Developer Console:');
  console.log('   - Tekan F12');
  console.log('   - Atau klik kanan → Inspect Element');
  console.log('   - Pilih tab "Console"');
  console.log('');
  console.log('3. 📝 Ambil token dengan salah satu cara:');
  console.log('');
  console.log('   🅰️  Cara A - Dengan Enable Pasting:');
  console.log('      • Paste: localStorage.getItem("token")');
  console.log('      • Jika muncul peringatan, ketik: allow pasting');
  console.log('      • Tekan Enter, lalu paste lagi command di atas');
  console.log('');
  console.log('   🅱️  Cara B - Ketik Manual:');
  console.log('      • Ketik: localStorage.getItem("token")');
  console.log('      • Tekan Enter');
  console.log('');
  console.log('   🅲️  Cara C - Browser Lain:');
  console.log('      • Gunakan Firefox (tidak ada peringatan pasting)');
  console.log('      • Atau gunakan tab Sources → Console drawer');
  console.log('');
  console.log('4. 📋 Copy token yang muncul (tanpa tanda kutip)');
  console.log('');
}

/**
 * Display alternative methods
 */
function displayAlternativeMethods() {
  console.log('🔄 Metode Alternatif');
  console.log('===================');
  console.log('');
  console.log('Jika localStorage.getItem("token") tidak berhasil, coba:');
  console.log('');
  console.log('1. localStorage.getItem("authToken")');
  console.log('2. localStorage.getItem("auth_token")');
  console.log('3. sessionStorage.getItem("token")');
  console.log('4. sessionStorage.getItem("authToken")');
  console.log('');
  console.log('Untuk melihat semua data yang tersimpan:');
  console.log('• console.log(localStorage)');
  console.log('• console.log(sessionStorage)');
  console.log('');
}

/**
 * Validate token format
 */
function validateTokenFormat(token) {
  if (!token) {
    return { valid: false, error: 'Token kosong' };
  }
  
  if (token.length < 50) {
    return { valid: false, error: 'Token terlalu pendek' };
  }
  
  // Check if it's a JWT
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Bukan format JWT yang valid' };
  }
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return {
      valid: true,
      info: {
        email: payload.email || 'Unknown',
        userId: payload.sub || payload.userId || 'Unknown',
        expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown',
        isExpired: payload.exp ? payload.exp * 1000 < Date.now() : false
      }
    };
  } catch (error) {
    return { valid: false, error: 'Tidak dapat parse JWT payload' };
  }
}

/**
 * Display token validation result
 */
function displayTokenValidation(token) {
  console.log('🔍 Validasi Token');
  console.log('================');
  console.log('');
  
  const validation = validateTokenFormat(token);
  
  if (validation.valid) {
    console.log('✅ Token valid!');
    console.log(`📧 Email: ${validation.info.email}`);
    console.log(`🆔 User ID: ${validation.info.userId}`);
    console.log(`⏰ Expires: ${validation.info.expires}`);
    console.log(`🕐 Status: ${validation.info.isExpired ? '❌ Expired' : '✅ Active'}`);
    
    if (validation.info.email === 'rizqy2458@gmail.com') {
      console.log('🎯 Token untuk akun yang benar!');
    } else {
      console.log(`⚠️  Token untuk akun ${validation.info.email}, bukan rizqy2458@gmail.com`);
    }
  } else {
    console.log(`❌ Token tidak valid: ${validation.error}`);
  }
  
  console.log('');
  return validation.valid;
}

/**
 * Generate usage commands
 */
function generateUsageCommands(token) {
  console.log('🚀 Command untuk Menjalankan Script');
  console.log('===================================');
  console.log('');
  console.log('Setelah token valid, gunakan salah satu command berikut:');
  console.log('');
  console.log('🎯 Quick Delete (Recommended):');
  console.log(`   scripts\\run-quick-delete-rizqy.bat "${token.substring(0, 20)}..."`);
  console.log('');
  console.log('📜 Direct Node.js:');
  console.log(`   node scripts/quick-delete-rizqy.js "${token.substring(0, 20)}..."`);
  console.log('');
  console.log('🧪 Test Script:');
  console.log(`   node scripts/test-delete-all-results.js "${token.substring(0, 20)}..."`);
  console.log('');
  console.log('💡 Tip: Copy command di atas dan ganti "..." dengan token lengkap');
  console.log('');
}

/**
 * Interactive token input and validation
 */
async function interactiveTokenInput() {
  console.log('📝 Input Token Interaktif');
  console.log('========================');
  console.log('');
  
  const token = await askQuestion('Paste token Anda di sini: ');
  
  if (!token) {
    console.log('❌ Token tidak diberikan');
    return false;
  }
  
  const isValid = displayTokenValidation(token);
  
  if (isValid) {
    generateUsageCommands(token);
    
    const runNow = await askQuestion('Apakah Anda ingin menjalankan quick delete sekarang? (y/N): ');
    
    if (runNow.toLowerCase() === 'y' || runNow.toLowerCase() === 'yes') {
      console.log('');
      console.log('🚀 Menjalankan quick delete script...');
      console.log('');
      
      // Import and run the quick delete script
      try {
        const { validateTokenForUser } = require('./quick-delete-rizqy');
        const validation = validateTokenForUser(token);
        
        if (validation.valid) {
          console.log('✅ Token valid, melanjutkan ke script delete...');
          console.log('');
          
          // Run the main script
          process.argv[2] = token;
          require('./quick-delete-rizqy');
        } else {
          console.log(`❌ ${validation.error}`);
        }
      } catch (error) {
        console.log(`❌ Error menjalankan script: ${error.message}`);
      }
    }
  }
  
  return isValid;
}

/**
 * Main function
 */
async function main() {
  console.log('🔐 Token Helper untuk FutureGuide');
  console.log('==================================');
  console.log('');
  console.log('Script ini membantu Anda mengambil dan menggunakan token authentication');
  console.log('untuk menghapus semua hasil assessment.');
  console.log('');
  
  // Display instructions
  displayBrowserInstructions();
  displayAlternativeMethods();
  
  // Ask if user wants to input token now
  const hasToken = await askQuestion('Apakah Anda sudah memiliki token? (y/N): ');
  
  if (hasToken.toLowerCase() === 'y' || hasToken.toLowerCase() === 'yes') {
    await interactiveTokenInput();
  } else {
    console.log('');
    console.log('📋 Silakan ikuti langkah-langkah di atas untuk mendapatkan token,');
    console.log('kemudian jalankan script ini lagi.');
    console.log('');
    console.log('💡 Atau jalankan langsung:');
    console.log('   node scripts/token-helper.js');
  }
  
  console.log('');
  console.log('📚 Dokumentasi lengkap:');
  console.log('   CARA_AMBIL_TOKEN_DETAIL.md');
  console.log('   PENGGUNAAN_SCRIPT_RIZQY.md');
  console.log('');
  console.log('✅ Token helper selesai. Terima kasih!');
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Token helper error:', error.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = { 
  validateTokenFormat, 
  displayBrowserInstructions, 
  displayAlternativeMethods 
};
