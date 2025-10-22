/**
 * Token Validation Utility - Token validation and auto-refresh
 *
 * ✅ PHASE 6 CONSOLIDATION: Kept as specialized utility for token validation
 * This module handles token validation and auto-refresh before critical operations.
 *
 * Key Features:
 * - Validates token expiry before critical operations
 * - Auto-refreshes expired or soon-to-expire tokens
 * - Handles both Auth V1 and Auth V2
 * - Provides clear error messages
 * - Prevents authentication errors during assessment submission
 *
 * Usage:
 * ```typescript
 * // Ensure valid token before critical operation
 * const token = await ensureValidToken();
 *
 * // Validate without refresh
 * const result = validateToken();
 * if (!result.isValid) {
 *   // Handle invalid token
 * }
 * ```
 *
 * @module utils/token-validation
 * @see tokenService untuk token management
 */

import tokenService from '../services/tokenService';

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  token: string | null;
  error?: string;
  wasRefreshed?: boolean;
}

/**
 * Ensure we have a valid, non-expired token
 * 
 * This function:
 * 1. Checks if token exists
 * 2. Validates token expiry (for Auth V2)
 * 3. Auto-refreshes if expired or expiring soon (within 5 minutes)
 * 4. Returns valid token or throws error
 * 
 * @param forceRefresh - Force token refresh even if not expired
 * @returns Promise<string> - Valid token
 * @throws Error if token is invalid or refresh fails
 */
export async function ensureValidToken(forceRefresh: boolean = false): Promise<string> {
  console.log('[TokenValidation] Ensuring valid token...', { forceRefresh });

  // Get auth version
  const authVersion = tokenService.getAuthVersion();
  console.log('[TokenValidation] Auth version:', authVersion);

  if (authVersion === 'v2') {
    // Auth V2: Check token status and refresh if needed
    const status = tokenService.getTokenStatus() as any;
    
    console.log('[TokenValidation] Token status:', {
      hasTokens: status.hasTokens,
      isExpired: status.isExpired,
      needsRefresh: status.needsRefresh,
      timeUntilExpiry: status.timeUntilExpiry ? `${Math.floor(status.timeUntilExpiry / 60)} minutes` : 'N/A'
    });

    if (!status.hasTokens) {
      throw new Error('No authentication token found. Please login again.');
    }

    if (status.isExpired) {
      console.warn('[TokenValidation] Token is expired, attempting refresh...');
      try {
        const newToken = await tokenService.refreshAuthToken();
        console.log('[TokenValidation] ✅ Token refreshed successfully after expiry');
        return newToken;
      } catch (error) {
        console.error('[TokenValidation] ❌ Token refresh failed:', error);
        throw new Error('Session expired. Please login again.');
      }
    }

    // Refresh if token will expire soon (within 5 minutes) or force refresh requested
    const shouldRefresh = forceRefresh || status.needsRefresh || (status.timeUntilExpiry && status.timeUntilExpiry < 300);
    
    if (shouldRefresh) {
      console.log('[TokenValidation] Token needs refresh (expiring soon or forced), attempting...');
      try {
        const newToken = await tokenService.refreshAuthToken();
        console.log('[TokenValidation] ✅ Token refreshed successfully (preventive)');
        return newToken;
      } catch (error) {
        console.error('[TokenValidation] ⚠️ Preventive refresh failed, using existing token:', error);
        // If preventive refresh fails, still use existing token if not expired
        const token = tokenService.getIdToken();
        if (token) {
          return token;
        }
        throw new Error('Failed to refresh token. Please login again.');
      }
    }

    // Token is valid and fresh
    const token = tokenService.getIdToken();
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    console.log('[TokenValidation] ✅ Token is valid and fresh');
    return token;

  } else {
    // Auth V1: Simple token retrieval (no expiry check)
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('[TokenValidation] ✅ Auth V1 token retrieved');
    return token;
  }
}

/**
 * Validate token without auto-refresh
 * 
 * @returns TokenValidationResult
 */
export function validateToken(): TokenValidationResult {
  const authVersion = tokenService.getAuthVersion();

  if (authVersion === 'v2') {
    const status = tokenService.getTokenStatus() as any;
    
    if (!status.hasTokens) {
      return {
        isValid: false,
        token: null,
        error: 'No authentication token found'
      };
    }

    if (status.isExpired) {
      return {
        isValid: false,
        token: tokenService.getIdToken(),
        error: 'Token is expired'
      };
    }

    return {
      isValid: true,
      token: tokenService.getIdToken()
    };

  } else {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    if (!token) {
      return {
        isValid: false,
        token: null,
        error: 'No authentication token found'
      };
    }

    return {
      isValid: true,
      token
    };
  }
}

/**
 * Check if token needs refresh (Auth V2 only)
 * 
 * @returns boolean
 */
export function shouldRefreshToken(): boolean {
  const authVersion = tokenService.getAuthVersion();
  
  if (authVersion !== 'v2') {
    return false;
  }

  const status = tokenService.getTokenStatus() as any;
  
  // Refresh if expired or expiring within 5 minutes
  return status.isExpired || status.needsRefresh || (status.timeUntilExpiry && status.timeUntilExpiry < 300);
}

/**
 * Get token info for debugging
 * 
 * @returns Object with token information
 */
export function getTokenInfo(): {
  authVersion: string;
  hasToken: boolean;
  isExpired?: boolean;
  timeUntilExpiry?: number;
  needsRefresh?: boolean;
} {
  const authVersion = tokenService.getAuthVersion();
  
  if (authVersion === 'v2') {
    const status = tokenService.getTokenStatus() as any;
    return {
      authVersion,
      hasToken: status.hasTokens,
      isExpired: status.isExpired,
      timeUntilExpiry: status.timeUntilExpiry,
      needsRefresh: status.needsRefresh
    };
  } else {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return {
      authVersion,
      hasToken: !!token
    };
  }
}

