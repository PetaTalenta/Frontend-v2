// Enhanced Service Worker for FutureGuide with advanced caching strategies
// Version 2.0 - Phase 2 Implementation

const CACHE_VERSION = '2.0';
const STATIC_CACHE = `FutureGuide-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `FutureGuide-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `FutureGuide-api-v${CACHE_VERSION}`;

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days for static assets
  API: 5 * 60 * 1000, // 5 minutes for API responses
  ASSESSMENT: 60 * 60 * 1000, // 1 hour for assessment results
  PROFILE: 10 * 60 * 1000, // 10 minutes for profile data
};

// Critical assets to cache immediately on install
const CRITICAL_ASSETS = [
  '/',
  '/auth',
  '/dashboard',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png'
];

// API endpoints with their specific cache strategies
const API_STRATEGIES = {
  // Profile data - stale while revalidate with 10 min TTL
  '/api/auth/profile': {
    strategy: 'staleWhileRevalidate',
    ttl: CACHE_TTL.PROFILE,
    cacheName: API_CACHE
  },
  
  // Assessment results - network first with 1 hour TTL
  '/api/archive/results/': {
    strategy: 'networkFirst',
    ttl: CACHE_TTL.ASSESSMENT,
    cacheName: API_CACHE
  },
  
  // Schools data - cache first with 1 day TTL
  '/api/auth/schools': {
    strategy: 'cacheFirst',
    ttl: 24 * 60 * 60 * 1000,
    cacheName: API_CACHE
  },
  
  // Auth endpoints - network only (no caching)
  '/api/auth/login': { strategy: 'networkOnly' },
  '/api/auth/register': { strategy: 'networkOnly' },
  '/api/auth/logout': { strategy: 'networkOnly' },
  '/api/auth/refresh': { strategy: 'networkOnly' }
};

// Cache metadata storage
const CACHE_METADATA = 'cache-metadata';

// Store cache timestamps for TTL validation
class CacheMetadataManager {
  static set(key, ttl) {
    const metadata = this.getMetadata();
    metadata[key] = {
      timestamp: Date.now(),
      ttl: ttl
    };
    localStorage.setItem(CACHE_METADATA, JSON.stringify(metadata));
  }

  static get(key) {
    const metadata = this.getMetadata();
    const item = metadata[key];
    if (!item) return null;

    const isExpired = (Date.now() - item.timestamp) > item.ttl;
    if (isExpired) {
      this.delete(key);
      return null;
    }

    return item;
  }

  static delete(key) {
    const metadata = this.getMetadata();
    delete metadata[key];
    localStorage.setItem(CACHE_METADATA, JSON.stringify(metadata));
  }

  static getMetadata() {
    try {
      const stored = localStorage.getItem(CACHE_METADATA);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static clear() {
    localStorage.removeItem(CACHE_METADATA);
  }
}

// Enhanced caching strategies
class CacheStrategies {
  static async cacheFirst(request, options = {}) {
    const cache = await caches.open(options.cacheName || STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && this.isValidCache(request, cachedResponse)) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
        if (options.ttl) {
          CacheMetadataManager.set(request.url, options.ttl);
        }
      }
      return networkResponse;
    } catch (error) {
      if (cachedResponse) {
        return cachedResponse; // Return stale cache if network fails
      }
      throw error;
    }
  }

  static async networkFirst(request, options = {}) {
    const cache = await caches.open(options.cacheName || DYNAMIC_CACHE);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
        if (options.ttl) {
          CacheMetadataManager.set(request.url, options.ttl);
        }
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse && this.isValidCache(request, cachedResponse)) {
        return cachedResponse;
      }
      throw error;
    }
  }

  static async staleWhileRevalidate(request, options = {}) {
    const cache = await caches.open(options.cacheName || DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Always try to fetch from network in background
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
        if (options.ttl) {
          CacheMetadataManager.set(request.url, options.ttl);
        }
      }
      return networkResponse;
    }).catch(() => {
      // Network failed, that's okay
    });

    // Return cached version immediately if valid
    if (cachedResponse && this.isValidCache(request, cachedResponse)) {
      // Trigger network fetch in background but don't wait
      fetchPromise;
      return cachedResponse;
    }

    // No valid cache, wait for network
    return fetchPromise;
  }

  static isValidCache(request, response) {
    const metadata = CacheMetadataManager.get(request.url);
    return metadata !== null; // null means expired or not found
  }
}

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker v2.0: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      }),
      
      // Preload important fonts
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll([
          '/fonts/geist-sans.woff2',
          '/fonts/geist-mono.woff2'
        ]);
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker v2.0: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old version caches
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      CacheMetadataManager.clear(); // Clear old metadata
      return self.clients.claim();
    })
  );
});

// Enhanced fetch event with smart caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-http protocols
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Route requests to appropriate strategies
  if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(CacheStrategies.cacheFirst(request, {
      cacheName: STATIC_CACHE,
      ttl: CACHE_TTL.STATIC
    }));
  } else if (isPageRequest(request)) {
    event.respondWith(CacheStrategies.staleWhileRevalidate(request, {
      cacheName: DYNAMIC_CACHE,
      ttl: CACHE_TTL.API
    }));
  } else {
    event.respondWith(CacheStrategies.networkFirst(request, {
      cacheName: DYNAMIC_CACHE
    }));
  }
});

// Handle API requests with specific strategies
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Find matching strategy
  const strategy = Object.keys(API_STRATEGIES).find(key => pathname.startsWith(key));
  const config = strategy ? API_STRATEGIES[strategy] : { strategy: 'networkFirst' };
  
  switch (config.strategy) {
    case 'cacheFirst':
      return CacheStrategies.cacheFirst(request, config);
    case 'networkFirst':
      return CacheStrategies.networkFirst(request, config);
    case 'staleWhileRevalidate':
      return CacheStrategies.staleWhileRevalidate(request, config);
    case 'networkOnly':
    default:
      return fetch(request);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-assessment') {
    console.log('Service Worker: Syncing assessment data');
    event.waitUntil(syncAssessmentData());
  } else if (event.tag === 'background-sync-profile') {
    console.log('Service Worker: Syncing profile data');
    event.waitUntil(syncProfileData());
  }
});

async function syncAssessmentData() {
  // Sync offline assessment results
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (request.url.includes('/api/assessment/')) {
        try {
          const response = await cache.match(request);
          const data = await response.json();
          
          // Try to sync with server
          await fetch(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          // Remove from cache after successful sync
          await cache.delete(request);
        } catch (error) {
          console.log('Sync failed for:', request.url, error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncProfileData() {
  // Similar sync logic for profile updates
  console.log('Profile sync completed');
}

// Enhanced push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: true,
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MANAGEMENT') {
    switch (event.data.action) {
      case 'clearCache':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
      case 'skipWaiting':
        self.skipWaiting();
        break;
      case 'updateCache':
        updateSpecificCache(event.data.url);
        break;
    }
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  CacheMetadataManager.clear();
}

async function updateSpecificCache(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(url, response);
    }
  } catch (error) {
    console.error('Failed to update cache:', url, error);
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.woff') ||
    url.pathname.includes('.woff2') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.jpg') ||
    url.pathname.includes('.jpeg') ||
    url.pathname.includes('.svg') ||
    url.pathname.includes('.ico')
  );
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isPageRequest(request) {
  const url = new URL(request.url);
  return (
    request.headers.get('accept')?.includes('text/html') &&
    !url.pathname.startsWith('/api/') &&
    !isStaticAsset(request)
  );
}

console.log('Service Worker v2.0 loaded successfully');
