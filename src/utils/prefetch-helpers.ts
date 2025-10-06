/**
 * Prefetch Helper Utilities
 * 
 * Extracted from usePrefetch hook untuk better separation of concerns
 * dan reduce bundle size.
 * 
 * @module utils/prefetch-helpers
 */

export interface PrefetchEntry {
  href: string;
  prefetched: boolean;
  timestamp: number;
  priority: 'high' | 'low';
}

// Global prefetch cache to avoid duplicate prefetches
export const prefetchCache = new Map<string, PrefetchEntry>();

// Common routes that should be prefetched based on user journey
export const CRITICAL_ROUTES = [
  '/dashboard',
  '/assessment',
  '/results',
  '/auth',
  '/profile'
];

// Routes to prefetch based on current page
export const ROUTE_PREDICTIONS: Record<string, string[]> = {
  '/': ['/auth', '/dashboard'],
  '/auth': ['/dashboard', '/assessment'],
  '/dashboard': ['/assessment', '/results', '/profile'],
  '/assessment': ['/results', '/dashboard'],
  '/results': ['/dashboard', '/assessment'],
  '/profile': ['/dashboard']
};

/**
 * Check if route was recently prefetched (within 5 minutes)
 */
export function isRecentlyPrefetched(href: string): boolean {
  const cached = prefetchCache.get(href);
  return cached ? Date.now() - cached.timestamp < 300000 : false;
}

/**
 * Update prefetch cache
 */
export function updatePrefetchCache(
  href: string, 
  priority: 'high' | 'low' = 'low'
): void {
  prefetchCache.set(href, {
    href,
    prefetched: true,
    timestamp: Date.now(),
    priority
  });
}

/**
 * Get prefetch statistics
 */
export function getPrefetchCacheStats(): {
  totalPrefetched: number;
  highPriority: number;
  lowPriority: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const entries = Array.from(prefetchCache.values());
  
  return {
    totalPrefetched: entries.length,
    highPriority: entries.filter(e => e.priority === 'high').length,
    lowPriority: entries.filter(e => e.priority === 'low').length,
    oldestEntry: entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp)) 
      : null,
    newestEntry: entries.length > 0 
      ? Math.max(...entries.map(e => e.timestamp)) 
      : null
  };
}

/**
 * Clear old prefetch entries (older than 5 minutes)
 */
export function clearOldPrefetchEntries(): number {
  const now = Date.now();
  let clearedCount = 0;
  
  for (const [href, entry] of prefetchCache.entries()) {
    if (now - entry.timestamp > 300000) {
      prefetchCache.delete(href);
      clearedCount++;
    }
  }
  
  return clearedCount;
}

/**
 * Get predicted routes for current path
 */
export function getPredictedRoutes(currentPath: string): string[] {
  return ROUTE_PREDICTIONS[currentPath] || [];
}

/**
 * Check if route is critical
 */
export function isCriticalRoute(href: string): boolean {
  return CRITICAL_ROUTES.includes(href);
}

/**
 * Sort routes by priority (critical routes first)
 */
export function sortRoutesByPriority(routes: string[]): string[] {
  return routes.sort((a, b) => {
    const aIsCritical = isCriticalRoute(a);
    const bIsCritical = isCriticalRoute(b);
    
    if (aIsCritical && !bIsCritical) return -1;
    if (!aIsCritical && bIsCritical) return 1;
    return 0;
  });
}

/**
 * Delay helper for staggered prefetching
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

