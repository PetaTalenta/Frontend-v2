/**
 * Data Transformation Utilities for Assessment Results API
 * 
 * This module provides comprehensive transformation functions to convert API responses
 * into component-friendly formats with proper validation, sanitization, and error handling.
 * 
 * Phase 2A Implementation: Core Transformation Functions
 */

import type {
  AssessmentResultData,
  AssessmentResultTransformed,
  AssessmentResultResponse,
  TestData,
  TestResult,
  CareerRecommendation,
  RoleModel,
  DevelopmentActivities,
  BookRecommendation,
  RiasecScores,
  OceanScores,
  ViaScores,
  AssessmentResultError
} from '../types/assessment-results';

// ============================================================================
// CORE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Main transformation function for assessment results
 * Converts API response to component-friendly format with calculated fields
 */
export function transformAssessmentResult(
  data: AssessmentResultData
): AssessmentResultTransformed {
  try {
    // Validate input data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid assessment result data: must be an object');
    }

    const { test_data, test_result, ...rest } = data;

    // Transform test_data with calculated totals
    const transformedTestData = transformScoresData(test_data);

    // Transform test_result with calculated counts
    const transformedTestResult = transformPersonaData(test_result);

    return {
      ...rest,
      test_data: transformedTestData,
      test_result: transformedTestResult,
    };
  } catch (error) {
    console.error('Error in transformAssessmentResult:', error);
    throw new AssessmentResultTransformationError(
      'Failed to transform assessment result',
      error as Error,
      { data }
    );
  }
}

/**
 * Transform career recommendation data for component consumption
 */
export function transformCareerData(
  careers: CareerRecommendation[]
): CareerRecommendation[] {
  try {
    if (!Array.isArray(careers)) {
      console.warn('transformCareerData: expected array, got', typeof careers);
      return [];
    }

    return careers
      .filter(career => career && typeof career === 'object')
      .map((career, index) => {
        // Sanitize and validate career data
        const sanitized: CareerRecommendation = {
          careerName: sanitizeString(career.careerName) || `Career ${index + 1}`,
          justification: sanitizeString(career.justification) || 'No justification provided',
          firstSteps: Array.isArray(career.firstSteps)
            ? career.firstSteps.filter((step: any) => typeof step === 'string').map(sanitizeString)
            : [],
          relatedMajors: Array.isArray(career.relatedMajors)
            ? career.relatedMajors.filter((major: any) => typeof major === 'string').map(sanitizeString)
            : [],
          careerProspect: {
            growth: sanitizeString(career.careerProspect?.growth) || 'Unknown',
            salary: sanitizeString(career.careerProspect?.salary) || 'Unknown',
            demand: sanitizeString(career.careerProspect?.demand) || 'Unknown',
          },
        };

        return sanitized;
      })
      .filter(career => career.careerName && career.careerName !== 'Career 1');
  } catch (error) {
    console.error('Error in transformCareerData:', error);
    throw new AssessmentResultTransformationError(
      'Failed to transform career data',
      error as Error,
      { careers }
    );
  }
}

/**
 * Transform persona/archetype data for component consumption
 */
export function transformPersonaData(testResult: TestResult): TestResult & {
  careerCount?: number;
  strengthCount?: number;
  weaknessCount?: number;
  insightCount?: number;
} {
  try {
    if (!testResult || typeof testResult !== 'object') {
      throw new Error('Invalid test result data: must be an object');
    }

    // Calculate counts for better component consumption
    const careerCount = Array.isArray(testResult.careerRecommendation) 
      ? testResult.careerRecommendation.length 
      : 0;
    const strengthCount = Array.isArray(testResult.strengths) 
      ? testResult.strengths.length 
      : 0;
    const weaknessCount = Array.isArray(testResult.weaknesses) 
      ? testResult.weaknesses.length 
      : 0;
    const insightCount = Array.isArray(testResult.insights) 
      ? testResult.insights.length 
      : 0;

    // Sanitize string fields
    const sanitized: TestResult = {
      archetype: sanitizeString(testResult.archetype) || 'Unknown',
      coreMotivators: Array.isArray(testResult.coreMotivators)
        ? testResult.coreMotivators.filter((m: any) => typeof m === 'string').map(sanitizeString)
        : [],
      learningStyle: sanitizeString(testResult.learningStyle) || 'Not specified',
      shortSummary: sanitizeString(testResult.shortSummary) || 'No summary available',
      strengthSummary: sanitizeString(testResult.strengthSummary) || 'No strength summary',
      strengths: Array.isArray(testResult.strengths)
        ? testResult.strengths.filter((s: any) => typeof s === 'string').map(sanitizeString)
        : [],
      weaknessSummary: sanitizeString(testResult.weaknessSummary) || 'No weakness summary',
      weaknesses: Array.isArray(testResult.weaknesses)
        ? testResult.weaknesses.filter((w: any) => typeof w === 'string').map(sanitizeString)
        : [],
      careerRecommendation: transformCareerData(testResult.careerRecommendation || []),
      insights: Array.isArray(testResult.insights)
        ? testResult.insights.filter((i: any) => typeof i === 'string').map(sanitizeString)
        : [],
      skillSuggestion: Array.isArray(testResult.skillSuggestion)
        ? testResult.skillSuggestion.filter((s: any) => typeof s === 'string').map(sanitizeString)
        : [],
      possiblePitfalls: Array.isArray(testResult.possiblePitfalls)
        ? testResult.possiblePitfalls.filter((p: any) => typeof p === 'string').map(sanitizeString)
        : [],
      riskTolerance: sanitizeString(testResult.riskTolerance) || 'moderate',
      workEnvironment: sanitizeString(testResult.workEnvironment) || 'Not specified',
      roleModel: transformRoleModels(testResult.roleModel || []),
      developmentActivities: transformDevelopmentActivities(testResult.developmentActivities || {}),
    };

    return {
      ...sanitized,
      careerCount,
      strengthCount,
      weaknessCount,
      insightCount,
    };
  } catch (error) {
    console.error('Error in transformPersonaData:', error);
    throw new AssessmentResultTransformationError(
      'Failed to transform persona data',
      error as Error,
      { testResult }
    );
  }
}

/**
 * Transform test scores data with calculated totals
 */
export function transformScoresData(testData: TestData): TestData & {
  riasec: RiasecScores & { total?: number };
  ocean: OceanScores & { total?: number };
  viaIs: ViaScores & { total?: number };
} {
  try {
    if (!testData || typeof testData !== 'object') {
      throw new Error('Invalid test data: must be an object');
    }

    // Validate and sanitize RIASEC scores
    const riasecScores = validateAndSanitizeScores(testData.riasec, {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    });

    // Validate and sanitize OCEAN scores
    const oceanScores = validateAndSanitizeScores(testData.ocean, {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0,
    });

    // Validate and sanitize VIA scores
    const viaScores = validateAndSanitizeScores(testData.viaIs, {
      creativity: 0,
      curiosity: 0,
      judgment: 0,
      loveOfLearning: 0,
      perspective: 0,
      bravery: 0,
      perseverance: 0,
      honesty: 0,
      zest: 0,
      love: 0,
      kindness: 0,
      socialIntelligence: 0,
      teamwork: 0,
      fairness: 0,
      leadership: 0,
      forgiveness: 0,
      humility: 0,
      prudence: 0,
      selfRegulation: 0,
      appreciationOfBeauty: 0,
      gratitude: 0,
      hope: 0,
      humor: 0,
      spirituality: 0,
    });

    // Calculate totals
    const riasecValues = Object.values(riasecScores) as number[];
    const oceanValues = Object.values(oceanScores) as number[];
    const viaValues = Object.values(viaScores) as number[];
    
    const riasecTotal = riasecValues.reduce((sum: number, score: number) => sum + score, 0);
    const oceanTotal = oceanValues.reduce((sum: number, score: number) => sum + score, 0);
    const viaTotal = viaValues.reduce((sum: number, score: number) => sum + score, 0);

    return {
      riasec: { ...riasecScores, total: riasecTotal },
      ocean: { ...oceanScores, total: oceanTotal },
      viaIs: { ...viaScores, total: viaTotal },
    };
  } catch (error) {
    console.error('Error in transformScoresData:', error);
    throw new AssessmentResultTransformationError(
      'Failed to transform scores data',
      error as Error,
      { testData }
    );
  }
}

// ============================================================================
// HELPER TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform role model data
 */
function transformRoleModels(roleModels: RoleModel[]): RoleModel[] {
  if (!Array.isArray(roleModels)) {
    return [];
  }

  return roleModels
    .filter(model => model && typeof model === 'object')
    .map(model => ({
      name: sanitizeString(model.name) || 'Unknown',
      title: sanitizeString(model.title) || 'Role Model',
    }));
}

/**
 * Transform development activities data
 */
function transformDevelopmentActivities(activities: DevelopmentActivities): DevelopmentActivities {
  return {
    extracurricular: Array.isArray(activities.extracurricular)
      ? activities.extracurricular.filter((a: any) => typeof a === 'string').map(sanitizeString)
      : [],
    bookRecommendations: Array.isArray(activities.bookRecommendations)
      ? activities.bookRecommendations
          .filter((book: any) => book && typeof book === 'object')
          .map((book: any) => ({
            title: sanitizeString(book.title) || 'Unknown Book',
            author: sanitizeString(book.author) || 'Unknown Author',
            reason: sanitizeString(book.reason) || 'No reason provided',
          }))
      : [],
  };
}

// ============================================================================
// DATA VALIDATION & SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Validate and sanitize score objects
 */
function validateAndSanitizeScores<T extends Record<string, number>>(
  scores: T,
  defaults: T
): T {
  const sanitized: Partial<T> = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = scores[key as keyof T];
    
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      // Ensure score is within valid range (0-100)
      sanitized[key as keyof T] = Math.max(0, Math.min(100, value)) as T[keyof T];
    } else {
      (sanitized as any)[key] = defaultValue;
      console.warn(`Invalid score for ${key}:`, value, 'using default:', defaultValue);
    }
  }

  return sanitized as T;
}

/**
 * Sanitize string data to prevent XSS and ensure consistency
 */
export function sanitizeString(input: any): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and potential XSS vectors
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Normalize whitespace
  sanitized = sanitized
    .replace(/\s+/g, ' ')
    .trim();

  // Limit length to prevent abuse
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
    console.warn('String truncated due to excessive length:', input.length);
  }

  return sanitized;
}

/**
 * Validate transformed data structure
 */
export function validateTransformedData(data: AssessmentResultTransformed): boolean {
  try {
    // Check required top-level fields
    if (!data.id || !data.user_id || !data.test_data || !data.test_result) {
      console.error('Missing required fields in transformed data');
      return false;
    }

    // Validate test_data structure
    if (!data.test_data.riasec || !data.test_data.ocean || !data.test_data.viaIs) {
      console.error('Missing test data sections');
      return false;
    }

    // Validate test_result structure
    if (!data.test_result.archetype) {
      console.error('Missing archetype in test result');
      return false;
    }

    // Validate score ranges
    const allScores = [
      ...Object.values(data.test_data.riasec),
      ...Object.values(data.test_data.ocean),
      ...Object.values(data.test_data.viaIs),
    ];

    for (const score of allScores) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        console.error('Invalid score detected:', score);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating transformed data:', error);
    return false;
  }
}

/**
 * Sanitize API response data before transformation
 */
export function sanitizeApiData(data: any): AssessmentResultData | null {
  try {
    if (!data || typeof data !== 'object') {
      console.error('Invalid API data: not an object');
      return null;
    }

    // Basic structure validation
    const requiredFields = ['id', 'user_id', 'test_data', 'test_result'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Missing required field: ${field}`);
        return null;
      }
    }

    // Sanitize string fields
    const sanitized: Partial<AssessmentResultData> = {
      id: sanitizeString(data.id),
      user_id: sanitizeString(data.user_id),
      status: ['completed', 'pending', 'failed'].includes(data.status) 
        ? data.status 
        : 'pending',
      error_message: sanitizeString(data.error_message),
      assessment_name: sanitizeString(data.assessment_name),
      is_public: Boolean(data.is_public),
      chatbot_id: sanitizeString(data.chatbot_id),
      created_at: sanitizeString(data.created_at),
      updated_at: sanitizeString(data.updated_at),
    };

    return sanitized as AssessmentResultData;
  } catch (error) {
    console.error('Error sanitizing API data:', error);
    return null;
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Memoization cache for transformation functions
 */
const transformationCache = new Map<string, any>();

/**
 * Memoized version of transformAssessmentResult
 */
export function transformAssessmentResultMemoized(
  data: AssessmentResultData
): AssessmentResultTransformed {
  const cacheKey = `assessment_${data.id}_${data.updated_at}`;
  
  if (transformationCache.has(cacheKey)) {
    return transformationCache.get(cacheKey);
  }

  const result = transformAssessmentResult(data);
  transformationCache.set(cacheKey, result);
  
  // Limit cache size
  if (transformationCache.size > 100) {
    const firstKey = transformationCache.keys().next().value;
    if (firstKey) {
      transformationCache.delete(firstKey);
    }
  }

  return result;
}

/**
 * Clear transformation cache
 */
export function clearTransformationCache(): void {
  transformationCache.clear();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for transformation failures
 */
class AssessmentResultTransformationError extends Error {
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, originalError: Error, details?: any) {
    super(message);
    this.name = 'AssessmentResultTransformationError';
    this.code = 'TRANSFORMATION_ERROR';
    this.details = details;
    
    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssessmentResultTransformationError);
    }
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Batch transformation utilities
 */
export const batchTransformations = {
  /**
   * Transform multiple assessment results
   */
  assessmentResults: (results: AssessmentResultData[]): AssessmentResultTransformed[] => {
    return results
      .filter(data => data && typeof data === 'object')
      .map(data => transformAssessmentResultMemoized(data))
      .filter(data => validateTransformedData(data));
  },

  /**
   * Transform multiple career arrays
   */
  careers: (careerArrays: CareerRecommendation[][]): CareerRecommendation[][] => {
    return careerArrays.map(careers => transformCareerData(careers));
  },
};

/**
 * Transformation statistics for monitoring
 */
export function getTransformationStats(): {
  cacheSize: number;
  cacheKeys: string[];
} {
  return {
    cacheSize: transformationCache.size,
    cacheKeys: Array.from(transformationCache.keys()),
  };
}

// Export all transformation functions
export {
  transformAssessmentResult as default,
};