'use client';

import React from 'react';
import { Card } from '../../components/ui/card';
import { ChartErrorBoundary } from '../../components/ui/chart-error-boundary';
// Static import to avoid webpack dynamic import issues
import AssessmentRadarChart from '../../components/results/AssessmentRadarChart';

// Test component that will fail to load
const FailingChart = () => {
  throw new Error('Simulated chart loading error');
};

// Safe wrapper for working chart
const SafeWorkingChart = ({ scores }: { scores: any }) => {
  const [isClient, setIsClient] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Chart tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
  }

  try {
    return (
      <React.Suspense fallback={
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      }>
        <AssessmentRadarChart scores={scores} />
      </React.Suspense>
    );
  } catch (error) {
    console.error('Error rendering AssessmentRadarChart:', error);
    setHasError(true);
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Chart tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
  }
};

// Mock assessment scores for testing
const mockScores = {
  riasec: {
    realistic: 75,
    investigative: 85,
    artistic: 60,
    social: 70,
    enterprising: 80,
    conventional: 65
  },
  ocean: {
    openness: 78,
    conscientiousness: 82,
    extraversion: 65,
    agreeableness: 75,
    neuroticism: 45
  },
  viaIs: {
    creativity: 80,
    curiosity: 85,
    judgment: 75,
    love_of_learning: 90,
    perspective: 70,
    bravery: 65,
    perseverance: 80,
    honesty: 85,
    zest: 70,
    love: 75,
    kindness: 80,
    social_intelligence: 75,
    teamwork: 85,
    fairness: 80,
    leadership: 70,
    forgiveness: 75,
    humility: 70,
    prudence: 75,
    self_regulation: 80,
    appreciation_of_beauty: 65,
    gratitude: 85,
    hope: 80,
    humor: 70,
    spirituality: 60
  }
};

export default function TestChartErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Chart Error Handling Test
          </h1>
          <p className="text-gray-600">
            This page tests the error handling for chart components. The first chart will fail to load and show an error boundary, 
            while the second chart should load successfully.
          </p>
        </div>

        <div className="space-y-8">
          {/* Test failing chart */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Failing Chart (Should Show Error Boundary)
            </h2>
            <ChartErrorBoundary>
              <FailingChart />
            </ChartErrorBoundary>
          </div>

          {/* Test working chart */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Working Chart (Should Load Successfully)
            </h2>
            <ChartErrorBoundary>
              <SafeWorkingChart scores={mockScores} />
            </ChartErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
