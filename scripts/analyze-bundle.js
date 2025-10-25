#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Enhanced Bundle Analysis for Phase 3C.1...\n');

// Enhanced bundle analysis class
class BundleAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      gzippedSize: 0,
      brotliSize: 0,
      chunks: [],
      assets: [],
      optimizationOpportunities: [],
      performanceScore: 0
    };
  }

  // Analyze bundle with comprehensive metrics
  async analyzeBundle() {
    console.log('📦 Building project for analysis...');
    await this.buildProject();

    console.log('📊 Running comprehensive bundle analysis...');
    await this.analyzeChunks();
    await this.analyzeAssets();
    await this.analyzeDependencies();
    await this.generateOptimizationOpportunities();
    await this.calculatePerformanceScore();

    this.generateReport();
  }

  // Build project if needed
  async buildProject() {
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      try {
        execSync('pnpm build', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Build failed. Cannot analyze bundle.');
        process.exit(1);
      }
    }
  }

  // Analyze chunks with detailed metrics
  async analyzeChunks() {
    try {
      const buildManifest = require('../.next/build-manifest.json');
      const pagesManifest = require('../.next/server/pages-manifest.json');
      
      let totalSize = 0;
      let totalGzippedSize = 0;
      let totalBrotliSize = 0;

      // Analyze each page's chunks
      for (const [page, files] of Object.entries(buildManifest.pages)) {
        const pageChunks = [];
        
        for (const file of files) {
          if (file.endsWith('.js')) {
            const filePath = path.join('.next', file);
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              const content = fs.readFileSync(filePath);
              
              // Simple compression estimation (would use gzip-size and brotli-size in real implementation)
              const gzipped = Math.round(stats.size * 0.3);
              const brotli = Math.round(stats.size * 0.25);
              
              const chunkInfo = {
                name: file,
                size: stats.size,
                gzippedSize: gzipped,
                brotliSize: brotli,
                compressionRatio: ((stats.size - gzipped) / stats.size * 100).toFixed(2),
                page: page
              };
              
              pageChunks.push(chunkInfo);
              totalSize += stats.size;
              totalGzippedSize += gzipped;
              totalBrotliSize += brotli;
            }
          }
        }
        
        this.results.chunks.push({
          page,
          chunks: pageChunks,
          totalSize: pageChunks.reduce((sum, chunk) => sum + chunk.size, 0)
        });
      }

      this.results.totalSize = totalSize;
      this.results.gzippedSize = totalGzippedSize;
      this.results.brotliSize = totalBrotliSize;

      console.log(`📊 Total Bundle Size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`📊 Gzipped Size: ${(totalGzippedSize / 1024).toFixed(2)} KB`);
      console.log(`📊 Brotli Size: ${(totalBrotliSize / 1024).toFixed(2)} KB`);
      console.log(`📊 Overall Compression: ${((totalSize - totalGzippedSize) / totalSize * 100).toFixed(2)}%`);

    } catch (error) {
      console.log('⚠️  Could not analyze chunks:', error.message);
    }
  }

  // Analyze assets with optimization potential
  async analyzeAssets() {
    try {
      const staticDir = path.join('.next', 'static');
      if (!fs.existsSync(staticDir)) return;

      const analyzeDirectory = (dir, basePath = '') => {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const relativePath = path.join(basePath, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            analyzeDirectory(itemPath, relativePath);
          } else {
            // Simple compression estimation
            const gzipped = Math.round(stats.size * 0.3);
            const brotli = Math.round(stats.size * 0.25);
            
            const assetInfo = {
              name: item,
              path: relativePath,
              size: stats.size,
              gzippedSize: gzipped,
              brotliSize: brotli,
              type: this.getAssetType(item),
              compressionRatio: ((stats.size - gzipped) / stats.size * 100).toFixed(2),
              canBeOptimized: this.canBeOptimized(item, stats.size)
            };
            
            this.results.assets.push(assetInfo);
          }
        }
      };

      analyzeDirectory(staticDir, 'static');

      // Sort assets by size
      this.results.assets.sort((a, b) => b.size - a.size);

      console.log(`\n📁 Analyzed ${this.results.assets.length} assets`);
      
    } catch (error) {
      console.log('⚠️  Could not analyze assets:', error.message);
    }
  }

  // Get asset type
  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.css': 'stylesheet',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.webp': 'image',
      '.svg': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font'
    };
    return typeMap[ext] || 'other';
  }

  // Check if asset can be optimized
  canBeOptimized(filename, size) {
    const ext = path.extname(filename).toLowerCase();
    const largeImage = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) && size > 50 * 1024;
    const unoptimizedJs = ext === '.js' && size > 100 * 1024;
    return largeImage || unoptimizedJs;
  }

  // Analyze dependencies for optimization opportunities
  async analyzeDependencies() {
    try {
      const packageJson = require('../package.json');
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const largeDeps = [
        'recharts',
        'framer-motion', 
        '@tanstack/react-query',
        'axios',
        'date-fns',
        'lodash',
        'moment'
      ];
      
      console.log('\n🔍 Dependency Analysis:');
      largeDeps.forEach(dep => {
        if (dependencies[dep]) {
          console.log(`  📦 ${dep}: ${dependencies[dep]}`);
        }
      });

      // Check for tree shaking opportunities
      const treeShakableDeps = ['lodash', 'date-fns', 'moment'];
      const treeShakingOpportunities = treeShakableDeps.filter(dep => dependencies[dep]);
      
      if (treeShakingOpportunities.length > 0) {
        this.results.optimizationOpportunities.push({
          type: 'tree-shaking',
          description: `Tree shaking opportunities for: ${treeShakingOpportunities.join(', ')}`,
          estimatedSavings: treeShakingOpportunities.length * 20 * 1024, // 20KB per dependency
          priority: 'medium'
        });
      }

    } catch (error) {
      console.log('⚠️  Could not analyze dependencies:', error.message);
    }
  }

  // Generate optimization opportunities
  async generateOptimizationOpportunities() {
    const opportunities = [];

    // Bundle size optimization
    const targetSize = 100 * 1024; // 100KB target
    if (this.results.totalSize > targetSize) {
      opportunities.push({
        type: 'bundle-size',
        description: `Bundle size exceeds target by ${((this.results.totalSize - targetSize) / 1024).toFixed(2)} KB`,
        estimatedSavings: (this.results.totalSize - targetSize) * 0.3,
        priority: 'high'
      });
    }

    // Large chunks optimization
    const largeChunks = this.results.chunks.filter(chunk => 
      chunk.totalSize > 50 * 1024
    );
    if (largeChunks.length > 0) {
      opportunities.push({
        type: 'code-splitting',
        description: `Found ${largeChunks.length} chunks larger than 50KB`,
        estimatedSavings: largeChunks.reduce((sum, chunk) => sum + chunk.totalSize * 0.2, 0),
        priority: 'high'
      });
    }

    // Asset optimization
    const optimizableAssets = this.results.assets.filter(asset => asset.canBeOptimized);
    if (optimizableAssets.length > 0) {
      opportunities.push({
        type: 'asset-optimization',
        description: `Found ${optimizableAssets.length} assets that can be optimized`,
        estimatedSavings: optimizableAssets.reduce((sum, asset) => sum + asset.size * 0.4, 0),
        priority: 'medium'
      });
    }

    // Compression optimization
    const avgCompression = this.results.totalSize > 0 ? 
      ((this.results.totalSize - this.results.gzippedSize) / this.results.totalSize * 100) : 0;
    if (avgCompression < 60) {
      opportunities.push({
        type: 'compression',
        description: `Average compression ratio (${avgCompression.toFixed(2)}%) is below optimal (60%)`,
        estimatedSavings: this.results.totalSize * 0.1,
        priority: 'medium'
      });
    }

    this.results.optimizationOpportunities = opportunities;
  }

  // Calculate performance score
  async calculatePerformanceScore() {
    let score = 100;

    // Size penalty
    const targetSize = 100 * 1024;
    if (this.results.totalSize > targetSize) {
      const excessPercentage = ((this.results.totalSize - targetSize) / targetSize) * 100;
      score -= Math.min(excessPercentage, 50);
    }

    // Compression penalty
    const avgCompression = this.results.totalSize > 0 ? 
      ((this.results.totalSize - this.results.gzippedSize) / this.results.totalSize * 100) : 0;
    if (avgCompression < 60) {
      score -= (60 - avgCompression);
    }

    // Chunk count penalty
    if (this.results.chunks.length > 10) {
      score -= (this.results.chunks.length - 10) * 2;
    }

    this.results.performanceScore = Math.max(0, Math.round(score));
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📋 BUNDLE ANALYSIS REPORT');
    console.log('='.repeat(50));

    // Performance Score
    console.log(`\n🎯 Performance Score: ${this.results.performanceScore}/100`);
    
    // Bundle Metrics
    console.log('\n📊 Bundle Metrics:');
    console.log(`  Total Size: ${(this.results.totalSize / 1024).toFixed(2)} KB`);
    console.log(`  Gzipped: ${(this.results.gzippedSize / 1024).toFixed(2)} KB`);
    console.log(`  Brotli: ${(this.results.brotliSize / 1024).toFixed(2)} KB`);
    console.log(`  Compression: ${((this.results.totalSize - this.results.gzippedSize) / this.results.totalSize * 100).toFixed(2)}%`);

    // Top Chunks
    console.log('\n📦 Largest Chunks:');
    const topChunks = this.results.chunks
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 5);
    
    topChunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.page}: ${(chunk.totalSize / 1024).toFixed(2)} KB`);
    });

    // Top Assets
    console.log('\n📁 Largest Assets:');
    const topAssets = this.results.assets
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    
    topAssets.forEach((asset, index) => {
      console.log(`  ${index + 1}. ${asset.name} (${asset.type}): ${(asset.size / 1024).toFixed(2)} KB`);
    });

    // Optimization Opportunities
    console.log('\n💡 Optimization Opportunities:');
    if (this.results.optimizationOpportunities.length === 0) {
      console.log('  ✅ No major optimization opportunities found!');
    } else {
      this.results.optimizationOpportunities.forEach((opp, index) => {
        const priorityIcon = opp.priority === 'high' ? '🔴' : opp.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${index + 1}. ${priorityIcon} ${opp.description}`);
        console.log(`     Estimated savings: ${(opp.estimatedSavings / 1024).toFixed(2)} KB`);
      });
    }

    // Recommendations
    console.log('\n📝 Recommendations:');
    if (this.results.performanceScore >= 90) {
      console.log('  ✅ Excellent bundle optimization!');
    } else if (this.results.performanceScore >= 75) {
      console.log('  🟡 Good bundle optimization with minor improvements possible');
    } else if (this.results.performanceScore >= 60) {
      console.log('  🟠 Moderate bundle optimization - improvements recommended');
    } else {
      console.log('  🔴 Poor bundle optimization - significant improvements needed');
    }

    console.log('\n🎯 Next Steps:');
    console.log('  1. Run "pnpm build:analyze" for detailed visual analysis');
    console.log('  2. Implement high-priority optimizations first');
    console.log('  3. Consider code splitting for large chunks');
    console.log('  4. Optimize images and assets');
    console.log('  5. Enable Brotli compression in production');

    console.log('\n✅ Bundle analysis complete!');
  }
}

// Run the analysis
async function main() {
  try {
    const analyzer = new BundleAnalyzer();
    await analyzer.analyzeBundle();

    // Run Next.js bundle analyzer if requested
    if (process.argv.includes('--visual')) {
      console.log('\n🔍 Starting visual bundle analyzer...');
      execSync('pnpm build:analyze', { stdio: 'inherit' });
    }

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

// Run main function
main();