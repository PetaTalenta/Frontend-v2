import { NextRequest, NextResponse } from 'next/server';

const ARCHIVE_API_BASE_URL = 'https://api.futureguide.id';

export async function GET(request: NextRequest) {
  console.log('Archive Results Proxy: Starting request forwarding...');
  
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('Archive Results Proxy: No authorization header found');
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      );
    }

    console.log('Archive Results Proxy: Authorization header present, forwarding to real API...');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Build target URL
    const targetUrl = `${ARCHIVE_API_BASE_URL}/api/archive/results${queryString ? '?' + queryString : ''}`;
    console.log('Archive Results Proxy: Target URL:', targetUrl);

    // Forward request to real API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('Archive Results Proxy: External API responded with status', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Archive Results Proxy: External API error:', errorText);
      return NextResponse.json(
        { success: false, message: 'External API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Archive Results Proxy: Raw response data:', data);

    // Return the response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Archive Results Proxy: Request failed:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
