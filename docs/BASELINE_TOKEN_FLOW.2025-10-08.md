# Baseline: Token Flow & Storage Mapping
**Tanggal**: 8 Oktober 2025  
**Fase**: 0 - Baseline & Environment Setup  
**Status**: ✅ Complete

---

## 📋 Executive Summary

Dokumentasi ini memetakan **seluruh siklus hidup token** di PetaTalenta-FrontEnd untuk mengidentifikasi semua titik potensial kebocoran token lintas akun.

### Cara Menjalankan Project

```bash
# Development
npm run dev                    # Start Next.js dev server (port 3000)
npm run start:websocket        # Start mock WebSocket server (port 3001)
npm run dev:full               # Run both concurrently

# Testing
npm test                       # Run Jest unit tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage

# Build
npm run build                  # Production build
npm start                      # Start production server
```

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://api.futureguide.id
NEXT_PUBLIC_NOTIFICATION_URL=https://api.futureguide.id
```

---

## 🗺️ Token Storage Locations

### 1. localStorage Keys (15+ keys)

#### Auth V2 Keys (Primary)
```javascript
'authV2_idToken'           // Firebase ID token (1 hour expiry)
'authV2_refreshToken'      // Firebase refresh token (long-lived)
'authV2_tokenIssuedAt'     // Unix timestamp (seconds)
'authV2_userId'            // Firebase UID
'auth_version'             // 'v1' or 'v2'
```

#### Legacy Keys (Backward Compatibility)
```javascript
'token'                    // Fallback for V1 and WebSocket
'auth_token'               // Fallback for V1
'authToken'                // Legacy fallback
```

#### User Data Keys
```javascript
'user'                     // JSON stringified user object
'user_data'                // Duplicate for backward compatibility
'uid'                      // User ID (cleared on logout)
'email'                    // User email (cleared on logout)
'displayName'              // User display name (cleared on logout)
'photoURL'                 // User photo URL (cleared on logout)
```

#### Cache Keys
```javascript
'tokenBalanceCache'                    // ❌ GLOBAL - no user ID
'tokenBalanceCache_{userId}'           // ✅ User-scoped
'swr:assessment-history-{userId}'      // ✅ User-scoped (SWR)
'swr:user-stats-{userId}'              // ✅ User-scoped (SWR)
'swr:latest-result-{userId}'           // ✅ User-scoped (SWR)
```

### 2. Cookies
```javascript
document.cookie = 'token={idToken}; path=/; max-age={7 days}'
```

### 3. In-Memory Storage

#### apiService (Singleton)
```javascript
class ApiService {
  tokenRefreshPromise = null;        // Shared refresh lock
  _inflight = new Map();             // ❌ Request deduplication (no user scope)
  _cache = new Map();                // ❌ Response cache (no user scope)
}
```

#### WebSocket Service (Singleton)
```javascript
class WebSocketService {
  token = null;                      // Current auth token
  subscribedJobs = new Set();        // ❌ Job subscriptions (no user scope)
  eventListeners = new Set();        // ❌ Event callbacks (no user scope)
  callbacks = { onEvent, ... };      // ❌ Callbacks (no user scope)
}
```

#### tokenService (Singleton)
```javascript
class TokenService {
  refreshPromise = null;             // Shared refresh lock
}
```

---

## 🔄 Token Lifecycle Mapping

### A. Token SET (Login/Register)

#### 1. Login Flow (`src/components/auth/Login.jsx`)
```javascript
// Step 1: Clear previous auth BEFORE login
tokenService.clearTokens();

// Step 2: Call Auth V2 API
const { idToken, refreshToken, uid } = await authV2Service.login(email, password);

// Step 3: Store tokens (tokenService.storeTokens)
localStorage.setItem('authV2_idToken', idToken);
localStorage.setItem('authV2_refreshToken', refreshToken);
localStorage.setItem('authV2_tokenIssuedAt', now);
localStorage.setItem('authV2_userId', uid);
localStorage.setItem('auth_version', 'v2');
localStorage.setItem('token', idToken);           // ✅ Sync to legacy
localStorage.setItem('auth_token', idToken);      // ✅ Sync to legacy
document.cookie = `token=${idToken}; ...`;

// Step 4: Store user data
localStorage.setItem('user', JSON.stringify(user));

// Step 5: Pass to AuthContext
onLogin(idToken, user);

// Step 6: AuthContext clears SWR cache BEFORE setting state
await mutate(() => true, undefined, { revalidate: false });
setToken(idToken);
setUser(user);

// Step 7: Redirect to dashboard
router.push('/dashboard');
```

#### 2. Register Flow (Similar to Login)
```javascript
const { idToken, refreshToken, uid } = await authV2Service.register(email, password, username);
tokenService.storeTokens(idToken, refreshToken, uid);
// ... same as login
```

### B. Token READ (Every HTTP Request)

#### 1. apiService Request Interceptor
```javascript
// src/services/apiService.js:83-158
setupRequestInterceptor() {
  this.axiosInstance.interceptors.request.use(async (config) => {
    const tokenService = (await import('./tokenService')).default;
    const authVersion = tokenService.getAuthVersion();
    
    if (authVersion === 'v2') {
      const idToken = tokenService.getIdToken();  // ⚠️ Reads from localStorage
      if (idToken) {
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    }
    
    return config;
  });
}
```

**Problem**: Interceptor membaca token **saat request dibuat**, bukan saat axios instance di-construct. Ini sudah benar, tapi masih ada masalah:
- ❌ Tidak ada validasi apakah token masih milik user yang sama
- ❌ Tidak ada abort mechanism untuk in-flight requests saat logout

#### 2. authV2Service Request Interceptor
```javascript
// src/services/authV2Service.js:36-48
this.axiosInstance.interceptors.request.use((config) => {
  const idToken = tokenService.getIdToken();  // ⚠️ Reads from localStorage
  if (idToken) {
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});
```

**Problem**: Same as apiService

#### 3. WebSocket Authentication
```javascript
// src/services/websocket-service.ts:416-448
private authenticate(): Promise<void> {
  this.socket.emit('authenticate', { token: this.token });
}

// Token set during connect:
async connect(token: string): Promise<void> {
  this.token = token;  // ⚠️ Stored in memory
  // ...
}
```

**Problem**: 
- ✅ Token passed as parameter (good)
- ❌ Stored in instance variable (can be stale after logout)

### C. Token REFRESH

#### 1. Automatic Refresh (useTokenRefresh hook)
```javascript
// src/hooks/useTokenRefresh.ts:48-105
const attemptRefresh = async () => {
  const status = tokenService.getTokenStatus();
  
  if (status.needsRefresh) {
    const newIdToken = await tokenService.refreshAuthToken();
    // tokenService.refreshAuthToken() calls:
    // - tokenService._performTokenRefresh()
    // - tokenService.storeTokens(newIdToken, newRefreshToken, userId)
  }
};

// Runs every 5 minutes
setInterval(attemptRefresh, 5 * 60 * 1000);
```

**Problem**:
- ✅ Has refresh lock (prevents concurrent refresh)
- ❌ No validation if user changed during refresh
- ❌ Refresh timer not stopped on logout (memory leak)

#### 2. On-Demand Refresh (401 Response)
```javascript
// src/services/apiService.js:184-203
setupResponseInterceptor() {
  this.axiosInstance.interceptors.response.use(null, async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const newIdToken = await this.refreshTokenWithLock();
      originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
      
      return this.axiosInstance(originalRequest);  // Retry
    }
  });
}
```

**Problem**:
- ✅ Has refresh lock
- ❌ No validation if user changed during refresh
- ❌ Retries request even if user logged out

### D. Token CLEAR (Logout)

#### 1. Logout Flow (`src/contexts/AuthContext.tsx:423-517`)
```javascript
const logout = async () => {
  // Step 1: Call logout API (Auth V2)
  await authV2Service.logout();  // Revokes refresh token on server
  
  // Step 2: Clear tokens
  tokenService.clearTokens();    // Clears ALL localStorage keys
  
  // Step 3: Clear cookies
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  
  // Step 4: Clear state
  setToken(null);
  setUser(null);
  
  // Step 5: Disconnect WebSocket
  const wsService = getWebSocketService();
  wsService.disconnect();
  
  // Step 6: Clear apiService caches
  apiService._cache.clear();
  apiService._inflight.clear();
  
  // Step 7: Clear token balance cache
  localStorage.removeItem(`tokenBalanceCache_${user.id}`);
  localStorage.removeItem('tokenBalanceCache');
  
  // Step 8: Redirect
  router.push('/auth');
};
```

**Problems Identified**:
- ✅ Clears localStorage tokens
- ✅ Clears cookies
- ✅ Disconnects WebSocket
- ✅ Clears apiService caches
- ❌ **CRITICAL**: No SWR cache clear on logout (only on login)
- ❌ **CRITICAL**: No abort for in-flight HTTP requests
- ❌ **CRITICAL**: useTokenRefresh timer not stopped
- ❌ Cookie clearing only clears 'token', not all auth cookies

---

## 🚨 Critical Issues Found

### Issue #1: In-Flight Requests Not Aborted
**Location**: All axios instances  
**Impact**: HIGH  
**Description**: Saat logout, request yang sedang berjalan tetap menggunakan token lama dan akan complete dengan data user lama.

**Example Scenario**:
```
Time 0ms:   User A clicks logout
Time 50ms:  GET /api/profile (User A) started
Time 100ms: Logout complete, User B logs in
Time 200ms: GET /api/profile (User A) completes
Time 250ms: User B sees User A's profile ❌
```

### Issue #2: SWR Cache Not Cleared on Logout
**Location**: `src/contexts/AuthContext.tsx:423-517`  
**Impact**: CRITICAL  
**Description**: SWR cache hanya di-clear saat login, tidak saat logout. Ini menyebabkan data user lama masih ada di cache.

### Issue #3: Token Refresh Timer Not Stopped
**Location**: `src/hooks/useTokenRefresh.ts`  
**Impact**: MEDIUM  
**Description**: Timer tetap berjalan setelah logout, causing memory leak dan potential refresh dengan token lama.

### Issue #4: WebSocket Reconnection with Stale Token
**Location**: `src/services/websocket-service.ts:509-537`  
**Impact**: HIGH  
**Description**: Saat reconnect, WebSocket menggunakan `this.token` yang mungkin sudah stale.

### Issue #5: apiService Cache Not User-Scoped
**Location**: `src/services/apiService.js:38-42`  
**Impact**: CRITICAL  
**Description**: Cache key hanya berdasarkan URL, tidak include user ID.

---

## 📊 Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clear Old Tokens │ ✅ GOOD
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Auth V2 API     │
                    │  (Firebase)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Store Tokens     │
                    │ - localStorage   │
                    │ - cookie         │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clear SWR Cache  │ ✅ GOOD
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Set AuthContext  │
                    │ State            │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       LOGOUT FLOW                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Logout API       │ ✅ GOOD
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clear Tokens     │ ✅ GOOD
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Disconnect WS    │ ✅ GOOD
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Clear API Cache  │ ✅ GOOD
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ❌ NO SWR CLEAR  │ ❌ BUG
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ❌ NO ABORT      │ ❌ BUG
                    │ In-Flight Reqs   │
                    └──────────────────┘
```

---

## ✅ Next Steps (Fase 1)

1. **Buat E2E Test** untuk reproduksi bug secara deterministik
2. **Tambahkan logging** untuk track token flow di setiap step
3. **Identifikasi** semua race conditions
4. **Validasi** semua temuan dengan test

---

*Dokumentasi dibuat: 8 Oktober 2025*  
*Fase: 0 - Baseline Complete*

