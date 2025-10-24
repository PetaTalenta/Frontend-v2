'use client';

import { useQuery } from '@tanstack/react-query';
import authService, { queryKeys, queryInvalidation } from '../services/authService';
import type { JobsStatsResponse } from '../types/dashboard';

// Custom hook for jobs statistics with TanStack Query
export const useJobsStats = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: queryKeys.jobs.stats(),
    queryFn: () => authService.getJobsStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors with exponential backoff
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    enabled: authService.isAuthenticated(), // Only fetch if user is authenticated
  });

  // Refresh jobs stats
  const refreshJobsStats = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh jobs stats:', error);
    }
  };

  // Invalidate jobs stats cache
  const invalidateJobsStats = () => {
    queryInvalidation.jobs.stats();
  };

  // Get cached jobs stats
  const getCachedJobsStats = () => {
    return data;
  };

  // Check if jobs stats data is stale
  const isJobsStatsStale = () => {
    // This would need to be implemented based on your cache strategy
    return false; // Placeholder
  };

  return {
    data,
    loading: isLoading,
    error,
    refetch: refreshJobsStats,
    isFetching,
    isSuccess,
    isError,
    invalidate: invalidateJobsStats,
    getCachedData: getCachedJobsStats,
    isStale: isJobsStatsStale,
  };
};

export default useJobsStats;