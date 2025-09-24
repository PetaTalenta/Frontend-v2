/**
 * Performance Configuration
 * Centralized configuration for optimizing application performance
 */

export const PERFORMANCE_CONFIG = {
  // API Performance Settings - Optimized for speed
  API: {
    // Aggressive timeouts for faster processing
    DEFAULT_TIMEOUT: 12000, // 12 seconds (further reduced)
    ASSESSMENT_TIMEOUT: 15000, // 15 seconds for assessment APIs (reduced from 20s)
    HEALTH_CHECK_TIMEOUT: 3000, // 3 seconds for health checks (reduced from 5s)

    // Streamlined retry settings
    MAX_RETRIES: 1, // Reduced to 1 for faster failure detection
    RETRY_DELAY: 300, // 300ms base delay (reduced from 500ms)

    // Enhanced request optimization
    CONCURRENT_REQUESTS: 8, // Increased concurrent requests
    REQUEST_DEBOUNCE: 200, // 200ms debounce (reduced from 300ms)

    // New: Streamlined mode settings
    STREAMLINED: {
      TIMEOUT: 10000, // 10 seconds for streamlined requests
      MAX_RETRIES: 0, // No retries in streamlined mode for speed
      VALIDATION_TIMEOUT: 500, // 500ms for validation
      PROCESSING_DELAY: 200, // Minimal processing delay
    },
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

  // Polling Performance Settings - Optimized for responsiveness
  POLLING: {
    // Aggressive polling intervals for faster updates
    INITIAL_DELAY: 200, // 200ms (reduced from 300ms)
    MAX_DELAY: 800, // 800ms (reduced from 1s)
    BACKOFF_MULTIPLIER: 1.03, // Minimal backoff for consistent speed
    MAX_ATTEMPTS: 80, // More attempts with faster intervals

    // Enhanced status check optimization
    STATUS_CHECK_INTERVAL: 300, // 300ms for status checks (reduced from 500ms)

    // New: Streamlined polling settings
    STREAMLINED: {
      INITIAL_DELAY: 100, // 100ms for streamlined polling
      MAX_DELAY: 500, // 500ms max delay
      INTERVAL: 200, // 200ms consistent interval
      MAX_ATTEMPTS: 100, // More attempts for reliability
    },
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
      'https://api.futureguide.id',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    
    // Resource hints
    PRECONNECT_DOMAINS: [
      'https://api.futureguide.id',
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
