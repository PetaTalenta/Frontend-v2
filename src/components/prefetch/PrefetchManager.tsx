'use client';

import React, { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAutoPrefetch, usePrefetch } from '../../hooks/usePrefetch';

interface PrefetchManagerProps {
  children: React.ReactNode;
  enableAutoPrefetch?: boolean;
  enableResourcePrefetch?: boolean;
  enablePredictivePrefetch?: boolean;
  debug?: boolean;
}

// Resource prefetching for critical assets
const CRITICAL_RESOURCES = [
  // Fonts
  '/fonts/geist-sans.woff2',
  '/fonts/geist-mono.woff2',
  
  // Critical images
  '/logo.png',
  '/favicon.ico',
  
  // Critical CSS (will be handled by Next.js automatically)
  // Critical JS chunks (will be handled by Next.js automatically)
];

// API endpoints to prefetch based on user journey
const API_PREFETCH_PATTERNS: Record<string, string[]> = {
  '/dashboard': [
    '/api/auth/profile',
    '/api/assessment/archive',
    '/api/auth/schools'
  ],
  '/assessment': [
    '/api/assessment/questions',
    '/api/assessment/progress'
  ],
  '/results': [
    '/api/assessment/archive',
    '/api/assessment/analysis'
  ]
};

export default function PrefetchManager({
  children,
  enableAutoPrefetch = true,
  enableResourcePrefetch = true,
  enablePredictivePrefetch = true,
  debug = false
}: PrefetchManagerProps) {
  const pathname = usePathname();
  const { prefetchRoutes, getPrefetchStats } = usePrefetch();

  // Auto prefetch based on current route
  useAutoPrefetch(enableAutoPrefetch ? pathname : '');

  // Prefetch critical resources
  const prefetchCriticalResources = useCallback(async () => {
    if (!enableResourcePrefetch) return;

    try {
      // Prefetch critical resources using link preload
      CRITICAL_RESOURCES.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        
        // Determine resource type
        if (resource.includes('.woff2')) {
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
        } else if (resource.includes('.png') || resource.includes('.jpg') || resource.includes('.webp')) {
          link.as = 'image';
        }
        
        // Check if already exists
        const existing = document.querySelector(`link[href="${resource}"]`);
        if (!existing) {
          document.head.appendChild(link);
          if (debug) {
            console.log(`[PrefetchManager] Preloaded resource: ${resource}`);
          }
        }
      });
    } catch (error) {
      console.warn('[PrefetchManager] Failed to prefetch critical resources:', error);
    }
  }, [enableResourcePrefetch, debug]);

  // Prefetch API data
  const prefetchAPIData = useCallback(async (currentPath: string) => {
    if (!enablePredictivePrefetch) return;

    const apiEndpoints = API_PREFETCH_PATTERNS[currentPath];
    if (!apiEndpoints) return;

    try {
      // Prefetch API data in background
      apiEndpoints.forEach(async (endpoint) => {
        try {
          // Use fetch with cache to prefetch API data
          await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Use cache to store the response
            cache: 'force-cache'
          });
          
          if (debug) {
            console.log(`[PrefetchManager] Prefetched API: ${endpoint}`);
          }
        } catch (error) {
          // Silently fail for API prefetch
          if (debug) {
            console.warn(`[PrefetchManager] Failed to prefetch API ${endpoint}:`, error);
          }
        }
      });
    } catch (error) {
      console.warn('[PrefetchManager] Failed to prefetch API data:', error);
    }
  }, [enablePredictivePrefetch, debug]);

  // Initialize prefetching on mount
  useEffect(() => {
    const initializePrefetch = async () => {
      // Small delay to avoid blocking initial render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await prefetchCriticalResources();
      await prefetchAPIData(pathname);
    };

    initializePrefetch();
  }, [pathname, prefetchCriticalResources, prefetchAPIData]);

  // Debug logging
  useEffect(() => {
    if (debug) {
      const logStats = () => {
        const stats = getPrefetchStats();
        console.log('[PrefetchManager] Stats:', stats);
      };

      const interval = setInterval(logStats, 30000); // Log every 30 seconds
      return () => clearInterval(interval);
    }
  }, [debug, getPrefetchStats]);

  // Predictive prefetching based on user behavior
  useEffect(() => {
    if (!enablePredictivePrefetch) return;

    let mouseIdleTimer: NodeJS.Timeout;
    let lastMouseMove = Date.now();

    const handleMouseMove = () => {
      lastMouseMove = Date.now();
      clearTimeout(mouseIdleTimer);
      
      // If user is idle for 2 seconds, start prefetching likely next pages
      mouseIdleTimer = setTimeout(() => {
        const timeSinceMove = Date.now() - lastMouseMove;
        if (timeSinceMove >= 2000) {
          // User seems to be reading/idle, prefetch likely next pages
          const likelyRoutes = getLikelyNextRoutes(pathname);
          if (likelyRoutes.length > 0) {
            prefetchRoutes(likelyRoutes, { priority: 'low', delay: 500 });
            if (debug) {
              console.log('[PrefetchManager] Predictive prefetch triggered:', likelyRoutes);
            }
          }
        }
      }, 2000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(mouseIdleTimer);
    };
  }, [pathname, enablePredictivePrefetch, prefetchRoutes, debug]);

  return <>{children}</>;
}

// Helper function to determine likely next routes based on current path and user behavior
function getLikelyNextRoutes(currentPath: string): string[] {
  const routes: string[] = [];

  switch (currentPath) {
    case '/':
      routes.push('/auth', '/dashboard');
      break;
    case '/auth':
      routes.push('/dashboard');
      break;
    case '/dashboard':
      routes.push('/assessment', '/results');
      break;
    case '/assessment':
      routes.push('/results', '/dashboard');
      break;
    case '/results':
      routes.push('/dashboard', '/assessment');
      break;
    default:
      // For dynamic routes, prefetch common destinations
      if (currentPath.startsWith('/results/')) {
        routes.push('/dashboard', '/assessment');
      }
      break;
  }

  return routes;
}

// Performance monitoring component
export function PrefetchDebugPanel() {
  const { getPrefetchStats } = usePrefetch();
  const [stats, setStats] = React.useState<any>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const updateStats = () => setStats(getPrefetchStats());
      updateStats();
      
      const interval = setInterval(updateStats, 5000);
      return () => clearInterval(interval);
    }
  }, [getPrefetchStats]);

  if (process.env.NODE_ENV !== 'development' || !stats) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
      >
        Prefetch Stats ({stats.totalPrefetched})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 bg-black text-white p-4 rounded shadow-lg max-w-md text-xs">
          <h3 className="font-bold mb-2">Prefetch Statistics</h3>
          <p>Total Prefetched: {stats.totalPrefetched}</p>
          <p>Cache Size: {stats.cacheSize}</p>
          
          <h4 className="font-bold mt-2 mb-1">Recent Prefetches:</h4>
          <ul className="space-y-1">
            {stats.cacheEntries.slice(0, 5).map((entry: any, index: number) => (
              <li key={index} className="truncate">
                {entry.href} ({Math.round(entry.age / 1000)}s ago)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
