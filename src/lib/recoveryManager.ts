import { QueryClient } from '@tanstack/react-query';

// Enhanced recovery configuration
export interface RecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitterFactor: number;
  enableCacheFallback: boolean;
  enableProgressiveRetry: boolean;
  retryCondition?: (error: any) => boolean;
}

// Recovery attempt result
export interface RecoveryResult {
  success: boolean;
  attempt: number;
  totalAttempts: number;
  delay: number;
  error?: any;
  data?: any;
  recoveryStrategy: 'immediate' | 'delayed' | 'exponential' | 'cache_fallback';
}

// Recovery strategy types
export enum RecoveryStrategy {
  IMMEDIATE = 'immediate',
  DELAYED = 'delayed',
  EXPONENTIAL_BACKOFF = 'exponential',
  CACHE_FALLBACK = 'cache_fallback',
  PROGRESSIVE = 'progressive'
}

// Cache-based recovery data
export interface CacheRecoveryData<T = any> {
  data: T;
  timestamp: number;
  isStale: boolean;
  source: 'memory' | 'localStorage' | 'indexedDB';
}

// Enhanced Recovery Manager with progressive retry and cache fallback
export class EnhancedRecoveryManager {
  private static instance: EnhancedRecoveryManager;
  private queryClient: QueryClient;
  private recoveryAttempts = new Map<string, number>();
  private cacheData = new Map<string, CacheRecoveryData<any>>();
  private recoveryHistory: RecoveryResult[] = [];

  private constructor(queryClient?: QueryClient) {
    this.queryClient = queryClient || new QueryClient();
  }

  static getInstance(queryClient?: QueryClient): EnhancedRecoveryManager {
    if (!EnhancedRecoveryManager.instance) {
      EnhancedRecoveryManager.instance = new EnhancedRecoveryManager(queryClient);
    }
    return EnhancedRecoveryManager.instance;
  }

  // Progressive retry with exponential backoff and jitter
  async progressiveRetry<T>(
    operation: () => Promise<T>,
    operationKey: string,
    config: Partial<RecoveryConfig> = {}
  ): Promise<T> {
    const finalConfig: RecoveryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitterFactor: 0.1,
      enableCacheFallback: true,
      enableProgressiveRetry: true,
      retryCondition: (error: any) => {
        // Retry on network errors and 5xx server errors
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
      },
      ...config
    };

    let lastError: any;
    const attempts = this.recoveryAttempts.get(operationKey) || 0;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - reset attempt counter and cache result
        this.recoveryAttempts.delete(operationKey);
        this.cacheSuccessfulResult(operationKey, result);
        
        // Log successful recovery
        this.logRecoveryResult({
          success: true,
          attempt: attempt + 1,
          totalAttempts: finalConfig.maxRetries + 1,
          delay: 0,
          data: result,
          recoveryStrategy: attempt === 0 ? RecoveryStrategy.IMMEDIATE : RecoveryStrategy.EXPONENTIAL_BACKOFF
        });

        return result;
      } catch (error: any) {
        lastError = error;
        
        // Update attempt counter
        this.recoveryAttempts.set(operationKey, attempt + 1);

        // Check if we should retry
        if (attempt === finalConfig.maxRetries ||
            (finalConfig.retryCondition && !finalConfig.retryCondition(error))) {
          
          // Try cache fallback if enabled
          if (finalConfig.enableCacheFallback) {
            const cachedData = this.getCachedData(operationKey);
            if (cachedData) {
              this.logRecoveryResult({
                success: true,
                attempt: attempt + 1,
                totalAttempts: finalConfig.maxRetries + 1,
                delay: 0,
                data: cachedData.data,
                recoveryStrategy: RecoveryStrategy.CACHE_FALLBACK
              });
              return cachedData.data as T;
            }
          }
          
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, finalConfig);
        
        // Log failed attempt
        this.logRecoveryResult({
          success: false,
          attempt: attempt + 1,
          totalAttempts: finalConfig.maxRetries + 1,
          delay,
          error,
          recoveryStrategy: RecoveryStrategy.EXPONENTIAL_BACKOFF
        });

        // Wait before retry
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(attempt: number, config: RecoveryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    const finalDelay = cappedDelay + jitter;
    
    return Math.floor(finalDelay);
  }

  // Cache successful result for fallback
  private cacheSuccessfulResult<T>(key: string, data: T): void {
    const cacheData: CacheRecoveryData = {
      data,
      timestamp: Date.now(),
      isStale: false,
      source: 'memory'
    };
    
    this.cacheData.set(key, cacheData);
    
    // Also store in localStorage for persistence
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`recovery_cache_${key}`, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.warn('Failed to cache data to localStorage:', error);
    }
  }

  // Get cached data with fallback strategies
  private getCachedData<T>(key: string): CacheRecoveryData<T> | null {
    // Try memory cache first
    const memoryData = this.cacheData.get(key);
    if (memoryData && !this.isDataStale(memoryData)) {
      return memoryData;
    }

    // Try localStorage
    try {
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem(`recovery_cache_${key}`);
        if (storedData) {
          const parsedData: CacheRecoveryData<T> = JSON.parse(storedData);
          
          // Update memory cache
          this.cacheData.set(key, parsedData);
          
          if (!this.isDataStale(parsedData)) {
            return parsedData;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve cached data from localStorage:', error);
    }

    return null;
  }

  // Check if cached data is stale
  private isDataStale(cacheData: CacheRecoveryData): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - cacheData.timestamp > maxAge;
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Log recovery result for monitoring
  private logRecoveryResult(result: RecoveryResult): void {
    this.recoveryHistory.push(result);
    
    // Keep only recent history (last 100 results)
    if (this.recoveryHistory.length > 100) {
      this.recoveryHistory = this.recoveryHistory.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Recovery Result:', result);
    }
  }

  // Get recovery statistics
  getRecoveryStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageRecoveryTime: number;
    mostUsedStrategy: string;
    cacheHitRate: number;
  } {
    const totalAttempts = this.recoveryHistory.length;
    const successfulRecoveries = this.recoveryHistory.filter(r => r.success).length;
    const failedRecoveries = totalAttempts - successfulRecoveries;
    
    const averageRecoveryTime = this.recoveryHistory.length > 0
      ? this.recoveryHistory.reduce((sum, r) => sum + r.delay, 0) / this.recoveryHistory.length
      : 0;

    const strategyCounts = this.recoveryHistory.reduce((counts, r) => {
      counts[r.recoveryStrategy] = (counts[r.recoveryStrategy] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const mostUsedStrategy = Object.entries(strategyCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    const cacheHitRate = this.recoveryHistory.length > 0
      ? (this.recoveryHistory.filter(r => r.recoveryStrategy === RecoveryStrategy.CACHE_FALLBACK).length / this.recoveryHistory.length) * 100
      : 0;

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries,
      averageRecoveryTime,
      mostUsedStrategy,
      cacheHitRate
    };
  }

  // Clear recovery cache
  clearCache(operationKey?: string): void {
    if (operationKey) {
      this.cacheData.delete(operationKey);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`recovery_cache_${operationKey}`);
      }
    } else {
      // Clear all cache
      this.cacheData.clear();
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter(key => key.startsWith('recovery_cache_'))
          .forEach(key => localStorage.removeItem(key));
      }
    }
  }

  // Reset recovery attempts
  resetAttempts(operationKey?: string): void {
    if (operationKey) {
      this.recoveryAttempts.delete(operationKey);
    } else {
      this.recoveryAttempts.clear();
    }
  }

  // Get recovery history
  getRecoveryHistory(limit: number = 50): RecoveryResult[] {
    return this.recoveryHistory.slice(-limit);
  }

  // Network-aware recovery
  async networkAwareRetry<T>(
    operation: () => Promise<T>,
    operationKey: string,
    config: Partial<RecoveryConfig> = {}
  ): Promise<T> {
    // Check network status
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    
    if (!isOnline) {
      // Try cache fallback immediately when offline
      const cachedData = this.getCachedData<T>(operationKey);
      if (cachedData) {
        this.logRecoveryResult({
          success: true,
          attempt: 1,
          totalAttempts: 1,
          delay: 0,
          data: cachedData.data,
          recoveryStrategy: RecoveryStrategy.CACHE_FALLBACK
        });
        return cachedData.data;
      }
      
      // If no cache and offline, throw network error
      throw new Error('No network connection and no cached data available');
    }

    // If online, proceed with normal progressive retry
    return this.progressiveRetry(operation, operationKey, config);
  }

  // Intelligent retry based on error type
  async intelligentRetry<T>(
    operation: () => Promise<T>,
    operationKey: string,
    config: Partial<RecoveryConfig> = {}
  ): Promise<T> {
    try {
      return await this.progressiveRetry(operation, operationKey, config);
    } catch (error: any) {
      // Analyze error and apply specific recovery strategy
      const recoveryStrategy = this.analyzeErrorAndSelectStrategy(error);
      
      switch (recoveryStrategy) {
        case RecoveryStrategy.CACHE_FALLBACK:
          const cachedData = this.getCachedData<T>(operationKey);
          if (cachedData) {
            return cachedData.data;
          }
          break;
          
        case RecoveryStrategy.DELAYED:
          // Wait longer before final retry
          await this.delay(5000);
          return await operation();
          
        case RecoveryStrategy.PROGRESSIVE:
          // Use progressive retry with different config
          const progressiveConfig = {
            ...config,
            maxRetries: (config.maxRetries || 3) + 2,
            baseDelay: (config.baseDelay || 1000) * 2
          };
          return await this.progressiveRetry(operation, operationKey, progressiveConfig);
          
        default:
          throw error;
      }
      
      throw error;
    }
  }

  // Analyze error and select appropriate recovery strategy
  private analyzeErrorAndSelectStrategy(error: any): RecoveryStrategy {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStatus = error.response?.status;
    
    // Network errors - try cache fallback
    if (errorMessage.includes('network') || errorMessage.includes('connection') || !navigator.onLine) {
      return RecoveryStrategy.CACHE_FALLBACK;
    }
    
    // Server errors - use progressive retry
    if (errorStatus >= 500 && errorStatus < 600) {
      return RecoveryStrategy.PROGRESSIVE;
    }
    
    // Rate limiting - use delayed retry
    if (errorStatus === 429 || errorMessage.includes('rate limit')) {
      return RecoveryStrategy.DELAYED;
    }
    
    // Authentication errors - no retry, let it fail
    if (errorStatus === 401 || errorStatus === 403) {
      return RecoveryStrategy.IMMEDIATE;
    }
    
    // Default to exponential backoff
    return RecoveryStrategy.EXPONENTIAL_BACKOFF;
  }
}

// Export singleton instance
export const recoveryManager = EnhancedRecoveryManager.getInstance();

// Export utility functions
export const progressiveRetry = <T>(
  operation: () => Promise<T>,
  operationKey: string,
  config?: Partial<RecoveryConfig>
): Promise<T> => recoveryManager.progressiveRetry(operation, operationKey, config);

export const networkAwareRetry = <T>(
  operation: () => Promise<T>,
  operationKey: string,
  config?: Partial<RecoveryConfig>
): Promise<T> => recoveryManager.networkAwareRetry(operation, operationKey, config);

export const intelligentRetry = <T>(
  operation: () => Promise<T>,
  operationKey: string,
  config?: Partial<RecoveryConfig>
): Promise<T> => recoveryManager.intelligentRetry(operation, operationKey, config);

export default recoveryManager;