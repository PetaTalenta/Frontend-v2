/**
 * Debounced localStorage utility for optimizing frequent write operations
 * Prevents excessive localStorage writes that can block the main thread
 */

interface DebouncedStorageOptions {
  delay?: number; // Delay in milliseconds, default 300ms
  maxSize?: number; // Maximum number of items in queue, default 10
}

class DebouncedStorage {
  private queue: Map<string, any> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;
  private maxSize: number;

  constructor(options: DebouncedStorageOptions = {}) {
    this.delay = options.delay || 300;
    this.maxSize = options.maxSize || 10;
  }

  /**
   * Queue a localStorage write operation
   */
  set(key: string, value: any): void {
    // Add to queue
    this.queue.set(key, value);

    // If queue is too large, flush immediately
    if (this.queue.size >= this.maxSize) {
      this.flush();
      return;
    }

    // Debounce the flush
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  /**
   * Immediately write all queued items to localStorage
   */
  flush(): void {
    if (this.queue.size === 0) return;

    try {
      // Process all queued items
      for (const [key, value] of this.queue) {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    } finally {
      // Clear queue and timeout
      this.queue.clear();
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  /**
   * Get value from localStorage immediately (not debounced)
   */
  get(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove item from localStorage immediately (not debounced)
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  /**
   * Clear all localStorage items
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Get all keys in localStorage
   */
  keys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Handle localStorage quota exceeded error
   */
  private handleQuotaExceeded(): void {
    console.warn('LocalStorage quota exceeded, attempting to clear old data...');
    
    // Try to clear old assessment data first
    const keysToRemove = this.keys().filter(key => 
      key.includes('assessment-') || 
      key.includes('flagged-questions') ||
      key.includes('cache-')
    );

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing key "${key}" during quota cleanup:`, error);
      }
    });

    // Try to flush remaining queue
    if (this.queue.size > 0) {
      try {
        for (const [key, value] of this.queue) {
          if (value === null || value === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        }
      } catch (error) {
        console.error('Still unable to write to localStorage after cleanup:', error);
      }
    }
  }

  /**
   * Destroy the debounced storage and clean up
   */
  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.flush();
  }
}

// Create a singleton instance for the entire app
const debouncedStorage = new DebouncedStorage({
  delay: 300,
  maxSize: 10
});

// Export convenience functions
export const setDebounced = (key: string, value: any) => debouncedStorage.set(key, value);
export const getDebounced = (key: string) => debouncedStorage.get(key);
export const removeDebounced = (key: string) => debouncedStorage.remove(key);
export const clearDebounced = () => debouncedStorage.clear();
export const flushDebounced = () => debouncedStorage.flush();
export const keysDebounced = () => debouncedStorage.keys();

// Export the class for advanced usage
export { DebouncedStorage };

// Auto-flush on page unload to ensure data is saved
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    debouncedStorage.flush();
  });
}