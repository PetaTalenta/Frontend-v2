/**
 * Simple Assessment Hook
 * Provides a clean interface for the simple assessment flow
 */

import { useState, useCallback } from 'react';
import { AssessmentScores, AssessmentResult, AssessmentStatusResponse } from '../types/assessment-results';
import { simpleAssessmentFlow } from '../services/simple-assessment-flow';

interface AssessmentState {
  isSubmitting: boolean;
  status: 'idle' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  jobId?: string;
  result?: AssessmentResult;
  error?: string;
  startTime?: number;
  elapsedTime?: number;
}

interface UseSimpleAssessmentOptions {
  onTokenBalanceUpdate?: () => Promise<void>;
  onProgress?: (status: AssessmentStatusResponse) => void;
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: Error) => void;
}

export function useSimpleAssessment(options: UseSimpleAssessmentOptions = {}) {
  const [state, setState] = useState<AssessmentState>({
    isSubmitting: false,
    status: 'idle',
    progress: 0,
    message: '',
  });

  // Update elapsed time
  const updateElapsedTime = useCallback(() => {
    setState(prev => {
      if (prev.startTime && prev.status !== 'completed' && prev.status !== 'failed') {
        return {
          ...prev,
          elapsedTime: Date.now() - prev.startTime,
        };
      }
      return prev;
    });
  }, []);

  // Start elapsed time tracking
  const startElapsedTimeTracking = useCallback(() => {
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [updateElapsedTime]);

  const submitAssessment = useCallback(async (
    assessmentData: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult> => {
    
    // Prevent duplicate submissions
    if (state.isSubmitting) {
      throw new Error('Assessment submission already in progress');
    }

    const startTime = Date.now();
    
    setState({
      isSubmitting: true,
      status: 'submitting',
      progress: 5,
      message: 'Submitting assessment...',
      startTime,
      elapsedTime: 0,
      error: undefined,
      result: undefined,
    });

    // Start elapsed time tracking
    const stopElapsedTimeTracking = startElapsedTimeTracking();

    try {
      const result = await simpleAssessmentFlow.submitAssessment(
        assessmentData,
        assessmentName,
        {
          onTokenBalanceUpdate: options.onTokenBalanceUpdate,
          onProgress: (status) => {
            console.log('Simple Assessment Hook: Progress update:', status);
            
            setState(prev => ({
              ...prev,
              status: status.data.status as any,
              progress: status.data.progress || prev.progress,
              message: status.data.message || getStatusMessage(status.data.status),
              jobId: status.data.jobId,
            }));

            // Call external progress callback
            options.onProgress?.(status);
          },
        }
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        status: 'completed',
        progress: 100,
        message: `Assessment completed in ${(totalTime / 1000).toFixed(1)} seconds`,
        result,
        elapsedTime: totalTime,
      }));

      // Stop elapsed time tracking
      stopElapsedTimeTracking();

      // Call external complete callback
      options.onComplete?.(result);

      return result;

    } catch (error) {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        status: 'failed',
        progress: 0,
        message: `Assessment failed: ${errorMessage}`,
        error: errorMessage,
        elapsedTime: totalTime,
      }));

      // Stop elapsed time tracking
      stopElapsedTimeTracking();

      // Call external error callback
      options.onError?.(error as Error);

      throw error;
    }
  }, [state.isSubmitting, options, startElapsedTimeTracking]);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      status: 'idle',
      progress: 0,
      message: '',
      jobId: undefined,
      result: undefined,
      error: undefined,
      startTime: undefined,
      elapsedTime: undefined,
    });
  }, []);

  const retry = useCallback(async (
    assessmentData: AssessmentScores,
    assessmentName?: string
  ) => {
    reset();
    // Small delay to ensure state is reset
    await new Promise(resolve => setTimeout(resolve, 100));
    return submitAssessment(assessmentData, assessmentName);
  }, [reset, submitAssessment]);

  return {
    // State
    ...state,
    
    // Computed values
    isIdle: state.status === 'idle',
    isActive: state.isSubmitting || ['submitting', 'queued', 'processing'].includes(state.status),
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',
    canRetry: state.status === 'failed' || state.status === 'idle',
    
    // Formatted elapsed time
    formattedElapsedTime: state.elapsedTime ? formatElapsedTime(state.elapsedTime) : undefined,
    
    // Actions
    submitAssessment,
    reset,
    retry,
  };
}

/**
 * Get user-friendly status message
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'submitting':
      return 'Submitting assessment...';
    case 'queued':
      return 'Assessment queued for processing...';
    case 'processing':
      return 'AI is analyzing your responses...';
    case 'completed':
      return 'Assessment completed successfully!';
    case 'failed':
      return 'Assessment processing failed';
    default:
      return 'Processing assessment...';
  }
}

/**
 * Format elapsed time in a user-friendly way
 */
function formatElapsedTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export default useSimpleAssessment;
