/**
 * Assessment Workflow Utilities
 * Provides high-level workflow management for assessment processing
 */

import {
  AssessmentScores,
  AssessmentStatusResponse,
  AssessmentResult
} from '../types/assessment-results';
import {
  submitAssessment,
  formatTimeRemaining,
  isAssessmentServiceAvailable
} from '../services/enhanced-assessment-api';
import { calculateAllScores, validateAnswers } from './assessment-calculations';
import { generateComprehensiveAnalysis } from '../services/ai-analysis';
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
   * Submit assessment from raw answers
   */
  async submitFromAnswers(
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult> {
    
    try {
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

      // Submit assessment
      return await this.submitFromScores(scores, assessmentName);

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
    }
  }

  /**
   * Submit assessment from calculated scores
   */
  async submitFromScores(
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult> {

    // Prevent duplicate submissions
    if (this.isSubmitting) {
      console.warn('Assessment Workflow: Submission already in progress, ignoring duplicate request');
      throw new Error('Assessment submission already in progress');
    }

    try {
      this.isSubmitting = true;

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
        // Use real API with polling
        return await this.submitWithRealAPI(scores, assessmentName);
      } else {
        // Use mock API (existing behavior)
        return await this.submitWithMockAPI(scores, assessmentName);
      }

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
   * Submit using real API with WebSocket only (no polling fallback)
   */
  private async submitWithRealAPI(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {

    // Check if WebSocket is supported
    if (!isWebSocketSupported()) {
      throw new Error('WebSocket is not supported in this browser. Please use a modern browser that supports WebSocket connections.');
    }

    // WebSocket is mandatory - no fallback to polling
    console.log('Assessment Workflow: Using WebSocket-only submission...');

    try {
      return await this.submitWithWebSocket(scores, assessmentName);
    } catch (error) {
      console.error('Assessment Workflow: WebSocket submission failed', error);

      // Update state to show WebSocket failure
      this.updateState({
        status: 'failed',
        useWebSocket: false,
        webSocketConnected: false,
        message: 'WebSocket connection failed. Please check your connection and try again.',
      });

      // Call error callback
      if (this.callbacks.onError) {
        this.callbacks.onError(error instanceof Error ? error : new Error('WebSocket connection failed'), this.state);
      }

      // Re-throw the error instead of falling back to polling
      throw new Error(`WebSocket connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh the page and try again.`);
    }
  }

  /**
   * Submit using WebSocket for real-time updates
   */
  private async submitWithWebSocket(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {

    // Check if we already have a job in progress
    if (this.currentJobId) {
      console.warn('Assessment Workflow: Job already in progress:', this.currentJobId);
      throw new Error('Assessment job already in progress');
    }

    // Ensure WebSocket is connected before proceeding
    if (!this.webSocketConnected) {
      throw new Error('WebSocket connection required but not established. Please ensure WebSocket is connected before submitting.');
    }

    // First submit the assessment to get jobId
    const submitResponse = await submitAssessment(scores, assessmentName, this.callbacks.onTokenBalanceUpdate);
    const jobId = submitResponse.data.jobId;
    this.currentJobId = jobId;

    this.updateState({
      status: 'queued',
      progress: 10,
      message: 'Assessment submitted, waiting for real-time updates...',
      jobId,
      useWebSocket: true,
    });

    // Setup WebSocket connection and monitoring
    return new Promise((resolve, reject) => {
      let isResolved = false;

      // Setup WebSocket callbacks
      this.webSocketService.setCallbacks({
        onAssessmentEvent: (event: AssessmentWebSocketEvent) => {
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
            isResolved = true;
            this.updateState({
              status: 'completed',
              progress: 100,
              message: event.message || 'Analysis completed successfully!',
              webSocketConnected: true,
            });
            this.handleAssessmentCompletion(event.resultId, scores)
              .then(resolve)
              .catch(reject);
          } else if (event.type === 'analysis-failed') {
            isResolved = true;
            const errorMessage = event.error || event.message || 'Assessment processing failed';
            this.updateState({
              status: 'failed',
              message: errorMessage
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
        },
        onError: (error) => {
          console.error('Assessment Workflow: WebSocket error', error);
          if (!isResolved) {
            isResolved = true;
            this.updateState({
              status: 'failed',
              message: `WebSocket error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });

            // Call error callback
            if (this.callbacks.onError) {
              this.callbacks.onError(error instanceof Error ? error : new Error('WebSocket error'), this.state);
            }

            reject(error);
          }
        },
      });

      // Connect to WebSocket (assuming token is available from auth context)
      // This should be handled by the component using this workflow
      console.log('Assessment Workflow: WebSocket setup complete, waiting for connection...');

      // Set timeout for WebSocket events - wait for analysis to start or complete
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          const timeoutMessage = this.webSocketConnected
            ? 'Analysis timeout - no response received from server. Please try again.'
            : 'WebSocket connection timeout. Please check your connection and try again.';

          this.updateState({
            status: 'failed',
            message: timeoutMessage
          });

          // Call error callback
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(timeoutMessage), this.state);
          }

          reject(new Error(timeoutMessage));
        }
      }, 30000); // 30 seconds timeout for analysis to complete
    });
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
    const aiAnalysis = await generateComprehensiveAnalysis(scores);

    // Create result object
    const result: AssessmentResult = {
      id: resultId,
      userId: 'current-user', // This should come from auth context
      createdAt: new Date().toISOString(),
      status: 'completed',
      assessment_data: scores,
      persona_profile: aiAnalysis, // Include AI analysis for consistency
    };

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`assessment-result-${result.id}`, JSON.stringify(result));
      console.log(`Assessment Workflow: Saved WebSocket result to localStorage with ID: ${result.id}`);
    }

    this.updateState({ result });

    console.log(`Assessment Workflow: WebSocket assessment completed successfully with result ID: ${result.id}`);

    if (this.callbacks.onComplete) {
      console.log(`Assessment Workflow: Calling WebSocket onComplete callback with result ID: ${result.id}`);
      this.callbacks.onComplete(result);
    }

    return result;
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
   * Ensure WebSocket is connected with token
   */
  async ensureWebSocketConnection(token: string): Promise<void> {
    if (this.webSocketConnected) {
      console.log('Assessment Workflow: WebSocket already connected');
      return;
    }

    console.log('Assessment Workflow: Establishing WebSocket connection...');
    await this.connectWebSocket(token);
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
    const aiAnalysis = await generateComprehensiveAnalysis(scores);

    // Create result
    const result: AssessmentResult = {
      id: 'result-' + Date.now().toString(36),
      userId: 'current-user', // This should come from auth context
      createdAt: new Date().toISOString(),
      status: 'completed',
      assessment_data: scores,
      persona_profile: aiAnalysis,
    };

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`assessment-result-${result.id}`, JSON.stringify(result));
      console.log(`Assessment Workflow: Saved fallback result to localStorage with ID: ${result.id}`);
    }

    this.updateState({
      status: 'completed',
      progress: 100,
      message: 'Assessment completed successfully',
      result,
    });

    console.log(`Assessment Workflow: Fallback assessment completed successfully with result ID: ${result.id}`);

    if (this.callbacks.onComplete) {
      console.log(`Assessment Workflow: Calling fallback onComplete callback with result ID: ${result.id}`);
      this.callbacks.onComplete(result);
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

    // In a real implementation, the API would return the full result
    // For now, we'll generate the analysis locally
    const aiAnalysis = await generateComprehensiveAnalysis(scores);

    // Use resultId if available, otherwise fallback to jobId
    const resultId = statusResponse.data.resultId || statusResponse.data.jobId;
    console.log(`Assessment Workflow: Converting API response - resultId: ${statusResponse.data.resultId}, jobId: ${statusResponse.data.jobId}, using: ${resultId}`);

    return {
      id: resultId,
      userId: statusResponse.data.userId,
      createdAt: statusResponse.data.createdAt,
      status: 'completed',
      assessment_data: scores,
      persona_profile: aiAnalysis,
    };
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

    this.state = {
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
      useWebSocket: false,
      webSocketConnected: false,
    };
  }
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
