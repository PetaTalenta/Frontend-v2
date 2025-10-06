# Token Balance Investigation Report
**Date:** 2025-10-06  
**Issue:** Token balance data tidak akurat saat user switch (login dari akun A ke akun B)  
**Status:** ✅ Root Cause Identified - Fixes Ready

---

## 🔴 Executive Summary

### Masalah yang Dilaporkan
Ketika user login dengan akun A dan mendapat token balance dari API, kemudian logout dan login kembali dengan akun B, **token balance tidak terupdate** dan masih menampilkan data dari akun A.

### Root Causes Identified
1. **Hardcoded localStorage Access** - `checkTokenBalance()` tidak menggunakan `tokenService.getIdToken()`
2. **No User ID Validation** - Tidak ada validasi bahwa data token balance milik user yang sedang login
3. **Multiple Caching Layers Conflict** - 5 layer caching yang tidak synchronized saat user switch
4. **Race Conditions** - Timing issues antara logout → clear → login → fetch
5. **Code Complexity** - Function terlalu complex dengan 12 kandidat parsing untuk balance value

### Impact Assessment
- **Severity:** 🔴 CRITICAL
- **User Impact:** HIGH - User melihat data finansial user lain
- **Security Impact:** HIGH - Potential data leak antar user
- **Frequency:** Consistent - Terjadi setiap kali user switch

---

## 🔍 Technical Analysis

### 1. Token Balance Utility (`src/utils/token-balance.ts`)

#### ❌ CRITICAL ISSUE: Hardcoded localStorage Access
**Location:** Line 29
```typescript
// ❌ WRONG - Direct localStorage access
const token = localStorage.getItem('token');

// ✅ SHOULD BE - Use tokenService
import tokenService from '../services/tokenService';
const token = tokenService.getIdToken();
```

**Problem:**
- Tidak konsisten dengan token management strategy
- Bisa membaca token lama jika ada race condition
- Tidak benefit dari token validation di tokenService

**Impact:** Direct cause of wrong token balance saat user switch

---

#### ❌ ISSUE: No User ID Validation
**Location:** Line 24-144
```typescript
export async function checkTokenBalance(): Promise<TokenBalanceInfo> {
  // No user ID parameter
  // No validation that response belongs to current user
}
```

**Problem:**
- Function tidak tahu user mana yang sedang login
- Tidak validate response data
- Cache bisa tercampur antar user

**Impact:** Data bisa tercampur antar user sessions

---

#### ⚠️ ISSUE: Excessive Code Complexity
**Location:** Line 74-92
```typescript
const candidates = [
  response?.data?.tokenBalance,
  response?.data?.balance,
  response?.data?.token_balance,
  response?.data?.tokens,
  response?.data?.user?.token_balance,
  response?.data?.user?.tokenBalance,
  response?.tokenBalance,
  response?.token_balance,
  response?.balance,
  response?.tokens,
  typeof response?.data === 'number' ? response.data : undefined,
  typeof response?.data === 'string' ? response.data : undefined,
];
```

**Problem:**
- 12 kandidat untuk satu value - defensive programming berlebihan
- Menunjukkan API response tidak konsisten
- Sulit maintain dan debug
- Performance overhead

**Impact:** Code maintenance difficulty, potential bugs

---

### 2. Token Context (`src/contexts/TokenContext.tsx`)

#### ❌ ISSUE: Cache Without User ID
**Location:** Line 51
```typescript
localStorage.removeItem('tokenBalanceCache');
```

**Problem:**
- Cache key tidak include user ID
- User A dan User B share same cache key
- Cache di-clear tapi bisa di-set lagi sebelum fully cleared

**Flow Bermasalah:**
```
1. User A login → cache set: tokenBalanceCache = {balance: 100}
2. User A logout → cache cleared
3. User B login → refreshTokenBalance() called
4. Race condition: Old cache bisa masih ada
5. User B sees User A balance
```

---

#### ⚠️ ISSUE: WebSocket No User Validation
**Location:** Line 129-137
```typescript
cleanupListener = service.addEventListener((event) => {
  if (!isActive) return;
  
  if (event.type === 'token-balance-updated' && event.metadata?.balance !== undefined) {
    console.log('TokenContext: Received token balance update via WebSocket:', event.metadata.balance);
    updateTokenBalance(event.metadata.balance);
  }
});
```

**Problem:**
- Tidak validate user ID di WebSocket event
- Bisa receive update untuk user lain
- Jika WebSocket tidak disconnect properly, bisa dapat event user lama

---

### 3. API Service (`src/services/apiService.js`)

#### ⚠️ ISSUE: In-Flight Request Sharing
**Location:** Line 38-39
```typescript
this._inflight = new Map();
this._cache = new Map();
```

**Problem:**
- In-flight requests bisa shared antar user
- Cache tidak di-clear saat logout
- Deduplication bisa return data user lama

**Flow Bermasalah:**
```
1. User A: getTokenBalance() → request in-flight
2. User A logout (request still in-flight)
3. User B login
4. User B: getTokenBalance() → reuse in-flight request dari User A
5. Return User A balance to User B
```

---

### 4. Auth Context Logout (`src/contexts/AuthContext.tsx`)

#### ✅ GOOD: SWR Cache Cleared
**Location:** Line 426-453
```typescript
// ✅ This is GOOD
await mutate(() => true, undefined, { revalidate: false });
```

**BUT Missing:**
- apiService._cache not cleared
- apiService._inflight not cleared
- localStorage tokenBalanceCache might not be cleared in time

---

## 📊 Caching Layers Analysis

### Multiple Caching Layers Identified:

1. **localStorage Cache**
   - Key: `'tokenBalanceCache'`
   - ❌ No user ID in key
   - ❌ Not cleared atomically

2. **SWR Cache**
   - ✅ Cleared in AuthContext.logout()
   - ⚠️ But cleared BEFORE new user data fetch
   - ⚠️ Can be re-populated with stale data

3. **IndexedDB Cache**
   - Uses tags: `['user', userId]`
   - ✅ Has user ID
   - ℹ️ Not used by checkTokenBalance()

4. **apiService Memory Cache**
   - TTL-based cache
   - ❌ Not cleared on logout
   - ❌ Can return stale data

5. **apiService In-Flight Cache**
   - Request deduplication
   - ❌ Not cleared on logout
   - ❌ Can share requests across users

### Recommendation:
**Simplify to 1-2 caching layers max** with proper user ID scoping

---

## 🎯 Root Cause Analysis

### Critical Issues (Must Fix Immediately)

#### 1. Hardcoded localStorage Access
- **File:** `src/utils/token-balance.ts`
- **Lines:** 29, 266, 310, 384, 466
- **Fix:** Replace with `tokenService.getIdToken()`
- **Priority:** 🔴 CRITICAL

#### 2. No User ID Validation
- **File:** `src/utils/token-balance.ts`
- **Function:** `checkTokenBalance()`
- **Fix:** Add user ID parameter and validation
- **Priority:** 🔴 CRITICAL

#### 3. Cache Not Cleared on Logout
- **Files:** `src/services/apiService.js`, `src/contexts/TokenContext.tsx`
- **Fix:** Clear all caches atomically on logout
- **Priority:** 🔴 CRITICAL

### Medium Priority Issues

#### 4. Race Conditions
- **Location:** Login/Logout flow timing
- **Fix:** Add atomic operations and proper sequencing
- **Priority:** 🟡 MEDIUM

#### 5. Code Complexity
- **File:** `src/utils/token-balance.ts`
- **Fix:** Simplify parsing logic, standardize API response
- **Priority:** 🟡 MEDIUM

### Low Priority Issues

#### 6. WebSocket User Validation
- **File:** `src/contexts/TokenContext.tsx`
- **Fix:** Add user ID to WebSocket events
- **Priority:** 🟢 LOW (if WebSocket disconnect works properly)

---

## ✅ Recommended Solutions

### Phase 1: Critical Fixes (Immediate)

#### Fix 1: Centralize Token Access
**File:** `src/utils/token-balance.ts`

```typescript
// Import tokenService
import tokenService from '../services/tokenService';

// Replace ALL instances of:
// const token = localStorage.getItem('token');
// With:
const token = tokenService.getIdToken();
```

**Locations to fix:**
- Line 29 (checkTokenBalance)
- Line 266 (testDirectTokenBalanceCall)
- Line 310 (testSimpleTokenBalance)
- Line 384 (fixAuthenticationIssues)
- Line 466 (forceRefreshTokenBalanceFix)

---

#### Fix 2: Add User ID Validation
**File:** `src/utils/token-balance.ts`

```typescript
export async function checkTokenBalance(expectedUserId?: string): Promise<TokenBalanceInfo> {
  console.log('Token Balance Utility: Starting token balance check...');

  try {
    // Get token from tokenService
    const token = tokenService.getIdToken();
    if (!token) {
      console.error('Token Balance Utility: No authentication token found');
      return {
        balance: -1,
        hasEnoughTokens: false,
        message: 'Authentication required. Please login again.',
        error: true,
      };
    }

    // Get current user ID
    const userStr = localStorage.getItem('user');
    const currentUserId = userStr ? JSON.parse(userStr).id : null;
    
    // Validate user ID if provided
    if (expectedUserId && currentUserId !== expectedUserId) {
      console.warn('Token Balance Utility: User ID mismatch detected', {
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

    // Continue with API call...
    const response = await apiService.getTokenBalance();
    
    // ... rest of function
  }
}
```

---

#### Fix 3: Clear All Caches on Logout
**File:** `src/contexts/AuthContext.tsx`

Add to logout function after line 453:

```typescript
// Clear apiService caches
try {
  const { apiService } = await import('../services/apiService');
  if (apiService._cache) {
    apiService._cache.clear();
  }
  if (apiService._inflight) {
    apiService._inflight.clear();
  }
  console.log('✅ AuthContext: apiService caches cleared');
} catch (error) {
  console.warn('⚠️ AuthContext: Failed to clear apiService caches:', error);
}

// Clear localStorage token balance cache
localStorage.removeItem('tokenBalanceCache');
```

---

#### Fix 4: Update TokenContext to Pass User ID
**File:** `src/contexts/TokenContext.tsx`

Line 55:
```typescript
// OLD:
const newTokenInfo = await checkTokenBalance();

// NEW:
const newTokenInfo = await checkTokenBalance(user?.id);
```

---

### Phase 2: Improvements

#### Improvement 1: Simplify Balance Parsing
Reduce candidates from 12 to 3:

```typescript
// Simplified parsing - trust backend to be consistent
const balance = response?.data?.balance 
  ?? response?.data?.tokenBalance 
  ?? (typeof response?.data === 'number' ? response.data : 0);
```

#### Improvement 2: Add User-Specific Cache Keys
```typescript
// Instead of: 'tokenBalanceCache'
// Use: `tokenBalanceCache_${userId}`
const cacheKey = `tokenBalanceCache_${user.id}`;
```

#### Improvement 3: Add WebSocket User Validation
```typescript
if (event.type === 'token-balance-updated' && event.metadata?.balance !== undefined) {
  // Validate user ID
  if (event.metadata?.userId && event.metadata.userId !== user?.id) {
    console.warn('TokenContext: Received update for different user, ignoring');
    return;
  }
  updateTokenBalance(event.metadata.balance);
}
```

---

## 🧪 Testing Checklist

### Test Case 1: Basic User Switch
- [ ] Login as User A
- [ ] Verify token balance shows User A data
- [ ] Logout
- [ ] Login as User B  
- [ ] Verify token balance shows User B data (NOT User A)
- [ ] **Expected:** Token balance updates correctly

### Test Case 2: Rapid User Switch
- [ ] Login as User A
- [ ] Immediately logout (before token balance loads)
- [ ] Login as User B
- [ ] Verify token balance shows User B data
- [ ] **Expected:** No race condition, correct data

### Test Case 3: Cache Persistence
- [ ] Login as User A
- [ ] Load token balance
- [ ] Logout
- [ ] Check localStorage, SWR cache, apiService cache
- [ ] **Expected:** All caches cleared

### Test Case 4: Concurrent Requests
- [ ] Login as User A
- [ ] Trigger multiple token balance requests
- [ ] Logout during requests
- [ ] Login as User B
- [ ] **Expected:** No stale data from User A

---

## 📚 Best Practices Recommendations

### 1. Token Management
- ✅ Always use `tokenService.getIdToken()` instead of direct localStorage
- ✅ Never hardcode localStorage keys
- ✅ Centralize token access through single service

### 2. Cache Management
- ✅ Include user ID in all cache keys
- ✅ Clear all caches atomically on logout
- ✅ Minimize number of caching layers (1-2 max)
- ✅ Use SWR for API caching, avoid custom cache implementations

### 3. User Session Handling
- ✅ Validate user ID in all data fetching functions
- ✅ Reject data if user ID doesn't match
- ✅ Clear state immediately on logout
- ✅ Use atomic operations for login/logout

### 4. WebSocket Lifecycle
- ✅ Disconnect WebSocket on logout
- ✅ Validate user ID in WebSocket events
- ✅ Reconnect with new token on login
- ✅ Add user metadata to WebSocket connection

---

## 📝 Implementation Priority

### Immediate (Today)
1. ✅ Fix hardcoded localStorage access
2. ✅ Add user ID validation to checkTokenBalance
3. ✅ Clear apiService caches on logout
4. ✅ Update TokenContext to pass user ID

### Short Term (This Week)
5. Simplify balance parsing logic
6. Add user-specific cache keys
7. Add WebSocket user validation
8. Add comprehensive tests

### Long Term (Next Sprint)
9. Refactor caching strategy (reduce layers)
10. Standardize API response format
11. Add monitoring for user switch issues
12. Performance optimization

---

## 🎯 Success Criteria

Fixes are successful when:
- ✅ User A login → sees User A token balance
- ✅ User A logout → User B login → sees User B token balance (NOT User A)
- ✅ No race conditions in rapid user switching
- ✅ All caches cleared properly on logout
- ✅ No cross-user data leakage
- ✅ WebSocket events validated for correct user

---

**Report Generated:** 2025-10-06  
**Next Steps:** Implement Phase 1 Critical Fixes

