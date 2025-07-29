#!/usr/bin/env node

/**
 * Script untuk menampilkan daftar semua script yang tersedia
 * Usage: node scripts/list-scripts.js
 */

const fs = require('fs');
const path = require('path');

// Script categories and descriptions
const SCRIPT_CATEGORIES = {
  'Core Testing Scripts': {
    'quick-token-test.js': 'Test cepat untuk verifikasi token deduction',
    'concurrent-assessment-test.js': 'Test multiple assessment bersamaan',
    'setup-test-users.js': 'Membuat test users untuk testing',
    'run-concurrent-tests.js': 'Menjalankan multiple test instances',
    'single-user-test.js': 'Test assessment untuk single user'
  },
  
  'Data Management Scripts': {
    'delete-all-results.js': 'Menghapus semua hasil assessment user',
    'test-delete-all-results.js': 'Test script untuk delete-all-results.js'
  },
  
  'Debug Scripts': {
    'debug-token-balance.js': 'Debug token balance issues',
    'debug-assessment-flow.js': 'Debug assessment workflow'
  },
  
  'Utility Scripts': {
    'test-loading-page.js': 'Test loading page functionality',
    'test-navigation.js': 'Test navigation functionality',
    'test-results-navigation.js': 'Test results page navigation',
    'test-summary.js': 'Generate test summary reports',
    'test-websocket-api.js': 'Test WebSocket API functionality',
    'test-websocket.js': 'Test WebSocket connections'
  },
  
  'Wrapper Scripts (Windows)': {
    'run-assessment-tests.bat': 'Menu interaktif untuk Windows (CMD)',
    'run-delete-all-results.bat': 'Wrapper Windows untuk delete script',
    'run-token-debug.ps1': 'PowerShell wrapper untuk token debug'
  },
  
  'Wrapper Scripts (PowerShell)': {
    'run-assessment-tests.ps1': 'Menu interaktif PowerShell',
    'run-delete-all-results.ps1': 'PowerShell wrapper untuk delete script'
  },
  
  'Wrapper Scripts (Unix)': {
    'run-assessment-tests.sh': 'Menu interaktif untuk Linux/Mac',
    'run-delete-all-results.sh': 'Shell wrapper untuk delete script',
    'run-token-debug.sh': 'Shell wrapper untuk token debug'
  }
};

/**
 * Get all script files in the scripts directory
 */
function getScriptFiles() {
  const scriptsDir = __dirname;
  const files = fs.readdirSync(scriptsDir);
  
  return files.filter(file => {
    const ext = path.extname(file);
    return ['.js', '.bat', '.ps1', '.sh'].includes(ext);
  }).sort();
}

/**
 * Check if script file exists and is executable
 */
function checkScriptStatus(filename) {
  const filepath = path.join(__dirname, filename);
  
  try {
    const stats = fs.statSync(filepath);
    const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
    
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      executable: isExecutable
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Display script information
 */
function displayScriptInfo(filename, description, status) {
  const ext = path.extname(filename);
  const icon = {
    '.js': '📜',
    '.bat': '🪟',
    '.ps1': '💙',
    '.sh': '🐧'
  }[ext] || '📄';
  
  console.log(`   ${icon} ${filename}`);
  console.log(`      📝 ${description}`);
  
  if (status.exists) {
    console.log(`      📊 Size: ${status.size} bytes, Modified: ${status.modified.toLocaleDateString()}`);
    if (ext === '.sh' || ext === '.js') {
      console.log(`      🔐 Executable: ${status.executable ? 'Yes' : 'No'}`);
    }
  } else {
    console.log(`      ❌ File not found: ${status.error}`);
  }
  
  console.log('');
}

/**
 * Display usage examples
 */
function displayUsageExamples() {
  console.log('💡 Usage Examples');
  console.log('=================');
  console.log('');
  
  console.log('🧪 Testing:');
  console.log('   node testing/scripts/quick-token-test.js');
  console.log('   node testing/scripts/concurrent-assessment-test.js');
  console.log('   node testing/scripts/test-delete-all-results.js <token>');
  console.log('');
  
  console.log('🗑️  Data Management:');
  console.log('   node scripts/delete-all-results.js <token>');
  console.log('   scripts\\run-delete-all-results.bat <token>  # Windows');
  console.log('   ./scripts/run-delete-all-results.sh <token>  # Linux/Mac');
  console.log('');
  
  console.log('🔍 Debugging:');
  console.log('   node scripts/debug-token-balance.js <token>');
  console.log('   node scripts/debug-assessment-flow.js');
  console.log('');
  
  console.log('📋 Interactive Menus:');
  console.log('   scripts\\run-assessment-tests.bat  # Windows CMD');
  console.log('   .\\scripts\\run-assessment-tests.ps1  # PowerShell');
  console.log('   ./scripts/run-assessment-tests.sh  # Linux/Mac');
  console.log('');
}

/**
 * Display configuration info
 */
function displayConfigurationInfo() {
  console.log('⚙️  Configuration');
  console.log('=================');
  console.log('');
  
  console.log('📁 Configuration Files:');
  console.log('   scripts/config.example.js - Example configuration');
  console.log('   test-data/test-credentials.json - Test user credentials');
  console.log('');
  
  console.log('🔧 Environment Variables:');
  console.log('   CLEANUP_TEST_USERS=true - Enable test user cleanup');
  console.log('   ASSESSMENT_TIMEOUT=300000 - Custom timeout (ms)');
  console.log('   DEBUG=true - Enable debug logging');
  console.log('');
  
  console.log('🌐 API Endpoints:');
  console.log('   Proxy: http://localhost:3000/api/proxy');
  console.log('   Direct: https://api.chhrone.web.id');
  console.log('');
}

/**
 * Display documentation links
 */
function displayDocumentationLinks() {
  console.log('📚 Documentation');
  console.log('================');
  console.log('');
  
  console.log('📖 Main Documentation:');
  console.log('   scripts/README.md - Main scripts documentation');
  console.log('   scripts/DELETE_ALL_RESULTS_GUIDE.md - Delete script guide');
  console.log('');
  
  console.log('📋 API Documentation:');
  console.log('   docs/API_INTEGRATION_GUIDE.md');
  console.log('   docs/ASSESSMENT_INTEGRATION_GUIDE.md');
  console.log('   docs/TOKEN_BALANCE_TROUBLESHOOTING.md');
  console.log('');
}

/**
 * Main function
 */
function main() {
  console.log('📜 PetaTalenta Scripts Directory');
  console.log('================================');
  console.log('');
  
  const scriptFiles = getScriptFiles();
  const totalScripts = scriptFiles.length;
  
  console.log(`Found ${totalScripts} script files in the scripts directory.`);
  console.log('');
  
  // Display scripts by category
  Object.entries(SCRIPT_CATEGORIES).forEach(([category, scripts]) => {
    console.log(`📂 ${category}`);
    console.log(''.padEnd(category.length + 3, '-'));
    
    Object.entries(scripts).forEach(([filename, description]) => {
      const status = checkScriptStatus(filename);
      displayScriptInfo(filename, description, status);
    });
  });
  
  // Display uncategorized scripts
  const categorizedScripts = Object.values(SCRIPT_CATEGORIES)
    .reduce((acc, scripts) => [...acc, ...Object.keys(scripts)], []);
  
  const uncategorizedScripts = scriptFiles.filter(file => 
    !categorizedScripts.includes(file) && 
    !['list-scripts.js', 'README.md', 'config.example.js'].includes(file)
  );
  
  if (uncategorizedScripts.length > 0) {
    console.log('📂 Other Scripts');
    console.log('---------------');
    
    uncategorizedScripts.forEach(filename => {
      const status = checkScriptStatus(filename);
      displayScriptInfo(filename, 'No description available', status);
    });
  }
  
  // Display usage examples
  displayUsageExamples();
  
  // Display configuration info
  displayConfigurationInfo();
  
  // Display documentation links
  displayDocumentationLinks();
  
  console.log('✅ Script listing completed.');
  console.log('');
  console.log('💡 Tip: Run any script with --help or -h for more information.');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { getScriptFiles, checkScriptStatus, SCRIPT_CATEGORIES };
