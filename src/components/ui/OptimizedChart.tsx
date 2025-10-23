'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';

interface ChartComponentProps {
  data: any;
  config?: any;
  className?: string;
}

// Fallback component untuk chart loading
const ChartSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Error fallback untuk chart
const ChartError = ({ 
  error, 
  className = '',
  onRetry 
}: { 
  error: string; 
  className?: string;
  onRetry?: () => void;
}) => (
  <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
    <div className="text-center">
      <div className="text-red-600 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">Chart Error</h3>
      <p className="text-red-700 text-sm mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

// Lazy loaded chart components
const LazyRadarChart = dynamic(
  () => import('../results/AssessmentRadarChart').then(mod => ({ default: mod.default })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

const LazyCareerStatsCard = dynamic(
  () => import('../results/CareerStatsCard').then(mod => ({ default: mod.default })),
  {
    loading: () => <ChartSkeleton />,
    ssr: true
  }
);

const LazySimpleAssessmentChart = dynamic(
  () => import('../results/SimpleAssessmentChart').then(mod => ({ default: mod.default })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

// Chart types
type ChartType = 'radar' | 'career-stats' | 'simple-assessment';

interface OptimizedChartProps {
  type: ChartType;
  data: any;
  config?: any;
  className?: string;
  lazy?: boolean;
  threshold?: number;
}

export default function OptimizedChart({
  type,
  data,
  config,
  className = '',
  lazy = true,
  threshold = 100
}: OptimizedChartProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isInView, setIsInView] = useState(!lazy);
  const chartRef = useRef<HTMLDivElement>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Intersection Observer untuk lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: threshold / 100 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, threshold, isInView]);

  const handleError = (error: Error) => {
    setHasError(true);
    setErrorMessage(error.message || 'Failed to load chart');
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setRetryKey(prev => prev + 1);
  };

  // Render chart based on type
  const renderChart = () => {
    const key = `${type}-${retryKey}`;
    
    switch (type) {
      case 'radar':
        return (
          <Suspense fallback={<ChartSkeleton className={className} />}>
            <LazyRadarChart 
              key={key}
              scores={data} 
              {...config}
            />
          </Suspense>
        );
      
      case 'career-stats':
        return (
          <Suspense fallback={<ChartSkeleton className={className} />}>
            <LazyCareerStatsCard 
              key={key}
              scores={data} 
              {...config}
            />
          </Suspense>
        );
      
      case 'simple-assessment':
        return (
          <Suspense fallback={<ChartSkeleton className={className} />}>
            <LazySimpleAssessmentChart 
              key={key}
              scores={data} 
              {...config}
            />
          </Suspense>
        );
      
      default:
        return (
          <ChartError 
            error={`Unknown chart type: ${type}`} 
            className={className}
          />
        );
    }
  };

  if (!isInView) {
    return (
      <div ref={chartRef} className={className}>
        <ChartSkeleton className={className} />
      </div>
    );
  }

  if (hasError) {
    return (
      <ChartError 
        error={errorMessage} 
        className={className}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className={className} ref={chartRef}>
      {renderChart()}
    </div>
  );
}

// Hook untuk lazy loading chart data
export function useLazyChartData<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, retry: loadData };
}