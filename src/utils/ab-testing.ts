/**
 * A/B Testing Framework for Performance Improvements
 * Comprehensive system for testing performance optimizations
 */

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // Percentage of users to include in test
  startDate: Date;
  endDate?: Date;
  targetMetrics: string[];
  segmentationRules?: SegmentationRule[];
  isActive: boolean;
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // Percentage of test traffic
  config: Record<string, any>;
  isControl: boolean;
}

interface SegmentationRule {
  type: 'device' | 'browser' | 'location' | 'custom';
  operator: 'equals' | 'contains' | 'in' | 'not_in';
  value: string | string[];
}

interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  metrics: Record<string, number>;
  timestamp: number;
  userAgent: string;
  location?: string;
}

interface ABTestAnalytics {
  testId: string;
  variantResults: VariantAnalytics[];
  statisticalSignificance: number;
  confidenceLevel: number;
  winner?: string;
  recommendation: string;
}

interface VariantAnalytics {
  variantId: string;
  sampleSize: number;
  conversionRate: number;
  averageMetrics: Record<string, number>;
  standardDeviation: Record<string, number>;
  confidenceInterval: Record<string, [number, number]>;
}

class ABTestingFramework {
  private tests: Map<string, ABTestConfig> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private results: ABTestResult[] = [];
  private isInitialized = false;

  /**
   * Initialize A/B testing framework
   */
  async initialize() {
    if (this.isInitialized) return;

    await this.loadTestConfigurations();
    this.setupEventTracking();
    this.isInitialized = true;

    console.log('A/B Testing framework initialized');
  }

  /**
   * Load test configurations from server
   */
  private async loadTestConfigurations() {
    try {
      const response = await fetch('/api/ab-tests/config');
      const configs: ABTestConfig[] = await response.json();
      
      configs.forEach(config => {
        this.tests.set(config.id, config);
      });
    } catch (error) {
      console.error('Failed to load A/B test configurations:', error);
    }
  }

  /**
   * Get variant for user in a specific test
   */
  getVariant(testId: string, userId: string): string | null {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) return null;

    // Check if test is within date range
    const now = new Date();
    if (now < test.startDate || (test.endDate && now > test.endDate)) {
      return null;
    }

    // Check if user is already assigned
    const userTests = this.userAssignments.get(userId);
    if (userTests?.has(testId)) {
      return userTests.get(testId)!;
    }

    // Check if user should be included in test
    if (!this.shouldIncludeUser(test, userId)) {
      return null;
    }

    // Assign user to variant
    const variantId = this.assignUserToVariant(test, userId);
    
    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(testId, variantId);

    // Track assignment
    this.trackAssignment(testId, variantId, userId);

    return variantId;
  }

  /**
   * Check if user should be included in test
   */
  private shouldIncludeUser(test: ABTestConfig, userId: string): boolean {
    // Check traffic allocation
    const userHash = this.hashUserId(userId);
    const trafficThreshold = test.trafficAllocation / 100;
    
    if (userHash > trafficThreshold) {
      return false;
    }

    // Check segmentation rules
    if (test.segmentationRules) {
      return this.evaluateSegmentationRules(test.segmentationRules, userId);
    }

    return true;
  }

  /**
   * Assign user to variant based on allocation
   */
  private assignUserToVariant(test: ABTestConfig, userId: string): string {
    const userHash = this.hashUserId(userId + test.id);
    let cumulativeAllocation = 0;

    for (const variant of test.variants) {
      cumulativeAllocation += variant.allocation;
      if (userHash <= cumulativeAllocation / 100) {
        return variant.id;
      }
    }

    // Fallback to control variant
    return test.variants.find(v => v.isControl)?.id || test.variants[0].id;
  }

  /**
   * Hash user ID for consistent assignment
   */
  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Evaluate segmentation rules
   */
  private evaluateSegmentationRules(rules: SegmentationRule[], userId: string): boolean {
    return rules.every(rule => {
      switch (rule.type) {
        case 'device':
          return this.evaluateDeviceRule(rule);
        case 'browser':
          return this.evaluateBrowserRule(rule);
        case 'location':
          return this.evaluateLocationRule(rule);
        case 'custom':
          return this.evaluateCustomRule(rule, userId);
        default:
          return true;
      }
    });
  }

  /**
   * Evaluate device-based rule
   */
  private evaluateDeviceRule(rule: SegmentationRule): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const value = (rule.value as string).toLowerCase();

    switch (rule.operator) {
      case 'contains':
        return userAgent.includes(value);
      case 'equals':
        return userAgent === value;
      default:
        return true;
    }
  }

  /**
   * Evaluate browser-based rule
   */
  private evaluateBrowserRule(rule: SegmentationRule): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const browsers = Array.isArray(rule.value) ? rule.value : [rule.value];

    const browserMatch = browsers.some(browser => 
      userAgent.includes(browser.toLowerCase())
    );

    return rule.operator === 'in' ? browserMatch : !browserMatch;
  }

  /**
   * Evaluate location-based rule
   */
  private evaluateLocationRule(rule: SegmentationRule): boolean {
    // This would typically use geolocation or IP-based location
    // For now, use timezone as approximation
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locations = Array.isArray(rule.value) ? rule.value : [rule.value];

    const locationMatch = locations.some(location => 
      timezone.includes(location)
    );

    return rule.operator === 'in' ? locationMatch : !locationMatch;
  }

  /**
   * Evaluate custom rule
   */
  private evaluateCustomRule(rule: SegmentationRule, userId: string): boolean {
    // Custom logic based on user properties
    // This would be extended based on specific needs
    return true;
  }

  /**
   * Track test assignment
   */
  private trackAssignment(testId: string, variantId: string, userId: string) {
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_assignment', {
        test_id: testId,
        variant_id: variantId,
        user_id: userId
      });
    }

    // Send to custom analytics
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'assignment',
        testId,
        variantId,
        userId,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Silently fail
    });
  }

  /**
   * Track test result/conversion
   */
  trackResult(testId: string, userId: string, metrics: Record<string, number>) {
    const userTests = this.userAssignments.get(userId);
    const variantId = userTests?.get(testId);

    if (!variantId) return;

    const result: ABTestResult = {
      testId,
      variantId,
      userId,
      sessionId: this.getSessionId(),
      metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      location: this.getUserLocation()
    };

    this.results.push(result);

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_result', {
        test_id: testId,
        variant_id: variantId,
        user_id: userId,
        ...metrics
      });
    }

    // Send to server
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'result',
        ...result
      })
    }).catch(() => {
      // Silently fail
    });
  }

  /**
   * Setup event tracking for automatic metric collection
   */
  private setupEventTracking() {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          ttfb: navigation.responseStart - navigation.requestStart
        };

        // Track for all active tests
        this.tests.forEach((test, testId) => {
          if (test.isActive && test.targetMetrics.some(m => Object.keys(metrics).includes(m))) {
            this.trackResult(testId, this.getUserId(), metrics);
          }
        });
      }
    });

    // Track Core Web Vitals
    this.setupWebVitalsTracking();
  }

  /**
   * Setup Web Vitals tracking
   */
  private setupWebVitalsTracking() {
    // Track LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.tests.forEach((test, testId) => {
        if (test.isActive && test.targetMetrics.includes('lcp')) {
          this.trackResult(testId, this.getUserId(), { lcp: lastEntry.startTime });
        }
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Track FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        
        this.tests.forEach((test, testId) => {
          if (test.isActive && test.targetMetrics.includes('fid')) {
            this.trackResult(testId, this.getUserId(), { fid });
          }
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Track CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      this.tests.forEach((test, testId) => {
        if (test.isActive && test.targetMetrics.includes('cls')) {
          this.trackResult(testId, this.getUserId(), { cls: clsValue });
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Get user ID (from auth context or generate)
   */
  private getUserId(): string {
    // This would typically come from auth context
    let userId = localStorage.getItem('ab_test_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ab_test_user_id', userId);
    }
    return userId;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('ab_test_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ab_test_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get user location (approximation)
   */
  private getUserLocation(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Get test configuration
   */
  getTestConfig(testId: string): ABTestConfig | undefined {
    return this.tests.get(testId);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTestConfig[] {
    return Array.from(this.tests.values()).filter(test => test.isActive);
  }

  /**
   * Get user's current assignments
   */
  getUserAssignments(userId: string): Map<string, string> {
    return this.userAssignments.get(userId) || new Map();
  }
}

// Global A/B testing framework instance
export const abTestingFramework = new ABTestingFramework();

/**
 * Initialize A/B testing
 */
export async function initializeABTesting() {
  if (typeof window === 'undefined') return;

  await abTestingFramework.initialize();
  console.log('A/B Testing framework initialized');
}

/**
 * Get variant for a test
 */
export function getTestVariant(testId: string, userId?: string): string | null {
  const user = userId || abTestingFramework['getUserId']();
  return abTestingFramework.getVariant(testId, user);
}

/**
 * Track A/B test result
 */
export function trackTestResult(testId: string, metrics: Record<string, number>, userId?: string) {
  const user = userId || abTestingFramework['getUserId']();
  abTestingFramework.trackResult(testId, user, metrics);
}

// Auto-initialize on import in browser (removed to prevent SSR issues)
// A/B Testing will be initialized manually from components
