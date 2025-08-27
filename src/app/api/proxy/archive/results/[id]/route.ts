import { NextRequest, NextResponse } from 'next/server';

const ARCHIVE_API_BASE_URL = 'https://api.chhrone.web.id';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('Archive Result By ID Proxy: Starting request forwarding...');
  
  try {
    const { id } = await params;
    console.log(`Archive Result By ID Proxy: Fetching result for ID: ${id}`);
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('Archive Result By ID Proxy: No authorization header found');
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      );
    }

    console.log('Archive Result By ID Proxy: Authorization header present, forwarding to real API...');

    // Build target URL
    const targetUrl = `${ARCHIVE_API_BASE_URL}/api/archive/results/${id}`;
    console.log('Archive Result By ID Proxy: Target URL:', targetUrl);

    // Forward request to real API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('Archive Result By ID Proxy: External API responded with status', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Archive Result By ID Proxy: External API error:', errorText);
      return NextResponse.json(
        { success: false, message: 'External API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Archive Result By ID Proxy: Successfully fetched result data');

    // Return the response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Archive Result By ID Proxy: Request failed:', error);
    return NextResponse.json(
      { success: false, message: 'Proxy request failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
