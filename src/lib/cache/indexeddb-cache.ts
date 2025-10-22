// IndexedDB-based caching system for persistent client-side storage

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
  tags: string[];
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  version?: string;
  maxSize?: number; // Maximum cache size in bytes
  staleWhileRevalidate?: number; // Time to serve stale data while refreshing
  backgroundRefresh?: boolean; // Enable background refresh
}

class IndexedDBCache {
  private dbName = 'FutureGuideCache';
  private dbVersion = 1;
  private storeName = 'cache';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isClient = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

  constructor() {
    // ✅ Only initialize on client-side
    if (this.isClient) {
      this.initPromise = this.init();
    } else {
      // Resolve immediately on server-side
      this.initPromise = Promise.resolve();
    }
  }

  private async init(): Promise<void> {
    // ✅ Guard: Skip on server-side
    if (!this.isClient) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          
          // Create indexes for efficient querying
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase | null> {
    // ✅ Return null on server-side
    if (!this.isClient) {
      return null;
    }

    if (!this.db) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Set data in cache
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const db = await this.ensureDB();
    // ✅ Skip on server-side
    if (!db) return;
    const {
      ttl = 24 * 60 * 60 * 1000, // Default 24 hours
      tags = [],
      version = '1.0.0',
      maxSize = 10 * 1024 * 1024 // 10MB default max size
    } = options;

    const now = Date.now();
    const serializedData = JSON.stringify(data);
    const size = new Blob([serializedData]).size;

    // Check size limit
    if (size > maxSize) {
      console.warn(`[IndexedDBCache] Data too large for key ${key}: ${size} bytes`);
      return;
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      expiresAt: now + ttl,
      version,
      tags,
      size
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    // ✅ Return null on server-side
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T>;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
          // Remove expired entry
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Check if key exists and is not expired
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  // Delete specific key
  async delete(key: string): Promise<void> {
    const db = await this.ensureDB();
    // ✅ Skip on server-side
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all cache
  async clear(): Promise<void> {
    const db = await this.ensureDB();
    // ✅ Skip on server-side
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Delete entries by tags
  async deleteByTags(tags: string[]): Promise<void> {
    const db = await this.ensureDB();
    // ✅ Skip on server-side
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('tags');

      const keysToDelete: string[] = [];

      tags.forEach(tag => {
        const request = index.openCursor(IDBKeyRange.only(tag));
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            keysToDelete.push(cursor.value.key);
            cursor.continue();
          }
        };
      });

      transaction.oncomplete = () => {
        // Delete all found keys
        const deletePromises = keysToDelete.map(key => this.delete(key));
        Promise.all(deletePromises).then(() => resolve()).catch(reject);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Clean up expired entries
  async cleanup(): Promise<number> {
    const db = await this.ensureDB();
    // ✅ Return 0 on server-side
    if (!db) return 0;

    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(deletedCount);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get cache statistics
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    expiredEntries: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    const db = await this.ensureDB();
    // ✅ Return empty stats on server-side
    if (!db) {
      return { totalEntries: 0, totalSize: 0, expiredEntries: 0, oldestEntry: 0, newestEntry: 0 };
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];
        const now = Date.now();

        const stats = {
          totalEntries: entries.length,
          totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
          expiredEntries: entries.filter(entry => entry.expiresAt < now).length,
          oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
          newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
        };

        resolve(stats);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get all keys
  async keys(): Promise<string[]> {
    const db = await this.ensureDB();
    // ✅ Return empty array on server-side
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Get with stale-while-revalidate pattern
  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = 30 * 60 * 1000, // 30 minutes default
      staleWhileRevalidate = 60 * 60 * 1000, // 1 hour default
      tags = [],
      version = '1.0.0',
      backgroundRefresh = true
    } = options;

    const now = Date.now();
    const entry = await this.getEntry(key);

    // Cache miss - fetch fresh data
    if (!entry) {
      console.log(`[IndexedDBCache] Cache MISS for key: ${key}`);
      const data = await fetcher();
      await this.set(key, data, { ttl, tags, version });
      return data;
    }

    // Check if expired
    if (now > entry.expiresAt) {
      // Data is too old - force refresh
      console.log(`[IndexedDBCache] Cache EXPIRED for key: ${key}, forcing refresh`);
      const data = await fetcher();
      await this.set(key, data, { ttl, tags, version });
      return data;
    }

    // Data is fresh
    if (now < entry.expiresAt) {
      console.log(`[IndexedDBCache] Cache HIT (fresh) for key: ${key}`);
      return entry.data;
    }

    // Data is stale but within stale-while-revalidate window
    if (now < entry.timestamp + staleWhileRevalidate) {
      console.log(`[IndexedDBCache] Cache HIT (stale) for key: ${key}, triggering background refresh`);

      // Trigger background refresh if enabled
      if (backgroundRefresh) {
        fetcher()
          .then(data => this.set(key, data, { ttl, tags, version }))
          .catch(error => console.warn(`[IndexedDBCache] Background refresh failed for key: ${key}`, error));
      }

      return entry.data;
    }

    // Fallback: fetch fresh data
    const data = await fetcher();
    await this.set(key, data, { ttl, tags, version });
    return data;
  }

  // Get entry with metadata (internal use)
  private async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const db = await this.ensureDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        resolve(entry || null);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// ✅ Lazy singleton instance - only create on client-side
let _indexedDBCacheInstance: IndexedDBCache | null = null;

function getIndexedDBCache(): IndexedDBCache {
  if (!_indexedDBCacheInstance) {
    _indexedDBCacheInstance = new IndexedDBCache();
  }
  return _indexedDBCacheInstance;
}

// Export getter instead of direct instance
export const indexedDBCache = {
  get isClient() {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  },

  async set<T>(key: string, data: T, options?: any): Promise<void> {
    if (!this.isClient) return;
    return getIndexedDBCache().set(key, data, options);
  },

  async get<T>(key: string): Promise<T | null> {
    if (!this.isClient) return null;
    return getIndexedDBCache().get(key);
  },

  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: any
  ): Promise<T> {
    if (!this.isClient) {
      // On server-side, just fetch directly
      return fetcher();
    }
    return getIndexedDBCache().getWithSWR(key, fetcher, options);
  },

  async has(key: string): Promise<boolean> {
    if (!this.isClient) return false;
    return getIndexedDBCache().has(key);
  },

  async delete(key: string): Promise<void> {
    if (!this.isClient) return;
    return getIndexedDBCache().delete(key);
  },

  async clear(): Promise<void> {
    if (!this.isClient) return;
    return getIndexedDBCache().clear();
  },

  async deleteByTags(tags: string[]): Promise<void> {
    if (!this.isClient) return;
    return getIndexedDBCache().deleteByTags(tags);
  },

  async cleanup(): Promise<number> {
    if (!this.isClient) return 0;
    return getIndexedDBCache().cleanup();
  },

  async getStats(): Promise<any> {
    if (!this.isClient) {
      return { totalEntries: 0, totalSize: 0, expiredEntries: 0, oldestEntry: 0, newestEntry: 0 };
    }
    return getIndexedDBCache().getStats();
  },

  async keys(): Promise<string[]> {
    if (!this.isClient) return [];
    return getIndexedDBCache().keys();
  }
};

// Utility functions for common caching patterns
export const cacheUtils = {
  // Cache API responses
  async cacheAPIResponse<T>(url: string, data: T, ttl?: number): Promise<void> {
    await indexedDBCache.set(`api:${url}`, data, {
      ttl,
      tags: ['api', 'response'],
      version: '1.0.0'
    });
  },

  // Get cached API response
  async getCachedAPIResponse<T>(url: string): Promise<T | null> {
    return indexedDBCache.get<T>(`api:${url}`);
  },

  // Cache user data
  async cacheUserData<T>(userId: string, data: T, ttl?: number): Promise<void> {
    await indexedDBCache.set(`user:${userId}`, data, {
      ttl,
      tags: ['user', userId],
      version: '1.0.0'
    });
  },

  // Get cached user data
  async getCachedUserData<T>(userId: string): Promise<T | null> {
    return indexedDBCache.get<T>(`user:${userId}`);
  },

  // Cache assessment results
  async cacheAssessmentResult<T>(resultId: string, data: T): Promise<void> {
    await indexedDBCache.set(`assessment:${resultId}`, data, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days for assessment results
      tags: ['assessment', 'result'],
      version: '1.0.0'
    });
  },

  // Get cached assessment result
  async getCachedAssessmentResult<T>(resultId: string): Promise<T | null> {
    return indexedDBCache.get<T>(`assessment:${resultId}`);
  },

  // Clear user-specific cache
  async clearUserCache(userId: string): Promise<void> {
    await indexedDBCache.deleteByTags([userId]);
  },

  // Clear API cache
  async clearAPICache(): Promise<void> {
    await indexedDBCache.deleteByTags(['api']);
  },

  // Invalidate by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    await indexedDBCache.deleteByTags(tags);
  },

  // Invalidate by pattern
  async invalidateByPattern(pattern: string | RegExp): Promise<void> {
    if (!indexedDBCache.isClient) return;

    const allKeys = await indexedDBCache.keys();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = allKeys.filter(key => regex.test(key));

    await Promise.all(keysToDelete.map(key => indexedDBCache.delete(key)));
  },

  // Get cache stats
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    const stats = await indexedDBCache.getStats();
    return {
      totalEntries: stats.totalEntries,
      totalSize: stats.totalSize,
      oldestEntry: stats.oldestEntry,
      newestEntry: stats.newestEntry
    };
  },

  // Clear expired entries
  async clearExpired(): Promise<number> {
    return indexedDBCache.cleanup();
  }
};
