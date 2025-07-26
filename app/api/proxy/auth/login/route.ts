import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.chhrone.web.id';

export async function POST(request: NextRequest) {
  try {
    console.log('Auth Login Proxy: Forwarding login request to real API');
    
    const body = await request.json();
    
    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();
    
    console.log(`Auth Login Proxy: External API responded with status ${response.status}`, { 
      success: data.success,
      message: data.message 
    });
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Auth Login Proxy: Error forwarding login request:', error);
    
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
