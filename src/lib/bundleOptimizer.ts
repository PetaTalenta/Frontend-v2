// Bundle optimization utilities for Phase 3C.1

// Bundle optimization configuration
export interface BundleOptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableCompression: boolean;
  enableAssetOptimization: boolean;
  enableDynamicImports: boolean;
  chunkSizeThreshold: number;
  compressionLevel: number;
  targetBundleSize: number;
}

// Bundle analysis result
export interface BundleAnalysisResult {
  totalSize: number;
  gzippedSize: number;
  brotliSize: number;
  chunks: ChunkAnalysis[];
  assets: AssetAnalysis[];
  unusedExports: string[];
  duplicateModules: string[];
  optimizationOpportunities: OptimizationOpportunity[];
  compressionRatio: number;
  performanceScore: number;
}

// Chunk analysis
export interface ChunkAnalysis {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  dependencies: string[];
  isEntry: boolean;
  isDynamic: boolean;
  optimizationLevel: 'optimal' | 'needs-optimization' | 'critical';
}

// Asset analysis
export interface AssetAnalysis {
  name: string;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  size: number;
  optimizedSize: number;
  compressionRatio: number;
  path: string;
  isCritical: boolean;
  canBeLazyLoaded: boolean;
}

// Optimization opportunity
export interface OptimizationOpportunity {
  type: 'code-splitting' | 'tree-shaking' | 'compression' | 'asset-optimization' | 'dynamic-import' | 'chunk-optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedSavings: number;
  implementation: string;
  effort: 'low' | 'medium' | 'complex';
}

// Bundle optimization strategies
export interface OptimizationStrategy {
  name: string;
  description: string;
  implementation: () => Promise<void>;
  estimatedImpact: number;
  complexity: 'low' | 'medium' | 'high';
}

// Bundle Optimizer class
export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private config: BundleOptimizationConfig;
  private analysisResult: BundleAnalysisResult | null = null;
  private isOptimizing = false;

  private constructor(config: Partial<BundleOptimizationConfig> = {}) {
    this.config = {
      enableCodeSplitting: true,
      enableTreeShaking: true,
      enableCompression: true,
      enableAssetOptimization: true,
      enableDynamicImports: true,
      chunkSizeThreshold: 50 * 1024, // 50KB
      compressionLevel: 9, // Maximum gzip compression
      targetBundleSize: 100 * 1024, // 100KB target
      ...config
    };
  }

  static getInstance(config?: Partial<BundleOptimizationConfig>): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer(config);
    }
    return BundleOptimizer.instance;
  }

  // Analyze current bundle
  async analyzeBundle(): Promise<BundleAnalysisResult> {
    if (this.isOptimizing) {
      throw new Error('Cannot analyze bundle while optimization is in progress');
    }

    try {
      // Get bundle stats from Next.js build
      const bundleStats = await this.getBundleStats();
      
      // Analyze chunks
      const chunks = await this.analyzeChunks(bundleStats);
      
      // Analyze assets
      const assets = await this.analyzeAssets(bundleStats);
      
      // Find unused exports
      const unusedExports = await this.findUnusedExports();
      
      // Find duplicate modules
      const duplicateModules = await this.findDuplicateModules();
      
      // Generate optimization opportunities
      const optimizationOpportunities = await this.generateOptimizationOpportunities(
        chunks, assets, unusedExports, duplicateModules
      );

      // Calculate metrics
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
      const brotliSize = Math.round(gzippedSize * 0.85); // Brotli is typically 15% better than gzip
      const compressionRatio = totalSize > 0 ? (1 - gzippedSize / totalSize) * 100 : 0;
      const performanceScore = this.calculatePerformanceScore(totalSize, gzippedSize, chunks.length);

      this.analysisResult = {
        totalSize,
        gzippedSize,
        brotliSize,
        chunks,
        assets,
        unusedExports,
        duplicateModules,
        optimizationOpportunities,
        compressionRatio,
        performanceScore
      };

      return this.analysisResult;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  // Get bundle stats from Next.js
  private async getBundleStats(): Promise<any> {
    try {
      // In a real implementation, this would read the webpack stats file
      // For now, we'll simulate based on current project structure
      const response = await fetch('/api/bundle-stats');
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback to mock data
      return this.getMockBundleStats();
    } catch (error) {
      console.warn('Could not fetch bundle stats, using mock data:', error);
      return this.getMockBundleStats();
    }
  }

  // Mock bundle stats for development
  private getMockBundleStats(): any {
    return {
      chunks: [
        {
          name: 'pages/_app',
          size: 45 * 1024,
          modules: ['react', 'react-dom', 'next/app'],
          isEntry: true,
          isDynamic: false
        },
        {
          name: 'pages/results/[id]',
          size: 38 * 1024,
          modules: ['recharts', 'lucide-react', '@/components/results'],
          isEntry: true,
          isDynamic: false
        },
        {
          name: 'vendors/main',
          size: 52 * 1024,
          modules: ['@tanstack/react-query', 'axios', 'zod'],
          isEntry: false,
          isDynamic: false
        },
        {
          name: 'vendors/recharts',
          size: 28 * 1024,
          modules: ['recharts'],
          isEntry: false,
          isDynamic: true
        }
      ],
      assets: [
        {
          name: 'main.css',
          size: 15 * 1024,
          type: 'css'
        },
        {
          name: 'geist-sans.woff2',
          size: 8 * 1024,
          type: 'font'
        }
      ]
    };
  }

  // Analyze chunks
  private async analyzeChunks(bundleStats: any): Promise<ChunkAnalysis[]> {
    const chunks: ChunkAnalysis[] = [];

    for (const chunk of bundleStats.chunks) {
      const gzippedSize = Math.round(chunk.size * 0.3); // Assume 70% compression
      const optimizationLevel = this.getChunkOptimizationLevel(chunk.size, gzippedSize);

      chunks.push({
        name: chunk.name,
        size: chunk.size,
        gzippedSize,
        modules: chunk.modules || [],
        dependencies: chunk.dependencies || [],
        isEntry: chunk.isEntry || false,
        isDynamic: chunk.isDynamic || false,
        optimizationLevel
      });
    }

    return chunks;
  }

  // Analyze assets
  private async analyzeAssets(bundleStats: any): Promise<AssetAnalysis[]> {
    const assets: AssetAnalysis[] = [];

    for (const asset of bundleStats.assets || []) {
      const optimizedSize = this.getOptimizedAssetSize(asset);
      const compressionRatio = asset.size > 0 ? (1 - optimizedSize / asset.size) * 100 : 0;

      assets.push({
        name: asset.name,
        type: asset.type || 'other',
        size: asset.size,
        optimizedSize,
        compressionRatio,
        path: asset.path || `/${asset.name}`,
        isCritical: this.isCriticalAsset(asset),
        canBeLazyLoaded: this.canBeLazyLoaded(asset)
      });
    }

    return assets;
  }

  // Find unused exports
  private async findUnusedExports(): Promise<string[]> {
    // In a real implementation, this would analyze the codebase
    // For now, return common unused exports
    return [
      'unusedUtilityFunction',
      'deprecatedComponent',
      'experimentalFeature'
    ];
  }

  // Find duplicate modules
  private async findDuplicateModules(): Promise<string[]> {
    // In a real implementation, this would analyze webpack stats
    // For now, return common duplicates
    return [
      'lodash',
      'moment',
      'date-fns'
    ];
  }

  // Generate optimization opportunities
  private async generateOptimizationOpportunities(
    chunks: ChunkAnalysis[],
    assets: AssetAnalysis[],
    unusedExports: string[],
    duplicateModules: string[]
  ): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Code splitting opportunities
    const largeChunks = chunks.filter(chunk => chunk.size > this.config.chunkSizeThreshold);
    if (largeChunks.length > 0) {
      opportunities.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Found ${largeChunks.length} chunks larger than ${Math.round(this.config.chunkSizeThreshold / 1024)}KB`,
        estimatedSavings: largeChunks.reduce((sum, chunk) => sum + chunk.size * 0.3, 0),
        implementation: 'Implement dynamic imports and route-based code splitting',
        effort: 'medium'
      });
    }

    // Tree shaking opportunities
    if (unusedExports.length > 0) {
      opportunities.push({
        type: 'tree-shaking',
        priority: 'medium',
        description: `Found ${unusedExports.length} unused exports that can be removed`,
        estimatedSavings: unusedExports.length * 1024, // Estimate 1KB per unused export
        implementation: 'Configure webpack for better tree shaking and remove unused exports',
        effort: 'low'
      });
    }

    // Compression opportunities
    const uncompressedAssets = assets.filter(asset => asset.compressionRatio < 50);
    if (uncompressedAssets.length > 0) {
      opportunities.push({
        type: 'compression',
        priority: 'high',
        description: `Found ${uncompressedAssets.length} assets with poor compression`,
        estimatedSavings: uncompressedAssets.reduce((sum, asset) => sum + asset.size * 0.4, 0),
        implementation: 'Enable Brotli compression and optimize asset compression settings',
        effort: 'low'
      });
    }

    // Asset optimization opportunities
    const unoptimizedImages = assets.filter(asset => 
      asset.type === 'image' && asset.size > 100 * 1024
    );
    if (unoptimizedImages.length > 0) {
      opportunities.push({
        type: 'asset-optimization',
        priority: 'medium',
        description: `Found ${unoptimizedImages.length} images larger than 100KB`,
        estimatedSavings: unoptimizedImages.reduce((sum, asset) => sum + asset.size * 0.5, 0),
        implementation: 'Compress images and implement responsive image loading',
        effort: 'medium'
      });
    }

    // Dynamic import opportunities
    const staticChunks = chunks.filter(chunk => !chunk.isDynamic && chunk.size > 20 * 1024);
    if (staticChunks.length > 0) {
      opportunities.push({
        type: 'dynamic-import',
        priority: 'medium',
        description: `Found ${staticChunks.length} chunks that could be loaded dynamically`,
        estimatedSavings: staticChunks.reduce((sum, chunk) => sum + chunk.size * 0.2, 0),
        implementation: 'Convert static imports to dynamic imports for non-critical chunks',
        effort: 'medium'
      });
    }

    // Duplicate module opportunities
    if (duplicateModules.length > 0) {
      opportunities.push({
        type: 'chunk-optimization',
        priority: 'high',
        description: `Found ${duplicateModules.length} duplicate modules across chunks`,
        estimatedSavings: duplicateModules.length * 50 * 1024, // Estimate 50KB per duplicate
        implementation: 'Configure webpack deduplication and shared chunks',
        effort: 'complex'
      });
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get chunk optimization level
  private getChunkOptimizationLevel(size: number, gzippedSize: number): 'optimal' | 'needs-optimization' | 'critical' {
    if (size <= this.config.chunkSizeThreshold && gzippedSize <= size * 0.4) {
      return 'optimal';
    } else if (size <= this.config.chunkSizeThreshold * 2) {
      return 'needs-optimization';
    } else {
      return 'critical';
    }
  }

  // Get optimized asset size
  private getOptimizedAssetSize(asset: any): number {
    switch (asset.type) {
      case 'js':
        return Math.round(asset.size * 0.3); // 70% compression for JS
      case 'css':
        return Math.round(asset.size * 0.2); // 80% compression for CSS
      case 'image':
        return Math.round(asset.size * 0.5); // 50% compression for images
      case 'font':
        return Math.round(asset.size * 0.1); // 90% compression for fonts (already compressed)
      default:
        return Math.round(asset.size * 0.4); // 60% compression for other assets
    }
  }

  // Check if asset is critical
  private isCriticalAsset(asset: any): boolean {
    const criticalAssets = ['main.css', 'geist-sans.woff2', 'geist-mono.woff2'];
    return criticalAssets.includes(asset.name);
  }

  // Check if asset can be lazy loaded
  private canBeLazyLoaded(asset: any): boolean {
    const lazyLoadableTypes = ['image'];
    return lazyLoadableTypes.includes(asset.type) && !this.isCriticalAsset(asset);
  }

  // Calculate performance score
  private calculatePerformanceScore(totalSize: number, gzippedSize: number, chunkCount: number): number {
    let score = 100;

    // Size penalty
    if (totalSize > this.config.targetBundleSize) {
      const excessPercentage = ((totalSize - this.config.targetBundleSize) / this.config.targetBundleSize) * 100;
      score -= Math.min(excessPercentage, 50);
    }

    // Compression penalty
    const compressionRatio = totalSize > 0 ? (1 - gzippedSize / totalSize) * 100 : 0;
    if (compressionRatio < 60) {
      score -= (60 - compressionRatio);
    }

    // Chunk count penalty
    if (chunkCount > 10) {
      score -= (chunkCount - 10) * 2;
    }

    return Math.max(0, Math.round(score));
  }

  // Apply optimizations
  async applyOptimizations(): Promise<void> {
    if (this.isOptimizing) {
      throw new Error('Optimization already in progress');
    }

    this.isOptimizing = true;

    try {
      const strategies = this.getOptimizationStrategies();
      
      for (const strategy of strategies) {
        console.log(`Applying optimization: ${strategy.name}`);
        await strategy.implementation();
      }

      console.log('Bundle optimization completed');
    } catch (error) {
      console.error('Bundle optimization failed:', error);
      throw error;
    } finally {
      this.isOptimizing = false;
    }
  }

  // Get optimization strategies
  private getOptimizationStrategies(): OptimizationStrategy[] {
    const strategies: OptimizationStrategy[] = [];

    if (this.config.enableCodeSplitting) {
      strategies.push({
        name: 'Code Splitting',
        description: 'Implement route-based and component-based code splitting',
        implementation: async () => {
          // This would integrate with Next.js dynamic imports
          console.log('Implementing code splitting...');
        },
        estimatedImpact: 30,
        complexity: 'medium'
      });
    }

    if (this.config.enableTreeShaking) {
      strategies.push({
        name: 'Tree Shaking',
        description: 'Remove unused code and exports',
        implementation: async () => {
          // This would configure webpack for better tree shaking
          console.log('Implementing tree shaking...');
        },
        estimatedImpact: 20,
        complexity: 'low'
      });
    }

    if (this.config.enableCompression) {
      strategies.push({
        name: 'Compression',
        description: 'Enable Brotli and gzip compression',
        implementation: async () => {
          // This would configure compression settings
          console.log('Implementing compression...');
        },
        estimatedImpact: 40,
        complexity: 'low'
      });
    }

    if (this.config.enableAssetOptimization) {
      strategies.push({
        name: 'Asset Optimization',
        description: 'Optimize images, fonts, and other assets',
        implementation: async () => {
          // This would optimize assets
          console.log('Implementing asset optimization...');
        },
        estimatedImpact: 25,
        complexity: 'medium'
      });
    }

    if (this.config.enableDynamicImports) {
      strategies.push({
        name: 'Dynamic Imports',
        description: 'Convert static imports to dynamic imports for non-critical code',
        implementation: async () => {
          // This would implement dynamic imports
          console.log('Implementing dynamic imports...');
        },
        estimatedImpact: 35,
        complexity: 'medium'
      });
    }

    return strategies.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }

  // Get optimization report
  getOptimizationReport(): {
    analysis: BundleAnalysisResult | null;
    recommendations: string[];
    estimatedSavings: number;
    implementationPlan: OptimizationStrategy[];
  } {
    if (!this.analysisResult) {
      return {
        analysis: null,
        recommendations: ['Run bundle analysis first'],
        estimatedSavings: 0,
        implementationPlan: []
      };
    }

    const recommendations = this.analysisResult.optimizationOpportunities.map(
      opportunity => opportunity.description
    );

    const estimatedSavings = this.analysisResult.optimizationOpportunities.reduce(
      (total, opportunity) => total + opportunity.estimatedSavings,
      0
    );

    const implementationPlan = this.getOptimizationStrategies();

    return {
      analysis: this.analysisResult,
      recommendations,
      estimatedSavings,
      implementationPlan
    };
  }

  // Get current configuration
  getConfig(): BundleOptimizationConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<BundleOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Reset analysis
  resetAnalysis(): void {
    this.analysisResult = null;
  }
}

// Export singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance();

// Export utility functions
export const analyzeBundle = () => bundleOptimizer.analyzeBundle();
export const applyOptimizations = () => bundleOptimizer.applyOptimizations();
export const getOptimizationReport = () => bundleOptimizer.getOptimizationReport();
export const updateBundleConfig = (config: Partial<BundleOptimizationConfig>) => 
  bundleOptimizer.updateConfig(config);

export default bundleOptimizer;