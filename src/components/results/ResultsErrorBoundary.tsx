'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AlertCircle, RefreshCw, Home, Wifi, WifiOff, Database, Shield } from 'lucide-react';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void;
  }
}

// Enhanced error categorization
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  RENDERING = 'rendering',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export interface CategorizedError {
  category: ErrorCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRecoverable: boolean;
  suggestedAction: string;
  technicalDetails: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, categorizedError?: CategorizedError) => void;
  enableOfflineFallback?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableErrorReporting?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  categorizedError: CategorizedError | null;
  isOnline: boolean;
  isRetrying: boolean;
  recoveryAttempts: number;
  lastErrorTime: number;
}

class ResultsErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private recoveryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    
    // Use props values or defaults
    this.maxRetries = props.maxRetries || 3;
    this.retryDelay = props.retryDelay || 1000;
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      categorizedError: null,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      isRetrying: false,
      recoveryAttempts: 0,
      lastErrorTime: 0,
    };

    // Setup online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatusChange);
      window.addEventListener('offline', this.handleOnlineStatusChange);
    }
  }

  componentDidMount() {
    // Check initial online status
    this.checkOnlineStatus();
  }

  componentWillUnmount() {
    // Cleanup event listeners and timeouts
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineStatusChange);
      window.removeEventListener('offline', this.handleOnlineStatusChange);
    }
    
    this.recoveryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private checkOnlineStatus = () => {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    this.setState({ isOnline });
  };

  private handleOnlineStatusChange = () => {
    this.checkOnlineStatus();
    
    // If we come back online and there was an error, try to recover
    if (this.state.hasError && this.state.categorizedError?.category === ErrorCategory.NETWORK) {
      this.attemptAutomaticRecovery();
    }
  };

  private attemptAutomaticRecovery = async () => {
    if (this.state.isRetrying) return;
    
    this.setState({ isRetrying: true });
    
    try {
      // Wait a bit to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to reset and retry
      this.handleReset();
    } catch (error) {
      console.warn('Automatic recovery failed:', error);
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  // Enhanced error categorization
  private categorizeError = (error: Error): CategorizedError => {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    // Network errors
    if (errorMessage.includes('network error') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
      return {
        category: ErrorCategory.NETWORK,
        severity: 'medium',
        isRecoverable: true,
        suggestedAction: 'Periksa koneksi internet Anda dan coba lagi.',
        technicalDetails: `Network Error: ${error.message}`
      };
    }

    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        severity: 'high',
        isRecoverable: true,
        suggestedAction: 'Silakan login kembali untuk melanjutkan.',
        technicalDetails: `Authentication Error: ${error.message}`
      };
    }

    // Permission errors
    if (errorMessage.includes('403') || errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
      return {
        category: ErrorCategory.PERMISSION,
        severity: 'high',
        isRecoverable: false,
        suggestedAction: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
        technicalDetails: `Permission Error: ${error.message}`
      };
    }

    // Not found errors
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return {
        category: ErrorCategory.SERVER,
        severity: 'medium',
        isRecoverable: false,
        suggestedAction: 'Halaman atau data tidak ditemukan.',
        technicalDetails: `Not Found Error: ${error.message}`
      };
    }

    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
      return {
        category: ErrorCategory.SERVER,
        severity: 'high',
        isRecoverable: true,
        suggestedAction: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
        technicalDetails: `Server Error: ${error.message}`
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('schema')) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: 'medium',
        isRecoverable: true,
        suggestedAction: 'Data yang dimasukkan tidak valid. Silakan periksa kembali.',
        technicalDetails: `Validation Error: ${error.message}`
      };
    }

    // Rendering errors
    if (errorStack.includes('react') || errorStack.includes('component') || errorStack.includes('render')) {
      return {
        category: ErrorCategory.RENDERING,
        severity: 'high',
        isRecoverable: true,
        suggestedAction: 'Terjadi kesalahan saat menampilkan halaman. Silakan refresh.',
        technicalDetails: `Rendering Error: ${error.message}`
      };
    }

    // Unknown errors
    return {
      category: ErrorCategory.UNKNOWN,
      severity: 'medium',
      isRecoverable: true,
      suggestedAction: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
      technicalDetails: `Unknown Error: ${error.message}`
    };
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const categorizedError = this.categorizeError(error);
    
    this.setState({
      error,
      errorInfo,
      categorizedError,
      lastErrorTime: Date.now(),
    });

    // Log error for monitoring
    console.error('ResultsErrorBoundary caught an error:', error, errorInfo, categorizedError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, categorizedError);
    }

    // Report to error monitoring service (if available)
    this.reportError(error, errorInfo, categorizedError);

    // Attempt progressive recovery for recoverable errors
    if (categorizedError.isRecoverable && categorizedError.category !== ErrorCategory.PERMISSION) {
      this.scheduleProgressiveRecovery(categorizedError);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, categorizedError?: CategorizedError) => {
    try {
      // Send error to monitoring service
      if (typeof window !== 'undefined' && window.gtag && this.props.enableErrorReporting !== false) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: categorizedError?.severity === 'critical' || false,
          custom_map: {
            component_stack: errorInfo.componentStack,
            error_boundary: 'ResultsErrorBoundary',
            error_category: categorizedError?.category,
            error_severity: categorizedError?.severity,
            is_recoverable: categorizedError?.isRecoverable,
          },
        });
      }

      // Enhanced logging for development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 ResultsErrorBoundary Error Report');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Component Stack:', errorInfo.componentStack);
        if (categorizedError) {
          console.error('Categorized Error:', categorizedError);
        }
        console.groupEnd();
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private scheduleProgressiveRecovery = (categorizedError: CategorizedError) => {
    const { recoveryAttempts } = this.state;
    
    if (recoveryAttempts >= 3) return; // Max recovery attempts

    const delays = [2000, 5000, 10000]; // Progressive delays
    const delay = delays[Math.min(recoveryAttempts, delays.length - 1)];
    
    const timeout = setTimeout(() => {
      this.attemptProgressiveRecovery(categorizedError);
    }, delay);
    
    this.recoveryTimeouts.push(timeout);
  };

  private attemptProgressiveRecovery = async (categorizedError: CategorizedError) => {
    this.setState(prev => ({
      recoveryAttempts: prev.recoveryAttempts + 1,
      isRetrying: true
    }));

    try {
      switch (categorizedError.category) {
        case ErrorCategory.NETWORK:
          // Check if we're back online
          if (navigator.onLine) {
            this.handleReset();
          }
          break;
          
        case ErrorCategory.AUTHENTICATION:
          // Try to refresh token or redirect to login
          window.location.href = '/auth';
          break;
          
        case ErrorCategory.SERVER:
          // Wait and retry for server errors
          if (this.state.retryCount < this.maxRetries) {
            this.handleRetry();
          }
          break;
          
        case ErrorCategory.RENDERING:
          // Force a clean re-render
          this.handleReset();
          break;
          
        default:
          // Generic recovery attempt
          if (this.state.retryCount < this.maxRetries) {
            this.handleRetry();
          }
      }
    } catch (error) {
      console.warn('Progressive recovery failed:', error);
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });

      // Delay retry to prevent immediate re-occurrence
      setTimeout(() => {
        // Force re-render by triggering a state update
        this.setState({});
      }, this.retryDelay * (retryCount + 1)); // Exponential backoff
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  private getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages based on error type
    if (error.message.includes('Network Error')) {
      return 'Terjadi masalah koneksi. Silakan periksa koneksi internet Anda.';
    }
    
    if (error.message.includes('404')) {
      return 'Hasil assessment tidak ditemukan. Mungkin telah dihapus atau link tidak valid.';
    }
    
    if (error.message.includes('403') || error.message.includes('401')) {
      return 'Anda tidak memiliki akses ke hasil assessment ini. Silakan login kembali.';
    }
    
    if (error.message.includes('500')) {
      return 'Terjadi kesalahan pada server. Silakan coba lagi dalam beberapa saat.';
    }

    // Generic error message
    return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi support.';
  };

  private getErrorSuggestion = (error: Error): string => {
    if (error.message.includes('Network Error')) {
      return 'Periksa koneksi internet Anda dan refresh halaman.';
    }
    
    if (error.message.includes('404')) {
      return 'Kembali ke dashboard untuk melihat hasil assessment Anda yang tersedia.';
    }
    
    if (error.message.includes('403') || error.message.includes('401')) {
      return 'Login kembali dengan akun yang memiliki akses ke hasil assessment ini.';
    }
    
    if (error.message.includes('500')) {
      return 'Tunggu beberapa saat dan coba lagi. Jika masalah berlanjut, hubungi support.';
    }

    return 'Refresh halaman atau coba lagi nanti. Jika masalah berlanjut, hubungi support.';
  };

  render() {
    const { hasError, error, retryCount, categorizedError, isOnline, isRetrying, recoveryAttempts } = this.state;
    const { children, fallback, enableOfflineFallback } = this.props;

    // Offline fallback
    if (!isOnline && enableOfflineFallback !== false) {
      return (
        <div className="min-h-screen bg-[#f8fafc] p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white border-gray-200/60 shadow-sm">
              <div className="p-8">
                <div className="text-center space-y-6">
                  {/* Offline Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <WifiOff className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>

                  {/* Offline Title */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Tidak Ada Koneksi Internet
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
                    </p>
                  </div>

                  {/* Offline Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={this.handleReset}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Coba Koneksi Lagi
                    </Button>
                    
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="border-gray-200 w-full"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Kembali ke Dashboard
                    </Button>
                  </div>

                  {/* Offline Info */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 text-sm">
                      <strong>Info:</strong> Data yang tersimpan di perangkat Anda masih dapat diakses.
                      Koneksi akan otomatis pulih saat kembali online.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < this.maxRetries;
      const errorMessage = this.getErrorMessage(error);
      const errorSuggestion = this.getErrorSuggestion(error);
      const severityColor = categorizedError?.severity === 'critical' ? 'red' :
                          categorizedError?.severity === 'high' ? 'orange' :
                          categorizedError?.severity === 'medium' ? 'yellow' : 'blue';
      
      const categoryIcon = categorizedError?.category === ErrorCategory.NETWORK ? Wifi :
                         categorizedError?.category === ErrorCategory.AUTHENTICATION ? Shield :
                         categorizedError?.category === ErrorCategory.PERMISSION ? Shield :
                         categorizedError?.category === ErrorCategory.SERVER ? Database :
                         categorizedError?.category === ErrorCategory.RENDERING ? AlertCircle :
                         AlertCircle;

      return (
        <div className="min-h-screen bg-[#f8fafc] p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white border-gray-200/60 shadow-sm">
              <div className="p-8">
                <div className="text-center space-y-6">
                  {/* Error Icon with Category */}
                  <div className="flex justify-center">
                    <div className={`w-16 h-16 bg-${severityColor}-100 rounded-full flex items-center justify-center`}>
                      {React.createElement(categoryIcon, {
                        className: `w-8 h-8 text-${severityColor}-600`
                      })}
                    </div>
                  </div>

                  {/* Error Title with Category */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {categorizedError?.category === ErrorCategory.NETWORK && 'Kesalahan Koneksi'}
                      {categorizedError?.category === ErrorCategory.AUTHENTICATION && 'Kesalahan Autentikasi'}
                      {categorizedError?.category === ErrorCategory.PERMISSION && 'Kesalahan Izin Akses'}
                      {categorizedError?.category === ErrorCategory.SERVER && 'Kesalahan Server'}
                      {categorizedError?.category === ErrorCategory.RENDERING && 'Kesalahan Tampilan'}
                      {categorizedError?.category === ErrorCategory.VALIDATION && 'Kesalahan Validasi'}
                      {!categorizedError && 'Terjadi Kesalahan'}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {categorizedError?.suggestedAction || errorMessage}
                    </p>
                  </div>

                  {/* Error Category Badge */}
                  {categorizedError && (
                    <div className="flex justify-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${severityColor}-100 text-${severityColor}-800`}>
                        {categorizedError.category.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {categorizedError.severity.toUpperCase()}
                      </span>
                      {categorizedError.isRecoverable && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          DAPAT DIPULIHKAN
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recovery Status */}
                  {(isRetrying || recoveryAttempts > 0) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        {isRetrying && (
                          <>
                            <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                            Sedang mencoba memulihkan otomatis...
                          </>
                        )}
                        {!isRetrying && recoveryAttempts > 0 && (
                          <>
                            <Database className="w-4 h-4 inline mr-2" />
                            Percobaan pemulihan: {recoveryAttempts} dari 3
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Retry Information */}
                  {retryCount > 0 && (
                    <div className="text-sm text-gray-500">
                      Percobaan ulang: {retryCount} dari {this.maxRetries}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {canRetry && categorizedError?.isRecoverable && (
                      <Button
                        onClick={this.handleRetry}
                        disabled={isRetrying}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Mencoba...' : 'Coba Lagi'}
                      </Button>
                    )}
                   
                    <Button
                      onClick={this.handleReset}
                      variant="outline"
                      className="border-gray-200"
                    >
                      Reset Halaman
                    </Button>
                   
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="border-gray-200"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Kembali ke Dashboard
                    </Button>
                  </div>

                  {/* Enhanced Error Details (Development Only) */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="text-left mt-6">
                      <summary className="cursor-pointer text-sm font-mono text-gray-600 hover:text-gray-800">
                        Error Details (Development)
                      </summary>
                      <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
                        <div className="mb-2">
                          <strong>Error:</strong> {error.message}
                        </div>
                        <div className="mb-2">
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </div>
                        {categorizedError && (
                          <div className="mb-2">
                            <strong>Categorized Error:</strong>
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(categorizedError, null, 2)}
                            </pre>
                          </div>
                        )}
                        {this.state.errorInfo && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="whitespace-pre-wrap">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <strong>System Info:</strong>
                          <div>Online: {isOnline ? 'Yes' : 'No'}</div>
                          <div>Retrying: {isRetrying ? 'Yes' : 'No'}</div>
                          <div>Recovery Attempts: {recoveryAttempts}</div>
                          <div>Last Error: {new Date(this.state.lastErrorTime).toLocaleString()}</div>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ResultsErrorBoundary;