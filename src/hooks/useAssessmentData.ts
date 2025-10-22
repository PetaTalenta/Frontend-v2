/**
 * ⚠️ DEPRECATED: Use useAssessmentUnified instead
 *
 * This file is maintained for backward compatibility only.
 * All functionality has been consolidated into useAssessmentUnified.
 *
 * Migration guide:
 * - Replace: import { useAssessmentResult } from './hooks/useAssessmentData'
 * - With: import { useAssessmentUnified } from './hooks/useAssessmentUnified'
 */

import useSWR, { mutate } from 'swr';
import { AssessmentResult } from '../types/assessment-results';
import { getLatestAssessmentFromArchive as getAssessmentResultFromAPI, fetchAssessmentHistoryFromAPI as getUserAssessmentResults } from '../utils/user-stats';

/**
 * @deprecated Use useAssessmentUnified instead
 * Hook for fetching single assessment result
 */
export function useAssessmentResult(resultId: string | null) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] useAssessmentResult is deprecated. ' +
      'Please use useAssessmentUnified instead. ' +
      'This will be removed in the next major version.'
    );
  }

  const { data, error, isLoading, mutate: refetch } = useSWR(
    resultId ? `assessment-result-${resultId}` : null,
    () => getAssessmentResultFromAPI(resultId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('Error fetching assessment result:', error);
      }
    }
  );

  return {
    result: data as AssessmentResult | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * @deprecated Use useAssessmentUnified instead
 * Hook for fetching user's assessment results
 */
export function useUserAssessmentResults() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] useUserAssessmentResults is deprecated. ' +
      'Please use useAssessmentUnified instead. ' +
      'This will be removed in the next major version.'
    );
  }

  const { data, error, isLoading, mutate: refetch } = useSWR(
    'user-assessment-results',
    getUserAssessmentResults,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      onError: (error) => {
        console.error('Error fetching user assessment results:', error);
      }
    }
  );

  return {
    results: data as AssessmentResult[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * @deprecated Use useAssessmentUnified instead
 * Hook for fetching assessment result with optimistic updates
 */
export function useAssessmentResultOptimistic(resultId: string | null) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] useAssessmentResultOptimistic is deprecated. ' +
      'Please use useAssessmentUnified instead. ' +
      'This will be removed in the next major version.'
    );
  }

  const { data, error, isLoading, mutate: refetch } = useSWR(
    resultId ? `assessment-result-optimistic-${resultId}` : null,
    () => getAssessmentResultFromAPI(resultId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  const updateOptimistic = (updatedData: Partial<AssessmentResult>) => {
    if (data) {
      refetch({ ...data, ...updatedData }, false);
    }
  };

  return {
    result: data as AssessmentResult | undefined,
    isLoading,
    error,
    refetch,
    updateOptimistic,
  };
}

/**
 * @deprecated Use useAssessmentUnified instead
 * Hook for preloading assessment results
 */
export function usePreloadAssessmentResults() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] usePreloadAssessmentResults is deprecated. ' +
      'Please use useAssessmentUnified instead. ' +
      'This will be removed in the next major version.'
    );
  }

  const preloadResult = (resultId: string) => {
    mutate(
      `assessment-result-${resultId}`,
      getAssessmentResultFromAPI(resultId),
      false
    );
  };

  const preloadUserResults = () => {
    mutate('user-assessment-results', getUserAssessmentResults, false);
  };

  return {
    preloadResult,
    preloadUserResults,
  };
}
