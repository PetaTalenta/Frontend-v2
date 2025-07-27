"use client"

// Update the imports to use the new components and data
import { Header } from "./components/dashboard/header"
import { StatsCard } from "./components/dashboard/stats-card"
import { AssessmentTable } from "./components/dashboard/assessment-table"
import { VIAISCard } from "./components/dashboard/viais-card"
import { OceanCard } from "./components/dashboard/ocean-card"

import { ProgressCard } from "./components/dashboard/progress-card"
import { chartData } from "./data/mockData"
import { useAuth } from "./contexts/AuthContext"
import { calculateUserStats, formatStatsForDashboard, formatAssessmentHistory, calculateUserProgress } from "./services/user-stats"
import { getLatestAssessmentResult } from "./services/assessment-api"
import { useState, useEffect, useCallback } from "react"
import type { StatCard, ProgressItem } from "./types/dashboard"
import type { OceanScores, ViaScores } from "./types/assessment-results"

// Error Boundary Component
import React from "react"

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f5f7fb] p-6 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Dashboard Error
              </h2>
              <p className="text-gray-600 mb-4">
                Something went wrong while loading the dashboard.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#6475e9] text-white px-4 py-2 rounded-lg hover:bg-[#5a6bd8]"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Dashboard Component with Error Handling
function DashboardContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [statsData, setStatsData] = useState<StatCard[]>([]);
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [oceanScores, setOceanScores] = useState<OceanScores | undefined>(undefined);
  const [viaScores, setViaScores] = useState<ViaScores | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    // Load auto-refresh preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-auto-refresh');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  console.log('DashboardContent: Rendering with state:', {
    user: user?.email,
    isAuthenticated,
    authLoading,
    isLoading,
    error
  });

  // Load user data function with better error handling
  const loadUserData = useCallback(async () => {
    if (!user) {
      console.log('Dashboard: No user found, skipping data load');
      setIsLoading(false);
      return;
    }

    console.log('Dashboard: Loading data for user:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      // Try to get assessment-history and progress from localStorage
      let localHistory = [];
      let localProgress = {};
      try {
        const historyRaw = localStorage.getItem('assessment-history');
        localHistory = historyRaw ? JSON.parse(historyRaw) : [];
        console.log('Dashboard: assessment-history from localStorage:', localHistory);
        window.console && window.console.log && window.console.log('Dashboard (window): assessment-history from localStorage:', localHistory);
      } catch (err) {
        console.error('Dashboard: Error parsing assessment-history from localStorage:', err);
        window.console && window.console.error && window.console.error('Dashboard (window): Error parsing assessment-history from localStorage:', err);
        localHistory = [];
      }
      try {
        const progressRaw = localStorage.getItem('assessment-progress');
        localProgress = progressRaw ? JSON.parse(progressRaw) : {};
        console.log('Dashboard: assessment-progress from localStorage:', localProgress);
        window.console && window.console.log && window.console.log('Dashboard (window): assessment-progress from localStorage:', localProgress);
      } catch (err) {
        console.error('Dashboard: Error parsing assessment-progress from localStorage:', err);
        window.console && window.console.error && window.console.error('Dashboard (window): Error parsing assessment-progress from localStorage:', err);
        localProgress = {};
      }

      // Calculate user statistics
      console.log('Dashboard: Calculating user stats...');
      const userStats = await calculateUserStats(user.id);
      console.log('Dashboard: User stats calculated:', userStats);

      // Format data for dashboard components
      console.log('Dashboard: Formatting data for dashboard...');
      const formattedStats = formatStatsForDashboard(userStats);
      const formattedAssessments = await formatAssessmentHistory(userStats);
      const formattedProgress = await calculateUserProgress(userStats);

      // Fallback if API history is empty
      if (!formattedAssessments || formattedAssessments.length === 0) {
        console.warn('Dashboard: No assessment history found, using localStorage fallback');
        setAssessmentData(localHistory);
      } else {
        setAssessmentData(formattedAssessments);
      }

      // Fallback if formattedProgress is empty
      if (!formattedProgress || Object.keys(formattedProgress).length === 0) {
        console.warn('Dashboard: No progress data found, using localStorage fallback');
        setProgressData(Array.isArray(localProgress) ? localProgress : []);
      } else {
        setProgressData(formattedProgress);
      }

      setStatsData(formattedStats);

      // Fetch latest assessment result for Ocean scores
      try {
        console.log('Dashboard: Fetching latest assessment for Ocean scores...');
        const latestAssessment = await getLatestAssessmentResult(user.id);
        if (latestAssessment && latestAssessment.assessment_data) {
          if (latestAssessment.assessment_data.ocean) {
            console.log('Dashboard: Found Ocean scores from latest assessment:', latestAssessment.assessment_data.ocean);
            setOceanScores(latestAssessment.assessment_data.ocean);
          } else {
            console.log('Dashboard: No Ocean scores found in latest assessment, using defaults');
            setOceanScores(undefined); // Will use defaults in WorldMapCard
          }

          if (latestAssessment.assessment_data.viaIs) {
            console.log('Dashboard: Found VIAIS scores from latest assessment:', latestAssessment.assessment_data.viaIs);
            setViaScores(latestAssessment.assessment_data.viaIs);
          } else {
            console.log('Dashboard: No VIAIS scores found in latest assessment, using defaults');
            setViaScores(undefined); // Will use defaults in WorldMapCard
          }
        } else {
          console.log('Dashboard: No assessment data found, using defaults');
          setOceanScores(undefined);
          setViaScores(undefined);
        }
      } catch (oceanError) {
        console.error('Dashboard: Error fetching assessment scores:', oceanError);
        setOceanScores(undefined); // Will use defaults in WorldMapCard
        setViaScores(undefined); // Will use defaults in WorldMapCard
      }

      console.log('Dashboard: Data formatted successfully');
      console.log('Stats:', formattedStats);
      console.log('Assessments:', formattedAssessments);
      console.log('Progress:', formattedProgress);
    } catch (error) {
      console.error('Dashboard: Error loading user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');

      // Set default data on error
      setStatsData([
        { id: "analysis", value: 0, label: "Total Analysis", color: "#dbeafe", icon: "MagnifyingGlass.svg" },
        { id: "completed", value: 0, label: "Completed", color: "#dbfce7", icon: "Check.svg" },
        { id: "processing", value: 0, label: "Processing", color: "#dbeafe", icon: "Cpu.svg" },
        { id: "balance", value: 10, label: "Token Balance", color: "#f3e8ff", icon: "Command.svg" }
      ]);
      setAssessmentData([]);
      setProgressData([
        { label: "Investigative", value: 0 },
        { label: "Arts", value: 0 },
        { label: "Practical", value: 0 },
        { label: "Social", value: 0 },
        { label: "Leadership", value: 0 },
        { label: "Analytical", value: 0 },
      ]);
      setOceanScores(undefined); // Will use defaults in WorldMapCard
      setViaScores(undefined); // Will use defaults in WorldMapCard
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh assessment data function
  const refreshAssessmentData = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      console.log('Dashboard: Refreshing assessment data...');
      const userStats = await calculateUserStats(user.id);
      const formattedAssessments = await formatAssessmentHistory(userStats);
      setAssessmentData(formattedAssessments || []);
      console.log('Dashboard: Assessment data refreshed successfully');
    } catch (error) {
      console.error('Dashboard: Error refreshing assessment data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load user data on component mount and when user changes
  useEffect(() => {
    console.log('Dashboard: useEffect triggered, user:', user, 'authLoading:', authLoading);
    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading, loadUserData]);

  // Refresh data when window gains focus (user returns from assessment)
  // Only refresh if user was away for more than 30 seconds to prevent unnecessary refreshes
  useEffect(() => {
    let lastFocusTime = Date.now();
    let focusTimeout: NodeJS.Timeout;

    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime;

      console.log('Dashboard: Window focus detected, time since last focus:', timeSinceLastFocus + 'ms');

      // Only refresh if auto-refresh is enabled and user was away for more than 30 seconds
      // This prevents refresh when just clicking outside briefly
      if (autoRefreshEnabled && timeSinceLastFocus > 30000 && !authLoading && user) {
        console.log('Dashboard: User was away for more than 30 seconds, reloading data');
        loadUserData();
      } else if (!autoRefreshEnabled) {
        console.log('Dashboard: Auto-refresh is disabled, skipping refresh');
      } else {
        console.log('Dashboard: User was away for less than 30 seconds, skipping refresh');
      }

      lastFocusTime = now;
    };

    const handleBlur = () => {
      lastFocusTime = Date.now();
      console.log('Dashboard: Window blur detected at:', lastFocusTime);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, [user, authLoading, loadUserData, autoRefreshEnabled]);

  // Save auto-refresh preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-auto-refresh', JSON.stringify(autoRefreshEnabled));
      console.log('Dashboard: Auto-refresh preference saved:', autoRefreshEnabled);
    }
  }, [autoRefreshEnabled]);





  // Get user's display name
  const getUserDisplayName = () => {
    if (user?.username) {
      return user.username;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      // Extract name from email (before @)
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    return 'User';
  };

  // Show authentication loading
  if (authLoading) {
    console.log('Dashboard: Auth loading...');
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('Dashboard: Error state:', error);
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Dashboard Error
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                loadUserData();
              }}
              className="bg-[#6475e9] text-white px-4 py-2 rounded-lg hover:bg-[#5a6bd8] mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    console.log('Dashboard: Data loading...');
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-6 flex items-center justify-center">
        <div className="max-w-[88rem] mx-auto space-y-6 w-full" style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}>
          {/* Header */}
          <Header
            title={`Welcome, ${getUserDisplayName()}!`}
            description="Loading your personalized dashboard..."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards Loading */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            {/* Right Sidebar Loading */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Dashboard: Rendering main dashboard content');
  console.log('Stats data:', statsData);
  console.log('Assessment data:', assessmentData);
  console.log('Progress data:', progressData);

  // Fallback simple dashboard if components fail to load
  try {
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-6 flex items-center justify-center">
        <div className="max-w-[88rem] mx-auto space-y-6 w-full" style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}>
          {/* Header */}
          <Header
            title={`Welcome, ${getUserDisplayName()}!`}
            description="Track your progress here, You almost reach your goal."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statsData.map((stat) => (
                  <StatsCard key={stat.id} stat={stat} />
                ))}
              </div>

              {/* Assessment History */}
              <AssessmentTable
                data={assessmentData}
                onRefresh={refreshAssessmentData}
              />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              <VIAISCard
                viaScores={viaScores}
              />

              <OceanCard
                oceanScores={oceanScores}
              />

              <ProgressCard
                title="RIASEC"
                description="Know where you can grow and contribute the most."
                data={progressData}
              />
            </div>
          </div>
        </div>
      </div>
    )
  } catch (componentError) {
    console.error('Dashboard: Component render error:', componentError);

    // Simple fallback dashboard
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Dashboard
            </h1>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {getUserDisplayName()}!</h2>
              <p className="text-gray-600">Your dashboard is loading. Some components may not be available.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statsData.map((stat) => (
                <div key={stat.id} className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/assessment'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Start Assessment
              </button>
              <button
                onClick={() => window.location.href = '/results'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// Main Dashboard Component with Error Boundary
export default function Dashboard() {
  console.log('Dashboard: Main component rendering');

  try {
    return (
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('Dashboard: Critical error:', error);

    // Ultimate fallback
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
            <p className="text-gray-600 mb-4">
              Dashboard is loading. If this persists, please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }
}

