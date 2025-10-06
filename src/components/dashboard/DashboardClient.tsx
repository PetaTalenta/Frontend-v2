'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './header';
import { StatsCard } from './stats-card';
import { AssessmentTable } from './assessment-table';
import { VIAISCard } from './viais-card';
import { OceanCard } from './ocean-card';
import { ProgressCard } from './progress-card';
import { useRouter, useSearchParams } from 'next/navigation';
import { calculateUserStats, formatStatsForDashboard, fetchAssessmentHistoryFromAPI as formatAssessmentHistory, calculateUserProgress } from '../../utils/user-stats';

import type { StatCard, ProgressItem, AssessmentData } from '../../types/dashboard';
import type { OceanScores, ViaScores } from '../../types/assessment-results';
import { useDashboardData, invalidateDashboardData } from '../../hooks/useDashboardData';

interface DashboardStaticData {
  defaultStats: {
    totalAssessments: number;
    completionRate: number;
    averageScore: number;
    lastUpdated: string;
  };
  systemInfo: {
    version: string;
    features: string[];
    announcements: string[];
  };
}

interface DashboardClientProps {
  staticData: DashboardStaticData;
}

// Deprecated mock assessment preserved for reference (not used)


export default function DashboardClient({ staticData }: DashboardClientProps) {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ⚠️ REMOVED: Duplicate WebSocket listener yang menyebabkan konflik
  // Auto-redirect sekarang di-handle oleh NotificationRedirectListener (global di RootLayout)
  // Tidak perlu listener duplikat di setiap page component
  
  // Local state for dashboard data
  const [statsData, setStatsData] = useState<StatCard[]>([]);
  // Assessment history is now managed via SWR (cache-first + revalidate)
  // Remove local state; we'll consume SWR data directly
  // const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [oceanScores, setOceanScores] = useState<OceanScores | undefined>();
  const [viaScores, setViaScores] = useState<ViaScores | undefined>();

  // ✅ Use SWR-based dashboard data hook
  const {
    assessmentHistory,
    isLoadingHistory,
    isValidatingHistory,
    historyError: assessmentError,
    userStats,
    isLoadingStats,
    statsError,
    latestResult,
    isLoadingResult,
    resultError,
    refreshHistory,
    refreshStats,
    refreshAll,
    addAssessmentOptimistic,
    updateAssessmentOptimistic,
    removeAssessmentOptimistic,
  } = useDashboardData({
    userId: user?.id || '',
    enabled: !!user
  });

  // ✅ Load dashboard data - background sync (non-blocking)
  const loadDashboardData = useCallback(async () => {
    if (!user || !userStats) return;

    try {
      // ✅ Don't show loading spinner - data already visible from cache
      // setIsLoading(true); // Removed - non-blocking background sync

      // ✅ Fetch all data in parallel (non-blocking)
      const [formattedStats, formattedProgress] = await Promise.all([
        formatStatsForDashboard(userStats),
        calculateUserProgress(userStats)
      ]);

      // ✅ Update state smoothly (no loading spinner)
      setStatsData(formattedStats);
      setProgressData(formattedProgress);

      // Set scores from latest result
      if (latestResult && latestResult.assessment_data) {
        setOceanScores(latestResult.assessment_data.ocean);
        setViaScores(latestResult.assessment_data.viaIs);
      } else {
        setOceanScores(undefined);
        setViaScores(undefined);
      }

    } catch (error) {
      console.error('Dashboard: Background sync error:', error);
      // ✅ Don't show error to user - cached data still visible
      
      // Use static data as fallback
      setStatsData([
        {
          id: 'assessments',
          label: 'Total Assessment',
          value: staticData.defaultStats.totalAssessments,
          color: '#888',
          icon: 'assessment',
        },
        {
          id: 'completion',
          label: 'Tingkat Penyelesaian',
          value: staticData.defaultStats.completionRate,
          color: '#888',
          icon: 'completion',
        },
        {
          id: 'score',
          label: 'Rata-rata Skor',
          value: staticData.defaultStats.averageScore,
          color: '#888',
          icon: 'score',
        },
        {
          id: 'growth',
          label: 'Pertumbuhan',
          value: 0,
          color: '#888',
          icon: 'growth',
        }
      ]);
      setProgressData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, userStats, latestResult, staticData]);

  // Load data when dependencies change
  useEffect(() => {
    if (user && userStats) {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  // Effect: Refetch data jika ada query param ?refresh=1, lalu jika assessment terbaru selesai, redirect ke hasil
  useEffect(() => {
    if (searchParams?.get('refresh') === '1' && user) {
      // ✅ Invalidate cache dan revalidate using SWR hook
      invalidateDashboardData(user.id)
        .then(() => {
          console.log('[Dashboard] Cache invalidated, revalidating...');
          return refreshAll();
        })
        .catch(err => {
          console.error('[Dashboard] Failed to invalidate cache:', err);
        });

      // Cek jika assessment terbaru sudah selesai, redirect ke hasil
      if (assessmentHistory && assessmentHistory.length > 0) {
        const latest = assessmentHistory[0];
        if (latest.status === 'Selesai' && latest.result_id) {
          router.replace(`/results/${latest.result_id}`);
          return;
        }
      }
      // Hapus param refresh dari URL agar tidak refetch terus-menerus
      const params = new URLSearchParams(window.location.search);
      params.delete('refresh');
      const newUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, refreshAll, assessmentHistory, router, user]);

  // ✅ Refresh function using SWR hook
  const refreshDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll(); // Refresh all SWR data
      await loadDashboardData();
    } catch (error) {
      console.error('Dashboard: Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ✅ Refresh only assessment history table (using SWR hook)
  const refreshAssessmentHistory = useCallback(async () => {
    try {
      await refreshHistory();
    } catch (error) {
      console.error('Dashboard: Error refreshing assessment history:', error);
    }
  }, [refreshHistory]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="dashboard-full-height">
        <div className="dashboard-container">
          <Header logout={logout} />
          <div className="dashboard-main-grid">
            <div className="space-y-6">
              {/* Stats Cards Loading */}
              <div className="dashboard-stats-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              {/* Assessment Table Loading */}
              <div className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            {/* Sidebar Loading */}
            <div className="dashboard-sidebar space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError || resultError || assessmentError) {
    return (
      <div className="dashboard-full-height flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Dashboard Error
            </h2>
            <p className="text-gray-600 mb-4">
              Gagal memuat data dashboard. Silakan coba lagi.
            </p>
            <button
              onClick={refreshDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Show skeleton only if NO data available (SWR handles this with keepPreviousData)
  const showSkeleton = isLoadingHistory && !assessmentHistory;

  // ✅ Show sync indicator if background revalidation in progress
  const isSyncing = isValidatingHistory && assessmentHistory;

  return (
    <div className="dashboard-full-height">
      <div className="dashboard-container">
        <Header logout={logout} />

        {/* ✅ Subtle sync indicator */}
        {isSyncing && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm text-blue-700">Syncing latest data...</span>
            </div>
          </div>
        )}

        <div className="dashboard-main-grid">
          {/* Main Content */}
          <div
            className="space-y-6 dashboard-mobile-card-spacing"
            style={{ maxWidth: '100%', overflowX: 'hidden' }}
          >
            {/* Stats Cards */}
            <div className="dashboard-stats-grid">
              {statsData.map((stat) => (
                <StatsCard key={stat.id} stat={stat} />
              ))}
            </div>
            {/* Assessment History */}
            <div className="dashboard-table-scroll">
              <AssessmentTable
                data={assessmentHistory || []}
                onRefresh={refreshAssessmentHistory}
                swrKey={`assessment-history-${user?.id}`}
                isLoading={isLoadingHistory}
                isValidating={isValidatingHistory}
              />
            </div>
          </div>
          {/* Right Sidebar */}
          <div
            className="dashboard-sidebar"
            style={{ maxWidth: '100%', overflowX: 'hidden' }}
          >
            {/* VIAIS and Ocean cards stack vertically on mobile */}
            <div className="dashboard-sidebar-mobile-grid dashboard-sidebar-mobile-stack">
              <VIAISCard viaScores={viaScores} />
              <OceanCard oceanScores={oceanScores} />
            </div>
            {/* RIASEC card full width */}
            <div className="dashboard-sidebar-mobile-full">
              <ProgressCard
                title="RIASEC"
                description="Ketahui di mana Anda dapat tumbuh dan berkontribusi paling banyak."
                data={progressData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
