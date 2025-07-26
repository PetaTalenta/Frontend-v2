import { NextRequest, NextResponse } from 'next/server';

// Mock token balance storage (in real app, this would be in database)
const mockTokenBalances = new Map<string, number>();

// Initialize with default balance for demo users
const DEFAULT_TOKEN_BALANCE = 10;

function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  // Extract user ID from mock token (in real app, you'd decode JWT)
  if (token.startsWith('mock-jwt-token-')) {
    return token; // Use token as user ID for simplicity
  }
  
  return null;
}

function getUserTokenBalance(userId: string): number {
  if (!mockTokenBalances.has(userId)) {
    mockTokenBalances.set(userId, DEFAULT_TOKEN_BALANCE);
  }
  return mockTokenBalances.get(userId) || 0;
}

function updateUserTokenBalance(userId: string, newBalance: number): void {
  mockTokenBalances.set(userId, Math.max(0, newBalance));
}

export async function GET(request: NextRequest) {
  try {
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

    const balance = getUserTokenBalance(userId);
    
    console.log(`Mock API: Token balance for user ${userId}: ${balance}`);

    return NextResponse.json({
      success: true,
      data: {
        userId: userId,
        tokenBalance: balance, // Match real API field name
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Mock API: Token balance error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// Export the functions for use in other API routes
export { getUserIdFromToken, getUserTokenBalance, updateUserTokenBalance };
