// Assessment API Service
// Handles submission and retrieval of assessment results

import { AssessmentResult, AssessmentScores, convertScoresToApiData } from '../types/assessment-results';
import { calculateAllScores, validateAnswers } from '../utils/assessment-calculations';
import { generateApiOnlyAnalysis } from './ai-analysis';
import { exportMultiPagePDF } from '../utils/multi-page-pdf-export';
import { exportAdvancedPDF } from '../utils/advanced-pdf-export';
import { exportCompletePDF } from '../utils/pdf-export-utils';

// UUID validation utility
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Check if ID is in legacy format (result-{timestamp})
function isLegacyResultId(str: string): boolean {
  return str.startsWith('result-') && str.length > 7;
}

// Get user-friendly error message for ID format issues
function getIdFormatErrorMessage(resultId: string): string {
  if (isLegacyResultId(resultId)) {
    return `Hasil assessment dengan ID '${resultId}' menggunakan format lama yang tidak lagi didukung oleh server. Data mungkin tersimpan secara lokal.`;
  }
  return `Format ID '${resultId}' tidak valid. Sistem memerlukan format UUID yang valid.`;
}

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
 * Get assessment result by ID with improved fallback handling
 * Handles both UUID format (Archive API) and legacy format (localStorage)
 */
export async function getAssessmentResult(resultId: string): Promise<AssessmentResult> {
  console.log(`getAssessmentResult: Fetching result for ID: ${resultId}`);
  console.log(`getAssessmentResult: ID format - UUID: ${isValidUUID(resultId)}, Legacy: ${isLegacyResultId(resultId)}`);

  try {
    // Try the fallback mechanism first
    return await getAssessmentResultWithFallback(resultId);
  } catch (error) {
    console.error(`getAssessmentResult: Fallback failed for ${resultId}:`, error);

    // If fallback fails, provide a more helpful error message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to load assessment result: ${resultId}`);
    }
  }
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
  console.log(`getAssessmentResultFromArchiveAPI: Fetching result ${resultId} from Archive API (infinite retry mode)`);

  // Validate UUID format before making API call
  if (!isValidUUID(resultId)) {
    const errorMessage = getIdFormatErrorMessage(resultId);
    console.error('getAssessmentResultFromArchiveAPI: ID validation failed:', errorMessage);
    throw new Error(errorMessage);
  }

  let attempt = 1;
  while (true) {
    try {

      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      console.log(`getAssessmentResultFromArchiveAPI: Attempt ${attempt} (UUID validated)`);

      // Build headers, only add Authorization if token exists
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the proxy API endpoint
      const response = await fetch(`/api/proxy/archive/results/${resultId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`getAssessmentResultFromArchiveAPI: API request failed with status ${response.status}:`, errorText);

        // Jika 404, langsung throw error user-friendly, JANGAN retry
        if (response.status === 404) {
          throw new Error('Hasil assessment tidak ditemukan. Data mungkin sudah dihapus atau belum tersedia.');
        }

        // Error lain, lempar error untuk di-retry
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
      console.error(`getAssessmentResultFromArchiveAPI: Attempt ${attempt} failed for result ${resultId}:`, error);

      // Auth errors shouldn't di-retry
      if (error instanceof Error && error.message.includes('Authentication token not found')) {
        throw error;
      }
      // Jika error 404, jangan retry, lempar error ke atas
      if (error instanceof Error && error.message.includes('tidak ditemukan')) {
        throw error;
      }

      // Error lain, tunggu 10 detik lalu retry
      console.log(`getAssessmentResultFromArchiveAPI: Waiting 10 seconds before retry (attempt ${attempt + 1})`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempt++;
    }
  }
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
 * Get assessment result with fallback mechanism for different ID formats
 *
 * This function handles both new UUID-based IDs (from Archive API) and legacy
 * timestamp-based IDs (from localStorage). It provides backward compatibility
 * while encouraging migration to the new system.
 *
 * @param resultId - The assessment result ID (UUID or legacy format)
 * @returns Promise<AssessmentResult> - The assessment result data
 * @throws Error with user-friendly message if result cannot be found
 */
async function getAssessmentResultWithFallback(resultId: string): Promise<AssessmentResult> {
  console.log(`getAssessmentResultWithFallback: Attempting to fetch result for ID: ${resultId}`);
  console.log(`getAssessmentResultWithFallback: ID format analysis - UUID: ${isValidUUID(resultId)}, Legacy: ${isLegacyResultId(resultId)}`);

  // Check if ID is a valid UUID format
  if (isValidUUID(resultId)) {
    console.log(`getAssessmentResultWithFallback: ID is valid UUID, using Archive API`);
    try {
      return await getAssessmentResultFromArchiveAPI(resultId);
    } catch (error) {
      console.error(`getAssessmentResultWithFallback: Archive API failed for UUID ${resultId}:`, error);
      throw error;
    }
  }

  // For non-UUID IDs (legacy format like 'result-abc123'), try localStorage first
  console.log(`getAssessmentResultWithFallback: ID is not UUID format, trying localStorage fallback`);

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`assessment-result-${resultId}`);
      if (stored) {
        console.log(`getAssessmentResultWithFallback: Found result in localStorage for ${resultId}`);
        const result = JSON.parse(stored);

        // Validate the stored result has required properties
        if (result && result.id && result.assessment_data) {
          return result;
        } else {
          console.warn(`getAssessmentResultWithFallback: Invalid result data in localStorage for ${resultId}`);
        }
      } else {
        console.log(`getAssessmentResultWithFallback: No result found in localStorage for ${resultId}`);
      }
    } catch (error) {
      console.warn(`getAssessmentResultWithFallback: Error reading from localStorage:`, error);
    }
  }

  // If localStorage doesn't work, try to generate a demo result for legacy IDs
  if (isLegacyResultId(resultId)) {
    console.log(`getAssessmentResultWithFallback: Generating demo result for legacy ID: ${resultId}`);
    try {
      // Import demo data generation
      const { generateDemoAssessmentResult } = await import('../utils/demo-data-generator');
      const demoResult = generateDemoAssessmentResult(resultId);
      console.log(`getAssessmentResultWithFallback: Generated demo result for ${resultId}`);
      return demoResult;
    } catch (demoError) {
      console.error(`getAssessmentResultWithFallback: Failed to generate demo result:`, demoError);
    }
  }

  // If all else fails, throw informative error
  const errorMessage = getIdFormatErrorMessage(resultId);
  console.error(`getAssessmentResultWithFallback: ${errorMessage}`);
  throw new Error(errorMessage);
}

/**
 * Export assessment result as PDF with improved error handling
 *
 * This function attempts to export an assessment result as a PDF file.
 * It includes fallback mechanisms for different ID formats and provides
 * user-friendly error messages.
 *
 * Features:
 * - Supports both UUID and legacy ID formats
 * - Automatic fallback to localStorage for legacy IDs
 * - Detailed error logging for debugging
 * - User-friendly error messages
 *
 * @param resultId - The assessment result ID to export
 * @returns Promise<Blob> - PDF content as a blob
 * @throws Error with user-friendly message if export fails
 */
export async function exportResultAsPDF(resultId: string): Promise<Blob> {
  console.log(`exportResultAsPDF: Starting PDF export for result ID: ${resultId}`);
  console.log(`exportResultAsPDF: ID format - UUID: ${isValidUUID(resultId)}, Legacy: ${isLegacyResultId(resultId)}`);

  try {
    // Get result with fallback mechanism
    const result = await getAssessmentResultWithFallback(resultId);

    console.log(`exportResultAsPDF: Successfully retrieved result for ${resultId}`);
    console.log(`exportResultAsPDF: Starting comprehensive PDF generation...`);

    // Use the comprehensive PDF export utility
    // This will create a proper PDF with multiple pages including:
    // - Cover page with assessment info
    // - Main results page
    // - RIASEC details
    // - OCEAN (Big Five) details
    // - VIA Character Strengths details
    // - Persona profile details

    const pdfOptions = {
      quality: 0.95,
      scale: 1.2,
      format: 'a4' as const,
      orientation: 'portrait' as const,
      margin: 10,
      includeHeader: true,
      includeFooter: true
    };

    let pdfBlob: Blob;

    // Use advanced PDF as primary method (more reliable than screenshot-based)
    console.log(`exportResultAsPDF: Using advanced PDF export for ${resultId}`);
    try {
      pdfBlob = await exportAdvancedPDF(resultId, result, {
        ...pdfOptions,
        margin: 15 // Increase margin for better layout
      });
    } catch (advancedError) {
      console.warn(`exportResultAsPDF: Advanced PDF failed, trying multi-page PDF:`, advancedError);

      // Fallback to multi-page PDF only if advanced fails
      if (isValidUUID(resultId)) {
        try {
          pdfBlob = await exportMultiPagePDF(resultId, result, {
            ...pdfOptions,
            waitTime: 3000
          });
        } catch (multiPageError) {
          console.error(`exportResultAsPDF: Both PDF methods failed:`, { advancedError, multiPageError });
          throw new Error('Gagal membuat PDF dengan semua metode yang tersedia');
        }
      } else {
        throw advancedError;
      }
    }

    console.log(`exportResultAsPDF: PDF generated successfully for ${resultId}, size: ${pdfBlob.size} bytes`);
    return pdfBlob;

  } catch (error) {
    console.error(`exportResultAsPDF: Failed to export PDF for ${resultId}:`, error);

    // If PDF generation fails, try a simpler approach
    try {
      console.log(`exportResultAsPDF: Attempting fallback PDF generation for ${resultId}`);
      const result = await getAssessmentResultWithFallback(resultId);
      const fallbackBlob = await exportCompletePDF(resultId, result, {
        quality: 0.8,
        scale: 1.0,
        format: 'a4',
        orientation: 'portrait',
        margin: 15
      });
      console.log(`exportResultAsPDF: Fallback PDF generated successfully for ${resultId}`);
      return fallbackBlob;
    } catch (fallbackError) {
      console.error(`exportResultAsPDF: Fallback PDF generation also failed for ${resultId}:`, fallbackError);
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
  }
}
