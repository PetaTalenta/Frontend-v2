/**
 * CDN Configuration for PetaTalenta Frontend
 * Centralized configuration for CDN integration and asset optimization
 */

export const CDN_CONFIG = {
  // CDN Provider Settings
  PROVIDER: process.env.CDN_PROVIDER || 'cloudflare', // 'cloudflare' | 'aws' | 'vercel'

  // CDN URLs - only use in production or when explicitly enabled
  BASE_URL: process.env.CDN_BASE_URL || '',
  IMAGES_URL: process.env.CDN_IMAGES_URL || '',
  STATIC_URL: process.env.CDN_STATIC_URL || '',

  // CDN enabled flag
  ENABLED: process.env.NODE_ENV === 'production' && process.env.CDN_BASE_URL ? true : false,
  
  // Asset Optimization
  OPTIMIZATION: {
    // Image formats in order of preference
    IMAGE_FORMATS: ['image/avif', 'image/webp', 'image/jpeg'],
    
    // Image quality settings
    IMAGE_QUALITY: {
      high: 90,
      medium: 75,
      low: 60,
      thumbnail: 50
    },
    
    // Image sizes for responsive images
    IMAGE_SIZES: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920],
    
    // Device sizes for responsive images
    DEVICE_SIZES: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Font optimization
    FONT_PRELOAD: [
      '/fonts/geist-sans.woff2',
      '/fonts/geist-mono.woff2'
    ],
    
    // Critical CSS inlining
    INLINE_CRITICAL_CSS: process.env.NODE_ENV === 'production',
    
    // Asset compression
    COMPRESSION: {
      gzip: true,
      brotli: true,
      level: 9
    }
  },
  
  // Caching Strategy
  CACHE: {
    // Static assets (images, fonts, etc.)
    STATIC_ASSETS: {
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 86400, // 1 day
      immutable: true
    },
    
    // JavaScript and CSS bundles
    BUNDLES: {
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 3600, // 1 hour
      immutable: true
    },
    
    // HTML pages
    HTML: {
      maxAge: 3600, // 1 hour
      staleWhileRevalidate: 300, // 5 minutes
      immutable: false
    },
    
    // API responses
    API: {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 60, // 1 minute
      immutable: false
    },
    
    // Assessment results (longer cache)
    ASSESSMENT_RESULTS: {
      maxAge: 86400, // 1 day
      staleWhileRevalidate: 3600, // 1 hour
      immutable: false
    }
  },
  
  // Performance Settings
  PERFORMANCE: {
    // Preload critical resources
    PRELOAD_CRITICAL: true,
    
    // Prefetch next page resources
    PREFETCH_PAGES: ['/', '/auth', '/assessment', '/results'],
    
    // Resource hints
    DNS_PREFETCH: [
      'https://fonts.googleapis.com',
      'https://api.chhrone.web.id'
    ],
    
    // Preconnect to critical origins
    PRECONNECT: [
      'https://fonts.gstatic.com'
    ],
    
    // Service Worker caching
    SW_CACHE_STRATEGIES: {
      images: 'CacheFirst',
      static: 'CacheFirst',
      api: 'NetworkFirst',
      pages: 'StaleWhileRevalidate'
    }
  },
  
  // Security Headers
  SECURITY: {
    // Content Security Policy for CDN
    CSP_SOURCES: {
      'img-src': ['self', 'data:', 'https://images.petatalenta.com'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
      'script-src': ['self', 'unsafe-eval', 'unsafe-inline']
    },
    
    // CORS settings
    CORS: {
      origin: ['https://petatalenta.com', 'https://www.petatalenta.com'],
      credentials: true
    }
  },
  
  // Monitoring and Analytics
  MONITORING: {
    // Performance monitoring
    TRACK_PERFORMANCE: true,
    
    // CDN analytics
    TRACK_CDN_USAGE: true,
    
    // Error tracking for CDN failures
    TRACK_CDN_ERRORS: true,
    
    // Bandwidth monitoring
    TRACK_BANDWIDTH: true
  },
  
  // Fallback Configuration
  FALLBACK: {
    // Fallback to local assets if CDN fails
    ENABLE_FALLBACK: true,
    
    // Timeout for CDN requests
    TIMEOUT: 5000, // 5 seconds
    
    // Retry attempts
    RETRY_ATTEMPTS: 2,
    
    // Local asset paths
    LOCAL_PATHS: {
      images: '/images',
      static: '/static',
      fonts: '/fonts'
    }
  }
} as const;

/**
 * Get CDN URL for asset
 */
export function getCDNUrl(assetPath: string, type: 'image' | 'static' | 'font' = 'static'): string {
  // Return local path if CDN is disabled or not configured
  if (!CDN_CONFIG.ENABLED || !CDN_CONFIG.BASE_URL) {
    return assetPath;
  }

  const baseUrl = type === 'image' ? CDN_CONFIG.IMAGES_URL : CDN_CONFIG.STATIC_URL;

  // Return local path if specific CDN URL is not configured
  if (!baseUrl) {
    return assetPath;
  }

  // Ensure path starts with /
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  return `${baseUrl}${normalizedPath}`;
}

/**
 * Get optimized image URL with CDN
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: keyof typeof CDN_CONFIG.OPTIMIZATION.IMAGE_QUALITY;
    format?: string;
  } = {}
): string {
  const { width, height, quality = 'medium', format } = options;
  
  const baseUrl = getCDNUrl(src, 'image');
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality) params.set('q', CDN_CONFIG.OPTIMIZATION.IMAGE_QUALITY[quality].toString());
  if (format) params.set('f', format);
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

/**
 * Generate cache headers for different asset types
 */
export function getCacheHeaders(assetType: keyof typeof CDN_CONFIG.CACHE): Record<string, string> {
  const config = CDN_CONFIG.CACHE[assetType];
  
  return {
    'Cache-Control': `public, max-age=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}${config.immutable ? ', immutable' : ''}`,
    'Vary': 'Accept-Encoding',
    'X-CDN-Cache': 'MISS' // Will be updated by CDN
  };
}

/**
 * Check if CDN is available
 */
export async function checkCDNHealth(): Promise<boolean> {
  // Return false if CDN is not enabled or configured
  if (!CDN_CONFIG.ENABLED || !CDN_CONFIG.BASE_URL) {
    return false;
  }

  try {
    const response = await fetch(`${CDN_CONFIG.BASE_URL}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(CDN_CONFIG.FALLBACK.TIMEOUT)
    });
    return response.ok;
  } catch {
    return false;
  }
}
