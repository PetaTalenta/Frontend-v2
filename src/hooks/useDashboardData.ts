/**
 * ✅ Unified Dashboard Data Hook (Phase 4 Consolidation)
 *
 * Consolidated hook combining best features from:
 * - useDashboardData.ts (SWR-based, optimistic updates)
 * - useEnhancedDashboard.ts (real-time, notifications, refresh)
 * - useUserData.ts (user-specific data fetching)
 *
 * Features:
 * - Automatic caching with SWR
 * - Background revalidation
 * - Optimistic updates via mutate
 * - Real-time updates with window focus detection
 * - Browser notifications for completed assessments
 * - Comprehensive error handling
 * - Loading states with granular control
 *
 * @module hooks/useDashboardData
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { calculateUserStats, formatStatsForDashboard, fetchAssessmentHistoryFromAPI as formatAssessmentHistory, calculateUserProgress, getLatestAssessmentFromArchive } from '../utils/user-stats';
import apiService from '../services/apiService';
import type { AssessmentData } from '../types/dashboard';
import type { OceanScores, ViaScores } from '../types/assessment-results';

interface UseDashboardDataOptions {
  userId?: string;
  enabled?: boolean;
  enableRealTimeUpdates?: boolean;
  enableNotifications?: boolean;
  refreshInterval?: number;
  optimisticUpdates?: boolean;
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

  // Enhanced features
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  hasActiveAssessment: boolean;
}

/**
 * ✅ Unified dashboard data hook using SWR
 * Combines all dashboard data fetching with real-time updates and optimistic UI
 */
export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardData {
  const { user } = useAuth();

  // Resolve userId from options or auth context
  const userId = options.userId || user?.id;
  const enabled = options.enabled !== false && !!userId;

  // Enhanced options with defaults
  const opts = {
    enableRealTimeUpdates: options.enableRealTimeUpdates !== false,
    enableNotifications: options.enableNotifications !== false,
    refreshInterval: options.refreshInterval || 30000, // 30 seconds
    optimisticUpdates: options.optimisticUpdates !== false,
  };

  // State management for enhanced features
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasActiveAssessment, setHasActiveAssessment] = useState(false);

  // Refs for tracking
  const lastNotificationRef = useRef<string | null>(null);
  const lastFocusTimeRef = useRef<number>(Date.now());

  // ✅ SWR for user stats
  const {
    data: userStats,
    error: statsError,
    isLoading: isLoadingStats,
    mutate: mutateStats
  } = useSWR(
    enabled ? `user-stats-${userId}` : null,
    () => calculateUserStats(userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 0, // Manual refresh only
      onSuccess: () => {
        setError(null);
        setLastUpdated(new Date());
      },
      onError: (err) => {
        console.error('[Dashboard] ❌ Failed to load user stats:', err);
        setError(err?.message || 'Failed to load stats');
      }
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
        // Assessment history loaded
      },
      onError: (error) => {
        console.error('[Dashboard] ❌ Failed to load assessment history:', error);
      }
    }
  );

  // ✅ SWR for latest assessment result with enhanced features
  const {
    data: latestResult,
    error: resultError,
    isLoading: isLoadingResult,
    mutate: mutateResult
  } = useSWR(
    enabled ? `latest-result-${userId}` : null,
    async () => {
      // Use enhanced fetcher that gets full assessment data
      return getLatestAssessmentFromArchive();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      refreshInterval: opts.refreshInterval * 2, // Less frequent for results
      fallbackData: null,
      onSuccess: (data) => {
        if (data) {
          setLastUpdated(new Date());
          // Check for new completed assessment
          const isNewCompletion = data.id !== lastNotificationRef.current &&
                                 data.status === 'completed' &&
                                 opts.enableNotifications;
          if (isNewCompletion) {
            lastNotificationRef.current = data.id;
            // Show browser notification if available
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Assessment Complete', {
                body: 'Your assessment has been completed successfully!',
                icon: '/favicon.ico',
              });
            }
          }
        }
      },
      onError: (err) => {
        console.error('[Dashboard] ❌ Failed to load latest result:', err);
      }
    }
  );

  // ✅ Enhanced refresh functions
  const refreshHistory = useCallback(async () => {
    try {
      await mutateHistory();
    } catch (err) {
      console.error('[Dashboard] Error refreshing history:', err);
    }
  }, [mutateHistory]);

  const refreshStats = useCallback(async () => {
    try {
      await mutateStats();
    } catch (err) {
      console.error('[Dashboard] Error refreshing stats:', err);
    }
  }, [mutateStats]);

  const refreshAll = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setError(null);

    try {
      await Promise.all([
        mutateHistory(),
        mutateStats(),
        mutateResult()
      ]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Dashboard] Error refreshing all:', err);
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, mutateHistory, mutateStats, mutateResult]);

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

  // ✅ Auto-refresh on window focus (optimized)
  useEffect(() => {
    if (!opts.enableRealTimeUpdates || !enabled) return;

    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTimeRef.current;

      // Refresh if window was unfocused for more than 5 seconds
      if (timeSinceLastFocus > 5000) {
        console.log('[Dashboard] Window focus detected, refreshing data');
        refreshAll();
      }

      lastFocusTimeRef.current = now;
    };

    const handleBlur = () => {
      lastFocusTimeRef.current = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [opts.enableRealTimeUpdates, enabled, refreshAll]);

  // ✅ Initialize notifications
  useEffect(() => {
    if (opts.enableNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [opts.enableNotifications]);

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

    // Enhanced features
    isRefreshing,
    error,
    lastUpdated,
    hasActiveAssessment,
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

