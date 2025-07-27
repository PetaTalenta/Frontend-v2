/**
 * Enhanced Assessment API Service
 * Integrates with the real Assessment Service API and provides fallback to mock API
 * Base URL: https://api.chhrone.web.id/api/assessment
 */

import { 
  AssessmentScores, 
  AssessmentSubmitRequest, 
  AssessmentSubmitResponse,
  AssessmentStatusResponse,
  QueueStatusResponse,
  HealthCheckResponse,
  IdempotencyHealthResponse
} from '../types/assessment-results';
import { checkApiHealth, getApiBaseUrl } from '../utils/api-health';
import {
  showTokenError,
  showTokenSuccess
} from '../utils/token-notifications';

// API Configuration
const REAL_API_BASE_URL = 'https://api.chhrone.web.id';
const PROXY_API_BASE_URL = '/api/proxy'; // Use Next.js API proxy to avoid CORS

// Assessment API endpoints
const ASSESSMENT_ENDPOINTS = {
  SUBMIT: '/api/assessment/submit',
  STATUS: (jobId: string) => `/api/assessment/status/${jobId}`,
  QUEUE_STATUS: '/api/assessment/queue/status',
  HEALTH: '/api/assessment/health',
  IDEMPOTENCY_HEALTH: '/api/assessment/idempotency/health',
  IDEMPOTENCY_CLEANUP: '/api/assessment/idempotency/cleanup',
} as const;

// Polling configuration - Optimized for faster response
const POLLING_CONFIG = {
  INITIAL_DELAY: 800, // 800ms for faster initial response
  MAX_DELAY: 2000, // 2 seconds max delay for more responsive polling
  MAX_ATTEMPTS: 50, // More attempts with faster intervals
  BACKOFF_MULTIPLIER: 1.1, // Slower backoff for more frequent checks
} as const;

/**
 * Make authenticated request to Assessment API (Real API only)
 */
async function makeAssessmentApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ response: Response; apiSource: 'real' }> {
  
  // Get authentication token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw new Error('Authentication token not found. Please login first.');
  }

  // Always use real API via proxy to avoid CORS
  try {
    console.log(`Enhanced Assessment API: Making request via proxy to ${endpoint}`);

    // Use proxy for assessment endpoints
    let proxyUrl = `${PROXY_API_BASE_URL}/assessment`;

    // Handle different endpoints
    if (endpoint === ASSESSMENT_ENDPOINTS.SUBMIT) {
      // POST to /api/proxy/assessment (handled by route.ts)
    } else if (endpoint.includes('/status/')) {
      // GET to /api/proxy/assessment/status/[jobId]
      const jobId = endpoint.split('/status/')[1];
      proxyUrl = `${PROXY_API_BASE_URL}/assessment/status/${jobId}`;
    } else if (endpoint === ASSESSMENT_ENDPOINTS.QUEUE_STATUS) {
      proxyUrl += `?endpoint=queue/status`;
    } else if (endpoint === ASSESSMENT_ENDPOINTS.HEALTH) {
      proxyUrl += `?endpoint=health`;
    } else {
      // Default handling
      proxyUrl += `?endpoint=${endpoint.replace('/api/assessment/', '')}`;
    }

    const response = await fetch(proxyUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log(`Enhanced Assessment API: Proxy API responded with status ${response.status}`);
    return { response, apiSource: 'real' };

  } catch (error) {
    console.error('Enhanced Assessment API: Real API request failed:', error);
    throw new Error(`Real API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Track active submissions to prevent duplicates
const activeSubmissions = new Set<string>();

/**
 * Submit assessment for AI analysis
 */
export async function submitAssessment(
  assessmentData: AssessmentScores,
  assessmentName: string = 'AI-Driven Talent Mapping',
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<AssessmentSubmitResponse> {

  // Create unique key for this submission
  const submissionKey = JSON.stringify({ assessmentData, assessmentName });

  // Check if this exact submission is already in progress
  if (activeSubmissions.has(submissionKey)) {
    console.warn('Enhanced Assessment API: Duplicate submission detected, rejecting');
    throw new Error('Assessment submission already in progress');
  }

  // Mark this submission as active
  activeSubmissions.add(submissionKey);

  try {
    console.log('Enhanced Assessment API: Submitting assessment...');

    const requestData: AssessmentSubmitRequest = {
      assessmentName: assessmentName as any,
      riasec: assessmentData.riasec,
      ocean: assessmentData.ocean,
      viaIs: assessmentData.viaIs,
    };

    const { response, apiSource } = await makeAssessmentApiRequest(
      ASSESSMENT_ENDPOINTS.SUBMIT,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases
      if (response.status === 401) {
        showTokenError('Authentication failed. Please login again.');
        throw new Error('Authentication failed');
      } else if (response.status === 402) {
        showTokenError('Insufficient tokens. Please purchase more tokens.');
        throw new Error('Insufficient tokens');
      } else if (response.status === 429) {
        showTokenError('Rate limit exceeded. Please try again later.');
        throw new Error('Rate limit exceeded');
      }

      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: AssessmentSubmitResponse = await response.json();

    console.log(`Enhanced Assessment API: Assessment submitted successfully via ${apiSource} API`);
    console.log(`Job ID: ${result.data.jobId}, Queue Position: ${result.data.queuePosition}`);

    // Show success notification
    showTokenSuccess(
      `Assessment submitted successfully! Job ID: ${result.data.jobId}`,
      `Queue position: ${result.data.queuePosition}, Estimated time: ${result.data.estimatedProcessingTime}`
    );

    // Refresh token balance
    if (onTokenBalanceUpdate) {
      try {
        await onTokenBalanceUpdate();
        // Removed showTokenBalanceRefresh() notification
      } catch (error) {
        console.error('Enhanced Assessment API: Error refreshing token balance:', error);
      }
    }

    return result;

  } catch (error) {
    console.error('Enhanced Assessment API: Submit assessment error:', error);

    if (error instanceof Error) {
      showTokenError(`Assessment submission failed: ${error.message}`);
      throw error;
    }

    showTokenError('Assessment submission failed due to unknown error');
    throw new Error('Assessment submission failed');
  } finally {
    // Always remove from active submissions
    activeSubmissions.delete(submissionKey);
  }
}

/**
 * Get assessment job status
 */
export async function getAssessmentStatus(jobId: string): Promise<AssessmentStatusResponse> {
  console.log(`Enhanced Assessment API: Checking status for job ${jobId}`);
  
  try {
    const { response, apiSource } = await makeAssessmentApiRequest(
      ASSESSMENT_ENDPOINTS.STATUS(jobId),
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: AssessmentStatusResponse = await response.json();

    // Debug logging to understand response structure
    console.log(`Enhanced Assessment API: Raw response for job ${jobId}:`, JSON.stringify(result, null, 2));

    // Check if we have the expected structure
    if (!result.data) {
      console.error(`Enhanced Assessment API: Missing data property in response for job ${jobId}`);
      throw new Error('Invalid response structure: missing data property');
    }

    console.log(`Enhanced Assessment API: Job ${jobId} status: ${result.data.status} (${result.data.progress}%) via ${apiSource} API`);

    return result;
    
  } catch (error) {
    console.error(`Enhanced Assessment API: Status check error for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Poll assessment status until completion
 */
export async function pollAssessmentStatus(
  jobId: string,
  onProgress?: (status: AssessmentStatusResponse) => void,
  onComplete?: (status: AssessmentStatusResponse) => void,
  onError?: (error: Error) => void
): Promise<AssessmentStatusResponse> {
  
  console.log(`Enhanced Assessment API: Starting polling for job ${jobId}`);
  
  let attempts = 0;
  let delay = POLLING_CONFIG.INITIAL_DELAY;
  
  const poll = async (): Promise<AssessmentStatusResponse> => {
    try {
      attempts++;
      const status = await getAssessmentStatus(jobId);
      
      // Call progress callback
      if (onProgress) {
        onProgress(status);
      }
      
      // Check if completed
      if (status.data.status === 'completed') {
        console.log(`Enhanced Assessment API: Job ${jobId} completed after ${attempts} attempts`);
        if (onComplete) {
          onComplete(status);
        }
        return status;
      }
      
      // Check if failed
      if (status.data.status === 'failed') {
        const error = new Error(status.data.error || 'Assessment processing failed');
        if (onError) {
          onError(error);
        }
        throw error;
      }
      
      // Check max attempts
      if (attempts >= POLLING_CONFIG.MAX_ATTEMPTS) {
        const error = new Error('Polling timeout: Assessment is taking too long to process');
        if (onError) {
          onError(error);
        }
        throw error;
      }
      
      // Wait before next poll
      console.log(`Enhanced Assessment API: Job ${jobId} still ${status.data.status}, waiting ${delay}ms before next check`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * POLLING_CONFIG.BACKOFF_MULTIPLIER, POLLING_CONFIG.MAX_DELAY);
      
      return poll();
      
    } catch (error) {
      console.error(`Enhanced Assessment API: Polling error for job ${jobId}:`, error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown polling error'));
      }
      throw error;
    }
  };
  
  return poll();
}

/**
 * Get queue status for monitoring
 */
export async function getQueueStatus(): Promise<QueueStatusResponse> {
  console.log('Enhanced Assessment API: Getting queue status');

  try {
    const { response, apiSource } = await makeAssessmentApiRequest(
      ASSESSMENT_ENDPOINTS.QUEUE_STATUS,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: QueueStatusResponse = await response.json();

    console.log(`Enhanced Assessment API: Queue status retrieved via ${apiSource} API - ${result.data.queueLength} jobs in queue`);

    return result;

  } catch (error) {
    console.error('Enhanced Assessment API: Queue status error:', error);
    throw error;
  }
}

/**
 * Check assessment service health
 */
export async function checkAssessmentHealth(): Promise<HealthCheckResponse> {
  console.log('Enhanced Assessment API: Checking service health');

  try {
    const { response, apiSource } = await makeAssessmentApiRequest(
      ASSESSMENT_ENDPOINTS.HEALTH,
      { method: 'GET' },
      false // Don't fallback to mock for health checks
    );

    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }

    const result: HealthCheckResponse = await response.json();

    console.log(`Enhanced Assessment API: Service health check via ${apiSource} API - Status: ${result.status}`);

    return result;

  } catch (error) {
    console.error('Enhanced Assessment API: Health check error:', error);
    throw error;
  }
}

/**
 * Check idempotency service health
 */
export async function checkIdempotencyHealth(): Promise<IdempotencyHealthResponse> {
  console.log('Enhanced Assessment API: Checking idempotency health');

  try {
    const { response, apiSource } = await makeAssessmentApiRequest(
      ASSESSMENT_ENDPOINTS.IDEMPOTENCY_HEALTH,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: IdempotencyHealthResponse = await response.json();

    console.log(`Enhanced Assessment API: Idempotency health check via ${apiSource} API - Status: ${result.data.status}`);

    return result;

  } catch (error) {
    console.error('Enhanced Assessment API: Idempotency health check error:', error);
    throw error;
  }
}

/**
 * Cleanup idempotency cache
 */
export async function cleanupIdempotencyCache(): Promise<{ success: boolean; removedEntries: number; remainingEntries: number }> {
  console.log('Enhanced Assessment API: Cleaning up idempotency cache');

  try {
    const { response, apiSource } = await makeAssessmentApiRequest(
      ASSESSMENT_ENDPOINTS.IDEMPOTENCY_CLEANUP,
      { method: 'POST' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log(`Enhanced Assessment API: Idempotency cache cleanup via ${apiSource} API - Removed: ${result.data.removedEntries} entries`);

    return {
      success: result.success,
      removedEntries: result.data.removedEntries,
      remainingEntries: result.data.remainingEntries,
    };

  } catch (error) {
    console.error('Enhanced Assessment API: Idempotency cleanup error:', error);
    throw error;
  }
}

/**
 * Submit assessment with automatic polling
 * This is a convenience function that combines submission and polling
 */
export async function submitAssessmentWithPolling(
  assessmentData: AssessmentScores,
  assessmentName: string = 'AI-Driven Talent Mapping',
  onProgress?: (status: AssessmentStatusResponse) => void,
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<AssessmentStatusResponse> {

  console.log('Enhanced Assessment API: Submitting assessment with automatic polling');

  // Submit assessment
  const submitResponse = await submitAssessment(assessmentData, assessmentName, onTokenBalanceUpdate);

  // Start polling for completion
  return pollAssessmentStatus(
    submitResponse.data.jobId,
    onProgress,
    undefined, // onComplete callback handled by return
    undefined  // onError callback handled by throw
  );
}

/**
 * Submit assessment with WebSocket support
 * Returns jobId for WebSocket subscription
 */
export async function submitAssessmentForWebSocket(
  assessmentData: AssessmentScores,
  assessmentName: string = 'AI-Driven Talent Mapping',
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<{ jobId: string; queuePosition?: number }> {

  console.log('Enhanced Assessment API: Submitting assessment for WebSocket monitoring');

  // Submit assessment (same as regular submission)
  const submitResponse = await submitAssessment(assessmentData, assessmentName, onTokenBalanceUpdate);

  return {
    jobId: submitResponse.data.jobId,
    queuePosition: submitResponse.data.queuePosition,
  };
}

/**
 * Get estimated wait time based on queue status
 */
export async function getEstimatedWaitTime(): Promise<{
  queueLength: number;
  estimatedWaitTime: string;
  averageProcessingTime: string;
}> {
  const queueStatus = await getQueueStatus();

  return {
    queueLength: queueStatus.data.queueLength,
    estimatedWaitTime: queueStatus.data.estimatedWaitTime,
    averageProcessingTime: queueStatus.data.averageProcessingTime,
  };
}

/**
 * Utility function to format time remaining
 */
export function formatTimeRemaining(timeString?: string): string {
  if (!timeString) return 'Unknown';

  // Handle different time formats
  if (timeString.includes('minute')) {
    return timeString;
  }

  // If it's a number, assume it's in minutes
  const minutes = parseInt(timeString);
  if (!isNaN(minutes)) {
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 1 && remainingMinutes === 0) return '1 hour';
    if (hours === 1) return `1 hour ${remainingMinutes} minutes`;
    if (remainingMinutes === 0) return `${hours} hours`;
    return `${hours} hours ${remainingMinutes} minutes`;
  }

  return timeString;
}

/**
 * Check if assessment service is available
 */
export async function isAssessmentServiceAvailable(): Promise<boolean> {
  try {
    await checkAssessmentHealth();
    return true;
  } catch (error) {
    console.log('Enhanced Assessment API: Service not available, will use mock API');
    return false;
  }
}
