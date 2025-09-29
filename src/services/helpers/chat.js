// Internal chat domain helper (non-public). Extracted from ApiService chat methods.
// DO NOT import this from components. Always use ApiService as the public facade.

import { logger } from '../../utils/env-logger';

export async function startConversation(axiosInstance, API_ENDPOINTS, data) {
  try {
    const hasSnapshot = !!data.assessmentContext;
    const snapshotPreview = hasSnapshot ? {
      type: data.assessmentContext?.type,
      resultId: data.assessmentContext?.resultId,
      personaKeys: data.assessmentContext?.persona ? Object.keys(data.assessmentContext.persona).length : 0,
    } : null;

    logger.debug('Starting chat conversation:', {
      endpoint: API_ENDPOINTS.CHATBOT.CREATE_FROM_ASSESSMENT,
      payload: {
        assessment_id: data.resultId,
        conversation_type: 'career_guidance',
        include_suggestions: true,
      },
      context_snapshot_preview: snapshotPreview,
    });

    // Extra console in browser for quick verification
    if (typeof window !== 'undefined') {
      console.info('[AI Chat] startConversation payload', {
        endpoint: API_ENDPOINTS.CHATBOT.CREATE_CONVERSATION,
        resultId: data.resultId,
        hasSnapshot,
        snapshotPreview,
      });
    }

    // First: try generic conversations endpoint (per docs)
    try {
      const genericResponse = await axiosInstance.post(
        API_ENDPOINTS.CHATBOT.CREATE_CONVERSATION,
        {
          title: 'Career Guidance Session',
          context_type: 'assessment',
          context_data: {
            source: 'assessment',
            assessment_id: data.resultId,
            // Provide snapshot so backend can use cached data and avoid re-analysis
            // Only send persona profile as context snapshot
            assessment_snapshot: data.assessmentContext || null,
            no_reanalysis: true,
            use_cached: true,
          },
          metadata: { origin: 'results_page', reanalyze: false, use_cached: true },
        }
      );

      logger.debug('Generic conversation creation response:', genericResponse.data);

      if (genericResponse.data?.success) {
        const conv = genericResponse.data.data?.conversation;
        if (conv?.id) {
          return {
            success: true,
            data: {
              id: conv.id,
              resultId: data.resultId,
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              assessmentContext: data.assessmentContext,
            },
          };
        }
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
        include_suggestions: false, // avoid extra processing that may re-analyze
        no_reanalysis: true,
        use_cached: true,
        // Only send persona profile as context snapshot
        assessment_snapshot: data.assessmentContext || null,
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
      length: (data.message || '').length,
    });

    const response = await axiosInstance.post(
      API_ENDPOINTS.CHATBOT.SEND_MESSAGE(data.conversationId),
      {
        content: data.message,
        type: 'text', // per API docs
        ...(data.parentMessageId ? { parent_message_id: data.parentMessageId } : {}),
      }
    );

    logger.debug('Chat API response:', response.data);

    if (response.data.success) {
      const apiData = response.data.data || {};
      const assistant = apiData.assistant_message || apiData.aiResponse || {};
      return {
        success: true,
        data: {
          message: {
            id: assistant.id || assistant.messageId || `msg-${Date.now()}`,
            role: 'assistant',
            content: assistant.content,
            timestamp: assistant.timestamp || new Date().toISOString(),
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
      const stored = JSON.parse(storedConversation);
      if (stored.id && !stored.id.startsWith('mock-chat-')) {
        // Get conversation metadata
        const detailResp = await axiosInstance.get(
          API_ENDPOINTS.CHATBOT.GET_CONVERSATION(stored.id)
        );
        if (detailResp.data?.success) {
          const conv = detailResp.data.data.conversation;

          // Get messages via dedicated endpoint
          let messages = [];
          try {
            const msgResp = await axiosInstance.get(
              `${API_ENDPOINTS.CHATBOT.GET_MESSAGES(stored.id)}?page=1&limit=50`
            );
            if (msgResp.data?.success) {
              const items = msgResp.data.data?.messages || [];
              messages = items.map((msg) => ({
                id: msg.id,
                role: msg.sender === 'ai' ? 'assistant' : (msg.sender || 'user'),
                content: msg.content,
                timestamp: msg.timestamp,
                resultId: resultId,
              }));
            }
          } catch (e) {
            logger.warn('Failed to load messages; proceeding with empty array', e.response?.data || e.message);
          }

          return {
            success: true,
            data: {
              id: conv.id,
              resultId: resultId,
              messages,
              createdAt: conv.createdAt || new Date().toISOString(),
              updatedAt: conv.lastActivity || conv.createdAt || new Date().toISOString(),
              assessmentContext: stored.assessmentContext,
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

