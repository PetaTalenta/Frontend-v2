import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.chhrone.web.id';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    console.log(`Assessment Status Proxy: Checking status for job ${jobId}`);
    
    const response = await fetch(`${REAL_API_BASE_URL}/api/assessment/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
        // Forward authorization header if present
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
    console.error(`Assessment Status Proxy: Error checking status for job:`, error);
    
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
      error: errorMessage,
      errorType: errorType,
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
