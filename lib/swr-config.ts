import { SWRConfiguration } from 'swr';

// Default fetcher function for SWR
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

// SWR global configuration - OPTIMIZED for faster response
export const swrConfig: SWRConfiguration = {
  fetcher,

  // Revalidation settings - OPTIMIZED
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,

  // Cache settings - OPTIMIZED for faster response
  dedupingInterval: 1000, // 1 second (reduced from 2s)
  focusThrottleInterval: 3000, // 3 seconds (reduced from 5s)

  // Error retry settings - OPTIMIZED for faster failure detection
  errorRetryCount: 2, // Reduced from 3 to 2
  errorRetryInterval: 2000, // 2 seconds (reduced from 5s)

  // Loading timeout - OPTIMIZED
  loadingTimeout: 8000, // 8 seconds (reduced from 10s)

  // Fallback data
  fallbackData: undefined,

  // Keep previous data while loading new data
  keepPreviousData: true,
  
  // Custom error handler
  onError: (error, key) => {
    console.error('SWR Error:', error, 'Key:', key);
    
    // Don't log 404 errors for user-specific data
    if (error.status !== 404) {
      // You can integrate with error reporting service here
      // e.g., Sentry, LogRocket, etc.
    }
  },
  
  // Success handler
  onSuccess: (data, key, config) => {
    // Optional: Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', key, data);
    }
  },
  
  // Loading state handler
  onLoadingSlow: (key, config) => {
    console.warn('SWR Loading Slow:', key);
  },
};

// Custom hooks for common patterns
export const useApiData = <T>(key: string | null, options?: SWRConfiguration) => {
  return useSWR<T>(key, fetcher, {
    ...swrConfig,
    ...options,
  });
};

// Hook for user-specific data with authentication
export const useUserData = <T>(key: string | null, token?: string, options?: SWRConfiguration) => {
  const fetcherWithAuth = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = new Error('An error occurred while fetching the data.');
      (error as any).info = await response.json();
      (error as any).status = response.status;
      throw error;
    }
    
    return response.json();
  };
  
  return useSWR<T>(
    token && key ? key : null, // Only fetch if token exists
    fetcherWithAuth,
    {
      ...swrConfig,
      ...options,
    }
  );
};

// Cache management utilities
export const swrCache = {
  // Clear all cache
  clearAll: () => {
    if (typeof window !== 'undefined') {
      // Clear SWR cache
      mutate(() => true, undefined, { revalidate: false });
    }
  },
  
  // Clear specific cache key
  clear: (key: string) => {
    if (typeof window !== 'undefined') {
      mutate(key, undefined, { revalidate: false });
    }
  },
  
  // Preload data
  preload: (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      mutate(key, data, { revalidate: false });
    }
  },
};

// Import useSWR and mutate for the hooks above
import useSWR, { mutate } from 'swr';
