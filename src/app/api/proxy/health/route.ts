import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.chhrone.web.id';

export async function GET(request: NextRequest) {
  try {
    console.log('Health Proxy: Checking API health via server-side proxy');
    
    const response = await fetch(`${REAL_API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    const data = await response.text();

    console.log(`Health Proxy: External API responded with status ${response.status}`, { data });

    return NextResponse.json({
      success: response.ok, // Only true if status is 2xx
      status: response.status,
      statusText: response.statusText,
      data: data,
      timestamp: Date.now(),
    }, {
      status: response.ok ? 200 : 503, // Return 503 for client if external API is not ok
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Health Proxy: Error checking API health:', error);
    console.error('Health Proxy: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    let errorMessage = 'Unknown error';
    let errorType = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Request timeout (10s)';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Network connection failed';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
        errorType = 'DNS_ERROR';
        errorMessage = 'DNS resolution failed';
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType: errorType,
      timestamp: Date.now(),
    }, {
      status: 503, // Service Unavailable
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
