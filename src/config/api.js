// API Configuration - OPTIMIZED for faster response
export const API_CONFIG = {
  // API Gateway URL - Always use real API
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id',

  // WebSocket/Notification URL
  NOTIFICATION_URL: process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'https://api.futureguide.id',

  // Request timeout - OPTIMIZED for faster failure detection
  TIMEOUT: 15000, // 15 seconds (reduced from 30s)

  // Retry configuration - OPTIMIZED
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 500, // 0.5 seconds (reduced from 1s)

  // Development flags - Mock API removed
  USE_MOCK_API: false,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Gateway info
  GATEWAY_INFO: '/',

  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REGISTER_BATCH: '/api/auth/register/batch',
    PROFILE: '/api/auth/profile',
    UPDATE_PROFILE: '/api/auth/profile',
    DELETE_PROFILE: '/api/auth/profile',
    DELETE_ACCOUNT: '/api/auth/account',
    CHANGE_PASSWORD: '/api/auth/change-password',
    LOGOUT: '/api/auth/logout',
    TOKEN_BALANCE: '/api/auth/token-balance',
    SCHOOLS: '/api/auth/schools',
    SCHOOLS_BY_LOCATION: '/api/auth/schools/by-location',
    SCHOOL_USERS: (schoolId) => `/api/auth/schools/${schoolId}/users`,
  },

  // Admin endpoints
  ADMIN: {
    LOGIN: '/api/admin/login',
    LOGOUT: '/api/admin/logout',
    PROFILE: '/api/admin/profile',
    REGISTER: '/api/admin/register',
    CHANGE_PASSWORD: '/api/admin/change-password',
    USERS: '/api/archive/admin/users',
    USER_BY_ID: (userId) => `/api/archive/admin/users/${userId}`,
    UPDATE_USER_TOKEN_BALANCE: (userId) => `/api/archive/admin/users/${userId}/token-balance`,
    DELETE_USER: (userId) => `/api/archive/admin/users/${userId}`,
  },

  // Assessment endpoints
  ASSESSMENT: {
    SUBMIT: '/api/assessment/submit',
    STATUS: (jobId) => `/api/assessment/status/${jobId}`,
    RETRY: '/api/assessment/retry',
    QUEUE_STATUS: '/api/assessment/queue/status',
    HEALTH: '/api/assessment/health',
    HEALTH_READY: '/api/assessment/health/ready',
    HEALTH_LIVE: '/api/assessment/health/live',
    HEALTH_QUEUE: '/api/assessment/health/queue',
  },

  // Archive endpoints
  ARCHIVE: {
    RESULTS: '/api/archive/results',
    RESULT_BY_ID: (id) => `/api/archive/results/${id}`,
    UPDATE_RESULT: (id) => `/api/archive/results/${id}`,
    DELETE_RESULT: (id) => `/api/archive/results/${id}`,
    JOBS: '/api/archive/jobs',
    JOB_BY_ID: (jobId) => `/api/archive/jobs/${jobId}`,
    JOB_STATS: '/api/archive/jobs/stats',
    DELETE_JOB: (jobId) => `/api/archive/jobs/${jobId}`,
    STATS: '/api/archive/stats',
    STATS_OVERVIEW: '/api/archive/stats/overview',
    UNIFIED_STATS: '/api/archive/api/v1/stats',
  },

  // Notification endpoints
  NOTIFICATIONS: {
    HEALTH: '/api/notifications/health',
  },

  // Chat endpoints
  CHAT: {
    SEND_MESSAGE: '/api/chat/send',
    GET_CONVERSATION: (resultId) => `/api/chat/conversation/${resultId}`,
    START_CONVERSATION: '/api/chat/start',
    DELETE_CONVERSATION: (conversationId) => `/api/chat/conversation/${conversationId}`,
  },

  // Chatbot endpoints (real API) - Updated to match API documentation
  CHATBOT: {
    CREATE_CONVERSATION: '/api/chatbot/conversations',
    CREATE_FROM_ASSESSMENT: '/api/chatbot/assessment/from-assessment',
    GET_CONVERSATIONS: '/api/chatbot/conversations',
    GET_CONVERSATION: (conversationId) => `/api/chatbot/conversations/${conversationId}`,
    SEND_MESSAGE: (conversationId) => `/api/chatbot/conversations/${conversationId}/messages`,
    UPDATE_CONVERSATION: (conversationId) => `/api/chatbot/conversations/${conversationId}`,
    DELETE_CONVERSATION: (conversationId) => `/api/chatbot/conversations/${conversationId}`,
    GET_SUGGESTIONS: '/api/chatbot/suggestions',
    AUTO_INITIALIZE: '/api/chatbot/auto-initialize',
    GET_MESSAGES: (conversationId) => `/api/chatbot/conversations/${conversationId}/messages`,
    HEALTH: '/api/chatbot/health',
    HEALTH: '/api/chatbot/health',
  },

  // Health check endpoints
  HEALTH: {
    MAIN: '/health',
    LIVE: '/health/live',
    READY: '/health/ready',
    DETAILED: '/health/detailed',
    AUTH: '/api/auth/health',
    ARCHIVE: '/api/archive/health',
    ASSESSMENT: '/api/assessment/health',
  },
};

export default API_CONFIG;
