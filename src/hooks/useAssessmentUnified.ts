/**
 * Unified Assessment Hook
 * Consolidates submission, data fetching, and state management into a single hook
 * 
 * Combines best of:
 * - useAssessment.ts (submission + state management)
 * - useSimpleAssessment.ts (simplicity)
 * - useAssessmentData.ts (data fetching + caching)
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { AssessmentResult, AssessmentStatusResponse } from '../types/assessment-results';
import { createSafeError, validateApiResponse } from '../utils/safe-error-handling';
import { getLatestAssessmentFromArchive, fetchAssessmentHistoryFromAPI } from '../utils/user-stats';

// ============================================================================
// Types
// ============================================================================

export interface AssessmentState {
  status: 'idle' | 'submitting' | 'monitoring' | 'completed' | 'failed';
  progress: number;
  message: string;
  jobId?: string;
  error?: string;
  result?: AssessmentResult;
}

export interface UseAssessmentOptions {
  // Submission options
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: any) => void;
  onProgress?: (status: AssessmentStatusResponse) => Promise<void>;
  onTokenBalanceUpdate?: () => Promise<void>;
  preferWebSocket?: boolean;
  
  // Data fetching options
  fetchMode?: 'submission' | 'results' | 'both'; // What to fetch
  resultId?: string | null; // For fetching specific result
  enableAutoFetch?: boolean; // Auto-fetch latest results
}

export interface UseAssessmentReturn {
  // Submission state
  state: AssessmentState;
  isIdle: boolean;
  isSubmitting: boolean;
  isMonitoring: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  result: AssessmentResult | null;
  
  // Submission actions
  submitFromAnswers: (answers: Record<number, number | null>, assessmentName?: string) => Promise<AssessmentResult | null>;
  reset: () => void;
  cancel: () => void;
  
  // Data fetching (for results)
  results?: AssessmentResult[] | undefined;
  isLoadingResults?: boolean;
  resultsError?: any;
  refetchResults?: () => Promise<void>;
  
  // Metadata
  jobId?: string;
  formattedElapsedTime?: string;
  isActive?: boolean;
  canRetry?: boolean;
}

// ============================================================================
// Unified Hook Implementation
// ============================================================================

export function useAssessmentUnified(options: UseAssessmentOptions = {}): UseAssessmentReturn {
  const { token } = useAuth();
  const fetchMode = options.fetchMode || 'submission';
  const enableAutoFetch = options.enableAutoFetch !== false;
  
  // ========== Submission State ==========
  const [state, setState] = useState<AssessmentState>({
    status: 'idle',
    progress: 0,
    message: 'Ready to submit assessment',
  });

  const submissionPromiseRef = useRef<Promise<AssessmentResult | null> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const updateState = useCallback((updates: Partial<AssessmentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ========== Data Fetching State (SWR) ==========
  const shouldFetchResults = (fetchMode === 'results' || fetchMode === 'both') && enableAutoFetch;
  
  const { data: results, error: resultsError, isLoading: isLoadingResults, mutate: refetchResults } = useSWR(
    shouldFetchResults ? 'user-assessment-results' : null,
    shouldFetchResults ? fetchAssessmentHistoryFromAPI : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
    }
  );

  // ========== Progress Handler ==========
  const handleProgress = useCallback((status: AssessmentStatusResponse) => {
    try {
      const validation = validateApiResponse(status, ['data']);
      if (!validation.isValid) {
        console.warn('Assessment: Invalid status response:', validation.error?.message);
        return;
      }

      const safeStatus = validation.safeResponse;
      if (!safeStatus.data || typeof safeStatus.data !== 'object') {
        console.warn('Assessment: Invalid status.data structure');
        return;
      }

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
    }
  }, [updateState, state.jobId]);

  // ========== Submission Handler ==========
  const submitFromAnswers = useCallback(async (
    answers: Record<number, number | null>,
    assessmentName: string = 'AI-Driven Talent Mapping'
  ): Promise<AssessmentResult | null> => {
    if (submissionPromiseRef.current) {
      console.warn('[useAssessmentUnified] Submission already in progress');
      return submissionPromiseRef.current;
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

    submissionPromiseRef.current = (async () => {
      abortControllerRef.current = new AbortController();
      startTimeRef.current = Date.now();

      try {
        updateState({
          status: 'submitting',
          progress: 0,
          message: 'Submitting assessment...',
          error: undefined,
          result: undefined
        });

        const apiService = (await import('../services/apiService')).default;
        const result = await apiService.processAssessmentUnified(answers, assessmentName, {
          onProgress: handleProgress,
          onTokenBalanceUpdate: options.onTokenBalanceUpdate,
          preferWebSocket: options.preferWebSocket,
          onError: options.onError,
          signal: abortControllerRef.current.signal
        });

        updateState({
          status: 'completed',
          progress: 100,
          message: 'Assessment completed successfully',
          result
        });

        options.onComplete?.(result);
        
        // Refetch results if enabled
        if (shouldFetchResults) {
          await refetchResults?.();
        }
        
        return result;

      } catch (error: any) {
        if (error.name === 'AbortError') {
          return null;
        }

        const safeError = createSafeError(error, 'SUBMISSION_ERROR');
        updateState({
          status: 'failed',
          error: safeError.message || 'Assessment submission failed',
          message: safeError.message || 'Assessment failed',
          progress: 0
        });

        try {
          if (options.onError && typeof options.onError === 'function') {
            options.onError(safeError);
          }
        } catch (callbackError) {
          console.error('Assessment: Error in onError callback:', createSafeError(callbackError));
        }

        return null;

      } finally {
        abortControllerRef.current = null;
        startTimeRef.current = null;
        setTimeout(() => {
          submissionPromiseRef.current = null;
        }, 1000);
      }
    })();

    return submissionPromiseRef.current;
  }, [token, handleProgress, updateState, options, shouldFetchResults, refetchResults]);

  // ========== Reset & Cancel ==========
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (submissionPromiseRef.current) {
      submissionPromiseRef.current = null;
    }
    startTimeRef.current = null;
    setState({
      status: 'idle',
      progress: 0,
      message: 'Ready to submit assessment',
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (submissionPromiseRef.current) {
      submissionPromiseRef.current = null;
    }
    updateState({
      status: 'idle',
      progress: 0,
      message: 'Assessment cancelled',
    });
  }, [updateState]);

  // ========== Computed Properties ==========
  const isIdle = state.status === 'idle';
  const isSubmitting = state.status === 'submitting';
  const isMonitoring = state.status === 'monitoring';
  const isCompleted = state.status === 'completed';
  const isFailed = state.status === 'failed';
  const result = state.result || null;
  
  const isActive = useMemo(() => 
    state.status === 'submitting' || state.status === 'monitoring',
    [state.status]
  );
  
  const canRetry = state.status === 'failed';
  
  const formattedElapsedTime = useMemo(() => {
    if (!startTimeRef.current) return '';
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // ========== Return Value ==========
  return {
    // Submission
    state,
    isIdle,
    isSubmitting,
    isMonitoring,
    isCompleted,
    isFailed,
    result,
    submitFromAnswers,
    reset,
    cancel,
    
    // Data fetching
    results: results as AssessmentResult[] | undefined,
    isLoadingResults,
    resultsError,
    refetchResults,
    
    // Metadata
    jobId: state.jobId,
    formattedElapsedTime,
    isActive,
    canRetry,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

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

export default useAssessmentUnified;

