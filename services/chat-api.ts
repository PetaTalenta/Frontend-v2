// Chat API Service
// Handles chatbot conversations and messaging

import { AssessmentResult } from '../types/assessment-results';
import apiService from './apiService';

// Chat message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  resultId: string;
}

// Chat conversation interface
export interface ChatConversation {
  id: string;
  resultId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  assessmentContext?: AssessmentResult;
}

// Chat response interface
export interface ChatResponse {
  success: boolean;
  data?: {
    message: ChatMessage;
    conversation: ChatConversation;
  };
  error?: {
    message: string;
    code?: string;
  };
}

// Simulate API delay for development
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Start a new chat conversation with assessment context
 */
export async function startChatConversation(
  resultId: string,
  assessmentResult: AssessmentResult
): Promise<ChatConversation> {
  try {
    // Try to use real API first
    const response = await apiService.startChatConversation({
      resultId,
      assessmentContext: assessmentResult
    });

    if (response.success && response.data) {
      // Ensure messages is always an array
      const messages = Array.isArray(response.data.messages) ? response.data.messages : [];

      return {
        ...response.data,
        messages
      };
    }

    throw new Error(response.error?.message || 'Failed to start conversation');
  } catch (error) {
    console.warn('API chat failed, using mock implementation:', error);

    // Fallback to mock implementation
    await delay(1000);

    const conversationId = 'chat-' + Date.now().toString(36);
    const welcomeMessage = generateWelcomeMessage(assessmentResult);

    const conversation: ChatConversation = {
      id: conversationId,
      resultId,
      messages: [welcomeMessage],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assessmentContext: assessmentResult
    };

    // Store in localStorage for persistence
    localStorage.setItem(`chat-${resultId}`, JSON.stringify(conversation));

    return conversation;
  }
}

/**
 * Send a message in the chat conversation
 */
export async function sendChatMessage(
  conversationId: string,
  resultId: string,
  message: string
): Promise<ChatMessage> {
  try {
    // Try to use real API first
    const response = await apiService.sendChatMessage({
      conversationId,
      resultId,
      message
    });

    if (response.success && response.data && response.data.message) {
      return response.data.message;
    }

    throw new Error(response.error?.message || 'Failed to send message');
  } catch (error) {
    console.warn('API chat failed, using mock implementation:', error);
    
    // Fallback to mock implementation
    await delay(1500); // Simulate thinking time
    
    // Get existing conversation
    const existingConversation = getStoredConversation(resultId);
    if (!existingConversation) {
      throw new Error('Conversation not found');
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now().toString(36),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      resultId
    };

    // Generate AI response
    const aiResponse = generateAIResponse(message, existingConversation.assessmentContext);
    
    const aiMessage: ChatMessage = {
      id: 'msg-' + (Date.now() + 1).toString(36),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      resultId
    };

    // Update conversation
    existingConversation.messages.push(userMessage, aiMessage);
    existingConversation.updatedAt = new Date().toISOString();
    
    // Store updated conversation
    localStorage.setItem(`chat-${resultId}`, JSON.stringify(existingConversation));
    
    return aiMessage;
  }
}

/**
 * Get chat conversation by result ID
 */
export async function getChatConversation(resultId: string): Promise<ChatConversation | null> {
  try {
    // Try to use real API first
    const response = await apiService.getChatConversation(resultId);

    if (response.success && response.data) {
      // Ensure messages is always an array
      const messages = Array.isArray(response.data.messages) ? response.data.messages : [];

      return {
        ...response.data,
        messages
      };
    }

    throw new Error(response.error?.message || 'Failed to get conversation');
  } catch (error) {
    console.warn('API chat failed, using stored conversation:', error);

    // Fallback to localStorage
    const storedConversation = getStoredConversation(resultId);
    if (storedConversation) {
      // Ensure messages is always an array even for stored conversations
      storedConversation.messages = Array.isArray(storedConversation.messages) ? storedConversation.messages : [];
    }
    return storedConversation;
  }
}

/**
 * Get stored conversation from localStorage
 */
function getStoredConversation(resultId: string): ChatConversation | null {
  try {
    const stored = localStorage.getItem(`chat-${resultId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get stored conversation:', error);
    return null;
  }
}

/**
 * Generate welcome message based on assessment result
 */
function generateWelcomeMessage(assessmentResult: AssessmentResult): ChatMessage {
  const persona = assessmentResult.persona_profile;
  const welcomeText = `Halo! Saya adalah AI Konselor Karir Anda. 

Saya telah menganalisis hasil assessment Anda dan melihat bahwa Anda memiliki profil kepribadian "${persona.title}". ${persona.description}

Saya siap membantu Anda memahami lebih dalam tentang:
• Kekuatan dan potensi diri Anda
• Rekomendasi karir yang sesuai
• Strategi pengembangan diri
• Langkah-langkah mencapai tujuan karir

Apa yang ingin Anda diskusikan hari ini?`;

  return {
    id: 'welcome-' + Date.now().toString(36),
    role: 'assistant',
    content: welcomeText,
    timestamp: new Date().toISOString(),
    resultId: assessmentResult.id
  };
}

/**
 * Generate AI response based on user message and assessment context
 */
function generateAIResponse(userMessage: string, assessmentContext?: AssessmentResult): string {
  const message = userMessage.toLowerCase();
  
  if (!assessmentContext) {
    return "Maaf, saya memerlukan konteks hasil assessment Anda untuk memberikan jawaban yang tepat. Silakan mulai ulang percakapan.";
  }

  const persona = assessmentContext.persona_profile;

  if (!persona) {
    return "Maaf, data profil kepribadian Anda tidak tersedia. Silakan pastikan assessment telah selesai dengan benar.";
  }
  
  // Career-related questions
  if (message.includes('karir') || message.includes('pekerjaan') || message.includes('profesi')) {
    const careers = persona.career_recommendations && persona.career_recommendations.length > 0
      ? persona.career_recommendations.slice(0, 3).map(c => c.title || c).join(', ')
      : 'berbagai bidang yang sesuai dengan profil kepribadian Anda';

    const strengths = persona.strengths && persona.strengths.length > 0
      ? persona.strengths.slice(0, 2).join(' dan ')
      : 'kekuatan unik Anda';

    return `Berdasarkan profil kepribadian Anda sebagai "${persona.title}", beberapa karir yang sangat cocok untuk Anda adalah: ${careers}.

Kekuatan utama Anda dalam ${strengths} membuat Anda sangat cocok untuk bidang-bidang tersebut.

Apakah ada bidang karir tertentu yang ingin Anda eksplorasi lebih dalam?`;
  }
  
  // Strengths-related questions
  if (message.includes('kekuatan') || message.includes('kelebihan') || message.includes('potensi')) {
    const strengthsList = persona.strengths && persona.strengths.length > 0
      ? persona.strengths.map((strength, index) => `${index + 1}. ${strength}`).join('\n')
      : '• Kemampuan analisis yang baik\n• Kreativitas dalam pemecahan masalah\n• Kemampuan komunikasi yang efektif';

    return `Kekuatan utama Anda berdasarkan assessment adalah:

${strengthsList}

Kekuatan-kekuatan ini adalah aset berharga yang bisa Anda kembangkan lebih lanjut. Mana yang paling ingin Anda fokuskan untuk dikembangkan?`;
  }
  
  // Development-related questions
  if (message.includes('pengembangan') || message.includes('belajar') || message.includes('skill')) {
    const recommendations = persona.recommendations && persona.recommendations.length > 0
      ? persona.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')
      : '1. Kembangkan kemampuan komunikasi interpersonal\n2. Pelajari teknologi dan tools terbaru di bidang Anda\n3. Bangun network profesional yang kuat\n4. Tingkatkan kemampuan leadership dan manajemen';

    return `Untuk pengembangan diri, saya merekomendasikan:

${recommendations}

Rekomendasi ini disesuaikan dengan profil kepribadian Anda. Mana yang paling menarik untuk Anda mulai?`;
  }
  
  // General questions
  if (message.includes('halo') || message.includes('hai') || message.includes('hello')) {
    return `Halo! Senang bisa membantu Anda. Sebagai "${persona.title}", Anda memiliki potensi yang luar biasa. Ada yang ingin Anda tanyakan tentang hasil assessment atau rencana karir Anda?`;
  }
  
  // Default response
  return `Terima kasih atas pertanyaan Anda. Sebagai "${persona.title}", Anda memiliki karakteristik unik yang bisa saya bantu eksplorasi lebih dalam.

Saya bisa membantu Anda dengan:
• Penjelasan detail tentang profil kepribadian Anda
• Saran karir yang sesuai dengan kekuatan Anda
• Strategi pengembangan diri yang tepat
• Tips untuk mencapai tujuan karir

Apa aspek yang paling ingin Anda bahas?`;
}
