// Background data synchronization system

interface SyncTask {
  id: string;
  type: 'api' | 'assessment' | 'user' | 'cache';
  endpoint: string;
  priority: 'high' | 'medium' | 'low';
  interval: number; // milliseconds
  lastSync: number;
  nextSync: number;
  retryCount: number;
  maxRetries: number;
  data?: any;
  headers?: Record<string, string>;
}

interface SyncOptions {
  priority?: 'high' | 'medium' | 'low';
  interval?: number;
  maxRetries?: number;
  immediate?: boolean;
  condition?: () => boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

class BackgroundSyncManager {
  private tasks = new Map<string, SyncTask>();
  private activeSync = new Set<string>();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;
  private maxConcurrentSyncs = 3;

  constructor() {
    this.setupEventListeners();
    this.startSyncLoop();
  }

  private setupEventListeners(): void {
    // Handle online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.pauseSync();
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSync();
      } else {
        this.resumeSync();
      }
    });
  }

  // Add a sync task
  addSyncTask(
    id: string,
    endpoint: string,
    type: SyncTask['type'] = 'api',
    options: SyncOptions = {}
  ): void {
    const {
      priority = 'medium',
      interval = 5 * 60 * 1000, // 5 minutes default
      maxRetries = 3,
      immediate = false
    } = options;

    const now = Date.now();
    const task: SyncTask = {
      id,
      type,
      endpoint,
      priority,
      interval,
      lastSync: immediate ? 0 : now,
      nextSync: immediate ? now : now + interval,
      retryCount: 0,
      maxRetries,
      headers: {}
    };

    this.tasks.set(id, task);

    if (immediate && this.isOnline) {
      this.executeSync(task, options);
    }
  }

  // Remove a sync task
  removeSyncTask(id: string): void {
    this.tasks.delete(id);
    this.activeSync.delete(id);
  }

  // Update sync task
  updateSyncTask(id: string, updates: Partial<SyncTask>): void {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
      this.tasks.set(id, task);
    }
  }

  // Execute sync for a specific task
  private async executeSync(task: SyncTask, options: SyncOptions = {}): Promise<void> {
    if (this.activeSync.has(task.id) || !this.isOnline) {
      return;
    }

    // Check condition if provided
    if (options.condition && !options.condition()) {
      return;
    }

    this.activeSync.add(task.id);

    try {
      const response = await fetch(task.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...task.headers
        },
        // Use cache for background sync
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update task
      task.lastSync = Date.now();
      task.nextSync = task.lastSync + task.interval;
      task.retryCount = 0;

      // Store data in cache if it's a cacheable type
      if (task.type === 'api' || task.type === 'assessment' || task.type === 'user') {
        await this.cacheData(task.id, data);
      }

      // Call success callback
      options.onSuccess?.(data);

      console.log(`[BackgroundSync] Successfully synced: ${task.id}`);
    } catch (error) {
      console.warn(`[BackgroundSync] Sync failed for ${task.id}:`, error);
      
      // Handle retry logic
      task.retryCount++;
      if (task.retryCount < task.maxRetries) {
        // Exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, task.retryCount), 30000);
        task.nextSync = Date.now() + backoffDelay;
      } else {
        // Max retries reached, schedule next regular sync
        task.nextSync = Date.now() + task.interval;
        task.retryCount = 0;
      }

      // Call error callback
      options.onError?.(error as Error);
    } finally {
      this.activeSync.delete(task.id);
    }
  }

  // Cache synced data
  private async cacheData(taskId: string, data: any): Promise<void> {
    try {
      // Use IndexedDB cache if available
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const { indexedDBCache } = await import('../cache/indexeddb-cache');
        await indexedDBCache.set(`sync:${taskId}`, data, {
          ttl: 30 * 60 * 1000, // 30 minutes
          tags: ['sync', 'background'],
          version: '1.0.0'
        });
      }
    } catch (error) {
      console.warn(`[BackgroundSync] Failed to cache data for ${taskId}:`, error);
    }
  }

  // Start the sync loop
  private startSyncLoop(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 10000); // Check every 10 seconds
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || document.hidden) return;

    const now = Date.now();
    const tasksToSync = Array.from(this.tasks.values())
      .filter(task => task.nextSync <= now && !this.activeSync.has(task.id))
      .sort((a, b) => {
        // Sort by priority and next sync time
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.nextSync - b.nextSync;
      })
      .slice(0, this.maxConcurrentSyncs - this.activeSync.size);

    // Execute sync tasks
    const syncPromises = tasksToSync.map(task => this.executeSync(task));
    await Promise.allSettled(syncPromises);
  }

  // Pause sync
  private pauseSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Resume sync
  private resumeSync(): void {
    if (!this.syncInterval) {
      this.startSyncLoop();
    }
  }

  // Force sync for specific task
  async forceSyncTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      await this.executeSync(task);
    }
  }

  // Force sync all tasks
  async forceSyncAll(): Promise<void> {
    const syncPromises = Array.from(this.tasks.values()).map(task => 
      this.executeSync(task)
    );
    await Promise.allSettled(syncPromises);
  }

  // Get sync statistics
  getSyncStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      activeSyncs: this.activeSync.size,
      isOnline: this.isOnline,
      tasksByPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      tasksByType: {
        api: tasks.filter(t => t.type === 'api').length,
        assessment: tasks.filter(t => t.type === 'assessment').length,
        user: tasks.filter(t => t.type === 'user').length,
        cache: tasks.filter(t => t.type === 'cache').length
      },
      nextSyncTimes: tasks.map(t => ({
        id: t.id,
        nextSync: new Date(t.nextSync).toISOString(),
        timeUntilSync: Math.max(0, t.nextSync - Date.now())
      }))
    };
  }

  // Clear all tasks
  clearAllTasks(): void {
    this.tasks.clear();
    this.activeSync.clear();
  }

  // Destroy the sync manager
  destroy(): void {
    this.pauseSync();
    this.clearAllTasks();
  }
}

// Singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();

// Predefined sync configurations
export const SYNC_CONFIGS = {
  // User profile sync
  USER_PROFILE: {
    id: 'user-profile',
    endpoint: '/api/auth/profile',
    type: 'user' as const,
    priority: 'high' as const,
    interval: 10 * 60 * 1000 // 10 minutes
  },

  // Assessment archive sync
  ASSESSMENT_ARCHIVE: {
    id: 'assessment-archive',
    endpoint: '/api/assessment/archive',
    type: 'assessment' as const,
    priority: 'medium' as const,
    interval: 15 * 60 * 1000 // 15 minutes
  },

  // Schools data sync
  SCHOOLS_DATA: {
    id: 'schools-data',
    endpoint: '/api/auth/schools',
    type: 'api' as const,
    priority: 'low' as const,
    interval: 60 * 60 * 1000 // 1 hour
  },

  // Assessment questions preload
  ASSESSMENT_QUESTIONS: {
    id: 'assessment-questions',
    endpoint: '/api/assessment/questions',
    type: 'assessment' as const,
    priority: 'medium' as const,
    interval: 30 * 60 * 1000 // 30 minutes
  }
};

// Utility functions
export const syncUtils = {
  // Setup common sync tasks
  setupCommonSyncTasks(): void {
    Object.values(SYNC_CONFIGS).forEach(config => {
      backgroundSyncManager.addSyncTask(
        config.id,
        config.endpoint,
        config.type,
        {
          priority: config.priority,
          interval: config.interval
        }
      );
    });
  },

  // Setup user-specific sync tasks
  setupUserSyncTasks(userId: string): void {
    backgroundSyncManager.addSyncTask(
      `user-data-${userId}`,
      `/api/user/${userId}`,
      'user',
      {
        priority: 'high',
        interval: 5 * 60 * 1000 // 5 minutes
      }
    );

    backgroundSyncManager.addSyncTask(
      `user-assessments-${userId}`,
      `/api/user/${userId}/assessments`,
      'assessment',
      {
        priority: 'medium',
        interval: 15 * 60 * 1000 // 15 minutes
      }
    );
  },

  // Cleanup user-specific sync tasks
  cleanupUserSyncTasks(userId: string): void {
    backgroundSyncManager.removeSyncTask(`user-data-${userId}`);
    backgroundSyncManager.removeSyncTask(`user-assessments-${userId}`);
  }
};
