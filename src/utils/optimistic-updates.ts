/**
 * Optimistic Update Utilities untuk Assessment Table
 * Handles smooth data updates dengan animations dan state management
 * 
 * @module optimistic-updates
 * @description Provides utilities untuk implement optimistic UI updates
 * yang menampilkan data immediately dari cache sambil sync di background
 */

export interface OptimisticUpdate<T> {
  type: 'add' | 'update' | 'remove';
  data: T;
  tempId?: string;
  timestamp: number;
}

export interface OptimisticItem<T> {
  data: T;
  isPending: boolean;
  tempId?: string;
}

/**
 * Optimistic Update Manager
 * Manages pending updates dan merges dengan cached data
 * 
 * @example
 * ```typescript
 * const manager = new OptimisticUpdateManager<AssessmentData>();
 * 
 * // Add optimistic item
 * manager.addOptimistic(newAssessment, 'temp-123');
 * 
 * // Merge dengan cached data
 * const displayData = manager.mergeWithPending(cachedData);
 * 
 * // Confirm saat real data arrives
 * manager.confirmUpdate('temp-123', realAssessment);
 * ```
 */
export class OptimisticUpdateManager<T extends { id: string }> {
  private pendingUpdates = new Map<string, OptimisticUpdate<T>>();
  private updateCallbacks = new Set<() => void>();
  private readonly MAX_PENDING_TIME = 30000; // 30 seconds

  /**
   * Add optimistic item (shown immediately dengan pending state)
   * @param item - Item to add optimistically
   * @param tempId - Temporary ID untuk tracking
   */
  addOptimistic(item: T, tempId: string): void {
    this.pendingUpdates.set(tempId, {
      type: 'add',
      data: item,
      tempId,
      timestamp: Date.now()
    });
    this.notifySubscribers();
    
    // Auto-cleanup after timeout
    setTimeout(() => {
      if (this.pendingUpdates.has(tempId)) {
        console.warn(`[OptimisticUpdate] Auto-removing stale pending update: ${tempId}`);
        this.rollback(tempId);
      }
    }, this.MAX_PENDING_TIME);
  }

  /**
   * Update existing optimistic item
   * @param tempId - Temporary ID of item to update
   * @param updatedData - Updated data
   */
  updateOptimistic(tempId: string, updatedData: Partial<T>): void {
    const existing = this.pendingUpdates.get(tempId);
    if (existing) {
      this.pendingUpdates.set(tempId, {
        ...existing,
        data: { ...existing.data, ...updatedData },
        timestamp: Date.now()
      });
      this.notifySubscribers();
    }
  }

  /**
   * Confirm optimistic update dengan real data dari API
   * @param tempId - Temporary ID to confirm
   * @param realData - Real data dari API (optional)
   */
  confirmUpdate(tempId: string, realData?: T): void {
    const pending = this.pendingUpdates.get(tempId);
    if (pending) {
      console.log(`[OptimisticUpdate] Confirmed update: ${tempId}`);
      this.pendingUpdates.delete(tempId);
      this.notifySubscribers();
    }
  }

  /**
   * Rollback optimistic update jika failed
   * @param tempId - Temporary ID to rollback
   */
  rollback(tempId: string): void {
    const pending = this.pendingUpdates.get(tempId);
    if (pending) {
      console.warn(`[OptimisticUpdate] Rolling back update: ${tempId}`);
      this.pendingUpdates.delete(tempId);
      this.notifySubscribers();
    }
  }

  /**
   * Merge cached data dengan pending updates
   * @param cachedData - Data dari cache
   * @returns Merged data dengan pending items marked
   */
  mergeWithPending(cachedData: T[]): Array<T & { _isPending?: boolean; _tempId?: string }> {
    const pending = Array.from(this.pendingUpdates.values());
    const merged = [...cachedData];

    // Add pending items to beginning (newest first)
    pending.forEach(update => {
      if (update.type === 'add') {
        merged.unshift({
          ...update.data,
          _isPending: true,
          _tempId: update.tempId
        } as T & { _isPending?: boolean; _tempId?: string });
      }
    });

    return merged;
  }

  /**
   * Check if there are any pending updates
   */
  hasPending(): boolean {
    return this.pendingUpdates.size > 0;
  }

  /**
   * Get count of pending updates
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }

  /**
   * Get all pending update IDs
   */
  getPendingIds(): string[] {
    return Array.from(this.pendingUpdates.keys());
  }

  /**
   * Subscribe to update notifications
   * @param callback - Function to call when updates occur
   * @returns Unsubscribe function
   */
  subscribe(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Clear all pending updates
   */
  clearAll(): void {
    this.pendingUpdates.clear();
    this.notifySubscribers();
  }

  /**
   * Notify all subscribers of updates
   */
  private notifySubscribers(): void {
    this.updateCallbacks.forEach(cb => {
      try {
        cb();
      } catch (error) {
        console.error('[OptimisticUpdate] Subscriber callback error:', error);
      }
    });
  }

  /**
   * Get statistics about pending updates
   */
  getStats() {
    const updates = Array.from(this.pendingUpdates.values());
    const now = Date.now();
    
    return {
      total: updates.length,
      byType: {
        add: updates.filter(u => u.type === 'add').length,
        update: updates.filter(u => u.type === 'update').length,
        remove: updates.filter(u => u.type === 'remove').length
      },
      oldestAge: updates.length > 0 
        ? Math.max(...updates.map(u => now - u.timestamp))
        : 0,
      newestAge: updates.length > 0
        ? Math.min(...updates.map(u => now - u.timestamp))
        : 0
    };
  }
}

/**
 * Detect new items dalam array comparison
 * @param previousData - Previous data array
 * @param currentData - Current data array
 * @returns Set of IDs yang baru ditambahkan
 */
export function detectNewItems<T extends { id: string }>(
  previousData: T[],
  currentData: T[]
): Set<string> {
  const previousIds = new Set(previousData.map(item => item.id));
  const newIds = currentData
    .filter(item => !previousIds.has(item.id))
    .map(item => item.id);
  
  return new Set(newIds);
}

/**
 * Detect removed items dalam array comparison
 * @param previousData - Previous data array
 * @param currentData - Current data array
 * @returns Set of IDs yang dihapus
 */
export function detectRemovedItems<T extends { id: string }>(
  previousData: T[],
  currentData: T[]
): Set<string> {
  const currentIds = new Set(currentData.map(item => item.id));
  const removedIds = previousData
    .filter(item => !currentIds.has(item.id))
    .map(item => item.id);
  
  return new Set(removedIds);
}

/**
 * Detect updated items dalam array comparison
 * @param previousData - Previous data array
 * @param currentData - Current data array
 * @param compareFields - Fields to compare untuk detect changes
 * @returns Set of IDs yang diupdate
 */
export function detectUpdatedItems<T extends { id: string }>(
  previousData: T[],
  currentData: T[],
  compareFields?: (keyof T)[]
): Set<string> {
  const previousMap = new Map(previousData.map(item => [item.id, item]));
  const updatedIds: string[] = [];

  currentData.forEach(currentItem => {
    const previousItem = previousMap.get(currentItem.id);
    if (previousItem) {
      // Check if any field changed
      const hasChanges = compareFields
        ? compareFields.some(field => previousItem[field] !== currentItem[field])
        : JSON.stringify(previousItem) !== JSON.stringify(currentItem);
      
      if (hasChanges) {
        updatedIds.push(currentItem.id);
      }
    }
  });

  return new Set(updatedIds);
}

/**
 * Create a temporary ID untuk optimistic updates
 * @param prefix - Prefix untuk ID (default: 'temp')
 * @returns Unique temporary ID
 */
export function createTempId(prefix: string = 'temp'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an ID is a temporary ID
 * @param id - ID to check
 * @returns True if ID is temporary
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp-');
}

