import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.futureguide.id';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Token Balance Proxy: Starting token balance request forwarding...');

    // Get Authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('Auth Token Balance Proxy: Missing Authorization header');
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_AUTHORIZATION',
          message: 'Authorization header is required',
        },
      }, { status: 401 });
    }

    console.log('Auth Token Balance Proxy: Authorization header present, forwarding to real API...');
    console.log('Auth Token Balance Proxy: Target URL:', `${REAL_API_BASE_URL}/api/auth/token-balance`);

    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/token-balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    console.log(`Auth Token Balance Proxy: External API responded with status ${response.status}`);

    const data = await response.json();

    // Enhanced logging to see the actual response structure
    console.log('Auth Token Balance Proxy: Raw response data:', JSON.stringify(data, null, 2));
    console.log('Auth Token Balance Proxy: Response analysis:', {
      success: data.success,
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      tokenBalance: data.data?.tokenBalance,
      balance: data.data?.balance,
      userTokenBalance: data.data?.user?.token_balance,
      directTokenBalance: data.tokenBalance,
      directBalance: data.balance
    });

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Auth Token Balance Proxy: Error forwarding token balance request:', error);
    
    let errorMessage = 'Unknown error';
    let errorType = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Request timeout (15s)';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Network connection failed';
      }
    }

    return NextResponse.json({
      success: false,
      error: {
        code: errorType,
        message: errorMessage,
      },
      timestamp: Date.now(),
    }, {
      status: 503,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, Expires',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
