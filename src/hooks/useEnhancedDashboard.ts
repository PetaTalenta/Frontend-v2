/**
 * Enhanced Dashboard Hook
 * Provides optimized data loading with real-time updates and optimistic UI
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { calculateUserStats, formatStatsForDashboard, fetchAssessmentHistoryFromAPI as formatAssessmentHistory, calculateUserProgress } from '../utils/user-stats';
import apiService from '../services/apiService';

import type { StatCard, ProgressItem } from '../types/dashboard';
import type { OceanScores, ViaScores } from '../types/assessment-results';

export interface EnhancedDashboardData {
  statsData: StatCard[];
  assessmentData: any[];
  progressData: ProgressItem[];
  oceanScores?: OceanScores;
  viaScores?: ViaScores;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  hasActiveAssessment: boolean;
}

export interface EnhancedDashboardOptions {
  enableRealTimeUpdates?: boolean;
  enableNotifications?: boolean;
  refreshInterval?: number;
  optimisticUpdates?: boolean;
}

const DEFAULT_OPTIONS: EnhancedDashboardOptions = {
  enableRealTimeUpdates: true,
  enableNotifications: true,
  refreshInterval: 30000, // 30 seconds
  optimisticUpdates: true,
};

export function useEnhancedDashboard(options: EnhancedDashboardOptions = {}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasActiveAssessment, setHasActiveAssessment] = useState(false);
  const [optimisticData, setOptimisticData] = useState<Partial<EnhancedDashboardData>>({});
  
  // Refs for tracking
  const lastNotificationRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // SWR for user stats with optimized caching
  const { data: userStats, error: statsError, mutate: mutateStats } = useSWR(
    user ? `enhanced-user-stats-${user.id}` : null,
    () => calculateUserStats(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      refreshInterval: opts.refreshInterval,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      onSuccess: () => {
        setError(null);
        setLastUpdated(new Date());
      },
      onError: (error) => {
        console.error('Enhanced Dashboard: Error fetching user stats:', error);
        setError(error.message);
      }
    }
  );

  // SWR for latest assessment result with background refresh
  const { data: latestResult, error: resultError, mutate: mutateResult } = useSWR(
    user ? `enhanced-latest-result-${user.id}` : null,
    async () => {
      // Use user-stats helper to fetch latest assessment with full data
      const { getLatestAssessmentFromArchive } = await import('../utils/user-stats');
      return getLatestAssessmentFromArchive();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: opts.refreshInterval * 2, // Less frequent for results
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      onSuccess: (data) => {
        if (data) {
          setLastUpdated(new Date());
          const isNewCompletion = data.id !== lastNotificationRef.current && data.status === 'completed' && opts.enableNotifications;
          if (isNewCompletion) {
            lastNotificationRef.current = data.id;
            // Browser notification via helper (optional)
            // await showAssessmentCompleteNotification({
            //   assessmentId: data.id,
            //   assessmentType: 'AI-Driven Talent Mapping',
            //   completedAt: data.createdAt,
            //   resultUrl: `/results/${data.id}`,
            // });
          }
        }
      }
    }
  );

  // Note: WebSocket integration will be reintroduced via notificationService when ready.
  // Placeholder removed to fix syntax issues after refactor.

  // Format dashboard data with optimistic updates
  const formatDashboardData = useCallback(async (stats: any, result: any): Promise<EnhancedDashboardData> => {
    try {
      const [formattedStats, formattedAssessments, formattedProgress] = await Promise.all([
        formatStatsForDashboard(stats),
        formatAssessmentHistory(stats),
        calculateUserProgress(stats)
      ]);

      const baseData: EnhancedDashboardData = {
        statsData: formattedStats || [],
        assessmentData: formattedAssessments || [],
        progressData: formattedProgress || [],
        oceanScores: result?.assessment_data?.ocean,
        viaScores: result?.assessment_data?.viaIs,
        isLoading: false,
        isRefreshing,
        error: null,
        lastUpdated,
        hasActiveAssessment,
      };

      // Apply optimistic updates
      if (opts.optimisticUpdates && Object.keys(optimisticData).length > 0) {
        return { ...baseData, ...optimisticData };
      }

      return baseData;
    } catch (error) {
      console.error('Enhanced Dashboard: Error formatting data:', error);
      throw error;
    }
  }, [isRefreshing, lastUpdated, hasActiveAssessment, optimisticData, opts.optimisticUpdates]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        mutateStats(),
        mutateResult(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Enhanced Dashboard: Refresh error:', error);
      setError(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, mutateStats, mutateResult]);

  // Auto-refresh on window focus (optimized)
  useEffect(() => {
    let lastFocusTime = Date.now();

    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime;

      // Reduced threshold from 20s to 5s for faster updates
      if (timeSinceLastFocus > 5000 && !authLoading && user) {
        console.log('Enhanced Dashboard: Window focus detected, refreshing data');
        refresh();
      }

      lastFocusTime = now;
    };

    const handleBlur = () => {
      lastFocusTime = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, authLoading, refresh]);

  // Initialize notifications
  useEffect(() => {
    if (opts.enableNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [opts.enableNotifications]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Compute final dashboard data
  const dashboardData = useSWR(
    userStats && !statsError ? `dashboard-data-${user?.id}-${lastUpdated?.getTime()}` : null,
    () => formatDashboardData(userStats, latestResult),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds
    }
  );

  return {
    data: dashboardData.data,
    isLoading: !user || authLoading || !userStats || dashboardData.isLoading,
    isRefreshing,
    error: error || statsError || resultError || dashboardData.error,
    refresh,
    lastUpdated,
    hasActiveAssessment,
  };
}
