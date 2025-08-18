// Assessment API Service
// Handles submission and retrieval of assessment results

import { AssessmentResult, AssessmentScores, convertScoresToApiData } from '../types/assessment-results';
import { calculateAllScores, validateAnswers } from '../utils/assessment-calculations';
import { generateApiOnlyAnalysis } from './ai-analysis';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Submit assessment answers and get analysis
 */
export async function submitAssessment(
  answers: Record<number, number | null>,
  userId?: string,
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<{ resultId: string; status: string; personaTitle?: string }> {
  // Validate answers
  const validation = validateAnswers(answers);
  if (!validation.isValid) {
    throw new Error(`Missing ${validation.missingQuestions.length} answers. Please complete all questions.`);
  }

  // Reduced API call delay for faster response
  await delay(500);

  // Calculate scores
  const scores = calculateAllScores(answers);

  // Generate result ID
  const resultId = 'result-' + Date.now().toString(36);

  // Generate AI analysis based on scores
  const aiAnalysis = await generateApiOnlyAnalysis(scores);

  // Create result with AI-generated analysis
  const result: AssessmentResult = {
    id: resultId,
    userId: userId || 'anonymous-user',
    createdAt: new Date().toISOString(),
    status: 'completed',
    assessment_data: convertScoresToApiData(scores),
    persona_profile: aiAnalysis
  };

  console.log(`AssessmentAPI: Assessment result ${resultId} created for user ${userId || 'anonymous'} - will be saved via API`);

  // Refresh token balance after successful submission
  if (onTokenBalanceUpdate) {
    try {
      console.log('AssessmentAPI: Refreshing token balance after submission...');
      await onTokenBalanceUpdate();
    } catch (error) {
      console.error('AssessmentAPI: Error refreshing token balance:', error);
    }
  }

  return {
    resultId,
    status: 'processing',
    personaTitle: aiAnalysis.title
  };
}

/**
 * Submit assessment answers with flexible validation (allows partial completion)
 */
export async function submitAssessmentFlexible(
  answers: Record<number, number | null>,
  userId?: string,
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<{ resultId: string; status: string; personaTitle?: string }> {
  // Check if we have enough answers to generate meaningful results
  const validation = validateAnswers(answers);
  const completionRate = validation.answeredQuestions / validation.totalQuestions;

  if (completionRate < 0.5) {
    throw new Error(`Insufficient answers. Please complete at least 50% of questions (${Math.ceil(validation.totalQuestions * 0.5)} questions).`);
  }

  // Reduced API call delay for faster response
  await delay(500);

  // Calculate scores (will handle missing answers gracefully)
  const scores = calculateAllScores(answers);

  // Generate result ID
  const resultId = 'result-' + Date.now().toString(36);

  // Generate AI analysis based on scores
  const aiAnalysis = await generateApiOnlyAnalysis(scores);

  // Create result with AI-generated analysis
  const result: AssessmentResult = {
    id: resultId,
    userId: userId || 'anonymous-user',
    createdAt: new Date().toISOString(),
    status: 'completed',
    assessment_data: convertScoresToApiData(scores),
    persona_profile: aiAnalysis
  };

  console.log(`AssessmentAPI: Flexible assessment result ${resultId} created for user ${userId || 'anonymous'} - will be saved via API`);

  // Refresh token balance after successful submission
  if (onTokenBalanceUpdate) {
    try {
      console.log('AssessmentAPI: Refreshing token balance after flexible submission...');
      await onTokenBalanceUpdate();
    } catch (error) {
      console.error('AssessmentAPI: Error refreshing token balance:', error);
    }
  }

  return {
    resultId,
    status: 'processing',
    personaTitle: aiAnalysis.title
  };
}

/**
 * Get assessment result by ID (now redirects to Archive API)
 * @deprecated Use getAssessmentResultFromArchiveAPI instead
 */
export async function getAssessmentResult(resultId: string): Promise<AssessmentResult> {
  console.log(`getAssessmentResult: Redirecting to Archive API for ID: ${resultId}`);
  return getAssessmentResultFromArchiveAPI(resultId);
}

/**
 * Get all assessment results for a user (now uses Archive API)
 * @deprecated This function should use the Archive API /api/archive/results endpoint
 */
export async function getUserAssessmentResults(userId?: string): Promise<AssessmentResult[]> {
  console.log(`getUserAssessmentResults: This function should be replaced with Archive API call`);

  try {
    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.warn('getUserAssessmentResults: No auth token found, returning empty array');
      return [];
    }

    // Call the proxy API endpoint for all results
    const response = await fetch('/api/proxy/archive/results', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('getUserAssessmentResults: API request failed with status', response.status, errorText);
      return [];
    }

    const apiResponse = await response.json();
    console.log('getUserAssessmentResults: Raw API response:', JSON.stringify(apiResponse, null, 2));

    if (!apiResponse.success || !apiResponse.data || !apiResponse.data.results) {
      console.error('getUserAssessmentResults: Invalid API response format', apiResponse);
      return [];
    }

    // Check if results is an array
    if (!Array.isArray(apiResponse.data.results)) {
      console.error('getUserAssessmentResults: API response data.results is not an array', typeof apiResponse.data.results);
      return [];
    }

    // Transform API response to AssessmentResult format
    const results: AssessmentResult[] = apiResponse.data.results.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      createdAt: item.created_at,
      status: item.status,
      assessment_data: item.assessment_data,
      persona_profile: item.persona_profile
    }));

    console.log(`getUserAssessmentResults: Returning ${results.length} results from Archive API`);
    return results;

  } catch (error) {
    console.error('getUserAssessmentResults: Error fetching from Archive API:', error);

    // Log additional error details
    if (error instanceof Error) {
      console.error('getUserAssessmentResults: Error message:', error.message);
      console.error('getUserAssessmentResults: Error stack:', error.stack);
    }

    return [];
  }
}

/**
 * Check assessment processing status
 */
export async function checkAssessmentStatus(resultId: string): Promise<{
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
}> {
  // Simulate API call delay
  await delay(300);

  try {
    const result = await getAssessmentResult(resultId);
    return {
      status: result.status,
      progress: result.status === 'completed' ? 100 : 
               result.status === 'processing' ? 75 : 
               result.status === 'queued' ? 25 : 0
    };
  } catch (error) {
    return { status: 'failed' };
  }
}

/**
 * Get the latest assessment result for a user
 */
export async function getLatestAssessmentResult(userId?: string): Promise<AssessmentResult | null> {
  console.log(`getLatestAssessmentResult: Getting latest result for user: ${userId || 'anonymous'}`);

  try {
    const results = await getUserAssessmentResults(userId);

    if (results.length === 0) {
      console.log('getLatestAssessmentResult: No results found, returning null');
      return null;
    }

    const latestResult = results[0]; // Results are already sorted by creation date (newest first)
    console.log(`getLatestAssessmentResult: Returning latest result: ${latestResult.id} created at ${latestResult.createdAt}`);

    return latestResult;
  } catch (error) {
    console.error('getLatestAssessmentResult: Error getting latest result:', error);
    return null;
  }
}

/**
 * Delete assessment result
 * @deprecated This function should use the Archive API DELETE endpoint when available
 */
export async function deleteAssessmentResult(resultId: string): Promise<void> {
  console.log(`deleteAssessmentResult: Delete functionality should be implemented via Archive API for ID: ${resultId}`);
  // Note: Archive API DELETE endpoint not yet implemented
  throw new Error('Delete functionality not yet implemented for Archive API');
}

/**
 * Get assessment result directly from API (Archive Service) with retry mechanism
 * This replaces localStorage-based retrieval for real-time data
 */
export async function getAssessmentResultFromArchiveAPI(resultId: string, maxRetries: number = 3): Promise<AssessmentResult> {
  console.log(`getAssessmentResultFromArchiveAPI: Fetching result ${resultId} from Archive API (max retries: ${maxRetries})`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log(`getAssessmentResultFromArchiveAPI: Attempt ${attempt}/${maxRetries} for result ${resultId}`);

      // Call the proxy API endpoint
      const response = await fetch(`/api/proxy/archive/results/${resultId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`getAssessmentResultFromArchiveAPI: API request failed with status ${response.status}:`, errorText);

        // If it's a 404 and we have retries left, wait and try again
        if (response.status === 404 && attempt < maxRetries) {
          console.log(`getAssessmentResultFromArchiveAPI: Result not found, waiting 3 seconds before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }

        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const apiResponse = await response.json();
      console.log('getAssessmentResultFromArchiveAPI: Raw API response:', JSON.stringify(apiResponse, null, 2));

      if (!apiResponse.success || !apiResponse.data) {
        console.error('getAssessmentResultFromArchiveAPI: Invalid API response format:', apiResponse);
        throw new Error('Invalid API response format');
      }

      const data = apiResponse.data;

      // Transform API response to AssessmentResult format
      const result: AssessmentResult = {
        id: data.id,
        userId: data.user_id,
        createdAt: data.created_at,
        status: data.status,
        assessment_data: data.assessment_data,
        persona_profile: data.persona_profile
      };

      console.log(`getAssessmentResultFromArchiveAPI: Successfully fetched result ${resultId} on attempt ${attempt}`);
      return result;

    } catch (error) {
      console.error(`getAssessmentResultFromArchiveAPI: Attempt ${attempt}/${maxRetries} failed for result ${resultId}:`, error);

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Otherwise, wait before next retry (except for auth errors)
      if (error instanceof Error && !error.message.includes('Authentication token not found')) {
        console.log(`getAssessmentResultFromArchiveAPI: Waiting 2 seconds before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Auth errors shouldn't be retried
        throw error;
      }
    }
  }

  // This should never be reached, but just in case
  throw new Error(`Failed to fetch result ${resultId} after ${maxRetries} attempts`);
}

/**
 * Generate AI analysis for assessment scores
 * Now uses the comprehensive AI analysis system
 */
export async function generateAIAnalysis(scores: AssessmentScores): Promise<{
  personaTitle: string;
  description: string;
  strengths: string[];
  recommendations: string[];
}> {
  const analysis = await generateApiOnlyAnalysis(scores);

  return {
    personaTitle: analysis.title,
    description: analysis.description,
    strengths: analysis.strengths,
    recommendations: analysis.recommendations
  };
}

/**
 * Export assessment result as PDF (placeholder)
 */
export async function exportResultAsPDF(resultId: string): Promise<Blob> {
  // Simulate PDF generation delay
  await delay(1500);

  // In a real app, this would generate an actual PDF
  // For demo, we'll return a simple text blob
  const result = await getAssessmentResult(resultId);
  const content = `
Assessment Result Report
========================

Persona: ${result.persona_profile.title}
Date: ${new Date(result.createdAt).toLocaleDateString('id-ID')}

Description:
${result.persona_profile.description}

Top Strengths:
${result.persona_profile.strengths.map(s => `• ${s}`).join('\n')}

Career Recommendations:
${result.persona_profile.careerRecommendation.map(c => `• ${c.careerName} (${c.matchPercentage}% match)`).join('\n')}

Role Models:
${result.persona_profile.roleModel.join(', ')}
  `;

  return new Blob([content], { type: 'text/plain' });
}
