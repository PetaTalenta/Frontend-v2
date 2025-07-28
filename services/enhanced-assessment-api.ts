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

  console.log('🔥 Enhanced Assessment API: submitAssessment called - THIS CONSUMES 1 TOKEN');
  console.log('🔥 Enhanced Assessment API: Assessment data keys:', Object.keys(assessmentData));
  console.log('🔥 Enhanced Assessment API: Assessment name:', assessmentName);
  console.log('🔥 Enhanced Assessment API: Call stack trace:', new Error().stack?.split('\n').slice(1, 5).join('\n'));

  // Create unique key for this submission
  const submissionKey = JSON.stringify({ assessmentData, assessmentName });
  console.log('🔥 Enhanced Assessment API: Generated submission key hash:', submissionKey.substring(0, 50) + '...');
  console.log('🔥 Enhanced Assessment API: Active submissions count before check:', activeSubmissions.size);

  // Check if this exact submission is already in progress
  if (activeSubmissions.has(submissionKey)) {
    console.warn('🚨 Enhanced Assessment API: DUPLICATE SUBMISSION DETECTED - REJECTING (NO TOKEN CONSUMED)');
    console.warn('🚨 Enhanced Assessment API: This would have caused double token consumption!');
    throw new Error('Assessment submission already in progress');
  }

  // Mark this submission as active
  console.log('🔥 Enhanced Assessment API: Marking submission as active to prevent duplicates');
  activeSubmissions.add(submissionKey);
  console.log('🔥 Enhanced Assessment API: Active submissions count after adding:', activeSubmissions.size);

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

    // Token balance refresh is now handled by backend
    // Frontend will get updated balance through WebSocket or polling
    if (onTokenBalanceUpdate) {
      try {
        await onTokenBalanceUpdate();
        console.log('Enhanced Assessment API: Token balance refreshed');
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
    console.log('Enhanced Assessment API: Cleaning up - removing submission from active submissions');
    activeSubmissions.delete(submissionKey);
    console.log('Enhanced Assessment API: Active submissions count after cleanup:', activeSubmissions.size);
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
 * Submit assessment with automatic WebSocket monitoring (preferred method)
 * Falls back to polling only if WebSocket fails
 */
export async function submitAssessmentWithWebSocket(
  assessmentData: AssessmentScores,
  assessmentName: string = 'AI-Driven Talent Mapping',
  onProgress?: (status: AssessmentStatusResponse) => void,
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<AssessmentStatusResponse> {

  console.log('Enhanced Assessment API: Submitting assessment with WebSocket monitoring - FIXED: Direct submission to prevent double token consumption');

  // Submit assessment directly (FIXED: removed wrapper to prevent double token consumption)
  const submitResponse = await submitAssessment(assessmentData, assessmentName, onTokenBalanceUpdate);
  const jobId = submitResponse.data.jobId;

  console.log('Enhanced Assessment API: Assessment submitted with jobId:', jobId, '- monitoring via WebSocket');

  // Monitor via WebSocket with polling fallback
  return monitorAssessmentWithWebSocket(
    jobId,
    onProgress,
    onTokenBalanceUpdate
  );
}

/**
 * Submit assessment with automatic polling (FALLBACK ONLY)
 * This should only be used when WebSocket is not available
 */
export async function submitAssessmentWithPolling(
  assessmentData: AssessmentScores,
  assessmentName: string = 'AI-Driven Talent Mapping',
  onProgress?: (status: AssessmentStatusResponse) => void,
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<AssessmentStatusResponse> {

  console.warn('Enhanced Assessment API: Using polling fallback - WebSocket preferred for better performance');

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
 * Monitor assessment using WebSocket with polling fallback
 */
export async function monitorAssessmentWithWebSocket(
  jobId: string,
  onProgress?: (status: AssessmentStatusResponse) => void,
  onTokenBalanceUpdate?: () => Promise<void>
): Promise<AssessmentStatusResponse> {

  const { getAssessmentWebSocketService, isWebSocketSupported } = await import('./websocket-assessment');

  if (!isWebSocketSupported()) {
    console.warn('Enhanced Assessment API: WebSocket not supported, falling back to polling');
    return pollAssessmentStatus(jobId, onProgress);
  }

  return new Promise(async (resolve, reject) => {
    const wsService = getAssessmentWebSocketService();
    let isResolved = false;
    let timeoutId: NodeJS.Timeout;

    try {
      // Set timeout for WebSocket monitoring
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.warn('Enhanced Assessment API: WebSocket timeout, falling back to polling');
          // Fallback to polling on timeout
          pollAssessmentStatus(jobId, onProgress)
            .then(resolve)
            .catch(reject);
        }
      }, 120000); // 2 minutes timeout

      // Set up WebSocket callbacks
      wsService.setCallbacks({
        onAssessmentEvent: async (event) => {
          if (event.jobId !== jobId || isResolved) return;

          console.log('Enhanced Assessment API: WebSocket event', event);

          if (event.type === 'analysis-complete' && event.resultId) {
            clearTimeout(timeoutId);
            isResolved = true;

            try {
              const finalStatus = await getAssessmentStatus(jobId);
              resolve(finalStatus);
            } catch (error) {
              reject(error);
            }
          } else if (event.type === 'analysis-failed') {
            clearTimeout(timeoutId);
            isResolved = true;
            reject(new Error(event.error || 'Assessment analysis failed'));
          } else if (onProgress) {
            // Convert WebSocket event to status response for progress callback
            const progressStatus: AssessmentStatusResponse = {
              success: true,
              data: {
                status: event.type === 'analysis-started' ? 'processing' : 'queued',
                progress: event.type === 'analysis-started' ? 25 : 10,
                message: event.message || 'Processing...',
                jobId: event.jobId || jobId,
                estimatedTimeRemaining: event.metadata?.estimatedProcessingTime
              }
            };
            onProgress(progressStatus);
          }
        },
        onError: (error) => {
          if (!isResolved) {
            clearTimeout(timeoutId);
            isResolved = true;
            console.warn('Enhanced Assessment API: WebSocket error, falling back to polling:', error);
            // Fallback to polling on WebSocket error
            pollAssessmentStatus(jobId, onProgress)
              .then(resolve)
              .catch(reject);
          }
        }
      });

      // Connect to WebSocket if not already connected
      if (!wsService.isConnected()) {
        const token = localStorage.getItem('token') || '';
        if (!token) {
          throw new Error('No authentication token for WebSocket');
        }
        await wsService.connect(token);
      }

      // Subscribe to job updates
      wsService.subscribeToJob(jobId);
      console.log(`Enhanced Assessment API: Monitoring job ${jobId} via WebSocket`);

    } catch (error) {
      clearTimeout(timeoutId);
      if (!isResolved) {
        isResolved = true;
        console.warn('Enhanced Assessment API: WebSocket setup failed, falling back to polling:', error);
        // Fallback to polling if WebSocket setup fails
        pollAssessmentStatus(jobId, onProgress)
          .then(resolve)
          .catch(reject);
      }
    }
  });
}

// REMOVED: submitAssessmentForWebSocket function - was causing double token consumption
// This wrapper function was redundant and caused double API calls
// All functionality moved to submitAssessmentWithWebSocket

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
