import { NextRequest, NextResponse } from 'next/server';

// Mock API endpoint for registration when external API is down
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    console.log('Mock API: Registration attempt for:', email);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock registration logic matching real API response format
    if (email && password) {
      const mockUser = {
        id: 'mock-user-' + Date.now(),
        email: email,
        username: null,
        user_type: 'user',
        is_active: true,
        token_balance: 5,
        created_at: new Date().toISOString(),
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      return NextResponse.json({
        success: true,
        data: {
          token: mockToken,
          user: mockUser,
        },
        message: 'User registered successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Email and password are required',
        },
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Mock API: Registration error:', error);
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
