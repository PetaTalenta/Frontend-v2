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
  submitAssessmentWithPolling,
  getAssessmentStatus,
  getQueueStatus,
  formatTimeRemaining,
  isAssessmentServiceAvailable
} from '../services/enhanced-assessment-api';
import { calculateAllScores, validateAnswers } from './assessment-calculations';
import { generateComprehensiveAnalysis } from '../services/ai-analysis';

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
}

export interface WorkflowCallbacks {
  onStatusChange?: (state: WorkflowState) => void;
  onProgress?: (state: WorkflowState) => void;
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: Error, state: WorkflowState) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
}

/**
 * Assessment Workflow Manager
 * Handles the complete assessment submission and processing workflow
 */
export class AssessmentWorkflow {
  private state: WorkflowState;
  private callbacks: WorkflowCallbacks;
  private abortController?: AbortController;

  constructor(callbacks: WorkflowCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
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

    console.log(`Assessment Workflow: Status changed from ${previousState.status} to ${this.state.status}`);

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
    
    try {
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
    }
  }

  /**
   * Submit using real API with polling
   */
  private async submitWithRealAPI(
    scores: AssessmentScores,
    assessmentName: string
  ): Promise<AssessmentResult> {
    
    const statusResponse = await submitAssessmentWithPolling(
      scores,
      assessmentName,
      (status: AssessmentStatusResponse) => {
        // Update state based on API response
        this.updateState({
          status: status.data.status as WorkflowStatus,
          progress: status.data.progress,
          message: this.getStatusMessage(status.data.status, status.data.progress),
          jobId: status.data.jobId,
          estimatedTimeRemaining: formatTimeRemaining(status.data.estimatedTimeRemaining),
          queuePosition: status.data.queuePosition,
        });
      },
      this.callbacks.onTokenBalanceUpdate
    );

    // Convert API response to AssessmentResult
    const result = await this.convertApiResponseToResult(statusResponse, scores);

    this.updateState({
      status: 'completed',
      progress: 100,
      message: 'Assessment completed successfully',
      result,
    });

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(result);
    }

    return result;
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
    }

    this.updateState({
      status: 'completed',
      progress: 100,
      message: 'Assessment completed successfully',
      result,
    });

    if (this.callbacks.onComplete) {
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

    return {
      id: statusResponse.data.resultId || statusResponse.data.jobId,
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
    
    this.state = {
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
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
