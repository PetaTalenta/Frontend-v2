import useSWR from 'swr';
import { AssessmentResult } from '../types/assessment-results';
import { getAssessmentResultFromArchiveAPI, getUserAssessmentResults } from '../services/assessment-api';

// Hook for fetching single assessment result
export function useAssessmentResult(resultId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    resultId ? `assessment-result-${resultId}` : null,
    () => getAssessmentResultFromArchiveAPI(resultId!, 3),
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
    refetch: mutate,
  };
}

// Hook for fetching user's assessment results
export function useUserAssessmentResults() {
  const { data, error, isLoading, mutate } = useSWR(
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
    refetch: mutate,
  };
}

// Hook for fetching assessment result with optimistic updates
export function useAssessmentResultOptimistic(resultId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    resultId ? `assessment-result-optimistic-${resultId}` : null,
    () => getAssessmentResultFromArchiveAPI(resultId!, 3),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true, // Keep previous data while loading new data
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Optimistic update function
  const updateOptimistic = (updatedData: Partial<AssessmentResult>) => {
    if (data) {
      mutate({ ...data, ...updatedData }, false); // Update without revalidation
    }
  };

  return {
    result: data as AssessmentResult | undefined,
    isLoading,
    error,
    refetch: mutate,
    updateOptimistic,
  };
}

// Hook for preloading assessment results
export function usePreloadAssessmentResults() {
  const preloadResult = (resultId: string) => {
    // Preload the data without subscribing to it
    mutate(
      `assessment-result-${resultId}`,
      getAssessmentResultFromArchiveAPI(resultId, 3),
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

// Import mutate for preloading
import { mutate } from 'swr';
