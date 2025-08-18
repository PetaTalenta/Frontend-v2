// Resource prefetching system for critical assets

interface ResourcePrefetchOptions {
  priority?: 'high' | 'low';
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossOrigin?: 'anonymous' | 'use-credentials';
  type?: string;
  media?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

interface PrefetchedResource {
  url: string;
  type: string;
  timestamp: number;
  status: 'loading' | 'loaded' | 'error';
  element?: HTMLLinkElement;
}

class ResourcePrefetcher {
  private prefetchedResources = new Map<string, PrefetchedResource>();
  private loadingResources = new Set<string>();
  private maxConcurrentPrefetches = 6; // Browser connection limit
  private prefetchQueue: Array<{ url: string; options: ResourcePrefetchOptions }> = [];

  // Prefetch a single resource
  async prefetchResource(url: string, options: ResourcePrefetchOptions = {}): Promise<void> {
    // Skip if already prefetched or loading
    if (this.prefetchedResources.has(url) || this.loadingResources.has(url)) {
      return;
    }

    // Check concurrent limit
    if (this.loadingResources.size >= this.maxConcurrentPrefetches) {
      this.prefetchQueue.push({ url, options });
      return;
    }

    return this.executePrefetch(url, options);
  }

  private async executePrefetch(url: string, options: ResourcePrefetchOptions): Promise<void> {
    const {
      priority = 'low',
      as = 'fetch',
      crossOrigin,
      type,
      media,
      onLoad,
      onError
    } = options;

    this.loadingResources.add(url);

    const resource: PrefetchedResource = {
      url,
      type: as,
      timestamp: Date.now(),
      status: 'loading'
    };

    this.prefetchedResources.set(url, resource);

    try {
      // Create prefetch link element
      const link = document.createElement('link');
      link.rel = priority === 'high' ? 'preload' : 'prefetch';
      link.href = url;
      link.as = as;

      if (crossOrigin) {
        link.crossOrigin = crossOrigin;
      }

      if (type) {
        link.type = type;
      }

      if (media) {
        link.media = media;
      }

      // Handle load/error events
      link.onload = () => {
        resource.status = 'loaded';
        this.loadingResources.delete(url);
        onLoad?.();
        this.processQueue();
        console.log(`[ResourcePrefetcher] Successfully prefetched: ${url}`);
      };

      link.onerror = (error) => {
        resource.status = 'error';
        this.loadingResources.delete(url);
        onError?.(error);
        this.processQueue();
        console.warn(`[ResourcePrefetcher] Failed to prefetch: ${url}`, error);
      };

      // Add to document head
      document.head.appendChild(link);
      resource.element = link;

    } catch (error) {
      resource.status = 'error';
      this.loadingResources.delete(url);
      this.processQueue();
      console.error(`[ResourcePrefetcher] Error prefetching ${url}:`, error);
    }
  }

  private processQueue(): void {
    if (this.prefetchQueue.length === 0 || this.loadingResources.size >= this.maxConcurrentPrefetches) {
      return;
    }

    const next = this.prefetchQueue.shift();
    if (next) {
      this.executePrefetch(next.url, next.options);
    }
  }

  // Prefetch multiple resources
  async prefetchResources(resources: Array<{ url: string; options?: ResourcePrefetchOptions }>): Promise<void> {
    const promises = resources.map(({ url, options = {} }) => 
      this.prefetchResource(url, options)
    );
    
    await Promise.allSettled(promises);
  }

  // Check if resource is prefetched
  isPrefetched(url: string): boolean {
    const resource = this.prefetchedResources.get(url);
    return resource?.status === 'loaded';
  }

  // Get prefetch statistics
  getStats() {
    const resources = Array.from(this.prefetchedResources.values());
    return {
      total: resources.length,
      loaded: resources.filter(r => r.status === 'loaded').length,
      loading: resources.filter(r => r.status === 'loading').length,
      errors: resources.filter(r => r.status === 'error').length,
      queueSize: this.prefetchQueue.length,
      resources: resources.map(r => ({
        url: r.url,
        type: r.type,
        status: r.status,
        age: Date.now() - r.timestamp
      }))
    };
  }

  // Clear prefetched resources
  clear(): void {
    // Remove link elements from DOM
    this.prefetchedResources.forEach(resource => {
      if (resource.element && resource.element.parentNode) {
        resource.element.parentNode.removeChild(resource.element);
      }
    });

    this.prefetchedResources.clear();
    this.loadingResources.clear();
    this.prefetchQueue.length = 0;
  }
}

// Singleton instance
export const resourcePrefetcher = new ResourcePrefetcher();

// Predefined resource sets for common scenarios
export const RESOURCE_SETS = {
  // Critical fonts
  FONTS: [
    {
      url: '/fonts/geist-sans.woff2',
      options: {
        as: 'font' as const,
        type: 'font/woff2',
        crossOrigin: 'anonymous' as const,
        priority: 'high' as const
      }
    },
    {
      url: '/fonts/geist-mono.woff2',
      options: {
        as: 'font' as const,
        type: 'font/woff2',
        crossOrigin: 'anonymous' as const,
        priority: 'high' as const
      }
    }
  ],

  // Critical images
  IMAGES: [
    {
      url: '/logo.png',
      options: {
        as: 'image' as const,
        priority: 'high' as const
      }
    },
    {
      url: '/favicon.ico',
      options: {
        as: 'image' as const,
        priority: 'high' as const
      }
    }
  ],

  // Dashboard-specific resources
  DASHBOARD: [
    {
      url: '/api/auth/profile',
      options: {
        as: 'fetch' as const,
        priority: 'high' as const
      }
    },
    {
      url: '/api/assessment/archive',
      options: {
        as: 'fetch' as const,
        priority: 'low' as const
      }
    }
  ],

  // Assessment-specific resources
  ASSESSMENT: [
    {
      url: '/api/assessment/questions',
      options: {
        as: 'fetch' as const,
        priority: 'high' as const
      }
    }
  ]
};

// Route-based resource prefetching
export const ROUTE_RESOURCES: Record<string, Array<{ url: string; options?: ResourcePrefetchOptions }>> = {
  '/': [
    ...RESOURCE_SETS.FONTS,
    ...RESOURCE_SETS.IMAGES
  ],
  '/dashboard': [
    ...RESOURCE_SETS.FONTS,
    ...RESOURCE_SETS.IMAGES,
    ...RESOURCE_SETS.DASHBOARD
  ],
  '/assessment': [
    ...RESOURCE_SETS.FONTS,
    ...RESOURCE_SETS.ASSESSMENT
  ],
  '/results': [
    ...RESOURCE_SETS.FONTS,
    ...RESOURCE_SETS.IMAGES
  ]
};

// Utility functions
export const prefetchUtils = {
  // Prefetch resources for a specific route
  async prefetchForRoute(route: string): Promise<void> {
    const resources = ROUTE_RESOURCES[route];
    if (resources) {
      await resourcePrefetcher.prefetchResources(resources);
    }
  },

  // Prefetch critical resources immediately
  async prefetchCritical(): Promise<void> {
    const criticalResources = [
      ...RESOURCE_SETS.FONTS,
      ...RESOURCE_SETS.IMAGES
    ];
    await resourcePrefetcher.prefetchResources(criticalResources);
  },

  // Prefetch based on user behavior
  async prefetchPredictive(currentRoute: string, userBehavior: 'idle' | 'active' | 'leaving'): Promise<void> {
    const nextRoutes = getPredictedRoutes(currentRoute, userBehavior);
    
    for (const route of nextRoutes) {
      await prefetchUtils.prefetchForRoute(route);
    }
  },

  // Prefetch images in viewport
  async prefetchVisibleImages(): Promise<void> {
    const images = document.querySelectorAll('img[data-src]');
    const imageUrls: Array<{ url: string; options?: ResourcePrefetchOptions }> = [];

    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        imageUrls.push({
          url: src,
          options: {
            as: 'image',
            priority: 'low'
          }
        });
      }
    });

    if (imageUrls.length > 0) {
      await resourcePrefetcher.prefetchResources(imageUrls);
    }
  }
};

// Helper function to predict next routes
function getPredictedRoutes(currentRoute: string, behavior: 'idle' | 'active' | 'leaving'): string[] {
  const predictions: Record<string, Record<string, string[]>> = {
    '/': {
      idle: ['/dashboard', '/auth'],
      active: ['/auth'],
      leaving: ['/dashboard']
    },
    '/auth': {
      idle: ['/dashboard'],
      active: ['/dashboard'],
      leaving: ['/dashboard']
    },
    '/dashboard': {
      idle: ['/assessment', '/results'],
      active: ['/assessment'],
      leaving: ['/results']
    },
    '/assessment': {
      idle: ['/results'],
      active: ['/results'],
      leaving: ['/dashboard']
    },
    '/results': {
      idle: ['/dashboard', '/assessment'],
      active: ['/dashboard'],
      leaving: ['/dashboard']
    }
  };

  return predictions[currentRoute]?.[behavior] || [];
}
