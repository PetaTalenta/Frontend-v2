'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from './header';
import { StatsCard } from './stats-card';
import { AssessmentTable } from './assessment-table';
import { VIAISCard } from './viais-card';
import { OceanCard } from './ocean-card';
import { ProgressCard } from './progress-card';
import { calculateUserStats, formatStatsForDashboard, formatAssessmentHistory, calculateUserProgress } from '../../services/user-stats';
import { getLatestAssessmentResult } from '../../services/assessment-api';
import type { StatCard, ProgressItem } from '../../types/dashboard';
import type { OceanScores, ViaScores } from '../../types/assessment-results';
import useSWR from 'swr';

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

export default function DashboardClient({ staticData }: DashboardClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Local state for dashboard data
  const [statsData, setStatsData] = useState<StatCard[]>([]);
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [oceanScores, setOceanScores] = useState<OceanScores | undefined>();
  const [viaScores, setViaScores] = useState<ViaScores | undefined>();

  // SWR for user stats with caching
  const { data: userStats, error: statsError, mutate: mutateStats } = useSWR(
    user ? `user-stats-${user.id}` : null,
    () => calculateUserStats(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // SWR for latest assessment result
  const { data: latestResult, error: resultError } = useSWR(
    user ? `latest-result-${user.id}` : null,
    () => getLatestAssessmentResult(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user || !userStats) return;

    try {
      setIsLoading(true);

      // Format data for dashboard components
      const formattedStats = formatStatsForDashboard(userStats);
      const formattedAssessments = await formatAssessmentHistory(userStats);
      const formattedProgress = await calculateUserProgress(userStats);

      setStatsData(formattedStats);
      setAssessmentData(formattedAssessments || []);
      setProgressData(formattedProgress);

      // Set scores from latest result
      if (latestResult) {
        setOceanScores(latestResult.assessment_data?.ocean_scores);
        setViaScores(latestResult.assessment_data?.via_scores);
      }

    } catch (error) {
      console.error('Dashboard: Error loading data:', error);
      
      // Use static data as fallback
      setStatsData([
        {
          id: 'assessments',
          title: 'Total Assessment',
          value: staticData.defaultStats.totalAssessments.toString(),
          change: '0%',
          trend: 'up' as const,
          icon: 'assessment'
        },
        {
          id: 'completion',
          title: 'Tingkat Penyelesaian',
          value: `${staticData.defaultStats.completionRate}%`,
          change: '0%',
          trend: 'up' as const,
          icon: 'completion'
        },
        {
          id: 'score',
          title: 'Rata-rata Skor',
          value: staticData.defaultStats.averageScore.toString(),
          change: '0%',
          trend: 'up' as const,
          icon: 'score'
        },
        {
          id: 'growth',
          title: 'Pertumbuhan',
          value: '0%',
          change: '0%',
          trend: 'up' as const,
          icon: 'growth'
        }
      ]);
      setAssessmentData([]);
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

  // Refresh function
  const refreshDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await mutateStats(); // Refresh SWR cache
      await loadDashboardData();
    } catch (error) {
      console.error('Dashboard: Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="dashboard-full-height">
        <div className="dashboard-container">
          <Header 
            user={user} 
            onRefresh={refreshDashboardData}
            isRefreshing={isRefreshing}
          />
          
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
  if (statsError || resultError) {
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

  return (
    <div className="dashboard-full-height">
      <div className="dashboard-container">
        <Header 
          user={user} 
          onRefresh={refreshDashboardData}
          isRefreshing={isRefreshing}
        />
        
        <div className="dashboard-main-grid">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="dashboard-stats-grid">
              {statsData.map((stat) => (
                <StatsCard key={stat.id} stat={stat} />
              ))}
            </div>

            {/* Assessment History */}
            <AssessmentTable
              data={assessmentData}
              onRefresh={refreshDashboardData}
            />
          </div>

          {/* Right Sidebar */}
          <div className="dashboard-sidebar">
            <VIAISCard viaScores={viaScores} />
            <OceanCard oceanScores={oceanScores} />
            <ProgressCard
              title="RIASEC"
              description="Ketahui di mana Anda dapat tumbuh dan berkontribusi paling banyak."
              data={progressData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
