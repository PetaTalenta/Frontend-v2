import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.futureguide.id';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Assessment Proxy: Forwarding assessment submission to real API');
    
    const response = await fetch(`${REAL_API_BASE_URL}/api/assessment/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30 seconds for assessment submission
    });

    const data = await response.json();

    console.log(`Assessment Submit Proxy: External API responded with status ${response.status}`, {
      success: data.success,
      jobId: data.data?.jobId,
      message: data.message
    });

    // Return the response as-is from the real API
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Assessment Proxy: Error submitting assessment:', error);
    
    let errorMessage = 'Unknown error';
    let errorType = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Request timeout (30s)';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'queue/status';
    
    console.log(`Assessment Proxy: Forwarding GET request to ${endpoint}`);
    
    const response = await fetch(`${REAL_API_BASE_URL}/api/assessment/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();

    // Return the real API response directly to avoid double-wrapping
    // Add proxy metadata only if needed for debugging
    const responseData = {
      ...data,
      _proxy: {
        timestamp: Date.now(),
        source: 'real-api'
      }
    };

    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Assessment Proxy: Error in GET request:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
