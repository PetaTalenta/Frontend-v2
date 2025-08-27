/**
 * CDN Performance Utilities
 * Tools for monitoring and optimizing CDN performance
 */

import { CDN_CONFIG, checkCDNHealth } from '../config/cdn-config';

interface CDNMetrics {
  responseTime: number;
  cacheHitRate: number;
  bandwidth: number;
  errorRate: number;
  availability: number;
}

interface CDNPerformanceData {
  timestamp: number;
  metrics: CDNMetrics;
  region: string;
  assetType: string;
}

class CDNPerformanceMonitor {
  private metrics: CDNPerformanceData[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring CDN performance
   */
  startMonitoring(intervalMs: number = 60000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log('CDN Performance monitoring started');
  }

  /**
   * Stop monitoring CDN performance
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('CDN Performance monitoring stopped');
  }

  /**
   * Collect current CDN metrics
   */
  private async collectMetrics() {
    try {
      const startTime = performance.now();
      const isHealthy = await checkCDNHealth();
      const responseTime = performance.now() - startTime;

      const metrics: CDNMetrics = {
        responseTime,
        cacheHitRate: await this.getCacheHitRate(),
        bandwidth: await this.getBandwidthUsage(),
        errorRate: await this.getErrorRate(),
        availability: isHealthy ? 100 : 0
      };

      const data: CDNPerformanceData = {
        timestamp: Date.now(),
        metrics,
        region: await this.getRegion(),
        assetType: 'health-check'
      };

      this.metrics.push(data);

      // Keep only last 100 measurements
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Report to analytics if enabled
      if (CDN_CONFIG.MONITORING.TRACK_CDN_USAGE) {
        this.reportMetrics(data);
      }

    } catch (error) {
      console.error('Failed to collect CDN metrics:', error);
    }
  }

  /**
   * Get cache hit rate from CDN headers
   */
  private async getCacheHitRate(): Promise<number> {
    try {
      const response = await fetch(`${CDN_CONFIG.BASE_URL}/test-asset.png`, {
        method: 'HEAD'
      });

      const cacheStatus = response.headers.get('cf-cache-status') || 
                         response.headers.get('x-cache') || 
                         response.headers.get('x-cdn-cache');

      // Parse cache status to determine hit rate
      if (cacheStatus?.includes('HIT')) return 100;
      if (cacheStatus?.includes('MISS')) return 0;
      return 50; // Unknown, assume 50%

    } catch {
      return 0;
    }
  }

  /**
   * Estimate bandwidth usage
   */
  private async getBandwidthUsage(): Promise<number> {
    // This would typically come from CDN analytics API
    // For now, return estimated value based on connection
    const connection = (navigator as any).connection;
    if (connection) {
      return connection.downlink || 10; // Mbps
    }
    return 10; // Default estimate
  }

  /**
   * Calculate error rate
   */
  private async getErrorRate(): Promise<number> {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 0;

    const errors = recentMetrics.filter(m => m.metrics.availability < 100).length;
    return (errors / recentMetrics.length) * 100;
  }

  /**
   * Get user's region
   */
  private async getRegion(): Promise<string> {
    try {
      // This would typically use a geolocation service
      // For now, use timezone as approximation
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return timezone.split('/')[0] || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Report metrics to analytics
   */
  private reportMetrics(data: CDNPerformanceData) {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cdn_performance', {
        response_time: data.metrics.responseTime,
        cache_hit_rate: data.metrics.cacheHitRate,
        bandwidth: data.metrics.bandwidth,
        error_rate: data.metrics.errorRate,
        availability: data.metrics.availability,
        region: data.region
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/cdn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {
      // Silently fail - analytics shouldn't break the app
    });
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): {
    averageResponseTime: number;
    averageCacheHitRate: number;
    averageBandwidth: number;
    averageErrorRate: number;
    averageAvailability: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageResponseTime: 0,
        averageCacheHitRate: 0,
        averageBandwidth: 0,
        averageErrorRate: 0,
        averageAvailability: 0
      };
    }

    const sum = this.metrics.reduce((acc, data) => ({
      responseTime: acc.responseTime + data.metrics.responseTime,
      cacheHitRate: acc.cacheHitRate + data.metrics.cacheHitRate,
      bandwidth: acc.bandwidth + data.metrics.bandwidth,
      errorRate: acc.errorRate + data.metrics.errorRate,
      availability: acc.availability + data.metrics.availability
    }), {
      responseTime: 0,
      cacheHitRate: 0,
      bandwidth: 0,
      errorRate: 0,
      availability: 0
    });

    const count = this.metrics.length;

    return {
      averageResponseTime: Math.round(sum.responseTime / count),
      averageCacheHitRate: Math.round(sum.cacheHitRate / count),
      averageBandwidth: Math.round(sum.bandwidth / count),
      averageErrorRate: Math.round(sum.errorRate / count),
      averageAvailability: Math.round(sum.availability / count)
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 10): CDNPerformanceData[] {
    return this.metrics.slice(-count);
  }
}

// Global CDN performance monitor instance
export const cdnPerformanceMonitor = new CDNPerformanceMonitor();

/**
 * Preload critical CDN resources
 */
export function preloadCDNResources() {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  CDN_CONFIG.OPTIMIZATION.FONT_PRELOAD.forEach(fontPath => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = `${CDN_CONFIG.STATIC_URL}${fontPath}`;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // DNS prefetch for CDN domains
  CDN_CONFIG.PERFORMANCE.DNS_PREFETCH.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical origins
  CDN_CONFIG.PERFORMANCE.PRECONNECT.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Measure asset load time
 */
export function measureAssetLoadTime(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve(loadTime);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load asset: ${url}`));
    };
    
    img.src = url;
  });
}

/**
 * Initialize CDN performance monitoring
 */
export function initializeCDNMonitoring() {
  if (typeof window === 'undefined') return;

  // Start monitoring in production
  if (process.env.NODE_ENV === 'production' && CDN_CONFIG.MONITORING.TRACK_PERFORMANCE) {
    cdnPerformanceMonitor.startMonitoring();
  }

  // Preload critical resources
  preloadCDNResources();

  console.log('CDN Performance monitoring initialized');
}

/**
 * Safe initialization for SSR
 */
export function safeInitializeCDNMonitoring() {
  if (typeof window !== 'undefined' && CDN_CONFIG.ENABLED) {
    initializeCDNMonitoring();
  }
}
