// Internal chat domain helper (non-public). Extracted from ApiService chat methods.
// DO NOT import this from components. Always use ApiService as the public facade.

import { logger } from '../../utils/env-logger';

export async function startConversation(axiosInstance, API_ENDPOINTS, data) {
  try {
    const hasSnapshot = !!data.assessmentContext;
    const snapshotPreview = hasSnapshot ? {
      type: data.assessmentContext?.type,
      resultId: data.assessmentContext?.resultId,
      personaKeys: data.assessmentContext?.profilePersona ? Object.keys(data.assessmentContext.profilePersona).length : 0,
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
          resultsId: data.resultId,
          profilePersona: data.assessmentContext?.profilePersona || {},
        }
      );

      logger.debug('Generic conversation creation response:', genericResponse.data);

      if (genericResponse.data?.success) {
        const apiData = genericResponse.data.data;
        const conv = apiData?.conversation;
        
        // 🔍 DEBUGGING: Log struktur response dari generic endpoint
        console.log('🔍 [DEBUG] Generic Endpoint Response Structure:', {
          hasConversation: !!conv,
          conversationId: conv?.id,
          hasMessages: !!apiData?.messages,
          messagesIsArray: Array.isArray(apiData?.messages),
          messagesLength: Array.isArray(apiData?.messages) ? apiData.messages.length : 0,
          hasPersonalizedWelcome: !!apiData?.personalizedWelcome,
          conversationKeys: conv ? Object.keys(conv) : null,
          apiDataKeys: apiData ? Object.keys(apiData) : null,
          rawApiData: JSON.stringify(apiData, null, 2).substring(0, 500)
        });

        if (conv?.id) {
          // Check for messages in various possible locations
          let welcomeMessages = [];
          
          // Check 1: In apiData.messages array
          if (apiData?.messages && Array.isArray(apiData.messages) && apiData.messages.length > 0) {
            welcomeMessages = apiData.messages
              .filter(msg => msg.sender_type === 'assistant' || msg.sender === 'assistant' || msg.role === 'assistant')
              .map(msg => ({
                id: msg.id || msg.messageId,
                role: 'assistant',
                content: msg.content,
                timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
                resultId: data.resultId,
              }));
            console.log('✅ [DEBUG] Found messages in apiData.messages:', welcomeMessages.length);
          }
          
          // Check 2: In conversation.messages array
          if (welcomeMessages.length === 0 && conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            welcomeMessages = conv.messages
              .filter(msg => msg.sender_type === 'assistant' || msg.sender === 'assistant' || msg.role === 'assistant')
              .map(msg => ({
                id: msg.id || msg.messageId,
                role: 'assistant',
                content: msg.content,
                timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
                resultId: data.resultId,
              }));
            console.log('✅ [DEBUG] Found messages in conversation.messages:', welcomeMessages.length);
          }
          
          // Check 3: In apiData.personalizedWelcome
          if (welcomeMessages.length === 0 && apiData?.personalizedWelcome) {
            welcomeMessages = [{
              id: apiData.personalizedWelcome.messageId || apiData.personalizedWelcome.id,
              role: 'assistant',
              content: apiData.personalizedWelcome.content,
              timestamp: apiData.personalizedWelcome.timestamp || new Date().toISOString(),
              resultId: data.resultId,
            }];
            console.log('✅ [DEBUG] Found messages in personalizedWelcome');
          }

          console.log('📊 [DEBUG] Total welcome messages to return:', welcomeMessages.length);
          
          // If no messages in creation response, try fetching messages via GET endpoint
          if (welcomeMessages.length === 0) {
            console.warn('⚠️ [DEBUG] No messages in creation response. Trying GET messages endpoint...');
            try {
              const messagesResp = await axiosInstance.get(
                `${API_ENDPOINTS.CHATBOT.GET_MESSAGES(conv.id)}?page=1&limit=10`
              );
              console.log('🔍 [DEBUG] GET messages response:', messagesResp.data);
              
              if (messagesResp.data?.success && messagesResp.data.data?.messages) {
                const fetchedMessages = messagesResp.data.data.messages
                  .filter(msg => msg.sender_type === 'assistant' || msg.sender === 'assistant' || msg.role === 'assistant')
                  .map(msg => ({
                    id: msg.id || msg.messageId,
                    role: 'assistant',
                    content: msg.content,
                    timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
                    resultId: data.resultId,
                  }));
                welcomeMessages = fetchedMessages;
                console.log('✅ [DEBUG] Fetched messages via GET:', welcomeMessages.length);
              }
            } catch (fetchErr) {
              console.warn('⚠️ [DEBUG] Failed to fetch messages:', fetchErr.response?.data || fetchErr.message);
            }
          }

          // FALLBACK: If still no messages, generate a welcome message in frontend
          // This ensures user always sees a greeting when chat starts
          if (welcomeMessages.length === 0) {
            console.warn('⚠️ [DEBUG] Still no messages from API. Generating fallback welcome message.');
            const personaName = data.assessmentContext?.profilePersona?.name || 'Pengguna';
            welcomeMessages = [{
              id: `welcome-${conv.id}`,
              role: 'assistant',
              content: `Halo! Saya adalah **Guider**, asisten AI yang akan membantu Anda dalam pengembangan karir berdasarkan profil persona **"${personaName}"** yang telah Anda selesaikan.

Saya dapat membantu Anda dengan:

- Rekomendasi jalur karir yang sesuai dengan kepribadian Anda
- Analisis kekuatan dan area pengembangan
- Saran untuk mengembangkan keterampilan yang dibutuhkan
- Perencanaan langkah karir selanjutnya

Silakan tanyakan apa saja yang ingin Anda ketahui tentang hasil assessment Anda! 😊`,
              timestamp: new Date().toISOString(),
              resultId: data.resultId,
              _generatedByFrontend: true // marker for debugging
            }];
            console.log('✅ [DEBUG] Generated fallback welcome message');
          }

          return {
            success: true,
            data: {
              id: conv.id,
              resultId: data.resultId,
              messages: welcomeMessages,
              createdAt: conv.createdAt || new Date().toISOString(),
              updatedAt: conv.updatedAt || conv.lastActivity || new Date().toISOString(),
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
        title: 'Career Guidance Session',
        resultsId: data.resultId,
        profilePersona: data.assessmentContext?.profilePersona || {},
      }
    );

    logger.debug('Chat conversation creation response:', response.data);

    if (response.data.success) {
      const apiData = response.data.data;
      
      // 🔍 DEBUGGING: Log struktur response API
      console.log('🔍 [DEBUG] API Response Structure:', {
        conversationId: apiData.conversationId,
        hasPersonalizedWelcome: !!apiData.personalizedWelcome,
        hasMessages: !!apiData.messages,
        messagesLength: Array.isArray(apiData.messages) ? apiData.messages.length : 0,
        personalizedWelcomeStructure: apiData.personalizedWelcome ? Object.keys(apiData.personalizedWelcome) : null,
        firstMessageStructure: apiData.messages?.[0] ? Object.keys(apiData.messages[0]) : null,
        rawApiData: JSON.stringify(apiData, null, 2).substring(0, 500)
      });

      // Check if welcome message is in messages array instead of personalizedWelcome
      let welcomeMessages = [];
      
      if (apiData.personalizedWelcome) {
        // Struktur lama: personalizedWelcome object
        welcomeMessages = [{
          id: apiData.personalizedWelcome.messageId || apiData.personalizedWelcome.id,
          role: 'assistant',
          content: apiData.personalizedWelcome.content,
          timestamp: apiData.personalizedWelcome.timestamp || new Date().toISOString(),
          resultId: data.resultId,
        }];
        console.log('✅ [DEBUG] Using personalizedWelcome structure');
      } else if (apiData.messages && Array.isArray(apiData.messages) && apiData.messages.length > 0) {
        // Struktur baru: messages array dengan assistant message
        welcomeMessages = apiData.messages
          .filter(msg => msg.sender_type === 'assistant' || msg.sender === 'assistant' || msg.role === 'assistant')
          .map(msg => ({
            id: msg.id || msg.messageId,
            role: 'assistant',
            content: msg.content,
            timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
            resultId: data.resultId,
          }));
        console.log('✅ [DEBUG] Using messages array structure, found:', welcomeMessages.length, 'assistant messages');
      }

      console.log('📊 [DEBUG] Welcome messages to return:', welcomeMessages);

      return {
        success: true,
        data: {
          id: apiData.conversationId,
          resultId: data.resultId,
          messages: welcomeMessages,
          createdAt: apiData.createdAt || new Date().toISOString(),
          updatedAt: apiData.createdAt || new Date().toISOString(),
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

