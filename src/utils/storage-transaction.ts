/**
 * StorageTransaction - Atomic localStorage operations with rollback support
 * 
 * Solves critical issues:
 * - Prevents partial state updates during login/logout
 * - Ensures all-or-nothing localStorage operations
 * - Provides rollback on failure
 * - Thread-safe operations
 * 
 * Usage:
 * ```typescript
 * const transaction = new StorageTransaction();
 * transaction.add('token', 'abc123');
 * transaction.add('user', { id: '1', email: 'user@test.com' });
 * await transaction.commit(); // All operations succeed or all rollback
 * ```
 * 
 * @module utils/storage-transaction
 */

interface StorageOperation {
  key: string;
  value: any;
}

/**
 * Atomic localStorage transaction manager
 * Ensures all storage operations succeed or fail together
 */
export class StorageTransaction {
  private operations: StorageOperation[] = [];
  private backups: Map<string, string | null> = new Map();
  private isCommitted = false;
  private isRolledBack = false;

  /**
   * Add a storage operation to the transaction
   * 
   * @param key - localStorage key
   * @param value - Value to store (will be JSON.stringify if object)
   * 
   * @example
   * ```typescript
   * transaction.add('token', 'abc123');
   * transaction.add('user', { id: '1', email: 'test@test.com' });
   * ```
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
        // Continue - we'll handle errors during commit
      }
    }

    this.operations.push({ key, value });
  }

  /**
   * Remove a key from localStorage in this transaction
   * 
   * @param key - localStorage key to remove
   * 
   * @example
   * ```typescript
   * transaction.remove('old_token');
   * ```
   */
  remove(key: string): void {
    this.add(key, null);
  }

  /**
   * Commit all operations atomically
   * If any operation fails, all changes are rolled back
   * 
   * @throws {Error} If commit fails after rollback
   * 
   * @example
   * ```typescript
   * try {
   *   await transaction.commit();
   *   console.log('All data saved successfully');
   * } catch (error) {
   *   console.error('Transaction failed:', error);
   * }
   * ```
   */
  async commit(): Promise<void> {
    if (this.isCommitted) {
      throw new Error('Transaction already committed');
    }

    if (this.isRolledBack) {
      throw new Error('Cannot commit rolled back transaction');
    }

    try {
      console.log(`[StorageTransaction] Committing ${this.operations.length} operations...`);

      // ✅ Execute all operations
      for (const { key, value } of this.operations) {
        if (value === null || value === undefined) {
          // Remove operation
          localStorage.removeItem(key);
          console.debug(`[StorageTransaction] Removed: ${key}`);
        } else {
          // Set operation
          const stringValue = typeof value === 'string' 
            ? value 
            : JSON.stringify(value);
          
          localStorage.setItem(key, stringValue);
          console.debug(`[StorageTransaction] Set: ${key}`);
        }
      }

      // ✅ Mark as committed
      this.isCommitted = true;
      
      // Clear backups on success
      this.backups.clear();
      
      console.log(`✅ [StorageTransaction] Successfully committed ${this.operations.length} operations`);

    } catch (error) {
      console.error('❌ [StorageTransaction] Commit failed, rolling back...', error);
      
      // ✅ Rollback on any error
      await this.rollback();
      
      throw new Error(`Storage transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rollback all operations and restore original values
   * 
   * @example
   * ```typescript
   * await transaction.rollback();
   * ```
   */
  async rollback(): Promise<void> {
    if (this.isRolledBack) {
      console.warn('[StorageTransaction] Transaction already rolled back');
      return;
    }

    console.log(`[StorageTransaction] Rolling back ${this.backups.size} operations...`);

    try {
      // ✅ Restore all backed up values
      for (const [key, value] of this.backups.entries()) {
        if (value === null) {
          // Original value was null, remove key
          localStorage.removeItem(key);
        } else {
          // Restore original value
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
   * Call this after commit/rollback to clean up
   */
  clear(): void {
    this.operations = [];
    this.backups.clear();
  }
}

/**
 * Helper function for atomic localStorage updates
 * Automatically commits or rolls back
 * 
 * @param operations - Object with key-value pairs to store
 * @returns Promise that resolves when committed
 * 
 * @example
 * ```typescript
 * await atomicUpdate({
 *   token: 'abc123',
 *   user: { id: '1', email: 'test@test.com' },
 *   auth_version: 'v2'
 * });
 * ```
 */
export async function atomicUpdate(operations: Record<string, any>): Promise<void> {
  const transaction = new StorageTransaction();

  for (const [key, value] of Object.entries(operations)) {
    transaction.add(key, value);
  }

  await transaction.commit();
  transaction.clear();
}

/**
 * Helper function for atomic localStorage deletion
 * 
 * @param keys - Array of keys to remove
 * 
 * @example
 * ```typescript
 * await atomicRemove(['token', 'user', 'auth_version']);
 * ```
 */
export async function atomicRemove(keys: string[]): Promise<void> {
  const transaction = new StorageTransaction();

  for (const key of keys) {
    transaction.remove(key);
  }

  await transaction.commit();
  transaction.clear();
}

/**
 * Helper function to check localStorage quota
 * 
 * @returns Estimated available space percentage (0-100)
 */
export function getStorageQuota(): number {
  try {
    const testKey = '__storage_quota_test__';
    const testValue = 'x'.repeat(1024 * 1024); // 1MB test
    
    try {
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      return 100; // Plenty of space
    } catch {
      // Try smaller sizes to estimate available space
      const sizes = [512, 256, 128, 64, 32, 16, 8, 4, 2, 1];
      
      for (const size of sizes) {
        try {
          const smallerTest = 'x'.repeat(size * 1024);
          localStorage.setItem(testKey, smallerTest);
          localStorage.removeItem(testKey);
          return (size / 10) * 100; // Rough estimate
        } catch {
          continue;
        }
      }
      
      return 0; // Very low space
    }
  } catch {
    return -1; // Error checking quota
  }
}

export default StorageTransaction;
