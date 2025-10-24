'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './header';
import { StatsCard } from './stats-card';
import { StatsCardSkeleton } from './stats-card-skeleton';
import { AssessmentTable } from './assessment-table';
import { VIAISCard } from './viais-card';
import { OceanCard } from './ocean-card';
import { ProgressCard } from './progress-card';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import { useJobs, formatJobDataForTable } from '../../hooks/useJobs';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { dashboardCacheStrategy } from '../../lib/tanStackConfig';
import { handleComponentError } from '../../lib/errorHandling';

// Dummy data untuk UI
const dummyStatsData = [
  {
    id: 'assessments',
    label: 'Total Assessment',
    value: 12,
    color: '#6475e9',
    icon: 'Cpu.svg',
  },
  {
    id: 'completion',
    label: 'Tingkat Penyelesaian',
    value: 85,
    color: '#a2acf2',
    icon: 'Check.svg',
  },
  {
    id: 'score',
    label: 'Rata-rata Skor',
    value: 78,
    color: '#6475e9',
    icon: 'MagnifyingGlass.svg',
  },
  {
    id: 'growth',
    label: 'Pertumbuhan',
    value: 15,
    color: '#a2acf2',
    icon: 'Chevron right.svg',
  }
];

const dummyAssessmentData = [
  {
    id: 1,
    archetype: 'The Innovator',
    created_at: '2024-01-15T10:30:00Z',
    status: 'completed',
    result_id: 'result-1',
    job_id: 'job-1'
  },
  {
    id: 2,
    archetype: 'The Analyst',
    created_at: '2024-01-10T14:20:00Z',
    status: 'completed',
    result_id: 'result-2',
    job_id: 'job-2'
  },
  {
    id: 3,
    archetype: 'The Leader',
    created_at: '2024-01-05T09:15:00Z',
    status: 'processing',
    result_id: null,
    job_id: 'job-3'
  },
  {
    id: 4,
    archetype: 'The Creator',
    created_at: '2023-12-28T16:45:00Z',
    status: 'completed',
    result_id: 'result-4',
    job_id: 'job-4'
  },
  {
    id: 5,
    archetype: 'The Strategist',
    created_at: '2023-12-20T11:30:00Z',
    status: 'failed',
    result_id: null,
    job_id: 'job-5'
  }
];

const dummyProgressData = [
  { label: 'Realistic', value: 75 },
  { label: 'Investigative', value: 85 },
  { label: 'Artistic', value: 60 },
  { label: 'Social', value: 90 },
  { label: 'Enterprising', value: 70 },
  { label: 'Conventional', value: 55 }
];

const dummyOceanScores = {
  openness: 75,
  conscientiousness: 60,
  extraversion: 45,
  agreeableness: 80,
  neuroticism: 25
};

const dummyViaScores = {
  creativity: 92,
  curiosity: 89,
  judgment: 78,
  loveOfLearning: 85,
  perspective: 74,
  bravery: 65,
  perseverance: 82,
  honesty: 88,
  zest: 58,
  love: 76,
  kindness: 84,
  socialIntelligence: 69,
  teamwork: 71,
  fairness: 86,
  leadership: 63,
  forgiveness: 79,
  humility: 72,
  prudence: 68,
  selfRegulation: 75,
  appreciationOfBeauty: 91,
  gratitude: 83,
  hope: 77,
  humor: 64,
  spirituality: 52
};

interface DashboardClientProps {
  staticData: {
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
  };
}

function DashboardClientComponent({ staticData }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch jobs data from API
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError, error: jobsError, refetch: refetchJobs } = useJobs({
    params: { limit: 20 },
    enabled: true
  });

  // Fetch dashboard stats data from API
  const {
    data: dashboardStats,
    loading: isStatsLoading,
    isFetching: isStatsFetching,
    error: statsError,
    isError: isStatsError,
    refreshAll,
    jobsStatsError,
    profileError,
    hasRetryableError,
    errorSeverity
  } = useDashboardStats();

  // Format jobs data for table
  const assessmentData = useMemo(() => {
    if (jobsData?.data?.jobs) {
      return formatJobDataForTable(jobsData.data.jobs);
    }
    return [];
  }, [jobsData]);

  // Transform dashboard stats to StatCard format
  const statsData = useMemo(() => {
    if (!dashboardStats) {
      return [];
    }

    return [
      {
        id: 'processing',
        label: 'Processing',
        value: dashboardStats.processing,
        color: '#f59e0b', // amber-500
        icon: 'Cpu.svg',
      },
      {
        id: 'completed',
        label: 'Completed',
        value: dashboardStats.completed,
        color: '#10b981', // emerald-500
        icon: 'Check.svg',
      },
      {
        id: 'failed',
        label: 'Failed',
        value: dashboardStats.failed,
        color: '#ef4444', // red-500
        icon: 'MagnifyingGlass.svg',
      },
      {
        id: 'token-balance',
        label: 'Token Balance',
        value: dashboardStats.tokenBalance,
        color: '#6475e9', // primary blue
        icon: 'Chevron right.svg',
      }
    ];
  }, [dashboardStats]);

  // Memoize dummy data to prevent unnecessary re-creation
  const dummyStatsDataMemo = useMemo(() => [
    {
      id: 'assessments',
      label: 'Total Assessment',
      value: 12,
      color: '#6475e9',
      icon: 'Cpu.svg',
    },
    {
      id: 'completion',
      label: 'Tingkat Penyelesaian',
      value: 85,
      color: '#a2acf2',
      icon: 'Check.svg',
    },
    {
      id: 'score',
      label: 'Rata-rata Skor',
      value: 78,
      color: '#6475e9',
      icon: 'MagnifyingGlass.svg',
    },
    {
      id: 'growth',
      label: 'Pertumbuhan',
      value: 15,
      color: '#a2acf2',
      icon: 'Chevron right.svg',
    }
  ], []);

  const dummyAssessmentDataMemo = useMemo(() => [
    {
      id: 1,
      archetype: 'The Innovator',
      created_at: '2024-01-15T10:30:00Z',
      status: 'completed',
      result_id: 'result-1',
      job_id: 'job-1'
    },
    {
      id: 2,
      archetype: 'The Analyst',
      created_at: '2024-01-10T14:20:00Z',
      status: 'completed',
      result_id: 'result-2',
      job_id: 'job-2'
    },
    {
      id: 3,
      archetype: 'The Leader',
      created_at: '2024-01-05T09:15:00Z',
      status: 'processing',
      result_id: null,
      job_id: 'job-3'
    },
    {
      id: 4,
      archetype: 'The Creator',
      created_at: '2023-12-28T16:45:00Z',
      status: 'completed',
      result_id: 'result-4',
      job_id: 'job-4'
    },
    {
      id: 5,
      archetype: 'The Strategist',
      created_at: '2023-12-20T11:30:00Z',
      status: 'failed',
      result_id: null,
      job_id: 'job-5'
    }
  ], []);

  const dummyProgressDataMemo = useMemo(() => [
    { label: 'Realistic', value: 75 },
    { label: 'Investigative', value: 85 },
    { label: 'Artistic', value: 60 },
    { label: 'Social', value: 90 },
    { label: 'Enterprising', value: 70 },
    { label: 'Conventional', value: 55 }
  ], []);

  const dummyOceanScoresMemo = useMemo(() => ({
    openness: 75,
    conscientiousness: 60,
    extraversion: 45,
    agreeableness: 80,
    neuroticism: 25
  }), []);

  const dummyViaScoresMemo = useMemo(() => ({
    creativity: 92,
    curiosity: 89,
    judgment: 78,
    loveOfLearning: 85,
    perspective: 74,
    bravery: 65,
    perseverance: 82,
    honesty: 88,
    zest: 58,
    love: 76,
    kindness: 84,
    socialIntelligence: 69,
    teamwork: 71,
    fairness: 86,
    leadership: 63,
    forgiveness: 79,
    humility: 72,
    prudence: 68,
    selfRegulation: 75,
    appreciationOfBeauty: 91,
    gratitude: 83,
    hope: 77,
    humor: 64,
    spirituality: 52
  }), []);

  // Memoize handlers
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use smart refresh strategy
      await dashboardCacheStrategy.preloadOnUserAction('refresh_stats');
      await Promise.all([
        refetchJobs(),
        refreshAll()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [refetchJobs, refreshAll]);

  // Handle stats retry
  const handleStatsRetry = useCallback(async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, [refreshAll]);

  const handleLogout = useCallback(() => {
    // Dummy logout function
    console.log('Logout clicked');
  }, []);

  // Handle user activity for smart refetch
  const handleUserActivity = useCallback(() => {
    dashboardCacheStrategy.smartRefetch(true);
  }, []);

  // Preload data when component mounts
  useEffect(() => {
    dashboardCacheStrategy.preloadOnUserAction('view_dashboard');
  }, []);

  // Add event listeners for user activity
  useEffect(() => {
    // Add event listeners for user activity
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    
    return () => {
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
    };
  }, [handleUserActivity]);

  // Loading state simulation
  if (isLoading) {
    return (
      <div className="dashboard-full-height dashboard-responsive-wrapper">
        <div className="dashboard-container flex flex-col gap-6">
          <Header logout={handleLogout} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 lg:col-span-2">
              {/* Stats Cards Loading with staggered animation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCardSkeleton delay={0} />
                <StatsCardSkeleton delay={100} />
                <StatsCardSkeleton delay={200} />
                <StatsCardSkeleton delay={300} />
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
            <div className="flex flex-col gap-6">
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

  return (
    <div className="dashboard-full-height dashboard-responsive-wrapper">
      <div className="dashboard-container flex flex-col gap-6">
        <Header logout={handleLogout} />
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="space-y-6 mb-4 lg:mb-0 lg:col-span-2 max-w-full overflow-x-hidden">
            {/* Stats Cards with progressive loading */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isStatsLoading ? (
                // Show staggered skeleton during initial load
                <>
                  <StatsCardSkeleton delay={0} />
                  <StatsCardSkeleton delay={100} />
                  <StatsCardSkeleton delay={200} />
                  <StatsCardSkeleton delay={300} />
                </>
              ) : (
                // Show actual stats or error states
                statsData.map((stat, index) => (
                  <StatsCard
                    key={stat.id}
                    stat={stat}
                    isLoading={isStatsFetching && !isStatsLoading}
                    isError={isStatsError}
                    onRetry={hasRetryableError ? handleStatsRetry : undefined}
                    error={statsError?.userFriendlyMessage || 'Failed to load stats'}
                  />
                ))
              )}
            </div>
            {/* Assessment History */}
            <div className="dashboard-table-scroll -mx-3 px-3 sm:mx-0 sm:px-0">
              <AssessmentTable
                data={assessmentData}
                onRefresh={handleRefresh}
                swrKey="jobs-data"
                isLoading={isJobsLoading || isLoading}
                isValidating={false}
              />
            </div>
          </div>
          {/* Right Sidebar */}
          <div className="flex flex-col gap-6 max-w-full overflow-x-hidden">
            {/* VIAIS and Ocean cards stack vertically on mobile */}
            <div className="grid grid-cols-1 gap-4">
              <VIAISCard viaScores={dummyViaScoresMemo} />
              <OceanCard oceanScores={dummyOceanScoresMemo} />
            </div>
            {/* RIASEC card full width */}
            <div className="w-full">
              <ProgressCard
                title="RIASEC"
                description="Ketahui di mana Anda dapat tumbuh dan berkontribusi paling banyak."
                data={dummyProgressDataMemo}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardClientWithErrorBoundary(props: DashboardClientProps) {
  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    handleComponentError(error, errorInfo, {
      component: 'DashboardClient',
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <DashboardErrorBoundary onError={handleError}>
      <DashboardClientComponent {...props} />
    </DashboardErrorBoundary>
  );
}

export default React.memo(DashboardClientWithErrorBoundary);
