'use client';

import React from 'react';
import { Card, CardContent } from './ui-card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultChartErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default fallback component for chart errors
function DefaultChartErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  return (
    <Card className="bg-white border-red-200 shadow-sm">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Chart Gagal Dimuat
            </h3>
            <p className="text-red-700 mb-4">
              Terjadi kesalahan saat memuat chart. Silakan coba refresh halaman atau coba lagi nanti.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-50 p-3 rounded text-sm mb-4">
                <summary className="cursor-pointer font-medium">Detail Error (Development)</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {error.message}
                  {error.stack && '\n\nStack trace:\n' + error.stack}
                </pre>
              </details>
            )}
            
            <button
              onClick={resetError}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// HOC to wrap components with chart error boundary
export function withChartErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const WrappedComponent = (props: T) => (
    <ChartErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ChartErrorBoundary>
  );
  
  WrappedComponent.displayName = `withChartErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specific error fallback for radar charts
export function RadarChartErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  return (
    <Card className="bg-white border-amber-200 shadow-sm">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Radar Chart Tidak Tersedia
            </h3>
            <p className="text-amber-700 mb-4">
              Chart radar sedang tidak dapat ditampilkan. Data assessment Anda tetap tersimpan dengan aman.
            </p>
            
            <button
              onClick={resetError}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Chart
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}