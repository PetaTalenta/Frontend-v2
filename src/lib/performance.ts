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

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private reportEndpoint: string = '/api/performance';
  private buildInfo: PerformanceReport['buildInfo'];

  constructor() {
    this.buildInfo = {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Initialize performance monitoring
  init() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals using native Performance API
    this.measureCoreWebVitals();
    
    // Monitor custom metrics
    this.measureCustomMetrics();
    
    // Monitor resource loading
    this.measureResourceLoading();
    
    // Setup error tracking
    this.setupErrorTracking();
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
          this.addMetric({
            name: 'Largest Contentful Paint',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP monitoring not supported');
    }

    // Measure First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.processingStart) {
            const fid = entry.processingStart - entry.startTime;
            this.addMetric({
              name: 'First Input Delay',
              value: fid,
              rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID monitoring not supported');
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
        
        this.addMetric({
          name: 'Cumulative Layout Shift',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS monitoring not supported');
    }
  }

  // Measure custom metrics
  private measureCustomMetrics() {
    // Measure time to interactive
    this.measureTimeToInteractive();
    
    // Measure API response times
    this.measureApiResponseTimes();
  }

  // Measure Time to Interactive
  private measureTimeToInteractive() {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    
    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        const tti = performance.now() - startTime;
        
        this.addMetric({
          name: 'Time to Interactive',
          value: tti,
          rating: tti < 3800 ? 'good' : tti < 7300 ? 'needs-improvement' : 'poor'
        });
      }
    };

    document.addEventListener('readystatechange', checkInteractive);
  }

  // Measure API response times
  private measureApiResponseTimes() {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Log slow API calls
        if (responseTime > 1000) {
          console.warn(`[Performance] Slow API call: ${input} took ${responseTime.toFixed(2)}ms`);
        }
        
        this.addMetric({
          name: 'API Response Time',
          value: responseTime,
          rating: responseTime < 500 ? 'good' : responseTime < 1000 ? 'needs-improvement' : 'poor'
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        console.error(`[Performance] Failed API call: ${input} took ${responseTime.toFixed(2)}ms`, error);
        
        throw error;
      }
    };
  }

  // Measure resource loading
  private measureResourceLoading() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Log slow resources
          if (resource.duration > 2000) {
            console.warn(`[Performance] Slow resource: ${resource.name} took ${resource.duration.toFixed(2)}ms`);
          }
          
          this.addMetric({
            name: 'Resource Load Time',
            value: resource.duration,
            rating: resource.duration < 1000 ? 'good' : resource.duration < 2000 ? 'needs-improvement' : 'poor'
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Setup error tracking
  private setupErrorTracking() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event: ErrorEvent) => {
      console.error('[Performance] JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.message || 'Unknown error'
      });
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      console.error('[Performance] Unhandled Promise Rejection:', event.reason?.message || event.reason || 'Unknown rejection');
    });
  }

  // Add metric to collection
  private addMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };
    
    this.metrics.push(fullMetric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, metric);
    }

    // Send to analytics endpoint
    this.sendMetric(fullMetric);
  }

  // Send metric to analytics
  private sendMetric(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === 'development') return;

    // Send to analytics endpoint
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
      })
    }).catch(error => {
      console.error('[Performance] Failed to send metric:', error);
    });
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
export const performanceMonitor = new PerformanceMonitor();

// Export hook for React components
export function usePerformanceMonitor() {
  const getReport = () => performanceMonitor.getReport();
  const getScore = () => performanceMonitor.getScore();
  const clearMetrics = () => performanceMonitor.clearMetrics();

  return {
    getReport,
    getScore,
    clearMetrics
  };
}

// Export types
export type { PerformanceMetric, PerformanceReport };