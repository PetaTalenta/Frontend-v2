import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.chhrone.web.id';

export async function POST(request: NextRequest) {
  try {
    console.log('Auth Change Password Proxy: Forwarding change password request to real API');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization header required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Current password and new password are required' 
          } 
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();
    
    console.log(`Auth Change Password Proxy: External API responded with status ${response.status}`, { 
      success: data.success,
      message: data.message 
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth Change Password Proxy: Error forwarding change password request:', error);
    
    // Return mock success for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Change Password Proxy: Returning mock success for development');
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to change password' 
        } 
      },
      { status: 500 }
    );
  }
}
