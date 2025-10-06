/**
 * Performance Metrics Utilities
 * Track dan measure dashboard loading performance
 * 
 * @module performance-metrics
 * @description Provides utilities untuk monitor cache hit rates, loading times, dan performance improvements
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgLoadTime: number;
  cacheLoadTime: number;
  apiLoadTime: number;
}

/**
 * Performance Monitor Class
 * Tracks performance metrics untuk dashboard loading
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private loadTimes: number[] = [];
  private cacheLoadTimes: number[] = [];
  private apiLoadTimes: number[] = [];

  /**
   * Start tracking a performance metric
   */
  startMetric(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  /**
   * End tracking a performance metric
   */
  endMetric(name: string, metadata?: Record<string, any>): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PerformanceMonitor] Metric not found: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    console.log(`[PerformanceMonitor] ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
    return duration;
  }

  /**
   * Record cache hit
   */
  recordCacheHit(loadTime: number): void {
    this.cacheHits++;
    this.cacheLoadTimes.push(loadTime);
    this.loadTimes.push(loadTime);
  }

  /**
   * Record cache miss (API call)
   */
  recordCacheMiss(loadTime: number): void {
    this.cacheMisses++;
    this.apiLoadTimes.push(loadTime);
    this.loadTimes.push(loadTime);
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    const avgLoadTime = this.loadTimes.length > 0
      ? this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length
      : 0;

    const cacheLoadTime = this.cacheLoadTimes.length > 0
      ? this.cacheLoadTimes.reduce((a, b) => a + b, 0) / this.cacheLoadTimes.length
      : 0;

    const apiLoadTime = this.apiLoadTimes.length > 0
      ? this.apiLoadTimes.reduce((a, b) => a + b, 0) / this.apiLoadTimes.length
      : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate,
      totalRequests,
      avgLoadTime,
      cacheLoadTime,
      apiLoadTime
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.loadTimes = [];
    this.cacheLoadTimes = [];
    this.apiLoadTimes = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const cacheMetrics = this.getCacheMetrics();
    const allMetrics = this.getAllMetrics();

    let report = '\n=== Performance Report ===\n\n';

    // Cache metrics
    report += '📊 Cache Performance:\n';
    report += `  - Total Requests: ${cacheMetrics.totalRequests}\n`;
    report += `  - Cache Hits: ${cacheMetrics.hits}\n`;
    report += `  - Cache Misses: ${cacheMetrics.misses}\n`;
    report += `  - Hit Rate: ${cacheMetrics.hitRate.toFixed(2)}%\n`;
    report += `  - Avg Load Time: ${cacheMetrics.avgLoadTime.toFixed(2)}ms\n`;
    report += `  - Cache Load Time: ${cacheMetrics.cacheLoadTime.toFixed(2)}ms\n`;
    report += `  - API Load Time: ${cacheMetrics.apiLoadTime.toFixed(2)}ms\n`;

    if (cacheMetrics.apiLoadTime > 0 && cacheMetrics.cacheLoadTime > 0) {
      const improvement = ((cacheMetrics.apiLoadTime - cacheMetrics.cacheLoadTime) / cacheMetrics.apiLoadTime) * 100;
      report += `  - Performance Improvement: ${improvement.toFixed(2)}% faster with cache\n`;
    }

    // Individual metrics
    if (allMetrics.length > 0) {
      report += '\n⏱️ Individual Metrics:\n';
      allMetrics
        .filter(m => m.duration !== undefined)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .forEach(metric => {
          report += `  - ${metric.name}: ${metric.duration!.toFixed(2)}ms\n`;
          if (metric.metadata) {
            Object.entries(metric.metadata).forEach(([key, value]) => {
              report += `    ${key}: ${value}\n`;
            });
          }
        });
    }

    report += '\n========================\n';
    return report;
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    console.log(this.generateReport());
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook untuk track component render performance
 */
export function usePerformanceTracking(componentName: string) {
  const metricName = `${componentName}-render`;

  // Start tracking on mount
  if (typeof window !== 'undefined') {
    performanceMonitor.startMetric(metricName);
  }

  return {
    /**
     * Mark component as loaded
     */
    markLoaded: (metadata?: Record<string, any>) => {
      performanceMonitor.endMetric(metricName, metadata);
    },

    /**
     * Record cache hit
     */
    recordCacheHit: (loadTime: number) => {
      performanceMonitor.recordCacheHit(loadTime);
    },

    /**
     * Record cache miss
     */
    recordCacheMiss: (loadTime: number) => {
      performanceMonitor.recordCacheMiss(loadTime);
    }
  };
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.startMetric(name, metadata);
  try {
    const result = await fn();
    performanceMonitor.endMetric(name);
    return result;
  } catch (error) {
    performanceMonitor.endMetric(name, { error: true });
    throw error;
  }
}

/**
 * Measure synchronous function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  performanceMonitor.startMetric(name, metadata);
  try {
    const result = fn();
    performanceMonitor.endMetric(name);
    return result;
  } catch (error) {
    performanceMonitor.endMetric(name, { error: true });
    throw error;
  }
}

/**
 * Get Web Vitals metrics (if available)
 */
export function getWebVitals(): Record<string, number> {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return {};

  return {
    // Time to First Byte
    ttfb: navigation.responseStart - navigation.requestStart,
    // DOM Content Loaded
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    // Load Complete
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    // DOM Interactive
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    // Total Load Time
    totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
  };
}

/**
 * Log Web Vitals to console
 */
export function logWebVitals(): void {
  const vitals = getWebVitals();
  console.log('\n=== Web Vitals ===');
  Object.entries(vitals).forEach(([key, value]) => {
    console.log(`${key}: ${value.toFixed(2)}ms`);
  });
  console.log('==================\n');
}

/**
 * Export performance data untuk analytics
 */
export function exportPerformanceData(): {
  cacheMetrics: CacheMetrics;
  metrics: PerformanceMetric[];
  webVitals: Record<string, number>;
  timestamp: number;
} {
  return {
    cacheMetrics: performanceMonitor.getCacheMetrics(),
    metrics: performanceMonitor.getAllMetrics(),
    webVitals: getWebVitals(),
    timestamp: Date.now()
  };
}

