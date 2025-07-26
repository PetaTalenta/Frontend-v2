# Token Balance Debug Tools

## 🚨 Masalah: Token Balance Tidak Muncul

Jika token balance tidak muncul meskipun sudah ditambahkan di database, gunakan tools debugging berikut untuk mendiagnosis dan memperbaiki masalah.

## 🛠️ Tools yang Tersedia

### 1. Web Debug Interface
**URL:** `/debug-token-balance`

Interface web yang komprehensif untuk debugging token balance issues.

**Fitur:**
- ✅ Authentication status check
- ✅ API health monitoring
- ✅ Direct endpoint testing
- ✅ Token validation
- ✅ Quick fixes
- ✅ Detailed logging

**Cara Menggunakan:**
1. Login ke aplikasi
2. Buka `http://localhost:3000/debug-token-balance`
3. Klik "Run Full Diagnostic"
4. Review hasil dan ikuti rekomendasi

### 2. Command Line Debug Script
**File:** `scripts/debug-token-balance.js`

Script Node.js untuk debugging dari command line.

**Cara Menggunakan:**
```bash
# 1. Dapatkan token dari browser
# - Login ke aplikasi
# - Buka console (F12)
# - Run: localStorage.getItem('token')
# - Copy token

# 2. Jalankan script
node scripts/debug-token-balance.js "YOUR_TOKEN_HERE"
```

**Output:**
- Token validation
- API health check
- Endpoint testing
- Recommendations

### 3. Browser Console Quick Tests

**Test Authentication:**
```javascript
// Check token
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

**Test Proxy API:**
```javascript
fetch('/api/proxy/auth/token-balance', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Test Real API:**
```javascript
fetch('https://api.chhrone.web.id/api/auth/token-balance', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

## 🔧 Quick Fixes

### Force Refresh Token Balance
```javascript
// Import dan jalankan
import { forceRefreshTokenBalance } from './utils/token-balance-fixes';
const result = await forceRefreshTokenBalance();
console.log(result);
```

### Fix Authentication Issues
```javascript
import { fixAuthenticationIssues } from './utils/token-balance-fixes';
const result = await fixAuthenticationIssues();
console.log(result);
```

### Run All Quick Fixes
```javascript
import { runAllQuickFixes } from './utils/token-balance-fixes';
const result = await runAllQuickFixes();
console.log(result);
```

## 📊 Common Scenarios & Solutions

### Scenario 1: Proxy API Working, Real API Failing
**Symptoms:** Debug shows Proxy API returns balance, Real API direct errors

**Solution:**
```bash
# Check environment
echo $NEXT_PUBLIC_API_BASE_URL

# Verify real API URL
# Edit .env.local:
NEXT_PUBLIC_API_BASE_URL=https://api.chhrone.web.id
```

### Scenario 2: All APIs Return 401
**Symptoms:** Authentication errors across all endpoints

**Solutions:**
1. **Token Expired:** Re-login to get fresh token
2. **Token Corrupted:** Clear localStorage and re-login
3. **Wrong Format:** Check token format (JWT vs mock)

```javascript
// Clear auth data
localStorage.removeItem('token');
localStorage.removeItem('user');
// Then re-login
```

### Scenario 3: Inconsistent Balances
**Symptoms:** Different balance values from different APIs

**Possible Causes:**
- Database sync issues
- Cache problems
- API version differences

**Solutions:**
1. Check database directly
2. Clear cache
3. Restart services

### Scenario 4: All APIs Failing
**Symptoms:** No endpoint responds correctly

**Solutions:**
```bash
# Check development server
npm run dev

# Check network
ping api.chhrone.web.id

# Check ports
netstat -an | grep 3000
```

## 🔍 Debugging Workflow

### Step 1: Initial Check
1. Verify user is logged in
2. Check token exists in localStorage
3. Verify token format

### Step 2: API Testing
1. Test Mock API (`/api/auth/token-balance`)
2. Test Proxy API (`/api/proxy/auth/token-balance`)
3. Test Real API direct (`https://api.chhrone.web.id/api/auth/token-balance`)

### Step 3: Analysis
1. Compare responses
2. Check for consistent data
3. Identify failing components

### Step 4: Fix Application
1. Run appropriate quick fixes
2. Verify fixes worked
3. Test end-to-end flow

## 📝 Logging & Monitoring

### Enable Debug Logging
```javascript
// In browser console
localStorage.setItem('debug', 'token-balance');
// Refresh page to see detailed logs
```

### Monitor Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "token-balance"
4. Check request/response details

### Check Console Logs
Look for these log patterns:
- `[DEBUG] Token balance check result:`
- `Enhanced Auth API: Token balance retrieved`
- `TokenContext: Token balance updated`

## 🚨 When to Escalate

Contact development team if:
- All debugging tools show success but UI still doesn't update
- Database shows correct balance but all APIs return different values
- Authentication works but token balance always returns 0
- Intermittent issues that can't be reproduced consistently

## 📋 Debug Information to Collect

When reporting issues, include:
1. **Debug session export** (from web interface)
2. **Browser console logs**
3. **Network tab screenshots**
4. **User ID and email**
5. **Expected vs actual balance**
6. **Environment details** (dev/staging/prod)

## 🔄 Maintenance

### Regular Checks
- Monitor API health endpoints
- Check token expiration patterns
- Verify database consistency
- Test cross-browser compatibility

### Performance Monitoring
- Track API response times
- Monitor error rates
- Check cache hit rates
- Analyze user session patterns

---

## 📚 Additional Resources

- [Token Balance Troubleshooting Guide](docs/TOKEN_BALANCE_TROUBLESHOOTING.md)
- [API Integration Guide](docs/API_INTEGRATION_GUIDE.md)
- [Authentication Flow Documentation](docs/AUTH_FLOW.md)

## 🆘 Emergency Contacts

- **Development Team:** [team@example.com]
- **API Support:** [api-support@example.com]
- **Infrastructure:** [infra@example.com]
