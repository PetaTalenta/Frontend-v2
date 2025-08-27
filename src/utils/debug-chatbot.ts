/**
 * Debug utilities for chatbot API testing
 */

import { apiService } from '../services/apiService';

export interface ChatbotDebugResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Test chatbot API health
 */
export async function testChatbotHealth(): Promise<ChatbotDebugResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('🔍 Testing chatbot API health...');
    const result = await apiService.testChatbotHealth();
    
    if (result.success) {
      return {
        success: true,
        message: 'Chatbot API is healthy',
        details: result.data,
        timestamp
      };
    } else {
      return {
        success: false,
        message: 'Chatbot API health check failed',
        details: result.error,
        timestamp
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to chatbot API',
      details: {
        error: error.message,
        stack: error.stack
      },
      timestamp
    };
  }
}

/**
 * Test authentication for chatbot API
 */
export async function testChatbotAuth(): Promise<ChatbotDebugResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('🔐 Testing chatbot API authentication...');
    
    // Check if we have a token
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('auth_token') || 
                 localStorage.getItem('authToken');
    
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        details: {
          checkedKeys: ['token', 'auth_token', 'authToken'],
          localStorage: Object.keys(localStorage)
        },
        timestamp
      };
    }
    
    // Validate token format
    const isJWT = token.split('.').length === 3;
    const isMockToken = token.startsWith('mock-jwt-token-');
    
    if (!isJWT && !isMockToken) {
      return {
        success: false,
        message: 'Invalid token format',
        details: {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          isJWT,
          isMockToken
        },
        timestamp
      };
    }
    
    // Try to make an authenticated request
    const healthResult = await testChatbotHealth();
    
    return {
      success: healthResult.success,
      message: healthResult.success 
        ? 'Authentication successful' 
        : 'Authentication failed',
      details: {
        tokenFormat: isJWT ? 'JWT' : 'Mock',
        tokenLength: token.length,
        healthCheck: healthResult
      },
      timestamp
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Authentication test failed',
      details: {
        error: error.message,
        stack: error.stack
      },
      timestamp
    };
  }
}

/**
 * Generate a valid UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Test creating a conversation
 */
export async function testCreateConversation(assessmentId: string): Promise<ChatbotDebugResult> {
  const timestamp = new Date().toISOString();

  try {
    console.log('💬 Testing conversation creation...');

    // If the provided assessmentId is not a valid UUID, generate one
    let validAssessmentId = assessmentId;
    if (!isValidUUID(assessmentId)) {
      validAssessmentId = generateUUID();
      console.log(`Generated valid UUID for testing: ${validAssessmentId}`);
    }

    const mockAssessmentResult = {
      id: validAssessmentId,
      status: 'completed',
      assessment_data: {
        realistic: 75,
        investigative: 85,
        artistic: 60,
        social: 70,
        enterprising: 80,
        conventional: 55
      },
      personality_type: 'ENFP',
      career_recommendations: []
    };

    const result = await apiService.startChatConversation({
      resultId: validAssessmentId,
      assessmentContext: mockAssessmentResult
    });
    
    if (result.success) {
      return {
        success: true,
        message: 'Conversation created successfully',
        details: {
          conversationId: result.data.id,
          messageCount: result.data.messages?.length || 0,
          createdAt: result.data.createdAt
        },
        timestamp
      };
    } else {
      return {
        success: false,
        message: 'Failed to create conversation',
        details: result.error,
        timestamp
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: 'Conversation creation test failed',
      details: {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      },
      timestamp
    };
  }
}

/**
 * Run comprehensive chatbot diagnostics
 */
export async function runChatbotDiagnostics(assessmentId?: string): Promise<{
  overall: boolean;
  results: {
    health: ChatbotDebugResult;
    auth: ChatbotDebugResult;
    conversation?: ChatbotDebugResult;
  };
}> {
  console.log('🚀 Running comprehensive chatbot diagnostics...');
  
  const results = {
    health: await testChatbotHealth(),
    auth: await testChatbotAuth(),
  } as any;
  
  // Only test conversation creation if we have an assessment ID and auth is working
  if (assessmentId && results.auth.success) {
    results.conversation = await testCreateConversation(assessmentId);
  }
  
  const overall = results.health.success && results.auth.success && 
                 (!results.conversation || results.conversation.success);
  
  console.log('📊 Diagnostics complete:', {
    overall,
    health: results.health.success,
    auth: results.auth.success,
    conversation: results.conversation?.success
  });
  
  return { overall, results };
}

/**
 * Get current API configuration
 */
export function getChatbotApiConfig() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.chhrone.web.id',
    timeout: 30000,
    token: localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken'),
    endpoints: {
      health: '/api/chatbot/health',
      createFromAssessment: '/api/chatbot/assessment/from-assessment',
      sendMessage: '/api/chatbot/conversations/{id}/messages'
    }
  };
}

/**
 * Clear all chatbot-related data
 */
export function clearChatbotData() {
  const keys = Object.keys(localStorage);
  const chatKeys = keys.filter(key => key.startsWith('chat-'));
  
  chatKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`🧹 Cleared ${chatKeys.length} chatbot conversations from localStorage`);
  
  return {
    clearedKeys: chatKeys,
    remainingKeys: Object.keys(localStorage)
  };
}
