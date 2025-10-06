# Quick Testing Guide: Auth Wrong Account Login Fix

**Purpose**: Manual testing checklist untuk verify semua fix sudah bekerja dengan benar  
**Duration**: ~30 minutes  
**Prerequisites**: 2 test accounts (User A & User B)

---

## 🧪 Test Accounts Setup

### Test Accounts Required:
```
Account A:
- Email: testa@test.com
- Password: TestPassword123

Account B:
- Email: testb@test.com  
- Password: TestPassword456
```

**Note**: Pastikan kedua account sudah terdaftar dan memiliki data assessment yang berbeda.

---

## ✅ Test Suite 1: Basic Login/Logout Flow

### Test 1.1: Normal Login
```
Steps:
1. Open browser in incognito/private mode
2. Navigate to /auth
3. Login dengan Account A
4. Verify: Dashboard shows Account A email
5. Verify: Stats/data milik Account A ditampilkan
6. Check console: No errors, SWR cache cleared

Expected Result: ✅ Account A data shown correctly

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

### Test 1.2: Normal Logout
```
Steps:
1. Continue from Test 1.1 (logged in as Account A)
2. Click Logout button
3. Verify: Redirected to /auth
4. Check console: "SWR cache cleared successfully"
5. Check localStorage: token & user keys removed

Expected Result: ✅ Complete logout with cache clearing

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

---

## 🔄 Test Suite 2: Account Switching

### Test 2.1: Rapid Account Switch
```
Steps:
1. Login as Account A
2. Wait 3 seconds
3. Logout
4. Immediately login as Account B (< 1 second)
5. Verify dashboard: Should show Account B data
6. Check console: Look for "Profile data mismatch" warnings

Expected Result: ✅ Account B data shown, NO Account A data

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

### Test 2.2: Multiple Rapid Switches
```
Steps:
1. Login as Account A → Logout (repeat 3x fast)
2. Login as Account B → Logout (repeat 3x fast)
3. Finally login as Account A
4. Verify: Account A data shown correctly

Expected Result: ✅ Correct account data after multiple switches

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

---

## 🗂️ Test Suite 3: Multi-Tab Scenarios

### Test 3.1: Login in Different Tabs
```
Steps:
1. Open Tab 1, login as Account A
2. Verify: Dashboard shows Account A data
3. Open Tab 2 (same browser), login as Account B
4. Switch to Tab 1
5. Verify: Tab 1 should show Account B data OR redirect to login
6. Check console in Tab 1: "Different user logged in another tab"

Expected Result: ✅ Tab 1 synchronized with Tab 2

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

### Test 3.2: Logout in One Tab
```
Steps:
1. Open 2 tabs, login as Account A in both
2. Verify both tabs show Account A data
3. In Tab 1, click Logout
4. Immediately switch to Tab 2
5. Verify: Tab 2 redirects to /auth within 1-2 seconds
6. Check console in Tab 2: "Token removed in another tab"

Expected Result: ✅ Both tabs logged out

Status: [ ] PASS  [ ] FAIL  
Notes: _______________________________________________
```

### Test 3.3: Page Refresh After Tab Switch
```
Steps:
1. Tab 1: Login as Account A
2. Tab 2: Login as Account B
3. In Tab 1, refresh page (F5)
4. Verify: Tab 1 shows Account B data (not Account A)
5. Check localStorage: Should have Account B user data

Expected Result: ✅ Tab 1 loads Account B after refresh

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

---

## ⚡ Test Suite 4: Race Conditions

### Test 4.1: Profile Fetch Race Condition
```
Steps:
1. Open Chrome DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Login as Account A
4. While profile is loading, immediately logout
5. Quickly login as Account B
6. Wait for profile to fully load
7. Verify: Account B data shown (not Account A)
8. Check console: "Profile data mismatch" warning for Account A

Expected Result: ✅ Account B data, discarded Account A profile

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

### Test 4.2: API Request During Login
```
Steps:
1. Login as Account A
2. Immediately click on "My Results" (while login still processing)
3. Verify: Results shown are for Account A
4. Check console: No 401 errors, correct auth token used

Expected Result: ✅ API uses correct token for Account A

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

---

## 💾 Test Suite 5: Cache Behavior

### Test 5.1: SWR Cache Clearing on Logout
```
Steps:
1. Login as Account A
2. Navigate to Dashboard (loads assessment history)
3. Note down: Number of assessments for Account A
4. Logout
5. Login as Account B
6. Dashboard should show Account B assessments immediately
7. Verify: Count is different from Account A

Expected Result: ✅ No cached data from Account A

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

### Test 5.2: SWR Cache Clearing on Login
```
Steps:
1. Login as Account A, view dashboard stats
2. Open DevTools → Console
3. Logout
4. Login as Account B
5. Check console: "Clearing SWR cache before login"
6. Dashboard should show Account B stats immediately

Expected Result: ✅ Fresh data loaded for Account B

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

---

## 🔌 Test Suite 6: WebSocket Behavior

### Test 6.1: WebSocket Cleanup on Logout
```
Steps:
1. Login as Account A
2. Start an assessment (triggers WebSocket connection)
3. Open DevTools → Console
4. Logout
5. Check console: "WebSocket Service: Fully disconnected"
6. Verify: "Event listeners cleared", "Callbacks cleared"

Expected Result: ✅ Complete WebSocket cleanup

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

### Test 6.2: WebSocket Events After Logout
```
Steps:
1. Login as Account A
2. Start assessment (WebSocket connects)
3. Logout (WebSocket disconnects)
4. Login as Account B
5. Start assessment (WebSocket reconnects)
6. Verify: Events received are for Account B only

Expected Result: ✅ No cross-user WebSocket events

Status: [ ] PASS  [ ] FAIL
Notes: _______________________________________________
```

---

## 🔍 Console Monitoring Checklist

### During Testing, Monitor Console For:

#### ✅ Expected Logs (GOOD):
- `"🧹 Clearing SWR cache for all user data..."`
- `"✅ SWR cache cleared successfully"`
- `"✅ State synchronized with tab change"`
- `"⚠️ Profile data mismatch! Discarding outdated data"`
- `"✅ WebSocket Service: Fully disconnected and cleaned up"`
- `"API Request [req-xxxxx]: GET /api/profile"`

#### ❌ Error Logs (BAD - Report if seen):
- `"❌ Failed to clear SWR cache"`
- `"❌ Profile data for wrong user!"`
- `"Token mismatch detected"`
- `401 Unauthorized` errors
- `"User data inconsistent"`
- Any error about "wrong user" or "cross-contamination"

---

## 📊 Test Results Summary

### Test Suite Results:
```
Suite 1 - Basic Login/Logout:        [ ] PASS  [ ] FAIL
Suite 2 - Account Switching:         [ ] PASS  [ ] FAIL  
Suite 3 - Multi-Tab Scenarios:       [ ] PASS  [ ] FAIL
Suite 4 - Race Conditions:           [ ] PASS  [ ] FAIL
Suite 5 - Cache Behavior:            [ ] PASS  [ ] FAIL
Suite 6 - WebSocket Behavior:        [ ] PASS  [ ] FAIL

Overall Status:                      [ ] ALL PASS  [ ] SOME FAIL
```

### Failed Tests:
```
Test Number: _______
Issue: _________________________________________________
Expected: ______________________________________________
Actual: ________________________________________________
Console Errors: ________________________________________
```

---

## 🚨 Critical Issues to Report Immediately

### Report if ANY of these occur:
1. ❌ Account A data shown after logging in as Account B
2. ❌ Dashboard shows mixed data from multiple users
3. ❌ Console shows "Profile data mismatch" but wrong data still displayed
4. ❌ WebSocket events from previous user trigger in current session
5. ❌ Token balance update for wrong user
6. ❌ Tab synchronization not working (tabs show different users)

### How to Report:
```
Issue: [Brief description]
Test Case: [Which test case failed]
Steps to Reproduce: [Exact steps]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Console Logs: [Copy relevant console logs]
Screenshots: [Attach if applicable]
```

---

## ✅ Sign-Off

### Tester Information:
```
Name: ____________________
Date: ____________________
Time: ____________________
Browser: _________________
OS: ______________________
```

### Test Approval:
```
All Tests Passed: [ ] YES  [ ] NO

If NO, list failed tests: _____________________________
______________________________________________________

Ready for Production: [ ] YES  [ ] NO  [ ] WITH RESERVATIONS

Notes: ________________________________________________
______________________________________________________
______________________________________________________

Tester Signature: _____________________________________
```

---

## 🎯 Quick Reference

### Common Issues & Solutions:

**Issue**: SWR cache not clearing  
**Check**: Console for "Clearing SWR cache" message  
**Solution**: Verify `mutate()` import and usage

**Issue**: Profile data mismatch not detected  
**Check**: Console for "Profile data mismatch" warning  
**Solution**: Verify `expectedUserId` passed correctly

**Issue**: Tabs not synchronized  
**Check**: `storage` event listener registered  
**Solution**: Verify event listener in useEffect

**Issue**: WebSocket events cross-contaminated  
**Check**: Console for cleanup logs on disconnect  
**Solution**: Verify `removeAllListeners()` called

---

**Testing Guide Version**: 1.0  
**Last Updated**: October 6, 2025  
**Related Docs**: 
- `/docs/AUTH_WRONG_ACCOUNT_LOGIN_INVESTIGATION.md`
- `/docs/AUTH_FIX_IMPLEMENTATION_SUMMARY.md`
