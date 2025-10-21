/**
 * Consolidated Assessment Service
 * Single, clean, and efficient service that replaces all redundant assessment services
 * Provides WebSocket-first monitoring with intelligent polling fallback
 */

import {
  AssessmentScores,
  AssessmentResult,
  AssessmentStatusResponse,
  convertScoresToApiData
} from '../types/assessment-results';
import { calculateAllScores, validateAnswers } from '../utils/assessment-calculations';
import { generateApiOnlyAnalysis } from '../utils/ai-analysis';
import { createSafeError, safeErrorCallback, validateApiResponse } from '../utils/safe-error-handling';
import { ensureValidToken } from '../utils/token-validation';

// Consolidated configuration - Updated to match documentation
const CONFIG = {
  API_BASE_URL: 'https://api.futureguide.id',
  ENDPOINTS: {
    SUBMIT: '/api/assessment/submit',
    STATUS: (jobId: string) => `/api/assessment/status/${jobId}`,
    HEALTH: '/api/assessment/health'
  },
  TIMEOUTS: {
    SUBMISSION: 30000,      // 30 seconds for submission (increased per documentation)
    MONITORING: 600000,     // 10 minutes for monitoring
    POLLING_INTERVAL: 3000, // 3 seconds between polls (per documentation)
    WEBSOCKET_TIMEOUT: 20000, // 20 seconds for WebSocket operations (per documentation)
    WEBSOCKET_FALLBACK: 45000, // 45 seconds before falling back to polling
  INITIAL_RESULT_DELAY: 10000 // Delay before first result fetch after completion (ms)
  },
  RETRY: {
    MAX_ATTEMPTS: 5,        // Increased for better reliability
    DELAY: 1000
  }
} as const;

// Sanitize backend error messages into user-friendly text
function sanitizeBackendErrorMessage(raw: any): string {
  try {
    const msg = typeof raw === 'string' ? raw : (raw?.message || String(raw));
    if (!msg) return 'Terjadi kesalahan. Mohon coba lagi.';

    if (msg.includes("Cannot read properties of undefined (reading 'code')")) {
      return 'Terjadi kesalahan internal pada layanan analisis. Mohon coba lagi dalam beberapa saat.';
    }

    // You can add more mappings here if needed
    return msg;
  } catch (_e) {
    return 'Terjadi kesalahan. Mohon coba lagi.';
  }
}

interface AssessmentOptions {
  onProgress?: (status: AssessmentStatusResponse) => Promise<void>; // Changed to return Promise<void>
  onTokenBalanceUpdate?: () => Promise<void>;
  preferWebSocket?: boolean;
  // Optional error callback to report monitoring errors without misusing onProgress
  onError?: (error: any) => void;
  // ✅ User ID untuk per-user submission tracking
  userId?: string;
}

interface MonitoringState {
  jobId: string;
  isActive: boolean;
  startTime: number;
  attempts: number;
  useWebSocket: boolean;
  websocketFailed: boolean;
}

class AssessmentService {
  private activeMonitors = new Map<string, MonitoringState>();
  private wsService: any = null;
  private wsInitialized = false;

  // ✅ Map-based tracking untuk multiple concurrent jobs
  // Prevents memory leaks dari orphaned listeners
  private wsEventListeners = new Map<string, () => void>();

  // ✅ Per-user submission tracking dengan data hash
  // Prevents wrong results untuk different users/data
  private submissionPromises = new Map<string, Promise<AssessmentResult>>();

  /**
   * Generate unique submission key dari user ID + data hash
   * Prevents wrong results untuk different users/data
   */
  private generateSubmissionKey(scores: any, assessmentName: string, userId?: string): string {
    // Get user ID from localStorage if not provided
    const user = userId || localStorage.getItem('userId') || 'anonymous';

    // Create data hash dari scores + assessment name
    const dataString = JSON.stringify({ scores, assessmentName });
    const dataHash = this.simpleHash(dataString);

    return `${user}-${dataHash}`;
  }

  /**
   * Simple hash function untuk data deduplication
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Submit assessment from answers
   */
  async submitFromAnswers(
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping',
    options: AssessmentOptions = {}
  ): Promise<AssessmentResult> {
    console.log('Assessment Service: Starting submission from answers...');

    // Validate answers
    const validation = validateAnswers(answers);
    if (!validation.isValid) {
      throw createSafeError(
        `Missing ${validation.missingQuestions.length} answers. Please complete all questions.`,
        'VALIDATION_ERROR'
      );
    }

    // Calculate scores
    const scores = calculateAllScores(answers);

    // Submit assessment, pass answers for rawResponses
    return this.submitAssessment(scores, assessmentName, { ...options, answers });
  }

  /**
   * Submit assessment with scores
   */
  async submitAssessment(
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping',
    options: AssessmentOptions & { answers?: Record<number, number|null> } = {}
  ): Promise<AssessmentResult> {
    console.log('Assessment Service: Submitting assessment...');

    // ✅ Generate unique submission key per user + data
    const submissionKey = this.generateSubmissionKey(scores, assessmentName, options.userId);

    // ✅ If same submission is already in-flight, reuse that promise
    const existingPromise = this.submissionPromises.get(submissionKey);
    if (existingPromise) {
      console.warn(`Assessment Service: Submission already in progress for key: ${submissionKey}. Reusing existing promise.`);
      return existingPromise;
    }

    // ✅ Create a guarded submission promise and store it with key
    const submissionPromise = (async () => {
      try {
        // Submit to API
        const submitResponse = await this.submitToAPI(scores, assessmentName, options.onTokenBalanceUpdate, options.answers);
        const jobId = submitResponse.data.jobId;

        console.log(`Assessment Service: Submitted with jobId: ${jobId}, key: ${submissionKey}`);

        // ✅ CRITICAL FIX: Call onProgress immediately with jobId so it can be saved to localStorage
        // This ensures the loading page has the jobId before we start monitoring
        if (options.onProgress && typeof options.onProgress === 'function') {
          try {
            console.log('Assessment Service: Calling onProgress with jobId for redirect...');
            await options.onProgress({
              success: true,
              message: 'Assessment submitted. Waiting in queue...',
              data: {
                jobId: jobId,
                status: 'queued',
                progress: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'unknown',
                userEmail: 'unknown',
                assessmentName: assessmentName
              }
            });
            console.log('Assessment Service: onProgress completed, redirect should be done');
          } catch (callbackError) {
            console.warn('Assessment Service: Error in onProgress callback after submission:', callbackError);
          }
        }

        // ✅ Wait longer to ensure redirect/navigation has started and completed
        // This prevents race condition where monitoring starts before navigation completes
        console.log('Assessment Service: Waiting for navigation to complete...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased from 100ms to 500ms
        console.log('Assessment Service: Navigation delay completed, starting monitoring');

        // Monitor the assessment
        const result = await this.monitorAssessment(jobId, options);
        return result;
      } catch (error) {
        console.error('Assessment Service: Submission failed:', error);
        throw createSafeError(error, 'SUBMISSION_ERROR');
      } finally {
        // ✅ Clear the in-flight promise for this specific key
        this.submissionPromises.delete(submissionKey);
        console.log(`Assessment Service: Cleared submission promise for key: ${submissionKey}`);
      }
    })();

    // ✅ Store promise with unique key
    this.submissionPromises.set(submissionKey, submissionPromise);

    return submissionPromise;
  }

  /**
   * Submit assessment data to API
   * ✅ FIXED: Now validates and refreshes token before submission
   */
  private async submitToAPI(
    scores: AssessmentScores,
    assessmentName: string,
    onTokenBalanceUpdate?: () => Promise<void>,
    answers?: Record<number, number|null>
  ): Promise<{ data: { jobId: string; status: string } }> {
    console.log('Assessment Service: Validating authentication token...');

    // ✅ CRITICAL FIX: Validate and refresh token before submission
    let token: string;
    try {
      token = await ensureValidToken();
      console.log('Assessment Service: ✅ Token validated successfully');
    } catch (error) {
      console.error('Assessment Service: ❌ Token validation failed:', error);
      throw createSafeError(
        error instanceof Error ? error.message : 'Authentication failed. Please login again.',
        'AUTH_ERROR'
      );
    }

    const apiData = convertScoresToApiData(scores, assessmentName, answers);

    // ✅ FIXED: Use CORRECT backend format (snake_case)
    // Backend expects: assessment_name, assessment_data, raw_responses, raw_schema_version
    // See: POST /api/assessment/submit documentation
    const payload: any = {
      assessment_name: apiData.assessmentName || assessmentName,
      assessment_data: {
        riasec: apiData.riasec,
        ocean: apiData.ocean,
        viaIs: apiData.viaIs,
        industryScore: apiData.industryScore,
      },
    };

    // ✅ Include rawResponses and rawSchemaVersion if present
    // NOTE: Only include if backend supports it (optional field)
    // Can be controlled via environment variable: NEXT_PUBLIC_SEND_RAW_RESPONSES
    const shouldSendRawResponses = process.env.NEXT_PUBLIC_SEND_RAW_RESPONSES !== 'false';
    if (shouldSendRawResponses && apiData.rawResponses) {
      payload.raw_responses = apiData.rawResponses;
      payload.raw_schema_version = apiData.rawSchemaVersion || 'v1';
    }

    console.log('Assessment Service: Submitting payload (backend format):', {
      assessment_name: payload.assessment_name,
      hasAssessmentData: !!payload.assessment_data,
      hasRawResponses: !!payload.raw_responses,
      raw_schema_version: payload.raw_schema_version,
    });

    // Debug: Log full payload structure for troubleshooting
    console.log('Assessment Service: Full payload:', JSON.stringify(payload, null, 2));
    console.log('Assessment Service: Payload keys:', Object.keys(payload));
    if (payload.assessment_data) {
      console.log('Assessment Service: assessment_data keys:', Object.keys(payload.assessment_data));
      console.log('Assessment Service: riasec scores:', payload.assessment_data.riasec);
      console.log('Assessment Service: ocean scores:', payload.assessment_data.ocean);
      console.log('Assessment Service: viaIs scores:', payload.assessment_data.viaIs);
    }
    if (payload.raw_responses) {
      console.log('Assessment Service: raw_responses sample:', {
        riasecSample: payload.raw_responses.riasec?.[0],
        oceanSample: payload.raw_responses.ocean?.[0],
        viaIsSample: payload.raw_responses.viaIs?.[0],
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.SUBMISSION);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SUBMIT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'FutureGuide-Frontend/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Enhanced error handling for all HTTP status codes
      if (!response.ok) {
        let errorData: any = {};

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorData = { message: await response.text() };
          }
        } catch (parseError) {
          console.warn('Assessment Service: Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        // Log full error details for debugging
        console.error('Assessment Service: API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          errorDetails: errorData?.details,
          fullError: JSON.stringify(errorData, null, 2)
        });

        // Handle specific status codes
        switch (response.status) {
          case 400:
            console.error('Assessment Service: VALIDATION_ERROR Details:', {
              message: errorData?.message,
              details: errorData?.details,
              error: errorData?.error
            });
            throw createSafeError(
              errorData?.message || 'Invalid assessment data. Please check your answers and try again.',
              'VALIDATION_ERROR'
            );
          case 401:
            // ✅ ENHANCED: Better 401 error handling with token refresh hint
            console.error('Assessment Service: 401 Unauthorized - Token may be expired');
            throw createSafeError(
              'Authentication failed. Your session may have expired. Please login again.',
              'AUTH_ERROR'
            );
          case 402:
            throw createSafeError('Insufficient tokens. Please purchase more tokens.', 'INSUFFICIENT_TOKENS');
          case 403:
            throw createSafeError('Access denied. Please check your permissions.', 'ACCESS_DENIED');
          case 429:
            throw createSafeError('Too many requests. Please wait a moment and try again.', 'RATE_LIMITED');
          case 500:
            throw createSafeError('Server error. Please try again later.', 'SERVER_ERROR');
          case 502:
          case 503:
          case 504:
            throw createSafeError('Service temporarily unavailable. Please try again later.', 'SERVICE_UNAVAILABLE');
          default:
            throw createSafeError(
              errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
              'API_ERROR'
            );
        }
      }

      // Parse and validate response with enhanced error handling
      let result: any;
      try {
        result = await response.json();
      } catch (parseError) {
        throw createSafeError('Invalid JSON response from server', 'INVALID_JSON');
      }

      // Enhanced response validation using utility function
      const validation = validateApiResponse(result, ['data']);
      if (!validation.isValid) {
        throw validation.error || createSafeError('Invalid response structure', 'INVALID_RESPONSE');
      }

      const safeResult = validation.safeResponse;

      if (safeResult.success === false) {
        const errorCode = typeof safeResult.error === 'string'
          ? safeResult.error
          : (safeResult.error?.code || safeResult.error?.status || 'SUBMISSION_FAILED');
        throw createSafeError(
          safeResult.message || 'Assessment submission failed',
          errorCode
        );
      }

      if (!safeResult.data?.jobId) {
        throw createSafeError('Response missing required job ID', 'MISSING_JOB_ID');
      }

      // Update token balance if callback provided
      if (onTokenBalanceUpdate) {
        try {
          await onTokenBalanceUpdate();
        } catch (error) {
          console.warn('Assessment Service: Token balance update failed:', error);
        }
      }

      return safeResult;
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhanced error handling with safe property access
      const safeError = createSafeError(error);

      if (safeError.name === 'AbortError' || safeError.code === 'TIMEOUT_ERROR') {
        throw createSafeError('Request timeout. Please try again.', 'TIMEOUT_ERROR');
      }

      // Re-throw safe errors that already have proper structure
      if (safeError.code && safeError.code !== 'UNKNOWN_ERROR' && safeError.code !== 'STRING_ERROR') {
        throw safeError;
      }

      // Handle network errors
      if (safeError.message && (safeError.message.includes('fetch') || safeError.message.includes('network'))) {
        throw createSafeError('Network error. Please check your connection and try again.', 'NETWORK_ERROR');
      }

      throw createSafeError(error, 'SUBMISSION_ERROR');
    }
  }

  /**
   * Monitor assessment with WebSocket-first approach
   */
  private async monitorAssessment(
    jobId: string,
    options: AssessmentOptions
  ): Promise<AssessmentResult> {
    console.log(`Assessment Service: Starting monitoring for job ${jobId}`);

    // Prevent duplicate monitoring
    if (this.activeMonitors.has(jobId)) {
      console.warn(`Assessment Service: Already monitoring job ${jobId}`);
      throw createSafeError('Assessment already being monitored', 'DUPLICATE_MONITORING');
    }

    const state: MonitoringState = {
      jobId,
      isActive: true,
      startTime: Date.now(),
      attempts: 0,
      useWebSocket: options.preferWebSocket !== false,
      websocketFailed: false
    };

    this.activeMonitors.set(jobId, state);

    return new Promise<AssessmentResult>((resolve, reject) => {
      // Set overall timeout with better error handling
      const timeoutId = setTimeout(() => {
        if (state.isActive) {
          this.stopMonitoring(jobId);

          // Provide more helpful timeout error message
          const timeoutMinutes = Math.floor(CONFIG.TIMEOUTS.MONITORING / 60000);
          const timeoutError = createSafeError(
            `Assessment processing is taking longer than expected (${timeoutMinutes} minutes). This may be due to high server load. Please check the results page or try again later.`,
            'MONITORING_TIMEOUT'
          );

          console.error(`Assessment Service: Monitoring timeout for job ${jobId} after ${CONFIG.TIMEOUTS.MONITORING}ms`);
          // Report via error callback if provided; do not pass errors to onProgress
          if (options.onError && typeof options.onError === 'function') {
            safeErrorCallback(options.onError, timeoutError);
          }
          reject(timeoutError);
        }
      }, CONFIG.TIMEOUTS.MONITORING);

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.stopMonitoring(jobId);
      };

      const handleSuccess = (result: AssessmentResult) => {
        if (!state.isActive) return;
        state.isActive = false;
        cleanup();
        console.log(`Assessment Service: Job ${jobId} completed successfully`);
        resolve(result);
      };

      const handleError = (error: any) => {
        if (!state.isActive) return;
        state.isActive = false;
        cleanup();
        const safeError = createSafeError(error, 'MONITORING_ERROR');
        console.error(`Assessment Service: Job ${jobId} failed:`, safeError);

        // Safe error callback execution
        try {
          // Prefer notifying dedicated error callback if provided; avoid misusing onProgress
          if (options.onError && typeof options.onError === 'function') {
            safeErrorCallback(options.onError, safeError);
          }
        } catch (callbackError) {
          console.error(`Assessment Service: Error in error callback for job ${jobId}:`, callbackError);
        }

        reject(safeError);
      };

      // Try WebSocket first, then fallback to polling
      if (state.useWebSocket && !state.websocketFailed) {
        this.tryWebSocketMonitoring(jobId, state, options, handleSuccess, handleError);
      } else {
        this.startPollingMonitoring(jobId, state, options, handleSuccess, handleError);
      }
    });
  }

  /**
   * Try WebSocket monitoring with fallback
   * FIXED: Better connection reuse and error handling
   */
  private async tryWebSocketMonitoring(
    jobId: string,
    state: MonitoringState,
    options: AssessmentOptions,
    onSuccess: (result: AssessmentResult) => void,
    onError: (error: any) => void
  ) {
    try {
      // Initialize WebSocket service (singleton)
      if (!this.wsInitialized) {
        console.log(`📡 Assessment Service: Initializing WebSocket service for job ${jobId}`);
        const { getWebSocketService, isWebSocketSupported } = await import('./notificationService');

        if (!isWebSocketSupported()) {
          throw new Error('WebSocket not supported');
        }

        this.wsService = getWebSocketService();
        this.wsInitialized = true;
      }

      // ✅ Clean up previous event listener untuk same jobId (if exists)
      const existingCleanup = this.wsEventListeners.get(jobId);
      if (existingCleanup) {
        console.log(`🧹 Assessment Service: Cleaning up previous listener for job ${jobId}`);
        existingCleanup();
        this.wsEventListeners.delete(jobId);
      }

      // CRITICAL: Register event listener BEFORE connecting to avoid race condition
      console.log(`📝 Assessment Service: Registering event listener for job ${jobId}`);
      const cleanup = this.wsService.addEventListener((event: any) => {
        // Only handle events for this specific job
        if (event.jobId === jobId && state.isActive) {
          console.log(`📨 Assessment Service: Received event for job ${jobId}:`, event.type);

          if (event.type === 'analysis-complete') {
            console.log(`✅ Assessment Service: Analysis complete for job ${jobId}, result ID:`, event.resultId);

            // Wait a short delay before fetching the result to allow backend to persist
            const initialDelay = CONFIG.TIMEOUTS.INITIAL_RESULT_DELAY || 0;
            setTimeout(() => {
              if (!state.isActive) {
                console.log(`⚠️ Assessment Service: Monitoring stopped for job ${jobId}, skipping result fetch`);
                return;
              }

              console.log(`🔍 Assessment Service: Fetching result for job ${jobId}`);
              this.getAssessmentResult(event.resultId || jobId)
                .then((result) => {
                  console.log(`✅ Assessment Service: Result fetched successfully for job ${jobId}`);
                  onSuccess(result);
                })
                .catch((error) => {
                  console.error(`❌ Assessment Service: Failed to fetch result for job ${jobId}:`, error);
                  onError(error);
                });
            }, initialDelay);
          } else if (event.type === 'analysis-failed') {
            console.error(`❌ Assessment Service: Analysis failed for job ${jobId}:`, event.error);
            const friendly = sanitizeBackendErrorMessage(event?.error);
            onError(createSafeError(new Error(friendly), 'ASSESSMENT_FAILED'));
          }
        }
      });

      // ✅ Store cleanup function untuk later removal
      this.wsEventListeners.set(jobId, cleanup);
      console.log(`✅ Assessment Service: Event listener registered and tracked for job ${jobId}`);

      // ✅ PRODUCTION FIX: Ensure we have a valid, non-expired token before WebSocket connection
      let token: string;
      try {
        token = await ensureValidToken();
        console.log(`✅ Assessment Service: Valid token ensured for WebSocket connection (job ${jobId})`);
      } catch (error) {
        console.error(`❌ Assessment Service: Failed to get valid token for job ${jobId}:`, error);
        throw createSafeError('Authentication failed. Please login again.', 'AUTH_ERROR');
      }

      // Check if already connected (reuse existing connection)
      const status = this.wsService.getStatus();
      console.log(`📊 Assessment Service: WebSocket status:`, status);

      if (!status.isConnected) {
        console.log(`🔌 Assessment Service: Connecting WebSocket for job ${jobId}...`);
        await this.wsService.connect(token);
        console.log(`✅ Assessment Service: WebSocket connected for job ${jobId}`);
      } else {
        console.log(`♻️ Assessment Service: Reusing existing WebSocket connection for job ${jobId}`);
      }

      // Subscribe to job updates
      console.log(`📡 Assessment Service: Subscribing to job ${jobId}`);
      this.wsService.subscribeToJob(jobId);
      console.log(`✅ Assessment Service: WebSocket monitoring active for job ${jobId}`);

      // Start backup polling after configured timeout
      setTimeout(() => {
        if (state.isActive && !state.websocketFailed) {
          console.log(`⏰ Assessment Service: Starting backup polling for job ${jobId} (WebSocket fallback after ${CONFIG.TIMEOUTS.WEBSOCKET_FALLBACK}ms)`);
          this.startPollingMonitoring(jobId, state, options, onSuccess, onError);
        }
      }, CONFIG.TIMEOUTS.WEBSOCKET_FALLBACK);

    } catch (error) {
      console.warn(`⚠️ Assessment Service: WebSocket setup failed for job ${jobId}, falling back to polling:`, error);

      // ✅ Ensure cleanup even on error
      const cleanup = this.wsEventListeners.get(jobId);
      if (cleanup) {
        cleanup();
        this.wsEventListeners.delete(jobId);
      }

      state.websocketFailed = true;
      this.startPollingMonitoring(jobId, state, options, onSuccess, onError);
    }
  }

  /**
   * Start polling monitoring with improved error handling
   */
  private startPollingMonitoring(
    jobId: string,
    state: MonitoringState,
    options: AssessmentOptions,
    onSuccess: (result: AssessmentResult) => void,
    onError: (error: any) => void
  ) {
    console.log(`Assessment Service: Starting polling monitoring for job ${jobId}`);

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;
    // Track bounded result-fetch retries after status shows completed
    let resultFetchAttempts = 0;

    const poll = async () => {
      if (!state.isActive) return;

      try {
        state.attempts++;
        
        // ✅ PRODUCTION FIX: Refresh token before each polling request to prevent INVALID_TOKEN
        // This is especially important for long-running assessments (2-5 minutes)
        try {
          await ensureValidToken();
        } catch (tokenError) {
          console.error(`❌ Assessment Service: Token validation failed during polling for job ${jobId}:`, tokenError);
          // Don't immediately fail - try the status check anyway in case token is still valid
        }
        
        const status = await this.getAssessmentStatus(jobId);

        // Reset error counter on successful request
        consecutiveErrors = 0;

        // Update progress with safe callback execution
        if (options.onProgress) {
          try {
            await options.onProgress(status);
          } catch (progressError) {
            console.warn(`Assessment Service: Progress callback error for job ${jobId}:`, progressError);
            // Don't fail the entire polling process due to progress callback errors
          }
        }

        // Safe access to status properties
        const statusValue = status?.data?.status || 'unknown';
        const resultId = status?.data?.resultId;
        const errorMessage = status?.data?.error;

        if (statusValue === 'completed' && resultId) {
          // Once marked completed, try fetching result with bounded retries to handle eventual consistency
          const maxResultFetchAttempts = 8;
          const baseDelay = 1500;

          const tryFetchResult = async () => {
            if (!state.isActive) return;
            try {
              const result = await this.getAssessmentResult(resultId);
              onSuccess(result);
              return;
            } catch (resultError) {
              console.error(`Assessment Service: Failed to fetch result for job ${jobId}:`, resultError);
              const safeErr = createSafeError(resultError, 'RESULT_FETCH_ERROR');
              const msg = safeErr.message || '';

              // If result is not yet available (eventual consistency), retry direct fetch without re-polling status
              if (msg.includes('404') || msg.includes('RESULT_NOT_FOUND')) {
                if (resultFetchAttempts < maxResultFetchAttempts) {
                  const retryDelay = Math.min(baseDelay * Math.pow(2, resultFetchAttempts), 10000);
                  resultFetchAttempts++;
                  console.warn(`Assessment Service: Result not available yet for ${resultId}. Retrying fetch (${resultFetchAttempts}/${maxResultFetchAttempts}) in ${retryDelay}ms...`);
                  setTimeout(tryFetchResult, retryDelay);
                  return;
                }
                onError(createSafeError(`Result is still not available after ${maxResultFetchAttempts} attempts. Please refresh the results page in a moment.`, 'RESULT_NOT_AVAILABLE_YET'));
                return;
              }

              onError(safeErr);
              return;
            }
          };

          // Kick off the first fetch attempt (with a small initial delay for consistency)
          const initialDelay = CONFIG.TIMEOUTS.INITIAL_RESULT_DELAY || 0;
          setTimeout(tryFetchResult, initialDelay);
          return;
        } else if (statusValue === 'failed') {
          const friendly = sanitizeBackendErrorMessage(errorMessage || 'Assessment processing failed');
          onError(createSafeError(new Error(friendly), 'ASSESSMENT_FAILED'));
          return;
        }

        // Calculate adaptive polling interval based on status
        const pollingInterval = this.getAdaptivePollingInterval(statusValue, state.attempts);

        // Continue polling
        setTimeout(poll, pollingInterval);

      } catch (error) {
        consecutiveErrors++;
        console.error(`Assessment Service: Polling error for job ${jobId} (attempt ${state.attempts}, consecutive errors: ${consecutiveErrors}):`, error);

        // If too many consecutive errors, fail
        if (consecutiveErrors >= maxConsecutiveErrors) {
          onError(createSafeError(
            `Failed to monitor assessment after ${maxConsecutiveErrors} consecutive errors. Please check your connection and try again.`,
            'POLLING_ERROR'
          ));
          return;
        }

        // Retry with exponential backoff
        if (state.attempts < CONFIG.RETRY.MAX_ATTEMPTS) {
          const delay = Math.min(CONFIG.RETRY.DELAY * Math.pow(2, consecutiveErrors - 1), 30000); // Cap at 30 seconds
          console.log(`Assessment Service: Retrying in ${delay}ms...`);
          setTimeout(poll, delay);
        } else {
          onError(createSafeError(
            `Assessment monitoring failed after ${CONFIG.RETRY.MAX_ATTEMPTS} attempts. Please try again later.`,
            'MAX_RETRIES_EXCEEDED'
          ));
        }
      }
    };

    // Start polling
    poll();
  }

  /**
   * Get adaptive polling interval based on assessment status
   */
  private getAdaptivePollingInterval(status: string, attempts: number): number {
    const baseInterval = CONFIG.TIMEOUTS.POLLING_INTERVAL;

    switch (status) {
      case 'queued':
        // Slower polling for queued assessments
        return Math.min(baseInterval * 2, 10000);
      case 'processing':
        // Normal polling for processing
        return baseInterval;
      case 'analyzing':
        // Faster polling for analysis phase
        return Math.max(baseInterval * 0.7, 2000);
      default:
        // Gradually increase interval for unknown statuses
        return Math.min(baseInterval + (attempts * 500), 15000);
    }
  }

  /**
   * Get assessment status with robust error handling
   */
  async getAssessmentStatus(jobId: string): Promise<AssessmentStatusResponse> {
    // ✅ PRODUCTION FIX: Use ensureValidToken instead of direct localStorage access
    let token: string;
    try {
      token = await ensureValidToken();
      console.log(`✅ Assessment Service: Using validated token for status check (job ${jobId})`);
    } catch (error) {
      console.error(`❌ Assessment Service: Token validation failed for job ${jobId}:`, error);
      throw createSafeError('Authentication failed. Please login again.', 'AUTH_ERROR');
    }

    if (!jobId || typeof jobId !== 'string') {
      throw createSafeError('Invalid job ID provided', 'INVALID_JOB_ID');
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.STATUS(jobId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'FutureGuide-Frontend/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout for status checks
      });

      // Enhanced error handling for status API
      if (!response.ok) {
        let errorMessage = `Failed to get status: ${response.status}`;

        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Use default error message if parsing fails
        }

        switch (response.status) {
          case 401:
            throw createSafeError('Authentication failed. Please login again.', 'AUTH_ERROR');
          case 403:
            throw createSafeError('Access denied to this assessment.', 'ACCESS_DENIED');
          case 404:
            throw createSafeError('Assessment not found. It may have been deleted or expired.', 'NOT_FOUND');
          case 429:
            throw createSafeError('Too many status requests. Please wait a moment.', 'RATE_LIMITED');
          case 500:
          case 502:
          case 503:
          case 504:
            throw createSafeError('Server error. Please try again later.', 'SERVER_ERROR');
          default:
            throw createSafeError(new Error(errorMessage), 'STATUS_ERROR');
        }
      }

      // Parse response with enhanced error handling
      let result: any;
      try {
        result = await response.json();
      } catch (parseError) {
        throw createSafeError('Invalid JSON response from status API', 'INVALID_JSON');
      }

      // Enhanced response validation using utility function
      const validation = validateApiResponse(result, ['data']);
      if (!validation.isValid) {
        throw validation.error || createSafeError('Invalid status response structure', 'INVALID_RESPONSE');
      }

      const safeResult = validation.safeResponse;

      // Ensure success field exists and is true
      if (safeResult.success === false) {
        const errorCode = typeof safeResult.error === 'string'
          ? safeResult.error
          : (safeResult.error?.code || safeResult.error?.status || 'STATUS_CHECK_FAILED');
        throw createSafeError(
          safeResult.message || 'Status check failed',
          errorCode
        );
      }

      // Ensure data property exists with proper structure using safe access
      if (!safeResult.data || typeof safeResult.data !== 'object') {
        safeResult.data = {
          jobId: jobId,
          status: 'unknown',
          progress: 0,
          message: 'Status information unavailable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'unknown',
          userEmail: 'unknown',
          assessmentName: 'AI-Driven Talent Mapping'
        };
      }

      // Ensure all required properties exist in data with safe defaults
      const safeData = {
        jobId: safeResult.data?.jobId || jobId,
        status: safeResult.data?.status || 'unknown',
        progress: typeof safeResult.data?.progress === 'number' ? safeResult.data.progress : 0,
        createdAt: safeResult.data?.createdAt || new Date().toISOString(),
        updatedAt: safeResult.data?.updatedAt || new Date().toISOString(),
        userId: safeResult.data?.userId || 'unknown',
        userEmail: safeResult.data?.userEmail || 'unknown',
        assessmentName: safeResult.data?.assessmentName || 'AI-Driven Talent Mapping',
        message: safeResult.data?.message || this.getDefaultStatusMessage(safeResult.data?.status || 'unknown'),
        estimatedTimeRemaining: safeResult.data?.estimatedTimeRemaining,
        queuePosition: safeResult.data?.queuePosition,
        resultId: safeResult.data?.resultId,
        error: safeResult.data?.error
      };

      // Return properly structured response
      return {
        success: true,
        message: safeResult.message || 'Status retrieved successfully',
        data: safeData
      };

    } catch (error) {
      // Enhanced error handling with safe property access
      const safeError = createSafeError(error);

      if (safeError.name === 'AbortError' || safeError.code === 'TIMEOUT_ERROR') {
        throw createSafeError('Status check timeout. Please try again.', 'TIMEOUT_ERROR');
      }

      // Re-throw safe errors that already have proper structure
      if (safeError.code && safeError.code !== 'UNKNOWN_ERROR' && safeError.code !== 'STRING_ERROR') {
        throw safeError;
      }

      // Handle network errors
      if (safeError.message && (safeError.message.includes('fetch') || safeError.message.includes('network'))) {
        throw createSafeError('Network error. Please check your connection and try again.', 'NETWORK_ERROR');
      }

      throw createSafeError(error, 'STATUS_ERROR');
    }
  }

  /**
   * Get default status message based on status value
   */
  private getDefaultStatusMessage(status: string): string {
    switch (status) {
      case 'queued':
        return 'Assessment is queued for processing...';
      case 'processing':
        return 'Processing your assessment...';
      case 'analyzing':
        return 'Analyzing your responses...';
      case 'completed':
        return 'Assessment completed successfully!';
      case 'failed':
        return 'Assessment processing failed.';
      default:
        return 'Processing...';
    }
  }

  /**
   * Get assessment result
   */
  private async getAssessmentResult(resultId: string): Promise<AssessmentResult> {
    // Use API proxy via apiService to fetch full result
    const { apiService } = await import('./apiService');
    const full = await apiService.getResultById(resultId);
    if (!full.success || !full.data) {
      throw new Error(full.message || 'Failed to fetch assessment result');
    }
    return full.data as AssessmentResult;
  }

  /**
   * Stop monitoring a job
   * ✅ IMPROVED: Cleanup event listener untuk prevent memory leaks
   */
  private stopMonitoring(jobId: string) {
    const state = this.activeMonitors.get(jobId);
    if (state) {
      state.isActive = false;
      this.activeMonitors.delete(jobId);

      // ✅ Cleanup event listener
      const cleanup = this.wsEventListeners.get(jobId);
      if (cleanup) {
        console.log(`🧹 Assessment Service: Cleaning up event listener for job ${jobId}`);
        cleanup();
        this.wsEventListeners.delete(jobId);
      }

      // Unsubscribe from WebSocket if active
      if (this.wsService && !state.websocketFailed) {
        this.wsService.unsubscribeFromJob(jobId);
      }
    }
  }

  /**
   * Check service health
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.HEALTH}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      activeMonitors: this.activeMonitors.size,
      monitors: Array.from(this.activeMonitors.entries()).map(([jobId, state]) => ({
        jobId,
        isActive: state.isActive,
        attempts: state.attempts,
        duration: Date.now() - state.startTime,
        useWebSocket: state.useWebSocket,
        websocketFailed: state.websocketFailed
      }))
    };
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService();
export default assessmentService;
