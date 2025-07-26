import { NextRequest, NextResponse } from 'next/server';

// Mock API endpoint for development when external API is down
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Mock API: Login attempt for:', email);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication logic matching real API response format
    if (email && password) {
      // For demo purposes, accept any email/password combination
      // In real implementation, you would validate against a database

      const mockUser = {
        id: 'mock-user-' + Date.now(),
        email: email,
        username: email.split('@')[0], // Use email prefix as username
        user_type: 'user',
        is_active: true,
        token_balance: 5,
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      return NextResponse.json({
        success: true,
        data: {
          token: mockToken,
          user: mockUser,
        },
        message: 'Login successful',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email and password are required',
        },
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Mock API: Login error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
