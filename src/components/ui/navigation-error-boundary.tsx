'use client';

import React from 'react';
import { Card, CardContent } from './card';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface NavigationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface NavigationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class NavigationErrorBoundary extends React.Component<NavigationErrorBoundaryProps, NavigationErrorBoundaryState> {
  constructor(props: NavigationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): NavigationErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error Boundary caught an error:', error, errorInfo);
    
    // Log specific webpack/navigation errors
    if (error.message.includes('call') || error.message.includes('webpack')) {
      console.error('Webpack module loading error detected:', error);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultNavigationErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default fallback component for navigation errors
function DefaultNavigationErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  const isWebpackError = error.message.includes('call') || error.message.includes('webpack');
  
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center">
        <Card className="bg-white border-red-200 shadow-sm">
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {isWebpackError ? 'Loading Error' : 'Navigation Error'}
                </h1>
                <p className="text-gray-600 mb-4">
                  {isWebpackError 
                    ? 'There was an error loading the page components. This is usually a temporary issue.'
                    : 'There was an error navigating to this page. Please try again.'
                  }
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-left bg-gray-50 p-3 rounded text-xs mb-4">
                    <summary className="cursor-pointer font-medium">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
                  </details>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={resetError}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// HOC to wrap components with navigation error boundary
export function withNavigationErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const WrappedComponent = (props: T) => (
    <NavigationErrorBoundary fallback={fallback}>
      <Component {...props} />
    </NavigationErrorBoundary>
  );
  
  WrappedComponent.displayName = `withNavigationErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook to handle navigation errors programmatically
export function useNavigationErrorHandler() {
  const handleNavigationError = React.useCallback((error: Error, context?: string) => {
    console.error(`Navigation error${context ? ` in ${context}` : ''}:`, error);
    
    // You can add custom error reporting here
    // For example, send to analytics or error tracking service
    
    return {
      isWebpackError: error?.message?.includes('call') || error?.message?.includes('webpack') || false,
      shouldRetry: !error?.message?.includes('404'),
      userMessage: error?.message?.includes('call')
        ? 'There was an error loading the page. Please try refreshing.'
        : 'Navigation failed. Please try again.'
    };
  }, []);

  return { handleNavigationError };
}
