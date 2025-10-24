'use client';

import { useQueries } from '@tanstack/react-query';
import authService, { queryKeys } from '../services/authService';
import type { JobsStatsResponse, DashboardStats } from '../types/dashboard';
import type { ProfileResponse } from '../services/authService';
import { createEnhancedQueryConfig, classifyError } from '../lib/errorHandling';

// Custom hook for combined dashboard statistics
export const useDashboardStats = () => {
  const results = useQueries({
    queries: [
      createEnhancedQueryConfig(
        [...queryKeys.jobs.stats()],
        () => authService.getJobsStats(),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          errorContext: {
            endpoint: '/api/archive/jobs/stats',
            component: 'useDashboardStats',
            operation: 'jobsStats',
          },
        }
      ),
      createEnhancedQueryConfig(
        [...queryKeys.auth.profile()],
        () => authService.getProfile(),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          errorContext: {
            endpoint: '/api/auth/profile',
            component: 'useDashboardStats',
            operation: 'profile',
          },
        }
      ),
    ],
  });

  const [jobsStatsQuery, profileQuery] = results;

  // Extract data from queries
  const jobsStatsData = jobsStatsQuery.data as JobsStatsResponse | undefined;
  const profileData = profileQuery.data as ProfileResponse | undefined;

  // Transform data to dashboard stats format
  const dashboardStats: DashboardStats | undefined = jobsStatsData?.data && profileData?.data ? {
    processing: jobsStatsData.data.processing,
    completed: jobsStatsData.data.completed,
    failed: jobsStatsData.data.failed,
    tokenBalance: profileData.data.user.token_balance,
    totalJobs: jobsStatsData.data.total_jobs,
    successRate: jobsStatsData.data.success_rate,
    avgProcessingTime: jobsStatsData.data.avg_processing_time_seconds,
  } : undefined;

  // Loading states
  const isLoading = jobsStatsQuery.isLoading || profileQuery.isLoading;
  const isFetching = jobsStatsQuery.isFetching || profileQuery.isFetching;
  const isError = jobsStatsQuery.isError || profileQuery.isError;
  const isSuccess = jobsStatsQuery.isSuccess && profileQuery.isSuccess;

  // Enhanced error handling
  const jobsStatsError = jobsStatsQuery.error ? classifyError(jobsStatsQuery.error) : null;
  const profileError = profileQuery.error ? classifyError(profileQuery.error) : null;
  const error = jobsStatsError || profileError;

  // Refresh functions
  const refreshJobsStats = async () => {
    await jobsStatsQuery.refetch();
  };

  const refreshProfile = async () => {
    await profileQuery.refetch();
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshJobsStats(),
      refreshProfile(),
    ]);
  };

  // Individual query states
  const jobsStatsState = {
    data: jobsStatsData,
    isLoading: jobsStatsQuery.isLoading,
    isFetching: jobsStatsQuery.isFetching,
    isError: jobsStatsQuery.isError,
    isSuccess: jobsStatsQuery.isSuccess,
    error: jobsStatsQuery.error,
  };

  const profileState = {
    data: profileData,
    isLoading: profileQuery.isLoading,
    isFetching: profileQuery.isFetching,
    isError: profileQuery.isError,
    isSuccess: profileQuery.isSuccess,
    error: profileQuery.error,
  };

  return {
    data: dashboardStats,
    loading: isLoading,
    isFetching,
    error,
    isSuccess,
    isError,
    
    // Individual query data
    jobsStats: jobsStatsState,
    profile: profileState,
    
    // Refresh functions
    refreshJobsStats,
    refreshProfile,
    refreshAll,
    
    // Utility functions
    isJobsStatsLoading: jobsStatsQuery.isLoading,
    isProfileLoading: profileQuery.isLoading,
    isJobsStatsError: jobsStatsQuery.isError,
    isProfileError: profileQuery.isError,
    
    // Enhanced error information
    jobsStatsError,
    profileError,
    hasRetryableError: error?.retryable || false,
    errorSeverity: error?.severity || null,
  };
};

export default useDashboardStats;