import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { useCallback, useEffect, useState } from 'react';
import { indexedDBCache, cacheUtils } from '../lib/cache/indexeddb-cache';

interface CachedSWROptions extends SWRConfiguration {
  // Cache-specific options
  cacheKey?: string;
  cacheTTL?: number;
  cacheVersion?: string;
  cacheTags?: string[];
  
  // Fallback options
  useCacheAsFallback?: boolean;
  cacheFirst?: boolean;
  
  // Background sync options
  backgroundSync?: boolean;
  syncInterval?: number;
}

// Enhanced SWR hook with IndexedDB caching
export function useCachedSWR<T>(
  key: string | null,
  fetcher: ((key: string) => Promise<T>) | null,
  options: CachedSWROptions = {}
): SWRResponse<T, any> & {
  cacheStats: {
    isFromCache: boolean;
    cacheAge: number | null;
    lastSync: number | null;
  };
} {
  const {
    cacheKey,
    cacheTTL = 30 * 60 * 1000, // 30 minutes default
    cacheVersion = '1.0.0',
    cacheTags = [],
    useCacheAsFallback = true,
    cacheFirst = false,
    backgroundSync = true,
    syncInterval = 5 * 60 * 1000, // 5 minutes
    ...swrOptions
  } = options;

  const finalCacheKey = cacheKey || key;
  
  // Enhanced fetcher that integrates with IndexedDB using stale-while-revalidate pattern
  const cachedFetcher = useCallback(async (fetchKey: string): Promise<T> => {
    if (!fetcher) throw new Error('No fetcher provided');

    const cacheKeyForData = `swr:${finalCacheKey || fetchKey}`;

    // Use IndexedDB's built-in stale-while-revalidate pattern
    try {
      return await indexedDBCache.getWithSWR<T>(
        cacheKeyForData,
        () => fetcher(fetchKey),
        {
          ttl: cacheTTL,
          tags: ['swr', ...cacheTags],
          version: cacheVersion,
          staleWhileRevalidate: cacheFirst ? 60 * 60 * 1000 : 0, // 1 hour if cacheFirst
          backgroundRefresh: backgroundSync
        }
      );
    } catch (error) {
      // If fetch fails and useCacheAsFallback is enabled, try cache
      if (useCacheAsFallback) {
        const cachedData = await indexedDBCache.get<T>(cacheKeyForData);
        if (cachedData !== null) {
          console.warn('[useCachedSWR] Using cached data as fallback due to fetch error:', error);
          return cachedData;
        }
      }
      throw error;
    }
  }, [fetcher, finalCacheKey, cacheTTL, cacheTags, cacheVersion, cacheFirst, backgroundSync, useCacheAsFallback]);

  // Use SWR with our cached fetcher
  const swrResponse = useSWR<T>(key, cachedFetcher, {
    ...swrOptions,
    // Override some options for better caching behavior
    revalidateOnFocus: swrOptions.revalidateOnFocus ?? false,
    revalidateOnReconnect: swrOptions.revalidateOnReconnect ?? true,
    dedupingInterval: swrOptions.dedupingInterval ?? 60000, // 1 minute
  });

  // Cache statistics
  const [cacheStats, setCacheStats] = useState({
    isFromCache: false,
    cacheAge: null as number | null,
    lastSync: null as number | null
  });

  // Update cache stats when data changes
  useEffect(() => {
    if (!finalCacheKey) return;

    const updateCacheStats = async () => {
      try {
        const cacheKeyForData = `swr:${finalCacheKey}`;
        // Check if data exists in cache
        const hasCache = await indexedDBCache.has(cacheKeyForData);

        setCacheStats({
          isFromCache: hasCache,
          cacheAge: hasCache ? Date.now() : null,
          lastSync: hasCache ? Date.now() : null
        });
      } catch (error) {
        console.warn('[useCachedSWR] Failed to get cache stats:', error);
      }
    };

    updateCacheStats();
  }, [finalCacheKey, swrResponse.data]);

  // Background sync interval
  useEffect(() => {
    if (!backgroundSync || !key || !fetcher || syncInterval <= 0) return;

    const interval = setInterval(() => {
      // Only sync if we have data and it's not currently loading
      if (swrResponse.data && !swrResponse.isLoading) {
        swrResponse.mutate();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [backgroundSync, key, fetcher, syncInterval, swrResponse]);

  return {
    ...swrResponse,
    cacheStats
  };
}

// Specialized hooks for common use cases
export function useCachedAPIData<T>(
  url: string | null,
  options: CachedSWROptions = {}
) {
  const fetcher = useCallback(async (url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, []);

  return useCachedSWR<T>(url, url ? fetcher : null, {
    cacheTTL: 10 * 60 * 1000, // 10 minutes for API data
    cacheTags: ['api'],
    useCacheAsFallback: true,
    cacheFirst: true,
    backgroundSync: true,
    ...options
  });
}

export function useCachedUserData<T>(
  userId: string | null,
  endpoint: string,
  options: CachedSWROptions = {}
) {
  const key = userId ? `${endpoint}?userId=${userId}` : null;
  
  const fetcher = useCallback(async (key: string): Promise<T> => {
    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, []);

  return useCachedSWR<T>(key, key ? fetcher : null, {
    cacheTTL: 15 * 60 * 1000, // 15 minutes for user data
    cacheTags: ['user', userId || ''],
    useCacheAsFallback: true,
    cacheFirst: true,
    backgroundSync: true,
    ...options
  });
}

export function useCachedAssessmentData<T>(
  assessmentId: string | null,
  options: CachedSWROptions = {}
) {
  const key = assessmentId ? `/api/assessment/archive/${assessmentId}` : null;
  
  const fetcher = useCallback(async (key: string): Promise<T> => {
    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, []);

  return useCachedSWR<T>(key, key ? fetcher : null, {
    cacheTTL: 60 * 60 * 1000, // 1 hour for assessment data
    cacheTags: ['assessment', assessmentId || ''],
    useCacheAsFallback: true,
    cacheFirst: true,
    backgroundSync: false, // Assessment data doesn't change often
    ...options
  });
}

// Cache management utilities
export const cacheManager = {
  // Clear all SWR cache
  async clearSWRCache(): Promise<void> {
    await indexedDBCache.deleteByTags(['swr']);
  },

  // Clear user-specific cache
  async clearUserCache(userId: string): Promise<void> {
    await cacheUtils.clearUserCache(userId);
  },

  // Clear API cache
  async clearAPICache(): Promise<void> {
    await cacheUtils.clearAPICache();
  },

  // Get cache statistics
  async getCacheStats() {
    return indexedDBCache.getStats();
  },

  // Cleanup expired entries
  async cleanup(): Promise<number> {
    return indexedDBCache.cleanup();
  }
};
