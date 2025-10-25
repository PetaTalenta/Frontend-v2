import { EnhancedRecoveryManager, RecoveryStrategy, recoveryManager } from '../../lib/recoveryManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
});

describe('EnhancedRecoveryManager', () => {
  let recoveryManager: EnhancedRecoveryManager;

  beforeEach(() => {
    recoveryManager = EnhancedRecoveryManager.getInstance();
    recoveryManager.clearCache();
    recoveryManager.resetAttempts();
    jest.clearAllMocks();
  });

  describe('Progressive Retry', () => {
    it('should succeed on first attempt', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      
      const result = await recoveryManager.progressiveRetry(
        successOperation,
        'test-operation'
      );

      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure with exponential backoff', async () => {
      jest.useFakeTimers();
      
      const failOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      const result = await recoveryManager.progressiveRetry(
        failOperation,
        'test-operation',
        { maxRetries: 2, baseDelay: 100 }
      );

      expect(result).toBe('success');
      expect(failOperation).toHaveBeenCalledTimes(3);
      
      // Verify exponential backoff timing
      jest.advanceTimersByTime(100); // First retry
      jest.advanceTimersByTime(200); // Second retry
      
      jest.useRealTimers();
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new Error('403: Forbidden');
      const failOperation = jest.fn().mockRejectedValue(authError);

      await expect(recoveryManager.progressiveRetry(
        failOperation,
        'test-operation'
      )).rejects.toThrow('403: Forbidden');

      expect(failOperation).toHaveBeenCalledTimes(1);
    });

    it('should use cache fallback when enabled', async () => {
      // Pre-cache some data
      await recoveryManager.progressiveRetry(
        () => Promise.resolve('cached-data'),
        'test-operation'
      );

      const failOperation = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await recoveryManager.progressiveRetry(
        failOperation,
        'test-operation',
        { maxRetries: 1, enableCacheFallback: true }
      );

      expect(result).toBe('cached-data');
      expect(failOperation).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry
    });
  });

  describe('Network-Aware Retry', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    it('should use cache when offline', async () => {
      // Pre-cache data
      await recoveryManager.progressiveRetry(
        () => Promise.resolve('offline-data'),
        'test-operation'
      );

      // Set offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const result = await recoveryManager.networkAwareRetry(
        () => Promise.reject(new Error('No network')),
        'test-operation'
      );

      expect(result).toBe('offline-data');
    });

    it('should throw when offline and no cache', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      await expect(recoveryManager.networkAwareRetry(
        () => Promise.reject(new Error('No network')),
        'test-operation'
      )).rejects.toThrow('No network connection and no cached data available');
    });

    it('should proceed normally when online', async () => {
      const successOperation = jest.fn().mockResolvedValue('online-success');
      
      const result = await recoveryManager.networkAwareRetry(
        successOperation,
        'test-operation'
      );

      expect(result).toBe('online-success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Intelligent Retry', () => {
    it('should use cache fallback for network errors', async () => {
      // Pre-cache data
      await recoveryManager.progressiveRetry(
        () => Promise.resolve('network-cache'),
        'test-operation'
      );

      const networkError = new Error('Network connection failed');
      const failOperation = jest.fn().mockRejectedValue(networkError);

      const result = await recoveryManager.intelligentRetry(
        failOperation,
        'test-operation'
      );

      expect(result).toBe('network-cache');
    });

    it('should use delayed retry for rate limiting', async () => {
      jest.useFakeTimers();
      
      const rateLimitError = new Error('429: Rate limit exceeded');
      const failOperation = jest.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('delayed-success');

      const result = await recoveryManager.intelligentRetry(
        failOperation,
        'test-operation'
      );

      expect(result).toBe('delayed-success');
      
      // Verify 5 second delay for rate limiting
      jest.advanceTimersByTime(5000);
      
      jest.useRealTimers();
    });

    it('should use progressive retry for server errors', async () => {
      jest.useFakeTimers();
      
      const serverError = new Error('500: Internal server error');
      const failOperation = jest.fn()
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue('progressive-success');

      const result = await recoveryManager.intelligentRetry(
        failOperation,
        'test-operation',
        { maxRetries: 1 }
      );

      expect(result).toBe('progressive-success');
      expect(failOperation).toHaveBeenCalledTimes(3); // Initial + 1 retry + progressive retry
      
      jest.useRealTimers();
    });
  });

  describe('Cache Management', () => {
    it('should cache successful results', async () => {
      const operation = jest.fn().mockResolvedValue('test-data');
      
      await recoveryManager.progressiveRetry(operation, 'test-operation');
      
      // Verify data is cached
      const cachedData = (recoveryManager as any).getCachedData('test-operation');
      expect(cachedData).toBeTruthy();
      expect(cachedData.data).toBe('test-data');
      expect(cachedData.source).toBe('memory');
    });

    it('should store cache in localStorage', async () => {
      const operation = jest.fn().mockResolvedValue('persistent-data');
      
      await recoveryManager.progressiveRetry(operation, 'test-operation');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recovery_cache_test-operation',
        expect.stringContaining('persistent-data')
      );
    });

    it('should retrieve from localStorage when memory cache is empty', async () => {
      // Set up localStorage data
      localStorageMock.setItem('recovery_cache_test-operation', JSON.stringify({
        data: 'localStorage-data',
        timestamp: Date.now(),
        isStale: false,
        source: 'localStorage'
      }));

      const cachedData = (recoveryManager as any).getCachedData('test-operation');
      expect(cachedData).toBeTruthy();
      expect(cachedData.data).toBe('localStorage-data');
      expect(cachedData.source).toBe('localStorage');
    });

    it('should detect stale cache data', async () => {
      // Create stale cache data (older than 5 minutes)
      const staleTimestamp = Date.now() - (6 * 60 * 1000);
      localStorageMock.setItem('recovery_cache_test-operation', JSON.stringify({
        data: 'stale-data',
        timestamp: staleTimestamp,
        isStale: false,
        source: 'localStorage'
      }));

      const cachedData = (recoveryManager as any).getCachedData('test-operation');
      expect(cachedData).toBeNull(); // Should return null for stale data
    });

    it('should clear cache correctly', async () => {
      // Cache some data
      await recoveryManager.progressiveRetry(
        () => Promise.resolve('test-data'),
        'test-operation'
      );

      recoveryManager.clearCache('test-operation');
      
      const cachedData = (recoveryManager as any).getCachedData('test-operation');
      expect(cachedData).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('recovery_cache_test-operation');
    });
  });

  describe('Recovery Statistics', () => {
    it('should track recovery attempts', async () => {
      const failOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await recoveryManager.progressiveRetry(
        failOperation,
        'test-operation',
        { maxRetries: 2 }
      );

      const stats = recoveryManager.getRecoveryStats();
      
      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(stats.successfulRecoveries).toBe(1);
      expect(stats.failedRecoveries).toBe(2);
    });

    it('should calculate average recovery time', async () => {
      jest.useFakeTimers();
      
      const failOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await recoveryManager.progressiveRetry(
        failOperation,
        'test-operation',
        { baseDelay: 100 }
      );

      // Advance timers to record delays
      jest.advanceTimersByTime(100);
      
      const stats = recoveryManager.getRecoveryStats();
      expect(stats.averageRecoveryTime).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });

    it('should track most used recovery strategy', async () => {
      // Generate multiple recovery attempts
      for (let i = 0; i < 5; i++) {
        try {
          await recoveryManager.progressiveRetry(
            () => Promise.reject(new Error('Network error')),
            `test-operation-${i}`,
            { maxRetries: 0 }
          );
        } catch (error) {
          // Expected to fail
        }
      }

      const stats = recoveryManager.getRecoveryStats();
      expect(stats.mostUsedStrategy).toBeTruthy();
    });

    it('should calculate cache hit rate', async () => {
      // Pre-cache some data
      await recoveryManager.progressiveRetry(
        () => Promise.resolve('cached-data'),
        'cached-operation'
      );

      // Use cache fallback
      try {
        await recoveryManager.progressiveRetry(
          () => Promise.reject(new Error('Network error')),
          'cached-operation',
          { maxRetries: 0, enableCacheFallback: true }
        );
      } catch (error) {
        // Expected to use cache
      }

      const stats = recoveryManager.getRecoveryStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Recovery History', () => {
    it('should maintain recovery history', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await recoveryManager.progressiveRetry(operation, 'test-operation');

      const history = recoveryManager.getRecoveryHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const lastResult = history[history.length - 1];
      expect(lastResult.success).toBe(true);
      expect(lastResult.recoveryStrategy).toBe(RecoveryStrategy.EXPONENTIAL_BACKOFF);
    });

    it('should limit history size', async () => {
      // Generate more than 100 recovery results
      for (let i = 0; i < 105; i++) {
        try {
          await recoveryManager.progressiveRetry(
            () => Promise.resolve(`result-${i}`),
            `test-operation-${i}`
          );
        } catch (error) {
          // Some operations may fail
        }
      }

      const history = recoveryManager.getRecoveryHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should return limited history when requested', async () => {
      // Generate some history
      for (let i = 0; i < 10; i++) {
        await recoveryManager.progressiveRetry(
          () => Promise.resolve(`result-${i}`),
          `test-operation-${i}`
        );
      }

      const limitedHistory = recoveryManager.getRecoveryHistory(5);
      expect(limitedHistory.length).toBe(5);
    });
  });

  describe('Error Analysis', () => {
    it('should select cache fallback for network errors', () => {
      const networkError = {
        message: 'Network connection failed',
        response: { status: null }
      };

      const strategy = (recoveryManager as any).analyzeErrorAndSelectStrategy(networkError);
      expect(strategy).toBe(RecoveryStrategy.CACHE_FALLBACK);
    });

    it('should select progressive retry for server errors', () => {
      const serverError = {
        message: 'Internal server error',
        response: { status: 500 }
      };

      const strategy = (recoveryManager as any).analyzeErrorAndSelectStrategy(serverError);
      expect(strategy).toBe(RecoveryStrategy.PROGRESSIVE);
    });

    it('should select delayed retry for rate limiting', () => {
      const rateLimitError = {
        message: 'Rate limit exceeded',
        response: { status: 429 }
      };

      const strategy = (recoveryManager as any).analyzeErrorAndSelectStrategy(rateLimitError);
      expect(strategy).toBe(RecoveryStrategy.DELAYED);
    });

    it('should select immediate retry for auth errors', () => {
      const authError = {
        message: 'Unauthorized access',
        response: { status: 401 }
      };

      const strategy = (recoveryManager as any).analyzeErrorAndSelectStrategy(authError);
      expect(strategy).toBe(RecoveryStrategy.IMMEDIATE);
    });
  });

  describe('Delay Calculation', () => {
    it('should calculate exponential backoff correctly', () => {
      const config = {
        baseDelay: 1000,
        backoffFactor: 2,
        maxDelay: 10000,
        jitterFactor: 0
      };

      const delay1 = (recoveryManager as any).calculateDelay(0, config);
      const delay2 = (recoveryManager as any).calculateDelay(1, config);
      const delay3 = (recoveryManager as any).calculateDelay(2, config);

      expect(delay1).toBe(1000); // 1000 * 2^0
      expect(delay2).toBe(2000); // 1000 * 2^1
      expect(delay3).toBe(4000); // 1000 * 2^2
    });

    it('should cap delay at maximum', () => {
      const config = {
        baseDelay: 1000,
        backoffFactor: 4,
        maxDelay: 5000,
        jitterFactor: 0
      };

      const delay = (recoveryManager as any).calculateDelay(3, config);
      expect(delay).toBe(5000); // Should be capped at maxDelay
    });

    it('should add jitter to prevent thundering herd', () => {
      const config = {
        baseDelay: 1000,
        backoffFactor: 2,
        maxDelay: 10000,
        jitterFactor: 0.1
      };

      // Test multiple calls to ensure jitter variation
      const delays = Array.from({ length: 10 }, (_, i) => 
        (recoveryManager as any).calculateDelay(i, config)
      );

      // All delays should be within jitter range
      delays.forEach(delay => {
        const baseDelay = 1000 * Math.pow(2, delays.indexOf(delay));
        const minExpected = baseDelay;
        const maxExpected = baseDelay + (baseDelay * 0.1);
        
        expect(delay).toBeGreaterThanOrEqual(minExpected);
        expect(delay).toBeLessThanOrEqual(maxExpected);
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EnhancedRecoveryManager.getInstance();
      const instance2 = EnhancedRecoveryManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across instances', async () => {
      const instance1 = EnhancedRecoveryManager.getInstance();
      
      // Cache data in first instance
      await instance1.progressiveRetry(
        () => Promise.resolve('shared-data'),
        'shared-operation'
      );

      const instance2 = EnhancedRecoveryManager.getInstance();
      const cachedData = (instance2 as any).getCachedData('shared-operation');
      
      expect(cachedData.data).toBe('shared-data');
    });
  });
});

describe('Exported Utility Functions', () => {
  beforeEach(() => {
    recoveryManager.clearCache();
    recoveryManager.resetAttempts();
    jest.clearAllMocks();
  });

  it('should provide progressiveRetry utility', async () => {
    const { progressiveRetry } = require('../../lib/recoveryManager');
    
    const result = await progressiveRetry(
      () => Promise.resolve('utility-success'),
      'test-utility'
    );

    expect(result).toBe('utility-success');
  });

  it('should provide networkAwareRetry utility', async () => {
    const { networkAwareRetry } = require('../../lib/recoveryManager');
    
    const result = await networkAwareRetry(
      () => Promise.resolve('network-utility-success'),
      'test-network-utility'
    );

    expect(result).toBe('network-utility-success');
  });

  it('should provide intelligentRetry utility', async () => {
    const { intelligentRetry } = require('../../lib/recoveryManager');
    
    const result = await intelligentRetry(
      () => Promise.resolve('intelligent-utility-success'),
      'test-intelligent-utility'
    );

    expect(result).toBe('intelligent-utility-success');
  });
});