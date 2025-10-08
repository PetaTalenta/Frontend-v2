# Fase 3: Implementasi Perbaikan
**Tanggal**: 8 Oktober 2025  
**Status**: ✅ Complete  

---

## 📋 Summary

Fase ini berhasil mengimplementasikan **semua 6 fixes** untuk mengatasi cross-user token carryover bug. Semua fixes telah diimplementasikan sesuai dengan root cause analysis di Fase 2.

---

## ✅ Implemented Fixes

### Fix #1: Abort In-Flight Requests ✅
**Severity**: 🔴 CRITICAL  
**Files Modified**:
- `src/services/apiService.js`
- `src/services/authV2Service.js`
- `src/contexts/AuthContext.tsx`

**Changes**:

#### 1. apiService.js
```javascript
// Added AbortController tracking
this._activeRequests = new Map(); // requestId -> { controller, metadata, url, method }

// Modified request interceptor
setupRequestInterceptor() {
  this.axiosInstance.interceptors.request.use(async (config) => {
    // Create AbortController for this request
    const controller = new AbortController();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Attach signal to request
    config.signal = controller.signal;
    
    // Track request
    this._activeRequests.set(requestId, {
      controller,
      metadata: config.metadata,
      url: config.url,
      method: config.method
    });
    
    return config;
  });
}

// Modified response interceptor
setupResponseInterceptor() {
  this.axiosInstance.interceptors.response.use(
    (response) => {
      // Remove from active requests on success
      const requestId = response.config.metadata?.requestId;
      if (requestId && this._activeRequests.has(requestId)) {
        this._activeRequests.delete(requestId);
      }
      return response;
    },
    (error) => {
      // Remove from active requests on error
      const requestId = error.config?.metadata?.requestId;
      if (requestId && this._activeRequests.has(requestId)) {
        this._activeRequests.delete(requestId);
      }
      return Promise.reject(error);
    }
  );
}

// Added abort method
abortAllRequests() {
  const count = this._activeRequests.size;
  
  this._activeRequests.forEach((requestInfo, requestId) => {
    requestInfo.controller.abort();
  });
  
  this._activeRequests.clear();
  logger.warn(`✅ All ${count} active requests aborted`);
}
```

#### 2. authV2Service.js
- Same implementation as apiService.js
- Added `_activeRequests` Map
- Modified request/response interceptors
- Added `abortAllRequests()` method

#### 3. AuthContext.tsx
```typescript
const logout = useCallback(async () => {
  // ✅ CRITICAL FIX #1: Abort all in-flight requests FIRST
  try {
    const { default: apiService } = await import('../services/apiService');
    const { default: authV2Service } = await import('../services/authV2Service');
    
    if (typeof (apiService as any).abortAllRequests === 'function') {
      (apiService as any).abortAllRequests();
    }
    if (typeof (authV2Service as any).abortAllRequests === 'function') {
      (authV2Service as any).abortAllRequests();
    }
    
    console.log('✅ All in-flight requests aborted');
  } catch (error) {
    console.error('⚠️ Failed to abort requests:', error);
  }
  
  // ... rest of logout logic
}, [authVersion, user, router, stopRefreshTimer]);
```

**Impact**: Prevents User B from seeing User A's data from in-flight requests.

---

### Fix #2: Clear SWR Cache on Logout ✅
**Severity**: 🔴 CRITICAL  
**Files Modified**:
- `src/contexts/AuthContext.tsx`

**Changes**:
```typescript
const logout = useCallback(async () => {
  // ... abort requests ...
  
  // ✅ CRITICAL FIX #2: Clear ALL SWR cache BEFORE logout
  try {
    console.log('🧹 Clearing SWR cache...');
    
    // Clear all cache globally
    await mutate(
      () => true, // Match all keys
      undefined, // Set to undefined (delete cache)
      { revalidate: false } // Don't revalidate immediately
    );
    
    // Explicitly clear user-specific caches
    if (user?.id) {
      await Promise.all([
        mutate(`assessment-history-${user.id}`, undefined, { revalidate: false }),
        mutate(`user-stats-${user.id}`, undefined, { revalidate: false }),
        mutate(`latest-result-${user.id}`, undefined, { revalidate: false }),
        mutate('/api/profile', undefined, { revalidate: false }),
        mutate('/api/token-balance', undefined, { revalidate: false }),
      ]);
    }
    
    console.log('✅ SWR cache cleared');
  } catch (error) {
    console.error('⚠️ Failed to clear SWR cache:', error);
  }
  
  // ... rest of logout logic
}, [authVersion, user, router, stopRefreshTimer]);
```

**Impact**: Prevents cached data from User A being shown to User B.

**Note**: This fix was already partially implemented, but now it's called BEFORE token clearing for better safety.

---

### Fix #3: User-Scoped Cache Keys ✅
**Severity**: 🔴 CRITICAL  
**Files Modified**:
- `src/services/apiService.js`

**Changes**:

#### 1. Modified `_requestKey()` to include userId
```javascript
_requestKey(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const userId = this.getCurrentUserId() || 'anonymous';
  
  let bodyKey = '';
  try {
    if (options.body) {
      bodyKey = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
  } catch (_) {
    bodyKey = '';
  }
  
  // ✅ Include userId in cache key
  return `${userId}:${method}|${url}|${bodyKey}`;
}
```

#### 2. Added `getCurrentUserId()` helper
```javascript
getCurrentUserId() {
  try {
    const tokenService = require('./tokenService').default;
    return tokenService.getUserId();
  } catch (error) {
    logger.error('[apiService] Failed to get current userId:', error);
    return null;
  }
}
```

#### 3. Added `clearUserCache()` method
```javascript
clearUserCache(userId) {
  if (!userId) {
    this.clearCache();
    return;
  }

  const keysToDelete = [];
  
  // Find all cache entries for this user
  for (const [key, value] of this._cache.entries()) {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key);
    }
  }
  
  // Delete user-specific cache entries
  keysToDelete.forEach(key => this._cache.delete(key));
  
  logger.debug(`Cleared ${keysToDelete.length} cache entries for user: ${userId}`);
}
```

#### 4. Called from AuthContext logout
```typescript
// Clear user-specific cache
if (user?.id && typeof (apiService as any).clearUserCache === 'function') {
  (apiService as any).clearUserCache(user.id);
}
```

**Impact**: Prevents cached responses from User A being served to User B.

---

### Fix #4: Stop Refresh Timer on Logout ✅
**Severity**: 🟡 MEDIUM  
**Files Modified**:
- `src/contexts/AuthContext.tsx`

**Changes**:
```typescript
const logout = useCallback(async () => {
  // ... abort requests ...
  
  // ✅ CRITICAL FIX #4: Stop token refresh timer
  try {
    console.log('⏹️ Stopping token refresh timer...');
    stopRefreshTimer();
    console.log('✅ Token refresh timer stopped');
  } catch (error) {
    console.error('⚠️ Failed to stop refresh timer:', error);
  }
  
  // ... rest of logout logic
}, [authVersion, user, router, stopRefreshTimer]);
```

**Impact**: Prevents memory leak and refresh attempts with cleared tokens.

---

### Fix #5: WebSocket Disconnect Order ✅
**Severity**: 🟡 MEDIUM  
**Files Modified**:
- `src/contexts/AuthContext.tsx`

**Changes**:
```typescript
const logout = useCallback(async () => {
  // ... abort requests ...
  // ... stop refresh timer ...
  // ... clear SWR cache ...
  
  // ✅ CRITICAL FIX #5: Disconnect WebSocket BEFORE clearing tokens
  try {
    console.log('🔌 Disconnecting WebSocket...');
    const { getWebSocketService } = await import('../services/websocket-service');
    const wsService = getWebSocketService();
    wsService.disconnect();
    console.log('✅ WebSocket disconnected');
  } catch (error) {
    console.warn('⚠️ Failed to disconnect WebSocket:', error);
  }
  
  // THEN clear tokens
  tokenService.clearTokens();
  
  // ... rest of logout logic
}, [authVersion, user, router, stopRefreshTimer]);
```

**Impact**: Ensures WebSocket doesn't try to reconnect with stale token.

**Note**: WebSocket.disconnect() already clears `this.token = null`, so this fix ensures proper order.

---

### Fix #6: Add User Validation in Interceptor ✅
**Severity**: 🟡 MEDIUM  
**Files Modified**:
- `src/services/apiService.js`
- `src/services/authV2Service.js`

**Changes**:

#### apiService.js
```javascript
setupRequestInterceptor() {
  this.axiosInstance.interceptors.request.use(async (config) => {
    const tokenService = (await import('./tokenService')).default;
    const authVersion = tokenService.getAuthVersion();
    const userId = tokenService.getUserId(); // ✅ Get userId for validation
    
    if (authVersion === 'v2') {
      const idToken = tokenService.getIdToken();
      
      // ✅ CRITICAL FIX #6: Validate both token and userId exist
      if (idToken && userId) {
        config.headers.Authorization = `Bearer ${idToken}`;
      } else {
        delete config.headers.Authorization;
      }
    }
    
    // Add userId to metadata
    config.metadata = {
      ...config.metadata,
      userId, // ✅ Track which user made the request
    };
    
    return config;
  });
}
```

#### authV2Service.js
```javascript
this.axiosInstance.interceptors.request.use((config) => {
  const idToken = tokenService.getIdToken();
  const userId = tokenService.getUserId(); // ✅ Get userId for validation
  
  // ✅ CRITICAL FIX #6: Validate both token and userId exist
  if (idToken && userId) {
    config.headers.Authorization = `Bearer ${idToken}`;
  } else {
    delete config.headers.Authorization;
  }
  
  return config;
});
```

**Impact**: Prevents requests with token but no userId (edge case).

---

## 📊 Implementation Summary

| Fix # | Description | Severity | Status | Files Modified |
|-------|-------------|----------|--------|----------------|
| 1 | Abort In-Flight Requests | 🔴 CRITICAL | ✅ Complete | 3 files |
| 2 | Clear SWR Cache on Logout | 🔴 CRITICAL | ✅ Complete | 1 file |
| 3 | User-Scoped Cache Keys | 🔴 CRITICAL | ✅ Complete | 1 file |
| 4 | Stop Refresh Timer | 🟡 MEDIUM | ✅ Complete | 1 file |
| 5 | WebSocket Disconnect Order | 🟡 MEDIUM | ✅ Complete | 1 file |
| 6 | User Validation in Interceptor | 🟡 MEDIUM | ✅ Complete | 2 files |

**Total Files Modified**: 4 files
- `src/services/apiService.js`
- `src/services/authV2Service.js`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useTokenRefresh.ts` (no changes, already correct)

---

## 🔄 Logout Flow (After Fixes)

```
1. User clicks Logout
   ↓
2. ✅ Abort all in-flight requests (apiService + authV2Service)
   ↓
3. ✅ Stop token refresh timer
   ↓
4. ✅ Clear SWR cache (all keys)
   ↓
5. ✅ Disconnect WebSocket
   ↓
6. ✅ Call logout API (Auth V2 only)
   ↓
7. ✅ Clear all tokens (tokenService.clearTokens())
   ↓
8. ✅ Clear cookies
   ↓
9. ✅ Clear React state (setToken, setUser)
   ↓
10. ✅ Clear apiService caches (user-scoped + all)
   ↓
11. ✅ Clear localStorage caches
   ↓
12. ✅ Redirect to /auth
```

---

## ✅ Next Steps (Fase 4)

1. **Run E2E Tests** - Verify fixes work
2. **Add Unit Tests** - Test each fix individually
3. **Run Linter** - Ensure code quality
4. **Run Build** - Ensure no build errors

---

*Fase 3 Complete: 8 Oktober 2025*  
*Next: Fase 4 - Testing & Validation*

