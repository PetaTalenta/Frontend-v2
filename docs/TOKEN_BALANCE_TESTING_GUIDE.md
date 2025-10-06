# Token Balance Testing Guide
**Date:** 2025-10-06  
**Purpose:** Verify token balance fixes untuk prevent cross-user data leakage

---

## 🎯 Testing Objectives

Memastikan bahwa:
1. ✅ Token balance akurat untuk setiap user
2. ✅ Tidak ada data leakage antar user saat switch account
3. ✅ Cache di-clear dengan benar saat logout
4. ✅ Tidak ada race conditions saat rapid user switching
5. ✅ WebSocket updates hanya untuk current user

---

## 🧪 Test Cases

### Test Case 1: Basic User Switch
**Priority:** 🔴 CRITICAL  
**Objective:** Verify basic token balance update saat user switch

**Steps:**
1. Login sebagai User A (email: usera@test.com)
2. Tunggu token balance load
3. Catat token balance User A (misal: 100 tokens)
4. Logout dari User A
5. Login sebagai User B (email: userb@test.com)
6. Tunggu token balance load
7. Catat token balance User B (misal: 50 tokens)

**Expected Result:**
- ✅ Token balance User A = 100 tokens
- ✅ Token balance User B = 50 tokens (BUKAN 100)
- ✅ Tidak ada error di console
- ✅ UI update dengan smooth

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test Case 2: Rapid User Switch
**Priority:** 🔴 CRITICAL  
**Objective:** Test race conditions saat rapid switching

**Steps:**
1. Login sebagai User A
2. **Immediately** logout (sebelum token balance selesai load)
3. Login sebagai User B
4. Tunggu token balance load
5. Verify token balance adalah milik User B

**Expected Result:**
- ✅ Token balance menampilkan data User B
- ✅ Tidak ada flash of User A data
- ✅ Tidak ada error di console
- ✅ Loading state handled dengan baik

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test Case 3: Cache Persistence Check
**Priority:** 🟡 MEDIUM  
**Objective:** Verify all caches cleared saat logout

**Steps:**
1. Login sebagai User A
2. Load token balance
3. Open DevTools → Application → Local Storage
4. Check for keys:
   - `tokenBalanceCache`
   - `tokenBalanceCache_${userId}`
5. Logout
6. Check Local Storage again
7. Verify cache keys removed

**Expected Result:**
- ✅ Before logout: Cache keys exist
- ✅ After logout: Cache keys removed
- ✅ SWR cache cleared (check Network tab - no cached requests)

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test Case 4: Concurrent Requests
**Priority:** 🟡 MEDIUM  
**Objective:** Test in-flight request handling

**Steps:**
1. Login sebagai User A
2. Open DevTools → Network tab
3. Throttle network to "Slow 3G"
4. Trigger token balance refresh (refresh page)
5. While request is in-flight, logout
6. Login sebagai User B
7. Check token balance

**Expected Result:**
- ✅ User B sees correct token balance
- ✅ No stale data from User A request
- ✅ In-flight requests cancelled or ignored

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test Case 5: WebSocket Updates
**Priority:** 🟢 LOW  
**Objective:** Verify WebSocket events validated by user ID

**Steps:**
1. Login sebagai User A
2. Wait for WebSocket connection
3. Trigger token balance update (submit assessment)
4. Verify update received
5. Logout
6. Login sebagai User B
7. Trigger token balance update for User B
8. Check console logs for user validation

**Expected Result:**
- ✅ User A receives only User A updates
- ✅ User B receives only User B updates
- ✅ Console shows user ID validation logs
- ✅ No cross-user updates

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test Case 6: Multiple Tabs
**Priority:** 🟡 MEDIUM  
**Objective:** Test behavior dengan multiple tabs

**Steps:**
1. Open Tab 1: Login sebagai User A
2. Open Tab 2: Login sebagai User B (same browser)
3. In Tab 1: Check token balance
4. In Tab 2: Check token balance
5. In Tab 1: Trigger token balance update
6. In Tab 2: Check if balance changed

**Expected Result:**
- ✅ Tab 1 shows User A balance
- ✅ Tab 2 shows User B balance
- ✅ Updates in Tab 1 don't affect Tab 2
- ✅ Each tab maintains separate session

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test Case 7: Token Expiry During Session
**Priority:** 🟢 LOW  
**Objective:** Test token refresh behavior

**Steps:**
1. Login sebagai User A
2. Wait for token to expire (or manually expire in DevTools)
3. Trigger token balance refresh
4. Check if token refreshed automatically
5. Verify balance still correct

**Expected Result:**
- ✅ Token refreshed automatically
- ✅ Balance fetched with new token
- ✅ No logout or error
- ✅ User ID still validated

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

## 🔍 Console Log Validation

### Expected Console Logs (User Switch)

**During Logout:**
```
🧹 AuthContext: Clearing SWR cache for all user data...
✅ AuthContext: SWR cache cleared successfully
AuthContext: WebSocket disconnected
AuthContext: apiService memory cache cleared
AuthContext: apiService in-flight requests cleared
AuthContext: Token balance caches cleared
✅ AuthContext: Logout complete, all data cleared
```

**During Login:**
```
AuthContext: User logging in: userb@test.com
🧹 AuthContext: Clearing SWR cache before login...
✅ AuthContext: SWR cache cleared successfully
✅ All authentication data stored atomically
```

**During Token Balance Fetch:**
```
TokenContext: Starting token balance refresh... { userId: 'user-b-id' }
TokenContext: Calling checkTokenBalance with user validation...
Token Balance Utility: Starting token balance check... { expectedUserId: 'user-b-id' }
Token Balance Utility: Parsed balance: { balance: 50, userId: 'user-b-id' }
✅ TokenContext: Token balance successfully refreshed
```

---

## 🐛 Debugging Checklist

If test fails, check:

### 1. Token Access
- [ ] `checkTokenBalance()` uses `tokenService.getIdToken()`
- [ ] No direct `localStorage.getItem('token')` calls
- [ ] Token retrieved correctly in all functions

### 2. User ID Validation
- [ ] `checkTokenBalance()` receives `expectedUserId` parameter
- [ ] User ID mismatch detected and handled
- [ ] Console shows user ID in logs

### 3. Cache Clearing
- [ ] `localStorage.removeItem('tokenBalanceCache')` called
- [ ] User-specific cache key cleared: `tokenBalanceCache_${userId}`
- [ ] SWR cache cleared: `mutate(() => true, undefined, { revalidate: false })`
- [ ] apiService._cache cleared
- [ ] apiService._inflight cleared

### 4. WebSocket
- [ ] WebSocket disconnected on logout
- [ ] WebSocket reconnected on login with new token
- [ ] User ID validated in WebSocket events
- [ ] Console shows user validation logs

### 5. Timing
- [ ] Logout clears cache BEFORE redirect
- [ ] Login clears cache BEFORE fetch
- [ ] No race conditions in async operations

---

## 📊 Performance Metrics

Track these metrics during testing:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Login to Token Balance Load | < 2s | ___ | ⬜ |
| Logout to Login | < 1s | ___ | ⬜ |
| Cache Clear Time | < 100ms | ___ | ⬜ |
| WebSocket Reconnect | < 500ms | ___ | ⬜ |
| User Switch Total Time | < 3s | ___ | ⬜ |

---

## ✅ Sign-off

**Tested By:** _______________  
**Date:** _______________  
**Environment:** [ ] Development [ ] Staging [ ] Production  
**Browser:** [ ] Chrome [ ] Firefox [ ] Safari [ ] Edge  

**Overall Result:**
- [ ] ✅ ALL TESTS PASSED - Ready for production
- [ ] ⚠️ SOME TESTS FAILED - Needs fixes
- [ ] ❌ CRITICAL FAILURES - Do not deploy

**Notes:**
```
[Add any additional notes or observations here]
```

---

## 🔄 Regression Testing

After fixes, re-run all tests to ensure:
1. No new bugs introduced
2. Performance not degraded
3. All edge cases handled
4. User experience smooth

**Regression Test Date:** _______________  
**Result:** [ ] PASS [ ] FAIL

---

## 📞 Support

If issues persist:
1. Check `docs/TOKEN_BALANCE_INVESTIGATION_REPORT.md` for root causes
2. Review console logs for error patterns
3. Check Network tab for API request/response
4. Verify localStorage state in DevTools
5. Contact development team with test results

---

**Last Updated:** 2025-10-06  
**Version:** 1.0

