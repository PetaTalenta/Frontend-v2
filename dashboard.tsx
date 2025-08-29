"use client"

// Update the imports to use the new components and data
import { Header } from "./components/dashboard/header"
import { StatsCard } from "./components/dashboard/stats-card"
import { AssessmentTable } from "./components/dashboard/assessment-table"
import { VIAISCard } from "./components/dashboard/viais-card"
import { OceanCard } from "./components/dashboard/ocean-card"
import { AssessmentStatusIndicator } from "./components/dashboard/AssessmentStatusIndicator"

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
        <div className="dashboard-full-height flex items-center justify-center">
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
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashboard-auto-refresh');
        return saved !== null ? JSON.parse(saved) : true;
      }
      return true;
    });

    const getUserDisplayName = () => {
      if (user?.username) {
        return user.username;
      }
      if (user?.name) {
        return user.name;
      }
      if (user?.email) {
        return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
      }
      return 'User';
    };

    const loadUserData = useCallback(async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [userStats, latestAssessment] = await Promise.all([
          calculateUserStats(user.id),
          getLatestAssessmentResult(user.id).catch(() => null)
        ]);
        const [formattedStats, formattedAssessments, formattedProgress] = await Promise.all([
          formatStatsForDashboard(userStats),
          formatAssessmentHistory(userStats),
          calculateUserProgress(userStats)
        ]);
        setStatsData(formattedStats);
        setAssessmentData(formattedAssessments);
        setProgressData(formattedProgress);
        if (latestAssessment && latestAssessment.assessment_data) {
          setOceanScores(latestAssessment.assessment_data.ocean || undefined);
          setViaScores(latestAssessment.assessment_data.viaIs || undefined);
        } else {
          setOceanScores(undefined);
          setViaScores(undefined);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
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
        setOceanScores(undefined);
        setViaScores(undefined);
      } finally {
        setIsLoading(false);
      }
    }, [user]);

    const refreshAssessmentData = async () => {
      if (!user) return;
      setIsRefreshing(true);
      try {
        const userStats = await calculateUserStats(user.id);
        const formattedAssessments = await formatAssessmentHistory(userStats);
        setAssessmentData(formattedAssessments || []);
      } catch (error) {
        // error handling
      } finally {
        setIsRefreshing(false);
      }
    };

    useEffect(() => {
      if (!authLoading) {
        loadUserData();
      }
    }, [user, authLoading, loadUserData]);

    useEffect(() => {
      let lastFocusTime = Date.now();
      const handleFocus = () => {
        const now = Date.now();
        const timeSinceLastFocus = now - lastFocusTime;
        if (autoRefreshEnabled && timeSinceLastFocus > 3000 && !authLoading && user) {
          loadUserData();
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
    }, [user, authLoading, loadUserData, autoRefreshEnabled]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard-auto-refresh', JSON.stringify(autoRefreshEnabled));
      }
    }, [autoRefreshEnabled]);

    const handleManualRefresh = async () => {
      await refreshAssessmentData();
    };

    if (authLoading) {
      return (
        <div className="dashboard-full-height flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="dashboard-full-height flex items-center justify-center">
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
      <div className="dashboard-full-height flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
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

