/**
 * Assessment Workflow Utilities
 * Provides high-level workflow management for assessment processing
 */

import {
  AssessmentScores,
  AssessmentStatusResponse,
  AssessmentResult,
  convertScoresToApiData
} from '../types/assessment-results';
import {
  submitAssessment,
  formatTimeRemaining,
  isAssessmentServiceAvailable,
  getQueueStatus
} from '../services/enhanced-assessment-api';
import { calculateAllScores, validateAnswers } from './assessment-calculations';
import { generateApiOnlyAnalysis } from '../services/ai-analysis';
import {
  getAssessmentWebSocketService,
  AssessmentWebSocketEvent,
  isWebSocketSupported
} from '../services/websocket-assessment';

// Workflow status types
export type WorkflowStatus = 
  | 'idle'
  | 'validating'
  | 'submitting'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowState {
  status: WorkflowStatus;
  progress: number;
  message: string;
  jobId?: string;
  estimatedTimeRemaining?: string;
  queuePosition?: number;
  error?: string;
  result?: AssessmentResult;
  useWebSocket?: boolean;
  webSocketConnected?: boolean;
  canRetry?: boolean;
}

export interface WorkflowCallbacks {
  onStatusChange?: (state: WorkflowState) => void;
  onProgress?: (state: WorkflowState) => void;
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: Error, state: WorkflowState) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
  preferWebSocket?: boolean;
}

/**
 * Assessment Workflow Manager
 * Handles the complete assessment submission and processing workflow
 */
export class AssessmentWorkflow {
  private state: WorkflowState;
  private callbacks: WorkflowCallbacks;
  private abortController?: AbortController;
  private webSocketService = getAssessmentWebSocketService();
  private webSocketConnected = false;
  private isSubmitting = false; // Prevent duplicate submissions
  private currentJobId: string | null = null; // Track current job
  private callbackCalled = false; // Prevent duplicate callback calls
  private submissionId: string | null = null; // Track unique submission ID
  private isCompleted = false; // Global completion flag to prevent race conditions
  private completionSource: 'websocket' | 'polling' | null = null; // Track completion source
  private submissionStartTime: number = 0; // Track when submission started

  constructor(callbacks: WorkflowCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
      useWebSocket: false,
      webSocketConnected: false,
    };
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * Reset workflow state for new submission
   */
  reset(): void {
    console.log('Assessment Workflow: Resetting workflow state');
    this.isSubmitting = false;
    this.isCompleted = false;
    this.callbackCalled = false;
    this.completionSource = null;
    this.currentJobId = null;
    this.submissionId = null;
    this.submissionStartTime = 0;

    this.state = {
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
      useWebSocket: false,
      webSocketConnected: false,
    };
  }

  /**
   * Force reset submission state (for emergency recovery)
   */
  forceResetSubmission(): void {
    console.warn('Assessment Workflow: Force resetting submission state');
    this.isSubmitting = false;
    this.submissionStartTime = 0;
    this.currentJobId = null;
    this.submissionId = null;

    if (this.state.status === 'submitting' || this.state.status === 'queued' || this.state.status === 'processing') {
      this.updateState({
        status: 'idle',
        progress: 0,
        message: 'Ready to submit assessment',
      });
    }
  }

  /**
   * Update workflow state and notify callbacks
   */
  private updateState(updates: Partial<WorkflowState>) {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Ensure status is never undefined
    if (!this.state.status) {
      this.state.status = 'idle';
    }

    console.log(`Assessment Workflow: Status changed from ${previousState.status || 'undefined'} to ${this.state.status}`);

    // Call status change callback
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(this.state);
    }

    // Call progress callback if progress changed
    if (this.callbacks.onProgress && updates.progress !== undefined) {
      this.callbacks.onProgress(this.state);
    }
  }

  /**
   * Centralized completion handler to prevent race conditions and duplicate callbacks
   */
  private async handleCompletion(
    result: AssessmentResult,
    source: 'websocket' | 'polling'
  ): Promise<AssessmentResult> {
    // Check if already completed to prevent race conditions
    if (this.isCompleted) {
      console.warn(`Assessment Workflow: Completion already handled by ${this.completionSource}, ignoring ${source} completion`);
      return result;
    }

    // Mark as completed atomically
    this.isCompleted = true;
    this.completionSource = source;
    this.currentJobId = null; // Clear job on completion
    this.isSubmitting = false; // CRITICAL: Reset submission flag to allow future submissions

    console.log(`Assessment Workflow: Handling completion from ${source} with result ID: ${result.id} (submission: ${this.submissionId})`);

    // Update state
    this.updateState({
      status: 'completed',
      progress: 100,
      message: 'Assessment completed successfully',
      result
    });

    // Call completion callback only once
    if (this.callbacks.onComplete && !this.callbackCalled) {
      console.log(`Assessment Workflow: Calling onComplete callback from ${source} (submission: ${this.submissionId})`);
      this.callbackCalled = true;
      this.callbacks.onComplete(result);
    } else if (this.callbackCalled) {
      console.warn(`Assessment Workflow: Prevented duplicate callback call from ${source} (submission: ${this.submissionId})`);
    }

    // Update token balance
    if (this.callbacks.onTokenBalanceUpdate) {
      try {
        await this.callbacks.onTokenBalanceUpdate();
      } catch (error) {
        console.error('Error updating token balance:', error);
      }
    }

    return result;
  }

  /**
   * Submit assessment from raw answers
   */
  async submitFromAnswers(
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult> {

    // Check if already submitting to prevent duplicates
    if (this.isSubmitting) {
      console.warn('AssessmentWorkflow.submitFromAnswers: Duplicate submission attempt detected', {
        submissionId: this.submissionId,
        status: this.state.status,
        timeSinceStart: this.submissionStartTime ? Date.now() - this.submissionStartTime : 0
      });
      throw new Error('Assessment submission already in progress. Please wait for the current submission to complete.');
    }

    // Generate unique submission ID for tracking
    this.submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Assessment Workflow: Starting new submission with ID: ${this.submissionId}`);

    try {
      // Mark as submitting and reset completion flags
      this.isSubmitting = true;
      this.submissionStartTime = Date.now(); // Track when submission started
      this.isCompleted = false;
      this.callbackCalled = false;
      this.completionSource = null;

      // Reset state
      this.updateState({
        status: 'validating',
        progress: 0,
        message: 'Validating answers...',
        error: undefined,
        result: undefined,
      });

      // Validate answers
      const validation = validateAnswers(answers);
      if (!validation.isValid) {
        throw new Error(`Missing ${validation.missingQuestions.length} answers. Please complete all questions.`);
      }

      this.updateState({
        status: 'validating',
        progress: 10,
        message: 'Calculating scores...',
      });

      // Calculate scores
      const scores = calculateAllScores(answers);

      // Call internal submission method directly to avoid double-checking isSubmitting
      return await this._internalSubmitFromScores(scores, assessmentName);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateState({
        status: 'failed',
        progress: 0,
        message: 'Validation failed',
        error: errorMessage,
      });

      if (this.callbacks.onError) {
        this.callbacks.onError(error instanceof Error ? error : new Error(errorMessage), this.state);
      }

      throw error;
    } finally {
      // Always reset submission state
      this.isSubmitting = false;
    }
  }

  /**
   * Submit assessment from calculated scores
   */
  async submitFromScores(
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult> {

    // Store parameters for potential retry
    this.lastSubmissionParams = { scores, assessmentName };

    // Prevent duplicate submissions with safety check for stuck submissions
    if (this.isSubmitting) {
      const timeSinceStart = Date.now() - this.submissionStartTime;
      const maxSubmissionTime = 10 * 60 * 1000; // 10 minutes max

      if (timeSinceStart > maxSubmissionTime) {
        console.warn('Assessment Workflow: Submission appears stuck, auto-resetting...');
        console.warn('Assessment Workflow: Stuck submission details:', {
          timeSinceStart: Math.round(timeSinceStart / 1000) + 's',
          submissionId: this.submissionId,
          status: this.state.status
        });
        this.reset(); // Auto-reset stuck submission
      } else {
        console.warn('Assessment Workflow: External duplicate submission attempt detected');
        console.warn('Assessment Workflow: Current state:', {
          isSubmitting: this.isSubmitting,
          isCompleted: this.isCompleted,
          status: this.state.status,
          submissionId: this.submissionId,
          currentJobId: this.currentJobId,
          timeSinceStart: Math.round(timeSinceStart / 1000) + 's'
        });
        throw new Error('Assessment submission already in progress (external duplicate)');
      }
    }

    try {
      this.isSubmitting = true;
      this.submissionStartTime = Date.now(); // Track when submission started
      this.callbackCalled = false; // Reset callback flag for new submission
      this.submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Generate unique submission ID

      return await this._internalSubmitFromScores(scores, assessmentName);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateState({
        status: 'failed',
        progress: 0,
        message: 'Submission failed',
        error: errorMessage,
      });

      if (this.callbacks.onError) {
        this.callbacks.onError(error instanceof Error ? error : new Error(errorMessage), this.state);
      }

      throw error;
    } finally {
      // Always reset submission state
      this.isSubmitting = false;
    }
  }

  /**
   * Internal method for submitting from scores without duplicate submission checks
   * Used by both submitFromScores and submitFromAnswers to avoid race conditions
   */
  private async _internalSubmitFromScores(
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult> {

    console.log(`Assessment Workflow: Starting submission with ID: ${this.submissionId}`);

    this.updateState({
      status: 'submitting',
      progress: 20,
      message: 'Submitting assessment...',
    });

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    // Check if service is available
    const serviceAvailable = await isAssessmentServiceAvailable();

    if (serviceAvailable) {
      // Use real API with WebSocket priority
      return await this.submitWithRealAPI(scores, assessmentName);
    } else {
      // Use mock API (existing behavior)
      return await this.submitWithMockAPI(scores, assessmentName);
    }
  }

  /**
   * Submit using real API with intelligent retry logic and fallback
   */
  private async submitWithRealAPI(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {

    console.log('Assessment Workflow: Using real API submission with WebSocket monitoring...');

    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`Assessment Workflow: Retry attempt ${attempt}/${maxRetries}`);

          // Check if we have a current job and its status before retrying
          if (this.currentJobId) {
            console.log(`Assessment Workflow: Checking status of existing job ${this.currentJobId} before retry`);
            try {
              const jobStatus = await this.checkJobStatus(this.currentJobId);

              if (jobStatus.data.status === 'processing' || jobStatus.data.status === 'queued') {
                console.log(`Assessment Workflow: Job ${this.currentJobId} is still ${jobStatus.data.status}, continuing to monitor instead of retrying`);
                return await this.monitorExistingJob(this.currentJobId, scores);
              } else if (jobStatus.data.status === 'completed') {
                console.log(`Assessment Workflow: Job ${this.currentJobId} completed, retrieving result`);
                return await this.convertStatusToResult(jobStatus, scores);
              } else if (jobStatus.data.status === 'failed') {
                console.log(`Assessment Workflow: Job ${this.currentJobId} failed on server, clearing and retrying`);
                this.currentJobId = null; // Clear failed job
              }
            } catch (statusError) {
              console.log(`Assessment Workflow: Could not check job status, proceeding with retry:`, statusError);
              this.currentJobId = null; // Clear job if status check fails
            }
          }

          this.updateState({
            status: 'submitting',
            message: `Retrying assessment submission (attempt ${attempt}/${maxRetries})...`,
            progress: 5
          });

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Force WebSocket connection and submission
        console.log('Assessment Workflow: Forcing WebSocket connection for real-time monitoring...');

        if (!isWebSocketSupported()) {
          throw new Error('WebSocket not supported in this environment. Please use a modern browser.');
        }

        try {
          // Ensure WebSocket connection before submission
          await this.ensureWebSocketConnection();
          return await this.submitWithWebSocket(scores, assessmentName);
        } catch (wsError) {
          console.error('Assessment Workflow: WebSocket submission failed:', wsError);

          // Only fallback to polling in extreme cases (server issues, etc.)
          console.warn('Assessment Workflow: Falling back to polling due to WebSocket failure. This may impact performance.');
          return await this.submitWithPolling(scores, assessmentName);
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Assessment submission failed');
        console.error(`Assessment Workflow: Submission failed (attempt ${attempt}/${maxRetries})`, error);

        if (attempt === maxRetries) {
          // Final attempt failed
          this.updateState({
            status: 'failed',
            useWebSocket: false,
            webSocketConnected: false,
            message: `Assessment submission failed after ${maxRetries} attempts. Please check your connection and try again.`,
            canRetry: true
          });

          // Call error callback
          if (this.callbacks.onError) {
            this.callbacks.onError(lastError, this.state);
          }

          // Re-throw the error
          throw new Error(`Assessment submission failed after ${maxRetries} attempts: ${lastError.message}. Please try again.`);
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Unknown error during assessment submission');
  }

  /**
   * Submit using WebSocket for real-time updates
   */
  private async submitWithWebSocket(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {

    // Check if we already have a job in progress (only if it's not from a retry)
    if (this.currentJobId) {
      console.log('Assessment Workflow: Checking existing job before WebSocket submission:', this.currentJobId);
      try {
        const jobStatus = await this.checkJobStatus(this.currentJobId);
        if (jobStatus.data.status === 'processing' || jobStatus.data.status === 'queued') {
          console.log('Assessment Workflow: Continuing to monitor existing job via WebSocket');
          return await this.monitorExistingJob(this.currentJobId, scores);
        }
      } catch (error) {
        console.log('Assessment Workflow: Could not check existing job, proceeding with new submission');
        this.currentJobId = null;
      }
    }

    // Ensure WebSocket connection is established
    if (!this.webSocketConnected) {
      console.log('Assessment Workflow: WebSocket not connected, establishing connection...');
      await this.ensureWebSocketConnection();

      if (!this.webSocketConnected) {
        throw new Error('Failed to establish WebSocket connection. Real-time monitoring is required.');
      }
    }

    // First submit the assessment to get jobId
    const submitResponse = await submitAssessment(scores, assessmentName, this.callbacks.onTokenBalanceUpdate);
    const jobId = submitResponse.data.jobId;
    this.currentJobId = jobId;

    this.updateState({
      status: 'queued',
      progress: 10,
      message: 'Assessment submitted, monitoring progress...',
      jobId,
      useWebSocket: this.webSocketConnected,
    });

    // If WebSocket is connected, use it for real-time updates
    if (this.webSocketConnected) {
      return await this.monitorWithWebSocket(jobId, scores);
    } else {
      // Fall back to polling if WebSocket is not available
      console.log('Assessment Workflow: WebSocket not available, falling back to polling');
      return await this.monitorWithPolling(jobId, scores);
    }
  }

  /**
   * Monitor existing job via WebSocket
   */
  private async monitorExistingJob(
    jobId: string,
    scores: AssessmentScores
  ): Promise<AssessmentResult> {

    this.updateState({
      status: 'processing',
      progress: 30,
      message: 'Continuing to monitor existing assessment...',
      jobId,
      useWebSocket: this.webSocketConnected,
    });

    if (this.webSocketConnected) {
      return await this.monitorWithWebSocket(jobId, scores);
    } else {
      return await this.monitorWithPolling(jobId, scores);
    }
  }

  /**
   * Monitor job progress using WebSocket
   */
  private async monitorWithWebSocket(
    jobId: string,
    scores: AssessmentScores
  ): Promise<AssessmentResult> {

    return new Promise((resolve, reject) => {
      let isResolved = false;
      let hasFallenBackToPolling = false;

      // Setup WebSocket callbacks
      this.webSocketService.setCallbacks({
        onAssessmentEvent: async (event: AssessmentWebSocketEvent) => {
          if (event.jobId !== jobId || isResolved) return;

          console.log('Assessment Workflow: Received WebSocket event', event);

          // Handle different event types based on API documentation
          if (event.type === 'analysis-started') {
            this.updateState({
              status: 'processing',
              progress: 25,
              message: event.message || 'Analysis started...',
              webSocketConnected: true,
            });
          } else if (event.type === 'analysis-complete' && event.resultId) {
            if (isResolved) return; // Prevent duplicate handling
            isResolved = true;

            // Create minimal result object for callback
            const result = {
              id: event.resultId,
              userId: 'current-user',
              createdAt: new Date().toISOString(),
              status: 'completed' as const,
              assessment_data: convertScoresToApiData(scores),
              persona_profile: null // Will be fetched from API on result page
            };

            try {
              // Use centralized completion handler
              const finalResult = await this.handleCompletion(result, 'websocket');

              // Redirect to result page
              console.log(`Assessment Workflow: Redirecting to result page with ID: ${event.resultId}`);
              this.redirectToResultPage(event.resultId).catch(error => {
                console.error('Assessment Workflow: Error during redirect:', error);
              });

              resolve(finalResult);
            } catch (error) {
              console.error('Assessment Workflow: Error in WebSocket completion handler:', error);
              reject(error);
            }
          } else if (event.type === 'analysis-failed') {
            isResolved = true;
            this.currentJobId = null; // Clear job on failure
            const errorMessage = event.error || event.message || 'Assessment processing failed';
            this.updateState({
              status: 'failed',
              message: errorMessage,
              canRetry: true
            });

            // Call error callback
            if (this.callbacks.onError) {
              this.callbacks.onError(new Error(errorMessage), this.state);
            }

            reject(new Error(errorMessage));
          }
        },
        onConnected: () => {
          this.webSocketConnected = true;
          this.updateState({ webSocketConnected: true });
          // Subscribe to job updates
          this.webSocketService.subscribeToJob(jobId);
        },
        onDisconnected: () => {
          this.webSocketConnected = false;
          this.updateState({ webSocketConnected: false });
          // Don't fail immediately on disconnect - the job might still be processing
        },
        onError: (error) => {
          console.error('Assessment Workflow: WebSocket error', error);
          // Don't fail immediately on WebSocket error - fall back to polling
          if (!isResolved && !hasFallenBackToPolling && !this.isCompleted) {
            hasFallenBackToPolling = true;
            console.log('Assessment Workflow: WebSocket error, falling back to polling');
            this.monitorWithPolling(jobId, scores).then(resolve).catch(reject);
          }
        },
      });

      // Subscribe to job updates if already connected
      if (this.webSocketConnected) {
        this.webSocketService.subscribeToJob(jobId);
      }

      // Set progressive timeouts for different phases
      let timeoutId: NodeJS.Timeout;
      let progressTimeoutId: NodeJS.Timeout;
      let statusCheckTimeoutId: NodeJS.Timeout;

      // Progress update every 30 seconds to keep user informed
      const updateProgress = () => {
        if (!isResolved) {
          this.updateState({
            message: 'Analysis in progress... This may take several minutes for complex assessments.',
            progress: Math.min(this.state.progress + 5, 85)
          });

          progressTimeoutId = setTimeout(updateProgress, 30000);
        }
      };

      // Check job status every 60 seconds as backup
      const checkStatus = async () => {
        if (!isResolved && !this.isCompleted) {
          try {
            const status = await this.checkJobStatus(jobId);
            if (status.data.status === 'completed') {
              if (isResolved || this.isCompleted) return; // Prevent race condition
              isResolved = true;

              try {
                const result = await this.convertStatusToResult(status, scores);
                const finalResult = await this.handleCompletion(result, 'websocket');
                resolve(finalResult);
              } catch (conversionError) {
                console.error('Assessment Workflow: Error converting status to result:', conversionError);
                reject(conversionError);
              }
            } else if (status.data.status === 'failed') {
              isResolved = true;
              this.currentJobId = null;
              const errorMessage = status.data.error || 'Assessment processing failed';
              this.updateState({
                status: 'failed',
                message: errorMessage,
                canRetry: true
              });
              reject(new Error(errorMessage));
            } else {
              // Still processing, schedule next check
              statusCheckTimeoutId = setTimeout(checkStatus, 10000); // Check every 10 seconds
            }
          } catch (error) {
            console.log('Assessment Workflow: Status check failed, continuing to wait for WebSocket events. Error:', error);
            // Don't schedule another check if already resolved
            if (!isResolved && !this.isCompleted) {
              statusCheckTimeoutId = setTimeout(checkStatus, 10000); // Retry every 10 seconds
            }
          }
        }
      };

      // Start progress updates and status checks
      progressTimeoutId = setTimeout(updateProgress, 30000);
      statusCheckTimeoutId = setTimeout(checkStatus, 10000); // Check status every 10 seconds instead of 60

      // Main timeout - OPTIMIZED to 5 minutes for faster failure detection
      timeoutId = setTimeout(async () => {
        if (!isResolved && !this.isCompleted) {
          console.log('Assessment Workflow: WebSocket timeout reached, checking final status');

          try {
            // Check job status one more time before failing
            const status = await this.checkJobStatus(jobId);
            if (status.data.status === 'completed') {
              if (isResolved || this.isCompleted) return; // Prevent race condition
              isResolved = true;

              try {
                const result = await this.convertStatusToResult(status, scores);
                const finalResult = await this.handleCompletion(result, 'websocket');
                resolve(finalResult);
                return;
              } catch (conversionError) {
                console.error('Assessment Workflow: Error converting status to result on timeout:', conversionError);
                reject(conversionError);
                return;
              }
            } else if (status.data.status === 'processing' || status.data.status === 'queued') {
              // Job is still processing, fall back to polling
              if (!hasFallenBackToPolling && !this.isCompleted) {
                hasFallenBackToPolling = true;
                console.log('Assessment Workflow: Job still processing after timeout, falling back to polling');
                this.monitorWithPolling(jobId, scores).then(resolve).catch(reject);
                return;
              }
            }
          } catch (error) {
            console.log('Assessment Workflow: Could not check job status on timeout');
          }

          isResolved = true;
          this.updateState({
            status: 'failed',
            message: 'Assessment is taking longer than expected. Please check the results page or try again.',
            canRetry: true
          });

          // Call error callback
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error('Assessment timeout - please check results or try again'), this.state);
          }

          reject(new Error('Assessment timeout - please check results or try again'));
        }
      }, 240000); // 4 minutes timeout (optimized for AI processing)

      // Clean up timeouts when resolved
      const cleanup = () => {
        clearTimeout(timeoutId);
        clearTimeout(progressTimeoutId);
        clearTimeout(statusCheckTimeoutId);
      };

      // Ensure cleanup happens on resolution
      const originalResolve = resolve;
      const originalReject = reject;
      resolve = (value: any) => {
        cleanup();
        originalResolve(value);
      };
      reject = (error: any) => {
        cleanup();
        originalReject(error);
      };
    });
  }



  /**
   * Submit using polling fallback when WebSocket is not available
   */
  private async submitWithPolling(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {

    // Submit assessment to get jobId
    const submitResponse = await submitAssessment(scores, assessmentName, this.callbacks.onTokenBalanceUpdate);
    const jobId = submitResponse.data.jobId;
    this.currentJobId = jobId;

    this.updateState({
      status: 'queued',
      progress: 10,
      message: 'Assessment submitted, monitoring via polling...',
      jobId,
      useWebSocket: false,
    });

    return await this.monitorWithPolling(jobId, scores);
  }

  /**
   * Monitor job progress using polling
   */
  private async monitorWithPolling(
    jobId: string,
    scores: AssessmentScores
  ): Promise<AssessmentResult> {

    console.log(`Assessment Workflow: Starting polling for job ${jobId}`);

    const maxAttempts = 120; // 10 minutes with 5-second intervals
    let attempts = 0;
    let delay = 5000; // Start with 5 seconds

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Assessment Workflow: Polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);

        const status = await this.checkJobStatus(jobId);

        // Update progress based on status
        const progress = this.calculateProgress(status.data.status, attempts, maxAttempts);
        this.updateState({
          status: status.data.status as WorkflowStatus,
          progress,
          message: this.getStatusMessage(status.data.status, progress),
          queuePosition: status.data.queuePosition,
          estimatedTimeRemaining: status.data.estimatedTimeRemaining,
        });

        // Check if completed
        if (status.data.status === 'completed') {
          console.log(`Assessment Workflow: Job ${jobId} completed after ${attempts} polling attempts`);
          this.currentJobId = null; // Clear job on completion
          return await this.convertStatusToResult(status, scores);
        }

        // Check if failed
        if (status.data.status === 'failed') {
          this.currentJobId = null; // Clear job on failure
          const errorMessage = status.data.error || 'Assessment processing failed';
          this.updateState({
            status: 'failed',
            message: errorMessage,
            canRetry: true
          });

          // Call error callback
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(errorMessage), this.state);
          }

          throw new Error(errorMessage);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, delay));

        // Gradually increase delay to reduce server load
        delay = Math.min(delay + 1000, 10000); // Max 10 seconds

      } catch (error) {
        console.error(`Assessment Workflow: Polling error for job ${jobId}:`, error);

        if (attempts >= maxAttempts) {
          this.currentJobId = null;
          this.updateState({
            status: 'failed',
            message: 'Assessment monitoring failed after maximum attempts',
            canRetry: true
          });

          // Call error callback
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error('Assessment monitoring failed'), this.state);
          }

          throw new Error('Assessment monitoring failed after maximum attempts');
        }

        // Wait before retry on error
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Timeout reached
    this.currentJobId = null;
    this.updateState({
      status: 'failed',
      message: 'Assessment monitoring timeout - please check results page or try again',
      canRetry: true
    });

    // Call error callback
    if (this.callbacks.onError) {
      this.callbacks.onError(new Error('Assessment monitoring timeout'), this.state);
    }

    throw new Error('Assessment monitoring timeout');
  }

  /**
   * Check job status via API
   */
  private async checkJobStatus(jobId: string): Promise<any> {
    const { getAssessmentStatus } = await import('../services/enhanced-assessment-api');
    return await getAssessmentStatus(jobId);
  }

  /**
   * Calculate progress based on status and polling attempts
   */
  private calculateProgress(status: string, attempts: number, maxAttempts: number): number {
    switch (status) {
      case 'queued':
        return Math.min(10 + (attempts / maxAttempts) * 20, 30);
      case 'processing':
        return Math.min(30 + (attempts / maxAttempts) * 60, 90);
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return Math.min(5 + (attempts / maxAttempts) * 25, 30);
    }
  }

  /**
   * Handle assessment completion from WebSocket
   */
  private async handleAssessmentCompletion(
    resultId: string,
    scores: AssessmentScores
  ): Promise<AssessmentResult> {

    this.updateState({
      status: 'completed',
      progress: 100,
      message: 'Assessment completed successfully',
    });

    // Generate AI analysis for consistent results
    const aiAnalysis = await generateApiOnlyAnalysis(scores);

    // Create result object
    const result: AssessmentResult = {
      id: resultId,
      userId: 'current-user', // This should come from auth context
      createdAt: new Date().toISOString(),
      status: 'completed',
      assessment_data: convertScoresToApiData(scores),
      persona_profile: aiAnalysis, // Include AI analysis for consistency
    };

    // Note: No longer saving to localStorage - data will be fetched from API

    this.updateState({ result });

    console.log(`Assessment Workflow: WebSocket assessment completed successfully with result ID: ${result.id}`);

    // Only call onComplete callback once
    if (this.callbacks.onComplete && !this.callbackCalled) {
      console.log(`Assessment Workflow: Calling WebSocket onComplete callback with result ID: ${result.id} (submission: ${this.submissionId})`);
      this.callbackCalled = true;
      this.callbacks.onComplete(result);
    } else if (this.callbackCalled) {
      console.warn(`Assessment Workflow: Prevented duplicate WebSocket callback call for submission: ${this.submissionId}`);
    }

    return result;
  }

  /**
   * Redirect to result page when analysis is complete
   * Added delay to ensure data is properly saved in database
   */
  private async redirectToResultPage(resultId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      console.log(`Assessment Workflow: Waiting 5 seconds before redirecting to /results/${resultId}`);

      // Wait 5 seconds to ensure API has processed and saved the data
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log(`Assessment Workflow: Now redirecting to /results/${resultId}`);
      // Use window.location for immediate redirect
      window.location.href = `/results/${resultId}`;
    }
  }

  /**
   * Connect to WebSocket (should be called by components)
   */
  async connectWebSocket(token: string): Promise<void> {
    if (!isWebSocketSupported()) {
      throw new Error('WebSocket not supported');
    }

    try {
      await this.webSocketService.connect(token);
      this.webSocketConnected = true;
      this.updateState({ webSocketConnected: true });
      console.log('Assessment Workflow: WebSocket connected successfully');
    } catch (error) {
      this.webSocketConnected = false;
      this.updateState({ webSocketConnected: false });
      console.error('Assessment Workflow: WebSocket connection failed', error);
      throw error;
    }
  }

  /**
   * Ensure WebSocket is connected (mandatory for real-time monitoring)
   */
  async ensureWebSocketConnection(token?: string): Promise<void> {
    if (this.webSocketConnected) {
      console.log('Assessment Workflow: WebSocket already connected');
      return;
    }

    // Get token from parameter or localStorage
    const authToken = token || localStorage.getItem('token') || '';
    if (!authToken) {
      throw new Error('No authentication token available for WebSocket connection');
    }

    console.log('Assessment Workflow: Attempting WebSocket connection...');
    try {
      await this.connectWebSocket(authToken);
      console.log('Assessment Workflow: WebSocket connection established');
    } catch (error) {
      console.error('Assessment Workflow: WebSocket connection failed:', error);
      // WebSocket is now mandatory for real-time monitoring
      this.webSocketConnected = false;
      this.updateState({ webSocketConnected: false });
      throw new Error(`Failed to establish WebSocket connection: ${error.message}`);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    this.webSocketService.disconnect();
    this.webSocketConnected = false;
    this.updateState({ webSocketConnected: false });
  }

  /**
   * Submit using mock API (existing behavior)
   */
  private async submitWithMockAPI(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {
    
    this.updateState({
      status: 'processing',
      progress: 50,
      message: 'Processing with AI analysis...',
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.updateState({
      progress: 80,
      message: 'Generating persona profile...',
    });

    // Generate AI analysis
    const aiAnalysis = await generateApiOnlyAnalysis(scores);

    // Create result
    const result: AssessmentResult = {
      id: 'result-' + Date.now().toString(36),
      userId: 'current-user', // This should come from auth context
      createdAt: new Date().toISOString(),
      status: 'completed',
      assessment_data: convertScoresToApiData(scores),
      persona_profile: aiAnalysis,
    };

    // Note: No longer saving to localStorage - data will be fetched from API

    this.updateState({
      status: 'completed',
      progress: 100,
      message: 'Assessment completed successfully',
      result,
    });

    console.log(`Assessment Workflow: Fallback assessment completed successfully with result ID: ${result.id}`);

    if (this.callbacks.onComplete && !this.callbackCalled) {
      console.log(`Assessment Workflow: Calling fallback onComplete callback with result ID: ${result.id} (submission: ${this.submissionId})`);
      this.callbackCalled = true;
      this.callbacks.onComplete(result);
    } else if (this.callbackCalled) {
      console.warn(`Assessment Workflow: Prevented duplicate fallback callback call for submission: ${this.submissionId}`);
    }

    // Update token balance
    if (this.callbacks.onTokenBalanceUpdate) {
      try {
        await this.callbacks.onTokenBalanceUpdate();
      } catch (error) {
        console.error('Error updating token balance:', error);
      }
    }

    return result;
  }

  /**
   * Convert API response to AssessmentResult format
   */
  private async convertApiResponseToResult(
    statusResponse: AssessmentStatusResponse,
    scores: AssessmentScores
  ): Promise<AssessmentResult> {

    // Use resultId if available, otherwise fallback to jobId
    const resultId = statusResponse.data.resultId || statusResponse.data.jobId;
    console.log(`Assessment Workflow: Converting API response - resultId: ${statusResponse.data.resultId}, jobId: ${statusResponse.data.jobId}, using: ${resultId}`);

    // Check if the API response already contains the persona profile
    let personaProfile;
    if (statusResponse.data.persona_profile) {
      console.log('Assessment Workflow: Using persona profile from API response');
      personaProfile = statusResponse.data.persona_profile;
    } else if (statusResponse.data.result && statusResponse.data.result.persona_profile) {
      console.log('Assessment Workflow: Using persona profile from API result');
      personaProfile = statusResponse.data.result.persona_profile;
    } else {
      // If no persona profile in response, we need to generate it via API
      console.log('Assessment Workflow: No persona profile in response, calling API analysis');
      personaProfile = await generateApiOnlyAnalysis(scores);
    }

    return {
      id: resultId,
      userId: statusResponse.data.userId,
      createdAt: statusResponse.data.createdAt,
      status: 'completed',
      assessment_data: convertScoresToApiData(scores),
      persona_profile: personaProfile,
    };
  }

  /**
   * Convert status response to AssessmentResult format (alias for convertApiResponseToResult)
   */
  private async convertStatusToResult(
    statusResponse: any,
    scores: AssessmentScores
  ): Promise<AssessmentResult> {
    console.log(`Assessment Workflow: Converting status to result for job ${statusResponse.data.jobId}`);

    const result = await this.convertApiResponseToResult(statusResponse, scores);

    // Use centralized completion handler to prevent race conditions
    return await this.handleCompletion(result, 'polling');
  }

  /**
   * Get user-friendly status message
   */
  private getStatusMessage(status: string, progress: number): string {
    switch (status) {
      case 'queued':
        return 'Assessment queued for processing...';
      case 'processing':
        return `Processing assessment... (${progress}%)`;
      case 'completed':
        return 'Assessment completed successfully!';
      case 'failed':
        return 'Assessment processing failed';
      default:
        return 'Processing assessment...';
    }
  }

  /**
   * Cancel the current workflow
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }

    // Reset submission state
    this.isSubmitting = false;
    this.currentJobId = null;

    this.updateState({
      status: 'cancelled',
      message: 'Assessment submission cancelled',
    });
  }

  /**
   * Reset workflow to initial state
   */
  reset(): void {
    this.cancel();

    // Reset all state variables
    this.isSubmitting = false;
    this.currentJobId = null;
    this.webSocketConnected = false;
    this.callbackCalled = false; // Reset callback flag

    this.state = {
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
      useWebSocket: false,
      webSocketConnected: false,
    };
  }

  /**
   * Retry failed assessment with the last used parameters
   */
  async retry(): Promise<AssessmentResult | null> {
    if (!this.lastSubmissionParams) {
      console.error('Assessment Workflow: No previous submission to retry');
      return null;
    }

    console.log('Assessment Workflow: Retrying last assessment...');

    const { scores, assessmentName } = this.lastSubmissionParams;

    // Reset state for retry
    this.updateState({
      status: 'idle',
      progress: 0,
      message: 'Preparing to retry assessment...',
      result: null,
      jobId: null,
      canRetry: false
    });

    // Wait a moment before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.submitFromScores(scores, assessmentName);
  }

  // Store last submission parameters for retry
  private lastSubmissionParams: {
    scores: AssessmentScores;
    assessmentName: string;
  } | null = null;
}

/**
 * Convenience function to create and run a simple assessment workflow
 */
export async function runAssessmentWorkflow(
  answers: Record<number, number | null>,
  callbacks: WorkflowCallbacks = {},
  assessmentName: string = 'AI-Driven Talent Mapping'
): Promise<AssessmentResult> {
  
  const workflow = new AssessmentWorkflow(callbacks);
  return await workflow.submitFromAnswers(answers, assessmentName);
}

/**
 * Get current queue information
 */
export async function getAssessmentQueueInfo(): Promise<{
  queueLength: number;
  estimatedWaitTime: string;
  averageProcessingTime: string;
  isServiceAvailable: boolean;
}> {
  
  try {
    const serviceAvailable = await isAssessmentServiceAvailable();
    
    if (!serviceAvailable) {
      return {
        queueLength: 0,
        estimatedWaitTime: 'Immediate (Mock API)',
        averageProcessingTime: '2-3 seconds',
        isServiceAvailable: false,
      };
    }

    const queueStatus = await getQueueStatus();
    
    return {
      queueLength: queueStatus.data.queueLength,
      estimatedWaitTime: queueStatus.data.estimatedWaitTime,
      averageProcessingTime: queueStatus.data.averageProcessingTime,
      isServiceAvailable: true,
    };
    
  } catch (error) {
    console.error('Error getting queue info:', error);
    return {
      queueLength: 0,
      estimatedWaitTime: 'Unknown',
      averageProcessingTime: 'Unknown',
      isServiceAvailable: false,
    };
  }
}
