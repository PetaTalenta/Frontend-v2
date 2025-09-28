#!/usr/bin/env node

/**
 * SCRIPT ANALISIS BUNDLE UNTUK FutureGuide
 * 
 * Menganalisis ukuran bundle dan memberikan rekomendasi optimasi
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== CONFIGURATION =====

const CONFIG = {
  // Threshold untuk warning (dalam KB)
  THRESHOLDS: {
    TOTAL_BUNDLE: 1000,      // 1MB total bundle
    SINGLE_CHUNK: 250,       // 250KB per chunk
    VENDOR_CHUNK: 500,       // 500KB vendor chunk
    CSS_BUNDLE: 100,         // 100KB CSS
  },
  
  // Target sizes (dalam KB)
  TARGETS: {
    FIRST_LOAD: 200,         // 200KB first load
    ROUTE_CHUNK: 100,        // 100KB per route
  },
  
  // Paths
  PATHS: {
    BUILD_DIR: '.next',
    STATIC_DIR: '.next/static',
    CHUNKS_DIR: '.next/static/chunks',
  },
};

// ===== UTILITY FUNCTIONS =====

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// ===== ANALYSIS FUNCTIONS =====

function analyzeChunks() {
  console.log('🔍 Analyzing JavaScript chunks...\n');
  
  const chunksDir = CONFIG.PATHS.CHUNKS_DIR;
  if (!fs.existsSync(chunksDir)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return;
  }

  const chunkFiles = getAllFiles(chunksDir).filter(file => file.endsWith('.js'));
  const chunks = [];

  chunkFiles.forEach(file => {
    const size = getFileSize(file);
    const relativePath = path.relative(CONFIG.PATHS.BUILD_DIR, file);
    
    chunks.push({
      name: path.basename(file),
      path: relativePath,
      size: size,
      sizeFormatted: formatBytes(size),
      type: getChunkType(file),
    });
  });

  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size);

  // Display results
  console.log('📦 JavaScript Chunks:');
  console.log('─'.repeat(80));
  console.log('Name'.padEnd(40) + 'Size'.padEnd(15) + 'Type'.padEnd(15) + 'Status');
  console.log('─'.repeat(80));

  let totalSize = 0;
  chunks.forEach(chunk => {
    totalSize += chunk.size;
    const sizeKB = chunk.size / 1024;
    const status = getChunkStatus(chunk.type, sizeKB);
    
    console.log(
      chunk.name.padEnd(40) + 
      chunk.sizeFormatted.padEnd(15) + 
      chunk.type.padEnd(15) + 
      status
    );
  });

  console.log('─'.repeat(80));
  console.log(`Total: ${formatBytes(totalSize)}`);
  console.log('');

  return { chunks, totalSize };
}

function getChunkType(filePath) {
  const fileName = path.basename(filePath);
  
  if (fileName.includes('framework')) return 'Framework';
  if (fileName.includes('vendor') || fileName.includes('node_modules')) return 'Vendor';
  if (fileName.includes('main')) return 'Main';
  if (fileName.includes('webpack')) return 'Webpack';
  if (fileName.includes('polyfills')) return 'Polyfills';
  if (fileName.match(/^\d+\./)) return 'Route';
  
  return 'Other';
}

function getChunkStatus(type, sizeKB) {
  const thresholds = {
    'Framework': CONFIG.THRESHOLDS.VENDOR_CHUNK,
    'Vendor': CONFIG.THRESHOLDS.VENDOR_CHUNK,
    'Main': CONFIG.THRESHOLDS.SINGLE_CHUNK,
    'Route': CONFIG.THRESHOLDS.SINGLE_CHUNK,
    'Other': CONFIG.THRESHOLDS.SINGLE_CHUNK,
  };

  const threshold = thresholds[type] || CONFIG.THRESHOLDS.SINGLE_CHUNK;
  
  if (sizeKB > threshold) return '⚠️  Large';
  if (sizeKB > threshold * 0.8) return '⚡ Warning';
  return '✅ Good';
}

function analyzeCSSBundles() {
  console.log('🎨 Analyzing CSS bundles...\n');
  
  const staticDir = CONFIG.PATHS.STATIC_DIR;
  const cssFiles = getAllFiles(staticDir).filter(file => file.endsWith('.css'));
  
  if (cssFiles.length === 0) {
    console.log('No CSS files found.');
    return;
  }

  console.log('📄 CSS Files:');
  console.log('─'.repeat(60));
  console.log('Name'.padEnd(40) + 'Size'.padEnd(15) + 'Status');
  console.log('─'.repeat(60));

  let totalCSSSize = 0;
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    totalCSSSize += size;
    const sizeKB = size / 1024;
    const status = sizeKB > CONFIG.THRESHOLDS.CSS_BUNDLE ? '⚠️  Large' : '✅ Good';
    
    console.log(
      path.basename(file).padEnd(40) + 
      formatBytes(size).padEnd(15) + 
      status
    );
  });

  console.log('─'.repeat(60));
  console.log(`Total CSS: ${formatBytes(totalCSSSize)}`);
  console.log('');

  return totalCSSSize;
}

function analyzeFirstLoadJS() {
  console.log('🚀 Analyzing First Load JS...\n');
  
  // Read Next.js build manifest
  const manifestPath = path.join(CONFIG.PATHS.BUILD_DIR, 'build-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('❌ Build manifest not found.');
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const firstLoadFiles = manifest.pages['/'] || [];
    
    let firstLoadSize = 0;
    console.log('📋 First Load JS Files:');
    console.log('─'.repeat(60));
    
    firstLoadFiles.forEach(file => {
      const filePath = path.join(CONFIG.PATHS.BUILD_DIR, file);
      const size = getFileSize(filePath);
      firstLoadSize += size;
      
      console.log(`${file}: ${formatBytes(size)}`);
    });
    
    console.log('─'.repeat(60));
    console.log(`Total First Load: ${formatBytes(firstLoadSize)}`);
    
    const firstLoadKB = firstLoadSize / 1024;
    if (firstLoadKB > CONFIG.TARGETS.FIRST_LOAD) {
      console.log(`⚠️  First load size (${formatBytes(firstLoadSize)}) exceeds target (${CONFIG.TARGETS.FIRST_LOAD}KB)`);
    } else {
      console.log('✅ First load size is within target');
    }
    
    console.log('');
    return firstLoadSize;
    
  } catch (error) {
    console.log('❌ Error reading build manifest:', error.message);
  }
}

function generateRecommendations(analysis) {
  console.log('💡 Optimization Recommendations:\n');
  
  const recommendations = [];
  
  // Bundle size recommendations
  if (analysis.totalSize > CONFIG.THRESHOLDS.TOTAL_BUNDLE * 1024) {
    recommendations.push({
      priority: 'High',
      issue: 'Large total bundle size',
      solution: 'Implement code splitting and lazy loading for non-critical components',
      impact: 'Reduce initial load time by 20-40%'
    });
  }
  
  // Large chunks recommendations
  const largeChunks = analysis.chunks?.filter(chunk => 
    chunk.size > CONFIG.THRESHOLDS.SINGLE_CHUNK * 1024
  ) || [];
  
  if (largeChunks.length > 0) {
    recommendations.push({
      priority: 'Medium',
      issue: `${largeChunks.length} large chunks detected`,
      solution: 'Split large chunks using dynamic imports and route-based splitting',
      impact: 'Improve Time to Interactive (TTI)'
    });
  }
  
  // Vendor chunk recommendations
  const vendorChunks = analysis.chunks?.filter(chunk => 
    chunk.type === 'Vendor' && chunk.size > CONFIG.THRESHOLDS.VENDOR_CHUNK * 1024
  ) || [];
  
  if (vendorChunks.length > 0) {
    recommendations.push({
      priority: 'Medium',
      issue: 'Large vendor chunks',
      solution: 'Review dependencies and consider alternatives or tree shaking',
      impact: 'Reduce bundle size by 10-30%'
    });
  }
  
  // CSS recommendations
  if (analysis.totalCSSSize > CONFIG.THRESHOLDS.CSS_BUNDLE * 1024) {
    recommendations.push({
      priority: 'Low',
      issue: 'Large CSS bundle',
      solution: 'Implement CSS purging and critical CSS extraction',
      impact: 'Faster First Contentful Paint (FCP)'
    });
  }
  
  // Display recommendations
  if (recommendations.length === 0) {
    console.log('✅ No major issues found. Your bundle is well optimized!');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}`);
      console.log(`   Impact: ${rec.impact}\n`);
    });
  }
  
  // Specific optimization suggestions
  console.log('🔧 Specific Optimizations:');
  console.log('');
  console.log('1. Enable gzip/brotli compression in production');
  console.log('2. Use next/dynamic for heavy components');
  console.log('3. Implement tree shaking for unused code');
  console.log('4. Consider using next/bundle-analyzer for detailed analysis');
  console.log('5. Optimize images with next/image');
  console.log('');
}

function runBundleAnalyzer() {
  console.log('🔍 Running detailed bundle analysis...\n');
  
  try {
    // Set environment variable and run build with analyzer
    process.env.ANALYZE = 'true';
    execSync('npm run build:analyze', { stdio: 'inherit' });
    
    console.log('\n✅ Bundle analyzer completed. Check the opened browser tab for detailed analysis.');
  } catch (error) {
    console.log('❌ Error running bundle analyzer:', error.message);
    console.log('Make sure you have @next/bundle-analyzer installed and configured.');
  }
}

// ===== MAIN EXECUTION =====

function main() {
  console.log('🚀 FutureGuide Bundle Analysis\n');
  console.log('═'.repeat(80));
  console.log('');
  
  const analysis = {};
  
  // Run analyses
  const chunkAnalysis = analyzeChunks();
  analysis.chunks = chunkAnalysis?.chunks;
  analysis.totalSize = chunkAnalysis?.totalSize;
  
  analysis.totalCSSSize = analyzeCSSBundles();
  analysis.firstLoadSize = analyzeFirstLoadJS();
  
  // Generate recommendations
  generateRecommendations(analysis);
  
  // Ask if user wants detailed analysis
  console.log('Run detailed bundle analyzer? (y/N)');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    if (key.toString().toLowerCase() === 'y') {
      runBundleAnalyzer();
    }
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeChunks,
  analyzeCSSBundles,
  analyzeFirstLoadJS,
  generateRecommendations,
};
