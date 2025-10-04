# Auth V2 Troubleshooting Guide

**Version**: 1.0  
**Last Updated**: 2025-10-04  
**Audience**: Engineering Team, DevOps, Support

---

## 📋 Table of Contents

1. [Common Issues](#common-issues)
2. [Login Problems](#login-problems)
3. [Registration Issues](#registration-issues)
4. [Token & Session Issues](#token--session-issues)
5. [Password Reset Problems](#password-reset-problems)
6. [Firebase Integration Issues](#firebase-integration-issues)
7. [Performance Issues](#performance-issues)
8. [Error Code Reference](#error-code-reference)
9. [Debugging Tools](#debugging-tools)

---

## 🔧 Common Issues

### Issue: Users Cannot Login After V2 Deployment

**Symptoms**:
- "Invalid credentials" error for correct password
- Login works in V1 but not V2
- Intermittent login failures

**Diagnosis**:
```bash
# Check which auth version user is getting
# Open browser console on login page
localStorage.getItem('authVersion')
# Expected: 'v2' or 'v1'

# Check rollout percentage
console.log(process.env.NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE)

# Check user's hash
import { shouldUseAuthV2 } from './config/auth-v2-config'
console.log(shouldUseAuthV2('user@example.com'))
```

**Solution A**: User in V2 but account only exists in V1
```bash
# Temporary fix: Force user to V1
localStorage.setItem('forceAuthV1', 'true')
# User should logout and login again

# Permanent fix: Migrate user account to Firebase
# See: docs/USER_MIGRATION_GUIDE.md
```

**Solution B**: Firebase credentials mismatch
```bash
# Verify Firebase config
curl -X POST https://api.futureguide.id/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Check response
# If 401 + "auth/wrong-password": Password is incorrect
# If 404 + "auth/user-not-found": User doesn't exist in Firebase
```

---

## 🔐 Login Problems

### Error: "auth/wrong-password"

**User-Facing Message**: "Password yang Anda masukkan salah"

**Possible Causes**:
1. User entered wrong password
2. User account migrated with different password
3. Password hash mismatch in migration

**Debug Steps**:
```bash
# Check if user exists in Firebase
firebase auth:export users.json --project futureguide
cat users.json | jq '.users[] | select(.email=="user@example.com")'

# If user exists: Password is actually wrong
# If user doesn't exist: User not migrated to V2
```

**Resolution**:
```javascript
// Option 1: User resets password
// Redirect to /forgot-password

// Option 2: Force V1 auth for this user
// Add to auth-v2-config.js blacklist
const V2_BLACKLIST = ['problematic@email.com'];
```

### Error: "auth/user-not-found"

**User-Facing Message**: "Pengguna dengan email ini tidak ditemukan"

**Cause**: User account not yet created in Firebase

**Resolution**:
```javascript
// If user exists in V1 database:
// 1. Register user in Firebase with temporary password
const tempPassword = generateSecurePassword();
await firebase.auth().createUser({
  email: user.email,
  password: tempPassword,
  displayName: user.username
});

// 2. Send password reset email immediately
await firebase.auth().sendPasswordResetEmail(user.email);

// 3. Notify user to check email
```

### Error: "auth/too-many-requests"

**User-Facing Message**: "Terlalu banyak percobaan login. Coba lagi nanti"

**Cause**: Firebase rate limiting (default: 10 failed attempts)

**Debug**:
```bash
# Check Firebase console
# Authentication → Users → [User] → Account lockout status

# Check recent login attempts
SELECT * FROM auth_logs 
WHERE email = 'user@example.com' 
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

**Resolution**:
```bash
# Option 1: Wait for automatic unlock (1 hour)

# Option 2: Manual unlock via Firebase Admin SDK
const admin = require('firebase-admin');
await admin.auth().updateUser(uid, {
  disabled: false
});

# Option 3: Increase rate limit (Firebase Console)
# Authentication → Settings → Security → Rate limiting
```

---

## 📝 Registration Issues

### Error: "auth/email-already-in-use"

**User-Facing Message**: "Email sudah terdaftar. Silakan login atau reset password"

**Cause**: Email already exists in Firebase

**Debug**:
```javascript
// Check if user also exists in V1
const v1User = await db.users.findOne({ email });
const v2User = await firebase.auth().getUserByEmail(email);

console.log('V1 User:', !!v1User);
console.log('V2 User:', !!v2User);

// Four scenarios:
// 1. V1: Yes, V2: Yes → Dual account (migration issue)
// 2. V1: Yes, V2: No  → Normal (not migrated)
// 3. V1: No,  V2: Yes → Normal V2 user
// 4. V1: No,  V2: No  → Error in check logic
```

**Resolution**:
```javascript
// Scenario 1: Merge accounts
// 1. Use V2 auth
// 2. Sync V1 data to user profile
// 3. Mark V1 account as migrated

// Scenario 2: Normal case
// Redirect to login with message
```

### Error: "auth/weak-password"

**User-Facing Message**: "Password terlalu lemah. Gunakan minimal 6 karakter"

**Cause**: Firebase requires password ≥ 6 characters

**Frontend Validation**:
```javascript
// Add in Register.jsx
const passwordSchema = z.string()
  .min(6, 'Password minimal 6 karakter')
  .regex(/[A-Z]/, 'Harus mengandung huruf besar')
  .regex(/[a-z]/, 'Harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Harus mengandung angka');
```

### Error: "auth/invalid-email"

**User-Facing Message**: "Format email tidak valid"

**Cause**: Email fails Firebase validation

**Common Invalid Formats**:
```
❌ email@          (incomplete domain)
❌ @domain.com     (missing local part)
❌ email..test@x   (consecutive dots)
❌ email@domain    (missing TLD)
✅ email@domain.com
```

---

## 🎫 Token & Session Issues

### Issue: Token Expires Too Quickly

**Symptoms**:
- User logged out after 30 minutes
- "Session expired" errors during active use

**Debug**:
```javascript
// Check token expiry in localStorage
const expiry = localStorage.getItem('tokenExpiry');
const expiryDate = new Date(parseInt(expiry));
console.log('Token expires at:', expiryDate);
console.log('Time remaining:', expiryDate - Date.now(), 'ms');

// Check refresh token
const refreshToken = localStorage.getItem('refreshToken');
console.log('Has refresh token:', !!refreshToken);
```

**Solution**:
```javascript
// Ensure token refresh is working
// Check useTokenRefresh hook is active

// Manually trigger refresh
import tokenService from '@/services/tokenService';
const newToken = await tokenService.refreshAuthToken();
console.log('New token:', newToken);

// If refresh fails, re-login required
```

### Issue: Infinite Token Refresh Loop

**Symptoms**:
- Network tab shows repeated /refresh calls
- High CPU usage
- App becomes unresponsive

**Debug**:
```javascript
// Check refresh interval
const { refreshInterval } = useTokenRefresh();
console.log('Refresh interval:', refreshInterval); 
// Expected: 300000 (5 minutes)

// Check if multiple instances running
window.tokenRefreshInstances = (window.tokenRefreshInstances || 0) + 1;
console.log('Token refresh instances:', window.tokenRefreshInstances);
// Expected: 1
```

**Solution**:
```javascript
// Fix: Ensure only one useTokenRefresh instance
// In AuthContext.tsx:
useEffect(() => {
  // Cleanup previous instance
  return () => {
    clearInterval(refreshTimerRef.current);
  };
}, []);

// Emergency fix: Disable auto-refresh temporarily
localStorage.setItem('disableTokenRefresh', 'true');
// User will need to re-login after 1 hour
```

### Issue: Token Not Sent in API Requests

**Symptoms**:
- API returns 401 Unauthorized
- Token exists in localStorage but not in request headers

**Debug**:
```javascript
// Check axios interceptor
import apiService from '@/services/apiService';
const request = await apiService.get('/api/user/profile');

// Inspect request headers
console.log('Request headers:', request.config.headers);
// Should contain: Authorization: Bearer <token>

// Check token retrieval
import tokenService from '@/services/tokenService';
console.log('ID Token:', tokenService.getIdToken());
```

**Solution**:
```javascript
// Verify apiService interceptor is registered
// In apiService.js:

apiService.interceptors.request.use((config) => {
  const authVersion = getAuthVersion();
  if (authVersion === 'v2') {
    const token = getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// If still failing: Check CORS headers
// Backend must allow Authorization header
```

---

## 🔑 Password Reset Problems

### Issue: Reset Email Not Received

**Symptoms**:
- User clicks "Send Reset Link"
- Success message shown
- Email never arrives

**Debug**:
```bash
# Check Firebase Auth logs
# Firebase Console → Authentication → Email templates → Sending history

# Check email in spam folder
# Check Firebase email provider settings
# Authentication → Templates → SMTP settings

# Verify email template is active
curl -X POST https://api.futureguide.id/api/auth/v2/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Solution**:
```javascript
// Option 1: Use custom email provider (SendGrid, etc.)
// Configure in Firebase Console

// Option 2: Check email domain reputation
// Some providers block @gmail.com senders

// Option 3: Verify user email is correct
await firebase.auth().getUserByEmail(email)
  .then(user => console.log('User exists:', user.email))
  .catch(err => console.log('User not found'));
```

### Issue: "auth/expired-action-code"

**User-Facing Message**: "Link reset password sudah kadaluarsa"

**Cause**: Reset link older than 1 hour

**Resolution**:
```javascript
// User must request new reset email
// No way to extend expired link

// Prevention: Increase expiry time
// Firebase Console → Authentication → Templates → 
//   Password reset → Link expiration (max: 24 hours)
```

### Issue: "auth/invalid-action-code"

**User-Facing Message**: "Link reset password tidak valid"

**Possible Causes**:
1. Link already used
2. Malformed oobCode parameter
3. Wrong Firebase project

**Debug**:
```javascript
// Extract oobCode from URL
const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');
console.log('oobCode:', oobCode);

// Verify oobCode format (should be ~100 characters)
console.log('oobCode length:', oobCode?.length);

// Check if code was already used
// Firebase Admin SDK:
const info = await admin.auth().checkActionCode(oobCode);
console.log('Code info:', info);
```

---

## 🔥 Firebase Integration Issues

### Issue: Firebase SDK Not Loaded

**Symptoms**:
- "firebase is not defined" error
- Login button does nothing
- Console errors about missing modules

**Debug**:
```javascript
// Check Firebase initialization
console.log('Firebase app:', firebase.app());
console.log('Firebase auth:', firebase.auth());

// Check environment variables
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0, 10) + '...',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});
```

**Solution**:
```bash
# Verify .env.production has Firebase config
cat .env.production | grep FIREBASE

# Rebuild and deploy
npm run build
vercel --prod

# If using CDN: Clear cache
```

### Issue: Firebase Quota Exceeded

**Error**: "auth/quota-exceeded"

**User-Facing Message**: "Sistem sedang sibuk. Coba lagi nanti"

**Debug**:
```bash
# Check Firebase console
# Project → Usage and billing → Authentication

# Free tier limits:
# - 50,000 verifications/month
# - 10,000 verifications/day

# Check current usage:
curl -X GET \
  "https://firebase.googleapis.com/v1/projects/futureguide/quotas" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"
```

**Solution**:
```bash
# Short-term: Upgrade to Blaze (pay-as-you-go)
# Long-term: Implement caching/rate limiting

# Emergency: Roll back to V1 (100%)
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0
```

### Issue: CORS Errors with Firebase

**Error**: "Access-Control-Allow-Origin" error

**Symptoms**:
- Login works locally but fails in production
- Browser console shows CORS error
- Network tab shows OPTIONS request failing

**Debug**:
```bash
# Test CORS headers
curl -X OPTIONS https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword \
  -H "Origin: https://futureguide.id" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Check allowed origins
```

**Solution**:
```javascript
// Firebase should allow all origins by default
// If using proxy: Configure CORS headers

// In next.config.js:
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ];
}
```

---

## ⚡ Performance Issues

### Issue: Slow Login Response (> 2 seconds)

**Debug**:
```bash
# Measure login latency
time curl -X POST https://api.futureguide.id/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check individual components:
# 1. Network latency (< 100ms)
# 2. Firebase Auth (< 500ms)
# 3. Database lookup (< 200ms)
# 4. Token generation (< 100ms)
```

**Solution**:
```javascript
// Add performance monitoring
import { performance } from 'perf_hooks';

const t0 = performance.now();
await authV2Service.login(email, password);
const t1 = performance.now();
console.log(`Login took ${t1 - t0}ms`);

// Optimize:
// 1. Enable Firebase persistent cache
// 2. Use CDN for static assets
// 3. Implement request caching
// 4. Reduce token size
```

### Issue: High Memory Usage

**Symptoms**:
- Browser tab uses > 500MB RAM
- Page becomes sluggish over time
- "Out of memory" errors

**Debug**:
```javascript
// Check for memory leaks
if (performance.memory) {
  console.log('Used heap:', performance.memory.usedJSHeapSize / 1048576, 'MB');
  console.log('Total heap:', performance.memory.totalJSHeapSize / 1048576, 'MB');
}

// Check token refresh cleanup
window.addEventListener('beforeunload', () => {
  console.log('Active intervals:', window.tokenRefreshInterval);
});
```

**Solution**:
```javascript
// Fix: Proper cleanup in useTokenRefresh
useEffect(() => {
  const intervalId = setInterval(refreshToken, 300000);
  
  return () => {
    clearInterval(intervalId); // CRITICAL: Must cleanup
  };
}, []);
```

---

## 📚 Error Code Reference

### Firebase Auth Error Codes

| Code | User Message (ID) | Meaning | Action |
|------|-------------------|---------|--------|
| `auth/wrong-password` | Password yang Anda masukkan salah | Incorrect password | Show error, allow retry |
| `auth/user-not-found` | Email tidak terdaftar | User doesn't exist | Suggest registration |
| `auth/email-already-in-use` | Email sudah terdaftar | Duplicate registration | Redirect to login |
| `auth/weak-password` | Password terlalu lemah | Password < 6 chars | Show requirements |
| `auth/invalid-email` | Format email tidak valid | Bad email format | Show example |
| `auth/too-many-requests` | Terlalu banyak percobaan | Rate limit hit | Show wait time |
| `auth/expired-action-code` | Link sudah kadaluarsa | Reset link expired | Request new link |
| `auth/invalid-action-code` | Link tidak valid | Bad reset link | Check URL |
| `auth/user-disabled` | Akun dinonaktifkan | Account disabled | Contact support |
| `auth/network-request-failed` | Koneksi internet bermasalah | Network error | Check connection |

### Custom Error Codes

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `V2_TOKEN_EXPIRED` | Token telah kadaluarsa | Token > 1 hour old | Trigger refresh |
| `V2_REFRESH_FAILED` | Gagal memperbarui sesi | Refresh token invalid | Force re-login |
| `V2_SERVICE_DOWN` | Layanan sementara tidak tersedia | Backend down | Roll back to V1 |
| `V2_MIGRATION_ERROR` | Kesalahan migrasi akun | Account migration failed | Use V1 fallback |

---

## 🛠️ Debugging Tools

### Browser Console Commands

```javascript
// Check current auth state
console.log('Auth Version:', localStorage.getItem('authVersion'));
console.log('ID Token:', localStorage.getItem('idToken')?.slice(0, 20) + '...');
console.log('Token Expiry:', new Date(parseInt(localStorage.getItem('tokenExpiry'))));
console.log('User ID:', localStorage.getItem('uid'));

// Force auth version
localStorage.setItem('forceAuthV1', 'true');  // Force V1
localStorage.removeItem('forceAuthV1');        // Remove force

// Clear all auth data
['idToken', 'refreshToken', 'uid', 'email', 'tokenExpiry', 'token', 'user']
  .forEach(key => localStorage.removeItem(key));
console.log('Auth data cleared. Please reload.');

// Test token refresh
import tokenService from '@/services/tokenService';
tokenService.refreshAuthToken()
  .then(token => console.log('Refresh success:', token.slice(0, 20) + '...'))
  .catch(err => console.error('Refresh failed:', err));

// Check token expiry status
import tokenService from '@/services/tokenService';
console.log('Token expired:', tokenService.isTokenExpired());
console.log('Token status:', tokenService.getTokenStatus());
```

### Network Debugging

```bash
# Test V2 login endpoint
curl -X POST https://api.futureguide.id/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}' \
  -v

# Test token refresh
curl -X POST https://api.futureguide.id/api/auth/v2/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your-refresh-token>"}'

# Test password reset
curl -X POST https://api.futureguide.id/api/auth/v2/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Firebase Admin SDK Debugging

```javascript
// Check user in Firebase
const admin = require('firebase-admin');
const user = await admin.auth().getUserByEmail('user@example.com');
console.log('Firebase user:', {
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  disabled: user.disabled,
  emailVerified: user.emailVerified
});

// List all users (debugging only)
const listUsers = await admin.auth().listUsers(100);
console.log('Total users:', listUsers.users.length);

// Delete test user
await admin.auth().deleteUser('test-user-uid');
```

---

## 📞 When to Escalate

### Immediate Escalation (P0)
- ✅ All users cannot login (V1 and V2 both failing)
- ✅ Firebase Auth service completely down
- ✅ Data breach or security incident
- ✅ Error rate > 10% for > 15 minutes

**Action**: Call on-call engineer immediately

### Urgent Escalation (P1)
- ⚠️ V2 error rate > 1% for > 30 minutes
- ⚠️ Token refresh completely broken
- ⚠️ Critical bugs affecting > 100 users
- ⚠️ Firebase quota exceeded

**Action**: Roll back to V1, then investigate

### Standard Escalation (P2)
- 🔔 Performance degradation (latency > 2s)
- 🔔 Intermittent errors affecting < 10 users
- 🔔 Non-critical feature broken (e.g., profile photo upload)

**Action**: Create ticket, fix in next sprint

---

## 📝 Logging Best Practices

### What to Log

```javascript
// ✅ GOOD: Structured logging
logger.info('V2 login attempt', {
  email: email.substring(0, 3) + '***',  // Partial masking
  authVersion: 'v2',
  timestamp: Date.now(),
  userAgent: req.headers['user-agent']
});

// ❌ BAD: Sensitive data
console.log('Login:', email, password);  // NEVER log passwords
```

### Log Levels

- **ERROR**: Login failed, token refresh failed, API errors
- **WARN**: Token expiring soon, rate limit approaching
- **INFO**: Successful login, logout, registration
- **DEBUG**: Token retrieved, auth version determined

---

**End of Troubleshooting Guide**  
**Version**: 1.0  
**Last Updated**: 2025-10-04

**Need Help?** Check [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) or contact engineering team.
