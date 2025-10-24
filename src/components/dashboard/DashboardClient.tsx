'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Header from './header';
import { StatsCard } from './stats-card';
import { AssessmentTable } from './assessment-table';
import { VIAISCard } from './viais-card';
import { OceanCard } from './ocean-card';
import { ProgressCard } from './progress-card';
import { useJobs, formatJobDataForTable } from '../../hooks/useJobs';

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

  // Format jobs data for table
  const assessmentData = useMemo(() => {
    if (jobsData?.data?.jobs) {
      return formatJobDataForTable(jobsData.data.jobs);
    }
    return [];
  }, [jobsData]);

  // Memoize dummy data to prevent unnecessary re-creation
  const dummyStatsData = useMemo(() => [
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

  const dummyAssessmentData = useMemo(() => [
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

  const dummyProgressData = useMemo(() => [
    { label: 'Realistic', value: 75 },
    { label: 'Investigative', value: 85 },
    { label: 'Artistic', value: 60 },
    { label: 'Social', value: 90 },
    { label: 'Enterprising', value: 70 },
    { label: 'Conventional', value: 55 }
  ], []);

  const dummyOceanScores = useMemo(() => ({
    openness: 75,
    conscientiousness: 60,
    extraversion: 45,
    agreeableness: 80,
    neuroticism: 25
  }), []);

  const dummyViaScores = useMemo(() => ({
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
      await refetchJobs();
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [refetchJobs]);

  const handleLogout = useCallback(() => {
    // Dummy logout function
    console.log('Logout clicked');
  }, []);

  // Loading state simulation
  if (isLoading) {
    return (
      <div className="dashboard-full-height dashboard-responsive-wrapper">
        <div className="dashboard-container flex flex-col gap-6">
          <Header logout={handleLogout} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 lg:col-span-2">
              {/* Stats Cards Loading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dummyStatsData.map((stat) => (
                <StatsCard key={stat.id} stat={stat} />
              ))}
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
              <VIAISCard viaScores={dummyViaScores} />
              <OceanCard oceanScores={dummyOceanScores} />
            </div>
            {/* RIASEC card full width */}
            <div className="w-full">
              <ProgressCard
                title="RIASEC"
                description="Ketahui di mana Anda dapat tumbuh dan berkontribusi paling banyak."
                data={dummyProgressData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardClientComponent);
