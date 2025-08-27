import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  delay?: number;
  condition?: () => boolean;
  onHover?: boolean;
  onVisible?: boolean;
}

interface PrefetchEntry {
  href: string;
  prefetched: boolean;
  timestamp: number;
  priority: 'high' | 'low';
}

// Global prefetch cache to avoid duplicate prefetches
const prefetchCache = new Map<string, PrefetchEntry>();

// Common routes that should be prefetched based on user journey
const CRITICAL_ROUTES = [
  '/dashboard',
  '/assessment',
  '/results',
  '/auth',
  '/profile'
];

// Routes to prefetch based on current page
const ROUTE_PREDICTIONS: Record<string, string[]> = {
  '/': ['/auth', '/dashboard'],
  '/auth': ['/dashboard', '/assessment'],
  '/dashboard': ['/assessment', '/results', '/profile'],
  '/assessment': ['/results', '/dashboard'],
  '/results': ['/dashboard', '/assessment'],
  '/profile': ['/dashboard']
};

export function usePrefetch() {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  // Prefetch a specific route
  const prefetchRoute = useCallback(async (
    href: string, 
    options: PrefetchOptions = {}
  ) => {
    const { priority = 'low', delay = 0, condition } = options;

    // Check condition if provided
    if (condition && !condition()) {
      return;
    }

    // Check if already prefetched recently (within 5 minutes)
    const cached = prefetchCache.get(href);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return;
    }

    // Add delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      // Use Next.js router prefetch
      router.prefetch(href);
      
      // Update cache
      prefetchCache.set(href, {
        href,
        prefetched: true,
        timestamp: Date.now(),
        priority
      });

      prefetchedRoutes.current.add(href);
      
      console.log(`[Prefetch] Successfully prefetched: ${href} (priority: ${priority})`);
    } catch (error) {
      console.warn(`[Prefetch] Failed to prefetch ${href}:`, error);
    }
  }, [router]);

  // Prefetch multiple routes
  const prefetchRoutes = useCallback(async (
    routes: string[], 
    options: PrefetchOptions = {}
  ) => {
    const { priority = 'low' } = options;
    
    // Sort by priority - high priority routes first
    const sortedRoutes = routes.sort((a, b) => {
      const aPriority = CRITICAL_ROUTES.includes(a) ? 'high' : priority;
      const bPriority = CRITICAL_ROUTES.includes(b) ? 'high' : priority;
      return aPriority === 'high' && bPriority === 'low' ? -1 : 1;
    });

    // Prefetch with staggered delays to avoid overwhelming the network
    for (let i = 0; i < sortedRoutes.length; i++) {
      const route = sortedRoutes[i];
      const routePriority = CRITICAL_ROUTES.includes(route) ? 'high' : priority;
      
      await prefetchRoute(route, {
        ...options,
        priority: routePriority,
        delay: i * 100 // 100ms delay between each prefetch
      });
    }
  }, [prefetchRoute]);

  // Prefetch based on current route
  const prefetchPredictedRoutes = useCallback((currentPath: string) => {
    const predictedRoutes = ROUTE_PREDICTIONS[currentPath] || [];
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

  // Get prefetch stats
  const getPrefetchStats = useCallback(() => {
    return {
      totalPrefetched: prefetchedRoutes.current.size,
      cacheSize: prefetchCache.size,
      prefetchedRoutes: Array.from(prefetchedRoutes.current),
      cacheEntries: Array.from(prefetchCache.entries()).map(([href, entry]) => ({
        href,
        ...entry,
        age: Date.now() - entry.timestamp
      }))
    };
  }, []);

  // Clear old prefetch entries (cleanup)
  const clearOldPrefetches = useCallback(() => {
    const now = Date.now();
    const maxAge = 600000; // 10 minutes

    for (const [href, entry] of prefetchCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        prefetchCache.delete(href);
      }
    }
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
