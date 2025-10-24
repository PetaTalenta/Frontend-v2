import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // trackError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      // Exponential backoff for retries
      const delay = this.retryDelay * Math.pow(2, retryCount);
      
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: retryCount + 1
        });
      }, delay);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="dashboard-full-height dashboard-responsive-wrapper">
          <div className="dashboard-container flex flex-col gap-6">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h2>
                
                <p className="text-gray-600 mb-6">
                  We encountered an unexpected error while loading your dashboard. 
                  {this.state.retryCount < this.maxRetries && 
                    ` You can retry (${this.maxRetries - this.state.retryCount} attempts left).`
                  }
                </p>

                <div className="flex gap-3 justify-center">
                  {this.state.retryCount < this.maxRetries && (
                    <Button onClick={this.handleRetry} variant="default">
                      Retry
                    </Button>
                  )}
                  
                  <Button onClick={this.handleReset} variant="outline">
                    Reset Dashboard
                  </Button>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo && (
                        <>
                          {'\n\n'}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;