#!/usr/bin/env node

/**
 * SCRIPT OTOMATIS UNTUK OPTIMASI PERFORMA FutureGuide
 * 
 * Menjalankan semua optimasi performa secara otomatis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== CONFIGURATION =====

const OPTIMIZATION_STEPS = [
  {
    name: 'Bundle Analysis',
    description: 'Menganalisis ukuran bundle dan dependencies',
    action: analyzeBundleSize,
    priority: 'high',
    estimatedTime: '2 menit',
  },
  {
    name: 'Image Optimization Check',
    description: 'Memeriksa penggunaan gambar yang belum dioptimasi',
    action: checkImageOptimization,
    priority: 'high',
    estimatedTime: '1 menit',
  },
  {
    name: 'Font Optimization Check',
    description: 'Memeriksa konfigurasi font',
    action: checkFontOptimization,
    priority: 'medium',
    estimatedTime: '30 detik',
  },
  {
    name: 'Code Splitting Analysis',
    description: 'Menganalisis komponen yang bisa di-lazy load',
    action: analyzeCodeSplitting,
    priority: 'medium',
    estimatedTime: '1 menit',
  },
  {
    name: 'Cache Configuration Check',
    description: 'Memeriksa konfigurasi caching',
    action: checkCacheConfiguration,
    priority: 'low',
    estimatedTime: '30 detik',
  },
];

// ===== UTILITY FUNCTIONS =====

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m',    // Reset
  };

  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
}

function findFiles(dir, extension, exclude = []) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !exclude.includes(item)) {
        traverse(fullPath);
      } else if (stat.isFile() && fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

// ===== OPTIMIZATION FUNCTIONS =====

async function analyzeBundleSize() {
  log('Menganalisis ukuran bundle...', 'info');
  
  try {
    // Check if build exists
    const buildDir = '.next';
    if (!fs.existsSync(buildDir)) {
      log('Build directory tidak ditemukan. Menjalankan build...', 'warning');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // Run bundle analysis
    const { analyzeChunks } = require('./analyze-bundle.js');
    const analysis = analyzeChunks();
    
    if (analysis && analysis.totalSize) {
      const totalSizeMB = (analysis.totalSize / (1024 * 1024)).toFixed(2);
      
      if (analysis.totalSize > 1024 * 1024) { // > 1MB
        log(`Bundle size: ${totalSizeMB}MB - Perlu optimasi`, 'warning');
        return {
          status: 'warning',
          message: `Bundle terlalu besar (${totalSizeMB}MB). Implementasikan code splitting.`,
          recommendations: [
            'Gunakan dynamic imports untuk komponen besar',
            'Implementasi lazy loading untuk chart dan modal',
            'Review dependencies yang tidak terpakai',
          ],
        };
      } else {
        log(`Bundle size: ${totalSizeMB}MB - Baik`, 'success');
        return { status: 'success', message: 'Bundle size sudah optimal' };
      }
    }
  } catch (error) {
    log(`Error analyzing bundle: ${error.message}`, 'error');
    return { status: 'error', message: error.message };
  }
}

async function checkImageOptimization() {
  log('Memeriksa optimasi gambar...', 'info');
  
  const issues = [];
  
  // Find all TSX/JSX files
  const componentFiles = [
    ...findFiles('src/app', '.tsx', ['node_modules', '.next']),
    ...findFiles('src/components', '.tsx', ['node_modules']),
    ...findFiles('src/pages', '.tsx', ['node_modules']),
  ];
  
  componentFiles.forEach(file => {
    const content = readFileContent(file);
    
    // Check for regular img tags
    const imgTagMatches = content.match(/<img\s+[^>]*>/g);
    if (imgTagMatches) {
      issues.push({
        file: path.relative(process.cwd(), file),
        issue: `Ditemukan ${imgTagMatches.length} tag <img> yang belum dioptimasi`,
        recommendation: 'Ganti dengan komponen OptimizedImage atau next/image',
      });
    }
    
    // Check for missing priority prop on above-fold images
    const imageMatches = content.match(/<Image\s+[^>]*>/g);
    if (imageMatches) {
      imageMatches.forEach(match => {
        if (!match.includes('priority') && (
          content.includes('hero') || 
          content.includes('banner') || 
          content.includes('above-fold')
        )) {
          issues.push({
            file: path.relative(process.cwd(), file),
            issue: 'Image above-the-fold tanpa priority prop',
            recommendation: 'Tambahkan priority={true} untuk gambar penting',
          });
        }
      });
    }
  });
  
  if (issues.length > 0) {
    log(`Ditemukan ${issues.length} masalah optimasi gambar`, 'warning');
    return {
      status: 'warning',
      message: `${issues.length} gambar perlu dioptimasi`,
      issues: issues.slice(0, 5), // Show first 5 issues
    };
  } else {
    log('Optimasi gambar sudah baik', 'success');
    return { status: 'success', message: 'Semua gambar sudah dioptimasi' };
  }
}

async function checkFontOptimization() {
  log('Memeriksa optimasi font...', 'info');
  
  const layoutFile = 'src/app/layout.tsx';
  const issues = [];
  
  if (fs.existsSync(layoutFile)) {
    const content = readFileContent(layoutFile);
    
    // Check for font imports
    if (!content.includes('next/font')) {
      issues.push({
        issue: 'Tidak menggunakan next/font',
        recommendation: 'Gunakan next/font untuk optimasi loading font',
      });
    }
    
    // Check for preconnect
    if (!content.includes('preconnect')) {
      issues.push({
        issue: 'Tidak ada preconnect untuk Google Fonts',
        recommendation: 'Tambahkan preconnect ke fonts.googleapis.com',
      });
    }
    
    // Check for display: swap
    if (!content.includes('display: \'swap\'') && !content.includes('display: "swap"')) {
      issues.push({
        issue: 'Font tidak menggunakan display: swap',
        recommendation: 'Tambahkan display: "swap" untuk mencegah FOUT',
      });
    }
  }
  
  if (issues.length > 0) {
    log(`Ditemukan ${issues.length} masalah optimasi font`, 'warning');
    return {
      status: 'warning',
      message: 'Font perlu dioptimasi',
      issues,
    };
  } else {
    log('Optimasi font sudah baik', 'success');
    return { status: 'success', message: 'Font sudah dioptimasi' };
  }
}

async function analyzeCodeSplitting() {
  log('Menganalisis code splitting...', 'info');
  
  const issues = [];
  const componentFiles = findFiles('src/components', '.tsx', ['node_modules']);
  
  // Check for large components that should be lazy loaded
  const heavyComponents = [
    'Chart', 'Radar', 'Graph', 'PDF', 'Export', 
    'Modal', 'Dialog', 'Drawer', 'Editor'
  ];
  
  componentFiles.forEach(file => {
    const content = readFileContent(file);
    const fileName = path.basename(file, '.tsx');
    
    // Check if component is heavy but not lazy loaded
    const isHeavyComponent = heavyComponents.some(heavy => 
      fileName.includes(heavy) || content.includes(heavy)
    );
    
    if (isHeavyComponent && !content.includes('dynamic') && !content.includes('lazy')) {
      issues.push({
        file: path.relative(process.cwd(), file),
        issue: 'Komponen berat yang tidak di-lazy load',
        recommendation: 'Implementasikan lazy loading dengan next/dynamic',
      });
    }
  });
  
  if (issues.length > 0) {
    log(`Ditemukan ${issues.length} komponen yang bisa di-lazy load`, 'warning');
    return {
      status: 'warning',
      message: `${issues.length} komponen perlu lazy loading`,
      issues: issues.slice(0, 3),
    };
  } else {
    log('Code splitting sudah optimal', 'success');
    return { status: 'success', message: 'Code splitting sudah baik' };
  }
}

async function checkCacheConfiguration() {
  log('Memeriksa konfigurasi caching...', 'info');
  
  const issues = [];
  
  // Check SWR configuration
  const swrConfigFile = 'src/lib/swr-config.ts';
  if (fs.existsSync(swrConfigFile)) {
    const content = readFileContent(swrConfigFile);
    
    if (!content.includes('dedupingInterval')) {
      issues.push({
        issue: 'SWR tidak dikonfigurasi untuk deduping',
        recommendation: 'Tambahkan dedupingInterval untuk mengurangi request duplikat',
      });
    }
    
    if (!content.includes('revalidateOnFocus: false')) {
      issues.push({
        issue: 'SWR revalidate on focus masih aktif',
        recommendation: 'Disable revalidateOnFocus untuk mengurangi request',
      });
    }
  } else {
    issues.push({
      issue: 'File konfigurasi SWR tidak ditemukan',
      recommendation: 'Buat konfigurasi SWR untuk optimasi caching',
    });
  }
  
  // Check Next.js config for caching headers
  const nextConfigFile = 'next.config.mjs';
  if (fs.existsSync(nextConfigFile)) {
    const content = readFileContent(nextConfigFile);
    
    if (!content.includes('Cache-Control')) {
      issues.push({
        issue: 'Tidak ada cache headers di Next.js config',
        recommendation: 'Tambahkan cache headers untuk static assets',
      });
    }
  }
  
  if (issues.length > 0) {
    log(`Ditemukan ${issues.length} masalah konfigurasi cache`, 'warning');
    return {
      status: 'warning',
      message: 'Cache perlu dikonfigurasi',
      issues,
    };
  } else {
    log('Konfigurasi cache sudah baik', 'success');
    return { status: 'success', message: 'Cache sudah dikonfigurasi dengan baik' };
  }
}

// ===== MAIN EXECUTION =====

async function main() {
  console.log('🚀 FutureGuide Performance Optimizer\n');
  console.log('═'.repeat(60));
  console.log('');
  
  const results = [];
  let totalIssues = 0;
  
  for (const step of OPTIMIZATION_STEPS) {
    console.log(`\n📋 ${step.name}`);
    console.log(`   ${step.description}`);
    console.log(`   Estimasi waktu: ${step.estimatedTime}`);
    console.log('─'.repeat(40));
    
    try {
      const result = await step.action();
      results.push({ ...step, result });
      
      if (result.status === 'warning' || result.status === 'error') {
        totalIssues += result.issues?.length || 1;
      }
    } catch (error) {
      log(`Error: ${error.message}`, 'error');
      results.push({ ...step, result: { status: 'error', message: error.message } });
      totalIssues++;
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RINGKASAN OPTIMASI');
  console.log('═'.repeat(60));
  
  if (totalIssues === 0) {
    log('🎉 Semua optimasi sudah diterapkan dengan baik!', 'success');
  } else {
    log(`⚠️  Ditemukan ${totalIssues} area yang perlu dioptimasi`, 'warning');
    
    console.log('\n🔧 REKOMENDASI PRIORITAS:');
    
    results.forEach((item, index) => {
      if (item.result.status === 'warning' || item.result.status === 'error') {
        console.log(`\n${index + 1}. ${item.name} [${item.priority.toUpperCase()}]`);
        console.log(`   ${item.result.message}`);
        
        if (item.result.issues) {
          item.result.issues.forEach(issue => {
            console.log(`   • ${issue.issue || issue}`);
            if (issue.recommendation) {
              console.log(`     → ${issue.recommendation}`);
            }
          });
        }
        
        if (item.result.recommendations) {
          item.result.recommendations.forEach(rec => {
            console.log(`   → ${rec}`);
          });
        }
      }
    });
  }
  
  console.log('\n📚 Untuk panduan lengkap, baca: docs/PERFORMANCE_OPTIMIZATION_GUIDE.md');
  console.log('🔍 Untuk analisis detail: npm run analyze:detailed');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzeBundleSize,
  checkImageOptimization,
  checkFontOptimization,
  analyzeCodeSplitting,
  checkCacheConfiguration,
};
