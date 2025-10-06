/**
 * ✅ SWR-based Dashboard Data Hook
 * 
 * Replaces complex optimistic updates with SWR's built-in features:
 * - Automatic caching
 * - Background revalidation
 * - Optimistic updates via mutate
 * - Error handling
 * - Loading states
 * 
 * @module hooks/useDashboardData
 */

import useSWR, { mutate as globalMutate } from 'swr';
import { calculateUserStats, formatStatsForDashboard, fetchAssessmentHistoryFromAPI as formatAssessmentHistory, calculateUserProgress } from '../utils/user-stats';
import apiService from '../services/apiService';
import type { AssessmentData } from '../types/dashboard';
import type { OceanScores, ViaScores } from '../types/assessment-results';

interface UseDashboardDataOptions {
  userId: string;
  enabled?: boolean;
}

interface DashboardData {
  // Assessment history
  assessmentHistory: AssessmentData[] | undefined;
  isLoadingHistory: boolean;
  isValidatingHistory: boolean;
  historyError: any;
  
  // User stats
  userStats: any;
  isLoadingStats: boolean;
  statsError: any;
  
  // Latest result
  latestResult: any;
  isLoadingResult: boolean;
  resultError: any;
  
  // Mutations
  refreshHistory: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Optimistic updates
  addAssessmentOptimistic: (newAssessment: AssessmentData) => Promise<void>;
  updateAssessmentOptimistic: (id: string, updates: Partial<AssessmentData>) => Promise<void>;
  removeAssessmentOptimistic: (id: string) => Promise<void>;
}

/**
 * ✅ Main dashboard data hook using SWR
 */
export function useDashboardData({ userId, enabled = true }: UseDashboardDataOptions): DashboardData {
  // ✅ SWR for user stats
  const {
    data: userStats,
    error: statsError,
    isLoading: isLoadingStats,
    mutate: mutateStats
  } = useSWR(
    enabled && userId ? `user-stats-${userId}` : null,
    () => calculateUserStats(userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

  // ✅ SWR for assessment history
  const {
    data: assessmentHistory,
    error: historyError,
    isLoading: isLoadingHistory,
    isValidating: isValidatingHistory,
    mutate: mutateHistory
  } = useSWR(
    enabled && userId ? `assessment-history-${userId}` : null,
    () => formatAssessmentHistory(),
    {
      // ✅ SWR built-in cache configuration
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: true, // Refetch on reconnect
      dedupingInterval: 60000, // 1 minute deduplication
      refreshInterval: 0, // No auto-refresh (manual only)
      
      // ✅ Keep previous data while revalidating (smooth UX)
      keepPreviousData: true,
      
      // ✅ Fallback to cache on error
      shouldRetryOnError: false,
      
      // ✅ Success/error callbacks for tracking
      onSuccess: (data) => {
        console.log(`[Dashboard] ✅ Assessment history loaded: ${data?.length || 0} items`);
      },
      onError: (error) => {
        console.error('[Dashboard] ❌ Failed to load assessment history:', error);
      }
    }
  );

  // ✅ SWR for latest assessment result
  const {
    data: latestResult,
    error: resultError,
    isLoading: isLoadingResult,
    mutate: mutateResult
  } = useSWR(
    enabled && userId ? `latest-result-${userId}` : null,
    async () => {
      // @ts-ignore: api accepts sort/order
      const resp = await apiService.getResults({ 
        limit: 1, 
        status: 'completed', 
        sort: 'created_at', 
        order: 'DESC' 
      } as any);
      return resp.success && resp.data?.results?.length ? resp.data.results[0] : null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      refreshInterval: 60000, // Auto-refresh every 1 minute
      fallbackData: null,
    }
  );

  // ✅ Refresh functions
  const refreshHistory = async () => {
    await mutateHistory();
  };

  const refreshStats = async () => {
    await mutateStats();
  };

  const refreshAll = async () => {
    await Promise.all([
      mutateHistory(),
      mutateStats(),
      mutateResult()
    ]);
  };

  // ✅ Optimistic update: Add new assessment
  const addAssessmentOptimistic = async (newAssessment: AssessmentData) => {
    const key = `assessment-history-${userId}`;
    
    // Optimistically update UI
    await mutateHistory(
      async (currentData) => {
        // Add new assessment to the beginning
        return [newAssessment, ...(currentData || [])];
      },
      {
        // Don't revalidate immediately
        revalidate: false,
        
        // Rollback on error
        rollbackOnError: true,
        
        // Show optimistic update immediately
        optimisticData: [newAssessment, ...(assessmentHistory || [])],
      }
    );

    // Revalidate in background
    setTimeout(() => mutateHistory(), 1000);
  };

  // ✅ Optimistic update: Update existing assessment
  const updateAssessmentOptimistic = async (id: string, updates: Partial<AssessmentData>) => {
    const key = `assessment-history-${userId}`;
    
    await mutateHistory(
      async (currentData) => {
        if (!currentData) return currentData;
        return currentData.map(item => 
          item.id === id ? { ...item, ...updates } : item
        );
      },
      {
        revalidate: false,
        rollbackOnError: true,
        optimisticData: assessmentHistory?.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ),
      }
    );

    // Revalidate in background
    setTimeout(() => mutateHistory(), 1000);
  };

  // ✅ Optimistic update: Remove assessment
  const removeAssessmentOptimistic = async (id: string) => {
    const key = `assessment-history-${userId}`;
    
    await mutateHistory(
      async (currentData) => {
        if (!currentData) return currentData;
        return currentData.filter(item => item.id !== id);
      },
      {
        revalidate: false,
        rollbackOnError: true,
        optimisticData: assessmentHistory?.filter(item => item.id !== id),
      }
    );

    // Revalidate in background
    setTimeout(() => mutateHistory(), 1000);
  };

  return {
    // Assessment history
    assessmentHistory,
    isLoadingHistory,
    isValidatingHistory,
    historyError,
    
    // User stats
    userStats,
    isLoadingStats,
    statsError,
    
    // Latest result
    latestResult,
    isLoadingResult,
    resultError,
    
    // Mutations
    refreshHistory,
    refreshStats,
    refreshAll,
    
    // Optimistic updates
    addAssessmentOptimistic,
    updateAssessmentOptimistic,
    removeAssessmentOptimistic,
  };
}

/**
 * ✅ Global mutate helper for dashboard data
 * Use this to invalidate dashboard cache from anywhere in the app
 */
export async function invalidateDashboardData(userId: string) {
  await Promise.all([
    globalMutate(`assessment-history-${userId}`),
    globalMutate(`user-stats-${userId}`),
    globalMutate(`latest-result-${userId}`)
  ]);
}

/**
 * ✅ Prefetch dashboard data
 * Use this to preload data before navigating to dashboard
 */
export async function prefetchDashboardData(userId: string) {
  const keys = [
    `assessment-history-${userId}`,
    `user-stats-${userId}`,
    `latest-result-${userId}`
  ];

  // Trigger SWR to fetch data
  await Promise.all(
    keys.map(key => globalMutate(key))
  );
}

