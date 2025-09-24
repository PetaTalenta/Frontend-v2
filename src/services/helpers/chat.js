// Internal chat domain helper (non-public). Extracted from ApiService chat methods.
// DO NOT import this from components. Always use ApiService as the public facade.

import { logger } from '../../utils/env-logger';

export async function startConversation(axiosInstance, API_ENDPOINTS, data) {
  try {
    logger.debug('Starting chat conversation:', {
      endpoint: API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT,
      payload: {
        assessment_id: data.resultId,
        conversation_type: 'career_guidance',
        include_suggestions: true,
      },
    });

    // First: try generic conversations endpoint
    try {
      const genericResponse = await axiosInstance.post(
        API_ENDPOINTS.CHATBOT.CREATE_CONVERSATION,
        {
          title: 'Career Guidance Session',
          context: 'assessment',
          initialMessage: "I'd like to discuss my recent assessment results",
        }
      );

      logger.debug('Generic conversation creation response:', genericResponse.data);

      if (genericResponse.data?.success) {
        const apiData = genericResponse.data.data;
        const ai = apiData.aiResponse;
        return {
          success: true,
          data: {
            id: apiData.conversationId,
            resultId: data.resultId,
            messages: ai
              ? [
                  {
                    id: ai.id || ai.messageId || `msg-${Date.now()}`,
                    role: 'assistant',
                    content: ai.content,
                    timestamp: ai.timestamp || new Date().toISOString(),
                    resultId: data.resultId,
                  },
                ]
              : [],
            createdAt: apiData.createdAt,
            updatedAt: apiData.lastActivity || apiData.createdAt,
            assessmentContext: data.assessmentContext,
          },
        };
      }
    } catch (genericErr) {
      const gp = genericErr.response?.data || { message: genericErr.message };
      const gm = (gp.error || gp.message || '').toString().toLowerCase();
      logger.warn('Generic conversation creation failed, will try fallback:', gp);

      if (gm.includes('conversation already exists')) {
        try {
          const listResp = await axiosInstance.get(
            `${API_ENDPOINTS.CHATBOT.GET_CONVERSATIONS}?status=active&context=assessment`
          );
          if (
            listResp.data?.success &&
            Array.isArray(listResp.data.data?.conversations) &&
            listResp.data.data.conversations.length > 0
          ) {
            const conversations = listResp.data.data.conversations.slice().sort((a, b) => {
              const aTime = new Date(a.lastActivity || a.createdAt || 0).getTime();
              const bTime = new Date(b.lastActivity || b.createdAt || 0).getTime();
              return bTime - aTime;
            });
            const existing = conversations[0];
            const detailResp = await axiosInstance.get(
              API_ENDPOINTS.CHATBOT.GET_CONVERSATION(existing.id)
            );
            if (detailResp.data?.success) {
              const conv = detailResp.data.data.conversation;
              return {
                success: true,
                data: {
                  id: conv.id,
                  resultId: data.resultId,
                  messages: Array.isArray(conv.messages)
                    ? conv.messages.map((msg) => ({
                        id: msg.id,
                        role: msg.sender === 'ai' ? 'assistant' : msg.sender,
                        content: msg.content,
                        timestamp: msg.timestamp,
                        resultId: data.resultId,
                      }))
                    : [],
                  createdAt: conv.createdAt,
                  updatedAt: conv.lastActivity || conv.createdAt,
                  assessmentContext: data.assessmentContext,
                },
              };
            }
          }
        } catch (recoverErr) {
          logger.warn('Recovery after generic conflict failed:', recoverErr.response?.data || recoverErr.message);
        }
      }
      // continue to fallback to from-assessment
    }

    // Fallback: try from-assessment endpoint
    const response = await axiosInstance.post(
      API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT,
      {
        assessment_id: data.resultId,
        conversation_type: 'career_guidance',
        include_suggestions: true,
      }
    );

    logger.debug('Chat conversation creation response:', response.data);

    if (response.data.success) {
      const apiData = response.data.data;
      return {
        success: true,
        data: {
          id: apiData.conversationId,
          resultId: data.resultId,
          messages: apiData.personalizedWelcome
            ? [
                {
                  id: apiData.personalizedWelcome.messageId,
                  role: 'assistant',
                  content: apiData.personalizedWelcome.content,
                  timestamp: apiData.personalizedWelcome.timestamp,
                  resultId: data.resultId,
                },
              ]
            : [],
          createdAt: apiData.createdAt,
          updatedAt: apiData.createdAt,
          assessmentContext: data.assessmentContext,
          suggestions: apiData.suggestions,
        },
      };
    }

    throw new Error(response.data.message || 'API returned unsuccessful response');
  } catch (error) {
    const errorPayload = error.response?.data || { message: error.message };
    logger.error('Real chatbot API failed:', {
      error: errorPayload,
      status: error.response?.status,
      endpoint: API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT,
    });
    throw error;
  }
}

export async function sendMessage(axiosInstance, API_ENDPOINTS, data) {
  try {
    logger.debug('Sending chat message:', {
      conversationId: data.conversationId,
      endpoint: API_ENDPOINTS.CHATBOT.SEND_MESSAGE(data.conversationId),
    });

    const response = await axiosInstance.post(
      API_ENDPOINTS.CHATBOT.SEND_MESSAGE(data.conversationId),
      {
        content: data.message,
        type: 'text',
      }
    );

    logger.debug('Chat API response:', response.data);

    if (response.data.success) {
      const apiData = response.data.data;
      return {
        success: true,
        data: {
          message: {
            id: apiData.aiResponse.id || `msg-${Date.now()}`,
            role: 'assistant',
            content: apiData.aiResponse.content,
            timestamp: apiData.aiResponse.timestamp || new Date().toISOString(),
            resultId: data.resultId,
          },
        },
      };
    }

    throw new Error(response.data.message || 'API returned unsuccessful response');
  } catch (error) {
    logger.error('Real chatbot API failed:', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      conversationId: data.conversationId,
    });
    throw error;
  }
}

export async function getConversation(axiosInstance, API_ENDPOINTS, resultId) {
  try {
    const storedConversation = localStorage.getItem(`chat-${resultId}`);
    if (storedConversation) {
      const conversation = JSON.parse(storedConversation);
      if (conversation.id && !conversation.id.startsWith('mock-chat-')) {
        const response = await axiosInstance.get(
          API_ENDPOINTS.CHATBOT.GET_CONVERSATION(conversation.id)
        );
        if (response.data.success) {
          const apiData = response.data.data.conversation;
          return {
            success: true,
            data: {
              id: apiData.id,
              resultId: resultId,
              messages: apiData.messages.map((msg) => ({
                id: msg.id,
                role: msg.sender === 'ai' ? 'assistant' : msg.sender,
                content: msg.content,
                timestamp: msg.timestamp,
                resultId: resultId,
              })),
              createdAt: apiData.createdAt,
              updatedAt: apiData.lastActivity,
              assessmentContext: conversation.assessmentContext,
            },
          };
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn('Real chatbot API failed:', error.response?.data || error.message);
    return null;
  }
}

