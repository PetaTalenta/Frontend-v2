/**
 * WebSocket Configuration
 * Centralized configuration for WebSocket connections
 */

export const WEBSOCKET_CONFIG = {
  // WebSocket is now mandatory for real-time assessment monitoring
  MANDATORY: true,
  
  // Connection settings
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000, // 1 second
  
  // Monitoring settings
  MONITORING_TIMEOUT: 120000, // 2 minutes for assessment completion
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  
  // URLs
  PRODUCTION_URL: 'https://api.chhrone.web.id',
  DEVELOPMENT_URL: 'http://localhost:3001',
  
  // Fallback settings
  ALLOW_POLLING_FALLBACK: true, // Allow polling only in extreme cases
  POLLING_WARNING: true, // Show warning when falling back to polling
  
  // Performance settings
  MAX_CONCURRENT_CONNECTIONS: 1,
  BUFFER_SIZE: 1024,
  
  // Error handling
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Feature flags
  ENABLE_COMPRESSION: true,
  ENABLE_BINARY_TRANSPORT: false,
  ENABLE_HEARTBEAT: true,
};

/**
 * Get WebSocket URL based on environment
 */
export function getWebSocketUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? WEBSOCKET_CONFIG.PRODUCTION_URL
    : WEBSOCKET_CONFIG.DEVELOPMENT_URL;
}

/**
 * Check if WebSocket is mandatory
 */
export function isWebSocketMandatory(): boolean {
  return WEBSOCKET_CONFIG.MANDATORY;
}

/**
 * Check if polling fallback is allowed
 */
export function isPollingFallbackAllowed(): boolean {
  return WEBSOCKET_CONFIG.ALLOW_POLLING_FALLBACK;
}

/**
 * Get connection timeout
 */
export function getConnectionTimeout(): number {
  return WEBSOCKET_CONFIG.CONNECTION_TIMEOUT;
}

/**
 * Get monitoring timeout
 */
export function getMonitoringTimeout(): number {
  return WEBSOCKET_CONFIG.MONITORING_TIMEOUT;
}
