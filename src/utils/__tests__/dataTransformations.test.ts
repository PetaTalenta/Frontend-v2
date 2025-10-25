/**
 * Transformation Testing Utilities
 * 
 * Comprehensive test suite for data transformation functions
 * Phase 2A Implementation: Transformation Testing
 */

import {
  transformAssessmentResult,
  transformCareerData,
  transformPersonaData,
  transformScoresData,
  sanitizeString,
  validateTransformedData,
  sanitizeApiData,
  batchTransformations,
  transformAssessmentResultMemoized,
  clearTransformationCache,
  getTransformationStats,
} from '../dataTransformations';
import AssessmentResultTransformationError from '../dataTransformations';

import type {
  AssessmentResultData,
  TestData,
  TestResult,
  CareerRecommendation,
  RiasecScores,
  OceanScores,
  ViaScores,
} from '../../types/assessment-results';

// ============================================================================
// MOCK DATA FOR TESTING
// ============================================================================

const mockRiasecScores: RiasecScores = {
  realistic: 75,
  investigative: 85,
  artistic: 60,
  social: 70,
  enterprising: 80,
  conventional: 65,
};

const mockOceanScores: OceanScores = {
  openness: 80,
  conscientiousness: 75,
  extraversion: 70,
  agreeableness: 85,
  neuroticism: 45,
};

const mockViaScores: ViaScores = {
  creativity: 75,
  curiosity: 85,
  judgment: 70,
  loveOfLearning: 80,
  perspective: 75,
  bravery: 60,
  perseverance: 85,
  honesty: 90,
  zest: 70,
  love: 85,
  kindness: 80,
  socialIntelligence: 75,
  teamwork: 85,
  fairness: 90,
  leadership: 70,
  forgiveness: 75,
  humility: 80,
  prudence: 85,
  selfRegulation: 70,
  appreciationOfBeauty: 75,
  gratitude: 85,
  hope: 80,
  humor: 70,
  spirituality: 65,
};

const mockTestData: TestData = {
  riasec: mockRiasecScores,
  ocean: mockOceanScores,
  viaIs: mockViaScores,
};

const mockCareerRecommendations: CareerRecommendation[] = [
  {
    careerName: 'Software Developer',
    justification: 'Strong analytical and problem-solving skills',
    firstSteps: ['Learn programming languages', 'Build projects', 'Create portfolio'],
    relatedMajors: ['Computer Science', 'Software Engineering'],
    careerProspect: {
      growth: 'High',
      salary: 'Competitive',
      demand: 'Very High',
    },
  },
  {
    careerName: 'Data Scientist',
    justification: 'Excellent analytical and research abilities',
    firstSteps: ['Study statistics', 'Learn machine learning', 'Work on datasets'],
    relatedMajors: ['Data Science', 'Statistics', 'Mathematics'],
    careerProspect: {
      growth: 'Very High',
      salary: 'Excellent',
      demand: 'High',
    },
  },
];

const mockTestResult: TestResult = {
  archetype: 'The Innovator',
  coreMotivators: ['Creativity', 'Problem-solving', 'Learning'],
  learningStyle: 'Visual and hands-on learning',
  shortSummary: 'Creative problem-solver who loves innovation',
  strengthSummary: 'Strong analytical and creative thinking abilities',
  strengths: ['Analytical thinking', 'Creativity', 'Problem-solving'],
  weaknessSummary: 'May overlook details in favor of big picture',
  weaknesses: ['Impatience with routine', 'Overthinking'],
  careerRecommendation: mockCareerRecommendations,
  insights: ['Thrives in dynamic environments', 'Needs variety in work'],
  skillSuggestion: ['Project management', 'Attention to detail'],
  possiblePitfalls: ['Burnout from overcommitment', 'Analysis paralysis'],
  riskTolerance: 'moderate',
  workEnvironment: 'Collaborative and innovative',
  roleModel: [
    { name: 'Steve Jobs', title: 'Apple Co-founder' },
    { name: 'Elon Musk', title: 'Tesla CEO' },
  ],
  developmentActivities: {
    extracurricular: ['Hackathons', 'Open source projects'],
    bookRecommendations: [
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        reason: 'Improves decision-making skills',
      },
    ],
  },
};

const mockAssessmentResult: AssessmentResultData = {
  id: 'test-123',
  user_id: 'user-456',
  test_data: mockTestData,
  test_result: mockTestResult,
  status: 'completed',
  error_message: null,
  assessment_name: 'Comprehensive Assessment',
  is_public: false,
  chatbot_id: 'chat-789',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Performance benchmark utility
 */
export function benchmarkTransformation<T, R>(
  transformationFn: (data: T) => R,
  data: T,
  iterations: number = 1000
): { result: R; avgTime: number; totalTime: number } {
  const times: number[] = [];
  let result: R;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = transformationFn(data);
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / iterations;

  return {
    result: result!,
    avgTime,
    totalTime,
  };
}

/**
 * Generate test data with edge cases
 */
export function generateEdgeCaseData(): {
  emptyData: Partial<AssessmentResultData>;
  malformedData: any;
  extremeValues: AssessmentResultData;
  xssData: AssessmentResultData;
} {
  return {
    emptyData: {
      id: '',
      user_id: '',
      test_data: { riasec: {} as RiasecScores, ocean: {} as OceanScores, viaIs: {} as ViaScores },
      test_result: {} as TestResult,
      status: 'pending',
      error_message: null,
      assessment_name: '',
      is_public: false,
      created_at: '',
      updated_at: '',
    },
    malformedData: {
      id: null,
      user_id: undefined,
      test_data: 'not an object',
      test_result: null,
      status: 123,
      error_message: { nested: 'object' },
      assessment_name: [],
      is_public: 'not boolean',
      created_at: new Date(),
      updated_at: function() { return 'invalid'; },
    },
    extremeValues: {
      ...mockAssessmentResult,
      test_data: {
        riasec: {
          realistic: -10,
          investigative: 150,
          artistic: Infinity,
          social: -Infinity,
          enterprising: NaN,
          conventional: 0,
        },
        ocean: {
          openness: 100,
          conscientiousness: 0,
          extraversion: 50,
          agreeableness: 25,
          neuroticism: 75,
        },
        viaIs: Object.fromEntries(
          Object.entries(mockViaScores).map(([key, _]) => [key, Math.random() * 200 - 50])
        ) as unknown as ViaScores,
      },
    },
    xssData: {
      ...mockAssessmentResult,
      test_result: {
        ...mockTestResult,
        archetype: '<script>alert("xss")</script>',
        shortSummary: 'javascript:alert("xss")',
        strengths: [
          '<img src="x" onerror="alert(\'xss\')">',
          'Normal strength',
          '"><script>alert("xss")</script>',
        ],
        careerRecommendation: [
          {
            ...mockCareerRecommendations[0],
            careerName: '<div onclick="alert(\'xss\')">Click me</div>',
            justification: 'onmouseover="alert(\'xss\')"',
          },
        ],
      },
    },
  };
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test core transformation functions
 */
export function runTransformationTests(): {
  passed: number;
  failed: number;
  errors: string[];
  performance: any;
} {
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
    performance: {},
  };

  // Test 1: transformAssessmentResult
  try {
    const transformed = transformAssessmentResult(mockAssessmentResult);
    if (validateTransformedData(transformed)) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('transformAssessmentResult validation failed');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`transformAssessmentResult: ${error}`);
  }

  // Test 2: transformCareerData
  try {
    const transformed = transformCareerData(mockCareerRecommendations);
    if (Array.isArray(transformed) && transformed.length > 0) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('transformCareerData returned invalid array');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`transformCareerData: ${error}`);
  }

  // Test 3: transformPersonaData
  try {
    const transformed = transformPersonaData(mockTestResult);
    if (transformed.archetype && transformed.strengths && transformed.careerRecommendation) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('transformPersonaData missing required fields');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`transformPersonaData: ${error}`);
  }

  // Test 4: transformScoresData
  try {
    const transformed = transformScoresData(mockTestData);
    if (transformed.riasec.total && transformed.ocean.total && transformed.viaIs.total) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('transformScoresData missing calculated totals');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`transformScoresData: ${error}`);
  }

  // Test 5: Performance benchmarks
  try {
    const benchmark = benchmarkTransformation(transformAssessmentResult, mockAssessmentResult);
    (results.performance as any).transformAssessmentResult = {
      avgTime: benchmark.avgTime,
      totalTime: benchmark.totalTime,
      withinTarget: benchmark.avgTime < 10, // Target: <10ms
    };
    results.passed++;
  } catch (error) {
    results.failed++;
    results.errors.push(`Performance test: ${error}`);
  }

  return results;
}

/**
 * Test edge cases and error handling
 */
export function runEdgeCaseTests(): {
  passed: number;
  failed: number;
  errors: string[];
} {
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  };

  const edgeCases = generateEdgeCaseData();

  // Test 1: Empty data handling
  try {
    const transformed = transformAssessmentResult(edgeCases.emptyData as AssessmentResultData);
    if (transformed && typeof transformed === 'object') {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Empty data handling failed');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`Empty data: ${error}`);
  }

  // Test 2: Malformed data handling
  try {
    transformAssessmentResult(edgeCases.malformedData);
    results.failed++;
    results.errors.push('Should have thrown error for malformed data');
  } catch (error) {
    if (error instanceof AssessmentResultTransformationError) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(`Wrong error type for malformed data: ${error}`);
    }
  }

  // Test 3: Extreme values handling
  try {
    const transformed = transformScoresData(edgeCases.extremeValues.test_data);
    const allValid = Object.values(transformed.riasec).every(score => score >= 0 && score <= 100) &&
                      Object.values(transformed.ocean).every(score => score >= 0 && score <= 100) &&
                      Object.values(transformed.viaIs).every(score => score >= 0 && score <= 100);
    
    if (allValid) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Extreme values not properly clamped');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`Extreme values: ${error}`);
  }

  // Test 4: XSS sanitization
  try {
    const transformed = transformPersonaData(edgeCases.xssData.test_result);
    const hasXss = JSON.stringify(transformed).includes('<script>') ||
                   JSON.stringify(transformed).includes('javascript:') ||
                   JSON.stringify(transformed).includes('onerror=');
    
    if (!hasXss) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('XSS sanitization failed');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`XSS sanitization: ${error}`);
  }

  return results;
}

/**
 * Test sanitization functions
 */
export function runSanitizationTests(): {
  passed: number;
  failed: number;
  errors: string[];
} {
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Test 1: String sanitization
  const testStrings = [
    { input: '<script>alert("xss")</script>', expected: '' },
    { input: 'javascript:alert("xss")', expected: '' },
    { input: '<img src="x" onerror="alert(\'xss\')">', expected: '' },
    { input: 'Normal string', expected: 'Normal string' },
    { input: '  Extra   spaces  ', expected: 'Extra spaces' },
    { input: '', expected: '' },
    { input: null, expected: '' },
    { input: undefined, expected: '' },
    { input: 123, expected: '' },
  ];

  testStrings.forEach(({ input, expected }, index) => {
    try {
      const result = sanitizeString(input);
      if (result === expected) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`String ${index}: expected "${expected}", got "${result}"`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`String ${index}: ${error}`);
    }
  });

  // Test 2: API data sanitization
  try {
    const sanitized = sanitizeApiData(mockAssessmentResult);
    if (sanitized && sanitized.id === mockAssessmentResult.id) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('API data sanitization failed');
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`API sanitization: ${error}`);
  }

  return results;
}

/**
 * Test memoization and caching
 */
export function runCacheTests(): {
  passed: number;
  failed: number;
  errors: string[];
} {
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Clear cache first
    clearTransformationCache();

    // Test memoization
    const result1 = transformAssessmentResultMemoized(mockAssessmentResult);
    const result2 = transformAssessmentResultMemoized(mockAssessmentResult);
    
    if (result1 === result2) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Memoization not working');
    }

    // Test cache stats
    const stats = getTransformationStats();
    if (stats.cacheSize > 0) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Cache not populated');
    }

  } catch (error) {
    results.failed++;
    results.errors.push(`Cache test: ${error}`);
  }

  return results;
}

/**
 * Run all test suites
 */
export function runAllTests(): {
  transformation: any;
  edgeCases: any;
  sanitization: any;
  cache: any;
  summary: {
    totalPassed: number;
    totalFailed: number;
    totalErrors: string[];
    successRate: number;
  };
} {
  const transformation = runTransformationTests();
  const edgeCases = runEdgeCaseTests();
  const sanitization = runSanitizationTests();
  const cache = runCacheTests();

  const totalPassed = transformation.passed + edgeCases.passed + sanitization.passed + cache.passed;
  const totalFailed = transformation.failed + edgeCases.failed + sanitization.failed + cache.failed;
  const totalErrors = [...transformation.errors, ...edgeCases.errors, ...sanitization.errors, ...cache.errors];

  return {
    transformation,
    edgeCases,
    sanitization,
    cache,
    summary: {
      totalPassed,
      totalFailed,
      totalErrors,
      successRate: totalPassed / (totalPassed + totalFailed) * 100,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  mockAssessmentResult,
  mockTestData,
  mockTestResult,
  mockCareerRecommendations,
  mockRiasecScores,
  mockOceanScores,
  mockViaScores,
};

// Export test runner for external use
if (typeof window !== 'undefined') {
  (window as any).runTransformationTests = runAllTests;
}