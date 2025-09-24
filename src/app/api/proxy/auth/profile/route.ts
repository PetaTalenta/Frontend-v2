import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.futureguide.id';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Profile Proxy: Forwarding GET profile request to real API');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization header required' } },
        { status: 401 }
      );
    }

    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();
    
    console.log(`Auth Profile Proxy: External API responded with status ${response.status}`, {
      success: data.success,
      message: data.message
    });
    console.log('Auth Profile Proxy: Full response data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth Profile Proxy: Error forwarding GET profile request:', error);
    
    // Don't return mock data - let the error propagate
    console.log('Auth Profile Proxy: Real API failed, not using mock data in development');

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to get profile' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Auth Profile Proxy: Forwarding PUT profile request to real API');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization header required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Auth Profile Proxy: Request body received:', body);

    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Auth Profile Proxy: Failed to parse JSON response:', jsonError);
      const textResponse = await response.text();
      console.error('Auth Profile Proxy: Raw response text:', textResponse);

      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid response from server',
          details: textResponse
        }
      }, { status: response.status });
    }

    console.log(`Auth Profile Proxy: External API responded with status ${response.status}`);
    console.log('Auth Profile Proxy: Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Auth Profile Proxy: API error details:', JSON.stringify(data, null, 2));
      console.error('Auth Profile Proxy: Request body was:', JSON.stringify(body, null, 2));
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth Profile Proxy: Error forwarding PUT profile request:', error);
    
    // Don't return mock data - let the error propagate
    console.log('Auth Profile Proxy: Real API failed, not using mock data in development');

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to update profile' 
        } 
      },
      { status: 500 }
    );
  }
}
