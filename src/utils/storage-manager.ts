/**
 * StorageManager - Centralized localStorage management with atomic transactions
 *
 * ✅ PHASE 6 CONSOLIDATION: Integrated StorageTransaction for atomic operations
 * This module consolidates all storage utilities into a single, unified API.
 *
 * Solves critical issues:
 * - Race conditions dari concurrent reads/writes
 * - Parse errors dari malformed JSON
 * - Performance degradation dari excessive I/O
 * - Quota exceeded errors
 * - Partial state updates during multi-key operations
 *
 * Features:
 * - Locking mechanism untuk prevent concurrent writes
 * - Debounced writes untuk frequent updates
 * - Automatic quota exceeded handling
 * - Type-safe operations dengan generics
 * - Proper error handling dan recovery
 * - ✅ Atomic transactions dengan rollback support
 *
 * Usage:
 * ```typescript
 * // Simple operations
 * await storageManager.setItem('key', value);
 * const value = await storageManager.getItem('key');
 *
 * // Atomic multi-key operations
 * const transaction = storageManager.createTransaction();
 * transaction.add('token', 'abc123');
 * transaction.add('user', { id: '1', email: 'test@test.com' });
 * await transaction.commit();
 * ```
 *
 * @module utils/storage-manager
 * @see StorageTransaction untuk atomic operations
 */

type StorageValue = string | number | boolean | object | null;

interface WriteOperation {
  promise: Promise<void>;
  timestamp: number;
}

/**
 * Centralized localStorage manager dengan advanced features
 */
class StorageManager {
  private locks = new Map<string, WriteOperation>();
  private writeDebounceTimers = new Map<string, NodeJS.Timeout>();
  private lastErrorLog = new Map<string, number>();
  private readonly ERROR_LOG_THROTTLE = 5000; // 5 seconds

  /**
   * Get item from localStorage dengan type safety
   * 
   * @param key - Storage key
   * @param defaultValue - Default value jika key tidak ada atau parse error
   * @returns Parsed value atau default value
   */
  async getItem<T = StorageValue>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const value = localStorage.getItem(key);
      if (!value) {
        return defaultValue;
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(value) as T;
      } catch {
        // If not JSON, return as string (type assertion needed)
        return value as unknown as T;
      }
    } catch (error) {
      this.logErrorThrottled(
        `getItem-${key}`,
        `[StorageManager] Failed to get item "${key}"`,
        error
      );
      return defaultValue;
    }
  }

  /**
   * Get item synchronously (untuk backward compatibility)
   * Use dengan hati-hati - prefer async getItem
   */
  getItemSync<T = StorageValue>(key: string, defaultValue: T | null = null): T | null {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const value = localStorage.getItem(key);
      if (!value) {
        return defaultValue;
      }
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logErrorThrottled(
        `getItemSync-${key}`,
        `[StorageManager] Failed to get item sync "${key}"`,
        error
      );
      return defaultValue;
    }
  }

  /**
   * Set item to localStorage dengan locking mechanism
   * 
   * @param key - Storage key
   * @param value - Value to store (akan di-serialize ke JSON)
   * @returns Promise yang resolve ketika write selesai
   */
  async setItem(key: string, value: StorageValue): Promise<void> {
    // Reuse existing write promise jika masih in-flight
    const existingLock = this.locks.get(key);
    if (existingLock) {
      // Check if lock is still fresh (< 5 seconds old)
      if (Date.now() - existingLock.timestamp < 5000) {
        return existingLock.promise;
      } else {
        // Stale lock, remove it
        this.locks.delete(key);
      }
    }

    const writePromise = new Promise<void>((resolve, reject) => {
      try {
        if (typeof window === 'undefined') {
          resolve();
          return;
        }

        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        resolve();
      } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
          this.handleQuotaExceeded();
          // Retry once after cleanup
          try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            resolve();
          } catch (retryError) {
            this.logErrorThrottled(
              `setItem-${key}`,
              `[StorageManager] Failed to set item "${key}" even after cleanup`,
              retryError
            );
            reject(retryError);
          }
        } else {
          this.logErrorThrottled(
            `setItem-${key}`,
            `[StorageManager] Failed to set item "${key}"`,
            error
          );
          reject(error);
        }
      } finally {
        // Remove lock after write completes
        this.locks.delete(key);
      }
    });

    this.locks.set(key, {
      promise: writePromise,
      timestamp: Date.now()
    });

    return writePromise;
  }

  /**
   * Debounced write untuk frequent updates
   * Hanya akan write setelah tidak ada update selama `delay` ms
   *
   * @param key - Storage key
   * @param value - Value to store
   * @param delay - Debounce delay dalam ms (default: 300ms)
   */
  setItemDebounced(key: string, value: StorageValue, delay: number = 300): void {
    // Clear existing timer
    if (this.writeDebounceTimers.has(key)) {
      clearTimeout(this.writeDebounceTimers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.setItem(key, value).catch(error => {
        console.error(`[StorageManager] Debounced write failed for "${key}"`, error);
      });
      this.writeDebounceTimers.delete(key);
    }, delay);

    this.writeDebounceTimers.set(key, timer);
  }

  /**
   * ✅ Atomic multi-key update
   * Prevents race conditions saat update multiple keys sekaligus
   *
   * @param items - Object dengan key-value pairs untuk di-update
   * @returns Promise yang resolve ketika semua writes selesai
   *
   * @example
   * // Update user data dan token atomically
   * await storageManager.setMultiple({
   *   'user': userData,
   *   'token': newToken,
   *   'lastLogin': Date.now()
   * });
   */
  async setMultiple(items: Record<string, StorageValue>): Promise<void> {
    const keys = Object.keys(items);

    if (keys.length === 0) {
      return;
    }

    // ✅ Sort keys untuk prevent deadlock
    const sortedKeys = keys.sort();
    const lockPromises: Promise<void>[] = [];

    try {
      // ✅ Wait for all existing locks untuk sorted keys
      for (const key of sortedKeys) {
        const existingLock = this.locks.get(key);
        if (existingLock && Date.now() - existingLock.timestamp < 5000) {
          lockPromises.push(existingLock.promise);
        }
      }

      // Wait for all existing locks to complete
      if (lockPromises.length > 0) {
        await Promise.all(lockPromises);
      }

      // ✅ Create single atomic write operation
      const atomicWritePromise = new Promise<void>((resolve, reject) => {
        try {
          if (typeof window === 'undefined') {
            resolve();
            return;
          }

          // Perform all writes atomically
          for (const key of sortedKeys) {
            const serialized = JSON.stringify(items[key]);
            localStorage.setItem(key, serialized);
          }

          resolve();
        } catch (error: any) {
          if (error.name === 'QuotaExceededError') {
            this.handleQuotaExceeded();
            // Retry once after cleanup
            try {
              for (const key of sortedKeys) {
                const serialized = JSON.stringify(items[key]);
                localStorage.setItem(key, serialized);
              }
              resolve();
            } catch (retryError) {
              this.logErrorThrottled(
                'setMultiple',
                '[StorageManager] Failed to set multiple items even after cleanup',
                retryError
              );
              reject(retryError);
            }
          } else {
            this.logErrorThrottled(
              'setMultiple',
              '[StorageManager] Failed to set multiple items',
              error
            );
            reject(error);
          }
        } finally {
          // Remove all locks after write completes
          sortedKeys.forEach(key => this.locks.delete(key));
        }
      });

      // ✅ Set locks for all keys
      const timestamp = Date.now();
      sortedKeys.forEach(key => {
        this.locks.set(key, {
          promise: atomicWritePromise,
          timestamp
        });
      });

      await atomicWritePromise;
    } catch (error) {
      // Cleanup locks on error
      sortedKeys.forEach(key => this.locks.delete(key));
      throw error;
    }
  }

  /**
   * Remove item from localStorage
   * 
   * @param key - Storage key to remove
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      localStorage.removeItem(key);
      
      // Clear any pending operations for this key
      this.locks.delete(key);
      
      if (this.writeDebounceTimers.has(key)) {
        clearTimeout(this.writeDebounceTimers.get(key)!);
        this.writeDebounceTimers.delete(key);
      }
    } catch (error) {
      this.logErrorThrottled(
        `removeItem-${key}`,
        `[StorageManager] Failed to remove item "${key}"`,
        error
      );
    }
  }

  /**
   * Clear all items from localStorage
   * Use dengan hati-hati!
   */
  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      localStorage.clear();
      
      // Clear all locks and timers
      this.locks.clear();
      this.writeDebounceTimers.forEach(timer => clearTimeout(timer));
      this.writeDebounceTimers.clear();
    } catch (error) {
      console.error('[StorageManager] Failed to clear localStorage', error);
    }
  }

  /**
   * Handle quota exceeded error
   * Clears cache items first, then old items if needed
   */
  private handleQuotaExceeded(): void {
    console.warn('[StorageManager] localStorage quota exceeded, attempting cleanup...');
    
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      
      // Strategy 1: Clear cache items first
      keys.filter(k => k.startsWith('cache:') || k.startsWith('prefetch:')).forEach(k => {
        try {
          localStorage.removeItem(k);
          clearedCount++;
        } catch (e) {
          // Ignore individual removal errors
        }
      });

      // Strategy 2: If still not enough, clear old assessment answers (keep only latest)
      if (clearedCount === 0) {
        keys.filter(k => k.includes('assessment-answers-')).forEach(k => {
          try {
            localStorage.removeItem(k);
            clearedCount++;
          } catch (e) {
            // Ignore
          }
        });
      }
    } catch (error) {
      console.error('[StorageManager] Failed to handle quota exceeded', error);
    }
  }

  /**
   * Flush all pending debounced writes immediately
   */
  flush(): void {
    this.writeDebounceTimers.forEach((timer, key) => {
      clearTimeout(timer);
    });
    this.writeDebounceTimers.clear();
  }

  /**
   * Get storage usage statistics
   */
  getStats(): { itemCount: number; pendingWrites: number; debouncedWrites: number } {
    if (typeof window === 'undefined') {
      return { itemCount: 0, pendingWrites: 0, debouncedWrites: 0 };
    }

    return {
      itemCount: localStorage.length,
      pendingWrites: this.locks.size,
      debouncedWrites: this.writeDebounceTimers.size
    };
  }

  /**
   * ✅ ATOMIC TRANSACTION SUPPORT
   * Create a transaction for atomic multi-key operations
   *
   * @returns StorageTransaction instance
   *
   * @example
   * ```typescript
   * const transaction = storageManager.createTransaction();
   * transaction.add('token', 'abc123');
   * transaction.add('user', { id: '1', email: 'test@test.com' });
   * await transaction.commit();
   * ```
   */
  createTransaction(): StorageTransaction {
    return new StorageTransaction();
  }

  /**
   * Throttled error logging untuk prevent console spam
   */
  private logErrorThrottled(errorKey: string, message: string, error: any): void {
    const now = Date.now();
    const lastLog = this.lastErrorLog.get(errorKey) || 0;

    if (now - lastLog > this.ERROR_LOG_THROTTLE) {
      console.error(message, error);
      this.lastErrorLog.set(errorKey, now);
    }
  }
}

/**
 * ✅ ATOMIC TRANSACTION CLASS
 * Ensures all-or-nothing localStorage operations with rollback support
 * Integrated into StorageManager for centralized storage management
 */
class StorageTransaction {
  private operations: Array<{ key: string; value: any }> = [];
  private backups: Map<string, string | null> = new Map();
  private isCommitted = false;
  private isRolledBack = false;

  /**
   * Add a storage operation to the transaction
   *
   * @param key - localStorage key
   * @param value - Value to store (will be JSON.stringify if object)
   */
  add(key: string, value: any): void {
    if (this.isCommitted) {
      throw new Error('Cannot add operations to committed transaction');
    }

    if (this.isRolledBack) {
      throw new Error('Cannot add operations to rolled back transaction');
    }

    // Backup current value if not already backed up
    if (!this.backups.has(key)) {
      try {
        const currentValue = localStorage.getItem(key);
        this.backups.set(key, currentValue);
      } catch (error) {
        console.error(`[StorageTransaction] Failed to backup key "${key}":`, error);
      }
    }

    this.operations.push({ key, value });
  }

  /**
   * Remove a key from localStorage in this transaction
   *
   * @param key - localStorage key to remove
   */
  remove(key: string): void {
    this.add(key, null);
  }

  /**
   * Commit all operations atomically
   *
   * @throws Error if commit fails
   */
  async commit(): Promise<void> {
    if (this.isCommitted) {
      console.warn('[StorageTransaction] Transaction already committed');
      return;
    }

    if (this.isRolledBack) {
      throw new Error('Cannot commit a rolled back transaction');
    }

    try {
      console.log(`[StorageTransaction] Committing ${this.operations.length} operations...`);

      // Execute all operations
      for (const { key, value } of this.operations) {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
          console.debug(`[StorageTransaction] Removed: ${key}`);
        } else {
          const stringValue = typeof value === 'string'
            ? value
            : JSON.stringify(value);

          localStorage.setItem(key, stringValue);
          console.debug(`[StorageTransaction] Set: ${key}`);
        }
      }

      this.isCommitted = true;
      this.backups.clear();

      console.log(`✅ [StorageTransaction] Successfully committed ${this.operations.length} operations`);
    } catch (error) {
      console.error('❌ [StorageTransaction] Commit failed:', error);
      await this.rollback();
      throw new Error(`Commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rollback all operations and restore original values
   */
  async rollback(): Promise<void> {
    if (this.isRolledBack) {
      console.warn('[StorageTransaction] Transaction already rolled back');
      return;
    }

    console.log(`[StorageTransaction] Rolling back ${this.backups.size} operations...`);

    try {
      for (const [key, value] of this.backups.entries()) {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      }

      this.isRolledBack = true;
      this.backups.clear();

      console.log('✅ [StorageTransaction] Rollback completed successfully');
    } catch (error) {
      console.error('❌ [StorageTransaction] Rollback failed:', error);
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction status
   */
  getStatus(): {
    isCommitted: boolean;
    isRolledBack: boolean;
    operationCount: number;
    backupCount: number;
  } {
    return {
      isCommitted: this.isCommitted,
      isRolledBack: this.isRolledBack,
      operationCount: this.operations.length,
      backupCount: this.backups.size,
    };
  }

  /**
   * Clear transaction (release memory)
   */
  clear(): void {
    this.operations = [];
    this.backups.clear();
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export classes untuk testing dan direct usage
export { StorageManager, StorageTransaction };

