// Performance API is available globally, no need to import

// Performance metrics interface
export interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  errorRate: number;
}

// Bundle analysis result
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  largestAssets: AssetInfo[];
  unusedExports: string[];
  optimizationSuggestions: OptimizationSuggestion[];
}

// Chunk information
export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  dependencies: string[];
}

// Asset information
export interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font';
  path: string;
}

// Optimization suggestion
export interface OptimizationSuggestion {
  type: 'bundle' | 'code' | 'caching' | 'network' | 'rendering';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedImpact: string;
  implementation: string;
}

// Performance optimization configuration
export interface OptimizationConfig {
  enableBundleAnalysis: boolean;
  enableMemoryOptimization: boolean;
  enableRenderOptimization: boolean;
  enableNetworkOptimization: boolean;
  enableCacheOptimization: boolean;
  performanceThresholds: {
    maxBundleSize: number;
    maxLoadTime: number;
    maxRenderTime: number;
    maxMemoryUsage: number;
    minCacheHitRate: number;
    maxNetworkRequests: number;
    maxErrorRate: number;
  };
}

// Performance Optimizer with bundle analysis and optimization
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private observers: PerformanceObserver[] = [];
  private isOptimizing = false;

  private constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableBundleAnalysis: true,
      enableMemoryOptimization: true,
      enableRenderOptimization: true,
      enableNetworkOptimization: true,
      enableCacheOptimization: true,
      performanceThresholds: {
        maxBundleSize: 250 * 1024, // 250KB
        maxLoadTime: 3000, // 3 seconds
        maxRenderTime: 100, // 100ms
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        minCacheHitRate: 80, // 80%
        maxNetworkRequests: 20, // 20 requests
        maxErrorRate: 5, // 5%
      },
      ...config
    };

    this.metrics = {
      bundleSize: 0,
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      networkRequests: 0,
      errorRate: 0,
    };

    this.initializePerformanceObservers();
  }

  static getInstance(config?: Partial<OptimizationConfig>): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(config);
    }
    return PerformanceOptimizer.instance;
  }

  // Initialize performance observers
  private initializePerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Observer for navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          }
        });
      });

      // Observer for resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.metrics.networkRequests = entries.length;
        
        // Analyze resource types
        const resourceTypes = entries.reduce((types, entry) => {
          const type = this.getResourceType(entry.name);
          types[type] = (types[type] || 0) + 1;
          return types;
        }, {} as Record<string, number>);

        // Log resource analysis
        if (process.env.NODE_ENV === 'development') {
          console.log('Resource Analysis:', resourceTypes);
        }
      });

      // Observer for render timing
      const renderObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.metrics.renderTime = entry.duration;
          }
        });
      });

      // Register observers
      navigationObserver.observe({ entryTypes: ['navigation'] });
      resourceObserver.observe({ entryTypes: ['resource'] });
      renderObserver.observe({ entryTypes: ['measure'] });

      this.observers.push(navigationObserver, resourceObserver, renderObserver);
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf') || url.includes('.eot')) return 'font';
    return 'other';
  }

  // Analyze bundle size and structure
  analyzeBundle(): BundleAnalysis {
    if (!this.config.enableBundleAnalysis) {
      throw new Error('Bundle analysis is disabled');
    }

    try {
      // Get bundle information from webpack stats or similar
      const bundleInfo = this.getBundleInfo();
      
      const analysis: BundleAnalysis = {
        totalSize: bundleInfo.totalSize,
        gzippedSize: bundleInfo.gzippedSize,
        chunks: bundleInfo.chunks,
        largestAssets: bundleInfo.largestAssets,
        unusedExports: bundleInfo.unusedExports,
        optimizationSuggestions: []
      };

      // Generate optimization suggestions
      analysis.optimizationSuggestions = this.generateOptimizationSuggestions(analysis);

      return analysis;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw error;
    }
  }

  // Get bundle information (mock implementation)
  private getBundleInfo(): any {
    // In a real implementation, this would read webpack-stats.json or similar
    // For now, we'll return mock data based on current performance metrics
    return {
      totalSize: this.metrics.bundleSize || 150 * 1024, // 150KB default
      gzippedSize: (this.metrics.bundleSize || 150 * 1024) * 0.7, // 70% compression
      chunks: [
        {
          name: 'main',
          size: 100 * 1024,
          gzippedSize: 70 * 1024,
          modules: ['react', 'react-dom', 'lucide-react'],
          dependencies: []
        },
        {
          name: 'vendor',
          size: 50 * 1024,
          gzippedSize: 35 * 1024,
          modules: ['@tanstack/react-query', 'axios'],
          dependencies: []
        }
      ],
      largestAssets: [
        {
          name: 'main.js',
          size: 100 * 1024,
          type: 'js',
          path: '/static/js/main.js'
        }
      ],
      unusedExports: []
    };
  }

  // Generate optimization suggestions based on analysis
  private generateOptimizationSuggestions(analysis: BundleAnalysis): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const { maxBundleSize } = this.config.performanceThresholds;

    // Bundle size suggestions
    if (analysis.totalSize > maxBundleSize) {
      suggestions.push({
        type: 'bundle',
        priority: 'high',
        description: `Bundle size (${Math.round(analysis.totalSize / 1024)}KB) exceeds recommended maximum (${Math.round(maxBundleSize / 1024)}KB)`,
        estimatedImpact: 'Reduce initial load time by 30-50%',
        implementation: 'Implement code splitting, tree shaking, and dynamic imports'
      });
    }

    // Chunk analysis suggestions
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 50 * 1024);
    if (largeChunks.length > 0) {
      suggestions.push({
        type: 'bundle',
        priority: 'medium',
        description: `Found ${largeChunks.length} chunks larger than 50KB`,
        estimatedImpact: 'Improve caching and parallel loading',
        implementation: 'Split large chunks into smaller, more focused chunks'
      });
    }

    // Asset optimization suggestions
    const unoptimizedImages = analysis.largestAssets.filter(asset => 
      asset.type === 'image' && asset.size > 100 * 1024
    );
    if (unoptimizedImages.length > 0) {
      suggestions.push({
        type: 'bundle',
        priority: 'medium',
        description: `Found ${unoptimizedImages.length} images larger than 100KB`,
        estimatedImpact: 'Reduce page weight and improve load time',
        implementation: 'Compress images and implement responsive image loading'
      });
    }

    // Performance-based suggestions
    if (this.metrics.loadTime > this.config.performanceThresholds.maxLoadTime) {
      suggestions.push({
        type: 'network',
        priority: 'high',
        description: `Page load time (${this.metrics.loadTime}ms) exceeds recommended maximum (${this.config.performanceThresholds.maxLoadTime}ms)`,
        estimatedImpact: 'Improve user experience and SEO',
        implementation: 'Optimize critical rendering path, implement lazy loading, and enable HTTP/2'
      });
    }

    if (this.metrics.renderTime > this.config.performanceThresholds.maxRenderTime) {
      suggestions.push({
        type: 'rendering',
        priority: 'high',
        description: `Render time (${this.metrics.renderTime}ms) exceeds recommended maximum (${this.config.performanceThresholds.maxRenderTime}ms)`,
        estimatedImpact: 'Reduce jank and improve interaction responsiveness',
        implementation: 'Implement React.memo, useMemo, and virtualization for large lists'
      });
    }

    if (this.metrics.cacheHitRate < this.config.performanceThresholds.minCacheHitRate) {
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        description: `Cache hit rate (${this.metrics.cacheHitRate}%) below recommended minimum (${this.config.performanceThresholds.minCacheHitRate}%)`,
        estimatedImpact: 'Reduce network requests and improve load time',
        implementation: 'Implement service worker caching and optimize cache strategies'
      });
    }

    return suggestions;
  }

  // Optimize memory usage
  optimizeMemory(): void {
    if (!this.config.enableMemoryOptimization) {
      return;
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Clear unused caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      });
    }

    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  // Monitor memory usage
  private monitorMemoryUsage(): void {
    if ((performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;

      // Log memory warnings
      if (this.metrics.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
        console.warn(`High memory usage detected: ${Math.round(this.metrics.memoryUsage / 1024 / 1024)}MB`);
        
        // Trigger memory optimization
        this.optimizeMemory();
      }
    }
  }

  // Optimize rendering performance
  optimizeRendering(): void {
    if (!this.config.enableRenderOptimization || this.isOptimizing) {
      return;
    }

    this.isOptimizing = true;

    try {
      // Implement requestIdleCallback for non-critical updates
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          // Perform non-critical updates during idle time
          this.performIdleOptimizations();
        });
      }

      // Implement Intersection Observer for lazy loading
      if ('IntersectionObserver' in window) {
        this.setupLazyLoading();
      }

      // Optimize event listeners
      this.optimizeEventListeners();

    } finally {
      this.isOptimizing = false;
    }
  }

  // Perform optimizations during idle time
  private performIdleOptimizations(): void {
    // Preload critical resources
    this.preloadCriticalResources();

    // Clean up unused components
    this.cleanupUnusedComponents();

    // Optimize images
    this.optimizeImages();
  }

  // Setup lazy loading with Intersection Observer
  private setupLazyLoading(): void {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if (lazyImages.length === 0) {
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // Optimize event listeners
  private optimizeEventListeners(): void {
    // Implement passive event listeners for better performance
    const optimizeScroll = () => {
      const scrollHandler = () => {
        // Throttled scroll handling
        requestAnimationFrame(() => {
          // Handle scroll
        });
      };

      document.addEventListener('scroll', scrollHandler, { passive: true });
    };

    optimizeScroll();
  }

  // Preload critical resources
  private preloadCriticalResources(): void {
    const criticalResources = [
      '/fonts/geist-sans.woff2',
      '/fonts/geist-mono.woff2'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.includes('.woff') ? 'font' : 'script';
      document.head.appendChild(link);
    });
  }

  // Cleanup unused components
  private cleanupUnusedComponents(): void {
    // This would be implemented with React DevTools or similar
    // For now, just log the action
    if (process.env.NODE_ENV === 'development') {
      console.log('Performing component cleanup...');
    }
  }

  // Optimize images
  private optimizeImages(): void {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="lazy" for native lazy loading
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Optimize image sizes
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
        // Calculate natural dimensions if available
        if (img.naturalWidth && img.naturalHeight) {
          img.setAttribute('width', img.naturalWidth.toString());
          img.setAttribute('height', img.naturalHeight.toString());
        }
      }
    });
  }

  // Optimize network requests
  optimizeNetwork(): void {
    if (!this.config.enableNetworkOptimization) {
      return;
    }

    // Implement resource hints
    this.addResourceHints();

    // Optimize API calls
    this.optimizeApiCalls();

    // Implement service worker for caching
    this.setupServiceWorker();
  }

  // Add resource hints for better loading
  private addResourceHints(): void {
    const hints = [
      { rel: 'dns-prefetch', href: '//api.futureguide.id' },
      { rel: 'preconnect', href: '//api.futureguide.id' },
      { rel: 'prefetch', href: '/api/archive/results' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      Object.assign(link, hint);
      document.head.appendChild(link);
    });
  }

  // Optimize API calls with batching and deduplication
  private optimizeApiCalls(): void {
    // This would integrate with the existing API service
    // For now, just log the action
    if (process.env.NODE_ENV === 'development') {
      console.log('Optimizing API calls...');
    }
  }

  // Setup service worker for caching
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  // Optimize caching strategies
  optimizeCaching(): void {
    if (!this.config.enableCacheOptimization) {
      return;
    }

    // Implement cache warming
    this.warmupCache();

    // Implement cache invalidation strategies
    this.setupCacheInvalidation();

    // Optimize cache storage
    this.optimizeCacheStorage();
  }

  // Warm up cache with critical data
  private warmupCache(): void {
    // This would integrate with the existing cache system
    // For now, just log the action
    if (process.env.NODE_ENV === 'development') {
      console.log('Warming up cache...');
    }
  }

  // Setup intelligent cache invalidation
  private setupCacheInvalidation(): void {
    // Implement cache invalidation based on data changes
    // This would integrate with the existing cache system
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting up cache invalidation...');
    }
  }

  // Optimize cache storage for better performance
  private optimizeCacheStorage(): void {
    // Implement cache compression and optimization
    // This would integrate with the existing cache system
    if (process.env.NODE_ENV === 'development') {
      console.log('Optimizing cache storage...');
    }
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const { performanceThresholds } = this.config;
    
    let score = 100;
    
    // Deduct points for each threshold exceeded
    if (this.metrics.bundleSize > performanceThresholds.maxBundleSize) {
      score -= 20;
    }
    
    if (this.metrics.loadTime > performanceThresholds.maxLoadTime) {
      score -= 25;
    }
    
    if (this.metrics.renderTime > performanceThresholds.maxRenderTime) {
      score -= 20;
    }
    
    if (this.metrics.memoryUsage > performanceThresholds.maxMemoryUsage) {
      score -= 15;
    }
    
    if (this.metrics.cacheHitRate < performanceThresholds.minCacheHitRate) {
      score -= 10;
    }
    
    if (this.metrics.networkRequests > performanceThresholds.maxNetworkRequests) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  // Generate performance report
  generatePerformanceReport(): {
    score: number;
    metrics: PerformanceMetrics;
    suggestions: OptimizationSuggestion[];
    status: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const score = this.getPerformanceScore();
    // Generate bundle analysis (synchronously for now)
    const bundleAnalysis = this.analyzeBundle();
    const suggestions = this.generateOptimizationSuggestions(bundleAnalysis);
    
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'fair';
    else status = 'poor';

    return {
      score,
      metrics: this.metrics,
      suggestions,
      status
    };
  }

  // Cleanup performance observers
  cleanup(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Export utility functions
export const analyzeBundle = () => performanceOptimizer.analyzeBundle();
export const optimizeMemory = () => performanceOptimizer.optimizeMemory();
export const optimizeRendering = () => performanceOptimizer.optimizeRendering();
export const optimizeNetwork = () => performanceOptimizer.optimizeNetwork();
export const optimizeCaching = () => performanceOptimizer.optimizeCaching();
export const getPerformanceMetrics = () => performanceOptimizer.getMetrics();
export const getPerformanceScore = () => performanceOptimizer.getPerformanceScore();
export const generatePerformanceReport = () => performanceOptimizer.generatePerformanceReport();

export default performanceOptimizer;