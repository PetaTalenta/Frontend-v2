import { QueryClient } from '@tanstack/react-query';

// Error types for better error handling
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Enhanced error interface
export interface EnhancedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: Error | any;
  context?: Record<string, any>;
  timestamp: string;
  retryable: boolean;
  userFriendlyMessage: string;
}

// Error classification utility
export const classifyError = (error: any): EnhancedError => {
  const timestamp = new Date().toISOString();
  
  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: error?.message || 'Network connection failed',
      originalError: error,
      timestamp,
      retryable: true,
      userFriendlyMessage: 'Unable to connect to the server. Please check your internet connection.',
    };
  }

  // HTTP status errors
  if (error?.response) {
    const status = error.response.status;
    
    // Authentication errors
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Authentication failed',
        originalError: error,
        timestamp,
        retryable: false,
        userFriendlyMessage: 'Your session has expired. Please log in again.',
      };
    }

    // Authorization errors
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Access denied',
        originalError: error,
        timestamp,
        retryable: false,
        userFriendlyMessage: 'You don\'t have permission to access this resource.',
      };
    }

    // Client errors (4xx)
    if (status >= 400 && status < 500) {
      return {
        type: ErrorType.CLIENT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: `Client error: ${status}`,
        originalError: error,
        timestamp,
        retryable: false,
        userFriendlyMessage: 'Invalid request. Please check your input and try again.',
      };
    }

    // Server errors (5xx)
    if (status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        severity: ErrorSeverity.HIGH,
        message: `Server error: ${status}`,
        originalError: error,
        timestamp,
        retryable: true,
        userFriendlyMessage: 'Server is experiencing issues. Please try again later.',
      };
    }
  }

  // Timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Request timeout',
      originalError: error,
      timestamp,
      retryable: true,
      userFriendlyMessage: 'Request took too long. Please try again.',
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity.MEDIUM,
    message: error?.message || 'Unknown error occurred',
    originalError: error,
    timestamp,
    retryable: true,
    userFriendlyMessage: 'An unexpected error occurred. Please try again.',
  };
};

// Retry strategy with exponential backoff
export const createRetryStrategy = (
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000
) => {
  return (failureCount: number, error: any): boolean => {
    const enhancedError = classifyError(error);
    
    // Don't retry non-retryable errors
    if (!enhancedError.retryable) {
      return false;
    }
    
    // Don't exceed max retries
    return failureCount < maxRetries;
  };
};

// Retry delay with exponential backoff and jitter
export const createRetryDelay = (
  baseDelay: number = 1000,
  maxDelay: number = 30000
) => {
  return (attemptIndex: number): number => {
    // Exponential backoff with jitter to prevent thundering herd
    const exponentialDelay = baseDelay * Math.pow(2, attemptIndex);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = exponentialDelay + jitter;
    
    return Math.min(delay, maxDelay);
  };
};

// Error logging utility
export const logError = (error: EnhancedError, context?: Record<string, any>) => {
  const logData = {
    ...error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'Server',
  };

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Enhanced Error:', logData);
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, etc.
    // trackError(logData);
  }
};

// Error recovery strategies
export const errorRecoveryStrategies = {
  [ErrorType.NETWORK_ERROR]: async () => {
    // Wait for network to be available
    if (typeof window !== 'undefined' && navigator.onLine) {
      return true;
    }
    
    // Wait for online event
    return new Promise((resolve) => {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve(true);
      };
      
      window.addEventListener('online', handleOnline);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('online', handleOnline);
        resolve(false);
      }, 30000);
    });
  },

  [ErrorType.AUTHENTICATION_ERROR]: async () => {
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    return false;
  },

  [ErrorType.SERVER_ERROR]: async () => {
    // Wait a bit before retrying server errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    return true;
  },

  [ErrorType.TIMEOUT_ERROR]: async () => {
    // Increase timeout for next request
    return true;
  },
};

// Enhanced query configuration with error handling
export const createEnhancedQueryConfig = (
  queryKey: string[],
  queryFn: () => Promise<any>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    errorContext?: Record<string, any>;
  } = {}
) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    errorContext,
  } = options;

  return {
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        const enhancedError = classifyError(error);
        logError(enhancedError, { ...errorContext, queryKey });
        throw error;
      }
    },
    retry: createRetryStrategy(maxRetries, baseDelay, maxDelay),
    retryDelay: createRetryDelay(baseDelay, maxDelay),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  };
};

// Error boundary integration
export const handleComponentError = (
  error: Error,
  errorInfo: React.ErrorInfo,
  context?: Record<string, any>
) => {
  const enhancedError: EnhancedError = {
    type: ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity.HIGH,
    message: error.message,
    originalError: error,
    context: {
      ...context,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    },
    timestamp: new Date().toISOString(),
    retryable: false,
    userFriendlyMessage: 'A component error occurred. Please refresh the page.',
  };

  logError(enhancedError);
};

export default {
  classifyError,
  createRetryStrategy,
  createRetryDelay,
  logError,
  errorRecoveryStrategies,
  createEnhancedQueryConfig,
  handleComponentError,
  ErrorType,
  ErrorSeverity,
};