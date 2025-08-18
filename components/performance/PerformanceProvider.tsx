'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceProviderProps {
  children: React.ReactNode;
  userId?: string;
  enablePrefetch?: boolean;
  enableCaching?: boolean;
  enableBackgroundSync?: boolean;
  enableBehaviorTracking?: boolean;
  debug?: boolean;
}

export default function PerformanceProvider({
  children,
  userId,
  enablePrefetch = true,
  enableCaching = true,
  enableBackgroundSync = true,
  enableBehaviorTracking = true,
  debug = process.env.NODE_ENV === 'development'
}: PerformanceProviderProps) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize performance optimizations
  useEffect(() => {
    const initializePerformance = async () => {
      try {
        if (debug) {
          console.log('[PerformanceProvider] Initializing performance optimizations...');
        }

        // Initialize prefetch for critical resources
        if (enablePrefetch && typeof window !== 'undefined') {
          // Prefetch critical fonts
          const fontLinks = [
            '/fonts/geist-sans.woff2',
            '/fonts/geist-mono.woff2'
          ];

          fontLinks.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = fontUrl;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';

            if (!document.querySelector(`link[href="${fontUrl}"]`)) {
              document.head.appendChild(link);
            }
          });

          if (debug) {
            console.log('[PerformanceProvider] Critical fonts prefetched');
          }
        }

        // Initialize caching
        if (enableCaching && typeof window !== 'undefined' && 'indexedDB' in window) {
          // Basic cache initialization
          if (debug) {
            console.log('[PerformanceProvider] IndexedDB caching available');
          }
        }

        // Track page view for behavior analysis
        if (enableBehaviorTracking) {
          if (debug) {
            console.log(`[PerformanceProvider] Tracking page view: ${pathname}`);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.warn('[PerformanceProvider] Failed to initialize:', error);
        setIsInitialized(true); // Continue even if some features fail
      }
    };

    initializePerformance();
  }, [pathname, enablePrefetch, enableCaching, enableBehaviorTracking, debug]);

  // Log performance stats in debug mode
  useEffect(() => {
    if (debug && isInitialized) {
      console.group('[PerformanceProvider] Performance Stats');
      console.log('Current Path:', pathname);
      console.log('Prefetch Enabled:', enablePrefetch);
      console.log('Caching Enabled:', enableCaching);
      console.log('Background Sync Enabled:', enableBackgroundSync);
      console.log('Behavior Tracking Enabled:', enableBehaviorTracking);
      console.groupEnd();
    }
  }, [debug, isInitialized, pathname, enablePrefetch, enableCaching, enableBackgroundSync, enableBehaviorTracking]);

  return (
    <>
      {children}

      {/* Debug panel for development */}
      {debug && isInitialized && (
        <PerformanceDebugPanel
          pathname={pathname}
          enablePrefetch={enablePrefetch}
          enableCaching={enableCaching}
          enableBackgroundSync={enableBackgroundSync}
          enableBehaviorTracking={enableBehaviorTracking}
        />
      )}
    </>
  );
}

// Debug panel for performance monitoring
function PerformanceDebugPanel({
  pathname,
  enablePrefetch,
  enableCaching,
  enableBackgroundSync,
  enableBehaviorTracking
}: {
  pathname: string;
  enablePrefetch: boolean;
  enableCaching: boolean;
  enableBackgroundSync: boolean;
  enableBehaviorTracking: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const updateStats = () => {
      const newStats = {
        pathname,
        timestamp: new Date().toLocaleTimeString(),
        features: {
          prefetch: enablePrefetch,
          caching: enableCaching,
          backgroundSync: enableBackgroundSync,
          behaviorTracking: enableBehaviorTracking
        },
        browser: {
          online: navigator.onLine,
          connection: (navigator as any).connection?.effectiveType || 'Unknown',
          memory: (performance as any).memory ?
            `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` :
            'Unknown'
        }
      };
      setStats(newStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [pathname, enablePrefetch, enableCaching, enableBackgroundSync, enableBehaviorTracking]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-purple-600 text-white px-3 py-1 rounded text-sm shadow-lg"
      >
        Performance Monitor
      </button>

      {isVisible && (
        <div className="absolute top-full right-0 mt-2 bg-black text-white p-4 rounded shadow-lg max-w-md text-xs max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">Performance Monitor</h3>

          <div className="mb-3">
            <h4 className="font-bold text-green-400">Current Status</h4>
            <p>Path: {stats.pathname}</p>
            <p>Updated: {stats.timestamp}</p>
          </div>

          <div className="mb-3">
            <h4 className="font-bold text-blue-400">Features</h4>
            <p>Prefetch: {stats.features?.prefetch ? '✅' : '❌'}</p>
            <p>Caching: {stats.features?.caching ? '✅' : '❌'}</p>
            <p>Background Sync: {stats.features?.backgroundSync ? '✅' : '❌'}</p>
            <p>Behavior Tracking: {stats.features?.behaviorTracking ? '✅' : '❌'}</p>
          </div>

          <div className="mb-3">
            <h4 className="font-bold text-yellow-400">Browser</h4>
            <p>Online: {stats.browser?.online ? 'Yes' : 'No'}</p>
            <p>Connection: {stats.browser?.connection}</p>
            <p>Memory: {stats.browser?.memory}</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-600 text-white px-2 py-1 rounded text-xs"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                  });
                }
                localStorage.clear();
                sessionStorage.clear();
                alert('All caches cleared!');
              }}
              className="block w-full bg-red-600 text-white px-2 py-1 rounded text-xs"
            >
              Clear All Caches
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Monitor memory usage if available
      const monitorMemory = () => {
        if ((performance as any).memory) {
          setMetrics((prev: any) => ({
            ...prev,
            memory: {
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit,
              timestamp: Date.now()
            }
          }));
        }
      };

      monitorMemory();
      const memoryInterval = setInterval(monitorMemory, 30000);

      return () => {
        clearInterval(memoryInterval);
      };
    } catch (error) {
      console.warn('[usePerformanceMonitoring] Performance monitoring not supported:', error);
    }
  }, []);

  return metrics;
}

// Component for measuring component render performance
export function PerformanceMeasure({
  name,
  children
}: {
  name: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`[PerformanceMeasure] ${name}: ${duration.toFixed(2)}ms`);
      };
    }
  }, [name]);

  return <>{children}</>;
}
