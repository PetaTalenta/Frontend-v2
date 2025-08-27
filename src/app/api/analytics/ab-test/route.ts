/**
 * A/B Test Analytics API Endpoint
 * Handles A/B test data collection and analysis
 */

import { NextRequest, NextResponse } from 'next/server';

interface ABTestData {
  type: 'assignment' | 'result';
  testId: string;
  variantId: string;
  userId: string;
  sessionId?: string;
  metrics?: Record<string, number>;
  timestamp: number;
}

// In-memory storage for demo (use database in production)
const abTestData: ABTestData[] = [];
const MAX_ENTRIES = 10000;

export async function POST(request: NextRequest) {
  try {
    const body: ABTestData = await request.json();

    // Validate required fields
    if (!body.type || !body.testId || !body.variantId || !body.userId || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add metadata
    const enrichedData: ABTestData & { userAgent?: string; ip?: string } = {
      ...body,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
    };

    // Store data
    abTestData.push(enrichedData);

    // Limit memory usage
    if (abTestData.length > MAX_ENTRIES) {
      abTestData.splice(0, abTestData.length - MAX_ENTRIES);
    }

    // Log assignments and results
    if (body.type === 'assignment') {
      console.log(`A/B Test Assignment: User ${body.userId} assigned to ${body.variantId} in test ${body.testId}`);
    } else if (body.type === 'result') {
      console.log(`A/B Test Result: Test ${body.testId}, Variant ${body.variantId}, Metrics:`, body.metrics);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('A/B Test Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const type = searchParams.get('type');
    const analyze = searchParams.get('analyze') === 'true';

    let filteredData = abTestData;

    // Filter by test ID
    if (testId) {
      filteredData = filteredData.filter(item => item.testId === testId);
    }

    // Filter by type
    if (type) {
      filteredData = filteredData.filter(item => item.type === type);
    }

    if (analyze && testId) {
      // Perform statistical analysis
      const analysis = performStatisticalAnalysis(testId, filteredData);
      return NextResponse.json({ analysis });
    }

    // Generate summary
    const summary = generateSummary(filteredData);

    return NextResponse.json({
      data: filteredData.sort((a, b) => b.timestamp - a.timestamp),
      summary
    });

  } catch (error) {
    console.error('A/B Test Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Perform statistical analysis on A/B test data
 */
function performStatisticalAnalysis(testId: string, data: ABTestData[]) {
  const assignments = data.filter(item => item.type === 'assignment' && item.testId === testId);
  const results = data.filter(item => item.type === 'result' && item.testId === testId);

  // Group by variant
  const variantStats: Record<string, any> = {};

  assignments.forEach(assignment => {
    if (!variantStats[assignment.variantId]) {
      variantStats[assignment.variantId] = {
        assignments: 0,
        results: 0,
        metrics: {}
      };
    }
    variantStats[assignment.variantId].assignments++;
  });

  results.forEach(result => {
    if (!variantStats[result.variantId]) {
      variantStats[result.variantId] = {
        assignments: 0,
        results: 0,
        metrics: {}
      };
    }
    
    variantStats[result.variantId].results++;
    
    // Aggregate metrics
    if (result.metrics) {
      Object.entries(result.metrics).forEach(([metric, value]) => {
        if (!variantStats[result.variantId].metrics[metric]) {
          variantStats[result.variantId].metrics[metric] = {
            values: [],
            sum: 0,
            count: 0
          };
        }
        
        variantStats[result.variantId].metrics[metric].values.push(value);
        variantStats[result.variantId].metrics[metric].sum += value;
        variantStats[result.variantId].metrics[metric].count++;
      });
    }
  });

  // Calculate statistics for each variant
  Object.keys(variantStats).forEach(variantId => {
    const variant = variantStats[variantId];
    variant.conversionRate = variant.assignments > 0 ? 
      (variant.results / variant.assignments) * 100 : 0;

    // Calculate metric statistics
    Object.keys(variant.metrics).forEach(metric => {
      const metricData = variant.metrics[metric];
      metricData.average = metricData.count > 0 ? metricData.sum / metricData.count : 0;
      
      // Calculate standard deviation
      if (metricData.values.length > 1) {
        const variance = metricData.values.reduce((sum, value) => {
          return sum + Math.pow(value - metricData.average, 2);
        }, 0) / (metricData.values.length - 1);
        
        metricData.standardDeviation = Math.sqrt(variance);
        metricData.standardError = metricData.standardDeviation / Math.sqrt(metricData.values.length);
        
        // 95% confidence interval
        const tValue = 1.96; // Approximate for large samples
        const margin = tValue * metricData.standardError;
        metricData.confidenceInterval = [
          metricData.average - margin,
          metricData.average + margin
        ];
      }
    });
  });

  // Determine statistical significance (simplified)
  const variants = Object.keys(variantStats);
  let statisticalSignificance = 0;
  let winner = null;

  if (variants.length === 2) {
    const [variantA, variantB] = variants;
    const statsA = variantStats[variantA];
    const statsB = variantStats[variantB];

    // Simple z-test for conversion rates
    if (statsA.assignments >= 30 && statsB.assignments >= 30) {
      const p1 = statsA.results / statsA.assignments;
      const p2 = statsB.results / statsB.assignments;
      const pooledP = (statsA.results + statsB.results) / (statsA.assignments + statsB.assignments);
      
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1/statsA.assignments + 1/statsB.assignments));
      const zScore = Math.abs(p1 - p2) / se;
      
      // Convert z-score to p-value (approximation)
      statisticalSignificance = Math.max(0, Math.min(1, 1 - (zScore / 3))); // Simplified
      
      if (statisticalSignificance < 0.05) {
        winner = p1 > p2 ? variantA : variantB;
      }
    }
  }

  return {
    testId,
    variants: variantStats,
    statisticalSignificance,
    confidenceLevel: (1 - statisticalSignificance) * 100,
    winner,
    recommendation: generateRecommendation(variantStats, winner, statisticalSignificance),
    sampleSize: assignments.length,
    totalResults: results.length
  };
}

/**
 * Generate summary statistics
 */
function generateSummary(data: ABTestData[]) {
  const tests = new Set(data.map(item => item.testId));
  const users = new Set(data.map(item => item.userId));
  const variants = new Set(data.map(item => item.variantId));

  return {
    totalEntries: data.length,
    uniqueTests: tests.size,
    uniqueUsers: users.size,
    uniqueVariants: variants.size,
    assignments: data.filter(item => item.type === 'assignment').length,
    results: data.filter(item => item.type === 'result').length,
    timeRange: data.length > 0 ? {
      oldest: Math.min(...data.map(item => item.timestamp)),
      newest: Math.max(...data.map(item => item.timestamp))
    } : null
  };
}

/**
 * Generate recommendation based on analysis
 */
function generateRecommendation(variantStats: Record<string, any>, winner: string | null, significance: number): string {
  if (!winner) {
    if (significance > 0.05) {
      return 'No statistically significant difference found. Continue testing or increase sample size.';
    } else {
      return 'Insufficient data for reliable analysis. Continue collecting data.';
    }
  }

  const winnerStats = variantStats[winner];
  return `Variant ${winner} shows statistically significant improvement with ${winnerStats.conversionRate.toFixed(2)}% conversion rate. Consider implementing this variant.`;
}
