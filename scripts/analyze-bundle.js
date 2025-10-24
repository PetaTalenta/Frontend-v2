#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Bundle Analysis...\n');

// Ensure .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.log('📦 Building project first...');
  try {
    execSync('pnpm build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed. Cannot analyze bundle.');
    process.exit(1);
  }
}

// Run bundle analyzer
console.log('📊 Running Bundle Analyzer...');
try {
  execSync('pnpm build:analyze', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Bundle analyzer failed.');
  process.exit(1);
}

// Analyze bundle size
console.log('\n📈 Bundle Size Analysis:');
try {
  const buildManifest = require('../.next/build-manifest.json');
  const pagesManifest = require('../.next/server/pages-manifest.json');
  
  let totalSize = 0;
  const pageSizes = {};
  
  // Analyze client bundles
  Object.keys(buildManifest.pages).forEach(page => {
    const files = buildManifest.pages[page];
    let pageSize = 0;
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join('.next', file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          pageSize += stats.size;
          totalSize += stats.size;
        }
      }
    });
    
    pageSizes[page] = pageSize;
  });
  
  console.log('\n📄 Page Bundle Sizes:');
  Object.entries(pageSizes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([page, size]) => {
      console.log(`  ${page}: ${(size / 1024).toFixed(2)} KB`);
    });
  
  console.log(`\n📊 Total Bundle Size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`📊 First Load JS: ${(totalSize / 1024).toFixed(2)} KB`);
  
  // Check against targets
  const targetSize = 103 * 1024; // 103 KB target from documentation
  if (totalSize <= targetSize) {
    console.log('✅ Bundle size is within target!');
  } else {
    console.log(`⚠️  Bundle size exceeds target by ${((totalSize - targetSize) / 1024).toFixed(2)} KB`);
  }
  
} catch (error) {
  console.log('⚠️  Could not analyze bundle sizes:', error.message);
}

// Check for large dependencies
console.log('\n🔍 Dependency Analysis:');
try {
  const packageJson = require('../package.json');
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const largeDeps = [
    'recharts',
    'framer-motion', 
    '@tanstack/react-query',
    'axios',
    'date-fns'
  ];
  
  largeDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`  📦 ${dep}: ${dependencies[dep]}`);
    }
  });
  
} catch (error) {
  console.log('⚠️  Could not analyze dependencies:', error.message);
}

console.log('\n✅ Bundle analysis complete!');
console.log('💡 Open the bundle analyzer report in your browser to see detailed analysis.');