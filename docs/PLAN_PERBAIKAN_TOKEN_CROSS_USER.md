# Rencana Perbaikan Token Cross-User Issue

**Project**: FutureGuide Frontend  
**Issue**: Token User A Terbawa ke User B  
**Severity**: 🔴 CRITICAL  
**Target Completion**: 4-6 minggu

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Critical Fixes (Week 1-2)](#phase-1-critical-fixes-week-1-2)
3. [Phase 2: Architectural Improvements (Week 3-4)](#phase-2-architectural-improvements-week-3-4)
4. [Phase 3: Testing & Validation (Week 5)](#phase-3-testing--validation-week-5)
5. [Phase 4: Monitoring & Optimization (Week 6)](#phase-4-monitoring--optimization-week-6)
6. [Risk Mitigation](#risk-mitigation)
7. [Success Criteria](#success-criteria)

---

## 🎯 Overview

Rencana perbaikan ini dibagi menjadi **4 fase bertahap** untuk memastikan:
- ✅ Critical issues fixed first
- ✅ Backward compatibility maintained
- ✅ Minimal disruption to existing features
- ✅ Comprehensive testing at each phase

**Total Estimated Effort**: 120-160 hours

---

## 🚨 Phase 1: Critical Fixes (Week 1-2)

**Goal**: Fix critical security vulnerabilities and data leakage issues  
**Duration**: 10-14 hari  
**Effort**: 40-50 hours

### 1.1 Fix Cache Clear Timing (P0)

**Issue**: Cache tidak di-clear sebelum login  
**File**: `src/contexts/AuthContext.tsx`

#### Changes Required:

```typescript
// BEFORE (BUGGY)
const login = useCallback(async (newToken: string, newUser: User) => {
  console.log('AuthContext: User logging in:', newUser.email);
  
  // ❌ Cache clear SETELAH login dimulai
  try {
    await mutate(() => true, undefined, { revalidate: false });
  } catch (error) {
    console.error('Failed to clear SWR cache:', error);
  }
  
  clearDemoAssessmentData();
  setToken(newToken);
  setUser(newUser);
  // ...
});

// AFTER (FIXED)
const login = useCallback(async (newToken: string, newUser: User) => {
  console.log('🔐 AuthContext: Starting login for:', newUser.email);
  
  // ✅ STEP 1: Clear ALL caches FIRST
  try {
    console.log('🧹 Clearing all caches before login...');
    
    // Clear SWR cache
    await mutate(() => true, undefined, { revalidate: false });
    
    // Clear apiService cache
    const { apiService } = await import('../services/apiService');
    if (apiService._cache) apiService._cache.clear();
    if (apiService._inflight) apiService._inflight.clear();
    
    // Clear localStorage caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('tokenBalanceCache') || 
          key.startsWith('swr:') ||
          key.startsWith('cache:')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
    // Continue anyway
  }
  
  // ✅ STEP 2: Clear old session data
  clearDemoAssessmentData();
  
  // ✅ STEP 3: Disconnect old WebSocket connections
  try {
    const { getWebSocketService } = await import('../services/websocket-service');
    const wsService = getWebSocketService();
    wsService.disconnect();
    console.log('✅ WebSocket disconnected');
  } catch (error) {
    console.warn('Failed to disconnect WebSocket:', error);
  }
  
  // ✅ STEP 4: Set new user (with atomic transaction)
  const currentUserId = newUser.id;
  setToken(newToken);
  setUser(newUser);
  
  // ✅ STEP 5: Atomic localStorage update
  await storageManager.setMultiple({
    'token': newToken,
    'user': newUser
  });
  
  // ✅ STEP 6: Set cookie
  document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
  
  console.log('✅ Login successful for:', newUser.email);
  
  // ✅ STEP 7: Fetch profile (with validation)
  fetchUsernameFromProfile(newToken, currentUserId).catch(error => {
    console.warn('Failed to fetch profile (non-blocking):', error);
  });
  
  // ✅ STEP 8: Redirect
  router.push('/dashboard');
}, [router, fetchUsernameFromProfile]);
```

**Testing**:
- [ ] Fast user switch (< 500ms between logout and login)
- [ ] Multi-tab scenario
- [ ] Slow network simulation
- [ ] Verify no cached data from previous user

**Estimated Time**: 8 hours

---

### 1.2 Add User ID Validation to Token Service (P0)

**Issue**: Token diambil tanpa validasi user ID  
**File**: `src/services/tokenService.js`

#### Changes Required:

```javascript
// NEW: Add user validation to getIdToken
getIdToken(expectedUserId = null) {
  try {
    // Get token from storage
    let token = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
    if (!token) token = localStorage.getItem('token');
    if (!token) token = localStorage.getItem('auth_token');
    
    if (!token) return null;
    
    // ✅ NEW: Validate token matches current user
    if (expectedUserId) {
      const storedUserId = this.getUserId();
      
      if (storedUserId && storedUserId !== expectedUserId) {
        logger.warn('Token user ID mismatch!', {
          expected: expectedUserId,
          stored: storedUserId
        });
        
        // Clear mismatched token
        this.clearTokens();
        return null;
      }
    }
    
    return token;
  } catch (error) {
    logger.error('Failed to get ID token', error);
    return null;
  }
}

// UPDATE: Store userId with token
storeTokens(idToken, refreshToken, userId = null) {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // ✅ CRITICAL: Store userId for validation
    if (!userId) {
      throw new Error('userId is required when storing tokens');
    }
    
    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.TOKEN_ISSUED_AT, now.toString());
    localStorage.setItem(STORAGE_KEYS.AUTH_VERSION, 'v2');
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId); // ✅ Store userId
    
    // Backward compatibility
    localStorage.setItem('token', idToken);
    localStorage.setItem('auth_token', idToken);
    
    this.setTokenCookie(idToken);
    
    logger.debug('Tokens stored with user validation', { userId });
  } catch (error) {
    logger.error('Failed to store tokens', error);
    throw error;
  }
}

// UPDATE: Clear with logging
clearTokens() {
  try {
    const currentUserId = this.getUserId();
    logger.debug('Clearing tokens for user:', currentUserId);
    
    // Clear Auth V2 keys
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_ISSUED_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.AUTH_VERSION);
    
    // Clear legacy keys
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('uid');
    localStorage.removeItem('email');
    localStorage.removeItem('displayName');
    localStorage.removeItem('photoURL');
    
    this.clearTokenCookie();
    
    logger.debug('All tokens cleared successfully');
  } catch (error) {
    logger.error('Failed to clear tokens', error);
  }
}
```

**Testing**:
- [ ] Token retrieval with user validation
- [ ] Automatic token clear on mismatch
- [ ] Backward compatibility with old code

**Estimated Time**: 6 hours

---

### 1.3 Fix Race Condition in checkTokenBalance (P0)

**Issue**: Race condition saat mengambil token balance  
**File**: `src/utils/token-balance.ts`

#### Changes Required:

```typescript
// NEW: Add request locking mechanism
const activeTokenBalanceRequests = new Map<string, Promise<TokenBalanceInfo>>();

export async function checkTokenBalance(
  expectedUserId?: string, 
  skipCache: boolean = false
): Promise<TokenBalanceInfo> {
  console.log('Token Balance: Starting check...', { expectedUserId, skipCache });
  
  try {
    // ✅ STEP 1: Validate authentication FIRST
    const token = tokenService.getIdToken(expectedUserId); // Pass userId for validation
    if (!token) {
      console.error('Token Balance: No authentication token found');
      return {
        balance: -1,
        hasEnoughTokens: false,
        message: 'Authentication required. Please login again.',
        error: true,
      };
    }
    
    // ✅ STEP 2: Validate user consistency
    const userStr = localStorage.getItem('user');
    const currentUserId = userStr ? JSON.parse(userStr).id : null;
    
    if (!currentUserId) {
      return {
        balance: -1,
        hasEnoughTokens: false,
        message: 'User session invalid. Please login again.',
        error: true,
      };
    }
    
    if (expectedUserId && currentUserId !== expectedUserId) {
      console.warn('Token Balance: User ID mismatch', {
        expected: expectedUserId,
        current: currentUserId
      });
      return {
        balance: -1,
        hasEnoughTokens: false,
        message: 'User session changed. Please refresh.',
        error: true,
      };
    }
    
    // ✅ STEP 3: De-duplicate concurrent requests per user
    const requestKey = `token-balance-${currentUserId}`;
    
    if (activeTokenBalanceRequests.has(requestKey)) {
      console.log('Token Balance: Reusing in-flight request');
      return activeTokenBalanceRequests.get(requestKey)!;
    }
    
    // ✅ STEP 4: Create new request with locking
    const requestPromise = (async () => {
      try {
        // Check cache (unless skipCache)
        if (!skipCache) {
          const cachedBalance = getCachedBalance(currentUserId);
          if (cachedBalance !== null) {
            console.log('Token Balance: Using cached balance');
            return {
              balance: cachedBalance,
              hasEnoughTokens: hasEnoughTokensForAssessment(cachedBalance),
              lastUpdated: new Date().toISOString(),
              message: hasEnoughTokensForAssessment(cachedBalance)
                ? `You have ${cachedBalance} tokens available.`
                : getInsufficientTokensMessage(cachedBalance),
              error: false,
            };
          }
        }
        
        // Call API with user validation header
        console.log('Token Balance: Calling API...');
        const response = await apiService.getTokenBalance();
        
        // ✅ STEP 5: Validate response matches current user
        const responseUserId = response?.data?.userId || response?.data?.user_id;
        if (responseUserId && responseUserId !== currentUserId) {
          console.error('Token Balance: Response user mismatch!', {
            expected: currentUserId,
            received: responseUserId
          });
          
          throw new Error('User session changed during request');
        }
        
        // Parse balance
        const balance = response?.data?.token_balance 
          ?? response?.data?.tokenBalance 
          ?? response?.data?.balance 
          ?? 0;
        
        // Validate balance
        if (typeof balance !== 'number' || isNaN(balance)) {
          console.warn('Token Balance: Invalid balance value:', balance);
          return {
            balance: 0,
            hasEnoughTokens: false,
            message: 'Invalid token balance received',
            error: true,
          };
        }
        
        // ✅ STEP 6: Cache result with user ID
        setCachedBalance(currentUserId, balance);
        
        return {
          balance,
          hasEnoughTokens: hasEnoughTokensForAssessment(balance),
          lastUpdated: new Date().toISOString(),
          message: hasEnoughTokensForAssessment(balance)
            ? `You have ${balance} tokens available.`
            : getInsufficientTokensMessage(balance),
          error: false,
        };
        
      } finally {
        // ✅ STEP 7: Clear request lock
        activeTokenBalanceRequests.delete(requestKey);
      }
    })();
    
    // Store promise for deduplication
    activeTokenBalanceRequests.set(requestKey, requestPromise);
    
    return await requestPromise;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error loading token balance';
    console.error('Token Balance: Check failed:', errorMessage);
    
    return {
      balance: -1,
      hasEnoughTokens: false,
      message: errorMessage,
      error: true,
    };
  }
}
```

**Testing**:
- [ ] Concurrent requests de-duplicated
- [ ] User validation prevents cross-user data
- [ ] Request locking works correctly

**Estimated Time**: 10 hours

---

### 1.4 Clear apiService Cache on Logout (P1)

**Issue**: In-memory cache tidak di-clear  
**File**: `src/services/apiService.js`

#### Changes Required:

```javascript
class ApiService {
  // ... existing code ...
  
  /**
   * ✅ NEW: Clear all caches (for user logout/switch)
   */
  clearAllCaches() {
    console.log('🧹 apiService: Clearing all caches...');
    
    // Clear in-memory cache
    if (this._cache) {
      const cacheSize = this._cache.size;
      this._cache.clear();
      console.log(`✅ Cleared ${cacheSize} cache entries`);
    }
    
    // Clear in-flight requests
    if (this._inflight) {
      const inflightCount = this._inflight.size;
      this._inflight.clear();
      console.log(`✅ Cleared ${inflightCount} in-flight requests`);
    }
    
    console.log('✅ apiService: All caches cleared');
  }
  
  /**
   * ✅ NEW: Clear cache for specific user
   */
  clearUserCache(userId) {
    if (!userId) return;
    
    console.log(`🧹 apiService: Clearing cache for user: ${userId}`);
    
    // Clear cache entries that contain userId
    if (this._cache) {
      let clearedCount = 0;
      
      for (const [key, value] of this._cache.entries()) {
        if (key.includes(userId) || 
            key.includes(`user=${userId}`) ||
            value.data?.userId === userId) {
          this._cache.delete(key);
          clearedCount++;
        }
      }
      
      console.log(`✅ Cleared ${clearedCount} user-specific cache entries`);
    }
  }
}

// Export singleton with cache clear method
const apiService = new ApiService();
export { apiService as default };
export { apiService }; // For named import
```

**Update AuthContext logout**:

```typescript
// src/contexts/AuthContext.tsx
const logout = useCallback(async () => {
  console.log('AuthContext: Logout initiated');
  
  // ✅ Clear apiService caches FIRST
  try {
    const { apiService } = await import('../services/apiService');
    apiService.clearAllCaches(); // ✅ NEW: Clear all caches
    console.log('✅ apiService caches cleared');
  } catch (error) {
    console.warn('Failed to clear apiService caches:', error);
  }
  
  // ... rest of logout logic ...
}, []);
```

**Testing**:
- [ ] Cache cleared on logout
- [ ] User-specific cache cleared on user switch
- [ ] No memory leaks

**Estimated Time**: 4 hours

---

### 1.5 Fix SWR Cache Keys (P1)

**Issue**: SWR cache keys tidak include userId  
**Files**: Multiple files using SWR

#### Changes Required:

**Step 1: Create user-scoped cache key utility**

```typescript
// NEW FILE: src/utils/cache-keys.ts

/**
 * Generate user-scoped cache keys for SWR
 * Ensures cache isolation between users
 */

export const cacheKeys = {
  // Profile
  profile: (userId: string) => `profile-${userId}`,
  
  // Token Balance
  tokenBalance: (userId: string) => `token-balance-${userId}`,
  
  // Assessment History
  assessmentHistory: (userId: string) => `assessment-history-${userId}`,
  
  // User Stats
  userStats: (userId: string) => `user-stats-${userId}`,
  
  // Latest Result
  latestResult: (userId: string) => `latest-result-${userId}`,
  
  // Assessment Result
  assessmentResult: (userId: string, resultId: string) => 
    `assessment-result-${userId}-${resultId}`,
  
  // Generic user data
  userData: (userId: string, key: string) => `user-data-${userId}-${key}`,
};

/**
 * Get all cache keys for a specific user
 */
export function getUserCacheKeys(userId: string): string[] {
  return [
    cacheKeys.profile(userId),
    cacheKeys.tokenBalance(userId),
    cacheKeys.assessmentHistory(userId),
    cacheKeys.userStats(userId),
    cacheKeys.latestResult(userId),
  ];
}

/**
 * Clear all cache keys for a specific user
 */
export async function clearUserCaches(userId: string): Promise<void> {
  const keys = getUserCacheKeys(userId);
  const { mutate } = await import('swr');
  
  await Promise.all(
    keys.map(key => mutate(key, undefined, { revalidate: false }))
  );
  
  console.log(`✅ Cleared ${keys.length} cache keys for user: ${userId}`);
}
```

**Step 2: Update all SWR usage to use new keys**

```typescript
// BEFORE (BUGGY)
const { data } = useSWR('/api/token-balance', fetcher);

// AFTER (FIXED)
import { cacheKeys } from '../utils/cache-keys';
const { user } = useAuth();
const { data } = useSWR(
  user?.id ? cacheKeys.tokenBalance(user.id) : null, 
  fetcher
);
```

**Files to Update**:
- [ ] `src/contexts/TokenContext.tsx`
- [ ] `src/hooks/useDashboardData.ts`
- [ ] `src/hooks/useAssessmentData.ts`
- [ ] `src/hooks/useUserData.ts`
- [ ] All components using SWR

**Testing**:
- [ ] Cache isolated per user
- [ ] User switch clears old cache
- [ ] New cache keys work correctly

**Estimated Time**: 12 hours

---

## 🏗️ Phase 2: Architectural Improvements (Week 3-4)

**Goal**: Improve architecture for long-term maintainability  
**Duration**: 10-14 hari  
**Effort**: 40-50 hours

### 2.1 Implement User Session Isolation

**Create user session manager**:

```typescript
// NEW FILE: src/utils/user-session-manager.ts

/**
 * User Session Manager
 * Provides complete isolation between user sessions
 */

interface UserSession {
  userId: string;
  token: string;
  startedAt: number;
  lastActivityAt: number;
}

class UserSessionManager {
  private currentSession: UserSession | null = null;
  private sessionChangeListeners: Set<(session: UserSession | null) => void> = new Set();
  
  /**
   * Start new user session
   * Automatically ends previous session
   */
  async startSession(userId: string, token: string): Promise<void> {
    console.log('🔐 Starting new session for user:', userId);
    
    // End previous session if exists
    if (this.currentSession) {
      await this.endSession();
    }
    
    // Create new session
    this.currentSession = {
      userId,
      token,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    
    // Notify listeners
    this.notifySessionChange(this.currentSession);
    
    console.log('✅ New session started:', userId);
  }
  
  /**
   * End current session
   * Clears all session data
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;
    
    const { userId } = this.currentSession;
    console.log('🔒 Ending session for user:', userId);
    
    // Clear all user-specific data
    await this.clearSessionData(userId);
    
    // Clear session
    this.currentSession = null;
    
    // Notify listeners
    this.notifySessionChange(null);
    
    console.log('✅ Session ended:', userId);
  }
  
  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }
  
  /**
   * Validate current session
   */
  validateSession(expectedUserId: string): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.userId === expectedUserId;
  }
  
  /**
   * Clear all session data for user
   */
  private async clearSessionData(userId: string): Promise<void> {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes(userId)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear SWR cache
    const { clearUserCaches } = await import('./cache-keys');
    await clearUserCaches(userId);
    
    // Clear apiService cache
    const { apiService } = await import('../services/apiService');
    apiService.clearUserCache(userId);
  }
  
  /**
   * Add session change listener
   */
  onSessionChange(listener: (session: UserSession | null) => void): () => void {
    this.sessionChangeListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.sessionChangeListeners.delete(listener);
    };
  }
  
  /**
   * Notify all listeners of session change
   */
  private notifySessionChange(session: UserSession | null): void {
    this.sessionChangeListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session change listener:', error);
      }
    });
  }
  
  /**
   * Update last activity time
   */
  updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivityAt = Date.now();
    }
  }
}

// Singleton instance
export const userSessionManager = new UserSessionManager();
```

**Integrate with AuthContext**:

```typescript
// src/contexts/AuthContext.tsx

const login = useCallback(async (newToken: string, newUser: User) => {
  // ✅ Use session manager
  await userSessionManager.startSession(newUser.id, newToken);
  
  // Set state
  setToken(newToken);
  setUser(newUser);
  
  // ... rest of login logic
}, []);

const logout = useCallback(async () => {
  // ✅ Use session manager
  await userSessionManager.endSession();
  
  // Clear state
  setToken(null);
  setUser(null);
  
  // ... rest of logout logic
}, []);
```

**Estimated Time**: 16 hours

---

### 2.2 Consolidate Token Storage

**Reduce from 15+ keys to 5 keys**:

```typescript
// NEW FILE: src/utils/unified-token-storage.ts

/**
 * Unified Token Storage
 * Single source of truth for token storage
 */

const STORAGE_PREFIX = 'fg_auth_'; // FutureGuide auth prefix

const KEYS = {
  TOKEN: `${STORAGE_PREFIX}token`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh`,
  USER: `${STORAGE_PREFIX}user`,
  SESSION: `${STORAGE_PREFIX}session`,
  VERSION: `${STORAGE_PREFIX}version`,
};

export const unifiedTokenStorage = {
  /**
   * Store complete auth data
   */
  storeAuth(data: {
    token: string;
    refreshToken?: string;
    user: any;
    version: 'v1' | 'v2';
  }): void {
    const session = {
      userId: data.user.id,
      startedAt: Date.now(),
    };
    
    localStorage.setItem(KEYS.TOKEN, data.token);
    localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    localStorage.setItem(KEYS.VERSION, data.version);
    
    if (data.refreshToken) {
      localStorage.setItem(KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    
    // Set cookie
    document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    
    console.log('✅ Auth data stored:', data.user.id);
  },
  
  /**
   * Get token with validation
   */
  getToken(expectedUserId?: string): string | null {
    const token = localStorage.getItem(KEYS.TOKEN);
    if (!token) return null;
    
    // Validate if userId provided
    if (expectedUserId) {
      const session = this.getSession();
      if (session && session.userId !== expectedUserId) {
        console.warn('Token user mismatch!');
        return null;
      }
    }
    
    return token;
  },
  
  /**
   * Get user data
   */
  getUser(): any | null {
    const userStr = localStorage.getItem(KEYS.USER);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  
  /**
   * Get session info
   */
  getSession(): { userId: string; startedAt: number } | null {
    const sessionStr = localStorage.getItem(KEYS.SESSION);
    if (!sessionStr) return null;
    
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  },
  
  /**
   * Clear all auth data
   */
  clearAuth(): void {
    // Clear new keys
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear legacy keys for backward compatibility
    const legacyKeys = [
      'token', 'auth_token', 'authToken',
      'authV2_idToken', 'authV2_refreshToken',
      'user', 'user_data'
    ];
    
    legacyKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    console.log('✅ All auth data cleared');
  },
  
  /**
   * Validate auth state
   */
  isValid(): boolean {
    const token = localStorage.getItem(KEYS.TOKEN);
    const user = localStorage.getItem(KEYS.USER);
    const session = localStorage.getItem(KEYS.SESSION);
    
    return !!(token && user && session);
  }
};
```

**Migration Path**:
1. Week 3: Implement new storage (parallel with old)
2. Week 3-4: Update all code to use new storage
3. Week 4: Add deprecation warnings for old storage
4. Week 5: Remove old storage (with feature flag)

**Estimated Time**: 20 hours

---

### 2.3 Add Request Cancellation

**Implement cancellation for async operations**:

```typescript
// NEW FILE: src/utils/cancellable-request.ts

/**
 * Cancellable Request Manager
 * Allows cancellation of in-flight requests
 */

export class CancellableRequest<T> {
  private abortController: AbortController;
  private promise: Promise<T>;
  private cancelled = false;
  
  constructor(executor: (signal: AbortSignal) => Promise<T>) {
    this.abortController = new AbortController();
    this.promise = executor(this.abortController.signal);
  }
  
  /**
   * Cancel the request
   */
  cancel(): void {
    if (!this.cancelled) {
      this.cancelled = true;
      this.abortController.abort();
      console.log('Request cancelled');
    }
  }
  
  /**
   * Check if cancelled
   */
  isCancelled(): boolean {
    return this.cancelled;
  }
  
  /**
   * Get the promise
   */
  getPromise(): Promise<T> {
    return this.promise;
  }
}

/**
 * Request manager for user-scoped cancellation
 */
class UserRequestManager {
  private activeRequests = new Map<string, Set<CancellableRequest<any>>>();
  
  /**
   * Register request for user
   */
  register<T>(userId: string, request: CancellableRequest<T>): void {
    if (!this.activeRequests.has(userId)) {
      this.activeRequests.set(userId, new Set());
    }
    
    this.activeRequests.get(userId)!.add(request);
  }
  
  /**
   * Cancel all requests for user
   */
  cancelAll(userId: string): void {
    const requests = this.activeRequests.get(userId);
    
    if (requests) {
      requests.forEach(request => request.cancel());
      requests.clear();
      this.activeRequests.delete(userId);
      
      console.log(`✅ Cancelled ${requests.size} requests for user: ${userId}`);
    }
  }
  
  /**
   * Clean up completed requests
   */
  cleanup(userId: string, request: CancellableRequest<any>): void {
    const requests = this.activeRequests.get(userId);
    if (requests) {
      requests.delete(request);
    }
  }
}

export const userRequestManager = new UserRequestManager();
```

**Use in profile fetch**:

```typescript
// src/contexts/AuthContext.tsx

const fetchUsernameFromProfile = useCallback(async (
  authToken: string, 
  expectedUserId: string
) => {
  // ✅ Create cancellable request
  const request = new CancellableRequest(async (signal) => {
    const profileData = await apiService.getProfile({ signal });
    return profileData;
  });
  
  // ✅ Register request
  userRequestManager.register(expectedUserId, request);
  
  try {
    const profileData = await request.getPromise();
    
    // ✅ Check if still valid
    if (request.isCancelled()) {
      console.log('Profile fetch cancelled');
      return;
    }
    
    // Validate user ID
    if (profileUser.id !== expectedUserId) {
      console.warn('Profile mismatch');
      return;
    }
    
    // Update user
    updateUser(updates);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Profile fetch aborted');
    } else {
      console.error('Profile fetch failed:', error);
    }
  } finally {
    // ✅ Cleanup
    userRequestManager.cleanup(expectedUserId, request);
  }
}, [updateUser]);
```

**Estimated Time**: 14 hours

---

## 🧪 Phase 3: Testing & Validation (Week 5)

**Goal**: Comprehensive testing of all fixes  
**Duration**: 5-7 hari  
**Effort**: 20-30 hours

### 3.1 Unit Tests

**Test Coverage Target**: 80%+

```typescript
// tests/contexts/AuthContext.test.tsx

describe('AuthContext - User Switch', () => {
  it('should clear cache before login', async () => {
    // Arrange
    const userA = { id: '1', email: 'a@test.com' };
    const userB = { id: '2', email: 'b@test.com' };
    
    // Act: Login as User A
    await login('tokenA', userA);
    expect(getUser()).toEqual(userA);
    
    // Act: Logout and login as User B
    await logout();
    await login('tokenB', userB);
    
    // Assert: No User A data remains
    expect(getUser()).toEqual(userB);
    expect(getCachedBalance('1')).toBeNull();
    expect(localStorage.getItem('tokenBalanceCache_1')).toBeNull();
  });
  
  it('should prevent race condition in token balance', async () => {
    // Arrange
    const userId = '123';
    
    // Act: Start multiple concurrent requests
    const promises = [
      checkTokenBalance(userId),
      checkTokenBalance(userId),
      checkTokenBalance(userId),
    ];
    
    const results = await Promise.all(promises);
    
    // Assert: All return same result (de-duplicated)
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });
  
  it('should cancel in-flight requests on logout', async () => {
    // Arrange
    const userId = '123';
    
    // Act: Start profile fetch
    const profilePromise = fetchUsernameFromProfile('token', userId);
    
    // Act: Logout immediately
    await logout();
    
    // Assert: Profile fetch was cancelled
    await expect(profilePromise).rejects.toThrow('AbortError');
  });
});
```

**Estimated Time**: 12 hours

---

### 3.2 Integration Tests

```typescript
// tests/integration/user-switch.test.tsx

describe('User Switch Integration', () => {
  it('should handle fast user switch correctly', async () => {
    // Scenario: User A logout, immediate User B login
    
    // Step 1: Setup User A
    await loginAsUserA();
    await waitForDashboardLoad();
    
    // Step 2: Fast switch to User B
    await logout();
    await loginAsUserB(); // < 500ms after logout
    
    // Step 3: Verify User B data only
    const tokenBalance = await getTokenBalance();
    expect(tokenBalance.userId).toBe('userB');
    
    const assessments = await getAssessmentHistory();
    expect(assessments.every(a => a.userId === 'userB')).toBe(true);
  });
  
  it('should handle multi-tab scenario', async () => {
    // Scenario: User A in Tab 1, User B login in Tab 2
    
    // Tab 1: Login as User A
    const tab1 = await openNewTab();
    await tab1.loginAsUserA();
    
    // Tab 2: Login as User B
    const tab2 = await openNewTab();
    await tab2.loginAsUserB();
    
    // Verify: Tab 1 syncs to User B (or shows error)
    const tab1User = await tab1.getCurrentUser();
    expect(tab1User.id).toBe('userB');
  });
});
```

**Estimated Time**: 10 hours

---

### 3.3 E2E Tests

```typescript
// tests/e2e/user-switch.e2e.ts

describe('User Switch E2E', () => {
  it('should switch users without data leakage', async () => {
    // Full end-to-end test
    
    // User A session
    await page.goto('/auth');
    await page.fill('[name="email"]', 'userA@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    const balanceA = await page.textContent('[data-testid="token-balance"]');
    
    // Logout
    await page.click('[data-testid="logout"]');
    await page.waitForURL('/auth');
    
    // User B session
    await page.fill('[name="email"]', 'userB@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard');
    const balanceB = await page.textContent('[data-testid="token-balance"]');
    
    // Verify: Different balances
    expect(balanceA).not.toBe(balanceB);
  });
});
```

**Estimated Time**: 8 hours

---

## 📊 Phase 4: Monitoring & Optimization (Week 6)

**Goal**: Add monitoring and optimize performance  
**Duration**: 5-7 hari  
**Effort**: 20-25 hours

### 4.1 Add Session Monitoring

```typescript
// NEW FILE: src/utils/session-monitor.ts

/**
 * Session Monitor
 * Tracks session health and detects anomalies
 */

class SessionMonitor {
  private metrics = {
    loginCount: 0,
    logoutCount: 0,
    userSwitchCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    raconditionsPrevented: 0,
    errors: [] as any[],
  };
  
  /**
   * Track login event
   */
  trackLogin(userId: string): void {
    this.metrics.loginCount++;
    
    console.log('[Monitor] Login tracked', {
      userId,
      total: this.metrics.loginCount,
    });
  }
  
  /**
   * Track user switch
   */
  trackUserSwitch(fromUserId: string, toUserId: string): void {
    this.metrics.userSwitchCount++;
    
    console.log('[Monitor] User switch tracked', {
      from: fromUserId,
      to: toUserId,
      total: this.metrics.userSwitchCount,
    });
  }
  
  /**
   * Track race condition prevented
   */
  trackRaceConditionPrevented(context: string): void {
    this.metrics.raconditionsPrevented++;
    
    console.log('[Monitor] Race condition prevented', {
      context,
      total: this.metrics.raconditionsPrevented,
    });
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      loginCount: 0,
      logoutCount: 0,
      userSwitchCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      raconditionsPrevented: 0,
      errors: [],
    };
  }
}

export const sessionMonitor = new SessionMonitor();
```

**Estimated Time**: 8 hours

---

### 4.2 Performance Optimization

**Optimize cache operations**:

```typescript
// Batch cache operations
export async function batchClearCaches(userIds: string[]): Promise<void> {
  const operations = userIds.flatMap(userId => getUserCacheKeys(userId));
  
  // Clear in parallel
  await Promise.all(
    operations.map(key => mutate(key, undefined, { revalidate: false }))
  );
  
  console.log(`✅ Cleared ${operations.length} cache keys`);
}

// Lazy cache invalidation
export function scheduleCacheInvalidation(userId: string, delay = 100): void {
  setTimeout(() => {
    clearUserCaches(userId);
  }, delay);
}
```

**Estimated Time**: 8 hours

---

### 4.3 Add Error Recovery

```typescript
// NEW FILE: src/utils/session-recovery.ts

/**
 * Session Recovery
 * Handles session corruption and recovery
 */

export async function recoverSession(): Promise<boolean> {
  try {
    console.log('🔧 Attempting session recovery...');
    
    // Step 1: Check if session data exists
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      console.log('No session to recover');
      return false;
    }
    
    // Step 2: Validate session consistency
    const user = JSON.parse(userStr);
    const session = unifiedTokenStorage.getSession();
    
    if (session && session.userId !== user.id) {
      console.error('Session corruption detected!');
      
      // Clear corrupted session
      await unifiedTokenStorage.clearAuth();
      return false;
    }
    
    // Step 3: Verify token with backend
    const isValid = await apiService.validateToken(token);
    
    if (!isValid) {
      console.error('Token invalid');
      await unifiedTokenStorage.clearAuth();
      return false;
    }
    
    console.log('✅ Session recovered successfully');
    return true;
    
  } catch (error) {
    console.error('Session recovery failed:', error);
    return false;
  }
}
```

**Estimated Time**: 9 hours

---

## 🛡️ Risk Mitigation

### Rollback Plan

**Feature Flag Implementation**:

```typescript
// NEW FILE: src/config/feature-flags.ts

export const FEATURE_FLAGS = {
  // Phase 1
  USE_NEW_CACHE_CLEAR: true,
  USE_USER_ID_VALIDATION: true,
  USE_RACE_CONDITION_FIX: true,
  
  // Phase 2
  USE_SESSION_MANAGER: false, // Rollback-able
  USE_UNIFIED_STORAGE: false, // Rollback-able
  USE_REQUEST_CANCELLATION: false, // Rollback-able
};

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
```

### Backward Compatibility

1. **Week 1-2**: Phase 1 changes are backward compatible
2. **Week 3-4**: Phase 2 uses parallel implementation
3. **Week 5**: Toggle feature flags for A/B testing
4. **Week 6**: Full rollout with monitoring

### Emergency Procedures

```typescript
// Emergency: Disable all new features
export function emergencyRollback(): void {
  console.error('🚨 EMERGENCY ROLLBACK INITIATED');
  
  // Disable all feature flags
  Object.keys(FEATURE_FLAGS).forEach(key => {
    FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS] = false;
  });
  
  // Clear all caches
  localStorage.clear();
  sessionStorage.clear();
  
  // Force page reload
  window.location.reload();
}
```

---

## ✅ Success Criteria

### Phase 1 Success Criteria

- [ ] **P0 Issues Fixed**: All critical security issues resolved
- [ ] **Test Coverage**: 80%+ coverage for critical paths
- [ ] **Performance**: No regression in page load time
- [ ] **User Validation**: 0 instances of cross-user data leakage in testing

### Phase 2 Success Criteria

- [ ] **Architecture Improved**: Session isolation implemented
- [ ] **Code Simplicity**: Reduced from 15+ storage keys to 5 keys
- [ ] **Maintainability**: Code complexity reduced by 40%
- [ ] **Documentation**: All new systems documented

### Phase 3 Success Criteria

- [ ] **Test Suite**: 200+ tests passing
- [ ] **E2E Tests**: All user scenarios covered
- [ ] **Bug Reports**: 0 critical bugs found in testing
- [ ] **Performance**: Cache operations < 50ms

### Phase 4 Success Criteria

- [ ] **Monitoring**: Session metrics tracked
- [ ] **Error Rate**: < 0.1% session errors
- [ ] **Recovery**: Automatic recovery from corruption
- [ ] **User Satisfaction**: No user complaints about data mix-up

---

## 📅 Timeline Summary

| Phase | Duration | Effort | Status |
|-------|----------|--------|--------|
| Phase 1: Critical Fixes | Week 1-2 | 40-50h | 🔴 Not Started |
| Phase 2: Architecture | Week 3-4 | 40-50h | 🔴 Not Started |
| Phase 3: Testing | Week 5 | 20-30h | 🔴 Not Started |
| Phase 4: Monitoring | Week 6 | 20-25h | 🔴 Not Started |
| **TOTAL** | **6 weeks** | **120-160h** | 🔴 **Pending** |

---

## 🚀 Getting Started

### Week 1 - Day 1 Actions

1. **Create Feature Branch**:
   ```bash
   git checkout -b fix/token-cross-user-issue
   ```

2. **Setup Testing Environment**:
   ```bash
   npm install --save-dev @testing-library/react
   npm install --save-dev playwright
   ```

3. **Create Tracking Board**:
   - Create GitHub Project or Jira Board
   - Add all tasks from this plan
   - Assign priorities

4. **Team Meeting**:
   - Review this plan
   - Assign responsibilities
   - Set up daily standups

---

## 📞 Stakeholder Communication

### Weekly Status Report Template

```markdown
# Token Cross-User Fix - Week X Update

## Progress This Week
- ✅ Completed: [List completed items]
- 🔄 In Progress: [List in-progress items]
- 🔴 Blocked: [List blockers]

## Metrics
- Test Coverage: X%
- Bugs Fixed: X
- New Tests: X
- Performance: +/-X%

## Next Week Plan
- [List planned items]

## Risks & Mitigation
- [List any risks]
```

---

## 📝 Notes

- **Priority**: P0 issues must be fixed before Phase 2
- **Testing**: Each phase requires sign-off before proceeding
- **Rollback**: Feature flags enable quick rollback if needed
- **Documentation**: Update docs as features are implemented

---

**Document Owner**: Development Team  
**Last Updated**: 8 Oktober 2025  
**Version**: 1.0  
**Status**: 📋 Ready for Review
