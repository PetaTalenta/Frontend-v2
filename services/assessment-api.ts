// Assessment API Service
// Handles submission and retrieval of assessment results

import { AssessmentResult, AssessmentScores } from '../types/assessment-results';
import { getMockResultById, generateMockResult } from '../data/mockAssessmentResults';
import { calculateAllScores, validateAnswers } from '../utils/assessment-calculations';
import { generateComprehensiveAnalysis } from './ai-analysis';

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

  // Simulate API call delay
  await delay(1000);

  // Calculate scores
  const scores = calculateAllScores(answers);

  // Generate result ID
  const resultId = 'result-' + Date.now().toString(36);

  // Generate AI analysis based on scores
  const aiAnalysis = await generateComprehensiveAnalysis(scores);

  // Create result with AI-generated analysis
  const result: AssessmentResult = {
    id: resultId,
    userId: userId || 'anonymous-user',
    createdAt: new Date().toISOString(),
    status: 'completed',
    assessment_data: scores,
    persona_profile: aiAnalysis
  };

  console.log(`AssessmentAPI: Saving assessment result ${resultId} for user ${userId || 'anonymous'}`);

  localStorage.setItem(`assessment-result-${resultId}`, JSON.stringify(result));

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

  // Simulate API call delay
  await delay(1000);

  // Calculate scores (will handle missing answers gracefully)
  const scores = calculateAllScores(answers);

  // Generate result ID
  const resultId = 'result-' + Date.now().toString(36);

  // Generate AI analysis based on scores
  const aiAnalysis = await generateComprehensiveAnalysis(scores);

  // Create result with AI-generated analysis
  const result: AssessmentResult = {
    id: resultId,
    userId: userId || 'anonymous-user',
    createdAt: new Date().toISOString(),
    status: 'completed',
    assessment_data: scores,
    persona_profile: aiAnalysis
  };

  console.log(`AssessmentAPI: Saving flexible assessment result ${resultId} for user ${userId || 'anonymous'}`);

  localStorage.setItem(`assessment-result-${resultId}`, JSON.stringify(result));

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
 * Get assessment result by ID
 */
export async function getAssessmentResult(resultId: string): Promise<AssessmentResult> {
  console.log(`getAssessmentResult: Fetching result for ID: ${resultId}`);

  // Simulate API call delay
  await delay(500);

  // Try to get from localStorage first (for submitted assessments)
  // Only access localStorage on client-side
  if (typeof window !== 'undefined') {
    const storedResult = localStorage.getItem(`assessment-result-${resultId}`);
    console.log(`getAssessmentResult: localStorage result found: ${!!storedResult}`);

    if (storedResult) {
      const parsedResult = JSON.parse(storedResult);
      console.log(`getAssessmentResult: Returning localStorage result: ${parsedResult.persona_profile?.title}`);
      return parsedResult;
    }
  } else {
    console.log(`getAssessmentResult: Running on server-side, skipping localStorage check`);
  }

  // Fall back to mock data
  const mockResult = getMockResultById(resultId);
  console.log(`getAssessmentResult: Mock result found: ${!!mockResult}`);

  if (mockResult) {
    console.log(`getAssessmentResult: Returning mock result: ${mockResult.persona_profile?.title}`);
    return mockResult;
  }

  // If not found, throw error
  console.error(`getAssessmentResult: Result not found for ID: ${resultId}`);
  throw new Error(`Assessment result with ID ${resultId} not found`);
}

/**
 * Get all assessment results for a user
 */
export async function getUserAssessmentResults(userId?: string): Promise<AssessmentResult[]> {
  // Simulate API call delay
  await delay(800);

  const results: AssessmentResult[] = [];

  console.log(`AssessmentAPI: Getting results for user: ${userId || 'anonymous'}`);

  // Only access localStorage on client-side
  if (typeof window !== 'undefined') {
    // Get results from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('assessment-result-')) {
        try {
          const result = JSON.parse(localStorage.getItem(key)!);
          // Only include results for the specific user (or all if no userId specified)
          if (!userId || result.userId === userId) {
            results.push(result);
            console.log(`AssessmentAPI: Found result ${result.id} for user ${result.userId}`);
          }
        } catch (error) {
          console.error(`AssessmentAPI: Error parsing result from key ${key}:`, error);
        }
      }
    }
  } else {
    console.log('AssessmentAPI: Running on server-side, skipping localStorage access');
  }

  console.log(`AssessmentAPI: Returning ${results.length} results for user ${userId || 'anonymous'}`);

  // Return only real user results, sorted by creation date (newest first)
  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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
 * Delete assessment result
 */
export async function deleteAssessmentResult(resultId: string): Promise<void> {
  // Simulate API call delay
  await delay(500);

  // Remove from localStorage
  localStorage.removeItem(`assessment-result-${resultId}`);
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
  const analysis = await generateComprehensiveAnalysis(scores);

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
