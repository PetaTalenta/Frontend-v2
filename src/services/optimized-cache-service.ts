/**
 * Optimized Cache Service
 * Multi-level caching with background refresh for ultra-fast API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  isStale: boolean;
  backgroundRefreshPromise?: Promise<T>;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // Time to serve stale data while refreshing
  maxAge?: number; // Maximum age before forced refresh
  backgroundRefresh?: boolean; // Enable background refresh
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 30000, // 30 seconds
  staleWhileRevalidate: 60000, // 1 minute
  maxAge: 300000, // 5 minutes
  backgroundRefresh: true,
};

class OptimizedCacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private refreshCallbacks = new Map<string, () => Promise<any>>();
  private refreshTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Get data from cache with stale-while-revalidate pattern
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const now = Date.now();
    const entry = this.memoryCache.get(key);

    // Cache miss - fetch fresh data
    if (!entry) {
      console.log(`Cache MISS for key: ${key}`);
      const data = await this.fetchAndCache(key, fetcher, opts);
      return data;
    }

    // Cache hit - check if data is fresh
    if (now < entry.expiresAt && !entry.isStale) {
      console.log(`Cache HIT (fresh) for key: ${key}`);
      return entry.data;
    }

    // Data is stale but within stale-while-revalidate window
    if (now < entry.timestamp + opts.staleWhileRevalidate) {
      console.log(`Cache HIT (stale) for key: ${key}, triggering background refresh`);
      
      // Trigger background refresh if not already in progress
      if (opts.backgroundRefresh && !entry.backgroundRefreshPromise) {
        entry.backgroundRefreshPromise = this.backgroundRefresh(key, fetcher, opts);
      }
      
      return entry.data;
    }

    // Data is too old - force refresh
    console.log(`Cache EXPIRED for key: ${key}, forcing refresh`);
    const data = await this.fetchAndCache(key, fetcher, opts);
    return data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + opts.ttl,
      isStale: false,
    };

    this.memoryCache.set(key, entry);
    
    // Set up automatic background refresh
    if (opts.backgroundRefresh) {
      this.scheduleBackgroundRefresh(key, opts.ttl);
    }

    console.log(`Cache SET for key: ${key}, expires in ${opts.ttl}ms`);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.refreshCallbacks.delete(key);
    
    const timeout = this.refreshTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.refreshTimeouts.delete(key);
    }
    
    console.log(`Cache INVALIDATED for key: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();
    this.refreshCallbacks.clear();
    
    // Clear all timeouts
    for (const timeout of this.refreshTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.refreshTimeouts.clear();
    
    console.log('Cache CLEARED');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let fresh = 0;
    let stale = 0;
    let expired = 0;

    for (const entry of this.memoryCache.values()) {
      if (now < entry.expiresAt && !entry.isStale) {
        fresh++;
      } else if (entry.isStale) {
        stale++;
      } else {
        expired++;
      }
    }

    return {
      total: this.memoryCache.size,
      fresh,
      stale,
      expired,
      hitRate: fresh / this.memoryCache.size || 0,
    };
  }

  /**
   * Prefetch data for a key
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      await this.get(key, fetcher, options);
      console.log(`Cache PREFETCH completed for key: ${key}`);
    } catch (error) {
      console.error(`Cache PREFETCH failed for key: ${key}`, error);
    }
  }

  /**
   * Fetch data and update cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<CacheOptions>
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error(`Cache FETCH failed for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Background refresh of cache entry
   */
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<CacheOptions>
  ): Promise<T> {
    try {
      console.log(`Cache BACKGROUND REFRESH started for key: ${key}`);
      const data = await fetcher();
      
      // Update cache with fresh data
      this.set(key, data, options);
      
      // Clear the background refresh promise
      const entry = this.memoryCache.get(key);
      if (entry) {
        delete entry.backgroundRefreshPromise;
      }
      
      console.log(`Cache BACKGROUND REFRESH completed for key: ${key}`);
      return data;
    } catch (error) {
      console.error(`Cache BACKGROUND REFRESH failed for key: ${key}`, error);
      
      // Clear the background refresh promise on error
      const entry = this.memoryCache.get(key);
      if (entry) {
        delete entry.backgroundRefreshPromise;
      }
      
      throw error;
    }
  }

  /**
   * Schedule background refresh
   */
  private scheduleBackgroundRefresh(key: string, delay: number): void {
    // Clear existing timeout
    const existingTimeout = this.refreshTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new refresh
    const timeout = setTimeout(() => {
      const entry = this.memoryCache.get(key);
      if (entry) {
        entry.isStale = true;
        console.log(`Cache entry marked as STALE for key: ${key}`);
      }
      this.refreshTimeouts.delete(key);
    }, delay);

    this.refreshTimeouts.set(key, timeout);
  }
}

// Create singleton instance
const optimizedCache = new OptimizedCacheService();

export default optimizedCache;

// Export convenience functions
export const getCached = <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) =>
  optimizedCache.get(key, fetcher, options);

export const setCached = <T>(key: string, data: T, options?: CacheOptions) =>
  optimizedCache.set(key, data, options);

export const invalidateCache = (key: string) => optimizedCache.invalidate(key);

export const clearCache = () => optimizedCache.clear();

export const getCacheStats = () => optimizedCache.getStats();

export const prefetchData = <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) =>
  optimizedCache.prefetch(key, fetcher, options);
