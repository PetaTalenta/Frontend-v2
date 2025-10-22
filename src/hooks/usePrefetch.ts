import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { resourcePrefetcher, prefetchUtils, ROUTE_RESOURCES } from '../lib/prefetch/resource-prefetcher';
import { userBehaviorTracker } from '../lib/analytics/user-behavior-tracker';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  delay?: number;
  condition?: () => boolean;
}

interface UnifiedPrefetchOptions {
  enabled?: boolean;
  enablePredictive?: boolean;
  enableResourcePrefetch?: boolean;
  enableBehaviorTracking?: boolean;
  confidenceThreshold?: number;
  maxPredictions?: number;
  debug?: boolean;
}

interface ResourcePrefetchOptions {
  enabled?: boolean;
  prefetchOnMount?: boolean;
  prefetchOnIdle?: boolean;
  idleDelay?: number;
  priority?: 'high' | 'low';
}

interface PredictionResult {
  path: string;
  confidence: number;
  reason: string;
  prefetched: boolean;
}

/**
 * ✅ Unified Prefetch Hook (Phase 5 Consolidation)
 * Integrates route prefetching, predictive prefetching, and resource prefetching
 * into a single, comprehensive hook with smart prefetch strategy.
 */
export function usePrefetch(options: UnifiedPrefetchOptions = {}) {
  const {
    enabled = true,
    enablePredictive = true,
    enableResourcePrefetch = true,
    enableBehaviorTracking = true,
    confidenceThreshold = 40,
    maxPredictions = 3,
    debug = false
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRoutes = useRef(new Set<string>());
  const prefetchedResources = useRef(new Set<string>());
  const prefetchedPredictions = useRef(new Set<string>());

  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [userBehavior, setUserBehavior] = useState<'idle' | 'active' | 'engaged' | 'leaving'>('active');

  const lastPathRef = useRef<string>(pathname);
  const pageStartTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const behaviorRef = useRef<'idle' | 'active' | 'leaving'>('active');

  // ✅ Core prefetch function - simplified
  const prefetchRoute = useCallback(async (
    href: string,
    opts: PrefetchOptions = {}
  ) => {
    if (!enabled) return;

    const { priority = 'low', delay: delayMs = 0, condition } = opts;

    // Check condition if provided
    if (condition && !condition()) {
      return;
    }

    // Use helper function
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

      // Use helper function
      updatePrefetchCache(href, priority);
      prefetchedRoutes.current.add(href);

      if (debug) {
        console.log(`[Prefetch] Successfully prefetched: ${href} (priority: ${priority})`);
      }
    } catch (error) {
      console.warn(`[Prefetch] Failed to prefetch ${href}:`, error);
    }
  }, [router, enabled, debug]);

  // Prefetch multiple routes
  const prefetchRoutes = useCallback(async (
    routes: string[],
    opts: PrefetchOptions = {}
  ) => {
    if (!enabled) return;

    const { priority = 'low' } = opts;

    // Use helper function for sorting
    const sortedRoutes = sortRoutesByPriority(routes);

    // Prefetch with staggered delays to avoid overwhelming the network
    for (let i = 0; i < sortedRoutes.length; i++) {
      const route = sortedRoutes[i];
      // Use helper function
      const routePriority = isCriticalRoute(route) ? 'high' : priority;

      await prefetchRoute(route, {
        ...opts,
        priority: routePriority,
        delay: i * 100 // 100ms delay between each prefetch
      });
    }
  }, [prefetchRoute, enabled]);

  // Prefetch predicted routes
  const prefetchPredictedRoutes = useCallback((currentPath: string) => {
    if (!enabled || !enablePredictive) return;

    const predictedRoutes = getPredictedRoutes(currentPath);
    if (predictedRoutes.length > 0) {
      prefetchRoutes(predictedRoutes, { priority: 'high' });
    }
  }, [prefetchRoutes, enabled, enablePredictive]);

  // Prefetch resources for a route
  const prefetchResourcesForRoute = useCallback(async (route: string) => {
    if (!enabled || !enableResourcePrefetch) return;

    try {
      await prefetchUtils.prefetchForRoute(route);
      if (debug) {
        console.log(`[Prefetch] Resources prefetched for route: ${route}`);
      }
    } catch (error) {
      console.warn(`[Prefetch] Failed to prefetch resources for ${route}:`, error);
    }
  }, [enabled, enableResourcePrefetch, debug]);

  // Prefetch resources
  const prefetchResources = useCallback(async (
    resources: Array<{ url: string; options?: any }> = [],
    opts: ResourcePrefetchOptions = {}
  ) => {
    if (!enabled || !enableResourcePrefetch || resources.length === 0) return;

    const { priority = 'low' } = opts;

    try {
      await resourcePrefetcher.prefetchResources(
        resources.map(resource => ({
          ...resource,
          options: {
            priority,
            ...resource.options
          }
        }))
      );
      resources.forEach(r => prefetchedResources.current.add(r.url));
      if (debug) {
        console.log(`[Prefetch] ${resources.length} resources prefetched`);
      }
    } catch (error) {
      console.warn('[Prefetch] Failed to prefetch resources:', error);
    }
  }, [enabled, enableResourcePrefetch, debug]);

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
      delay: 500,
      condition: () => !prefetchedRoutes.current.has(href)
    });
  }, [prefetchRoute]);

  // Get prefetch stats
  const getPrefetchStats = useCallback(() => {
    const cacheStats = getPrefetchCacheStats();
    const resourceStats = resourcePrefetcher.getStats();

    return {
      routes: {
        totalPrefetched: prefetchedRoutes.current.size,
        ...cacheStats,
        prefetchedRoutes: Array.from(prefetchedRoutes.current)
      },
      resources: resourceStats,
      predictions: predictions,
      userBehavior: userBehavior
    };
  }, [predictions, userBehavior]);

  // Clear old prefetches
  const clearOldPrefetches = useCallback(() => {
    return clearOldPrefetchEntries();
  }, []);

  // Manual prefetch function
  const manualPrefetch = useCallback(async (path: string) => {
    if (!enabled) return;

    try {
      await prefetchRoute(path, { priority: 'high' });

      if (enableResourcePrefetch) {
        await prefetchResourcesForRoute(path);
      }

      prefetchedPredictions.current.add(path);

      if (debug) {
        console.log(`[Prefetch] Manual prefetch completed: ${path}`);
      }
    } catch (error) {
      console.warn(`[Prefetch] Manual prefetch failed for ${path}:`, error);
    }
  }, [enabled, prefetchRoute, enableResourcePrefetch, prefetchResourcesForRoute, debug]);

  // Track page navigation
  useEffect(() => {
    if (!enableBehaviorTracking) return;

    const previousPath = lastPathRef.current;
    const timeSpent = Date.now() - pageStartTimeRef.current;

    if (previousPath !== pathname && previousPath) {
      userBehaviorTracker.trackNavigation(previousPath, pathname, timeSpent);

      if (debug) {
        console.log(`[Prefetch] Navigation tracked: ${previousPath} -> ${pathname} (${Math.round(timeSpent / 1000)}s)`);
      }
    }

    lastPathRef.current = pathname;
    pageStartTimeRef.current = Date.now();
    prefetchedPredictions.current.clear();
  }, [pathname, enableBehaviorTracking, debug]);

  // Auto cleanup on mount
  useEffect(() => {
    const cleanup = setInterval(clearOldPrefetches, 300000); // Every 5 minutes
    return () => clearInterval(cleanup);
  }, [clearOldPrefetches]);

  return {
    // Route prefetching
    prefetchRoute,
    prefetchRoutes,
    prefetchPredictedRoutes,
    prefetchOnHover,
    prefetchOnVisible,

    // Resource prefetching
    prefetchResources,
    prefetchResourcesForRoute,

    // Manual control
    manualPrefetch,

    // Stats and utilities
    getPrefetchStats,
    clearOldPrefetches,

    // State
    predictions,
    userBehavior,
    isEnabled: enabled
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

// ============================================================================
// BACKWARD COMPATIBILITY WRAPPERS (Phase 5 Consolidation)
// These wrappers maintain compatibility with old usePredictivePrefetch and
// useResourcePrefetch hooks. They are deprecated and will be removed in future.
// ============================================================================

/**
 * @deprecated Use usePrefetch({ enablePredictive: true }) instead
 * Wrapper for backward compatibility with usePredictivePrefetch
 */
export function usePredictivePrefetch(options: UnifiedPrefetchOptions = {}) {
  const {
    enabled = true,
    confidenceThreshold = 40,
    maxPredictions = 3,
    enableBehaviorTracking = true,
    enableResourcePrefetch = true,
    debug = false
  } = options;

  const {
    prefetchRoute,
    prefetchRoutes,
    prefetchResourcesForRoute,
    manualPrefetch,
    predictions,
    userBehavior,
    getPrefetchStats
  } = usePrefetch({
    enabled,
    enablePredictive: true,
    enableResourcePrefetch,
    enableBehaviorTracking,
    confidenceThreshold,
    maxPredictions,
    debug
  });

  const prefetchPredictions = useCallback(async () => {
    const unprefetchedPredictions = predictions.filter(p => !p.prefetched);
    if (unprefetchedPredictions.length === 0) return;

    const routesToPrefetch = unprefetchedPredictions.map(p => p.path);
    await prefetchRoutes(routesToPrefetch, { priority: 'low' });

    if (enableResourcePrefetch) {
      for (const prediction of unprefetchedPredictions) {
        await prefetchResourcesForRoute(prediction.path);
      }
    }
  }, [predictions, prefetchRoutes, enableResourcePrefetch, prefetchResourcesForRoute]);

  const getBehaviorStats = useCallback(() => {
    return userBehaviorTracker.getSessionStats();
  }, []);

  return {
    predictions,
    userBehavior,
    prefetchPredictions,
    manualPrefetch,
    getBehaviorStats,
    isEnabled: enabled
  };
}

/**
 * @deprecated Use usePrefetch({ enableResourcePrefetch: true }) instead
 * Wrapper for backward compatibility with useResourcePrefetch
 */
export function useResourcePrefetch(
  resources: Array<{ url: string; options?: any }> = [],
  options: ResourcePrefetchOptions = {}
) {
  const {
    enabled = true,
    prefetchOnMount = false,
    prefetchOnIdle = true,
    idleDelay = 2000,
    priority = 'low'
  } = options;

  const { prefetchResources } = usePrefetch({
    enabled,
    enableResourcePrefetch: true
  });

  const prefetchedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout>();

  const prefetch = useCallback(async () => {
    if (!enabled || prefetchedRef.current || resources.length === 0) {
      return;
    }

    try {
      await prefetchResources(resources, { priority });
      prefetchedRef.current = true;
    } catch (error) {
      console.warn('[useResourcePrefetch] Failed to prefetch resources:', error);
    }
  }, [enabled, resources, priority, prefetchResources]);

  // Prefetch on mount
  useEffect(() => {
    if (prefetchOnMount) {
      prefetch();
    }
  }, [prefetchOnMount, prefetch]);

  // Prefetch on idle
  useEffect(() => {
    if (!prefetchOnIdle || !enabled) return;

    const handleUserActivity = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        prefetch();
      }, idleDelay);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    handleUserActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [prefetchOnIdle, enabled, idleDelay, prefetch]);

  return {
    prefetch,
    isPrefetched: prefetchedRef.current,
    stats: resourcePrefetcher.getStats()
  };
}

/**
 * @deprecated Use usePrefetch() instead
 * Wrapper for backward compatibility with useRoutePrefetch
 */
export function useRoutePrefetch(route?: string) {
  const pathname = usePathname();
  const currentRoute = route || pathname;

  const resources = ROUTE_RESOURCES[currentRoute] || [];

  return useResourcePrefetch(resources, {
    enabled: true,
    prefetchOnMount: false,
    prefetchOnIdle: true,
    idleDelay: 1000,
    priority: 'low'
  });
}

/**
 * @deprecated Use usePrefetch() instead
 * Wrapper for backward compatibility with useCriticalResourcePrefetch
 */
export function useCriticalResourcePrefetch() {
  const { prefetch } = useResourcePrefetch([], {
    enabled: true,
    prefetchOnMount: true,
    priority: 'high'
  });

  useEffect(() => {
    prefetchUtils.prefetchCritical();
  }, []);

  return { prefetch };
}

/**
 * @deprecated Use usePrefetch() instead
 * Wrapper for backward compatibility with useImagePrefetch
 */
export function useImagePrefetch(imageUrls: string[], options: ResourcePrefetchOptions = {}) {
  const { enabled = true, priority = 'low' } = options;
  const observerRef = useRef<IntersectionObserver>();
  const prefetchedImages = useRef(new Set<string>());

  const prefetchImage = useCallback(async (url: string) => {
    if (prefetchedImages.current.has(url)) return;

    try {
      await resourcePrefetcher.prefetchResource(url, {
        as: 'image',
        priority
      });
      prefetchedImages.current.add(url);
    } catch (error) {
      console.warn(`[useImagePrefetch] Failed to prefetch image: ${url}`, error);
    }
  }, [priority]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src || img.src;
            if (src) {
              prefetchImage(src);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, prefetchImage]);

  const observeImage = useCallback((element: HTMLImageElement | null) => {
    if (!element || !observerRef.current) return;
    observerRef.current.observe(element);
  }, []);

  const prefetchAll = useCallback(async () => {
    const resources = imageUrls.map(url => ({
      url,
      options: {
        as: 'image' as const,
        priority
      }
    }));

    await resourcePrefetcher.prefetchResources(resources);
  }, [imageUrls, priority]);

  return {
    observeImage,
    prefetchAll,
    prefetchedCount: prefetchedImages.current.size
  };
}

/**
 * @deprecated Use usePrefetch() instead
 * Wrapper for backward compatibility with useAPIPrefetch
 */
export function useAPIPrefetch(endpoints: string[], enabled: boolean = true) {
  const prefetchedEndpoints = useRef(new Set<string>());

  const prefetchAPI = useCallback(async (endpoint: string) => {
    if (prefetchedEndpoints.current.has(endpoint)) return;

    try {
      await resourcePrefetcher.prefetchResource(endpoint, {
        as: 'fetch',
        priority: 'low'
      });
      prefetchedEndpoints.current.add(endpoint);
    } catch (error) {
      console.warn(`[useAPIPrefetch] Failed to prefetch API: ${endpoint}`, error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const prefetchAll = async () => {
      for (const endpoint of endpoints) {
        await prefetchAPI(endpoint);
      }
    };

    const timer = setTimeout(prefetchAll, 2000);
    return () => clearTimeout(timer);
  }, [endpoints, enabled, prefetchAPI]);

  return {
    prefetchAPI,
    prefetchedCount: prefetchedEndpoints.current.size
  };
}

/**
 * @deprecated Use usePrefetch() instead
 * Wrapper for backward compatibility with useHoverPredictivePrefetch
 */
export function useHoverPredictivePrefetch(enabled: boolean = true) {
  const { manualPrefetch } = usePredictivePrefetch({ enabled });
  const hoverTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleLinkHover = useCallback((href: string, delay: number = 300) => {
    if (!enabled) return;

    const existingTimeout = hoverTimeouts.current.get(href);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      manualPrefetch(href);
      hoverTimeouts.current.delete(href);
    }, delay);

    hoverTimeouts.current.set(href, timeout);
  }, [enabled, manualPrefetch]);

  const handleLinkLeave = useCallback((href: string) => {
    const timeout = hoverTimeouts.current.get(href);
    if (timeout) {
      clearTimeout(timeout);
      hoverTimeouts.current.delete(href);
    }
  }, []);

  useEffect(() => {
    return () => {
      hoverTimeouts.current.forEach(timeout => clearTimeout(timeout));
      hoverTimeouts.current.clear();
    };
  }, []);

  return {
    handleLinkHover,
    handleLinkLeave
  };
}

/**
 * @deprecated Use usePrefetch() instead
 * Wrapper for backward compatibility with useScrollPredictivePrefetch
 */
export function useScrollPredictivePrefetch(enabled: boolean = true) {
  const { prefetchPredictions } = usePredictivePrefetch({ enabled });
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;

    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.round((scrollTop / docHeight) * 100);

      setScrollProgress(progress);

      if (progress > 50 && progress < 55) {
        prefetchPredictions();
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, prefetchPredictions]);

  return {
    scrollProgress
  };
}
