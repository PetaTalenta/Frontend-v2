'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { indexedDBCache, cacheUtils } from '../../lib/cache/indexeddb-cache';
import { cacheManager } from '../../hooks/useCachedSWR';

interface CacheManagerProps {
  children: React.ReactNode;
  enableAutoCleanup?: boolean;
  cleanupInterval?: number;
  maxCacheSize?: number;
  debug?: boolean;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  expiredEntries: number;
  oldestEntry: number;
  newestEntry: number;
}

export default function CacheManager({
  children,
  enableAutoCleanup = true,
  cleanupInterval = 30 * 60 * 1000, // 30 minutes
  maxCacheSize = 50 * 1024 * 1024, // 50MB
  debug = false
}: CacheManagerProps) {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cache and setup cleanup
  useEffect(() => {
    const initializeCache = async () => {
      try {
        // Initial cleanup of expired entries
        const cleanedCount = await indexedDBCache.cleanup();
        if (debug) {
          console.log(`[CacheManager] Initial cleanup: removed ${cleanedCount} expired entries`);
        }

        // Get initial stats
        const stats = await indexedDBCache.getStats();
        setCacheStats(stats);
        
        setIsInitialized(true);

        if (debug) {
          console.log('[CacheManager] Initialized with stats:', stats);
        }
      } catch (error) {
        console.error('[CacheManager] Failed to initialize:', error);
        setIsInitialized(true); // Continue even if cache fails
      }
    };

    initializeCache();
  }, [debug]);

  // Auto cleanup interval
  useEffect(() => {
    if (!enableAutoCleanup || !isInitialized) return;

    const cleanup = async () => {
      try {
        const cleanedCount = await indexedDBCache.cleanup();
        const stats = await indexedDBCache.getStats();
        setCacheStats(stats);

        if (debug && cleanedCount > 0) {
          console.log(`[CacheManager] Auto cleanup: removed ${cleanedCount} expired entries`);
        }

        // Check if cache size exceeds limit
        if (stats.totalSize > maxCacheSize) {
          if (debug) {
            console.warn(`[CacheManager] Cache size (${Math.round(stats.totalSize / 1024 / 1024)}MB) exceeds limit (${Math.round(maxCacheSize / 1024 / 1024)}MB)`);
          }
          
          // Clear oldest entries to free up space
          await clearOldestEntries(stats.totalSize - maxCacheSize * 0.8); // Clear to 80% of limit
        }
      } catch (error) {
        console.error('[CacheManager] Auto cleanup failed:', error);
      }
    };

    const interval = setInterval(cleanup, cleanupInterval);
    return () => clearInterval(interval);
  }, [enableAutoCleanup, cleanupInterval, maxCacheSize, debug, isInitialized]);

  // Clear oldest entries to free up space
  const clearOldestEntries = useCallback(async (bytesToFree: number) => {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd want to implement LRU eviction
      const keys = await indexedDBCache.keys();
      const keysToDelete = keys.slice(0, Math.ceil(keys.length * 0.2)); // Delete 20% of entries
      
      for (const key of keysToDelete) {
        await indexedDBCache.delete(key);
      }

      if (debug) {
        console.log(`[CacheManager] Cleared ${keysToDelete.length} oldest entries to free up space`);
      }
    } catch (error) {
      console.error('[CacheManager] Failed to clear oldest entries:', error);
    }
  }, [debug]);

  // Handle visibility change to pause/resume background operations
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce background activity
        if (debug) {
          console.log('[CacheManager] Page hidden, reducing background activity');
        }
      } else {
        // Page is visible, resume normal activity
        if (debug) {
          console.log('[CacheManager] Page visible, resuming normal activity');
        }
        
        // Update stats when page becomes visible
        indexedDBCache.getStats().then(setCacheStats).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [debug]);

  // Handle storage events (when cache is modified in other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      // Update stats when storage changes
      indexedDBCache.getStats().then(setCacheStats).catch(console.error);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <>
      {children}
      {debug && <CacheDebugPanel stats={cacheStats} />}
    </>
  );
}

// Debug panel for development
function CacheDebugPanel({ stats }: { stats: CacheStats | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const [operations, setOperations] = useState<string[]>([]);

  const handleClearCache = async () => {
    try {
      await indexedDBCache.clear();
      setOperations(prev => [...prev, `Cleared all cache at ${new Date().toLocaleTimeString()}`]);
    } catch (error) {
      setOperations(prev => [...prev, `Failed to clear cache: ${error}`]);
    }
  };

  const handleCleanup = async () => {
    try {
      const cleaned = await indexedDBCache.cleanup();
      setOperations(prev => [...prev, `Cleaned ${cleaned} expired entries at ${new Date().toLocaleTimeString()}`]);
    } catch (error) {
      setOperations(prev => [...prev, `Failed to cleanup: ${error}`]);
    }
  };

  const handleClearAPI = async () => {
    try {
      await cacheManager.clearAPICache();
      setOperations(prev => [...prev, `Cleared API cache at ${new Date().toLocaleTimeString()}`]);
    } catch (error) {
      setOperations(prev => [...prev, `Failed to clear API cache: ${error}`]);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-green-600 text-white px-3 py-1 rounded text-sm"
      >
        Cache Manager
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full left-0 mb-2 bg-black text-white p-4 rounded shadow-lg max-w-md text-xs">
          <h3 className="font-bold mb-2">Cache Statistics</h3>
          
          {stats ? (
            <div className="space-y-1 mb-3">
              <p>Total Entries: {stats.totalEntries}</p>
              <p>Total Size: {Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB</p>
              <p>Expired Entries: {stats.expiredEntries}</p>
              <p>Oldest Entry: {stats.oldestEntry ? new Date(stats.oldestEntry).toLocaleString() : 'N/A'}</p>
              <p>Newest Entry: {stats.newestEntry ? new Date(stats.newestEntry).toLocaleString() : 'N/A'}</p>
            </div>
          ) : (
            <p className="mb-3">Loading stats...</p>
          )}

          <div className="space-y-2 mb-3">
            <button
              onClick={handleCleanup}
              className="block w-full bg-blue-600 text-white px-2 py-1 rounded text-xs"
            >
              Cleanup Expired
            </button>
            <button
              onClick={handleClearAPI}
              className="block w-full bg-yellow-600 text-white px-2 py-1 rounded text-xs"
            >
              Clear API Cache
            </button>
            <button
              onClick={handleClearCache}
              className="block w-full bg-red-600 text-white px-2 py-1 rounded text-xs"
            >
              Clear All Cache
            </button>
          </div>

          {operations.length > 0 && (
            <div>
              <h4 className="font-bold mb-1">Recent Operations:</h4>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {operations.slice(-3).map((op, index) => (
                  <p key={index} className="text-xs opacity-80">{op}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Cache provider component
export function CacheProvider({ children }: { children: React.ReactNode }) {
  return (
    <CacheManager
      enableAutoCleanup={true}
      cleanupInterval={30 * 60 * 1000} // 30 minutes
      maxCacheSize={50 * 1024 * 1024} // 50MB
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </CacheManager>
  );
}
