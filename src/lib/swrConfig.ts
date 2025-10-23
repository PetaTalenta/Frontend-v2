// Enhanced SWR Configuration for Phase 2 Implementation
import useSWR, { SWRConfig, SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import authService, { TokenManager } from '@/services/authService';
import { cacheManager } from '@/lib/cache';

// Enhanced fetcher with authentication and error handling
export const fetcher = async (url: string) => {
  // Check cache first for GET requests
  if (url.startsWith('http') && !url.includes('/api/auth/')) {
    const cachedData = cacheManager.get(url);
    if (cachedData) {
      return cachedData;
    }
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth token if available
      ...(authService.isAuthenticated() && {
        'Authorization': `Bearer ${TokenManager.getAccessToken()}`
      })
    }
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();

  // Cache successful responses (except auth endpoints)
  if (response.ok && !url.includes('/api/auth/')) {
    cacheManager.set(url, data, 5 * 60 * 1000); // 5 minutes TTL
  }

  return data;
};

// Enhanced fetcher for API calls with proper error handling
export const apiFetcher = async ([url, options]: [string, RequestInit?]) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if available
        ...(authService.isAuthenticated() && {
          'Authorization': `Bearer ${TokenManager.getAccessToken()}`
        }),
        ...options?.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || 'API request failed');
      (error as any).status = response.status;
      (error as any).info = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('API fetcher error:', error);
    throw error;
  }
};

// SWR configuration with enhanced features
export const swrConfig: SWRConfiguration = {
  fetcher,
  // Revalidation on focus
  revalidateOnFocus: true,
  // Revalidation on reconnect
  revalidateOnReconnect: true,
  // Refresh interval for different data types
  refreshInterval: (url) => {
    if (url.includes('/api/auth/profile')) return 10 * 60 * 1000; // 10 minutes
    if (url.includes('/api/archive/results')) return 30 * 60 * 1000; // 30 minutes
    if (url.includes('/api/auth/schools')) return 60 * 60 * 1000; // 1 hour
    return 5 * 60 * 1000; // 5 minutes default
  },
  // Error retry configuration
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Never retry on 404 or 401 errors
    if (error.status === 404 || error.status === 401) return;

    // Exponential backoff
    if (retryCount >= 10) return;

    // Retry after 5 seconds * retryCount
    setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 5000 * retryCount);
  },
  // Deduplication interval
  dedupingInterval: 2000,
  // Error handling
  onError: (error, key) => {
    console.error('SWR Error:', error, 'Key:', key);
    
    // Log out user on 401 errors
    if (error.status === 401) {
      authService.logout();
    }
  },
  // Loading states
  loadingTimeout: 10000, // 10 seconds
  onLoadingSlow: (key) => {
    console.warn('SWR Loading Slow:', key);
  },
  // Success handling
  onSuccess: (data, key) => {
    // Cache successful data
    if (typeof key === 'string') {
      cacheManager.set(key, data, 5 * 60 * 1000);
    }
  }
};

// Custom hook for API calls with SWR
export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  const { data, error, mutate, isLoading, isValidating } = useSWR<T>(
    url,
    apiFetcher,
    {
      ...swrConfig,
      ...config
    }
  );

  return {
    data,
    error,
    mutate,
    isLoading,
    isValidating,
    // Computed states
    isInitialLoading: isLoading && !data && !error,
    isError: !!error,
    isSuccess: !!data && !error
  };
}

// Custom hook for profile data with optimized caching
export function useProfile(config?: SWRConfiguration) {
  return useApi<any>('/api/auth/profile', {
    ...swrConfig,
    refreshInterval: 10 * 60 * 1000, // 10 minutes
    revalidateOnFocus: false, // Don't refetch on focus for profile
    ...config
  });
}

// Custom hook for assessment results with smart caching
export function useAssessmentResults(id: string | null, config?: SWRConfiguration) {
  return useApi<any>(id ? `/api/archive/results/${id}` : null, {
    ...swrConfig,
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    revalidateOnFocus: false, // Don't refetch assessment results on focus
    ...config
  });
}

// Custom hook for schools data with longer cache
export function useSchools(config?: SWRConfiguration) {
  return useApi<any[]>('/api/auth/schools', {
    ...swrConfig,
    refreshInterval: 60 * 60 * 1000, // 1 hour
    revalidateOnFocus: false, // Schools data rarely changes
    ...config
  });
}

// Custom hook for dashboard data with frequent updates
export function useDashboard(config?: SWRConfiguration) {
  return useApi<any>('/api/dashboard', {
    ...swrConfig,
    refreshInterval: 2 * 60 * 1000, // 2 minutes
    revalidateOnFocus: true,
    ...config
  });
}

// Hook for optimistic updates
export function useOptimisticMutation<T>(url: string) {
  const { mutate } = useSWR(url);

  const updateData = async (newData: T) => {
    // Optimistically update the local cache
    mutate(newData, false);

    try {
      // Make the API call
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getAccessToken()}`
        },
        body: JSON.stringify(newData)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const updatedData = await response.json();
      // Update with the real data
      mutate(updatedData, false);
      return updatedData;
    } catch (error) {
      // Revert to original data if update fails
      mutate();
      throw error;
    }
  };

  return { updateData };
}

// Hook for pagination with SWR
export function usePaginatedData<T>(
  baseUrl: string,
  page: number,
  pageSize: number = 10,
  config?: SWRConfiguration
) {
  const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
  
  return useApi<{
    data: T[];
    total: number;
    page: number;
    totalPages: number;
  }>(url, {
    ...swrConfig,
    revalidateOnFocus: false,
    ...config
  });
}

// Hook for infinite scroll with SWR
export function useInfiniteData<T>(
  getKey: (pageIndex: number, previousPageData: any) => string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite(
    getKey,
    apiFetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      ...config
    }
  );

  const flattenedData = data ? data.flat() : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isReachingEnd = data && data[data.length - 1]?.length === 0;

  return {
    data: flattenedData,
    error,
    isLoading,
    isLoadingMore,
    isValidating,
    isReachingEnd,
    mutate,
    size,
    setSize
  };
}

export { SWRConfig };