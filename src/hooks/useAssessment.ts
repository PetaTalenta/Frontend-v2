/**
 * Simplified Assessment Hook
 * Clean, efficient hook for assessment workflow using the consolidated service
 */

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AssessmentResult, AssessmentStatusResponse } from '../types/assessment-results';
import { createSafeError, validateApiResponse } from '../utils/safe-error-handling';

interface AssessmentState {
  status: 'idle' | 'submitting' | 'monitoring' | 'completed' | 'failed';
  progress: number;
  message: string;
  jobId?: string;
  error?: string;
  result?: AssessmentResult;
}

interface AssessmentOptions {
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: any) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
  preferWebSocket?: boolean;
}

interface UseAssessmentReturn {
  state: AssessmentState;
  isIdle: boolean;
  isSubmitting: boolean;
  isMonitoring: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  result: AssessmentResult | null;
  submitFromAnswers: (answers: Record<number, number | null>, assessmentName?: string) => Promise<AssessmentResult | null>;
  reset: () => void;
  cancel: () => void;
}

/**
 * Simplified hook for managing assessment workflow
 */
export function useAssessment(options: AssessmentOptions = {}): UseAssessmentReturn {
  const { token } = useAuth();
  const [state, setState] = useState<AssessmentState>({
    status: 'idle',
    progress: 0,
    message: 'Ready to submit assessment',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);

  // Update state helper
  const updateState = useCallback((updates: Partial<AssessmentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Progress handler with enhanced safety
  const handleProgress = useCallback((status: AssessmentStatusResponse) => {
    try {
      // Enhanced validation using utility function
      const validation = validateApiResponse(status, ['data']);
      if (!validation.isValid) {
        console.warn('Assessment: Invalid status response received:', validation.error?.message);
        return;
      }

      const safeStatus = validation.safeResponse;

      // Additional validation for data structure
      if (!safeStatus.data || typeof safeStatus.data !== 'object') {
        console.warn('Assessment: Invalid status.data structure received:', safeStatus);
        return;
      }

      // Safe access to status properties with defaults
      const statusValue = safeStatus.data?.status || 'unknown';
      const apiProgress = typeof safeStatus.data?.progress === 'number' ? safeStatus.data.progress : undefined;
      const jobId = safeStatus.data?.jobId || state.jobId;

      const progress = calculateProgress(statusValue, apiProgress);
      const message = getStatusMessage(statusValue, progress);

      updateState({
        status: 'monitoring',
        progress,
        message,
        jobId,
      });
    } catch (error) {
      const safeError = createSafeError(error, 'PROGRESS_HANDLER_ERROR');
      console.error('Assessment: Error in progress handler:', safeError);
      // Don't throw the error, just log it to prevent breaking the assessment flow
    }
  }, [updateState, state.jobId]);

  // Submit assessment from answers
  const submitFromAnswers = useCallback(async (
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      console.warn('Assessment: Submission already in progress');
      return null;
    }

    if (!token) {
      const error = createSafeError('No authentication token found', 'AUTH_ERROR');
      updateState({
        status: 'failed',
        error: error.message,
        message: 'Authentication required'
      });
      options.onError?.(error);
      return null;
    }

    isSubmittingRef.current = true;
    abortControllerRef.current = new AbortController();

    try {
      updateState({
        status: 'submitting',
        progress: 0,
        message: 'Submitting assessment...',
        error: undefined,
        result: undefined
      });

      // Import the consolidated service
      const { assessmentService } = await import('../services/assessment-service');

      // Submit assessment
      const result = await assessmentService.submitFromAnswers(answers, assessmentName, {
        onProgress: handleProgress,
        onTokenBalanceUpdate: options.onTokenBalanceUpdate,
        preferWebSocket: options.preferWebSocket,
        onError: options.onError
      });

      updateState({
        status: 'completed',
        progress: 100,
        message: 'Assessment completed successfully',
        result
      });

      options.onComplete?.(result);
      return result;

    } catch (error) {
      const safeError = createSafeError(error, 'SUBMISSION_ERROR');

      updateState({
        status: 'failed',
        error: safeError.message || 'Assessment submission failed',
        message: safeError.message || 'Assessment failed',
        progress: 0
      });

      // Safe error callback execution
      try {
        if (options.onError && typeof options.onError === 'function') {
          options.onError(safeError);
        }
      } catch (callbackError) {
        console.error('Assessment: Error in onError callback:', createSafeError(callbackError));
      }

      return null;

    } finally {
      isSubmittingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [token, handleProgress, updateState, options]);

  // Reset state
  const reset = useCallback(() => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isSubmittingRef.current = false;

    setState({
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
    });
  }, []);

  // Cancel current operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isSubmittingRef.current = false;

    updateState({
      status: 'idle',
      progress: 0,
      message: 'Assessment cancelled',
    });
  }, [updateState]);

  // Computed properties
  const isIdle = state.status === 'idle';
  const isSubmitting = state.status === 'submitting';
  const isMonitoring = state.status === 'monitoring';
  const isCompleted = state.status === 'completed';
  const isFailed = state.status === 'failed';
  const result = state.result || null;

  return {
    state,
    isIdle,
    isSubmitting,
    isMonitoring,
    isCompleted,
    isFailed,
    result,
    submitFromAnswers,
    reset,
    cancel
  };
}

/**
 * Calculate progress based on status
 */
function calculateProgress(status: string, apiProgress?: number): number {
  if (apiProgress && apiProgress > 0) {
    return Math.min(apiProgress, 100);
  }

  switch (status) {
    case 'queued':
      return 10;
    case 'processing':
      return 30;
    case 'analyzing':
      return 60;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 5;
  }
}

/**
 * Get status message
 */
function getStatusMessage(status: string, progress: number): string {
  switch (status) {
    case 'queued':
      return 'Assessment queued for processing...';
    case 'processing':
      return 'Processing assessment data...';
    case 'analyzing':
      return 'Analyzing personality traits...';
    case 'completed':
      return 'Assessment completed successfully!';
    case 'failed':
      return 'Assessment processing failed';
    default:
      return `Processing... ${progress}%`;
  }
}

export default useAssessment;
