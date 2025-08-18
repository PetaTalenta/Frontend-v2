/**
 * React Hook for Assessment Workflow Management
 * Provides state management and callbacks for assessment submission and monitoring
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  AssessmentWorkflow,
  WorkflowState,
  WorkflowCallbacks,
  runAssessmentWorkflow
} from '../utils/assessment-workflow';
import { AssessmentResult, AssessmentScores } from '../types/assessment-results';
import { useAuth } from '../contexts/AuthContext';
import { clearSessionSubmissionTracking } from '../utils/submission-guard';

export interface UseAssessmentWorkflowOptions {
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: Error) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
  autoReset?: boolean; // Reset workflow after completion
  preferWebSocket?: boolean; // WebSocket is now mandatory by default - this option is kept for compatibility
}

export interface UseAssessmentWorkflowReturn {
  // State
  state: WorkflowState;
  isIdle: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  canRetry: boolean;
  result: AssessmentResult | null;

  // Actions
  submitFromAnswers: (
    answers: Record<number, number | null>,
    assessmentName?: string
  ) => Promise<AssessmentResult | null>;
  submitFromScores: (
    scores: AssessmentScores,
    assessmentName?: string
  ) => Promise<AssessmentResult | null>;
  cancel: () => void;
  reset: () => void;
  forceResetSubmission: () => void;
  retry: () => Promise<AssessmentResult | null>;

  // Utilities
  getProgressPercentage: () => number;
  getStatusMessage: () => string;
  getEstimatedTimeRemaining: () => string | null;
}

/**
 * Optimized hook for managing assessment workflow
 */
export function useAssessmentWorkflow(
  options: UseAssessmentWorkflowOptions = {}
): UseAssessmentWorkflowReturn {

  const { token } = useAuth();
  const [state, setState] = useState<WorkflowState>({
    status: 'idle',
    progress: 0,
    message: 'Ready to submit assessment',
  });

  const workflowRef = useRef<AssessmentWorkflow | null>(null);
  const optionsRef = useRef(options);
  const callbacksRef = useRef<WorkflowCallbacks | null>(null);

  // Update options ref when options change (memoized)
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Create stable callbacks (memoized to prevent unnecessary re-renders)
  const createCallbacks = useCallback((): WorkflowCallbacks => {
    if (callbacksRef.current) {
      return callbacksRef.current;
    }

    const callbacks: WorkflowCallbacks = {
      onStatusChange: (newState: WorkflowState) => {
        // Optimized state update - only update if state actually changed
        setState(prevState => {
          if (prevState.status === newState.status &&
              prevState.progress === newState.progress &&
              prevState.message === newState.message) {
            return prevState; // No change, prevent re-render
          }
          return { ...prevState, ...newState };
        });
      },
      onProgress: (newState: WorkflowState) => {
        // Optimized progress update - batch with status change
        setState(prevState => ({
          ...prevState,
          progress: newState.progress,
          message: newState.message || prevState.message
        }));
      },
      onComplete: (result: AssessmentResult) => {
        // Single atomic state update for completion
        setState(prevState => ({
          ...prevState,
          status: 'completed',
          progress: 100,
          message: 'Assessment completed successfully',
          result: result
        }));

        // Clear session tracking asynchronously to avoid blocking
        clearSessionSubmissionTracking().catch(error => {
          console.error('Error clearing session tracking:', error);
        });

        // Call user callback
        if (optionsRef.current.onComplete) {
          optionsRef.current.onComplete(result);
        }

        // Auto reset if enabled (non-blocking)
        if (optionsRef.current.autoReset) {
          setTimeout(() => {
            reset();
          }, 3000);
        }
      },
      onError: (error: Error, errorState: WorkflowState) => {
        console.error('Assessment Workflow Hook: Error occurred', error);

        // Single atomic state update for error
        setState(prevState => ({
          ...prevState,
          status: 'failed',
          message: error.message || 'Assessment failed',
          error: error.message,
          canRetry: true
        }));

        // Call user callback
        if (optionsRef.current.onError) {
          optionsRef.current.onError(error);
        }
      },
      onTokenBalanceUpdate: optionsRef.current.onTokenBalanceUpdate,
      preferWebSocket: optionsRef.current.preferWebSocket,
    };

    callbacksRef.current = callbacks;
    return callbacks;
  }, []);

  // Optimized workflow initialization (lazy initialization)
  const getWorkflow = useCallback(() => {
    if (!workflowRef.current) {
      workflowRef.current = new AssessmentWorkflow(createCallbacks());
      console.log('Assessment Workflow Hook: Initialized new workflow instance');
    }
    return workflowRef.current;
  }, [createCallbacks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workflowRef.current) {
        console.log('Assessment Workflow Hook: Cleaning up workflow...');
        workflowRef.current.disconnectWebSocket();
        workflowRef.current = null;
        callbacksRef.current = null;
      }
    };
  }, []);

  // Optimized submission from answers
  const submitFromAnswers = useCallback(async (
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    try {
      const workflow = getWorkflow();

      // Ensure WebSocket connection if token is available
      if (token) {
        console.log('Assessment Workflow Hook: Ensuring WebSocket connection...');
        await workflow.ensureWebSocketConnection(token);
      }

      return await workflow.submitFromAnswers(answers, assessmentName);
    } catch (error) {
      console.error('Assessment submission failed:', error);
      // Don't return null, let the error propagate to be handled by the workflow
      throw error;
    }
  }, [getWorkflow, token]);

  // Optimized submission from scores
  const submitFromScores = useCallback(async (
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    try {
      const workflow = getWorkflow();

      // Ensure WebSocket connection if token is available
      if (token) {
        await workflow.ensureWebSocketConnection(token);
      }

      return await workflow.submitFromScores(scores, assessmentName);
    } catch (error) {
      console.error('Assessment submission failed:', error);
      throw error; // Let error propagate for proper handling
    }
  }, [getWorkflow, token]);

  // Optimized cancel method
  const cancel = useCallback(() => {
    const workflow = workflowRef.current;
    if (workflow) {
      workflow.cancel();
      console.log('Assessment Workflow Hook: Cancelled current workflow');
    }
  }, []);

  // Optimized reset method
  const reset = useCallback(() => {
    const workflow = workflowRef.current;
    if (workflow) {
      workflow.reset();
    }

    // Reset local state atomically
    setState({
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
    });

    console.log('Assessment Workflow Hook: Reset workflow and state');
  }, []);

  // Force reset submission state (emergency recovery)
  const forceResetSubmission = useCallback(() => {
    const workflow = workflowRef.current;
    if (workflow) {
      workflow.forceResetSubmission();
      console.log('Assessment Workflow Hook: Force reset submission state');
    }

    // Also reset local state
    setState({
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
    });
  }, []);

  // Optimized retry method
  const retry = useCallback(async (): Promise<AssessmentResult | null> => {
    const workflow = workflowRef.current;
    if (!workflow) {
      console.warn('Assessment Workflow Hook: No workflow available for retry');
      return null;
    }

    try {
      return await workflow.retry();
    } catch (error) {
      console.error('Assessment retry failed:', error);
      throw error; // Let error propagate for proper handling
    }
    return null;
  }, []);

  // Memoized utility functions to prevent unnecessary re-renders
  const getProgressPercentage = useCallback(() => state.progress || 0, [state.progress]);
  const getStatusMessage = useCallback(() => state.message || 'Ready to submit assessment', [state.message]);
  const getEstimatedTimeRemaining = useCallback(() => state.estimatedTimeRemaining || null, [state.estimatedTimeRemaining]);

  // Memoized computed state to prevent unnecessary re-renders
  const computedState = useMemo(() => ({
    isIdle: state.status === 'idle',
    isProcessing: ['validating', 'submitting', 'queued', 'processing'].includes(state.status),
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',
    canRetry: state.canRetry || false,
    result: state.result || null,
  }), [state.status, state.canRetry, state.result]);

  return {
    // State
    state,
    ...computedState,

    // Actions
    submitFromAnswers,
    submitFromScores,
    cancel,
    reset,
    forceResetSubmission,
    retry,

    // Utilities
    getProgressPercentage,
    getStatusMessage,
    getEstimatedTimeRemaining,
  };
}

/**
 * Optimized simplified hook for one-time assessment submission
 */
export function useAssessmentSubmission(
  options: UseAssessmentWorkflowOptions = {}
) {
  const [state, setState] = useState({
    isSubmitting: false,
    result: null as AssessmentResult | null,
    error: null as Error | null
  });

  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const submit = useCallback(async (
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {

    // Atomic state update
    setState(prev => ({ ...prev, isSubmitting: true, error: null, result: null }));

    try {
      console.log('useAssessmentSubmission: Starting optimized submission...');

      const result = await runAssessmentWorkflow(
        answers,
        {
          onTokenBalanceUpdate: optionsRef.current.onTokenBalanceUpdate,
        },
        assessmentName
      );

      // Atomic state update for success
      setState(prev => ({ ...prev, result, isSubmitting: false }));
      console.log('useAssessmentSubmission: Submission completed successfully');

      // Call completion callback
      if (optionsRef.current.onComplete) {
        optionsRef.current.onComplete(result);
      }

      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Assessment submission failed');

      // Atomic state update for error
      setState(prev => ({ ...prev, error, isSubmitting: false }));

      // Call error callback
      if (optionsRef.current.onError) {
        optionsRef.current.onError(error);
      }

      throw error; // Let error propagate for proper handling
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      result: null,
      error: null
    });
  }, []);

  // Memoized computed values
  const computedValues = useMemo(() => ({
    isCompleted: !!state.result,
    isFailed: !!state.error,
  }), [state.result, state.error]);

  return {
    submit,
    reset,
    isSubmitting: state.isSubmitting,
    result: state.result,
    error: state.error,
    ...computedValues,
  };
}

/**
 * Hook for monitoring assessment queue
 */
export function useAssessmentQueue(refreshInterval: number = 30000) {
  const [queueInfo, setQueueInfo] = useState<{
    queueLength: number;
    estimatedWaitTime: string;
    averageProcessingTime: string;
    isServiceAvailable: boolean;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { getAssessmentQueueInfo } = await import('../utils/assessment-workflow');
      const info = await getAssessmentQueueInfo();
      setQueueInfo(info);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load queue info');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto refresh
  useEffect(() => {
    refresh();
    
    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return {
    queueInfo,
    isLoading,
    error,
    refresh,
  };
}
