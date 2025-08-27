import { useEffect, useCallback, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { userBehaviorTracker, behaviorUtils } from '../lib/analytics/user-behavior-tracker';
import { usePrefetch } from './usePrefetch';
import { resourcePrefetcher, prefetchUtils } from '../lib/prefetch/resource-prefetcher';

interface PredictivePrefetchOptions {
  enabled?: boolean;
  confidenceThreshold?: number;
  maxPredictions?: number;
  enableBehaviorTracking?: boolean;
  enableResourcePrefetch?: boolean;
  debug?: boolean;
}

interface PredictionResult {
  path: string;
  confidence: number;
  reason: string;
  prefetched: boolean;
}

// Main hook for predictive prefetching
export function usePredictivePrefetch(options: PredictivePrefetchOptions = {}) {
  const {
    enabled = true,
    confidenceThreshold = 40,
    maxPredictions = 3,
    enableBehaviorTracking = true,
    enableResourcePrefetch = true,
    debug = false
  } = options;

  const pathname = usePathname();
  const router = useRouter();
  const { prefetchRoute, prefetchRoutes } = usePrefetch();
  
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [userBehavior, setUserBehavior] = useState<'idle' | 'active' | 'engaged' | 'leaving'>('active');
  
  const lastPathRef = useRef<string>(pathname);
  const pageStartTimeRef = useRef<number>(Date.now());
  const prefetchedPredictions = useRef<Set<string>>(new Set());

  // Track page navigation
  useEffect(() => {
    if (!enableBehaviorTracking) return;

    const previousPath = lastPathRef.current;
    const timeSpent = Date.now() - pageStartTimeRef.current;

    if (previousPath !== pathname && previousPath) {
      // Track navigation
      userBehaviorTracker.trackNavigation(previousPath, pathname, timeSpent);
      
      if (debug) {
        console.log(`[PredictivePrefetch] Navigation tracked: ${previousPath} -> ${pathname} (${Math.round(timeSpent / 1000)}s)`);
      }
    }

    lastPathRef.current = pathname;
    pageStartTimeRef.current = Date.now();
    
    // Clear prefetched predictions for new page
    prefetchedPredictions.current.clear();
  }, [pathname, enableBehaviorTracking, debug]);

  // Get and update predictions
  const updatePredictions = useCallback(async () => {
    if (!enabled) return;

    try {
      const rawPredictions = userBehaviorTracker.getPredictedPages(pathname, maxPredictions * 2);
      
      // Filter by confidence threshold
      const filteredPredictions = rawPredictions
        .filter(p => p.confidence >= confidenceThreshold)
        .slice(0, maxPredictions);

      // Add prefetch status
      const predictionsWithStatus: PredictionResult[] = filteredPredictions.map(p => ({
        ...p,
        prefetched: prefetchedPredictions.current.has(p.path)
      }));

      setPredictions(predictionsWithStatus);

      if (debug && predictionsWithStatus.length > 0) {
        console.log('[PredictivePrefetch] Updated predictions:', predictionsWithStatus);
      }
    } catch (error) {
      console.warn('[PredictivePrefetch] Failed to update predictions:', error);
    }
  }, [enabled, pathname, maxPredictions, confidenceThreshold, debug]);

  // Prefetch predicted routes
  const prefetchPredictions = useCallback(async () => {
    if (!enabled) return;

    const unprefetchedPredictions = predictions.filter(p => !p.prefetched);
    
    if (unprefetchedPredictions.length === 0) return;

    try {
      // Prefetch routes
      const routesToPrefetch = unprefetchedPredictions.map(p => p.path);
      await prefetchRoutes(routesToPrefetch, { priority: 'low' });

      // Prefetch resources if enabled
      if (enableResourcePrefetch) {
        for (const prediction of unprefetchedPredictions) {
          await prefetchUtils.prefetchForRoute(prediction.path);
        }
      }

      // Mark as prefetched
      unprefetchedPredictions.forEach(p => {
        prefetchedPredictions.current.add(p.path);
      });

      // Update predictions state
      setPredictions(prev => prev.map(p => ({
        ...p,
        prefetched: prefetchedPredictions.current.has(p.path)
      })));

      if (debug) {
        console.log('[PredictivePrefetch] Prefetched predictions:', routesToPrefetch);
      }
    } catch (error) {
      console.warn('[PredictivePrefetch] Failed to prefetch predictions:', error);
    }
  }, [enabled, predictions, prefetchRoutes, enableResourcePrefetch, debug]);

  // Track user behavior and trigger prefetching
  useEffect(() => {
    if (!enabled) return;

    let idleTimer: NodeJS.Timeout;
    let engagementTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
      setUserBehavior('active');
      
      // Clear timers
      clearTimeout(idleTimer);
      clearTimeout(engagementTimer);
      
      // Set new timers
      idleTimer = setTimeout(() => {
        setUserBehavior('idle');
        updatePredictions();
      }, 3000); // 3 seconds idle
      
      engagementTimer = setTimeout(() => {
        setUserBehavior('engaged');
        prefetchPredictions();
      }, 10000); // 10 seconds engaged
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserBehavior('leaving');
        // Aggressive prefetch when leaving
        prefetchPredictions();
      } else {
        updateActivity();
      }
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial activity
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(idleTimer);
      clearTimeout(engagementTimer);
    };
  }, [enabled, updatePredictions, prefetchPredictions]);

  // Update predictions when pathname changes
  useEffect(() => {
    if (enabled) {
      // Small delay to let the page settle
      const timer = setTimeout(updatePredictions, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, enabled, updatePredictions]);

  // Manual prefetch function
  const manualPrefetch = useCallback(async (path: string) => {
    if (!enabled) return;

    try {
      await prefetchRoute(path, { priority: 'high' });
      
      if (enableResourcePrefetch) {
        await prefetchUtils.prefetchForRoute(path);
      }
      
      prefetchedPredictions.current.add(path);
      
      if (debug) {
        console.log(`[PredictivePrefetch] Manual prefetch completed: ${path}`);
      }
    } catch (error) {
      console.warn(`[PredictivePrefetch] Manual prefetch failed for ${path}:`, error);
    }
  }, [enabled, prefetchRoute, enableResourcePrefetch, debug]);

  // Get behavior statistics
  const getBehaviorStats = useCallback(() => {
    return userBehaviorTracker.getSessionStats();
  }, []);

  return {
    predictions,
    userBehavior,
    prefetchPredictions,
    manualPrefetch,
    updatePredictions,
    getBehaviorStats,
    isEnabled: enabled
  };
}

// Hook for hover-based predictive prefetching
export function useHoverPredictivePrefetch(enabled: boolean = true) {
  const { manualPrefetch } = usePredictivePrefetch({ enabled });
  const hoverTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleLinkHover = useCallback((href: string, delay: number = 300) => {
    if (!enabled) return;

    // Clear existing timeout for this link
    const existingTimeout = hoverTimeouts.current.get(href);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
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

  // Cleanup on unmount
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

// Hook for scroll-based predictive prefetching
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

      // Trigger prefetch at certain scroll milestones
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
