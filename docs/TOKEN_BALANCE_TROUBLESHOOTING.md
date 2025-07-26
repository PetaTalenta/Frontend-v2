# Token Balance Troubleshooting Guide

## Masalah: Token Balance Tidak Muncul Meskipun Sudah Ditambahkan di Database

### 🔍 Kemungkinan Penyebab

1. **API Endpoint Issues**
   - Proxy API configuration error
   - Real API tidak accessible
   - Network connectivity problems

2. **Authentication Problems**
   - Token expired atau invalid
   - Token format tidak sesuai
   - Authorization header tidak terbaca

3. **Database vs Cache Mismatch**
   - Real API database sudah diupdate tapi cache belum refresh
   - Browser cache issues

4. **Environment Configuration**
   - Environment variables tidak sesuai
   - API health check gagal

### 🛠️ Langkah Debugging

#### 1. Gunakan Debug Tool
Akses halaman debug: `/debug-token-balance`

```bash
# Buka di browser
http://localhost:3000/debug-token-balance
```

#### 2. Manual Testing via Browser Console

```javascript
// 1. Check authentication status
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// 2. Test Proxy API
fetch('/api/proxy/auth/token-balance', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);

// 3. Test Real API Direct
fetch('https://api.chhrone.web.id/api/auth/token-balance', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

#### 3. Check Network Tab
1. Buka Developer Tools (F12)
2. Go to Network tab
3. Refresh halaman atau trigger token balance check
4. Look for requests to `/api/auth/token-balance` atau `/api/proxy/auth/token-balance`
5. Check response status dan data

### 🔧 Solusi Berdasarkan Skenario

#### Skenario 1: Mock API Working, Real API Failing
**Gejala:** Debug tool menunjukkan Mock API return balance, tapi Real API error

**Solusi:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_USE_MOCK_API
echo $NEXT_PUBLIC_API_BASE_URL

# Force menggunakan Real API
# Edit .env.local
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://api.chhrone.web.id
```

#### Skenario 2: Authentication Error (401)
**Gejala:** Semua API return 401 Unauthorized

**Solusi:**
```javascript
// Check token validity
const token = localStorage.getItem('token');
console.log('Token length:', token?.length);
console.log('Token format:', token?.substring(0, 20));

// Re-login jika perlu
// Atau refresh token
```

#### Skenario 3: Inconsistent Balance Between APIs
**Gejala:** Mock API dan Real API return balance yang berbeda

**Solusi:**
1. **Real API Database Issue:** Check database langsung
2. **Cache Issue:** Clear cache atau restart services
3. **Sync Issue:** Pastikan database dan cache in sync

#### Skenario 4: All APIs Failing
**Gejala:** Semua endpoint return error

**Solusi:**
```bash
# Check if development server running
npm run dev

# Check if proxy is working
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/proxy/auth/token-balance

# Check real API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.chhrone.web.id/api/auth/token-balance
```

### 📋 Checklist Debugging

- [ ] User sudah login dengan benar
- [ ] Token tersimpan di localStorage
- [ ] Token format valid (JWT atau mock token)
- [ ] Environment variables configured correctly
- [ ] Development server running
- [ ] Real API accessible
- [ ] Database contains correct token balance
- [ ] No CORS issues
- [ ] Network connection stable

### 🔍 Advanced Debugging

#### Check API Health
```javascript
// Test API health
fetch('/api/health')
  .then(r => r.json())
  .then(console.log);
```

#### Check Token Expiry
```javascript
// For JWT tokens
function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const token = localStorage.getItem('token');
const payload = parseJWT(token);
console.log('Token payload:', payload);
console.log('Token expires:', new Date(payload?.exp * 1000));
```

#### Force Refresh Token Balance
```javascript
// Trigger manual refresh
import { useToken } from '../contexts/TokenContext';

// In React component:
const { refreshTokenBalance } = useToken();
refreshTokenBalance();
```

### 🚨 Common Issues & Quick Fixes

#### Issue: "Token balance unavailable"
```javascript
// Quick fix: Clear and re-login
localStorage.removeItem('token');
localStorage.removeItem('user');
// Then login again
```

#### Issue: Mock API returns default balance (10)
```javascript
// Mock API uses in-memory storage
// Restart development server to reset
npm run dev
```

#### Issue: Real API timeout
```javascript
// Check if API is down
fetch('https://api.chhrone.web.id/api/health')
  .then(r => console.log('API Status:', r.status))
  .catch(e => console.log('API Down:', e));
```

### 📞 Support Information

Jika masalah masih berlanjut setelah mengikuti panduan ini:

1. **Collect Debug Information:**
   - Run debug tool dan export results
   - Screenshot dari Network tab
   - Console logs
   - Environment configuration

2. **Check Database Directly:**
   - Verify token balance di database
   - Check user ID consistency
   - Verify last_updated timestamp

3. **Contact Development Team:**
   - Provide debug session export
   - Include user ID dan email
   - Describe expected vs actual behavior

### 🔄 Prevention

1. **Regular Health Checks:**
   - Monitor API endpoints
   - Set up alerts for API failures
   - Regular database consistency checks

2. **Better Error Handling:**
   - Implement retry mechanisms
   - Fallback strategies
   - User-friendly error messages

3. **Monitoring:**
   - Log all token balance requests
   - Track API response times
   - Monitor authentication failures
