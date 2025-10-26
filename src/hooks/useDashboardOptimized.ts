'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import authService, { queryKeys } from '../services/authService';
import type { JobsStatsResponse, DashboardStats } from '../types/dashboard';
import type { ProfileResponse } from '../services/authService';
import type { JobsResponse, JobsParams } from '../types/dashboard';

// Configuration for dashboard caching
const DASHBOARD_CACHE_CONFIG = {
  staleTime: 3 * 60 * 1000, // 3 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  activeUserStaleTime: 1 * 60 * 1000, // 1 minute for active users
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  maxRetries: 3,
};

// Combined dashboard data interface
interface CombinedDashboardData {
  jobsStats: JobsStatsResponse | undefined;
  profile: ProfileResponse | undefined;
  jobs: JobsResponse | undefined;
  dashboardStats: DashboardStats | undefined;
  lastUpdated: number;
}

// User activity tracking hook
const useUserActivity = () => {
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = React.useState(true);
  const queryClient = useQueryClient();

  const resetActivityTimeout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    setIsActive(true);
    
    // Set user as inactive after 5 minutes of no activity
    activityTimeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, 5 * 60 * 1000);
  }, []);

  const handleUserActivity = useCallback(() => {
    resetActivityTimeout();
    
    // Trigger prefetch for active users with shorter stale time
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      staleTime: DASHBOARD_CACHE_CONFIG.activeUserStaleTime,
      gcTime: 5 * 60 * 1000, // 5 minutes cache for active users
    });
  }, [resetActivityTimeout, queryClient]);

  useEffect(() => {
    // Set up event listeners for user activity
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    // Initialize activity tracking
    resetActivityTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [handleUserActivity, resetActivityTimeout]);

  return isActive;
};

// Main optimized dashboard hook
export const useDashboardOptimized = (jobsParams: JobsParams = { limit: 20 }) => {
  const queryClient = useQueryClient();
  const isActive = useUserActivity();
  const lastActivityRef = useRef<number>(Date.now());

  // Combined query for all dashboard data
  const {
    data: combinedData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'combined', jobsParams],
    queryFn: async (): Promise<CombinedDashboardData> => {
      const results = await Promise.allSettled([
        authService.getJobsStats(),
        authService.getProfile(),
        authService.getJobs(jobsParams),
      ]);

      const [jobsStatsResult, profileResult, jobsResult] = results;

      const jobsStats = jobsStatsResult.status === 'fulfilled' ? jobsStatsResult.value : undefined;
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : undefined;
      const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : undefined;

      // Transform to dashboard stats format
      let dashboardStats: DashboardStats | undefined;
      if (jobsStats?.data && profile?.data) {
        dashboardStats = {
          processing: jobsStats.data.processing,
          completed: jobsStats.data.completed,
          failed: jobsStats.data.failed,
          tokenBalance: profile.data.user.token_balance,
          totalJobs: jobsStats.data.total_jobs,
          successRate: jobsStats.data.success_rate,
          avgProcessingTime: jobsStats.data.avg_processing_time_seconds,
        };
      }

      return {
        jobsStats,
        profile,
        jobs,
        dashboardStats,
        lastUpdated: Date.now(),
      };
    },
    staleTime: isActive ? DASHBOARD_CACHE_CONFIG.activeUserStaleTime : DASHBOARD_CACHE_CONFIG.staleTime,
    gcTime: DASHBOARD_CACHE_CONFIG.gcTime,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < DASHBOARD_CACHE_CONFIG.maxRetries;
    },
    retryDelay: DASHBOARD_CACHE_CONFIG.retryDelay,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    enabled: authService.isAuthenticated(),
  });

  // Smart refresh based on user activity
  const smartRefresh = useCallback(async () => {
    lastActivityRef.current = Date.now();
    
    // Use more aggressive refresh for active users
    if (isActive) {
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', 'combined'],
        refetchType: 'active',
      });
    } else {
      await refetch();
    }
  }, [isActive, refetch, queryClient]);

  // Selective refresh for specific data types
  const refreshJobsStats = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.stats() });
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
  }, [queryClient]);

  const refreshJobs = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list(jobsParams) });
  }, [queryClient, jobsParams]);

  // Cache warming strategies
  const warmCache = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    try {
      // Prefetch critical data with priority
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.jobs.stats(),
          staleTime: DASHBOARD_CACHE_CONFIG.activeUserStaleTime,
          gcTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.auth.profile(),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.jobs.list(jobsParams),
          staleTime: 5 * 60 * 1000,
        }),
      ]);
    } catch (error) {
      console.warn('Dashboard cache warming failed:', error);
    }
  }, [queryClient, jobsParams]);

  // Background sync for offline support
  const backgroundSync = useCallback(async () => {
    if (!navigator.onLine || !authService.isAuthenticated()) return;

    try {
      // Check if data is stale and needs refresh
      const queryState = queryClient.getQueryState(['dashboard', 'combined', jobsParams]);
      
      if (queryState && queryState.dataUpdatedAt) {
        const dataAge = Date.now() - queryState.dataUpdatedAt;
        const staleThreshold = isActive ? DASHBOARD_CACHE_CONFIG.activeUserStaleTime : DASHBOARD_CACHE_CONFIG.staleTime;
        
        if (dataAge > staleThreshold) {
          await smartRefresh();
        }
      }
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }, [queryClient, jobsParams, isActive, smartRefresh]);

  // Auto-cache warming on mount for authenticated users
  useEffect(() => {
    if (authService.isAuthenticated()) {
      warmCache();
    }
  }, [warmCache]);

  // Periodic background sync
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const interval = setInterval(() => {
      backgroundSync();
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(interval);
  }, [backgroundSync]);

  // Extract individual data from combined result
  const jobsStats = combinedData?.jobsStats;
  const profile = combinedData?.profile;
  const jobs = combinedData?.jobs;
  const dashboardStats = combinedData?.dashboardStats;

  // Enhanced error information
  const getErrorType = (error: any) => {
    if (!error) return null;
    
    if (error?.response?.status >= 500) return 'server';
    if (error?.response?.status >= 400) return 'client';
    if (error?.code === 'NETWORK_ERROR') return 'network';
    return 'unknown';
  };

  const errorType = getErrorType(error);
  const isRetryable = errorType === 'server' || errorType === 'network';

  return {
    // Combined data
    data: dashboardStats,
    jobsData: jobs,
    profileData: profile,
    jobsStatsData: jobsStats,
    
    // Loading states
    isLoading,
    isFetching,
    isError,
    error,
    errorType,
    isRetryable,
    
    // User activity state
    isUserActive: isActive,
    lastActivity: lastActivityRef.current,
    
    // Refresh functions
    refresh: smartRefresh,
    refreshJobsStats,
    refreshProfile,
    refreshJobs,
    
    // Cache management
    warmCache,
    backgroundSync,
    
    // Utility functions
    isDataFresh: combinedData ? Date.now() - combinedData.lastUpdated < DASHBOARD_CACHE_CONFIG.staleTime : false,
    dataAge: combinedData ? Date.now() - combinedData.lastUpdated : Infinity,
  };
};

export default useDashboardOptimized;