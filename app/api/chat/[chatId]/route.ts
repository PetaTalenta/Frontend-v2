import { NextRequest, NextResponse } from 'next/server';

// Mock chat sessions storage (shared with other chat routes)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    console.log('Chat Get API: Retrieving chat history');
    
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

    const { chatId } = await params;

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

    console.log(`Chat Get API: Retrieved chat history for ${chatId}`);

    return NextResponse.json({
      success: true,
      data: {
        chatId: chatSession.chatId,
        resultId: chatSession.resultId,
        assessmentType: chatSession.assessmentType,
        status: chatSession.status,
        messages: chatSession.messages,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
      },
      message: 'Chat history retrieved successfully',
    });

  } catch (error) {
    console.error('Chat Get API: Error retrieving chat history:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve chat history',
      },
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    console.log('Chat Delete API: Deleting chat session');
    
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

    const { chatId } = await params;

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

    // Delete chat session
    chatSessions.delete(chatId);

    console.log(`Chat Delete API: Deleted chat session ${chatId}`);

    return NextResponse.json({
      success: true,
      message: 'Chat session deleted successfully',
    });

  } catch (error) {
    console.error('Chat Delete API: Error deleting chat session:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete chat session',
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
