import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.futureguide.id';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Schools Proxy: Forwarding GET schools request to real API');
    
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params
    const queryString = searchParams.toString();
    const endpoint = `/api/auth/schools${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(`${REAL_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();
    console.log('Auth Schools Proxy: Real API responded with status:', response.status);
    console.log('Auth Schools Proxy: Response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth Schools Proxy: Error forwarding GET schools request:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch schools'
        }
      },
      { status: 500 }
    );
  }
}
