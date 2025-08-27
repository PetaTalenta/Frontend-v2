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
        // Try multiple token storage keys for compatibility
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('authToken');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Request: Adding Bearer token to headers');
        } else {
          console.warn('API Request: No authentication token found');
        }

        // Log the request for debugging
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });

        return config;
      },
      (error) => {
        console.error('API Request Interceptor Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        // Log detailed error information
        console.error('API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 401) {
          // Token expired, clear auth data
          console.warn('Authentication failed - clearing tokens and redirecting');
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          // Redirect to auth page
          window.location.href = '/auth';
        } else if (error.response?.status === 402) {
          // Payment required - insufficient token balance
          console.error('Insufficient token balance for API request');
          // You can add custom handling here, like showing a modal or notification
        } else if (error.response?.status === 404) {
          console.error('API endpoint not found:', error.config?.url);
        } else if (error.response?.status >= 500) {
          console.error('Server error:', error.response?.status);
        } else if (error?.code === 'NETWORK_ERROR' || !error.response) {
          console.error('Network error - API might be unreachable');
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
    console.log('ApiService: Using consolidated assessment service with intelligent monitoring');

    const { assessmentService } = await import('./assessment-service');

    return await assessmentService.submitAssessment(assessmentData, assessmentName, {
      onProgress,
      onTokenBalanceUpdate,
      preferWebSocket: true
    });
  }

  /**
   * CONSOLIDATED: Fast assessment submission from answers
   * @param {Record<number, number | null>} answers - Raw assessment answers
   * @param {string} assessmentName - Assessment type name
   * @param {Function} onProgress - Progress callback
   * @param {Function} onTokenBalanceUpdate - Token balance update callback
   */
  async submitAssessmentFromAnswers(answers, assessmentName = 'AI-Driven Talent Mapping', onProgress, onTokenBalanceUpdate) {
    console.log('ApiService: Using consolidated assessment service for answers submission');

    const { assessmentService } = await import('./assessment-service');

    return await assessmentService.submitFromAnswers(answers, assessmentName, {
      onProgress,
      onTokenBalanceUpdate,
      preferWebSocket: true
    });
  }

  /**
   * CONSOLIDATED: Assessment processing with the new consolidated service
   * @param {Record<number, number | null>} answers - Raw assessment answers
   * @param {string} assessmentName - Assessment type name
   * @param {Object} options - Processing options
   */
  async processAssessmentUnified(answers, assessmentName = 'AI-Driven Talent Mapping', options = {}) {
    console.log('ApiService: Using consolidated assessment service for processing');

    const { assessmentService } = await import('./assessment-service');

    return await assessmentService.submitFromAnswers(answers, assessmentName, {
      onProgress: options.onProgress,
      onTokenBalanceUpdate: options.onTokenBalanceUpdate,
      preferWebSocket: options.preferWebSocket !== false
    });
  }

  /**
   * Get service status and recommendations
   */
  async getAssessmentServiceStatus() {
    const { assessmentService } = await import('./assessment-service');
    return {
      isHealthy: await assessmentService.isHealthy(),
      stats: assessmentService.getStats(),
      recommendations: ['Use the consolidated assessment service for better performance']
    };
  }

  /**
   * DEPRECATED: Use submitAssessmentWithMonitoring instead
   * @deprecated
   */
  async submitAssessmentWithWebSocket(assessmentData, assessmentName, onProgress, onTokenBalanceUpdate) {
    console.warn('ApiService: submitAssessmentWithWebSocket is deprecated, use submitAssessmentWithMonitoring');
    return this.submitAssessmentWithMonitoring(assessmentData, assessmentName, onProgress, onTokenBalanceUpdate);
  }

  /**
   * DEPRECATED: Use submitAssessmentWithMonitoring instead
   * @deprecated
   */
  async submitAssessmentWithPolling(assessmentData, assessmentName, onProgress) {
    console.warn('ApiService: submitAssessmentWithPolling is deprecated, use submitAssessmentWithMonitoring');
    return this.submitAssessmentWithMonitoring(assessmentData, assessmentName, onProgress);
  }

  /**
   * Get assessment queue status
   */
  async getAssessmentQueueStatus() {
    try {
      // Use direct API call since enhanced-assessment-api was removed
      const response = await this.axiosInstance.get(API_ENDPOINTS.ASSESSMENT.QUEUE_STATUS);
      return response.data;
    } catch (error) {
      console.error('Failed to get queue status:', error);
      throw error;
    }
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
    try {
      // Debug logging
      console.log('Starting chat conversation:', {
        endpoint: API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT,
        payload: {
          assessment_id: data.resultId,
          conversation_type: 'career_guidance',
          include_suggestions: true
        }
      });

      // Try the real chatbot API first
      const response = await this.axiosInstance.post(API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT, {
        assessment_id: data.resultId,
        conversation_type: 'career_guidance',
        include_suggestions: true
      });

      console.log('Chat conversation creation response:', response.data);

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
      } else {
        throw new Error(response.data.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Real chatbot API failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        endpoint: API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT
      });
      // Throw error to let chat-api.ts handle the fallback to mock implementation
      throw error;
    }
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
      // Debug logging
      console.log('Sending chat message:', {
        conversationId: data.conversationId,
        endpoint: API_ENDPOINTS.CHATBOT.SEND_MESSAGE(data.conversationId),
        payload: {
          content: data.message,
          type: 'text'
        }
      });

      // Try the real chatbot API first
      const response = await this.axiosInstance.post(API_ENDPOINTS.CHATBOT.SEND_MESSAGE(data.conversationId), {
        content: data.message,
        type: 'text'
      });

      console.log('Chat API response:', response.data);

      if (response.data.success) {
        // Transform the response to match our expected structure
        const apiData = response.data.data;
        return {
          success: true,
          data: {
            message: {
              id: apiData.aiResponse.id || `msg-${Date.now()}`,
              role: 'assistant',
              content: apiData.aiResponse.content,
              timestamp: apiData.aiResponse.timestamp || new Date().toISOString(),
              resultId: data.resultId
            }
          }
        };
      } else {
        throw new Error(response.data.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Real chatbot API failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        conversationId: data.conversationId
      });
      // Throw error to let chat-api.ts handle the fallback to mock implementation
      throw error;
    }
  }

  /**
   * Test chatbot API health
   */
  async testChatbotHealth() {
    try {
      console.log('Testing chatbot API health...');
      const response = await this.axiosInstance.get(API_ENDPOINTS.CHATBOT.HEALTH);

      console.log('Chatbot health check response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Chatbot health check failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
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
    try {
      // First, try to get the conversation ID from localStorage
      const storedConversation = localStorage.getItem(`chat-${resultId}`);
      if (storedConversation) {
        const conversation = JSON.parse(storedConversation);
        if (conversation.id && conversation.id.startsWith('550e8400-')) {
          // This looks like a real API conversation ID, try to fetch from API
          const response = await this.axiosInstance.get(API_ENDPOINTS.CHATBOT.GET_CONVERSATION(conversation.id));

          if (response.data.success) {
            const apiData = response.data.data.conversation;
            return {
              success: true,
              data: {
                id: apiData.id,
                resultId: resultId,
                messages: apiData.messages.map(msg => ({
                  id: msg.id,
                  role: msg.sender === 'ai' ? 'assistant' : msg.sender,
                  content: msg.content,
                  timestamp: msg.timestamp,
                  resultId: resultId
                })),
                createdAt: apiData.createdAt,
                updatedAt: apiData.lastActivity,
                assessmentContext: conversation.assessmentContext
              }
            };
          }
        }
      }

      // If no stored conversation or API call failed, return null to trigger new conversation
      return null;
    } catch (error) {
      console.warn('Real chatbot API failed:', error.response?.data || error.message);
      // Return null to trigger new conversation creation
      return null;
    }
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
      console.warn('Failed to get conversations from real API:', error);
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
      console.warn('Failed to update conversation:', error);
    }

    return {
      success: false,
      error: { message: 'Failed to update conversation' }
    };
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
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    // Use local proxy to avoid CORS issues
    const url = `/api/proxy/archive/results${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    // Get token for authorization
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('auth_token') ||
                 localStorage.getItem('authToken');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`Archive API request failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get specific analysis result
   * @param {string} resultId - Result ID
   */
  async getResultById(resultId) {
    // Use local proxy to avoid CORS issues
    const url = `/api/proxy/archive/results/${resultId}`;

    // Get token for authorization
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('auth_token') ||
                 localStorage.getItem('authToken');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`Archive API request failed: ${response.status}`);
    }

    return await response.json();
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
