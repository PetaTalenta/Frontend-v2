import { NextRequest, NextResponse } from 'next/server';

// Mock chat sessions storage
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

export async function POST(request: NextRequest) {
  try {
    console.log('Chat Start API: Starting new chat session');
    
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
    const { resultId, assessmentType = 'AI-Driven Talent Mapping' } = body;

    if (!resultId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_RESULT_ID',
          message: 'Result ID is required to start chat',
        },
      }, { status: 400 });
    }

    // Generate chat session ID
    const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create chat session
    const chatSession = {
      chatId,
      userId,
      resultId,
      assessmentType,
      status: 'active',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `Halo! Saya adalah AI Assistant yang akan membantu Anda memahami hasil assessment "${assessmentType}" Anda. Apa yang ingin Anda tanyakan tentang hasil assessment Anda?`,
          timestamp: new Date().toISOString(),
        }
      ],
    };

    // Store chat session
    chatSessions.set(chatId, chatSession);

    console.log(`Chat Start API: Created chat session ${chatId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        chatId,
        status: 'active',
        welcomeMessage: chatSession.messages[0],
      },
      message: 'Chat session started successfully',
    });

  } catch (error) {
    console.error('Chat Start API: Error starting chat session:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to start chat session',
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
