/**
 * Cache Invalidation Utilities
 * Provides easy-to-use functions untuk invalidate cache setelah mutations
 * 
 * @module cache-invalidation
 * @description Centralized cache invalidation logic untuk maintain data consistency
 */

import { indexedDBCache, cacheUtils } from '../lib/cache/indexeddb-cache';
import { mutate } from 'swr';

/**
 * Cache invalidation strategies
 */
export enum InvalidationStrategy {
  /** Invalidate specific key only */
  SPECIFIC = 'specific',
  /** Invalidate by tag (e.g., all 'dashboard' caches) */
  BY_TAG = 'by_tag',
  /** Invalidate by pattern (e.g., all keys matching 'user-*') */
  BY_PATTERN = 'by_pattern',
  /** Invalidate all caches */
  ALL = 'all'
}

/**
 * Invalidation options
 */
export interface InvalidationOptions {
  /** Strategy to use */
  strategy?: InvalidationStrategy;
  /** Tags to invalidate (for BY_TAG strategy) */
  tags?: string[];
  /** Pattern to match (for BY_PATTERN strategy) */
  pattern?: string | RegExp;
  /** Whether to also trigger SWR revalidation */
  revalidateSWR?: boolean;
  /** SWR keys to revalidate */
  swrKeys?: string[];
  /** Whether to log invalidation actions */
  verbose?: boolean;
}

/**
 * Invalidate cache dengan berbagai strategies
 * 
 * @example
 * ```typescript
 * // Invalidate specific key
 * await invalidateCache('dashboard-assessments-123');
 * 
 * // Invalidate by tag
 * await invalidateCache(null, {
 *   strategy: InvalidationStrategy.BY_TAG,
 *   tags: ['dashboard', 'assessments']
 * });
 * 
 * // Invalidate with SWR revalidation
 * await invalidateCache('user-stats-123', {
 *   revalidateSWR: true,
 *   swrKeys: ['user-stats-123']
 * });
 * ```
 */
export async function invalidateCache(
  key?: string | null,
  options: InvalidationOptions = {}
): Promise<void> {
  // ✅ Guard: Only run on client-side
  if (typeof window === 'undefined') {
    console.warn('[CacheInvalidation] Skipping cache invalidation on server-side');
    return;
  }

  const {
    strategy = InvalidationStrategy.SPECIFIC,
    tags = [],
    pattern,
    revalidateSWR = true,
    swrKeys = [],
    verbose = false
  } = options;

  try {
    if (verbose) {
      console.log(`[CacheInvalidation] Invalidating cache with strategy: ${strategy}`);
    }

    switch (strategy) {
      case InvalidationStrategy.SPECIFIC:
        if (key) {
          await indexedDBCache.delete(key);
          if (verbose) console.log(`[CacheInvalidation] Deleted cache key: ${key}`);
        }
        break;

      case InvalidationStrategy.BY_TAG:
        if (tags.length > 0) {
          await cacheUtils.invalidateByTags(tags);
          if (verbose) console.log(`[CacheInvalidation] Invalidated by tags:`, tags);
        }
        break;

      case InvalidationStrategy.BY_PATTERN:
        if (pattern) {
          await cacheUtils.invalidateByPattern(pattern);
          if (verbose) console.log(`[CacheInvalidation] Invalidated by pattern:`, pattern);
        }
        break;

      case InvalidationStrategy.ALL:
        await indexedDBCache.clear();
        if (verbose) console.log(`[CacheInvalidation] Cleared all cache`);
        break;
    }

    // ✅ Trigger SWR revalidation
    if (revalidateSWR) {
      const keysToRevalidate = swrKeys.length > 0 ? swrKeys : (key ? [key] : []);
      
      for (const swrKey of keysToRevalidate) {
        await mutate(swrKey);
        if (verbose) console.log(`[CacheInvalidation] Revalidated SWR key: ${swrKey}`);
      }
    }

  } catch (error) {
    console.error('[CacheInvalidation] Error during cache invalidation:', error);
    throw error;
  }
}

/**
 * Invalidate dashboard-related caches
 * Convenience function untuk common use case
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  await invalidateCache(null, {
    strategy: InvalidationStrategy.BY_TAG,
    tags: ['dashboard', userId],
    revalidateSWR: true,
    swrKeys: [
      `assessment-history-${userId}`,
      `user-stats-${userId}`,
      `latest-result-${userId}`
    ],
    verbose: true
  });
}

/**
 * Invalidate assessment-related caches
 * Called after assessment submission atau deletion
 */
export async function invalidateAssessmentCache(userId: string, assessmentId?: string): Promise<void> {
  const tags = ['assessments', userId];
  const swrKeys = [`assessment-history-${userId}`];

  if (assessmentId) {
    tags.push(assessmentId);
    swrKeys.push(`assessment-${assessmentId}`);
  }

  await invalidateCache(null, {
    strategy: InvalidationStrategy.BY_TAG,
    tags,
    revalidateSWR: true,
    swrKeys,
    verbose: true
  });
}

/**
 * Invalidate user-related caches
 * Called after user profile update atau logout
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCache(null, {
    strategy: InvalidationStrategy.BY_TAG,
    tags: ['user', userId],
    revalidateSWR: true,
    swrKeys: [
      `user-profile-${userId}`,
      `user-stats-${userId}`,
      `user-settings-${userId}`
    ],
    verbose: true
  });
}

/**
 * Invalidate token-related caches
 * Called after token balance update
 */
export async function invalidateTokenCache(userId: string): Promise<void> {
  await invalidateCache(null, {
    strategy: InvalidationStrategy.BY_TAG,
    tags: ['tokens', userId],
    revalidateSWR: true,
    swrKeys: [`token-balance-${userId}`],
    verbose: true
  });
}

/**
 * Smart cache invalidation after assessment submission
 * Invalidates relevant caches dan triggers optimistic update
 */
export async function invalidateAfterAssessmentSubmission(
  userId: string,
  assessmentId: string
): Promise<void> {
  console.log(`[CacheInvalidation] Invalidating after assessment submission: ${assessmentId}`);

  // ✅ Invalidate in parallel
  await Promise.all([
    invalidateAssessmentCache(userId, assessmentId),
    invalidateDashboardCache(userId),
    invalidateTokenCache(userId) // Token balance may have changed
  ]);

  console.log(`[CacheInvalidation] ✅ Cache invalidated successfully`);
}

/**
 * Smart cache invalidation after assessment deletion
 */
export async function invalidateAfterAssessmentDeletion(
  userId: string,
  assessmentId: string
): Promise<void> {
  console.log(`[CacheInvalidation] Invalidating after assessment deletion: ${assessmentId}`);

  await Promise.all([
    invalidateAssessmentCache(userId, assessmentId),
    invalidateDashboardCache(userId)
  ]);

  console.log(`[CacheInvalidation] ✅ Cache invalidated successfully`);
}

/**
 * Preload cache untuk faster navigation
 * Called saat user likely akan navigate ke page tertentu
 */
export async function preloadDashboardCache(
  userId: string,
  fetchers: {
    assessmentHistory?: () => Promise<any>;
    userStats?: () => Promise<any>;
    latestResult?: () => Promise<any>;
  }
): Promise<void> {
  // ✅ Guard: Only run on client-side
  if (typeof window === 'undefined') {
    console.warn('[CacheInvalidation] Skipping cache preload on server-side');
    return;
  }

  console.log(`[CacheInvalidation] Preloading dashboard cache for user: ${userId}`);

  const preloadTasks: Promise<void>[] = [];

  if (fetchers.assessmentHistory) {
    preloadTasks.push(
      fetchers.assessmentHistory().then(data => {
        return indexedDBCache.set(`swr:assessment-history-${userId}`, data, {
          ttl: 15 * 60 * 1000,
          tags: ['dashboard', 'assessments', userId]
        });
      })
    );
  }

  if (fetchers.userStats) {
    preloadTasks.push(
      fetchers.userStats().then(data => {
        return indexedDBCache.set(`swr:user-stats-${userId}`, data, {
          ttl: 15 * 60 * 1000,
          tags: ['dashboard', 'stats', userId]
        });
      })
    );
  }

  if (fetchers.latestResult) {
    preloadTasks.push(
      fetchers.latestResult().then(data => {
        return indexedDBCache.set(`swr:latest-result-${userId}`, data, {
          ttl: 15 * 60 * 1000,
          tags: ['dashboard', 'results', userId]
        });
      })
    );
  }

  await Promise.all(preloadTasks);
  console.log(`[CacheInvalidation] ✅ Dashboard cache preloaded`);
}

/**
 * Get cache statistics untuk debugging
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  // ✅ Guard: Only run on client-side
  if (typeof window === 'undefined') {
    return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
  }

  const stats = await cacheUtils.getCacheStats();
  return stats;
}

/**
 * Clear expired cache entries
 * Should be called periodically (e.g., on app startup)
 */
export async function clearExpiredCache(): Promise<number> {
  // ✅ Guard: Only run on client-side
  if (typeof window === 'undefined') {
    return 0;
  }

  const cleared = await cacheUtils.clearExpired();
  console.log(`[CacheInvalidation] Cleared ${cleared} expired cache entries`);
  return cleared;
}

// ===== TOKEN BALANCE CACHE INVALIDATION =====

/**
 * ✅ CACHE FIX: Invalidate all token balance caches across all layers
 * Call this after: assessment submission, token purchase, admin adjustment, WebSocket updates
 * 
 * @param userId - User ID for cache key
 * @returns Promise that resolves when all caches are cleared
 * 
 * @example
 * ```typescript
 * // After assessment submission
 * await invalidateTokenBalanceCache(user.id);
 * 
 * // After token purchase
 * await invalidateTokenBalanceCache(user.id);
 * 
 * // On WebSocket token update
 * websocket.on('token-balance-updated', async (data) => {
 *   await invalidateTokenBalanceCache(user.id);
 * });
 * ```
 */
export async function invalidateTokenBalanceCache(userId: string): Promise<void> {
  // ✅ Guard: Only run on client-side
  if (typeof window === 'undefined') {
    console.warn('[TokenCache] Skipping cache invalidation on server-side');
    return;
  }

  console.log('🔄 [TokenCache] Invalidating all token balance caches for user:', userId);

  try {
    // 1. ✅ Clear localStorage cache (user-specific and legacy)
    const userCacheKey = `tokenBalanceCache_${userId}`;
    localStorage.removeItem(userCacheKey);
    localStorage.removeItem('tokenBalanceCache'); // Legacy global key
    console.log('✅ [TokenCache] Cleared localStorage cache');

    // 2. ✅ Clear apiService in-memory cache
    try {
      const { apiService } = await import('../services/apiService');
      if (apiService && typeof apiService.clearCache === 'function') {
        apiService.clearCache();
        console.log('✅ [TokenCache] Cleared apiService cache');
      }
    } catch (error) {
      console.warn('[TokenCache] Could not clear apiService cache:', error);
    }

    // 3. ✅ Invalidate SWR cache
    try {
      await mutate('/api/auth/token-balance', undefined, { revalidate: true });
      await mutate(`/api/token-balance/${userId}`, undefined, { revalidate: true });
      console.log('✅ [TokenCache] Invalidated SWR cache');
    } catch (error) {
      console.warn('[TokenCache] Could not invalidate SWR cache:', error);
    }

    // 4. ✅ Clear IndexedDB cache (if exists)
    try {
      await indexedDBCache.delete(`token-balance-${userId}`);
      await indexedDBCache.delete('token-balance');
      console.log('✅ [TokenCache] Cleared IndexedDB cache');
    } catch (error) {
      // IndexedDB might not be available, that's OK
      console.debug('[TokenCache] IndexedDB cache clear skipped:', error);
    }

    // 5. ✅ Clear related user profile cache (might contain token balance)
    try {
      await mutate('/api/auth/profile', undefined, { revalidate: false });
      await mutate('/api/auth/v2/profile', undefined, { revalidate: false });
      console.log('✅ [TokenCache] Cleared related profile cache');
    } catch (error) {
      console.warn('[TokenCache] Could not clear profile cache:', error);
    }

    console.log('✅ [TokenCache] All token balance caches invalidated successfully');
  } catch (error) {
    console.error('❌ [TokenCache] Error invalidating token balance cache:', error);
    throw error;
  }
}

/**
 * ✅ CACHE FIX: Hook for components to easily invalidate token balance cache
 * 
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const { user } = useAuth();
 *   const invalidateTokenCache = useInvalidateTokenBalance();
 *   
 *   const handlePurchase = async () => {
 *     await purchaseTokens();
 *     await invalidateTokenCache(); // Clear cache after purchase
 *   };
 * };
 * ```
 */
export function useInvalidateTokenBalance() {
  // Note: This would need to be implemented in a React component context
  // For now, return a function that can be called directly
  return async (userId: string) => {
    await invalidateTokenBalanceCache(userId);
  };
}

