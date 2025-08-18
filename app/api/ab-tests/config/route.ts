/**
 * A/B Test Configuration API
 * Provides test configurations for the A/B testing framework
 */

import { NextRequest, NextResponse } from 'next/server';

// Sample A/B test configurations
const AB_TEST_CONFIGS = [
  {
    id: 'assessment_calculation_method',
    name: 'Assessment Calculation Method',
    description: 'Test Web Workers vs Main Thread for assessment calculations',
    variants: [
      {
        id: 'main_thread',
        name: 'Main Thread',
        description: 'Calculate assessments in main thread',
        allocation: 50,
        config: {
          useWebWorkers: false,
          useComlink: false
        },
        isControl: true
      },
      {
        id: 'web_workers',
        name: 'Web Workers',
        description: 'Calculate assessments using Web Workers with Comlink',
        allocation: 50,
        config: {
          useWebWorkers: true,
          useComlink: true
        },
        isControl: false
      }
    ],
    trafficAllocation: 100, // 100% of users
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    targetMetrics: ['pageLoadTime', 'assessmentCalculationTime', 'userExperience'],
    segmentationRules: [
      {
        type: 'browser',
        operator: 'not_in',
        value: ['ie', 'edge'] // Exclude older browsers that might not support workers
      }
    ],
    isActive: true
  },
  {
    id: 'cdn_optimization',
    name: 'CDN Asset Optimization',
    description: 'Test different CDN optimization strategies',
    variants: [
      {
        id: 'standard_cdn',
        name: 'Standard CDN',
        description: 'Basic CDN with standard caching',
        allocation: 50,
        config: {
          cdnOptimization: 'standard',
          imageOptimization: 'basic',
          cacheStrategy: 'standard'
        },
        isControl: true
      },
      {
        id: 'optimized_cdn',
        name: 'Optimized CDN',
        description: 'Advanced CDN with aggressive optimization',
        allocation: 50,
        config: {
          cdnOptimization: 'aggressive',
          imageOptimization: 'advanced',
          cacheStrategy: 'aggressive'
        },
        isControl: false
      }
    ],
    trafficAllocation: 50, // 50% of users
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-30'),
    targetMetrics: ['fcp', 'lcp', 'cls', 'pageLoadTime', 'bandwidth'],
    isActive: true
  },
  {
    id: 'performance_monitoring',
    name: 'Performance Monitoring Level',
    description: 'Test different levels of performance monitoring',
    variants: [
      {
        id: 'basic_monitoring',
        name: 'Basic Monitoring',
        description: 'Essential performance metrics only',
        allocation: 33,
        config: {
          monitoringLevel: 'basic',
          rumEnabled: false,
          detailedMetrics: false
        },
        isControl: true
      },
      {
        id: 'standard_monitoring',
        name: 'Standard Monitoring',
        description: 'Standard performance monitoring with RUM',
        allocation: 33,
        config: {
          monitoringLevel: 'standard',
          rumEnabled: true,
          detailedMetrics: false
        },
        isControl: false
      },
      {
        id: 'advanced_monitoring',
        name: 'Advanced Monitoring',
        description: 'Comprehensive monitoring with detailed metrics',
        allocation: 34,
        config: {
          monitoringLevel: 'advanced',
          rumEnabled: true,
          detailedMetrics: true
        },
        isControl: false
      }
    ],
    trafficAllocation: 25, // 25% of users
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    targetMetrics: ['performanceScore', 'userSatisfaction', 'errorRate'],
    isActive: true
  },
  {
    id: 'ui_optimization',
    name: 'UI Performance Optimization',
    description: 'Test different UI optimization strategies',
    variants: [
      {
        id: 'standard_ui',
        name: 'Standard UI',
        description: 'Current UI implementation',
        allocation: 50,
        config: {
          lazyLoading: false,
          componentOptimization: false,
          animationOptimization: false
        },
        isControl: true
      },
      {
        id: 'optimized_ui',
        name: 'Optimized UI',
        description: 'UI with lazy loading and optimizations',
        allocation: 50,
        config: {
          lazyLoading: true,
          componentOptimization: true,
          animationOptimization: true
        },
        isControl: false
      }
    ],
    trafficAllocation: 30, // 30% of users
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-05-31'),
    targetMetrics: ['fid', 'inp', 'cls', 'userInteractionTime'],
    segmentationRules: [
      {
        type: 'device',
        operator: 'contains',
        value: 'mobile'
      }
    ],
    isActive: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let configs = AB_TEST_CONFIGS;

    // Filter by test ID
    if (testId) {
      configs = configs.filter(config => config.id === testId);
    }

    // Filter active tests only
    if (activeOnly) {
      configs = configs.filter(config => config.isActive);
    }

    // Filter by date range (only return active tests)
    const now = new Date();
    configs = configs.filter(config => {
      const isInDateRange = now >= config.startDate && 
                           (!config.endDate || now <= config.endDate);
      return isInDateRange;
    });

    return NextResponse.json(configs);

  } catch (error) {
    console.error('A/B Test Config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newConfig = await request.json();

    // Validate required fields
    const requiredFields = ['id', 'name', 'variants', 'trafficAllocation', 'startDate', 'targetMetrics'];
    for (const field of requiredFields) {
      if (!newConfig[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate variants
    if (!Array.isArray(newConfig.variants) || newConfig.variants.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 variants are required' },
        { status: 400 }
      );
    }

    // Validate allocation percentages
    const totalAllocation = newConfig.variants.reduce((sum: number, variant: any) => sum + variant.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Variant allocations must sum to 100%' },
        { status: 400 }
      );
    }

    // Check if test ID already exists
    const existingTest = AB_TEST_CONFIGS.find(config => config.id === newConfig.id);
    if (existingTest) {
      return NextResponse.json(
        { error: 'Test ID already exists' },
        { status: 409 }
      );
    }

    // Add timestamps
    newConfig.startDate = new Date(newConfig.startDate);
    if (newConfig.endDate) {
      newConfig.endDate = new Date(newConfig.endDate);
    }

    // Add to configs (in production, save to database)
    AB_TEST_CONFIGS.push(newConfig);

    return NextResponse.json({ 
      success: true, 
      message: 'A/B test configuration created successfully',
      config: newConfig
    });

  } catch (error) {
    console.error('A/B Test Config POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedConfig = await request.json();

    if (!updatedConfig.id) {
      return NextResponse.json(
        { error: 'Test ID is required for updates' },
        { status: 400 }
      );
    }

    // Find existing config
    const configIndex = AB_TEST_CONFIGS.findIndex(config => config.id === updatedConfig.id);
    if (configIndex === -1) {
      return NextResponse.json(
        { error: 'Test configuration not found' },
        { status: 404 }
      );
    }

    // Update config (in production, update in database)
    AB_TEST_CONFIGS[configIndex] = {
      ...AB_TEST_CONFIGS[configIndex],
      ...updatedConfig,
      startDate: new Date(updatedConfig.startDate),
      endDate: updatedConfig.endDate ? new Date(updatedConfig.endDate) : undefined
    };

    return NextResponse.json({ 
      success: true, 
      message: 'A/B test configuration updated successfully',
      config: AB_TEST_CONFIGS[configIndex]
    });

  } catch (error) {
    console.error('A/B Test Config PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
