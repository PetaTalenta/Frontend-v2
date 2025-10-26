interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceReport {
  url: string;
  timestamp: number;
  userAgent: string;
  metrics: PerformanceMetric[];
  buildInfo: {
    version: string;
    buildTime: string;
    environment: string;
  };
}

class OptimizedPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private reportEndpoint: string = '/api/performance';
  private buildInfo: PerformanceReport['buildInfo'];
  private lastLogTime = 0;
  private readonly LOG_COOLDOWN = 1000; // 1 second cooldown
  private readonly MAX_METRICS = 50; // Limit stored metrics

  constructor() {
    this.buildInfo = {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Initialize performance monitoring with reduced overhead
  init() {
    if (typeof window === 'undefined') return;

    // Only monitor critical metrics in development
    if (process.env.NODE_ENV === 'development') {
      this.measureCoreWebVitals();
      this.measureApiResponseTimes();
    } else {
      // In production, monitor everything but with rate limiting
      this.measureCoreWebVitals();
      this.measureCustomMetrics();
      this.measureResourceLoading();
      this.setupErrorTracking();
    }
  }

  // Measure Core Web Vitals using Performance Observer API
  private measureCoreWebVitals() {
    if (!window.PerformanceObserver) return;

    // Measure Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.addMetricThrottled({
            name: 'Largest Contentful Paint',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Silently fail in production
    }

    // Measure Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.addMetricThrottled({
          name: 'Cumulative Layout Shift',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Silently fail in production
    }
  }

  // Measure custom metrics
  private measureCustomMetrics() {
    this.measureTimeToInteractive();
  }

  // Measure Time to Interactive
  private measureTimeToInteractive() {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    
    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        const tti = performance.now() - startTime;
        
        this.addMetricThrottled({
          name: 'Time to Interactive',
          value: tti,
          rating: tti < 3800 ? 'good' : tti < 7300 ? 'needs-improvement' : 'poor'
        });
      }
    };

    document.addEventListener('readystatechange', checkInteractive);
  }

  // Measure API response times with reduced overhead
  private measureApiResponseTimes() {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Only log slow API calls
        if (responseTime > 1000) {
          this.addMetricThrottled({
            name: 'API Response Time',
            value: responseTime,
            rating: responseTime < 500 ? 'good' : responseTime < 1000 ? 'needs-improvement' : 'poor'
          });
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Only log failed API calls
        this.addMetricThrottled({
          name: 'API Response Time',
          value: responseTime,
          rating: 'poor'
        });
        
        throw error;
      }
    };
  }

  // Measure resource loading only in production
  private measureResourceLoading() {
    if (typeof window === 'undefined' || !window.PerformanceObserver || process.env.NODE_ENV === 'development') return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Only log slow resources
          if (resource.duration > 2000) {
            this.addMetricThrottled({
              name: 'Resource Load Time',
              value: resource.duration,
              rating: resource.duration < 1000 ? 'good' : resource.duration < 2000 ? 'needs-improvement' : 'poor'
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Setup error tracking
  private setupErrorTracking() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event: ErrorEvent) => {
      // Only log critical errors in production
      if (event.message.includes('ResizeObserver loop limit exceeded')) return;
      
      this.addMetricThrottled({
        name: 'JavaScript Error',
        value: 1,
        rating: 'poor'
      });
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.addMetricThrottled({
        name: 'Unhandled Promise Rejection',
        value: 1,
        rating: 'poor'
      });
    });
  }

  // Throttled metric addition to prevent overhead
  private addMetricThrottled(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const now = Date.now();
    
    // Rate limiting
    if (now - this.lastLogTime < this.LOG_COOLDOWN) {
      return;
    }
    
    this.lastLogTime = now;
    
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: now
    };
    
    // Limit stored metrics
    if (this.metrics.length >= this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS + 1);
    }
    
    this.metrics.push(fullMetric);
    
    // Minimal logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
    }

    // Send to analytics endpoint only in production
    if (process.env.NODE_ENV === 'production') {
      this.sendMetric(fullMetric);
    }
  }

  // Send metric to analytics with error handling
  private sendMetric(metric: PerformanceMetric) {
    // Use sendBeacon for better performance
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        metric,
        buildInfo: this.buildInfo,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      
      navigator.sendBeacon(this.reportEndpoint, data);
    } else {
      // Fallback to fetch
      fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          buildInfo: this.buildInfo,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        }),
        keepalive: true
      }).catch(() => {
        // Silently fail
      });
    }
  }

  // Get performance report
  getReport(): PerformanceReport {
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      metrics: this.metrics,
      buildInfo: this.buildInfo
    };
  }

  // Generate performance score
  getScore(): number {
    if (this.metrics.length === 0) return 0;

    const goodMetrics = this.metrics.filter(m => m.rating === 'good').length;
    const totalMetrics = this.metrics.length;

    return Math.round((goodMetrics / totalMetrics) * 100);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export const optimizedPerformanceMonitor = new OptimizedPerformanceMonitor();

// Export hook for React components
export function useOptimizedPerformanceMonitor() {
  const getReport = () => optimizedPerformanceMonitor.getReport();
  const getScore = () => optimizedPerformanceMonitor.getScore();
  const clearMetrics = () => optimizedPerformanceMonitor.clearMetrics();

  return {
    getReport,
    getScore,
    clearMetrics
  };
}

// Export types
export type { PerformanceMetric, PerformanceReport };