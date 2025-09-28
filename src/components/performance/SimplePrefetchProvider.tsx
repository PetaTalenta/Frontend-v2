'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface SimplePrefetchProviderProps {
  children: React.ReactNode;
  enablePrefetch?: boolean;
  enableCaching?: boolean;
  debug?: boolean;
}

// Simple and safe prefetch provider
export default function SimplePrefetchProvider({
  children,
  enablePrefetch = true,
  enableCaching = true,
  debug = process.env.NODE_ENV === 'development'
}: SimplePrefetchProviderProps) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize basic performance optimizations
  useEffect(() => {
    const initializeOptimizations = async () => {
      try {
        if (typeof window === 'undefined') return;

        if (debug) {
          console.log('[SimplePrefetchProvider] Initializing optimizations...');
        }

        // Basic font preloading
        if (enablePrefetch) {
          const criticalFonts = [
            '/fonts/geist-sans.woff2',
            '/fonts/geist-mono.woff2'
          ];

          criticalFonts.forEach(fontUrl => {
            const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
            if (!existingLink) {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.href = fontUrl;
              link.as = 'font';
              link.type = 'font/woff2';
              link.crossOrigin = 'anonymous';
              document.head.appendChild(link);
            }
          });

          if (debug) {
            console.log('[SimplePrefetchProvider] Critical fonts preloaded');
          }
        }

        // Basic caching setup
        if (enableCaching && 'localStorage' in window) {
          // Simple cache initialization
          const cacheKey = 'FutureGuide_cache_init';
          const cacheData = {
            initialized: true,
            timestamp: Date.now(),
            version: '1.0.0'
          };
          
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            if (debug) {
              console.log('[SimplePrefetchProvider] Basic caching initialized');
            }
          } catch (error) {
            console.warn('[SimplePrefetchProvider] LocalStorage not available:', error);
          }
        }

        setIsInitialized(true);
        
        if (debug) {
          console.log('[SimplePrefetchProvider] Initialization complete');
        }
      } catch (error) {
        console.warn('[SimplePrefetchProvider] Initialization failed:', error);
        setIsInitialized(true); // Continue even if initialization fails
      }
    };

    initializeOptimizations();
  }, [enablePrefetch, enableCaching, debug]);

  // Track page changes
  useEffect(() => {
    if (debug && isInitialized) {
      console.log(`[SimplePrefetchProvider] Page changed: ${pathname}`);
    }
  }, [pathname, debug, isInitialized]);

  return (
    <>
      {children}
      
      {/* Simple debug indicator */}
      {debug && isInitialized && (
        <SimpleDebugIndicator 
          pathname={pathname}
          enablePrefetch={enablePrefetch}
          enableCaching={enableCaching}
        />
      )}
    </>
  );
}

// Simple debug indicator
function SimpleDebugIndicator({
  pathname,
  enablePrefetch,
  enableCaching
}: {
  pathname: string;
  enablePrefetch: boolean;
  enableCaching: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-green-600 text-white px-2 py-1 rounded text-xs shadow-lg"
        title="Performance Status"
      >
        🚀
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 bg-black text-white p-3 rounded shadow-lg text-xs min-w-48">
          <h4 className="font-bold mb-2 text-green-400">Performance Status</h4>
          
          <div className="space-y-1">
            <p>Path: <span className="text-blue-300">{pathname}</span></p>
            <p>Prefetch: <span className={enablePrefetch ? 'text-green-300' : 'text-red-300'}>
              {enablePrefetch ? 'Enabled' : 'Disabled'}
            </span></p>
            <p>Caching: <span className={enableCaching ? 'text-green-300' : 'text-red-300'}>
              {enableCaching ? 'Enabled' : 'Disabled'}
            </span></p>
            <p>Status: <span className="text-green-300">Active</span></p>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <button
              onClick={() => {
                console.log('[SimplePrefetchProvider] Manual cache clear');
                localStorage.clear();
                sessionStorage.clear();
                alert('Cache cleared!');
              }}
              className="text-xs bg-red-600 text-white px-2 py-1 rounded"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple prefetch hook for links
export function useSimplePrefetch() {
  const prefetchedRoutes = React.useRef(new Set<string>());

  const prefetchRoute = React.useCallback((href: string) => {
    if (typeof window === 'undefined' || prefetchedRoutes.current.has(href)) {
      return;
    }

    try {
      // Use Next.js built-in prefetch if available
      if (window.next && window.next.router) {
        window.next.router.prefetch(href);
      } else {
        // Fallback: create a hidden link to trigger browser prefetch
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
        
        // Remove after a short delay
        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        }, 1000);
      }

      prefetchedRoutes.current.add(href);
      console.log(`[useSimplePrefetch] Prefetched: ${href}`);
    } catch (error) {
      console.warn(`[useSimplePrefetch] Failed to prefetch ${href}:`, error);
    }
  }, []);

  return { prefetchRoute };
}

// Simple prefetch link component
export function SimplePrefetchLink({
  href,
  children,
  prefetchOnHover = true,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  prefetchOnHover?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const { prefetchRoute } = useSimplePrefetch();

  const handleMouseEnter = React.useCallback(() => {
    if (prefetchOnHover) {
      prefetchRoute(href);
    }
  }, [href, prefetchOnHover, prefetchRoute]);

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </a>
  );
}

// Export types for compatibility
export type { SimplePrefetchProviderProps };
