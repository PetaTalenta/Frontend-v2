/**
 * Auth V2 Migration Configuration
 * 
 * This module provides runtime configuration for the auth v2 migration.
 * It handles feature flags, rollout percentages, and environment-specific settings.
 * 
 * @module config/auth-v2-config
 */

/**
 * Auth V2 Configuration Object
 */
export const AUTH_V2_CONFIG = {
  /**
   * Feature flag: Enable/disable Auth V2
   * @type {boolean}
   */
  enabled: process.env.NEXT_PUBLIC_USE_AUTH_V2 === 'true',

  /**
   * Auth V2 API base URL (via API Gateway)
   * Always use API Gateway URL, NOT direct service URL
   * @type {string}
   */
  baseUrl: process.env.NEXT_PUBLIC_AUTH_V2_BASE_URL || 'https://api.futureguide.id/api/auth/v2',

  /**
   * Rollout percentage (0-100)
   * Used for gradual rollout of auth v2 to users
   * @type {number}
   */
  rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE || '0', 10),

  /**
   * Token expiry time in seconds (Firebase default: 3600 = 1 hour)
   * @type {number}
   */
  tokenExpiry: parseInt(process.env.NEXT_PUBLIC_AUTH_V2_TOKEN_EXPIRY || '3600', 10),

  /**
   * Refresh token before this many seconds remain before expiry
   * Default: 600 seconds (10 minutes) before expiry
   * @type {number}
   */
  refreshBeforeExpiry: parseInt(process.env.NEXT_PUBLIC_AUTH_V2_REFRESH_BEFORE_EXPIRY || '600', 10),
};

/**
 * Check if auth v2 should be used for the current request
 * This function implements the rollout logic based on percentage
 * 
 * @param {string} userId - Optional user ID for consistent rollout
 * @returns {boolean} - True if auth v2 should be used
 */
export function shouldUseAuthV2(userId = null) {
  // If feature flag is disabled, never use auth v2
  if (!AUTH_V2_CONFIG.enabled) {
    return false;
  }

  // If rollout is 100%, always use auth v2
  if (AUTH_V2_CONFIG.rolloutPercentage >= 100) {
    return true;
  }

  // If rollout is 0%, never use auth v2
  if (AUTH_V2_CONFIG.rolloutPercentage <= 0) {
    return false;
  }

  // For gradual rollout, use deterministic selection based on userId
  // or random selection if no userId provided
  if (userId) {
    // Hash-based deterministic selection (consistent for same userId)
    const hash = simpleHash(userId);
    return (hash % 100) < AUTH_V2_CONFIG.rolloutPercentage;
  } else {
    // Random selection for new/anonymous users
    return Math.random() * 100 < AUTH_V2_CONFIG.rolloutPercentage;
  }
}

/**
 * Simple hash function for deterministic user selection
 * @param {string} str - String to hash
 * @returns {number} - Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get the appropriate auth endpoint based on current configuration
 * @param {string} authVersion - 'v1' or 'v2'
 * @returns {string} - Base URL for auth endpoints
 */
export function getAuthBaseUrl(authVersion = null) {
  // If specific version requested, return that
  if (authVersion === 'v2') {
    return AUTH_V2_CONFIG.baseUrl;
  }
  if (authVersion === 'v1') {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id'}/api/auth`;
  }

  // Otherwise, check if we should use v2
  const useV2 = shouldUseAuthV2();
  return useV2 ? AUTH_V2_CONFIG.baseUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id'}/api/auth`;
}

/**
 * Check if a token needs to be refreshed based on its age
 * @param {number} tokenIssuedAt - Token issued timestamp (in seconds)
 * @returns {boolean} - True if token should be refreshed
 */
export function shouldRefreshToken(tokenIssuedAt) {
  if (!tokenIssuedAt) return true;

  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - tokenIssuedAt;
  const timeUntilExpiry = AUTH_V2_CONFIG.tokenExpiry - tokenAge;

  // Refresh if less than refreshBeforeExpiry seconds remain
  return timeUntilExpiry <= AUTH_V2_CONFIG.refreshBeforeExpiry;
}

/**
 * Get token metadata for monitoring
 * @param {number} tokenIssuedAt - Token issued timestamp (in seconds)
 * @returns {object} - Token metadata
 */
export function getTokenMetadata(tokenIssuedAt) {
  if (!tokenIssuedAt) {
    return {
      isExpired: true,
      needsRefresh: true,
      age: null,
      timeUntilExpiry: null,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - tokenIssuedAt;
  const timeUntilExpiry = AUTH_V2_CONFIG.tokenExpiry - tokenAge;
  const isExpired = timeUntilExpiry <= 0;
  const needsRefresh = timeUntilExpiry <= AUTH_V2_CONFIG.refreshBeforeExpiry;

  return {
    isExpired,
    needsRefresh,
    age: tokenAge,
    timeUntilExpiry: Math.max(0, timeUntilExpiry),
  };
}

/**
 * Log auth v2 configuration (for debugging)
 */
export function logAuthV2Config() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Auth V2 Configuration:', {
      enabled: AUTH_V2_CONFIG.enabled,
      baseUrl: AUTH_V2_CONFIG.baseUrl,
      rolloutPercentage: AUTH_V2_CONFIG.rolloutPercentage,
      tokenExpiry: `${AUTH_V2_CONFIG.tokenExpiry}s`,
      refreshBeforeExpiry: `${AUTH_V2_CONFIG.refreshBeforeExpiry}s`,
    });
  }
}

// Export default config
export default AUTH_V2_CONFIG;
