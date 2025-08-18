/**
 * Ultra-Fast Assessment Configuration
 * Optimized specifically for fastest possible assessment response times
 */

export const ULTRA_FAST_ASSESSMENT_CONFIG = {
  // WebSocket Configuration - Optimized for AI processing
  WEBSOCKET: {
    CONNECTION_TIMEOUT: 3000, // 3 seconds for connection
    MONITORING_TIMEOUT: 240000, // 4 minutes for AI processing
    HEARTBEAT_INTERVAL: 10000, // 10 seconds heartbeat
    RECONNECTION_DELAY: 200, // 200ms reconnection
    MAX_RECONNECTION_ATTEMPTS: 5,
  },

  // Polling Configuration - Ultra-aggressive polling
  POLLING: {
    INITIAL_DELAY: 50, // 50ms initial delay
    PROCESSING_DELAY: 100, // 100ms during processing
    QUEUED_DELAY: 200, // 200ms for queued
    COMPLETED_CHECK_DELAY: 50, // 50ms for completion checks
    MAX_DELAY: 300, // 300ms maximum delay
    MAX_ATTEMPTS: 300, // 5 minutes worth of attempts
    BACKOFF_MULTIPLIER: 1.01, // Minimal backoff
    SMART_POLLING: true,
  },

  // API Configuration - Optimized timeouts
  API: {
    SUBMISSION_TIMEOUT: 10000, // 10 seconds for submission
    STATUS_CHECK_TIMEOUT: 5000, // 5 seconds for status checks
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 100, // 100ms retry delay
  },

  // Assessment Workflow - Optimized for speed
  WORKFLOW: {
    VALIDATION_TIMEOUT: 2000, // 2 seconds validation
    SUBMISSION_TIMEOUT: 240000, // 4 minutes total timeout
    PROGRESS_UPDATE_INTERVAL: 100, // 100ms progress updates
    STATUS_CHECK_INTERVAL: 50, // 50ms status checks
  },

  // Performance Monitoring
  MONITORING: {
    TRACK_RESPONSE_TIMES: true,
    LOG_SLOW_REQUESTS: true,
    SLOW_REQUEST_THRESHOLD: 1000, // 1 second
    ENABLE_PERFORMANCE_METRICS: true,
  },

  // Optimization Flags
  OPTIMIZATIONS: {
    ENABLE_REQUEST_COMPRESSION: true,
    ENABLE_RESPONSE_CACHING: false, // Disable for real-time data
    ENABLE_PARALLEL_MONITORING: true,
    ENABLE_ADAPTIVE_POLLING: true,
    ENABLE_EARLY_COMPLETION_DETECTION: true,
  },
};

/**
 * Get optimized polling configuration based on assessment status
 */
export function getOptimizedPollingDelay(status: string, consecutiveCount: number = 0): number {
  const config = ULTRA_FAST_ASSESSMENT_CONFIG.POLLING;
  
  switch (status) {
    case 'processing':
      // Ultra-fast polling during active processing
      return config.PROCESSING_DELAY;
    
    case 'queued':
      // Moderate polling for queued items
      return config.QUEUED_DELAY;
    
    case 'completed':
      // Immediate check for completed items
      return config.COMPLETED_CHECK_DELAY;
    
    default:
      // Adaptive delay based on consecutive attempts
      const adaptiveDelay = config.INITIAL_DELAY * Math.pow(config.BACKOFF_MULTIPLIER, consecutiveCount);
      return Math.min(adaptiveDelay, config.MAX_DELAY);
  }
}

/**
 * Check if request should be considered slow
 */
export function isSlowRequest(responseTime: number): boolean {
  return responseTime > ULTRA_FAST_ASSESSMENT_CONFIG.MONITORING.SLOW_REQUEST_THRESHOLD;
}

/**
 * Get WebSocket timeout based on operation
 */
export function getWebSocketTimeout(operation: 'connection' | 'monitoring'): number {
  const config = ULTRA_FAST_ASSESSMENT_CONFIG.WEBSOCKET;
  return operation === 'connection' ? config.CONNECTION_TIMEOUT : config.MONITORING_TIMEOUT;
}

/**
 * Get API timeout based on operation
 */
export function getAPITimeout(operation: 'submission' | 'status_check'): number {
  const config = ULTRA_FAST_ASSESSMENT_CONFIG.API;
  return operation === 'submission' ? config.SUBMISSION_TIMEOUT : config.STATUS_CHECK_TIMEOUT;
}

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  startTimer: (operation: string) => {
    if (ULTRA_FAST_ASSESSMENT_CONFIG.MONITORING.TRACK_RESPONSE_TIMES) {
      console.time(`[PERF] ${operation}`);
    }
  },

  endTimer: (operation: string) => {
    if (ULTRA_FAST_ASSESSMENT_CONFIG.MONITORING.TRACK_RESPONSE_TIMES) {
      console.timeEnd(`[PERF] ${operation}`);
    }
  },

  logSlowRequest: (operation: string, responseTime: number) => {
    if (ULTRA_FAST_ASSESSMENT_CONFIG.MONITORING.LOG_SLOW_REQUESTS && isSlowRequest(responseTime)) {
      console.warn(`[PERF] Slow request detected: ${operation} took ${responseTime}ms`);
    }
  },

  logMetric: (metric: string, value: number) => {
    if (ULTRA_FAST_ASSESSMENT_CONFIG.MONITORING.ENABLE_PERFORMANCE_METRICS) {
      console.log(`[METRIC] ${metric}: ${value}`);
    }
  },
};

export default ULTRA_FAST_ASSESSMENT_CONFIG;
