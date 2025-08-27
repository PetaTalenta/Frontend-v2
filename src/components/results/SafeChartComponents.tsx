'use client';

import React from 'react';
import { Card } from '../ui/card';
import { AssessmentScores } from '../../types/assessment-results';
// Static imports to avoid webpack dynamic import issues
import AssessmentRadarChart from './AssessmentRadarChart';
import CareerStatsCard from './CareerStatsCard';
import SimpleAssessmentChart from './SimpleAssessmentChart';

/**
 * Safe wrapper for AssessmentRadarChart with comprehensive error handling
 */
export const SafeAssessmentRadarChart = ({ scores }: { scores: AssessmentScores }) => {
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
    return <SimpleAssessmentChart scores={scores} />;
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
    console.error('Error rendering AssessmentRadarChart, falling back to SimpleChart:', error);
    setHasError(true);
    return <SimpleAssessmentChart scores={scores} />;
  }
};

/**
 * Safe wrapper for CareerStatsCard with comprehensive error handling
 */
export const SafeCareerStatsCard = ({ scores }: { scores: AssessmentScores }) => {
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
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
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
            <p>Stats tidak dapat dimuat. Silakan refresh halaman.</p>
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
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </Card>
      }>
        <CareerStatsCard scores={scores} />
      </React.Suspense>
    );
  } catch (error) {
    console.error('Error rendering CareerStatsCard:', error);
    setHasError(true);
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Stats tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
  }
};

/**
 * Generic safe chart wrapper for any chart component
 */
export const SafeChartWrapper = ({ 
  children, 
  fallback,
  errorMessage = "Chart tidak dapat dimuat. Silakan refresh halaman."
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorMessage?: string;
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return fallback || (
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
            <p>{errorMessage}</p>
          </div>
        </div>
      </Card>
    );
  }

  try {
    return (
      <React.Suspense fallback={fallback || (
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      )}>
        {children}
      </React.Suspense>
    );
  } catch (error) {
    console.error('Error rendering chart component:', error);
    setHasError(true);
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>{errorMessage}</p>
          </div>
        </div>
      </Card>
    );
  }
};

/**
 * Error boundary component for chart components
 */
export class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Chart Error Boundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <div className="p-6">
            <div className="text-center text-gray-500">
              <p>Chart tidak dapat dimuat. Silakan refresh halaman.</p>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
