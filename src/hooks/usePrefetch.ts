import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  isRecentlyPrefetched,
  updatePrefetchCache,
  getPrefetchCacheStats,
  clearOldPrefetchEntries,
  getPredictedRoutes,
  isCriticalRoute,
  sortRoutesByPriority,
  delay
} from '../utils/prefetch-helpers';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  delay?: number;
  condition?: () => boolean;
}

/**
 * ✅ Simplified usePrefetch hook
 * Advanced features extracted to prefetch-helpers utility
 */
export function usePrefetch() {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  // ✅ Core prefetch function - simplified
  const prefetchRoute = useCallback(async (
    href: string,
    options: PrefetchOptions = {}
  ) => {
    const { priority = 'low', delay: delayMs = 0, condition } = options;

    // Check condition if provided
    if (condition && !condition()) {
      return;
    }

    // ✅ Use helper function
    if (isRecentlyPrefetched(href)) {
      return;
    }

    // Add delay if specified
    if (delayMs > 0) {
      await delay(delayMs);
    }

    try {
      // Use Next.js router prefetch
      router.prefetch(href);

      // ✅ Use helper function
      updatePrefetchCache(href, priority);
      prefetchedRoutes.current.add(href);

      console.log(`[Prefetch] Successfully prefetched: ${href} (priority: ${priority})`);
    } catch (error) {
      console.warn(`[Prefetch] Failed to prefetch ${href}:`, error);
    }
  }, [router]);

  // ✅ Simplified prefetch multiple routes
  const prefetchRoutes = useCallback(async (
    routes: string[],
    options: PrefetchOptions = {}
  ) => {
    const { priority = 'low' } = options;

    // ✅ Use helper function for sorting
    const sortedRoutes = sortRoutesByPriority(routes);

    // Prefetch with staggered delays to avoid overwhelming the network
    for (let i = 0; i < sortedRoutes.length; i++) {
      const route = sortedRoutes[i];
      // ✅ Use helper function
      const routePriority = isCriticalRoute(route) ? 'high' : priority;

      await prefetchRoute(route, {
        ...options,
        priority: routePriority,
        delay: i * 100 // 100ms delay between each prefetch
      });
    }
  }, [prefetchRoute]);

  // ✅ Simplified prefetch predicted routes
  const prefetchPredictedRoutes = useCallback((currentPath: string) => {
    // ✅ Use helper function
    const predictedRoutes = getPredictedRoutes(currentPath);
    if (predictedRoutes.length > 0) {
      prefetchRoutes(predictedRoutes, { priority: 'high' });
    }
  }, [prefetchRoutes]);

  // Prefetch on hover
  const prefetchOnHover = useCallback((href: string) => {
    prefetchRoute(href, { 
      priority: 'high',
      condition: () => !prefetchedRoutes.current.has(href)
    });
  }, [prefetchRoute]);

  // Prefetch on intersection (when element becomes visible)
  const prefetchOnVisible = useCallback((href: string) => {
    prefetchRoute(href, { 
      priority: 'low',
      delay: 500, // Small delay to avoid prefetching too aggressively
      condition: () => !prefetchedRoutes.current.has(href)
    });
  }, [prefetchRoute]);

  // ✅ Simplified get prefetch stats
  const getPrefetchStats = useCallback(() => {
    // ✅ Use helper function
    const cacheStats = getPrefetchCacheStats();

    return {
      totalPrefetched: prefetchedRoutes.current.size,
      ...cacheStats,
      prefetchedRoutes: Array.from(prefetchedRoutes.current)
    };
  }, []);

  // ✅ Simplified clear old prefetches
  const clearOldPrefetches = useCallback(() => {
    // ✅ Use helper function
    return clearOldPrefetchEntries();
  }, []);

  // Auto cleanup on mount
  useEffect(() => {
    const cleanup = setInterval(clearOldPrefetches, 300000); // Every 5 minutes
    return () => clearInterval(cleanup);
  }, [clearOldPrefetches]);

  return {
    prefetchRoute,
    prefetchRoutes,
    prefetchPredictedRoutes,
    prefetchOnHover,
    prefetchOnVisible,
    getPrefetchStats,
    clearOldPrefetches
  };
}

// Hook for automatic prefetching based on current route
export function useAutoPrefetch(currentPath: string) {
  const { prefetchPredictedRoutes } = usePrefetch();

  useEffect(() => {
    // Prefetch predicted routes after a short delay
    const timer = setTimeout(() => {
      prefetchPredictedRoutes(currentPath);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentPath, prefetchPredictedRoutes]);
}

// Hook for intersection-based prefetching
export function useIntersectionPrefetch(href: string, enabled: boolean = true) {
  const { prefetchOnVisible } = usePrefetch();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchOnVisible(href);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Start prefetching 100px before element is visible
        threshold: 0.1
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [href, enabled, prefetchOnVisible]);

  return elementRef;
}
