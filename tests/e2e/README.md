# E2E Tests - Cross-User Token Carryover Bug

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Test Users

Anda perlu membuat 2 test users di Firebase/backend:

**User A:**
- Email: `user-a@test.com`
- Password: `TestPassword123!`
- Display Name: `User A`

**User B:**
- Email: `user-b@test.com`
- Password: `TestPassword123!`
- Display Name: `User B`

### 3. Update Test Credentials

Edit `tests/e2e/auth-switch.spec.ts` dan update credentials:

```typescript
const USER_A = {
  email: 'your-user-a@example.com',
  password: 'YourPassword123!',
  expectedName: 'User A Name'
};

const USER_B = {
  email: 'your-user-b@example.com',
  password: 'YourPassword123!',
  expectedName: 'User B Name'
};
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI (interactive mode)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Test Scenarios

### 1. Cross-User Token Carryover Test
**File**: `auth-switch.spec.ts`

**Purpose**: Reproduksi bug dimana token User A masih terbawa saat login User B

**Steps**:
1. Login sebagai User A
2. Capture token A dari localStorage dan request headers
3. Logout User A
4. Verify semua token cleared
5. Login sebagai User B (immediately, < 500ms)
6. Capture token B
7. **CRITICAL ASSERTIONS**:
   - Token B ≠ Token A
   - NO requests use token A after User B login
   - ALL requests use token B

**Expected Result**: ✅ PASS - No token carryover

**Bug Reproduction**: ❌ FAIL - Requests still use token A

### 2. SWR Cache Clear Test
**File**: `auth-switch.spec.ts`

**Purpose**: Verify SWR cache is cleared on logout

**Steps**:
1. Login as User A
2. Check SWR cache keys in localStorage
3. Logout
4. Verify SWR cache is empty

**Expected Result**: ✅ PASS - SWR cache cleared

## Debugging Failed Tests

### Check Network Logs
```bash
npm run test:e2e:headed
```

Lihat console browser untuk:
- `📊 Found X requests with User A token`
- `🚨 BUG DETECTED: Requests still using User A token`

### Check Screenshots
Failed tests akan generate screenshots di `test-results/`

### Check Videos
Failed tests akan generate videos di `test-results/`

### Check Trace
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Common Issues

### Issue: "User not found" or "Invalid credentials"
**Solution**: Pastikan test users sudah dibuat di backend

### Issue: "Timeout waiting for /dashboard"
**Solution**: 
1. Pastikan dev server running (`npm run dev`)
2. Check selector untuk login button
3. Increase timeout di test

### Issue: "Element not found"
**Solution**: Update selectors di test sesuai dengan UI Anda:
- Login form: `input[type="email"]`, `input[type="password"]`
- Login button: `button[type="submit"]`
- Logout button: `[data-testid="logout-button"]`

## Test Results Interpretation

### ✅ PASS - No Bug
```
✅ All tokens cleared after logout
✅ Token B is different from Token A
✅ All requests use User B token, no token carryover detected
```

### ❌ FAIL - Bug Detected
```
🚨 BUG DETECTED: Requests still using User A token:
  - https://api.futureguide.id/api/auth/profile
  - https://api.futureguide.id/api/auth/token-balance
```

Ini berarti:
1. Token A tidak di-clear dengan benar
2. Request interceptor masih menggunakan token lama
3. In-flight requests tidak di-abort

## Next Steps After Bug Reproduction

1. **Analyze Root Cause**: Lihat `docs/BASELINE_TOKEN_FLOW.2025-10-08.md`
2. **Implement Fixes**: Fase 3 - Implementasi Perbaikan
3. **Re-run Tests**: Verify fixes dengan `npm run test:e2e`
4. **Add More Tests**: Negative tests, race conditions, etc.

---

*Last Updated: 8 Oktober 2025*

