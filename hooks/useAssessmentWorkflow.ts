/**
 * React Hook for Assessment Workflow Management
 * Provides state management and callbacks for assessment submission and monitoring
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AssessmentWorkflow,
  WorkflowState,
  WorkflowCallbacks,
  runAssessmentWorkflow
} from '../utils/assessment-workflow';
import { AssessmentResult, AssessmentScores } from '../types/assessment-results';
import { useAuth } from '../contexts/AuthContext';

export interface UseAssessmentWorkflowOptions {
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: Error) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
  autoReset?: boolean; // Reset workflow after completion
  preferWebSocket?: boolean; // WebSocket is mandatory - this option is kept for compatibility
}

export interface UseAssessmentWorkflowReturn {
  // State
  state: WorkflowState;
  isIdle: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
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
  
  // Utilities
  getProgressPercentage: () => number;
  getStatusMessage: () => string;
  getEstimatedTimeRemaining: () => string | null;
}

/**
 * Hook for managing assessment workflow
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

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Create workflow callbacks
  const createCallbacks = useCallback((): WorkflowCallbacks => ({
    onStatusChange: (newState: WorkflowState) => {
      // Ensure state is never undefined
      if (newState && newState.status) {
        setState(newState);
      }
    },
    onProgress: (newState: WorkflowState) => {
      // Ensure state is never undefined
      if (newState && newState.status) {
        setState(newState);
      }
    },
    onComplete: (result: AssessmentResult) => {
      if (optionsRef.current.onComplete) {
        optionsRef.current.onComplete(result);
      }

      // Auto reset if enabled
      if (optionsRef.current.autoReset) {
        setTimeout(() => {
          reset();
        }, 3000); // Reset after 3 seconds
      }
    },
    onError: (error: Error, errorState: WorkflowState) => {
      console.error('Assessment Workflow Hook: Error occurred', error);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(error);
      }
    },
    onTokenBalanceUpdate: optionsRef.current.onTokenBalanceUpdate,
    preferWebSocket: optionsRef.current.preferWebSocket,
  }), []);

  // Initialize workflow
  const initializeWorkflow = useCallback(() => {
    if (!workflowRef.current) {
      workflowRef.current = new AssessmentWorkflow(createCallbacks());
    }
    return workflowRef.current;
  }, [createCallbacks]);

  // Note: WebSocket connection is now handled in submit methods to ensure proper timing

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (workflowRef.current) {
        console.log('Assessment Workflow Hook: Cleaning up WebSocket connection...');
        workflowRef.current.disconnectWebSocket();
      }
    };
  }, []);

  // Submit assessment from answers
  const submitFromAnswers = useCallback(async (
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    try {
      const workflow = initializeWorkflow();

      // Ensure WebSocket connection if preferWebSocket is enabled
      if (options.preferWebSocket && token) {
        console.log('Assessment Workflow Hook: Ensuring WebSocket connection before submission...');
        await workflow.ensureWebSocketConnection(token);
      }

      const result = await workflow.submitFromAnswers(answers, assessmentName);
      return result;
    } catch (error) {
      console.error('Assessment submission failed:', error);
      return null;
    }
  }, [initializeWorkflow, options.preferWebSocket, token]);

  // Submit assessment from scores
  const submitFromScores = useCallback(async (
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    try {
      const workflow = initializeWorkflow();

      // Ensure WebSocket connection if preferWebSocket is enabled
      if (options.preferWebSocket && token) {
        console.log('Assessment Workflow Hook: Ensuring WebSocket connection before submission...');
        await workflow.ensureWebSocketConnection(token);
      }

      const result = await workflow.submitFromScores(scores, assessmentName);
      return result;
    } catch (error) {
      console.error('Assessment submission failed:', error);
      return null;
    }
  }, [initializeWorkflow, options.preferWebSocket, token]);

  // Cancel current workflow
  const cancel = useCallback(() => {
    if (workflowRef.current) {
      workflowRef.current.cancel();
    }
  }, []);

  // Reset workflow
  const reset = useCallback(() => {
    if (workflowRef.current) {
      workflowRef.current.reset();
    }
    setState({
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
    });
  }, []);

  // Utility functions
  const getProgressPercentage = useCallback(() => {
    return state.progress || 0;
  }, [state.progress]);

  const getStatusMessage = useCallback(() => {
    return state.message || 'Ready to submit assessment';
  }, [state.message]);

  const getEstimatedTimeRemaining = useCallback(() => {
    return state.estimatedTimeRemaining || null;
  }, [state.estimatedTimeRemaining]);

  // Computed state
  const isIdle = state.status === 'idle';
  const isProcessing = ['validating', 'submitting', 'queued', 'processing'].includes(state.status);
  const isCompleted = state.status === 'completed';
  const isFailed = state.status === 'failed';
  const result = state.result || null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workflowRef.current) {
        workflowRef.current.cancel();
      }
    };
  }, []);

  return {
    // State
    state,
    isIdle,
    isProcessing,
    isCompleted,
    isFailed,
    result,
    
    // Actions
    submitFromAnswers,
    submitFromScores,
    cancel,
    reset,
    
    // Utilities
    getProgressPercentage,
    getStatusMessage,
    getEstimatedTimeRemaining,
  };
}

/**
 * Simplified hook for one-time assessment submission
 */
export function useAssessmentSubmission(
  options: UseAssessmentWorkflowOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const result = await runAssessmentWorkflow(
        answers,
        {
          onComplete: (result) => {
            setResult(result);
            if (options.onComplete) {
              options.onComplete(result);
            }
          },
          onError: (error) => {
            setError(error);
            if (options.onError) {
              options.onError(error);
            }
          },
          onTokenBalanceUpdate: options.onTokenBalanceUpdate,
        },
        assessmentName
      );

      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Assessment submission failed');
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    submit,
    reset,
    isSubmitting,
    result,
    error,
    isCompleted: !!result,
    isFailed: !!error,
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
