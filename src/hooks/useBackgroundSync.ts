import { useEffect, useCallback, useState, useRef } from 'react';
import { backgroundSyncManager, syncUtils, SYNC_CONFIGS } from '../lib/sync/background-sync';
import { indexedDBCache } from '../lib/cache/indexeddb-cache';

interface UseBackgroundSyncOptions {
  enabled?: boolean;
  setupCommonTasks?: boolean;
  userId?: string;
  onSyncSuccess?: (taskId: string, data: any) => void;
  onSyncError?: (taskId: string, error: Error) => void;
  debug?: boolean;
}

interface SyncStats {
  totalTasks: number;
  activeSyncs: number;
  isOnline: boolean;
  tasksByPriority: Record<string, number>;
  tasksByType: Record<string, number>;
  lastSyncTimes: Record<string, number>;
}

// Main hook for background synchronization
export function useBackgroundSync(options: UseBackgroundSyncOptions = {}) {
  const {
    enabled = true,
    setupCommonTasks = true,
    userId,
    onSyncSuccess,
    onSyncError,
    debug = false
  } = options;

  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const syncCallbacksRef = useRef({ onSyncSuccess, onSyncError });

  // Update callbacks ref
  useEffect(() => {
    syncCallbacksRef.current = { onSyncSuccess, onSyncError };
  }, [onSyncSuccess, onSyncError]);

  // Initialize sync tasks
  useEffect(() => {
    if (!enabled) return;

    const initializeSync = async () => {
      try {
        // Setup common sync tasks
        if (setupCommonTasks) {
          syncUtils.setupCommonSyncTasks();
        }

        // Setup user-specific sync tasks
        if (userId) {
          syncUtils.setupUserSyncTasks(userId);
        }

        setIsInitialized(true);

        if (debug) {
          console.log('[useBackgroundSync] Initialized with options:', options);
        }
      } catch (error) {
        console.error('[useBackgroundSync] Failed to initialize:', error);
      }
    };

    initializeSync();

    // Cleanup on unmount or when userId changes
    return () => {
      if (userId) {
        syncUtils.cleanupUserSyncTasks(userId);
      }
    };
  }, [enabled, setupCommonTasks, userId, debug]);

  // Update sync statistics periodically
  useEffect(() => {
    if (!enabled || !isInitialized) return;

    const updateStats = () => {
      try {
        const stats = backgroundSyncManager.getSyncStats();
        setSyncStats(stats as SyncStats);
      } catch (error) {
        console.warn('[useBackgroundSync] Failed to get sync stats:', error);
      }
    };

    // Initial update
    updateStats();

    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, [enabled, isInitialized]);

  // Force sync specific task
  const forceSyncTask = useCallback(async (taskId: string) => {
    if (!enabled) return;

    try {
      await backgroundSyncManager.forceSyncTask(taskId);
      
      if (debug) {
        console.log(`[useBackgroundSync] Force sync completed for: ${taskId}`);
      }
    } catch (error) {
      console.error(`[useBackgroundSync] Force sync failed for ${taskId}:`, error);
    }
  }, [enabled, debug]);

  // Force sync all tasks
  const forceSyncAll = useCallback(async () => {
    if (!enabled) return;

    try {
      await backgroundSyncManager.forceSyncAll();
      
      if (debug) {
        console.log('[useBackgroundSync] Force sync all completed');
      }
    } catch (error) {
      console.error('[useBackgroundSync] Force sync all failed:', error);
    }
  }, [enabled, debug]);

  // Add custom sync task
  const addSyncTask = useCallback((
    id: string,
    endpoint: string,
    type: 'api' | 'assessment' | 'user' | 'cache' = 'api',
    syncOptions: any = {}
  ) => {
    if (!enabled) return;

    backgroundSyncManager.addSyncTask(id, endpoint, type, {
      ...syncOptions,
      onSuccess: (data: any) => {
        syncCallbacksRef.current.onSyncSuccess?.(id, data);
      },
      onError: (error: Error) => {
        syncCallbacksRef.current.onSyncError?.(id, error);
      }
    });

    if (debug) {
      console.log(`[useBackgroundSync] Added sync task: ${id}`);
    }
  }, [enabled, debug]);

  // Remove sync task
  const removeSyncTask = useCallback((id: string) => {
    backgroundSyncManager.removeSyncTask(id);
    
    if (debug) {
      console.log(`[useBackgroundSync] Removed sync task: ${id}`);
    }
  }, [debug]);

  return {
    syncStats,
    isInitialized,
    forceSyncTask,
    forceSyncAll,
    addSyncTask,
    removeSyncTask,
    isEnabled: enabled
  };
}

// Hook for preloading assessment data
export function useAssessmentPreloader(enabled: boolean = true) {
  const { addSyncTask, removeSyncTask } = useBackgroundSync({ enabled: false });
  const [preloadedData, setPreloadedData] = useState<Record<string, any>>({});
  const preloadTasksRef = useRef<Set<string>>(new Set());

  // Preload assessment questions
  const preloadAssessmentQuestions = useCallback(async () => {
    if (!enabled) return;

    const taskId = 'preload-assessment-questions';
    
    if (preloadTasksRef.current.has(taskId)) return;

    addSyncTask(
      taskId,
      '/api/assessment/questions',
      'assessment',
      {
        priority: 'high',
        immediate: true,
        interval: 30 * 60 * 1000, // 30 minutes
        onSuccess: (data: any) => {
          setPreloadedData(prev => ({ ...prev, questions: data }));
        }
      }
    );

    preloadTasksRef.current.add(taskId);
  }, [enabled, addSyncTask]);

  // Preload user assessment history
  const preloadAssessmentHistory = useCallback(async (userId: string) => {
    if (!enabled || !userId) return;

    const taskId = `preload-assessment-history-${userId}`;
    
    if (preloadTasksRef.current.has(taskId)) return;

    addSyncTask(
      taskId,
      `/api/user/${userId}/assessments`,
      'assessment',
      {
        priority: 'medium',
        immediate: true,
        interval: 15 * 60 * 1000, // 15 minutes
        onSuccess: (data: any) => {
          setPreloadedData(prev => ({ ...prev, history: data }));
        }
      }
    );

    preloadTasksRef.current.add(taskId);
  }, [enabled, addSyncTask]);

  // Get preloaded data
  const getPreloadedData = useCallback(async (key: string) => {
    // First check in-memory cache
    if (preloadedData[key]) {
      return preloadedData[key];
    }

    // Then check IndexedDB cache
    try {
      const cachedData = await indexedDBCache.get(`sync:preload-${key}`);
      if (cachedData) {
        setPreloadedData(prev => ({ ...prev, [key]: cachedData }));
        return cachedData;
      }
    } catch (error) {
      console.warn(`[useAssessmentPreloader] Failed to get cached data for ${key}:`, error);
    }

    return null;
  }, [preloadedData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadTasksRef.current.forEach(taskId => {
        removeSyncTask(taskId);
      });
      preloadTasksRef.current.clear();
    };
  }, [removeSyncTask]);

  return {
    preloadAssessmentQuestions,
    preloadAssessmentHistory,
    getPreloadedData,
    preloadedData,
    hasPreloadedData: Object.keys(preloadedData).length > 0
  };
}

// Hook for user data synchronization
export function useUserDataSync(userId: string | null, enabled: boolean = true) {
  const [userData, setUserData] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const { addSyncTask, removeSyncTask, forceSyncTask } = useBackgroundSync({
    enabled: false, // We'll manage tasks manually
    onSyncSuccess: (taskId: string, data: any) => {
      if (taskId.includes('user-profile')) {
        setUserData(data);
        setLastSyncTime(Date.now());
        setSyncError(null);
      }
    },
    onSyncError: (taskId: string, error: Error) => {
      if (taskId.includes('user-profile')) {
        setSyncError(error);
      }
    }
  });

  // Setup user sync when userId changes
  useEffect(() => {
    if (!enabled || !userId) return;

    const taskId = `user-profile-${userId}`;

    addSyncTask(
      taskId,
      `/api/user/${userId}/profile`,
      'user',
      {
        priority: 'high',
        immediate: true,
        interval: 5 * 60 * 1000 // 5 minutes
      }
    );

    return () => {
      removeSyncTask(taskId);
    };
  }, [userId, enabled, addSyncTask, removeSyncTask]);

  // Force refresh user data
  const refreshUserData = useCallback(async () => {
    if (!userId) return;

    const taskId = `user-profile-${userId}`;
    await forceSyncTask(taskId);
  }, [userId, forceSyncTask]);

  return {
    userData,
    lastSyncTime,
    syncError,
    refreshUserData,
    isStale: lastSyncTime ? Date.now() - lastSyncTime > 10 * 60 * 1000 : true // 10 minutes
  };
}

// Hook for offline data management
export function useOfflineDataManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue action for when online
  const queueAction = useCallback((action: any) => {
    setPendingActions(prev => [...prev, { ...action, timestamp: Date.now() }]);
  }, []);

  // Process pending actions when online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      // Process pending actions
      const processActions = async () => {
        for (const action of pendingActions) {
          try {
            // Process action (implement based on your needs)
            console.log('[useOfflineDataManager] Processing pending action:', action);
          } catch (error) {
            console.error('[useOfflineDataManager] Failed to process action:', error);
          }
        }
        setPendingActions([]);
      };

      processActions();
    }
  }, [isOnline, pendingActions]);

  return {
    isOnline,
    pendingActions,
    queueAction,
    hasPendingActions: pendingActions.length > 0
  };
}
