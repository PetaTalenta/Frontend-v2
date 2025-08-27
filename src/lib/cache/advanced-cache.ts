'use client';

/**
 * ADVANCED CACHING SYSTEM UNTUK PETATALENTA
 * 
 * Multi-layer caching dengan TTL, compression, dan intelligent invalidation
 */

// ===== CACHE TYPES =====

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  tags?: string[];
  accessCount?: number;
  lastAccessed?: number;
}

interface CacheConfig {
  ttl: number;
  maxSize?: number;
  compress?: boolean;
  tags?: string[];
  persistent?: boolean;
}

// ===== CACHE LAYERS =====

class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, config: CacheConfig): void {
    // Evict old items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      compressed: config.compress,
      tags: config.tags,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access stats
    item.accessCount = (item.accessCount || 0) + 1;
    item.lastAccessed = Date.now();

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateByTag(tag: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags?.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if ((item.lastAccessed || 0) < oldestTime) {
        oldestTime = item.lastAccessed || 0;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate(): number {
    let totalAccess = 0;
    for (const item of this.cache.values()) {
      totalAccess += item.accessCount || 0;
    }
    return totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;
  }
}

class LocalStorageCache {
  private prefix: string;

  constructor(prefix = 'petatalenta_cache_') {
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, config: CacheConfig): void {
    if (typeof window === 'undefined') return;

    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
        tags: config.tags,
      };

      const serialized = JSON.stringify(item);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const serialized = localStorage.getItem(this.prefix + key);
      if (!serialized) return null;

      const item: CacheItem<T> = JSON.parse(serialized);
      
      // Check TTL
      if (Date.now() - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  invalidateByTag(tag: string): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            const item: CacheItem = JSON.parse(serialized);
            if (item.tags?.includes(tag)) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    });
  }
}

// ===== MAIN CACHE MANAGER =====

class CacheManager {
  private memoryCache: MemoryCache;
  private localStorageCache: LocalStorageCache;

  constructor() {
    this.memoryCache = new MemoryCache(500); // 500 items in memory
    this.localStorageCache = new LocalStorageCache();
  }

  async set<T>(
    key: string, 
    data: T, 
    config: CacheConfig = { ttl: 300000 } // 5 minutes default
  ): Promise<void> {
    // Always cache in memory for fast access
    this.memoryCache.set(key, data, config);

    // Cache in localStorage if persistent
    if (config.persistent) {
      this.localStorageCache.set(key, data, config);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    let data = this.memoryCache.get<T>(key);
    if (data !== null) {
      return data;
    }

    // Try localStorage cache
    data = this.localStorageCache.get<T>(key);
    if (data !== null) {
      // Restore to memory cache
      this.memoryCache.set(key, data, { ttl: 300000 });
      return data;
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.localStorageCache.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.localStorageCache.clear();
  }

  async invalidateByTag(tag: string): Promise<void> {
    this.memoryCache.invalidateByTag(tag);
    this.localStorageCache.invalidateByTag(tag);
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      localStorage: this.getLocalStorageStats(),
    };
  }

  private getLocalStorageStats() {
    if (typeof window === 'undefined') return { size: 0, usage: 0 };

    let size = 0;
    let usage = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('petatalenta_cache_')) {
          size++;
          usage += localStorage.getItem(key)?.length || 0;
        }
      });
    } catch (error) {
      // Ignore errors
    }

    return { size, usage };
  }
}

// ===== CACHE INSTANCE =====

export const cacheManager = new CacheManager();

// ===== CACHE UTILITIES =====

/**
 * Cache key generators
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  assessment: (assessmentId: string) => `assessment:${assessmentId}`,
  results: (resultId: string) => `results:${resultId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  stats: (type: string) => `stats:${type}`,
  profile: (userId: string) => `profile:${userId}`,
};

/**
 * Cache configurations untuk berbagai jenis data
 */
export const cacheConfigs = {
  // User data - cache 30 menit, persistent
  user: { ttl: 1800000, persistent: true, tags: ['user'] },
  
  // Assessment data - cache 1 jam, persistent
  assessment: { ttl: 3600000, persistent: true, tags: ['assessment'] },
  
  // Results - cache 2 jam, persistent
  results: { ttl: 7200000, persistent: true, tags: ['results'] },
  
  // Dashboard - cache 5 menit, tidak persistent
  dashboard: { ttl: 300000, persistent: false, tags: ['dashboard'] },
  
  // Statistics - cache 15 menit
  stats: { ttl: 900000, persistent: false, tags: ['stats'] },
  
  // Static content - cache 24 jam, persistent
  static: { ttl: 86400000, persistent: true, tags: ['static'] },
};

/**
 * Higher-order function untuk caching API calls
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  config: CacheConfig
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try cache first
    const cached = await cacheManager.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cacheManager.set(key, result, config);
    
    return result;
  }) as T;
}

/**
 * React hook untuk cached data
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = cacheConfigs.dashboard
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Try cache first
        const cached = await cacheManager.get<T>(key);
        if (cached !== null && mounted) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetcher();
        if (mounted) {
          setData(freshData);
          await cacheManager.set(key, freshData, config);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [key]);

  const invalidate = useCallback(async () => {
    await cacheManager.delete(key);
    setData(null);
    setLoading(true);
  }, [key]);

  return { data, loading, error, invalidate };
}

// React imports
import { useState, useEffect, useCallback } from 'react';
