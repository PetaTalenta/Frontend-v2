import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { resourcePrefetcher, prefetchUtils, ROUTE_RESOURCES } from '../lib/prefetch/resource-prefetcher';

interface UseResourcePrefetchOptions {
  enabled?: boolean;
  prefetchOnMount?: boolean;
  prefetchOnIdle?: boolean;
  prefetchOnHover?: boolean;
  idleDelay?: number;
  priority?: 'high' | 'low';
}

// Main hook for resource prefetching
export function useResourcePrefetch(
  resources: Array<{ url: string; options?: any }> = [],
  options: UseResourcePrefetchOptions = {}
) {
  const {
    enabled = true,
    prefetchOnMount = false,
    prefetchOnIdle = true,
    prefetchOnHover = false,
    idleDelay = 2000,
    priority = 'low'
  } = options;

  const prefetchedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout>();

  // Prefetch function
  const prefetch = useCallback(async () => {
    if (!enabled || prefetchedRef.current || resources.length === 0) {
      return;
    }

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
      prefetchedRef.current = true;
    } catch (error) {
      console.warn('[useResourcePrefetch] Failed to prefetch resources:', error);
    }
  }, [enabled, resources, priority]);

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
      // Clear existing timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Set new timer
      idleTimerRef.current = setTimeout(() => {
        prefetch();
      }, idleDelay);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer
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

// Hook for route-based prefetching
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

// Hook for critical resource prefetching
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

// Hook for image prefetching with intersection observer
export function useImagePrefetch(imageUrls: string[], options: UseResourcePrefetchOptions = {}) {
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

  // Setup intersection observer for lazy prefetching
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
        rootMargin: '50px', // Start prefetching 50px before image is visible
        threshold: 0.1
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, prefetchImage]);

  // Observe images
  const observeImage = useCallback((element: HTMLImageElement | null) => {
    if (!element || !observerRef.current) return;

    observerRef.current.observe(element);
  }, []);

  // Prefetch all images immediately
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

// Hook for predictive prefetching based on user behavior
export function usePredictivePrefetch() {
  const pathname = usePathname();
  const lastActivityRef = useRef(Date.now());
  const behaviorRef = useRef<'idle' | 'active' | 'leaving'>('active');

  // Track user behavior
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      behaviorRef.current = 'active';
    };

    const checkIdleState = () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;

      if (timeSinceActivity > 5000) { // 5 seconds idle
        behaviorRef.current = 'idle';
        // Trigger predictive prefetch
        prefetchUtils.prefetchPredictive(pathname, 'idle');
      }
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check idle state periodically
    const idleInterval = setInterval(checkIdleState, 2000);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        behaviorRef.current = 'leaving';
        prefetchUtils.prefetchPredictive(pathname, 'leaving');
      } else {
        behaviorRef.current = 'active';
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(idleInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return {
    currentBehavior: behaviorRef.current,
    lastActivity: lastActivityRef.current
  };
}

// Hook for font prefetching
export function useFontPrefetch(fontUrls: string[]) {
  useEffect(() => {
    const prefetchFonts = async () => {
      const fontResources = fontUrls.map(url => ({
        url,
        options: {
          as: 'font' as const,
          type: 'font/woff2',
          crossOrigin: 'anonymous' as const,
          priority: 'high' as const
        }
      }));

      await resourcePrefetcher.prefetchResources(fontResources);
    };

    prefetchFonts();
  }, [fontUrls]);
}

// Hook for API prefetching
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

    // Delay API prefetching to not interfere with critical resources
    const timer = setTimeout(prefetchAll, 2000);
    return () => clearTimeout(timer);
  }, [endpoints, enabled, prefetchAPI]);

  return {
    prefetchAPI,
    prefetchedCount: prefetchedEndpoints.current.size
  };
}
