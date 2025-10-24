import { useQuery, useQueryClient } from '@tanstack/react-query';
import authService, { ApiError } from '@/services/authService';
import { queryKeys, queryInvalidation, queryPrefetch } from '@/lib/tanStackConfig';
import type { 
  AssessmentResultResponse, 
  AssessmentResultError, 
  UseAssessmentResultOptions,
  AssessmentResultTransformed 
} from '@/types/assessment-results';

// Default options for the hook
const DEFAULT_OPTIONS: UseAssessmentResultOptions = {
  enabled: true,
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 15 * 60 * 1000, // 15 minutes
  retry: 3,
  retryDelay: 1000,
};

/**
 * Custom hook for fetching and managing assessment results
 * 
 * @param id - The assessment result ID
 * @param options - Configuration options for the query
 * @returns Query result with data, loading state, and error handling
 */
export function useAssessmentResult(
  id: string, 
  options: UseAssessmentResultOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.assessments.result(id),
    queryFn: () => authService.getAssessmentResult(id),
    enabled: mergedOptions.enabled && !!id,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: mergedOptions.retry,
    retryDelay: mergedOptions.retryDelay,
    // Select only the data part for easier consumption
    select: (data: AssessmentResultResponse): AssessmentResultResponse => data,
    // Error boundary integration
    throwOnError: (error: any) => {
      // Don't throw on 404 (not found) or 403 (access denied)
      if (error instanceof ApiError) {
        return error.status !== 404 && error.status !== 403;
      }
      return true;
    },
  });

  // Prefetch related data for better UX
  const prefetchRelatedData = async () => {
    if (query.data?.data) {
      // Prefetch user profile if not already cached
      const userProfileQuery = queryClient.getQueryData(queryKeys.auth.profile());
      if (!userProfileQuery) {
        await queryPrefetch.userProfile();
      }

      // Prefetch dashboard stats for context
      await queryPrefetch.dashboardStats();
    }
  };

  // Transform data for component consumption
  const transformedData = query.data?.data ? 
    transformAssessmentResult(query.data.data) : 
    undefined;

  // Utility functions for common operations
  const refetch = () => queryClient.refetchQueries({ 
    queryKey: queryKeys.assessments.result(id) 
  });

  const invalidate = () => queryInvalidation.assessments.result(id);

  const prefetch = () => queryPrefetch.assessmentResultPriority(id);

  // Get cached data without triggering fetch
  const getCachedData = () => authService.getCachedAssessmentResult(id);

  // Check if data is stale
  const isStale = () => authService.isAssessmentResultStale(id);

  return {
    // Query state
    data: query.data,
    transformedData,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error as AssessmentResultError | null,
    isSuccess: query.isSuccess,

    // Utility functions
    refetch,
    invalidate,
    prefetch,
    prefetchRelatedData,
    getCachedData,
    isStale,

    // Raw query object for advanced usage
    query,
  };
}

/**
 * Transform assessment result data for better component consumption
 */
function transformAssessmentResult(data: AssessmentResultResponse['data']): AssessmentResultTransformed {
  const { test_data, test_result, ...rest } = data;

  // Calculate totals for test scores
  const riasecTotal = Object.values(test_data.riasec).reduce((sum, score) => sum + score, 0);
  const oceanTotal = Object.values(test_data.ocean).reduce((sum, score) => sum + score, 0);
  const viaIsTotal = Object.values(test_data.viaIs).reduce((sum, score) => sum + score, 0);

  // Calculate counts for test result
  const careerCount = test_result.careerRecommendation?.length || 0;
  const strengthCount = test_result.strengths?.length || 0;
  const weaknessCount = test_result.weaknesses?.length || 0;
  const insightCount = test_result.insights?.length || 0;

  return {
    ...rest,
    test_data: {
      riasec: { ...test_data.riasec, total: riasecTotal },
      ocean: { ...test_data.ocean, total: oceanTotal },
      viaIs: { ...test_data.viaIs, total: viaIsTotal },
    },
    test_result: {
      ...test_result,
      careerCount,
      strengthCount,
      weaknessCount,
      insightCount,
    },
  };
}

/**
 * Hook for managing multiple assessment results
 */
export function useAssessmentResults(ids: string[]) {
  const queries = useQuery({
    queryKey: ['assessments', 'results', 'batch', ids],
    queryFn: async () => {
      const results = await Promise.allSettled(
        ids.map(id => authService.getAssessmentResult(id))
      );
      
      return results.map((result, index) => ({
        id: ids[index],
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes for batch queries
  });

  return {
    data: queries.data,
    isLoading: queries.isLoading,
    isError: queries.isError,
    error: queries.error,
    refetch: queries.refetch,
  };
}

/**
 * Hook for assessment result mutations (future use)
 */
export function useAssessmentResultMutations() {
  const queryClient = useQueryClient();

  // Placeholder for future mutations like update, delete, etc.
  const updateResult = async (id: string, data: any) => {
    // Future implementation for updating assessment results
    console.log('Update assessment result:', id, data);
  };

  const deleteResult = async (id: string) => {
    // Future implementation for deleting assessment results
    console.log('Delete assessment result:', id);
  };

  return {
    updateResult,
    deleteResult,
    // Utility to invalidate related queries after mutations
    invalidateRelatedQueries: (id: string) => {
      queryInvalidation.assessments.result(id);
      queryInvalidation.assessments.results();
    },
  };
}

export default useAssessmentResult;