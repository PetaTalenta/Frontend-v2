/**
 * RUM Analytics API Endpoint
 * Handles Real User Monitoring data collection
 */

import { NextRequest, NextResponse } from 'next/server';

interface RUMData {
  type: 'metrics' | 'interactions' | 'errors';
  data: any;
  sessionId: string;
  timestamp: number;
}

// In-memory storage for demo (use database in production)
const rumData: RUMData[] = [];
const MAX_ENTRIES = 10000; // Limit memory usage

export async function POST(request: NextRequest) {
  try {
    const body: RUMData = await request.json();

    // Validate required fields
    if (!body.type || !body.data || !body.sessionId || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add metadata
    const enrichedData: RUMData & { userAgent?: string; ip?: string } = {
      ...body,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
    };

    // Store data (in production, save to database)
    rumData.push(enrichedData);

    // Limit memory usage
    if (rumData.length > MAX_ENTRIES) {
      rumData.splice(0, rumData.length - MAX_ENTRIES);
    }

    // Log important events
    if (body.type === 'errors') {
      console.error('RUM Error:', body.data);
    } else if (body.type === 'metrics') {
      console.log('RUM Metric:', body.data);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('RUM Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let filteredData = rumData;

    // Filter by type
    if (type) {
      filteredData = filteredData.filter(item => item.type === type);
    }

    // Filter by session
    if (sessionId) {
      filteredData = filteredData.filter(item => item.sessionId === sessionId);
    }

    // Limit results
    const results = filteredData
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Generate summary statistics
    const summary = {
      totalEntries: rumData.length,
      filteredEntries: results.length,
      types: {
        metrics: rumData.filter(item => item.type === 'metrics').length,
        interactions: rumData.filter(item => item.type === 'interactions').length,
        errors: rumData.filter(item => item.type === 'errors').length
      },
      uniqueSessions: new Set(rumData.map(item => item.sessionId)).size,
      timeRange: rumData.length > 0 ? {
        oldest: Math.min(...rumData.map(item => item.timestamp)),
        newest: Math.max(...rumData.map(item => item.timestamp))
      } : null
    };

    return NextResponse.json({
      data: results,
      summary
    });

  } catch (error) {
    console.error('RUM Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
