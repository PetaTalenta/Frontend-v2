import { NextRequest, NextResponse } from 'next/server';

// Mock chat sessions storage (shared with start route)
const chatSessions = new Map<string, any>();

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Mock token validation - in real app, validate JWT
  const token = authHeader.replace('Bearer ', '');
  if (token.startsWith('mock-jwt-token-')) {
    return `user-${token.split('-').pop()}`;
  }
  
  return null;
}

// Mock AI response generator
function generateAIResponse(userMessage: string, assessmentType: string): string {
  const responses = [
    `Berdasarkan hasil assessment "${assessmentType}" Anda, saya dapat membantu menjelaskan lebih detail tentang "${userMessage}". Apakah ada aspek khusus yang ingin Anda ketahui lebih dalam?`,
    `Pertanyaan yang menarik tentang "${userMessage}"! Dari hasil assessment Anda, terlihat bahwa ini berkaitan dengan kekuatan utama Anda. Mari kita bahas lebih lanjut.`,
    `Terkait "${userMessage}", hasil assessment menunjukkan pola yang konsisten dengan profil kepribadian Anda. Saya bisa memberikan insight lebih mendalam jika Anda mau.`,
    `Bagus sekali Anda bertanya tentang "${userMessage}". Ini adalah area yang sangat relevan dengan rekomendasi karir dari hasil assessment Anda.`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chat Send API: Processing chat message');
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromToken(authHeader);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, message, messageType = 'text' } = body;

    if (!chatId || !message) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Chat ID and message are required',
        },
      }, { status: 400 });
    }

    // Get chat session
    const chatSession = chatSessions.get(chatId);
    if (!chatSession) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CHAT_NOT_FOUND',
          message: 'Chat session not found',
        },
      }, { status: 404 });
    }

    // Verify user owns this chat session
    if (chatSession.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have access to this chat session',
        },
      }, { status: 403 });
    }

    // Add user message
    const userMessageObj = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      messageType,
      timestamp: new Date().toISOString(),
    };

    chatSession.messages.push(userMessageObj);

    // Generate AI response
    const aiResponse = generateAIResponse(message, chatSession.assessmentType);
    const aiMessageObj = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: aiResponse,
      messageType: 'text',
      timestamp: new Date().toISOString(),
    };

    chatSession.messages.push(aiMessageObj);
    chatSession.updatedAt = new Date().toISOString();

    // Update chat session
    chatSessions.set(chatId, chatSession);

    console.log(`Chat Send API: Processed message for chat ${chatId}`);

    return NextResponse.json({
      success: true,
      data: {
        userMessage: userMessageObj,
        aiResponse: aiMessageObj,
        chatId,
      },
      message: 'Message sent successfully',
    });

  } catch (error) {
    console.error('Chat Send API: Error processing chat message:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process chat message',
      },
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
