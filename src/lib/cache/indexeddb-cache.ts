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
}

class IndexedDBCache {
  private dbName = 'PetaTalentaCache';
  private dbVersion = 1;
  private storeName = 'cache';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
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

  private async ensureDB(): Promise<IDBDatabase> {
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

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const indexedDBCache = new IndexedDBCache();

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
  }
};
