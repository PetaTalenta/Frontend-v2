import useSWR from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { calculateUserStats, formatStatsForDashboard, formatAssessmentHistory, calculateUserProgress } from '../services/user-stats';
import { getLatestAssessmentResult } from '../services/assessment-api';

// Hook for user statistics
export function useUserStats() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? `user-stats-${user.id}` : null,
    () => calculateUserStats(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      onError: (error) => {
        console.error('Error fetching user stats:', error);
      }
    }
  );

  return {
    userStats: data,
    isLoading,
    error,
    refetch: mutate,
  };
}

// Hook for formatted dashboard data
export function useDashboardData() {
  const { user } = useAuth();
  const { userStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useUserStats();
  
  const { data: formattedData, error: formatError, isLoading: formatLoading, mutate } = useSWR(
    userStats ? `dashboard-data-${user?.id}` : null,
    async () => {
      if (!userStats) return null;
      
      const [stats, assessments, progress] = await Promise.all([
        formatStatsForDashboard(userStats),
        formatAssessmentHistory(userStats),
        calculateUserProgress(userStats)
      ]);
      
      return { stats, assessments, progress };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 120000, // 2 minutes
      errorRetryCount: 2,
      errorRetryInterval: 3000,
    }
  );

  const refetch = async () => {
    await refetchStats();
    await mutate();
  };

  return {
    dashboardData: formattedData,
    isLoading: statsLoading || formatLoading,
    error: statsError || formatError,
    refetch,
  };
}

// Hook for latest assessment result
export function useLatestAssessmentResult() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? `latest-result-${user.id}` : null,
    () => getLatestAssessmentResult(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('Error fetching latest assessment result:', error);
      }
    }
  );

  return {
    latestResult: data,
    isLoading,
    error,
    refetch: mutate,
  };
}

// Hook for user profile data
export function useUserProfile() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? `user-profile-${user.id}` : null,
    async () => {
      // This would typically fetch additional profile data from API
      // For now, we'll return the user data from auth context
      return user;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 600000, // 10 minutes
      errorRetryCount: 1,
      errorRetryInterval: 3000,
    }
  );

  return {
    profile: data,
    isLoading,
    error,
    refetch: mutate,
  };
}

// Hook for combined user data (stats + latest result)
export function useCombinedUserData() {
  const { userStats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { latestResult, isLoading: resultLoading, error: resultError } = useLatestAssessmentResult();
  
  const isLoading = statsLoading || resultLoading;
  const error = statsError || resultError;
  
  return {
    userStats,
    latestResult,
    isLoading,
    error,
    hasData: !!userStats || !!latestResult,
  };
}
