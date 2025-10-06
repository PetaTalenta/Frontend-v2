# Plan Perbaikan Komprehensif - PetaTalenta FrontEnd
## Improvement Plan & Implementation Roadmap

**Tanggal:** 6 Oktober 2025  
**Versi:** 1.0  
**Proyek:** PetaTalenta FrontEnd (FutureGuide)  
**Framework:** Next.js 15 dengan App Router

---

## Executive Summary

Plan perbaikan ini mencakup **5 fase implementasi** berdasarkan analisis mendalam dari `CODE_ANALYSIS_REPORT_2025.md` dengan **prioritas tambahan untuk optimisasi dashboard performance** sesuai request user.

### Prioritas Utama

1. **🔴 CRITICAL**: Fix race conditions dan memory leaks (Week 1-2)
2. **🔴 HIGH PRIORITY**: Dashboard performance optimization dengan caching & optimistic updates (Week 2-3)
3. **🟡 MEDIUM**: Submission guard dan localStorage improvements (Week 3-4)
4. **🟡 MEDIUM**: Prefetch optimization dan timer management (Week 5-7)
5. **🟢 LOW**: Code quality improvements (Week 8-10)

### Expected Outcomes

Setelah implementasi complete:

- ✅ **100% elimination** critical bugs (race conditions, memory leaks)
- ✅ **80-90% faster** dashboard loading dengan cache-first strategy
- ✅ **Smooth UX** dengan optimistic updates - no waiting untuk render
- ✅ **60-80% reduction** bandwidth usage dari prefetch optimization
- ✅ **Production-ready** dengan comprehensive testing

---

## Phase 1: Critical Fixes (Week 1-2)

### 🔴 Severity: CRITICAL

### Objectives

Eliminasi critical bugs yang dapat menyebabkan:
- Authentication failures dari token refresh race conditions
- Memory leaks 5-10MB per session dari WebSocket listeners
- Application crashes pada long-running sessions

### Tasks

#### 1.1: Implement Token Refresh Lock Mechanism

**File:** `src/services/apiService.js`

**Problem:**
- Multiple concurrent 401 errors trigger multiple token refresh attempts
- No synchronization mechanism
- Potential token invalidation dan conflicts

**Solution:**
```javascript
class ApiService {
  constructor() {
    this.tokenRefreshPromise = null; // ✅ Shared promise
    // ... existing code
  }

  async refreshTokenWithLock() {
    // ✅ Reuse existing promise jika refresh in-progress
    if (this.tokenRefreshPromise) {
      console.log('🔄 Token refresh already in progress, waiting...');
      return this.tokenRefreshPromise;
    }

    // ✅ Create new refresh promise
    this.tokenRefreshPromise = (async () => {
      try {
        const tokenService = (await import('./tokenService')).default;
        const newIdToken = await tokenService.refreshAuthToken();
        logger.debug('✅ Token refreshed successfully');
        return newIdToken;
      } catch (error) {
        logger.error('❌ Token refresh failed:', error);
        throw error;
      } finally {
        this.tokenRefreshPromise = null; // ✅ Clear promise
      }
    })();

    return this.tokenRefreshPromise;
  }

  setupResponseInterceptor() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const originalRequest = error.config;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokenService = (await import('./tokenService')).default;
            const authVersion = tokenService.getAuthVersion();

            if (authVersion === 'v2') {
              // ✅ Use lock mechanism
              const newIdToken = await this.refreshTokenWithLock();
              originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.handlers.onAuthError?.(error);
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }
}
```

**Benefits:**
- ✅ 100% prevention race condition
- ✅ 80-90% reduction API calls pada concurrent 401s
- ✅ Eliminasi token conflicts

**Estimated Time:** 1 day  
**Testing:** Unit tests untuk concurrent 401 scenarios

---

#### 1.2: Fix WebSocket Memory Leak - TokenContext

**File:** `src/contexts/TokenContext.tsx`

**Problem:**
- Event listeners tidak dibersihkan saat component unmount
- Multiple useEffect dapat register duplicate listeners
- Memory accumulation 5-10MB per session

**Solution:**
```typescript
useEffect(() => {
  if (!isAuthenticated || !user) {
    setTokenInfo(null);
    return;
  }

  let isActive = true;
  let cleanupListener: (() => void) | null = null;

  const initWebSocket = async () => {
    try {
      const { getWebSocketService } = await import('../services/websocket-service');
      const service = getWebSocketService();

      // ✅ Store cleanup function BEFORE adding listener
      cleanupListener = service.addEventListener((event) => {
        // ✅ Guard against stale closures
        if (!isActive) return;
        
        if (event.type === 'token-balance-updated' && event.metadata?.balance !== undefined) {
          updateTokenBalance(event.metadata.balance);
        }
      });

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token && isActive) {
        const status = service.getStatus();
        if (!status.isConnected) {
          await service.connect(token);
        }
      }
    } catch (error) {
      console.warn('TokenContext: WebSocket init failed:', error);
    }
  };

  initWebSocket();

  // ✅ Cleanup function guaranteed to run
  return () => {
    isActive = false; // Prevent stale closure updates
    
    if (cleanupListener) {
      cleanupListener(); // Remove event listener
      cleanupListener = null;
    }
  };
}, [isAuthenticated, user, updateTokenBalance]);
```

**Benefits:**
- ✅ Eliminasi memory leaks (5-10MB savings per session)
- ✅ No duplicate event handling
- ✅ Improved stability

**Estimated Time:** 1 day  
**Testing:** Unit tests untuk listener cleanup on unmount

---

#### 1.3: Fix WebSocket Memory Leak - AssessmentService

**File:** `src/services/assessment-service.ts`

**Problem:**
- Event listener cleanup tidak di-track dengan baik
- Cleanup function bisa tidak dipanggil jika error terjadi

**Solution:**
```typescript
class AssessmentService {
  private wsEventListeners = new Map<string, () => void>();

  private async tryWebSocketMonitoring(
    jobId: string,
    state: MonitoringState,
    options: AssessmentOptions,
    onSuccess: (result: AssessmentResult) => void,
    onError: (error: any) => void
  ) {
    try {
      // ✅ Cleanup previous listener untuk same jobId
      const existingCleanup = this.wsEventListeners.get(jobId);
      if (existingCleanup) {
        existingCleanup();
        this.wsEventListeners.delete(jobId);
      }

      // Register new listener dengan tracking
      const cleanup = this.wsService.addEventListener((event: any) => {
        if (event.jobId === jobId && state.isActive) {
          if (event.type === 'analysis-complete') {
            // Handle completion...
          } else if (event.type === 'analysis-failed') {
            // Handle failure...
          }
        }
      });

      // ✅ Store cleanup function
      this.wsEventListeners.set(jobId, cleanup);

    } catch (error) {
      // ✅ Ensure cleanup even on error
      const cleanup = this.wsEventListeners.get(jobId);
      if (cleanup) {
        cleanup();
        this.wsEventListeners.delete(jobId);
      }
      throw error;
    }
  }

  private stopMonitoring(jobId: string) {
    const state = this.activeMonitors.get(jobId);
    if (state) {
      state.isActive = false;
      this.activeMonitors.delete(jobId);

      // ✅ Cleanup event listener
      const cleanup = this.wsEventListeners.get(jobId);
      if (cleanup) {
        cleanup();
        this.wsEventListeners.delete(jobId);
      }

      if (this.wsService && !state.websocketFailed) {
        this.wsService.unsubscribeFromJob(jobId);
      }
    }
  }
}
```

**Benefits:**
- ✅ No orphaned listeners
- ✅ Proper cleanup even on errors
- ✅ Clear lifecycle tracking

**Estimated Time:** 1 day  
**Testing:** Integration tests untuk monitoring lifecycle

---

## Phase 2: Dashboard Performance Optimization (Week 2-3)

### 🔴 Severity: HIGH PRIORITY (User Request)

### Problem Statement

**Current Behavior:**
- User kembali dari assessment loading page ke dashboard
- Dashboard melakukan full API refetch untuk semua data
- User harus menunggu 2-5 detik untuk melihat dashboard
- Poor UX dengan blank screen atau loading spinners

**User Request:**
> "Fix when user back to dashboard from assessment loading page it make waiting to render dashboard page so slow. So from this problem fix it using caching and using optimistic to pop up smoothly in table when it have a new data."

### Solution Strategy

**Cache-First + Background Sync + Optimistic Updates:**

1. **Immediate Rendering**: Show cached data dari IndexedDB instantly (0ms wait)
2. **Background Sync**: Fetch fresh data dari API di background (non-blocking)
3. **Optimistic Updates**: Smoothly update table saat new data arrives
4. **Smart Invalidation**: Clear cache saat assessment complete

### Tasks

#### 2.1: Create Optimistic Update Utilities

**File:** `src/utils/optimistic-updates.ts` (NEW)

**Implementation:**
```typescript
/**
 * Optimistic Update Utilities untuk Assessment Table
 * Handles smooth data updates dengan animations
 */

export interface OptimisticUpdate<T> {
  type: 'add' | 'update' | 'remove';
  data: T;
  tempId?: string;
}

export class OptimisticUpdateManager<T extends { id: string }> {
  private pendingUpdates = new Map<string, OptimisticUpdate<T>>();
  private updateCallbacks = new Set<(data: T[]) => void>();

  /**
   * Add optimistic item (shown immediately with pending state)
   */
  addOptimistic(item: T, tempId: string): void {
    this.pendingUpdates.set(tempId, {
      type: 'add',
      data: item,
      tempId
    });
    this.notifySubscribers();
  }

  /**
   * Confirm optimistic update dengan real data dari API
   */
  confirmUpdate(tempId: string, realData: T): void {
    this.pendingUpdates.delete(tempId);
    this.notifySubscribers();
  }

  /**
   * Rollback jika update failed
   */
  rollback(tempId: string): void {
    this.pendingUpdates.delete(tempId);
    this.notifySubscribers();
  }

  /**
   * Merge cached data dengan pending updates
   */
  mergeWithPending(cachedData: T[]): T[] {
    const pending = Array.from(this.pendingUpdates.values());
    const merged = [...cachedData];

    pending.forEach(update => {
      if (update.type === 'add') {
        // Add to beginning (newest first)
        merged.unshift({ ...update.data, _isPending: true } as T);
      }
    });

    return merged;
  }

  subscribe(callback: (data: T[]) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifySubscribers(): void {
    this.updateCallbacks.forEach(cb => cb([]));
  }
}
```

**Estimated Time:** 1 day

---

#### 2.2: Modify DashboardClient untuk useCachedSWR

**File:** `src/components/dashboard/DashboardClient.tsx`

**Current Implementation:**
```typescript
// ❌ Regular SWR - no persistent caching
const { data: assessmentHistory, mutate } = useSWR(
  assessmentHistoryKey,
  () => formatAssessmentHistory(),
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Only 1 minute
  }
);
```

**New Implementation:**
```typescript
import { useCachedSWR } from '../../hooks/useCachedSWR';
import { OptimisticUpdateManager } from '../../utils/optimistic-updates';

// ✅ Cache-first SWR dengan IndexedDB
const {
  data: assessmentHistory,
  mutate,
  cacheStats
} = useCachedSWR(
  assessmentHistoryKey,
  () => formatAssessmentHistory(),
  {
    cacheKey: `dashboard-assessments-${user?.id}`,
    cacheTTL: 15 * 60 * 1000, // 15 minutes
    cacheTags: ['dashboard', 'assessments', user?.id || ''],
    cacheFirst: true, // ✅ Show cache immediately
    backgroundSync: true, // ✅ Sync in background
    useCacheAsFallback: true,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  }
);

// ✅ Optimistic update manager
const optimisticManager = useRef(
  new OptimisticUpdateManager<AssessmentData>()
);

// ✅ Merge cached data dengan pending updates
const displayData = useMemo(() => {
  if (!assessmentHistory) return [];
  return optimisticManager.current.mergeWithPending(assessmentHistory);
}, [assessmentHistory]);
```

**Benefits:**
- ✅ Instant rendering dari IndexedDB cache (0ms wait)
- ✅ Background sync non-blocking
- ✅ Optimistic updates untuk smooth UX

**Estimated Time:** 2 days
**Testing:** Verify cache hit rates, measure loading time improvement

---

#### 2.3: Implement Background Sync Strategy

**File:** `src/components/dashboard/DashboardClient.tsx`

**Implementation:**
```typescript
// ✅ Background parallel fetching
const loadDashboardData = useCallback(async () => {
  if (!user || !userStats) return;

  try {
    // Don't show loading spinner - data already visible from cache
    // setIsLoading(true); // ❌ Remove this

    // ✅ Fetch all data in parallel (non-blocking)
    const [formattedStats, formattedProgress, latestAssessment] = await Promise.all([
      formatStatsForDashboard(userStats),
      calculateUserProgress(userStats),
      (async () => {
        try {
          const archive = await apiService.getResults({
            limit: 1,
            status: 'completed',
            sort: 'created_at',
            order: 'DESC'
          });
          if (!archive?.success || !archive?.data?.results?.[0]) return null;
          const full = await apiService.getResultById(archive.data.results[0].id);
          return full?.success ? full.data : null;
        } catch {
          return null;
        }
      })()
    ]);

    // ✅ Update state smoothly (no loading spinner)
    setStatsData(formattedStats);
    setProgressData(formattedProgress);

    if (latestAssessment?.assessment_data) {
      setOceanScores(latestAssessment.assessment_data.ocean);
      setViaScores(latestAssessment.assessment_data.viaIs);
    }

  } catch (error) {
    console.error('Dashboard: Background sync error:', error);
    // Don't show error to user - cached data still visible
  }
}, [user, userStats]);
```

**Benefits:**
- ✅ Non-blocking UI - user sees cached data immediately
- ✅ Parallel fetching untuk faster sync
- ✅ Graceful error handling

**Estimated Time:** 1 day

---

#### 2.4: Add Optimistic Updates to AssessmentTable

**File:** `src/components/dashboard/assessment-table.tsx`

**Implementation:**
```typescript
import { motion, AnimatePresence } from 'framer-motion';

export function AssessmentTable({
  data,
  onRefresh,
  swrKey,
  isLoading
}: AssessmentTableProps) {
  // ✅ Detect new items (from background sync)
  const [previousData, setPreviousData] = useState<AssessmentData[]>([]);
  const [newItems, setNewItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data || data.length === 0) return;

    // ✅ Find new items
    const previousIds = new Set(previousData.map(item => item.id));
    const currentNew = data
      .filter(item => !previousIds.has(item.id))
      .map(item => item.id);

    if (currentNew.length > 0) {
      setNewItems(new Set(currentNew));

      // ✅ Remove highlight after 3 seconds
      setTimeout(() => {
        setNewItems(new Set());
      }, 3000);
    }

    setPreviousData(data);
  }, [data]);

  return (
    <TableBody>
      <AnimatePresence mode="popLayout">
        {currentData.map((assessment) => {
          const isNew = newItems.has(assessment.id);
          const isPending = (assessment as any)._isPending;

          return (
            <motion.tr
              key={assessment.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: isPending ? 0.6 : 1,
                y: 0,
                backgroundColor: isNew ? '#dbeafe' : 'transparent'
              }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <TableCell>{assessment.no}</TableCell>
              <TableCell>
                {assessment.name}
                {isPending && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Syncing...)
                  </span>
                )}
              </TableCell>
              {/* ... rest of cells */}
            </motion.tr>
          );
        })}
      </AnimatePresence>
    </TableBody>
  );
}
```

**Benefits:**
- ✅ Smooth animations untuk new items
- ✅ Visual feedback untuk pending items
- ✅ Highlight new data dari background sync

**Estimated Time:** 2 days
**Dependencies:** `framer-motion` (already in project)

---

#### 2.5: Implement Cache Invalidation Flow

**File:** `src/app/assessment-loading/page.tsx`

**Implementation:**
```typescript
import { cacheManager } from '../../hooks/useCachedSWR';
import { indexedDBCache } from '../../lib/cache/indexeddb-cache';

const {
  state,
  submitFromAnswers,
} = useAssessment({
  preferWebSocket: true,
  onComplete: async (result) => {
    console.log('Assessment completed successfully:', result);

    // ✅ Invalidate dashboard cache
    await Promise.all([
      // Clear assessment history cache
      indexedDBCache.deleteByTags(['dashboard', 'assessments']),

      // Clear user stats cache
      indexedDBCache.deleteByTags(['user', user?.id || '']),

      // Clear SWR cache
      cacheManager.clearSWRCache()
    ]);

    console.log('✅ Dashboard cache invalidated');

    // Clear saved answers
    try {
      localStorage.removeItem('assessment-answers');
      localStorage.removeItem('assessment-name');
      localStorage.removeItem('assessment-submission-time');
    } catch (e) {
      console.warn('Failed to clear saved answers', e);
    }

    // ✅ Navigate to results (cache will be fresh on next dashboard visit)
    setTimeout(() => {
      router.push(`/results/${result.id}`);
    }, 500);
  },
});
```

**File:** `src/contexts/TokenContext.tsx`

**Add WebSocket listener untuk cache invalidation:**
```typescript
cleanupListener = service.addEventListener((event) => {
  if (!isActive) return;

  if (event.type === 'token-balance-updated' && event.metadata?.balance !== undefined) {
    updateTokenBalance(event.metadata.balance);
  }

  // ✅ Invalidate cache saat assessment complete
  if (event.type === 'analysis-complete') {
    indexedDBCache.deleteByTags(['dashboard', 'assessments']).catch(err => {
      console.warn('Failed to invalidate cache:', err);
    });
  }
});
```

**Benefits:**
- ✅ Fresh data saat user kembali ke dashboard
- ✅ Automatic invalidation via WebSocket events
- ✅ No stale data issues

**Estimated Time:** 1 day

---

#### 2.6: Improve Loading States

**File:** `src/components/dashboard/DashboardClient.tsx`

**Implementation:**
```typescript
// ✅ Show skeleton only if NO cache data available
const showSkeleton = isLoading && !assessmentHistory;

// ✅ Show sync indicator if background sync in progress
const isSyncing = cacheStats.isFromCache && isLoading;

return (
  <div className="dashboard-container">
    {/* ✅ Subtle sync indicator */}
    {isSyncing && (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm text-blue-700">Syncing latest data...</span>
        </div>
      </div>
    )}

    {/* ✅ Show cached data immediately */}
    <AssessmentTable
      data={displayData}
      onRefresh={refreshAssessmentHistory}
      swrKey={assessmentHistoryKey || undefined}
      isLoading={showSkeleton}
    />
  </div>
);
```

**Benefits:**
- ✅ No blank screens - cached data shown immediately
- ✅ Subtle sync indicator untuk transparency
- ✅ Better perceived performance

**Estimated Time:** 1 day

---

#### 2.7: Performance Testing & Metrics

**Create:** `src/utils/performance-metrics.ts` (NEW)

**Implementation:**
```typescript
/**
 * Performance Metrics Tracker
 */
export class PerformanceMetrics {
  private metrics = {
    dashboardLoadTime: [] as number[],
    cacheHitRate: 0,
    cacheMissRate: 0,
    backgroundSyncTime: [] as number[],
  };

  trackDashboardLoad(startTime: number): void {
    const loadTime = Date.now() - startTime;
    this.metrics.dashboardLoadTime.push(loadTime);

    console.log(`📊 Dashboard Load Time: ${loadTime}ms`);
  }

  trackCacheHit(): void {
    this.metrics.cacheHitRate++;
  }

  trackCacheMiss(): void {
    this.metrics.cacheMissRate++;
  }

  getAverageLoadTime(): number {
    const times = this.metrics.dashboardLoadTime;
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getCacheHitRate(): number {
    const total = this.metrics.cacheHitRate + this.metrics.cacheMissRate;
    if (total === 0) return 0;
    return (this.metrics.cacheHitRate / total) * 100;
  }

  getReport(): string {
    return `
📊 Performance Metrics Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Average Dashboard Load Time: ${this.getAverageLoadTime().toFixed(2)}ms
Cache Hit Rate: ${this.getCacheHitRate().toFixed(2)}%
Total Loads: ${this.metrics.dashboardLoadTime.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
}

export const performanceMetrics = new PerformanceMetrics();
```

**Testing Checklist:**
- [ ] Measure baseline dashboard load time (before optimization)
- [ ] Measure optimized dashboard load time (after implementation)
- [ ] Verify cache hit rate > 80%
- [ ] Test background sync doesn't block UI
- [ ] Test optimistic updates work smoothly
- [ ] Test cache invalidation on assessment complete
- [ ] Test with slow network (throttle to 3G)
- [ ] Test with no network (offline mode)

**Expected Results:**
- ✅ Dashboard load time: **< 100ms** (from cache)
- ✅ Background sync: **1-2 seconds** (non-blocking)
- ✅ Cache hit rate: **> 80%**
- ✅ User satisfaction: **Significantly improved**

**Estimated Time:** 2 days

---

### Phase 2 Summary

**Total Estimated Time:** 10 days (2 weeks)

**Key Deliverables:**
1. ✅ Optimistic update utilities
2. ✅ Cache-first dashboard dengan IndexedDB
3. ✅ Background sync strategy
4. ✅ Smooth animations untuk new data
5. ✅ Smart cache invalidation
6. ✅ Improved loading states
7. ✅ Performance metrics & testing

**Expected Impact:**
- **80-90% faster** dashboard loading
- **Smooth UX** - no waiting untuk render
- **Better perceived performance**
- **Production-ready** caching strategy

---

## Phase 3: High-Priority Improvements (Week 3-4)

### 🟡 Severity: MEDIUM-HIGH

### Objectives

Fix submission guard dan localStorage race conditions untuk prevent:
- Wrong results returned untuk different users
- Data corruption dari concurrent localStorage writes
- Authentication failures dari token/user mismatch

### Tasks

#### 3.1: Implement Per-User Submission Tracking

**File:** `src/services/assessment-service.ts`

**Current Problem:**
```typescript
// ❌ Single promise untuk ALL submissions
private currentSubmissionPromise: Promise<AssessmentResult> | null = null;

async submitAssessment(scores: AssessmentScores, ...) {
  if (this.currentSubmissionPromise) {
    return this.currentSubmissionPromise; // ⚠️ Wrong result untuk different data
  }
}
```

**Solution:**
```typescript
interface SubmissionKey {
  userId: string;
  dataHash: string;
}

class AssessmentService {
  // ✅ Track submissions per user + data combination
  private activeSubmissions = new Map<string, Promise<AssessmentResult>>();

  private getSubmissionKey(userId: string, scores: AssessmentScores): string {
    const dataStr = JSON.stringify({
      riasec: scores.riasec,
      ocean: scores.ocean,
      viaIs: scores.viaIs,
      industryScore: scores.industryScore
    });

    const hash = dataStr.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString(36);

    return `${userId}_${hash}`;
  }

  async submitAssessment(
    scores: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping',
    options: AssessmentOptions & { answers?: Record<number, number|null> } = {}
  ): Promise<AssessmentResult> {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      throw createSafeError('No authentication token found', 'AUTH_ERROR');
    }

    const userId = this.extractUserIdFromToken(token);
    const submissionKey = this.getSubmissionKey(userId, scores);

    // ✅ Check if identical submission already in progress
    const existingSubmission = this.activeSubmissions.get(submissionKey);
    if (existingSubmission) {
      console.warn(`Duplicate submission detected for user ${userId}`);
      return existingSubmission;
    }

    const submissionPromise = (async () => {
      try {
        const submitResponse = await this.submitToAPI(scores, assessmentName, options.onTokenBalanceUpdate, options.answers);
        const jobId = submitResponse.data.jobId;
        const result = await this.monitorAssessment(jobId, options);
        return result;
      } finally {
        this.activeSubmissions.delete(submissionKey);
      }
    })();

    this.activeSubmissions.set(submissionKey, submissionPromise);
    return submissionPromise;
  }

  private extractUserIdFromToken(token: string): string {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return 'unknown';
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || payload.userId || payload.user_id || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}
```

**Benefits:**
- ✅ Prevent wrong results untuk different users
- ✅ Support concurrent submissions
- ✅ Intelligent deduplication

**Estimated Time:** 2 days

---

#### 3.2: Improve StorageManager Atomic Operations

**File:** `src/utils/storage-manager.ts`

**Solution:**
```typescript
class StorageManager {
  private locks = new Map<string, Promise<void>>();
  private lockTimestamps = new Map<string, number>();
  private readonly LOCK_TIMEOUT = 5000;

  private async acquireLock(key: string): Promise<() => void> {
    // ✅ Clean up stale locks
    const timestamp = this.lockTimestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.LOCK_TIMEOUT) {
      this.locks.delete(key);
      this.lockTimestamps.delete(key);
    }

    // ✅ Wait untuk existing lock
    const existingLock = this.locks.get(key);
    if (existingLock) {
      await existingLock;
    }

    // ✅ Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);
    this.lockTimestamps.set(key, Date.now());

    return () => {
      this.locks.delete(key);
      this.lockTimestamps.delete(key);
      releaseLock!();
    };
  }

  async setItem(key: string, value: StorageValue): Promise<void> {
    const release = await this.acquireLock(key);

    try {
      if (typeof window === 'undefined') return;
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } finally {
      release();
    }
  }

  async setMultiple(items: Record<string, StorageValue>): Promise<void> {
    const keys = Object.keys(items);
    const releases: Array<() => void> = [];

    try {
      // ✅ Acquire all locks (sorted untuk prevent deadlock)
      const sortedKeys = keys.sort();
      for (const key of sortedKeys) {
        const release = await this.acquireLock(key);
        releases.push(release);
      }

      // ✅ Perform all writes
      for (const key of sortedKeys) {
        const serialized = JSON.stringify(items[key]);
        localStorage.setItem(key, serialized);
      }
    } finally {
      releases.forEach(release => release());
    }
  }
}
```

**Estimated Time:** 2 days

---

#### 3.3: Update AuthContext untuk Atomic Storage

**File:** `src/contexts/AuthContext.tsx`

**Solution:**
```typescript
const login = useCallback(async (newToken: string, newUser: User) => {
  setToken(newToken);
  setUser(newUser);

  // ✅ Atomic localStorage update
  await storageManager.setMultiple({
    'token': newToken,
    'user': newUser
  });

  document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`;

  fetchUsernameFromProfile(newToken).catch(error => {
    console.error('Profile fetch failed (non-critical):', error);
  });

  router.push('/dashboard');
}, [router, fetchUsernameFromProfile]);

const logout = useCallback(async () => {
  if (authVersion === 'v2') {
    try {
      await authV2Service.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // ✅ Atomic clear V2 tokens
    await storageManager.removeMultiple([
      'authV2_idToken',
      'authV2_refreshToken',
      'authV2_tokenIssuedAt',
      'authV2_userId',
      'auth_version'
    ]);
  } else {
    await storageManager.removeMultiple(['token']);
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  }

  await storageManager.removeMultiple(['user']);

  setToken(null);
  setUser(null);
  setAuthVersion('v1');

  router.push('/auth');
}, [authVersion, router]);
```

**Estimated Time:** 1 day

---

#### 3.4: Add Integration Tests

**Create:** `tests/integration/submission-guard.test.ts`

**Estimated Time:** 1 day

**Total Phase 3 Time:** 6 days

---

## Phase 4: Performance Optimizations (Week 5-7)

### 🟡 Severity: MEDIUM

### Tasks

#### 4.1: Create Centralized Prefetch Coordinator

**File:** `src/lib/prefetch/prefetch-coordinator.ts` (NEW)

**Implementation:** (Sesuai dengan CODE_ANALYSIS_REPORT_2025.md Section 5)

**Estimated Time:** 3 days

---

#### 4.2: Update Prefetch Systems

**Files:**
- `src/components/performance/SimplePrefetchProvider.tsx`
- `src/hooks/usePrefetch.ts`
- `src/components/prefetch/PrefetchManager.tsx`

**Estimated Time:** 2 days

---

#### 4.3: Adopt TimerManager Across Services

**Files:**
- `src/services/assessment-service.ts`
- `src/services/websocket-service.ts`

**Implementation:**
```typescript
import { timerManager } from '../utils/timer-manager';

class AssessmentService {
  private timerManager = timerManager;

  private async monitorAssessment(jobId: string, options: AssessmentOptions) {
    // ✅ Use timer manager dengan unique ID
    this.timerManager.setTimeout(
      `monitoring-timeout-${jobId}`,
      () => {
        if (state.isActive) {
          this.stopMonitoring(jobId);
          reject(createSafeError('Monitoring timeout', 'MONITORING_TIMEOUT'));
        }
      },
      CONFIG.TIMEOUTS.MONITORING
    );
  }

  private stopMonitoring(jobId: string) {
    // ✅ Clear timers
    this.timerManager.clearTimeout(`monitoring-timeout-${jobId}`);
    this.timerManager.clearTimeout(`websocket-fallback-${jobId}`);
    this.timerManager.clearTimeout(`polling-${jobId}`);
  }
}
```

**Estimated Time:** 2 days

---

#### 4.4: Add Performance Tests

**Estimated Time:** 1 day

**Total Phase 4 Time:** 8 days

---

## Phase 5: Code Quality Improvements (Week 8-10)

### 🟢 Severity: LOW

### Tasks

#### 5.1: Simplify usePrefetch Hook

**Estimated Time:** 2 days

---

#### 5.2: Cleanup apiService Deduplication

**Estimated Time:** 2 days

---

#### 5.3: Code Review & Documentation

**Estimated Time:** 2 days

**Total Phase 5 Time:** 6 days

---

## Implementation Timeline Summary

| Phase | Duration | Priority | Key Deliverables |
|-------|----------|----------|------------------|
| **Phase 1** | Week 1-2 (5 days) | 🔴 CRITICAL | Token refresh lock, WebSocket cleanup |
| **Phase 2** | Week 2-3 (10 days) | 🔴 HIGH | Dashboard caching, optimistic updates |
| **Phase 3** | Week 3-4 (6 days) | 🟡 MEDIUM-HIGH | Submission guard, atomic storage |
| **Phase 4** | Week 5-7 (8 days) | 🟡 MEDIUM | Prefetch coordinator, timer management |
| **Phase 5** | Week 8-10 (6 days) | 🟢 LOW | Code cleanup, documentation |
| **Total** | **10 weeks** | - | **35 working days** |

---

## Testing Strategy

### Unit Tests

**Critical Components:**
```typescript
// Token Refresh Lock
describe('Token Refresh Lock', () => {
  it('should prevent concurrent refresh attempts', async () => {
    const apiService = new ApiService();
    const requests = Array(5).fill(null).map(() =>
      apiService.refreshTokenWithLock()
    );
    const results = await Promise.all(requests);
    expect(new Set(results).size).toBe(1);
    expect(mockTokenService.refreshAuthToken).toHaveBeenCalledTimes(1);
  });
});

// WebSocket Cleanup
describe('WebSocket Listener Cleanup', () => {
  it('should remove listener on unmount', () => {
    const { unmount } = render(<TokenProvider>...</TokenProvider>);
    expect(wsService.addEventListener).toHaveBeenCalled();
    unmount();
    expect(cleanupFunction).toHaveBeenCalled();
  });
});

// Optimistic Updates
describe('Optimistic Update Manager', () => {
  it('should merge cached data dengan pending updates', () => {
    const manager = new OptimisticUpdateManager();
    const cached = [{ id: '1', name: 'Test 1' }];
    manager.addOptimistic({ id: '2', name: 'Test 2' }, 'temp-2');
    const merged = manager.mergeWithPending(cached);
    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe('2'); // Newest first
  });
});
```

### Integration Tests

**Dashboard Performance:**
```typescript
describe('Dashboard Performance', () => {
  it('should load from cache in < 100ms', async () => {
    const startTime = Date.now();
    render(<DashboardClient />);
    await waitFor(() => {
      expect(screen.getByText(/Riwayat Asesmen/i)).toBeInTheDocument();
    });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(100);
  });

  it('should sync in background without blocking UI', async () => {
    const { container } = render(<DashboardClient />);

    // Data should be visible immediately
    expect(screen.getByText(/Riwayat Asesmen/i)).toBeInTheDocument();

    // Sync indicator should appear
    await waitFor(() => {
      expect(screen.getByText(/Syncing latest data/i)).toBeInTheDocument();
    });

    // UI should remain interactive
    const button = screen.getByText(/Asesmen Baru/i);
    expect(button).not.toBeDisabled();
  });
});
```

### Performance Tests

**Metrics to Track:**
```typescript
interface PerformanceMetrics {
  dashboardLoadTime: number; // Target: < 100ms
  cacheHitRate: number; // Target: > 80%
  backgroundSyncTime: number; // Target: < 2000ms
  memoryUsage: number; // Target: No leaks
  tokenRefreshCalls: number; // Target: 1 per concurrent 401s
  prefetchDuplicates: number; // Target: 0
}
```

---

## Monitoring & Success Criteria

### Key Performance Indicators (KPIs)

#### Phase 1 Success Criteria
- ✅ Zero concurrent token refresh calls (verified via logs)
- ✅ Zero memory leaks dari WebSocket listeners (verified via Chrome DevTools)
- ✅ All unit tests passing

#### Phase 2 Success Criteria
- ✅ Dashboard load time < 100ms (from cache)
- ✅ Cache hit rate > 80%
- ✅ Background sync < 2 seconds
- ✅ Smooth optimistic updates (no jank)
- ✅ User satisfaction improved (subjective feedback)

#### Phase 3 Success Criteria
- ✅ Zero wrong results untuk concurrent submissions
- ✅ Zero localStorage race conditions
- ✅ All integration tests passing

#### Phase 4 Success Criteria
- ✅ 60-80% reduction prefetch bandwidth
- ✅ Zero orphaned timers
- ✅ Prefetch deduplication 100%

#### Phase 5 Success Criteria
- ✅ Code review approved
- ✅ Documentation complete
- ✅ Bundle size reduced

---

## Risk Mitigation

### Potential Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Breaking changes** | High | Comprehensive testing, feature flags |
| **Performance regression** | Medium | Baseline metrics, A/B testing |
| **Cache invalidation bugs** | Medium | Extensive testing, monitoring |
| **Browser compatibility** | Low | Test on all major browsers |
| **IndexedDB quota exceeded** | Low | Implement cleanup, quota monitoring |

### Rollback Plan

1. **Feature Flags**: All major changes behind feature flags
2. **Gradual Rollout**: Deploy to 10% → 50% → 100% users
3. **Monitoring**: Real-time error tracking dengan Sentry
4. **Quick Rollback**: Revert feature flag if issues detected

---

## Best Practices Compliance

### Code Quality Standards

✅ **TypeScript Strict Mode**: All new code fully typed
✅ **ESLint**: No warnings atau errors
✅ **Prettier**: Consistent code formatting
✅ **Unit Tests**: > 80% coverage untuk critical paths
✅ **Integration Tests**: All user flows tested
✅ **Performance Tests**: Baseline + regression testing
✅ **Documentation**: Inline comments + README updates
✅ **Code Review**: Peer review required untuk all PRs

### React Best Practices

✅ **Hooks Rules**: Follow all hooks rules
✅ **Memoization**: Use useMemo/useCallback appropriately
✅ **Error Boundaries**: Wrap critical components
✅ **Suspense**: Use untuk code splitting
✅ **Accessibility**: ARIA labels, keyboard navigation
✅ **Performance**: React DevTools Profiler analysis

### Next.js Best Practices

✅ **App Router**: Leverage server components
✅ **ISR**: Incremental Static Regeneration untuk static data
✅ **Image Optimization**: Use next/image
✅ **Font Optimization**: Use next/font
✅ **Bundle Analysis**: Regular bundle size monitoring
✅ **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## Kesimpulan

### Summary of Improvements

Setelah implementasi complete, aplikasi akan memiliki:

#### 🔴 Critical Fixes
- ✅ **100% elimination** race conditions (token refresh, submissions)
- ✅ **Zero memory leaks** dari WebSocket listeners
- ✅ **Robust error handling** dengan proper cleanup

#### 🚀 Performance Improvements
- ✅ **80-90% faster** dashboard loading (< 100ms dari cache)
- ✅ **Smooth UX** dengan optimistic updates
- ✅ **60-80% reduction** bandwidth usage
- ✅ **Better perceived performance** - no waiting screens

#### 🛡️ Reliability Improvements
- ✅ **Atomic operations** untuk localStorage
- ✅ **Per-user submission tracking** - no wrong results
- ✅ **Smart cache invalidation** - always fresh data
- ✅ **Comprehensive testing** - unit + integration + performance

#### 📦 Code Quality Improvements
- ✅ **Cleaner codebase** - reduced complexity
- ✅ **Better maintainability** - clear patterns
- ✅ **Smaller bundle size** - tree-shaking optimizations
- ✅ **Complete documentation** - easy onboarding

### Expected Business Impact

**User Experience:**
- 📈 **Faster load times** → Higher user satisfaction
- 📈 **Smooth interactions** → Better engagement
- 📈 **Reliable submissions** → Increased trust
- 📈 **No data loss** → Professional quality

**Technical Debt:**
- 📉 **Reduced bugs** → Less support tickets
- 📉 **Better performance** → Lower server costs
- 📉 **Cleaner code** → Faster feature development
- 📉 **Comprehensive tests** → Confident deployments

### Next Steps

1. **Review & Approval** (1 day)
   - Review plan dengan tech lead
   - Get stakeholder approval
   - Allocate resources

2. **Setup & Preparation** (2 days)
   - Create feature flags
   - Setup monitoring
   - Prepare test environments

3. **Phase 1 Implementation** (Week 1-2)
   - Start dengan critical fixes
   - Daily standups untuk progress tracking
   - Continuous testing

4. **Phase 2 Implementation** (Week 2-3)
   - Dashboard optimization (HIGH PRIORITY)
   - User acceptance testing
   - Performance benchmarking

5. **Phases 3-5 Implementation** (Week 4-10)
   - Follow roadmap
   - Regular code reviews
   - Documentation updates

6. **Production Deployment** (Week 11)
   - Gradual rollout
   - Monitor metrics
   - Gather user feedback

---

## Appendix

### Useful Commands

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Check bundle size
npm run analyze

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start development server
npm run dev
```

### References

- [CODE_ANALYSIS_REPORT_2025.md](./CODE_ANALYSIS_REPORT_2025.md) - Detailed analysis
- [AUTH_V2_ARCHITECTURE.md](./AUTH_V2_ARCHITECTURE.md) - Auth V2 documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [SWR Documentation](https://swr.vercel.app/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Prepared by:** AI Code Analyst
**Date:** 6 Oktober 2025
**Project:** PetaTalenta FrontEnd (FutureGuide)
**Status:** ✅ Ready for Implementation

**Approved by:** _________________
**Date:** _________________

