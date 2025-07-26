import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

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

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          // Redirect to auth page
          window.location.href = '/auth';
        } else if (error.response?.status === 402) {
          // Payment required - insufficient token balance
          console.error('Insufficient token balance for API request');
          // You can add custom handling here, like showing a modal or notification
        }
        return Promise.reject(error);
      }
    );
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
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   */
  async register(userData) {
    // Use enhanced authentication service
    const { registerUser } = await import('./enhanced-auth-api');
    return await registerUser(userData);
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   */
  async login(credentials) {
    // Use enhanced authentication service
    const { loginUser } = await import('./enhanced-auth-api');
    return await loginUser(credentials);
  }

  /**
   * Get user profile
   */
  async getProfile() {
    const response = await this.axiosInstance.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   */
  async updateProfile(profileData) {
    const response = await this.axiosInstance.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
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
    // Use enhanced authentication service
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: { message: 'No authentication token found' }
      };
    }

    const { getTokenBalance } = await import('./enhanced-auth-api');
    return await getTokenBalance(token);
  }

  // ==================== ASSESSMENTS ====================

  /**
   * Submit assessment data for AI analysis
   * @param {Object} assessmentData - Assessment data
   * @param {Object} assessmentData.riasec - RIASEC scores
   * @param {Object} assessmentData.ocean - Big Five (OCEAN) scores
   * @param {Object} assessmentData.viaIs - VIA Character Strengths scores
   * @param {string} assessmentName - Assessment type name
   */
  async submitAssessment(assessmentData, assessmentName = 'AI-Driven Talent Mapping') {
    // Use enhanced assessment API for better error handling and fallback
    try {
      const { submitAssessment } = await import('./enhanced-assessment-api');
      return await submitAssessment(assessmentData, assessmentName);
    } catch (error) {
      // Fallback to direct API call
      const response = await this.axiosInstance.post(API_ENDPOINTS.ASSESSMENT.SUBMIT, {
        assessmentName,
        ...assessmentData
      });
      return response.data;
    }
  }

  /**
   * Check assessment processing status
   * @param {string} jobId - Assessment job ID
   */
  async getAssessmentStatus(jobId) {
    try {
      const { getAssessmentStatus } = await import('./enhanced-assessment-api');
      return await getAssessmentStatus(jobId);
    } catch (error) {
      // Fallback to direct API call
      const response = await this.axiosInstance.get(API_ENDPOINTS.ASSESSMENT.STATUS(jobId));
      return response.data;
    }
  }

  /**
   * Submit assessment with polling for completion
   * @param {Object} assessmentData - Assessment data
   * @param {string} assessmentName - Assessment type name
   * @param {Function} onProgress - Progress callback
   */
  async submitAssessmentWithPolling(assessmentData, assessmentName = 'AI-Driven Talent Mapping', onProgress) {
    const { submitAssessmentWithPolling } = await import('./enhanced-assessment-api');
    return await submitAssessmentWithPolling(assessmentData, assessmentName, onProgress);
  }

  /**
   * Get assessment queue status
   */
  async getAssessmentQueueStatus() {
    try {
      const { getQueueStatus } = await import('./enhanced-assessment-api');
      return await getQueueStatus();
    } catch (error) {
      // Fallback to direct API call
      const response = await this.axiosInstance.get(API_ENDPOINTS.ASSESSMENT.QUEUE_STATUS);
      return response.data;
    }
  }

  /**
   * Check assessment service health
   */
  async checkAssessmentHealth() {
    try {
      const { checkAssessmentHealth } = await import('./enhanced-assessment-api');
      return await checkAssessmentHealth();
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
    try {
      // Try the real chatbot API first
      const response = await this.axiosInstance.post(API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT, {
        assessment_id: data.resultId,
        conversation_type: 'career_guidance',
        include_suggestions: true
      });

      if (response.data.success) {
        // Transform the response to match our expected structure
        const apiData = response.data.data;
        return {
          success: true,
          data: {
            id: apiData.conversationId,
            resultId: data.resultId,
            messages: apiData.personalizedWelcome ? [
              {
                id: apiData.personalizedWelcome.messageId,
                role: 'assistant',
                content: apiData.personalizedWelcome.content,
                timestamp: apiData.personalizedWelcome.timestamp,
                resultId: data.resultId
              }
            ] : [],
            createdAt: apiData.createdAt,
            updatedAt: apiData.createdAt,
            assessmentContext: data.assessmentContext,
            suggestions: apiData.suggestions
          }
        };
      }
    } catch (error) {
      console.warn('Real chatbot API failed, falling back to local API:', error);
    }

    // Fallback to local API
    const response = await this.axiosInstance.post(API_ENDPOINTS.CHAT.START_CONVERSATION, data);
    return response.data;
  }

  /**
   * Send a message in chat conversation
   * @param {Object} data - Message data
   * @param {string} data.conversationId - Conversation ID
   * @param {string} data.resultId - Assessment result ID
   * @param {string} data.message - User message
   */
  async sendChatMessage(data) {
    try {
      // Try the real chatbot API first
      const response = await this.axiosInstance.post(API_ENDPOINTS.CHATBOT.SEND_MESSAGE(data.conversationId), {
        message: data.message,
        message_type: 'text'
      });

      if (response.data.success) {
        // Transform the response to match our expected structure
        const apiData = response.data.data;
        return {
          success: true,
          data: {
            message: {
              id: apiData.messageId || `msg-${Date.now()}`,
              role: 'assistant',
              content: apiData.content || apiData.response,
              timestamp: apiData.timestamp || new Date().toISOString(),
              resultId: data.resultId
            }
          }
        };
      }
    } catch (error) {
      console.warn('Real chatbot API failed, falling back to local API:', error);
    }

    // Fallback to local API
    const response = await this.axiosInstance.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, data);
    return response.data;
  }

  /**
   * Get chat conversation by result ID
   * @param {string} resultId - Assessment result ID
   */
  async getChatConversation(resultId) {
    try {
      // For the real API, we would need to first get the conversation ID
      // This is a limitation - we might need to store conversation IDs locally
      // For now, fall back to local API
      throw new Error('Real API conversation retrieval not implemented yet');
    } catch (error) {
      console.warn('Real chatbot API failed, falling back to local API:', error);
    }

    // Fallback to local API
    const response = await this.axiosInstance.get(API_ENDPOINTS.CHAT.GET_CONVERSATION(resultId));
    return response.data;
  }

  // ==================== ARCHIVE ====================
  
  /**
   * Get user's analysis results with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.jobId - Filter by job ID
   */
  async getResults(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.jobId) queryParams.append('jobId', params.jobId);

    const url = `${API_ENDPOINTS.ARCHIVE.RESULTS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  /**
   * Get specific analysis result
   * @param {string} resultId - Result ID
   */
  async getResultById(resultId) {
    const response = await this.axiosInstance.get(API_ENDPOINTS.ARCHIVE.RESULT_BY_ID(resultId));
    return response.data;
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
