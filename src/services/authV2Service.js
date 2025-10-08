/**
 * Auth V2 Service - Firebase-based Authentication
 * 
 * This service provides authentication methods using the new Firebase-based auth-v2 backend.
 * All methods use /api/auth/v2/* endpoints via API Gateway.
 * 
 * Key differences from v1:
 * - Uses Firebase JWT tokens (1-hour expiry)
 * - Requires refresh token mechanism
 * - Limited profile update capabilities
 * - Password reset via email OOB codes
 * 
 * @module services/authV2Service
 */

import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import tokenService from './tokenService';
import { logger } from '../utils/env-logger';

/**
 * Auth V2 Service Class
 */
class AuthV2Service {
  constructor() {
    // Create axios instance with auth v2 configuration
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 15000, // 15 seconds (shorter timeout for faster failure detection)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ✅ CRITICAL FIX #1: Track active requests with AbortControllers for cancellation on logout
    this._activeRequests = new Map(); // requestId -> { controller: AbortController, metadata: {...} }

    // Add request interceptor to include Firebase ID token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // ✅ CRITICAL FIX #1: Create AbortController for this request
        const controller = new AbortController();
        const requestId = `authv2-req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Attach AbortController signal to request
        config.signal = controller.signal;

        const idToken = tokenService.getIdToken();
        const userId = tokenService.getUserId(); // ✅ Get userId for validation

        // ✅ CRITICAL FIX #6: Validate both token and userId exist
        if (idToken && userId) {
          config.headers.Authorization = `Bearer ${idToken}`;
          logger.debug('Auth V2: Adding Firebase ID token to request');
        } else {
          logger.warn('Auth V2: No ID token or userId found');
          delete config.headers.Authorization;
        }

        // Add metadata
        config.metadata = {
          requestId,
          timestamp: new Date().toISOString(),
          userId,
          hasAuth: !!config.headers.Authorization
        };

        // ✅ CRITICAL FIX #1: Track this request for potential cancellation
        this._activeRequests.set(requestId, {
          controller,
          metadata: config.metadata,
          url: config.url,
          method: config.method
        });

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // ✅ CRITICAL FIX #1: Remove from active requests on success
        const requestId = response.config.metadata?.requestId;
        if (requestId && this._activeRequests.has(requestId)) {
          this._activeRequests.delete(requestId);
          logger.debug(`Auth V2 Response [${requestId}]: Completed successfully`);
        }
        return response;
      },
      (error) => {
        // ✅ CRITICAL FIX #1: Remove from active requests on error
        const requestId = error.config?.metadata?.requestId;
        if (requestId && this._activeRequests.has(requestId)) {
          this._activeRequests.delete(requestId);

          // Check if error is due to abort
          if (error.code === 'ERR_CANCELED' || error.message?.includes('abort')) {
            logger.debug(`Auth V2 Request [${requestId}]: Aborted by user`);
          } else {
            logger.debug(`Auth V2 Response [${requestId}]: Failed`);
          }
        }

        logger.error('Auth V2 API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * ✅ CRITICAL FIX #1: Abort all active requests
   * Called on logout to prevent cross-user data leakage
   */
  abortAllRequests() {
    const count = this._activeRequests.size;

    if (count === 0) {
      logger.debug('[authV2Service] No active requests to abort');
      return;
    }

    logger.warn(`[authV2Service] Aborting ${count} active requests...`);

    this._activeRequests.forEach((requestInfo, requestId) => {
      try {
        requestInfo.controller.abort();
        logger.debug(`[authV2Service] Aborted request [${requestId}]: ${requestInfo.method?.toUpperCase()} ${requestInfo.url}`);
      } catch (error) {
        logger.error(`[authV2Service] Failed to abort request [${requestId}]:`, error);
      }
    });

    this._activeRequests.clear();
    logger.warn(`✅ [authV2Service] All ${count} active requests aborted`);
  }

  /**
   * Login user with email and password
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login response with tokens and user data
   * 
   * Response format:
   * {
   *   uid: string,
   *   email: string,
   *   displayName: string,
   *   photoURL: string,
   *   idToken: string,
   *   refreshToken: string,
   *   expiresIn: string
   * }
   */
  async login(email, password) {
    try {
      logger.debug('Auth V2: Login attempt for', email);

      const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH_V2.LOGIN, {
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.data.success && response.data.data) {
        const { idToken, refreshToken, uid, email: userEmail, displayName, photoURL } = response.data.data;

        // Store tokens
        tokenService.storeTokens(idToken, refreshToken, uid);

        logger.debug('Auth V2: Login successful for', userEmail);

        return response.data.data;
      }

      throw new Error('Invalid login response');
    } catch (error) {
      logger.error('Auth V2: Login failed', error);
      throw this._handleError(error);
    }
  }

  /**
   * Register new user
   * 
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} [userData.displayName] - Display name (optional)
   * @param {string} [userData.photoURL] - Photo URL (optional)
   * @returns {Promise<Object>} - Registration response with tokens and user data
   * 
   * Response format: Same as login
   */
  async register({ email, password, displayName = null, photoURL = null }) {
    try {
      logger.debug('Auth V2: Register attempt for', email);

      const requestBody = {
        email: email.toLowerCase().trim(),
        password,
      };

      // Add optional fields if provided
      if (displayName) requestBody.displayName = displayName.trim();
      if (photoURL) requestBody.photoURL = photoURL.trim();

      const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH_V2.REGISTER, requestBody);

      if (response.data.success && response.data.data) {
        const { idToken, refreshToken, uid, email: userEmail, displayName: userName, photoURL: userPhoto } = response.data.data;

        // Store tokens
        tokenService.storeTokens(idToken, refreshToken, uid);

        logger.debug('Auth V2: Registration successful for', userEmail);

        return response.data.data;
      }

      throw new Error('Invalid registration response');
    } catch (error) {
      logger.error('Auth V2: Registration failed', error);
      throw this._handleError(error);
    }
  }

  /**
   * Refresh authentication token
   * 
   * @param {string} [refreshToken] - Refresh token (optional, uses stored token if not provided)
   * @returns {Promise<Object>} - New tokens
   * 
   * Response format:
   * {
   *   idToken: string,
   *   refreshToken: string,
   *   expiresIn: string
   * }
   */
  async refreshToken(refreshToken = null) {
    try {
      const token = refreshToken || tokenService.getRefreshToken();

      if (!token) {
        throw new Error('No refresh token available');
      }

      logger.debug('Auth V2: Refreshing token');

      const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH_V2.REFRESH, {
        refreshToken: token,
      });

      if (response.data.success && response.data.data) {
        const { idToken, refreshToken: newRefreshToken } = response.data.data;

        // Store new tokens
        const userId = tokenService.getUserId();
        tokenService.storeTokens(idToken, newRefreshToken, userId);

        logger.debug('Auth V2: Token refresh successful');

        return response.data.data;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      logger.error('Auth V2: Token refresh failed', error);
      
      // If refresh fails, clear tokens (session expired)
      if (error.response?.status === 401) {
        tokenService.clearTokens();
      }
      
      throw this._handleError(error);
    }
  }

  /**
   * Send password reset email
   * 
   * @param {string} email - User email
   * @returns {Promise<Object>} - Success response
   * 
   * Response format:
   * {
   *   message: string
   * }
   */
  async forgotPassword(email) {
    try {
      logger.debug('Auth V2: Password reset request for', email);

      const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH_V2.FORGOT_PASSWORD, {
        email: email.toLowerCase().trim(),
      });

      if (response.data.success) {
        logger.debug('Auth V2: Password reset email sent to', email);
        return response.data;
      }

      throw new Error('Failed to send password reset email');
    } catch (error) {
      logger.error('Auth V2: Forgot password failed', error);
      throw this._handleError(error);
    }
  }

  /**
   * Reset password with OOB code from email
   * 
   * @param {string} oobCode - Out-of-band code from email link
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Success response
   * 
   * Response format:
   * {
   *   message: string
   * }
   */
  async resetPassword(oobCode, newPassword) {
    try {
      logger.debug('Auth V2: Password reset with OOB code');

      const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH_V2.RESET_PASSWORD, {
        oobCode,
        newPassword,
      });

      if (response.data.success) {
        logger.debug('Auth V2: Password reset successful');
        return response.data;
      }

      throw new Error('Failed to reset password');
    } catch (error) {
      logger.error('Auth V2: Password reset failed', error);
      throw this._handleError(error);
    }
  }

  /**
   * Logout user (revoke refresh tokens)
   * 
   * @param {string} [refreshToken] - Refresh token (optional, uses stored token if not provided)
   * @returns {Promise<void>}
   */
  async logout(refreshToken = null) {
    try {
      const token = refreshToken || tokenService.getRefreshToken();

      logger.debug('Auth V2: Logout attempt');

      // Call logout endpoint to revoke tokens
      if (token) {
        await this.axiosInstance.post(API_ENDPOINTS.AUTH_V2.LOGOUT, {
          refreshToken: token,
        });
      }

      // Clear local tokens regardless of API response
      tokenService.clearTokens();

      logger.debug('Auth V2: Logout successful');
    } catch (error) {
      logger.warn('Auth V2: Logout API call failed, clearing tokens anyway', error);
      
      // Always clear tokens, even if API call fails
      tokenService.clearTokens();
    }
  }

  /**
   * Update user profile (limited to displayName and photoURL only)
   * 
   * NOTE: Firebase auth v2 only supports updating displayName and photoURL.
   * Other profile fields (bio, phone, etc.) must be updated via separate user service.
   * 
   * @param {Object} profileData - Profile update data
   * @param {string} [profileData.displayName] - Display name
   * @param {string} [profileData.photoURL] - Photo URL
   * @returns {Promise<Object>} - Updated profile data
   * 
   * Response format:
   * {
   *   uid: string,
   *   email: string,
   *   displayName: string,
   *   photoURL: string
   * }
   */
  async updateProfile({ displayName = null, photoURL = null }) {
    try {
      logger.debug('Auth V2: Update profile attempt');

      const requestBody = {};
      if (displayName !== null) requestBody.displayName = displayName.trim();
      if (photoURL !== null) requestBody.photoURL = photoURL.trim();

      if (Object.keys(requestBody).length === 0) {
        throw new Error('No profile fields to update');
      }

      const response = await this.axiosInstance.patch(API_ENDPOINTS.AUTH_V2.PROFILE, requestBody);

      if (response.data.success && response.data.data) {
        logger.debug('Auth V2: Profile update successful');
        return response.data.data;
      }

      throw new Error('Failed to update profile');
    } catch (error) {
      logger.error('Auth V2: Profile update failed', error);
      throw this._handleError(error);
    }
  }

  /**
   * Delete user account (requires password confirmation)
   * 
   * @param {string} password - Current password for confirmation
   * @returns {Promise<void>}
   */
  async deleteAccount(password) {
    try {
      logger.debug('Auth V2: Delete account attempt');

      await this.axiosInstance.delete(API_ENDPOINTS.AUTH_V2.DELETE_USER, {
        data: { password },
      });

      // Clear tokens after successful deletion
      tokenService.clearTokens();

      logger.debug('Auth V2: Account deleted successfully');
    } catch (error) {
      logger.error('Auth V2: Account deletion failed', error);
      throw this._handleError(error);
    }
  }

  /**
   * Check service health
   * 
   * @returns {Promise<Object>} - Health status
   */
  async checkHealth() {
    try {
      const response = await this.axiosInstance.get(API_ENDPOINTS.AUTH_V2.HEALTH);
      return response.data;
    } catch (error) {
      logger.error('Auth V2: Health check failed', error);
      throw error;
    }
  }

  /**
   * Handle and format API errors
   * @private
   */
  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      
      // ✅ PRIORITY FIX: Extract the most specific error message
      // Priority order:
      // 1. error.error.message (most specific, e.g., "Invalid email or password")
      // 2. error.message (generic fallback, e.g., "Operation failed")
      // 3. Default message
      const specificMessage = error.response.data?.error?.message;
      const genericMessage = error.response.data?.message;
      const message = specificMessage || genericMessage || 'API request failed';

      // Extract error code from nested error object if available
      const errorCode = error.response.data?.error?.code || error.response.data?.code;

      // Create structured error
      const apiError = new Error(message);
      apiError.status = status;
      apiError.code = errorCode;
      apiError.details = error.response.data;

      return apiError;
    }

    if (error.request) {
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.status = 0;
      networkError.code = 'NETWORK_ERROR';
      return networkError;
    }

    return error;
  }
}

// Create and export singleton instance
const authV2Service = new AuthV2Service();
export default authV2Service;

// Named exports for convenience
export const {
  login,
  register,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  updateProfile,
  deleteAccount,
  checkHealth,
} = authV2Service;
