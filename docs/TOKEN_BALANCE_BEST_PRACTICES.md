# Token Balance Best Practices
**Date:** 2025-10-06  
**Purpose:** Guidelines untuk prevent token balance issues dan maintain data integrity

---

## 🎯 Core Principles

### 1. Single Source of Truth
**Principle:** Always use centralized services for data access

✅ **DO:**
```typescript
import tokenService from '../services/tokenService';
const token = tokenService.getIdToken();
```

❌ **DON'T:**
```typescript
const token = localStorage.getItem('token');
```

**Why:**
- Centralized validation
- Consistent error handling
- Easier to maintain
- Prevents race conditions

---

### 2. User ID Validation
**Principle:** Always validate data belongs to current user

✅ **DO:**
```typescript
export async function checkTokenBalance(expectedUserId?: string): Promise<TokenBalanceInfo> {
  const currentUserId = getCurrentUserId();
  
  if (expectedUserId && currentUserId !== expectedUserId) {
    return { error: true, message: 'User session changed' };
  }
  
  // Proceed with fetch
}
```

❌ **DON'T:**
```typescript
export async function checkTokenBalance(): Promise<TokenBalanceInfo> {
  // No user validation - data could be for wrong user!
  const response = await api.getTokenBalance();
  return response.data;
}
```

**Why:**
- Prevents cross-user data leakage
- Security best practice
- Catches session change issues early

---

### 3. Atomic Cache Operations
**Principle:** Clear all caches atomically on user change

✅ **DO:**
```typescript
async function logout() {
  // Clear ALL caches in sequence
  await mutate(() => true, undefined, { revalidate: false }); // SWR
  apiService._cache.clear(); // Memory cache
  apiService._inflight.clear(); // In-flight requests
  localStorage.removeItem(`tokenBalanceCache_${userId}`); // User-specific
  localStorage.removeItem('tokenBalanceCache'); // Legacy
  
  // Then clear auth data
  tokenService.clearTokens();
}
```

❌ **DON'T:**
```typescript
async function logout() {
  // Only clear some caches - leaves stale data!
  localStorage.removeItem('tokenBalanceCache');
  tokenService.clearTokens();
}
```

**Why:**
- Prevents stale data
- Ensures clean state
- Reduces bugs

---

### 4. User-Specific Cache Keys
**Principle:** Include user ID in all cache keys

✅ **DO:**
```typescript
const cacheKey = `tokenBalanceCache_${userId}`;
localStorage.setItem(cacheKey, JSON.stringify(data));
```

❌ **DON'T:**
```typescript
const cacheKey = 'tokenBalanceCache'; // Same for all users!
localStorage.setItem(cacheKey, JSON.stringify(data));
```

**Why:**
- Prevents cache collision
- Allows per-user cache management
- Easier debugging

---

### 5. Minimize Caching Layers
**Principle:** Use 1-2 caching layers maximum

✅ **DO:**
```typescript
// Use SWR for API caching
const { data } = useSWR(
  `token-balance-${userId}`,
  () => apiService.getTokenBalance(),
  { dedupingInterval: 60000 }
);
```

❌ **DON'T:**
```typescript
// Multiple conflicting caches
localStorage.setItem('cache1', data);
sessionStorage.setItem('cache2', data);
indexedDB.set('cache3', data);
memoryCache.set('cache4', data);
```

**Why:**
- Simpler to maintain
- Less chance of inconsistency
- Better performance

---

## 🔒 Security Best Practices

### 1. Validate WebSocket Events
```typescript
service.addEventListener((event) => {
  // Validate user ID
  const eventUserId = event.metadata?.userId;
  if (eventUserId && eventUserId !== currentUser?.id) {
    console.warn('Ignoring event for different user');
    return;
  }
  
  // Process event
  handleEvent(event);
});
```

### 2. Sanitize User Input
```typescript
// Always validate and sanitize
const userId = sanitizeUserId(input);
if (!isValidUserId(userId)) {
  throw new Error('Invalid user ID');
}
```

### 3. Token Expiry Handling
```typescript
// Check token expiry before use
if (tokenService.isTokenExpired()) {
  await tokenService.refreshAuthToken();
}
const token = tokenService.getIdToken();
```

---

## 🚀 Performance Best Practices

### 1. Debounce Frequent Updates
```typescript
const debouncedRefresh = debounce(async () => {
  await refreshTokenBalance();
}, 1000);
```

### 2. Use SWR Deduplication
```typescript
const { data } = useSWR(
  key,
  fetcher,
  {
    dedupingInterval: 60000, // 1 minute
    revalidateOnFocus: false,
  }
);
```

### 3. Lazy Load Heavy Components
```typescript
const TokenBalanceWidget = lazy(() => import('./TokenBalanceWidget'));
```

---

## 🧪 Testing Best Practices

### 1. Test User Switching
```typescript
test('token balance updates on user switch', async () => {
  // Login User A
  await login('usera@test.com');
  const balanceA = await getTokenBalance();
  expect(balanceA).toBe(100);
  
  // Switch to User B
  await logout();
  await login('userb@test.com');
  const balanceB = await getTokenBalance();
  expect(balanceB).toBe(50); // NOT 100!
});
```

### 2. Test Cache Clearing
```typescript
test('cache cleared on logout', async () => {
  await login('user@test.com');
  await loadTokenBalance();
  
  expect(localStorage.getItem('tokenBalanceCache')).toBeTruthy();
  
  await logout();
  
  expect(localStorage.getItem('tokenBalanceCache')).toBeNull();
});
```

### 3. Test Race Conditions
```typescript
test('rapid user switch handles race conditions', async () => {
  await login('usera@test.com');
  logout(); // Don't await - immediate logout
  await login('userb@test.com');
  
  const balance = await getTokenBalance();
  expect(balance).toBe(userBBalance); // Not userA
});
```

---

## 📝 Code Review Checklist

When reviewing token balance code, check:

- [ ] Uses `tokenService.getIdToken()` instead of direct localStorage
- [ ] Includes user ID validation
- [ ] Clears all caches on logout
- [ ] Uses user-specific cache keys
- [ ] Handles race conditions
- [ ] Validates WebSocket events
- [ ] Has proper error handling
- [ ] Includes logging for debugging
- [ ] Has unit tests
- [ ] Has integration tests

---

## 🐛 Common Pitfalls to Avoid

### 1. Direct localStorage Access
```typescript
// ❌ BAD
const token = localStorage.getItem('token');

// ✅ GOOD
const token = tokenService.getIdToken();
```

### 2. Missing User Validation
```typescript
// ❌ BAD
async function getData() {
  return await api.getUserData();
}

// ✅ GOOD
async function getData(expectedUserId: string) {
  const data = await api.getUserData();
  if (data.userId !== expectedUserId) {
    throw new Error('User mismatch');
  }
  return data;
}
```

### 3. Incomplete Cache Clearing
```typescript
// ❌ BAD
function logout() {
  localStorage.clear(); // Too aggressive!
}

// ✅ GOOD
function logout() {
  // Clear specific keys only
  localStorage.removeItem(`tokenBalanceCache_${userId}`);
  localStorage.removeItem('tokenBalanceCache');
  // ... other specific keys
}
```

### 4. Shared Cache Keys
```typescript
// ❌ BAD
const CACHE_KEY = 'userBalance'; // Same for all users

// ✅ GOOD
const getCacheKey = (userId: string) => `userBalance_${userId}`;
```

### 5. Ignoring Race Conditions
```typescript
// ❌ BAD
async function switchUser(newUserId: string) {
  await logout();
  await login(newUserId);
  // Race condition: old data might still be loading
}

// ✅ GOOD
async function switchUser(newUserId: string) {
  await logout();
  await clearAllCaches();
  await waitForPendingRequests();
  await login(newUserId);
}
```

---

## 🔄 Migration Guide

### From Old Pattern to New Pattern

**Step 1: Replace localStorage Access**
```typescript
// Find all instances of:
localStorage.getItem('token')

// Replace with:
tokenService.getIdToken()
```

**Step 2: Add User Validation**
```typescript
// Old function:
async function checkBalance() {
  return await api.getBalance();
}

// New function:
async function checkBalance(userId: string) {
  const data = await api.getBalance();
  const currentUserId = getCurrentUserId();
  if (currentUserId !== userId) {
    throw new Error('User session changed');
  }
  return data;
}
```

**Step 3: Update Cache Keys**
```typescript
// Old:
localStorage.setItem('balance', data);

// New:
localStorage.setItem(`balance_${userId}`, data);
```

**Step 4: Enhance Logout**
```typescript
// Old:
function logout() {
  tokenService.clearTokens();
}

// New:
async function logout() {
  await mutate(() => true, undefined, { revalidate: false });
  apiService._cache?.clear();
  apiService._inflight?.clear();
  localStorage.removeItem(`balance_${userId}`);
  tokenService.clearTokens();
}
```

---

## 📚 Additional Resources

- [Investigation Report](./TOKEN_BALANCE_INVESTIGATION_REPORT.md)
- [Testing Guide](./TOKEN_BALANCE_TESTING_GUIDE.md)
- [Auth V2 Documentation](./AUTH_V2_CONTEXT_IMPLEMENTATION.md)
- [SWR Documentation](https://swr.vercel.app/)

---

## 🎓 Training Checklist

For new developers working on token balance:

- [ ] Read investigation report
- [ ] Understand root causes
- [ ] Review best practices
- [ ] Run all test cases
- [ ] Practice user switching scenarios
- [ ] Review code examples
- [ ] Understand caching strategy
- [ ] Know debugging techniques

---

## 📞 Support

If you encounter issues:

1. Check console logs for user ID validation
2. Verify cache keys include user ID
3. Ensure tokenService is used consistently
4. Test with multiple users
5. Review this document
6. Contact team lead

---

**Last Updated:** 2025-10-06  
**Version:** 1.0  
**Maintained By:** Development Team

