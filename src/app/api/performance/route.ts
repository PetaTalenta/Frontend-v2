import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMetric } from '../../../lib/performance';

// In-memory storage for performance metrics (in production, use a database)
const performanceMetrics: Array<{
  metric: PerformanceMetric;
  buildInfo: any;
  url: string;
  timestamp: number;
  userAgent: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.metric || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, timestamp' },
        { status: 400 }
      );
    }

    // Store the metric
    const metricEntry = {
      metric: body.metric,
      buildInfo: body.buildInfo,
      url: body.url,
      timestamp: body.timestamp,
      userAgent: body.userAgent
    };

    performanceMetrics.push(metricEntry);

    // Keep only last 1000 metrics to prevent memory issues
    if (performanceMetrics.length > 1000) {
      performanceMetrics.splice(0, performanceMetrics.length - 1000);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance API] Received metric:', body.metric.name, body.metric.value);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Metric recorded successfully',
      totalMetrics: performanceMetrics.length 
    });

  } catch (error) {
    console.error('[Performance API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return aggregated performance data
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const recentMetrics = performanceMetrics.slice(-limit);
    
    // Aggregate metrics by name
    const aggregated = recentMetrics.reduce((acc, entry) => {
      const name = entry.metric.name;
      if (!acc[name]) {
        acc[name] = {
          count: 0,
          total: 0,
          good: 0,
          needsImprovement: 0,
          poor: 0,
          values: []
        };
      }
      
      acc[name].count++;
      acc[name].total += entry.metric.value;
      acc[name].values.push(entry.metric.value);
      
      switch (entry.metric.rating) {
        case 'good':
          acc[name].good++;
          break;
        case 'needs-improvement':
          acc[name].needsImprovement++;
          break;
        case 'poor':
          acc[name].poor++;
          break;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and percentages
    Object.keys(aggregated).forEach(name => {
      const data = aggregated[name];
      data.average = data.total / data.count;
      data.goodPercentage = (data.good / data.count) * 100;
      data.needsImprovementPercentage = (data.needsImprovement / data.count) * 100;
      data.poorPercentage = (data.poor / data.count) * 100;
      data.min = Math.min(...data.values);
      data.max = Math.max(...data.values);
      
      // Clean up values array for response
      delete data.values;
    });

    return NextResponse.json({
      totalMetrics: performanceMetrics.length,
      recentMetricsCount: recentMetrics.length,
      aggregated,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Performance API] Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}