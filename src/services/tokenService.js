/**
 * Token Management Service for Auth V2 (Firebase)
 * 
 * This service handles storage, retrieval, and management of Firebase authentication tokens.
 * Firebase tokens have different characteristics than legacy JWT tokens:
 * - ID Token: Short-lived (1 hour), used for authentication
 * - Refresh Token: Long-lived, used to obtain new ID tokens
 * 
 * @module services/tokenService
 */

import { AUTH_V2_CONFIG, shouldRefreshToken, getTokenMetadata } from '../config/auth-v2-config';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import axios from 'axios';
import { logger } from '../utils/env-logger';

// Storage keys for auth v2 tokens
const STORAGE_KEYS = {
  ID_TOKEN: 'authV2_idToken',
  REFRESH_TOKEN: 'authV2_refreshToken',
  TOKEN_ISSUED_AT: 'authV2_tokenIssuedAt',
  USER_ID: 'authV2_userId',
  AUTH_VERSION: 'auth_version', // 'v1' or 'v2'
};

/**
 * Token Service Class
 */
class TokenService {
  constructor() {
    this.refreshPromise = null; // For preventing concurrent refresh requests
  }

  /**
   * Store Firebase tokens in localStorage
   * ✅ FIXED: Now syncs to ALL token keys for backward compatibility
   * This ensures WebSocket and other services can find the token
   *
   * @param {string} idToken - Firebase ID token
   * @param {string} refreshToken - Firebase refresh token
   * @param {string} userId - User ID (Firebase UID)
   */
  storeTokens(idToken, refreshToken, userId = null) {
    try {
      const now = Math.floor(Date.now() / 1000);

      // ✅ Store in Auth V2 keys (primary)
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.TOKEN_ISSUED_AT, now.toString());
      localStorage.setItem(STORAGE_KEYS.AUTH_VERSION, 'v2');

      // ✅ CRITICAL FIX: Also store in legacy keys for backward compatibility
      // This ensures WebSocket, TokenContext, and other services can find the token
      localStorage.setItem('token', idToken);
      localStorage.setItem('auth_token', idToken);

      if (userId) {
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      }

      // Also set cookie for server-side middleware compatibility
      this.setTokenCookie(idToken);

      logger.debug('Auth V2: Tokens stored successfully (synced to all keys)', {
        userId,
        issuedAt: now,
      });
    } catch (error) {
      logger.error('Auth V2: Failed to store tokens', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get Firebase ID token
   * ✅ FIXED: Now checks all possible token locations for backward compatibility
   * Priority: authV2_idToken > token > auth_token
   *
   * @returns {string|null} - ID token or null if not found
   */
  getIdToken() {
    try {
      // Try Auth V2 key first (primary)
      let token = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);

      // ✅ CRITICAL FIX: Fallback to legacy keys for backward compatibility
      if (!token) {
        token = localStorage.getItem('token');
      }
      if (!token) {
        token = localStorage.getItem('auth_token');
      }

      return token;
    } catch (error) {
      logger.error('Auth V2: Failed to get ID token', error);
      return null;
    }
  }

  /**
   * Get Firebase refresh token
   * @returns {string|null} - Refresh token or null if not found
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      logger.error('Auth V2: Failed to get refresh token', error);
      return null;
    }
  }

  /**
   * Get token issued timestamp
   * @returns {number|null} - Unix timestamp or null
   */
  getTokenIssuedAt() {
    try {
      const issuedAt = localStorage.getItem(STORAGE_KEYS.TOKEN_ISSUED_AT);
      return issuedAt ? parseInt(issuedAt, 10) : null;
    } catch (error) {
      logger.error('Auth V2: Failed to get token issued timestamp', error);
      return null;
    }
  }

  /**
   * Get user ID
   * @returns {string|null} - User ID or null
   */
  getUserId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      logger.error('Auth V2: Failed to get user ID', error);
      return null;
    }
  }

  /**
   * Get auth version (v1 or v2)
   * @returns {string} - 'v1' or 'v2'
   */
  getAuthVersion() {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_VERSION) || 'v1';
    } catch (error) {
      return 'v1';
    }
  }

  /**
   * Clear all tokens from storage
   * ✅ FIXED: Now clears ALL token keys including legacy ones
   */
  clearTokens() {
    try {
      // Clear Auth V2 keys
      localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_ISSUED_AT);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.AUTH_VERSION);

      // ✅ CRITICAL FIX: Also clear legacy token keys
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');

      // Clear user data
      localStorage.removeItem('user');
      localStorage.removeItem('uid');
      localStorage.removeItem('email');
      localStorage.removeItem('displayName');
      localStorage.removeItem('photoURL');

      // Clear cookie
      this.clearTokenCookie();

      logger.debug('Auth V2: All tokens and user data cleared successfully');
    } catch (error) {
      logger.error('Auth V2: Failed to clear tokens', error);
    }
  }

  /**
   * Check if ID token is expired or needs refresh
   * @returns {boolean} - True if token needs refresh
   */
  isTokenExpired() {
    const issuedAt = this.getTokenIssuedAt();
    if (!issuedAt) return true;

    const metadata = getTokenMetadata(issuedAt);
    return metadata.isExpired || metadata.needsRefresh;
  }

  /**
   * Get token metadata for monitoring
   * @returns {object} - Token metadata
   */
  getTokenStatus() {
    const issuedAt = this.getTokenIssuedAt();
    const idToken = this.getIdToken();
    const refreshToken = this.getRefreshToken();

    if (!idToken || !refreshToken) {
      return {
        hasTokens: false,
        isExpired: true,
        needsRefresh: true,
      };
    }

    const metadata = getTokenMetadata(issuedAt);
    return {
      hasTokens: true,
      ...metadata,
    };
  }

  /**
   * Refresh authentication token
   * This is the CRITICAL function for handling Firebase 1-hour token expiry
   *
   * RACE CONDITION FIX:
   * - Reuses in-flight refresh promise to prevent concurrent requests
   * - Implements timeout protection (30 seconds max)
   * - Proper cleanup in finally block
   *
   * @returns {Promise<string>} - New ID token
   * @throws {Error} - If refresh fails
   */
  async refreshAuthToken() {
    // CRITICAL: Prevent concurrent refresh requests by reusing in-flight promise
    if (this.refreshPromise) {
      logger.debug('Auth V2: Refresh already in progress, reusing existing promise');
      return this.refreshPromise;
    }

    // Create guarded refresh promise with timeout protection
    this.refreshPromise = (async () => {
      const refreshStartTime = Date.now();

      try {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        logger.debug('Auth V2: Starting token refresh...');

        // Perform refresh with timeout protection
        const result = await this._performTokenRefresh(refreshToken);

        const refreshDuration = Date.now() - refreshStartTime;
        logger.debug(`Auth V2: Token refreshed successfully in ${refreshDuration}ms`);

        return result;
      } catch (error) {
        const refreshDuration = Date.now() - refreshStartTime;
        logger.error(`Auth V2: Token refresh failed after ${refreshDuration}ms`, error);
        throw error;
      } finally {
        // Clear promise after completion or error
        // Small delay to prevent rapid re-attempts on error
        setTimeout(() => {
          this.refreshPromise = null;
        }, 100);
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Perform the actual token refresh API call
   * @private
   */
  async _performTokenRefresh(refreshToken) {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH_V2.REFRESH}`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 seconds timeout
        }
      );

      if (response.data.success && response.data.data) {
        const { idToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Store new tokens
        const userId = this.getUserId();
        this.storeTokens(idToken, newRefreshToken, userId);

        logger.debug('Auth V2: Token refreshed successfully');
        
        return idToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // Refresh token invalid or expired
        logger.error('Auth V2: Refresh token invalid, clearing tokens');
        this.clearTokens();
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  }

  /**
   * Set ID token in cookie for server-side middleware
   * @private
   */
  setTokenCookie(idToken) {
    try {
      // Set httpOnly cookie if possible (requires server-side)
      // For client-side, we use standard cookie
      const maxAge = AUTH_V2_CONFIG.tokenExpiry; // 1 hour in seconds
      document.cookie = `token=${idToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch (error) {
      logger.warn('Auth V2: Failed to set token cookie', error);
    }
  }

  /**
   * Clear token cookie
   * @private
   */
  clearTokenCookie() {
    try {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch (error) {
      logger.warn('Auth V2: Failed to clear token cookie', error);
    }
  }

  /**
   * Detect token format to determine auth version
   * @param {string} token - Token to check
   * @returns {string} - 'v1' or 'v2'
   */
  detectTokenFormat(token) {
    if (!token) return 'v1';

    try {
      // Firebase tokens are longer and have different structure
      // Firebase JWT format: header.payload.signature with specific claims
      const parts = token.split('.');
      if (parts.length !== 3) return 'v1';

      // Decode payload (base64)
      const payload = JSON.parse(atob(parts[1]));
      
      // Firebase tokens have 'iss' field with securetoken.google.com
      if (payload.iss && payload.iss.includes('securetoken.google.com')) {
        return 'v2';
      }

      return 'v1';
    } catch (error) {
      logger.warn('Auth V2: Failed to detect token format', error);
      return 'v1';
    }
  }

  /**
   * Migrate from v1 token to v2 tokens
   * This clears v1 token and prepares for v2 authentication
   */
  migrateFromV1() {
    try {
      // Clear old v1 token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      logger.debug('Auth V2: Cleared v1 tokens for migration');
    } catch (error) {
      logger.error('Auth V2: Failed to migrate from v1', error);
    }
  }
}

// Create and export singleton instance
const tokenService = new TokenService();
export default tokenService;

// Named exports for specific functions
export const {
  storeTokens,
  getIdToken,
  getRefreshToken,
  clearTokens,
  isTokenExpired,
  refreshAuthToken,
  getTokenStatus,
  getAuthVersion,
  detectTokenFormat,
} = tokenService;
