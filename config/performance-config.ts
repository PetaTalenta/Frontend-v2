/**
 * Performance Configuration
 * Centralized configuration for optimizing application performance
 */

export const PERFORMANCE_CONFIG = {
  // API Performance Settings
  API: {
    // Reduced timeouts for faster failure detection
    DEFAULT_TIMEOUT: 15000, // 15 seconds (reduced from 30s)
    ASSESSMENT_TIMEOUT: 20000, // 20 seconds for assessment APIs
    HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds for health checks
    
    // Retry settings
    MAX_RETRIES: 2, // Reduced from 3
    RETRY_DELAY: 500, // 0.5 seconds (reduced from 1s)
    
    // Request optimization
    CONCURRENT_REQUESTS: 6, // Max concurrent requests
    REQUEST_DEBOUNCE: 300, // 300ms debounce for rapid requests
  },

  // WebSocket Performance Settings
  WEBSOCKET: {
    // Connection timeouts
    CONNECTION_TIMEOUT: 5000, // 5 seconds (reduced from 10s)
    AUTHENTICATION_TIMEOUT: 8000, // 8 seconds (reduced from 15s)
    RECONNECTION_DELAY: 500, // 0.5 seconds (reduced from 1s)
    
    // Monitoring settings
    MONITORING_TIMEOUT: 60000, // 1 minute (reduced from 2 minutes)
    HEARTBEAT_INTERVAL: 20000, // 20 seconds (reduced from 30s)
    PING_INTERVAL: 8000, // 8 seconds (reduced from 10s)
    
    // Reconnection settings
    MAX_RECONNECTION_ATTEMPTS: 3,
    RECONNECTION_DELAY_MAX: 1000, // 1 second max delay
    RANDOMIZATION_FACTOR: 0.2, // Reduce randomization for predictable timing
  },

  // Polling Performance Settings
  POLLING: {
    // Optimized polling intervals
    INITIAL_DELAY: 300, // 300ms (reduced from 800ms)
    MAX_DELAY: 1000, // 1 second (reduced from 2s)
    BACKOFF_MULTIPLIER: 1.05, // Slower backoff (reduced from 1.1)
    MAX_ATTEMPTS: 60, // More attempts with faster intervals
    
    // Status check optimization
    STATUS_CHECK_INTERVAL: 500, // 500ms for status checks
    PROGRESS_UPDATE_THROTTLE: 200, // 200ms throttle for progress updates
  },

  // Assessment Workflow Performance
  ASSESSMENT: {
    // Workflow timeouts
    SUBMISSION_TIMEOUT: 300000, // 5 minutes (reduced from 10 minutes)
    VALIDATION_TIMEOUT: 5000, // 5 seconds for validation
    
    // Progress monitoring
    PROGRESS_CHECK_INTERVAL: 1000, // 1 second for progress checks
    STATUS_UPDATE_DEBOUNCE: 300, // 300ms debounce for status updates
    
    // Loading estimates (more realistic)
    ESTIMATED_TIMES: {
      validating: 1, // 1 second
      submitting: 2, // 2 seconds
      queued: 5, // 5 seconds
      processing: 20, // 20 seconds
      generating: 10, // 10 seconds
    },
  },

  // Dashboard Performance Settings
  DASHBOARD: {
    // Data loading optimization
    PARALLEL_LOADING: true, // Enable parallel API calls
    CACHE_DURATION: 300000, // 5 minutes cache
    REFRESH_THRESHOLD: 20000, // 20 seconds (reduced from 30s)
    
    // Auto-refresh settings
    AUTO_REFRESH_INTERVAL: 60000, // 1 minute
    FOCUS_REFRESH_DELAY: 1000, // 1 second delay after focus
    
    // UI optimization
    RENDER_DEBOUNCE: 100, // 100ms debounce for re-renders
    ANIMATION_DURATION: 200, // 200ms for animations
  },

  // Cache Performance Settings
  CACHE: {
    // SWR optimization
    DEDUPING_INTERVAL: 1000, // 1 second (reduced from 2s)
    FOCUS_THROTTLE_INTERVAL: 3000, // 3 seconds (reduced from 5s)
    LOADING_TIMEOUT: 8000, // 8 seconds (reduced from 10s)
    
    // Error retry optimization
    ERROR_RETRY_COUNT: 2, // Reduced from 3
    ERROR_RETRY_INTERVAL: 2000, // 2 seconds (reduced from 5s)
    
    // Cache strategies
    STALE_TIME: 300000, // 5 minutes
    CACHE_TIME: 600000, // 10 minutes
  },

  // Network Performance Settings
  NETWORK: {
    // Connection optimization
    DNS_PREFETCH_DOMAINS: [
      'https://api.chhrone.web.id',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    
    // Resource hints
    PRECONNECT_DOMAINS: [
      'https://api.chhrone.web.id',
    ],
    
    // Request optimization
    KEEP_ALIVE: true,
    CONNECTION_POOL_SIZE: 10,
  },

  // UI Performance Settings
  UI: {
    // Rendering optimization
    VIRTUAL_SCROLLING_THRESHOLD: 100, // Enable virtual scrolling for 100+ items
    LAZY_LOADING_THRESHOLD: 500, // 500px before viewport
    
    // Animation optimization
    REDUCED_MOTION_THRESHOLD: 200, // Reduce animations for slow devices
    FRAME_BUDGET: 16, // 16ms per frame (60fps)
    
    // Interaction optimization
    CLICK_DEBOUNCE: 300, // 300ms debounce for clicks
    INPUT_DEBOUNCE: 300, // 300ms debounce for inputs
  },

  // Monitoring and Metrics
  MONITORING: {
    // Performance tracking
    TRACK_PERFORMANCE: true,
    PERFORMANCE_BUDGET: {
      FCP: 2000, // First Contentful Paint: 2 seconds
      LCP: 3000, // Largest Contentful Paint: 3 seconds
      FID: 100, // First Input Delay: 100ms
      CLS: 0.1, // Cumulative Layout Shift: 0.1
    },
    
    // Error tracking
    TRACK_ERRORS: true,
    ERROR_SAMPLING_RATE: 0.1, // 10% sampling
    
    // Analytics
    TRACK_USER_TIMING: true,
    CUSTOM_METRICS: true,
  },

  // Feature Flags for Performance
  FEATURES: {
    // Experimental optimizations
    ENABLE_SERVICE_WORKER: true,
    ENABLE_PREFETCHING: true,
    ENABLE_COMPRESSION: true,
    ENABLE_CACHING: true,
    
    // Progressive enhancement
    ENABLE_OFFLINE_MODE: false, // Disabled for now
    ENABLE_BACKGROUND_SYNC: false, // Disabled for now
  },
} as const;

// Helper functions for performance optimization
export const getOptimizedTimeout = (operation: keyof typeof PERFORMANCE_CONFIG.API) => {
  return PERFORMANCE_CONFIG.API[operation] || PERFORMANCE_CONFIG.API.DEFAULT_TIMEOUT;
};

export const getPollingConfig = () => {
  return PERFORMANCE_CONFIG.POLLING;
};

export const getWebSocketConfig = () => {
  return PERFORMANCE_CONFIG.WEBSOCKET;
};

export const getAssessmentConfig = () => {
  return PERFORMANCE_CONFIG.ASSESSMENT;
};

export const getDashboardConfig = () => {
  return PERFORMANCE_CONFIG.DASHBOARD;
};

// Performance monitoring helpers
export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  if (!PERFORMANCE_CONFIG.MONITORING.TRACK_PERFORMANCE) {
    return fn();
  }

  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    // Report to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
      });
    }
  });
};

export default PERFORMANCE_CONFIG;
