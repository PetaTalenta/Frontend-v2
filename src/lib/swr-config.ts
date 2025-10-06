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

// SWR global configuration - OPTIMIZED dengan smart retry strategy
export const swrConfig: SWRConfiguration = {
  fetcher,

  // Revalidation settings - OPTIMIZED
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,

  // Cache settings - OPTIMIZED untuk assessment platform
  dedupingInterval: 5000, // 5 seconds - assessment data doesn't change frequently
  focusThrottleInterval: 3000, // 3 seconds

  // Smart error retry strategy
  onErrorRetry: (error: any, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404 - resource doesn't exist
    if (error.status === 404) {
      console.log(`[SWR] Not retrying 404 for key: ${key}`);
      return;
    }

    // Don't retry on auth errors - need re-login
    if (error.status === 401 || error.status === 403) {
      console.log(`[SWR] Not retrying auth error (${error.status}) for key: ${key}`);
      return;
    }

    // Max 3 retries
    if (retryCount >= 3) {
      console.log(`[SWR] Max retries reached for key: ${key}`);
      return;
    }

    // Exponential backoff with max 10 seconds
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    console.log(`[SWR] Retrying in ${retryDelay}ms (attempt ${retryCount + 1}) for key: ${key}`);

    setTimeout(() => revalidate({ retryCount }), retryDelay);
  },

  // Loading timeout - OPTIMIZED
  loadingTimeout: 8000, // 8 seconds

  // Fallback data
  fallbackData: undefined,

  // Keep previous data while loading new data
  keepPreviousData: true,

  // Should retry on error (controlled by onErrorRetry)
  shouldRetryOnError: true,

  // Custom error handler
  onError: (error, key) => {
    // Only log non-404 errors
    if (error?.status !== 404) {
      console.error('[SWR] Error:', error.message || error, 'Key:', key);
      // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
    }
  },

  // Success handler
  onSuccess: (data, key, config) => {
    // Optional: Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[SWR] Success:', key);
    }
  },

  // Loading state handler
  onLoadingSlow: (key, config) => {
    console.warn('[SWR] Loading slow for key:', key);
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

// ===== SPECIALIZED CACHE CONFIGURATIONS =====

/**
 * Config untuk data yang jarang berubah (static content)
 */
export const staticDataConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60000,           // 1 menit deduping
  errorRetryCount: 1,                // Minimal retry untuk static data
};

/**
 * Config untuk data real-time (chat, notifications)
 */
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000,            // Refresh setiap 30 detik
  revalidateOnFocus: true,           // Revalidate saat focus
  revalidateOnReconnect: true,
  dedupingInterval: 1000,            // 1 detik deduping untuk real-time
  errorRetryCount: 5,                // Lebih banyak retry untuk real-time
};

/**
 * Config untuk data user-specific (dashboard, profile)
 */
export const userDataConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true,           // Revalidate saat user kembali ke tab
  refreshInterval: 300000,           // Refresh setiap 5 menit
  dedupingInterval: 5000,            // 5 detik deduping
};

/**
 * Config untuk data yang expensive (analytics, reports)
 */
export const expensiveDataConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 300000,          // 5 menit deduping
  errorRetryCount: 1,                // Minimal retry untuk expensive data
  loadingTimeout: 30000,             // 30 detik timeout
};

/**
 * Config untuk assessment results (immutable data)
 * Results don't change once created, so aggressive caching
 */
export const assessmentResultsConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 30000,           // 30 seconds - results don't change
  revalidateIfStale: false,          // Don't revalidate stale data
  revalidateOnMount: false,          // Don't revalidate on mount
  revalidateOnFocus: false,
  revalidateOnReconnect: false,

  // Custom comparison untuk assessment results
  compare: (a: any, b: any) => {
    // If both have resultId, compare by ID
    if (a?.resultId && b?.resultId) {
      return a.resultId === b.resultId;
    }
    return a === b;
  },
};

/**
 * Config untuk live data (token balance, notifications)
 * Needs frequent updates
 */
export const liveDataConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 1000,            // 1 second for live data
  refreshInterval: 5000,             // Auto-refresh every 5 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};
