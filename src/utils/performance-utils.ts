/**
 * Performance Utilities
 * Helper functions for optimizing application performance
 */

import { PERFORMANCE_CONFIG } from '../config/performance-config';

// Request queue for managing concurrent requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = PERFORMANCE_CONFIG.API.CONCURRENT_REQUESTS;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (request) {
      request();
    }
  }
}

// Global request queue instance
const requestQueue = new RequestQueue();

/**
 * Optimized fetch wrapper with performance enhancements
 */
export async function optimizedFetch(
  url: string,
  options: RequestInit = {},
  timeout: number = PERFORMANCE_CONFIG.API.DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const optimizedOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      // Performance optimizations
      keepalive: true,
      headers: {
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
    };

    const response = await fetch(url, optimizedOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = PERFORMANCE_CONFIG.API.REQUEST_DEBOUNCE
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Parallel request executor with concurrency control
 */
export async function executeParallel<T>(
  requests: Array<() => Promise<T>>,
  maxConcurrency: number = PERFORMANCE_CONFIG.API.CONCURRENT_REQUESTS
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    
    const promise = requestQueue.add(request).then(result => {
      results[i] = result;
    });
    
    executing.push(promise);

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = PERFORMANCE_CONFIG.API.MAX_RETRIES,
  baseDelay: number = PERFORMANCE_CONFIG.API.RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Cache with TTL (Time To Live)
 */
class TTLCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL: number = PERFORMANCE_CONFIG.CACHE.STALE_TIME) {
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const apiCache = new TTLCache(PERFORMANCE_CONFIG.CACHE.STALE_TIME);
export const assessmentCache = new TTLCache(PERFORMANCE_CONFIG.ASSESSMENT.SUBMISSION_TIMEOUT);

/**
 * Cached API call wrapper
 */
export async function cachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = apiCache.get(key);
  if (cached) {
    console.log(`Cache hit for key: ${key}`);
    return cached as T;
  }

  // Make API call and cache result
  console.log(`Cache miss for key: ${key}, making API call`);
  const result = await apiCall();
  apiCache.set(key, result, ttl);
  return result;
}

/**
 * Performance measurement decorator
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    if (!PERFORMANCE_CONFIG.MONITORING.TRACK_PERFORMANCE) {
      return fn(...args);
    }

    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      console.log(`Performance: ${name} completed in ${duration.toFixed(2)}ms`);
      
      // Report to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }) as T;
}

/**
 * Batch API calls to reduce network overhead
 */
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly processor: (batch: T[]) => Promise<R[]>;

  constructor(
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);

      // Process immediately if batch is full
      if (this.batch.length >= this.batchSize) {
        this.processBatch().then(results => {
          resolve(results[results.length - 1]);
        }).catch(reject);
        return;
      }

      // Schedule batch processing
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatch().then(results => {
          resolve(results[results.length - 1]);
        }).catch(reject);
      }, this.batchDelay);
    });
  }

  private async processBatch(): Promise<R[]> {
    if (this.batch.length === 0) {
      return [];
    }

    const currentBatch = [...this.batch];
    this.batch = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    return await this.processor(currentBatch);
  }
}

// Cleanup function for performance optimization
export function performanceCleanup(): void {
  // Clean up caches
  apiCache.cleanup();
  assessmentCache.cleanup();
  
  // Clear any pending timeouts
  if (typeof window !== 'undefined') {
    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(performanceCleanup, 300000);
}

export default {
  optimizedFetch,
  debounce,
  throttle,
  executeParallel,
  retryWithBackoff,
  apiCache,
  assessmentCache,
  cachedApiCall,
  measurePerformance,
  BatchProcessor,
  performanceCleanup,
};
