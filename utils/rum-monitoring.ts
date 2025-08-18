/**
 * Real User Monitoring (RUM) System
 * Comprehensive monitoring of real user performance and behavior
 */

interface RUMMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  inp: number | null; // Interaction to Next Paint
  ttfb: number | null; // Time to First Byte

  // Custom Performance Metrics
  domContentLoaded: number | null;
  windowLoad: number | null;
  firstByte: number | null;
  
  // User Experience Metrics
  pageLoadTime: number | null;
  timeToInteractive: number | null;
  totalBlockingTime: number | null;
  
  // Resource Performance
  resourceLoadTimes: ResourceTiming[];
  
  // Memory and CPU
  memoryUsage: MemoryInfo | null;
  cpuUsage: number | null;
  
  // Network Information
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  
  // User Context
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  language: string;
  timezone: string;
  
  // Session Information
  sessionId: string;
  userId?: string;
  pageUrl: string;
  referrer: string;
  timestamp: number;
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  target: string;
  timestamp: number;
  duration?: number;
  value?: any;
}

interface ErrorInfo {
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
}

class RUMMonitor {
  private metrics: RUMMetrics;
  private interactions: UserInteraction[] = [];
  private errors: ErrorInfo[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private isMonitoring = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start RUM monitoring
   */
  start() {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.setupUserInteractionTracking();
    this.collectInitialMetrics();

    console.log('RUM monitoring started');
  }

  /**
   * Stop RUM monitoring
   */
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('RUM monitoring stopped');
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): RUMMetrics {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        inp: null,
        ttfb: null,
        domContentLoaded: null,
        windowLoad: null,
        firstByte: null,
        pageLoadTime: null,
        timeToInteractive: null,
        totalBlockingTime: null,
        resourceLoadTimes: [],
        memoryUsage: null,
        cpuUsage: null,
        connectionType: null,
        effectiveType: null,
        downlink: null,
        rtt: null,
        userAgent: 'server',
        viewport: { width: 0, height: 0 },
        devicePixelRatio: 1,
        language: 'en',
        timezone: 'UTC',
        sessionId: this.sessionId,
        pageUrl: '',
        referrer: '',
        timestamp: Date.now()
      };
    }

    return {
      fcp: null,
      lcp: null,
      cls: null,
      fid: null,
      inp: null,
      ttfb: null,
      domContentLoaded: null,
      windowLoad: null,
      firstByte: null,
      pageLoadTime: null,
      timeToInteractive: null,
      totalBlockingTime: null,
      resourceLoadTimes: [],
      memoryUsage: null,
      cpuUsage: null,
      connectionType: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    };
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers() {
    // Core Web Vitals observers
    this.observePaintMetrics();
    this.observeLCP();
    this.observeCLS();
    this.observeFID();
    this.observeINP();
    this.observeResourceTiming();
    this.observeLongTasks();
  }

  /**
   * Observe paint metrics (FCP)
   */
  private observePaintMetrics() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          this.reportMetric('fcp', entry.startTime);
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
    this.observers.push(observer);
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.reportMetric('lcp', lastEntry.startTime);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.cls = clsValue;
      this.reportMetric('cls', clsValue);
    });
    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  /**
   * Observe First Input Delay
   */
  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.metrics.fid = fid;
        this.reportMetric('fid', fid);
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  /**
   * Observe Interaction to Next Paint
   */
  private observeINP() {
    const observer = new PerformanceObserver((list) => {
      let maxINP = 0;
      for (const entry of list.getEntries()) {
        const inp = (entry as any).processingEnd - entry.startTime;
        maxINP = Math.max(maxINP, inp);
      }
      this.metrics.inp = maxINP;
      this.reportMetric('inp', maxINP);
    });
    observer.observe({ entryTypes: ['event'] });
    this.observers.push(observer);
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        this.metrics.resourceLoadTimes.push({
          name: resource.name,
          type: this.getResourceType(resource.name),
          duration: resource.duration,
          size: resource.transferSize || 0,
          cached: resource.transferSize === 0 && resource.decodedBodySize > 0
        });
      }
    });
    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks() {
    const observer = new PerformanceObserver((list) => {
      let totalBlockingTime = 0;
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          totalBlockingTime += entry.duration - 50;
        }
      }
      this.metrics.totalBlockingTime = totalBlockingTime;
    });
    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack || '',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || '',
        filename: window.location.href,
        lineno: 0,
        colno: 0,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId
      });
    });
  }

  /**
   * Setup user interaction tracking
   */
  private setupUserInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackInteraction({
        type: 'click',
        target: this.getElementSelector(event.target as Element),
        timestamp: Date.now()
      });
    });

    // Track scrolling
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction({
          type: 'scroll',
          target: 'window',
          timestamp: Date.now(),
          value: {
            scrollY: window.scrollY,
            scrollX: window.scrollX
          }
        });
      }, 100);
    });

    // Track form inputs
    document.addEventListener('input', (event) => {
      this.trackInteraction({
        type: 'input',
        target: this.getElementSelector(event.target as Element),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Collect initial metrics
   */
  private collectInitialMetrics() {
    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      this.metrics.windowLoad = navigation.loadEventEnd - navigation.navigationStart;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
    }

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }

    // Network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.type;
      this.metrics.effectiveType = connection.effectiveType;
      this.metrics.downlink = connection.downlink;
      this.metrics.rtt = connection.rtt;
    }
  }

  /**
   * Track user interaction
   */
  private trackInteraction(interaction: UserInteraction) {
    this.interactions.push(interaction);
    
    // Keep only last 100 interactions
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }

    // Report interaction
    this.reportInteraction(interaction);
  }

  /**
   * Track error
   */
  private trackError(error: ErrorInfo) {
    this.errors.push(error);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Report error immediately
    this.reportError(error);
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(name: string, value: number) {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'rum_metric', {
        metric_name: name,
        metric_value: value,
        session_id: this.sessionId
      });
    }

    // Send to custom analytics endpoint
    this.sendToAnalytics('metrics', { name, value, timestamp: Date.now() });
  }

  /**
   * Report interaction to analytics
   */
  private reportInteraction(interaction: UserInteraction) {
    this.sendToAnalytics('interactions', interaction);
  }

  /**
   * Report error to analytics
   */
  private reportError(error: ErrorInfo) {
    this.sendToAnalytics('errors', error);
  }

  /**
   * Send data to analytics endpoint
   */
  private sendToAnalytics(type: string, data: any) {
    fetch('/api/analytics/rum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Silently fail - analytics shouldn't break the app
    });
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }

  /**
   * Get element selector
   */
  private getElementSelector(element: Element): string {
    if (!element) return 'unknown';
    
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current metrics
   */
  getMetrics(): RUMMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent interactions
   */
  getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  /**
   * Get recent errors
   */
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }
}

// Global RUM monitor instance
export const rumMonitor = new RUMMonitor();

/**
 * Initialize RUM monitoring
 */
export function initializeRUM() {
  if (typeof window === 'undefined') return;

  // Start monitoring in production
  if (process.env.NODE_ENV === 'production') {
    rumMonitor.start();
  }

  console.log('RUM monitoring initialized');
}

// Auto-initialize on import in browser (removed to prevent SSR issues)
// RUM will be initialized manually from components
