// Cache utility for profile data and other frequently accessed data

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Set cache item with TTL
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Default TTL: 5 minutes
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, item);
  }

  // Get cache item, returns null if expired or not found
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - item.timestamp) > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Check if cache item exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    const now = Date.now();
    const isExpired = (now - item.timestamp) > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete cache item
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Clear expired items
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      const isExpired = (now - item.timestamp) > item.ttl;
      if (isExpired) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get all cache keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Set cache item with specific expiration time
  setWithExpiration<T>(key: string, data: T, expirationTime: Date): void {
    const ttl = expirationTime.getTime() - Date.now();
    if (ttl > 0) {
      this.set(key, data, ttl);
    }
  }

  // Get cache item with fallback function
  async getWithFallback<T>(
    key: string, 
    fallback: () => Promise<T>, 
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fallback();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fallback fails and we have expired cache, return it as last resort
      const expiredItem = this.cache.get(key);
      if (expiredItem) {
        console.warn('Using expired cache due to fallback failure:', error);
        return expiredItem.data as T;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Specific cache keys for the application
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_SETTINGS: 'user_settings',
  ASSESSMENT_RESULTS: 'assessment_results',
  DASHBOARD_DATA: 'dashboard_data',
  SCHOOL_DATA: 'school_data',
} as const;

// Helper functions for specific cache operations
export const profileCache = {
  get: () => cacheManager.get<any>(CACHE_KEYS.USER_PROFILE),
  set: (data: any, ttl?: number) => cacheManager.set(CACHE_KEYS.USER_PROFILE, data, ttl),
  clear: () => cacheManager.delete(CACHE_KEYS.USER_PROFILE),
  has: () => cacheManager.has(CACHE_KEYS.USER_PROFILE),
  getWithFallback: (fallback: () => Promise<any>, ttl?: number) => 
    cacheManager.getWithFallback(CACHE_KEYS.USER_PROFILE, fallback, ttl),
};

export const settingsCache = {
  get: () => cacheManager.get<any>(CACHE_KEYS.USER_SETTINGS),
  set: (data: any, ttl?: number) => cacheManager.set(CACHE_KEYS.USER_SETTINGS, data, ttl),
  clear: () => cacheManager.delete(CACHE_KEYS.USER_SETTINGS),
  has: () => cacheManager.has(CACHE_KEYS.USER_SETTINGS),
};

export const assessmentCache = {
  get: (id: string) => cacheManager.get<any>(`${CACHE_KEYS.ASSESSMENT_RESULTS}_${id}`),
  set: (id: string, data: any, ttl?: number) => 
    cacheManager.set(`${CACHE_KEYS.ASSESSMENT_RESULTS}_${id}`, data, ttl),
  clear: (id: string) => cacheManager.delete(`${CACHE_KEYS.ASSESSMENT_RESULTS}_${id}`),
  has: (id: string) => cacheManager.has(`${CACHE_KEYS.ASSESSMENT_RESULTS}_${id}`),
};

// Periodic cleanup of expired cache items
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.clearExpired();
  }, 60 * 1000); // Clean up every minute
}