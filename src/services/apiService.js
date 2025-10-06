import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { getToken, clearAuth } from '../utils/token-storage';
import { logger } from '../utils/env-logger';

/**
 * API Service for handling all API calls
 * Provides centralized methods for interacting with the backend
 */
class ApiService {
  constructor() {
    // Configure axios with base URL
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Allow host apps to register side-effect handlers (e.g., redirect on 401)
    this.handlers = {
      onAuthError: (error) => {
        // default: no redirect, only clear auth
        clearAuth();
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    // Add request interceptor to include auth token (supports both V1 and V2)
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // Try to get Auth V2 token first (if user is using V2)
          const tokenService = (await import('./tokenService')).default;
          const authVersion = tokenService.getAuthVersion();

          if (authVersion === 'v2') {
            // Auth V2: Use Firebase ID token
            const idToken = tokenService.getIdToken();
            if (idToken) {
              config.headers.Authorization = `Bearer ${idToken}`;
              logger.debug('API Request: add Auth V2 Firebase token');
            } else {
              logger.warn('API Request: no Auth V2 token found');
            }
          } else {
            // Auth V1: Use legacy JWT token
            const token = getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              logger.debug('API Request: add Auth V1 bearer token');
            } else {
              logger.warn('API Request: no auth token');
            }
          }
        } catch (error) {
          // Fallback to V1 token if tokenService not available
          logger.debug('API Request: falling back to Auth V1 token');
          const token = getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('API Request Interceptor Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling with auto token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      async (error) => {
        // Log detailed error information (compact in production)
        logger.error('API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method,
          message: error.message
        });

        const status = error.response?.status;
        const originalRequest = error.config;

        // CRITICAL: Handle 401 Unauthorized with auto token refresh (for Auth V2)
        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Mark to prevent infinite loops

          try {
            // Dynamic import to avoid circular dependency
            const tokenService = (await import('./tokenService')).default;
            const authVersion = tokenService.getAuthVersion();

            // Only attempt auto-refresh for Auth V2 users
            if (authVersion === 'v2') {
              logger.debug('API: 401 detected, attempting token refresh for Auth V2...');

              // Attempt to refresh token
              const newIdToken = await tokenService.refreshAuthToken();

              // Update the Authorization header with new token
              originalRequest.headers.Authorization = `Bearer ${newIdToken}`;

              // Retry the original request with new token
              logger.debug('API: Token refreshed, retrying original request');
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            logger.error('API: Token refresh failed, clearing session', refreshError);

            // Token refresh failed - clear tokens and trigger auth error handler
            try {
              const tokenService = (await import('./tokenService')).default;
              tokenService.clearTokens();
            } catch (e) {
              // Ignore cleanup errors
            }

            // Delegate to auth error handler (e.g., redirect to login)
            try { this.handlers.onAuthError?.(error); } catch (_) {}

            return Promise.reject(error);
          }

          // For Auth V1 users, just trigger auth error handler
          try { this.handlers.onAuthError?.(error); } catch (_) {}
        } else if (status === 402) {
          logger.error('Insufficient token balance for API request');
        } else if (status === 404) {
          logger.warn('API endpoint not found:', error.config?.url);
        } else if (status >= 500) {
          logger.error('Server error:', status);
        } else if (error?.code === 'NETWORK_ERROR' || !error.response) {
          logger.error('Network error - API might be unreachable');
        }

        return Promise.reject(error);
      }
    );

      // In-flight requests map and a tiny TTL cache to dedupe rapid duplicate calls (e.g., React StrictMode re-mounts)
      this._inflight = new Map();
      this._cache = new Map();

  }

  // Allow host app to set side-effect handlers (e.g., redirect on 401)
  setAuthHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

	  // Build a stable request key for deduplication
	  _requestKey(url, options = {}) {
	    const method = (options.method || 'GET').toUpperCase();
	    let bodyKey = '';
	    try {
	      if (options.body) {
	        bodyKey = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
	      }
	    } catch (_) {
	      bodyKey = '';
	    }
	    return `${method}|${url}|${bodyKey}`;
	  }

	  /**
	   * Fetch with in-flight deduplication and tiny TTL cache
	   * Prevents duplicate requests on StrictMode re-mounts and fast route transitions
	   * @param {string} url
	   * @param {RequestInit} options
	   * @param {number} ttlMs - cache TTL in milliseconds
	   */
	  async _fetchWithDedupe(url, options = {}, ttlMs = 1000) {
	    const key = this._requestKey(url, options);
	    const now = Date.now();

	    // Return cached result if still fresh
	    const cached = this._cache.get(key);
	    if (cached && (now - cached.time) < ttlMs) {
	      return cached.data;
	    }

	    // Share the same in-flight promise
	    if (this._inflight.has(key)) {
	      return this._inflight.get(key);
	    }

	    const p = (async () => {
	      const resp = await fetch(url, options);
	      if (!resp.ok) {
	        let message = `Request failed: ${resp.status}`;
	        try {
	          const errJson = await resp.clone().json();
	          if (errJson?.message) message = errJson.message;
	        } catch (_) {}
	        const err = new Error(message);
	        err.status = resp.status;
	        throw err;
	      }
	      const data = await resp.json();
	      this._cache.set(key, { time: Date.now(), data });
	      return data;
	    })();

	    this._inflight.set(key, p);
	    try {
	      return await p;
	    } finally {
	      this._inflight.delete(key);
	    }
	  }



  // ==================== GATEWAY INFO ====================

  /**
   * Get API Gateway information
   */
  async getGatewayInfo() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.GATEWAY_INFO);
    return response.data;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   */
  async register(userData) {
    const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   */
  async login(credentials) {
    const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  }

  /**
   * Get user profile
   * Note: AUTH_V2 does not support GET profile endpoint
   * Profile data should be obtained from login/register response or Firebase SDK
   */
  async getProfile() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.AUTH_V2.PROFILE);
    return response.data;
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * Note: AUTH_V2 uses PATCH method and only supports displayName & photoURL
   */
  async updateProfile(profileData) {
    const response = await this.axiosInstance.patch(API_ENDPOINTS.AUTH_V2.PROFILE, profileData);
    return response.data;
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   */
  async changePassword(passwordData) {
    const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout() {
    const response = await this.axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  }

  /**
   * Get user token balance
   */
  async getTokenBalance() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.AUTH.TOKEN_BALANCE);
    return response.data;
  }


  // ==================== SCHOOLS ====================

  async getSchools() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.AUTH.SCHOOLS);
    return response.data;
  }

  async getSchoolsByLocation({ location, province } = {}) {
    const response = await this.axiosInstance.get(API_ENDPOINTS.AUTH.SCHOOLS_BY_LOCATION, {
      params: {
        ...(location ? { location } : {}),
        ...(province ? { province } : {}),
      },
    });
    return response.data;
  }

  async validateSchoolId(schoolId) {
    try {
      const resp = await this.getSchools();
      return !!(resp.success && Array.isArray(resp.data) && resp.data.some(s => s.id === Number(schoolId)));
    } catch (_) {
      return false;
    }
  }

  // ==================== ASSESSMENTS ====================

  /**
   * CONSOLIDATED: Assessment submission using the new consolidated service
   * @param {Object} assessmentData - Assessment data
   * @param {Object} assessmentData.riasec - RIASEC scores
   * @param {Object} assessmentData.ocean - Big Five (OCEAN) scores
   * @param {Object} assessmentData.viaIs - VIA Character Strengths scores
   * @param {string} assessmentName - Assessment type name
   * @param {Function} onTokenBalanceUpdate - Token balance update callback
   */
  async submitAssessment(assessmentData, assessmentName = 'AI-Driven Talent Mapping', onTokenBalanceUpdate) {
    const { assessmentService } = await import('./assessment-service');
    return await assessmentService.submitAssessment(assessmentData, assessmentName, {
      onTokenBalanceUpdate
    });
  }

  /**
   * Check assessment processing status
   * @param {string} jobId - Assessment job ID
   */
  async getAssessmentStatus(jobId) {
    const { assessmentService } = await import('./assessment-service');
    return await assessmentService.getAssessmentStatus(jobId);
  }

  /**
   * CONSOLIDATED: Unified submission with intelligent monitoring
   * Automatically chooses best monitoring method (WebSocket preferred, polling fallback)
   * @param {Object} assessmentData - Assessment data
   * @param {string} assessmentName - Assessment type name
   * @param {Function} onProgress - Progress callback
   * @param {Function} onTokenBalanceUpdate - Token balance update callback
   */
  async submitAssessmentWithMonitoring(assessmentData, assessmentName = 'AI-Driven Talent Mapping', onProgress, onTokenBalanceUpdate) {
    const { assessmentService } = await import('./assessment-service');
    return assessmentService.submitAssessment(assessmentData, assessmentName, {
      onProgress,
      onTokenBalanceUpdate,
      preferWebSocket: true,
    });
  }

  async submitAssessmentFromAnswers(answers, assessmentName = 'AI-Driven Talent Mapping', onProgress, onTokenBalanceUpdate) {
    // Use consolidated submission via proxy endpoints with WebSocket-first monitoring
    return this.processAssessmentUnified(answers, assessmentName, { onProgress, onTokenBalanceUpdate, preferWebSocket: true });
  }

  async processAssessmentUnified(answers, assessmentName = 'AI-Driven Talent Mapping', options = {}) {
    // Use consolidated assessment-service directly
    const { assessmentService } = await import('./assessment-service');
    return assessmentService.submitFromAnswers(answers, assessmentName, options);
  }

  async getAssessmentServiceStatus() {
    const { assessmentService } = await import('./assessment-service');
    return {
      isHealthy: await assessmentService.isHealthy(),
      stats: assessmentService.getStats(),
      recommendations: ['Use the consolidated assessment service for better performance'],
    };
  }

  async submitAssessmentWithWebSocket(assessmentData, assessmentName, onProgress, onTokenBalanceUpdate) {
    return this.submitAssessmentWithMonitoring(assessmentData, assessmentName, onProgress, onTokenBalanceUpdate);
  }

  async submitAssessmentWithPolling(assessmentData, assessmentName, onProgress) {
    return this.submitAssessmentWithMonitoring(assessmentData, assessmentName, onProgress);
  }

  async getAssessmentQueueStatus() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.ASSESSMENT.QUEUE_STATUS);
    return response.data;
  }

  /**
   * Check assessment service health
   */
  async checkAssessmentHealth() {
    try {
      const { assessmentService } = await import('./assessment-service');
      return await assessmentService.isHealthy();
    } catch (error) {
      // Fallback to direct API call
      const response = await this.axiosInstance.get(API_ENDPOINTS.ASSESSMENT.HEALTH);
      return response.data;
    }
  }

  // ==================== CHAT ====================

  /**
   * Start a new chat conversation with assessment context
   * @param {Object} data - Conversation data
   * @param {string} data.resultId - Assessment result ID
   * @param {Object} data.assessmentContext - Assessment result context
   */
  async startChatConversation(data) {
    const { startConversation } = await import('./helpers/chat');
    return startConversation(this.axiosInstance, API_ENDPOINTS, data);
  }

  /**
   * Send a message in chat conversation
   * @param {Object} data - Message data
   * @param {string} data.conversationId - Conversation ID
   * @param {string} data.resultId - Assessment result ID
   * @param {string} data.message - User message
   */
  async sendChatMessage(data) {
    const { sendMessage } = await import('./helpers/chat');
    return sendMessage(this.axiosInstance, API_ENDPOINTS, data);
  }

  /**
   * Test chatbot API health
   */
  async testChatbotHealth() {
    try {
      const response = await this.axiosInstance.get(API_ENDPOINTS.CHATBOT.HEALTH);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: error.message }
      };
    }
  }

  /**
   * Get chat conversation by result ID
   * @param {string} resultId - Assessment result ID
   */
  async getChatConversation(resultId) {
    const { getConversation } = await import('./helpers/chat');
    return getConversation(this.axiosInstance, API_ENDPOINTS, resultId);
  }

  /**
   * Get all conversations for the authenticated user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.context - Filter by context
   */
  async getChatConversations(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.context) queryParams.append('context', params.context);

      const url = `${API_ENDPOINTS.CHATBOT.GET_CONVERSATIONS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.axiosInstance.get(url);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
    } catch (error) {
      logger.warn('Failed to get conversations from real API');
    }

    // Return empty result for fallback
    return {
      success: true,
      data: {
        conversations: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalConversations: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    };
  }

  /**
   * Update conversation details
   * @param {string} conversationId - Conversation ID
   * @param {Object} data - Update data
   * @param {string} data.title - New title
   * @param {string} data.status - New status
   */
  async updateChatConversation(conversationId, data) {
    try {
      const response = await this.axiosInstance.put(API_ENDPOINTS.CHATBOT.GET_CONVERSATION(conversationId), data);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
    } catch (error) {
      logger.warn('Failed to update conversation');
    }

    return {
      success: false,
      error: { message: 'Failed to update conversation' }
    };
  }

  // ==================== ARCHIVE ====================

  /**
   * Get user's analysis jobs with pagination (align with new API docs)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status: 'queued' | 'processing' | 'completed' | 'failed'
   * @param {string} params.assessment_name - Filter by assessment name
   * @param {string} params.sort - Sort field (default: 'created_at')
   * @param {string} params.order - Sort order (default: 'DESC')
   */
  async getJobs(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.status) queryParams.append('status', String(params.status));
    if (params.assessment_name) queryParams.append('assessment_name', String(params.assessment_name));
    if (params.sort) queryParams.append('sort', String(params.sort));
    if (params.order) queryParams.append('order', String(params.order));

    // Call archive jobs endpoint
    const url = `${API_ENDPOINTS.ARCHIVE.JOBS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  /**
   * Get single job detail by ID (may include result reference)
   */
  async getJobById(jobId) {
    const url = API_ENDPOINTS.ARCHIVE.JOB_BY_ID(jobId);
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  /**
   * Get user's analysis results with pagination (legacy; still used by Results page)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.jobId - Filter by job ID
   */
  async getResults(params = {}) {
    // Sanitize params to avoid 400 (Bad Request) from backend: allow only supported keys and cap limit
    const allowed = {};
    if (params.page) allowed.page = String(params.page);
    if (params.limit) {
      const lim = Number(params.limit);
      allowed.limit = String(Math.min(isNaN(lim) ? 50 : lim, 100));
    }
    if (params.status) allowed.status = String(params.status);
    if (params.jobId) allowed.jobId = String(params.jobId);
    // Some backends expect job_id instead of jobId
    if (params.job_id && !allowed.jobId) allowed.job_id = String(params.job_id);

    const response = await this.axiosInstance.get(API_ENDPOINTS.ARCHIVE.RESULTS, {
      params: allowed,
    });
    return response.data;
  }

  /**
   * Get specific analysis result
   * @param {string} resultId - Result ID
   */
  async getResultById(resultId) {
    const response = await this.axiosInstance.get(API_ENDPOINTS.ARCHIVE.RESULT_BY_ID(resultId));
    const resp = response.data;
    try {
      if (resp?.success && resp?.data && typeof resp.data === 'object') {
        const d = resp.data;
        const hasAssessmentData = d.assessment_data && (d.assessment_data.riasec || d.assessment_data.ocean || d.assessment_data.viaIs);
        const hasTestData = d.test_data && (d.test_data.riasec || d.test_data.ocean || d.test_data.viaIs);
        const normalized = { ...d };
        if (!hasAssessmentData && hasTestData) {
          normalized.assessment_data = { ...d.test_data };
          if (!normalized.assessment_data.assessmentName && d.assessment_name) {
            normalized.assessment_data.assessmentName = d.assessment_name;
          }
        }
        if (!d.persona_profile && d.test_result) {
          normalized.persona_profile = d.test_result;
        }
        return { ...resp, data: normalized };
      }
    } catch (_) {}
    return resp;
  }

  /**
   * Retry assessment using a previous failed or completed resultId
   * @param {string} resultId - UUID of previous analysis result owned by the user
   */
  async retryAssessment(resultId) {
    try {
      const response = await this.axiosInstance.post(API_ENDPOINTS.ASSESSMENT.RETRY, { resultId });
      return response.data;
    } catch (error) {
      // Normalize error response
      return {
        success: false,
        error: error.response?.data || { message: error.message }
      };
    }
  }

  /**
   * Retry assessment by jobId (required by backend validation)
   * @param {string} jobId - Job ID from archive/jobs
   */
  async retryAssessmentByJob(jobId) {
    console.log('🔄 ApiService: Retrying assessment by jobId:', jobId);
    
    if (!jobId) {
      console.error('❌ ApiService: No jobId provided for retry');
      throw new Error('Job ID is required for retry');
    }

    try {
      const response = await this.axiosInstance.post(API_ENDPOINTS.ASSESSMENT.RETRY, {
        jobId: jobId
      });
      
      console.log('✅ ApiService: Retry response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ApiService: Retry failed:', error.response?.data || error.message);
      
      // Re-throw dengan informasi lebih detail
      if (error.response?.data) {
        throw new Error(error.response.data.error?.message || error.response.data.message || 'Retry failed');
      }
      throw error;
    }
  }

  /**
   * Find jobId associated with a resultId by scanning recent jobs
   * Returns jobId or null if not found
   */
  async findJobIdByResultId(resultId) {
    try {
      // Fetch recent jobs (one or two pages for practicality)
      const limit = 100;
      const first = await this.getJobs({ page: 1, limit, sort: 'created_at', order: 'DESC' });
      const jobs1 = first?.success && Array.isArray(first.data?.jobs) ? first.data.jobs : [];

      const pickJobId = (job) => {
        const rId = job?.result_id || job?.resultId || job?.result_uuid || job?.result?.id;
        if (rId && String(rId) === String(resultId)) {
          return job?.id || job?.job_id || null;
        }
        return null;
      };

      for (const j of jobs1) {
        const id = pickJobId(j);
        if (id) return id;
      }

      // Optionally, try second page if backend indicates more
      const hasMore = !!(first?.data?.pagination?.hasMore || first?.data?.hasMore);
      if (hasMore) {
        const second = await this.getJobs({ page: 2, limit, sort: 'created_at', order: 'DESC' });
        const jobs2 = second?.success && Array.isArray(second.data?.jobs) ? second.data.jobs : [];
        for (const j of jobs2) {
          const id = pickJobId(j);
          if (id) return id;
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Update analysis result
   * @param {string} resultId - Result ID
   * @param {Object} updateData - Update data
   */
  async updateResult(resultId, updateData) {
    const response = await this.axiosInstance.put(API_ENDPOINTS.ARCHIVE.UPDATE_RESULT(resultId), updateData);
    return response.data;
  }

  /**
   * Delete analysis result
   * @param {string} resultId - Result ID
   */
  async deleteResult(resultId) {
    const response = await this.axiosInstance.delete(API_ENDPOINTS.ARCHIVE.DELETE_RESULT(resultId));
    return response.data;
  }

  /**
   * Delete analysis job (fallback when no result exists)
   * @param {string} jobId - Job ID
   */
  async deleteJob(jobId) {
    const response = await this.axiosInstance.delete(API_ENDPOINTS.ARCHIVE.DELETE_JOB(jobId));
    return response.data;
  }

  /**
   * Toggle assessment result public visibility
   * @param {string} resultId
   * @param {boolean} isPublic
   */
  async setResultPublic(resultId, isPublic) {
    const response = await this.axiosInstance.patch(`/api/archive/results/${resultId}/public`, { is_public: isPublic });
    return response.data;
  }

  /**
   * Get user statistics
   */
  async getStats() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.ARCHIVE.STATS);
    return response.data;
  }

  /**
   * Get user overview statistics
   */
  async getStatsOverview() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.ARCHIVE.STATS_OVERVIEW);
    return response.data;
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Comprehensive health check of all services
   */
  async getHealthStatus() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH.MAIN);
    return response.data;
  }

  /**
   * Simple liveness probe
   */
  async getLivenessStatus() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH.LIVE);
    return response.data;
  }

  /**
   * Readiness probe
   */
  async getReadinessStatus() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH.READY);
    return response.data;
  }

  /**
   * Extended health information
   */
  async getDetailedHealthStatus() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH.DETAILED);
    return response.data;
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
export { apiService };
