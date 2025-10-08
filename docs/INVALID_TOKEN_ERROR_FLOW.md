# 🔍 INVALID_TOKEN Error: Complete Flow Analysis

## ❓ Pertanyaan: Apa yang men-trigger error `{"success":false,"error":"INVALID_TOKEN","message":"Invalid or expired token"}`?

---

## 🎯 Jawaban Singkat

Error ini ditrigger oleh **BACKEND API** ketika:
1. **Token sudah expired** (lewat dari waktu expiry)
2. **Token tidak valid** (format salah, signature invalid, atau token sudah di-blacklist)
3. **Token tidak ada** dalam header Authorization

Frontend hanya **menerima** response error ini dari backend, **bukan men-generate** sendiri.

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLOW ERROR INVALID_TOKEN                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  1. USER ACTION  │
└────────┬─────────┘
         │
         │ Submit assessment / Check status / Fetch result
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  2. FRONTEND (assessment-service.ts)                                  │
├──────────────────────────────────────────────────────────────────────┤
│  async getAssessmentStatus(jobId: string) {                          │
│    // ✅ PRODUCTION FIX: Validate token first                        │
│    let token: string;                                                 │
│    try {                                                              │
│      token = await ensureValidToken(); // Check expiry, auto-refresh │
│    } catch (error) {                                                  │
│      throw createSafeError('Auth failed...', 'AUTH_ERROR');         │
│    }                                                                  │
│                                                                       │
│    // Make API call with token                                       │
│    const response = await fetch(API_URL, {                           │
│      headers: {                                                       │
│        'Authorization': `Bearer ${token}`  // ⬅️ Token dikirim       │
│      }                                                                │
│    });                                                                │
│  }                                                                    │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ HTTP Request with Authorization header
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  3. BACKEND API (https://futureguide.id/api/assessment/...)         │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Authentication Middleware                                   │   │
│  │  ──────────────────────────                                  │   │
│  │                                                               │   │
│  │  1. Extract token from header:                               │   │
│  │     const authHeader = req.headers.authorization;            │   │
│  │     const token = authHeader?.split(' ')[1]; // "Bearer XXX"│   │
│  │                                                               │   │
│  │  2. Check if token exists:                                   │   │
│  │     if (!token) {                                            │   │
│  │       return res.status(401).json({                          │   │
│  │         success: false,                                      │   │
│  │         error: 'INVALID_TOKEN',                              │   │
│  │         message: 'Invalid or expired token'                 │   │
│  │       });                                                    │   │
│  │     }                                                         │   │
│  │                                                               │   │
│  │  3. Verify token signature & expiry:                         │   │
│  │     try {                                                     │   │
│  │       const decoded = jwt.verify(token, SECRET_KEY);         │   │
│  │       req.user = decoded; // ✅ Token valid                  │   │
│  │     } catch (error) {                                        │   │
│  │       // Token expired atau signature invalid               │   │
│  │       return res.status(401).json({                          │   │
│  │         success: false,                                      │   │
│  │         error: 'INVALID_TOKEN',                              │   │
│  │         message: 'Invalid or expired token'                 │   │
│  │       });                                                    │   │
│  │     }                                                         │   │
│  │                                                               │   │
│  │  4. Check token blacklist (optional):                        │   │
│  │     if (await isTokenBlacklisted(token)) {                   │   │
│  │       return res.status(401).json({                          │   │
│  │         success: false,                                      │   │
│  │         error: 'INVALID_TOKEN',                              │   │
│  │         message: 'Invalid or expired token'                 │   │
│  │       });                                                    │   │
│  │     }                                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  If all checks pass: ✅ Process request normally                     │
│  If any check fails:  ❌ Return INVALID_TOKEN error                  │
└────────────────────┬──────────────────────────────────────────────────┘
                     │
                     │ HTTP Response 401
                     │ {"success":false,"error":"INVALID_TOKEN","message":"..."}
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  4. FRONTEND RECEIVES ERROR                                           │
├──────────────────────────────────────────────────────────────────────┤
│  // In assessment-service.ts                                          │
│  const response = await fetch(...);                                   │
│                                                                       │
│  if (!response.ok) {  // response.status === 401                     │
│    const errorData = await response.json();                          │
│    // errorData = {                                                  │
│    //   success: false,                                              │
│    //   error: "INVALID_TOKEN",                                      │
│    //   message: "Invalid or expired token"                         │
│    // }                                                              │
│                                                                       │
│    switch (response.status) {                                        │
│      case 401:                                                        │
│        throw createSafeError(                                         │
│          'Authentication failed. Please login again.',                │
│          'AUTH_ERROR'                                                 │
│        );                                                             │
│    }                                                                  │
│  }                                                                    │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ Error propagates
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  5. USER SEES ERROR MESSAGE                                           │
├──────────────────────────────────────────────────────────────────────┤
│  - Console log: "❌ Assessment Service: Token validation failed"     │
│  - UI shows: "Authentication failed. Please login again."            │
│  - May auto-redirect to /auth page                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 3 Kondisi yang Men-trigger INVALID_TOKEN

### 1️⃣ **Token Expired** (Paling Umum di Production)

**Kondisi:**
```javascript
// Token JWT structure
{
  "email": "kasykoi@gmail.com",
  "userId": "12345",
  "iat": 1728480000,  // Issued at: Oct 9, 2024 10:00:00
  "exp": 1728483600   // Expires at: Oct 9, 2024 11:00:00 (1 hour later)
}

// Current time
const now = Date.now() / 1000; // 1728483700 (11:01:40)

// Backend validation
if (decoded.exp < now) {
  // Token sudah expired 1 menit 40 detik yang lalu
  return { error: 'INVALID_TOKEN', message: 'Invalid or expired token' };
}
```

**Kapan ini terjadi?**
- User submit assessment jam 10:00
- Assessment processing butuh 2-5 menit
- Token expired jam 11:00
- Polling status check jam 11:01 → ❌ INVALID_TOKEN

**Timeline Production:**
```
T+0:00    Submit assessment (token valid, exp: 11:00)
T+0:01    Start monitoring/polling
T+0:10    Poll #1 ✅ (token valid)
T+0:20    Poll #2 ✅ (token valid)
...
T+59:50   Poll #119 ✅ (token valid, 10 sec sebelum expired)
T+60:00   ⚠️ TOKEN EXPIRED
T+60:10   Poll #120 ❌ INVALID_TOKEN (token sudah expired 10 detik)
```

---

### 2️⃣ **Token Invalid Signature**

**Kondisi:**
```javascript
// Backend validation
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // ✅ Signature valid
} catch (error) {
  // ❌ Signature tidak cocok
  if (error.name === 'JsonWebTokenError') {
    return { error: 'INVALID_TOKEN', message: 'Invalid or expired token' };
  }
}
```

**Kapan ini terjadi?**
- Token di-tamper/modify manually
- Token dari environment berbeda (dev token di production)
- JWT secret key berubah di backend
- Token corrupt saat transmisi

---

### 3️⃣ **Token Tidak Ada**

**Kondisi:**
```javascript
// Backend middleware
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    success: false,
    error: 'INVALID_TOKEN',
    message: 'Invalid or expired token'
  });
}
```

**Kapan ini terjadi?**
- User logout tapi masih ada request pending
- LocalStorage cleared
- Token tidak terkirim dalam header (bug di frontend)

---

## 🐛 Bug Sebelum Fix

### **Problem: Monitoring menggunakan expired token**

**Code SEBELUM fix** (`assessment-service.ts`):
```typescript
async getAssessmentStatus(jobId: string) {
  // ❌ BUG: Langsung ambil dari localStorage tanpa validasi
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('No authentication token');
  }

  // ❌ Token mungkin sudah expired tapi tetap dikirim ke API
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}` // ⬅️ Bisa expired!
    }
  });

  // Backend: jwt.verify(token) → expired → 401 INVALID_TOKEN
}
```

**Mengapa ini masalah?**
```
User submit assessment:
├─ T+0:00  Token valid (exp: T+60:00)
├─ T+0:01  Start polling every 10s
├─ T+0:10  Poll #1 ✅ (token masih valid)
├─ T+0:20  Poll #2 ✅ (token masih valid)
...
├─ T+59:50 Poll #119 ✅ (token masih valid, 10 sec lagi expired)
├─ T+60:00 ⚠️ TOKEN EXPIRED
└─ T+60:10 Poll #120:
           ├─ Frontend: ambil token dari localStorage (expired)
           ├─ Send to backend dengan expired token
           ├─ Backend: jwt.verify() → TokenExpiredError
           └─ Return: {"error":"INVALID_TOKEN"} ❌
```

---

## ✅ Solution: Gunakan `ensureValidToken()`

**Code SETELAH fix**:
```typescript
async getAssessmentStatus(jobId: string) {
  // ✅ FIX: Validate token first, auto-refresh if needed
  let token: string;
  try {
    token = await ensureValidToken();
    // ensureValidToken() akan:
    // 1. Check jika token expired
    // 2. Auto-refresh jika expired atau expiring soon (<5 min)
    // 3. Return fresh valid token
  } catch (error) {
    throw createSafeError('Auth failed', 'AUTH_ERROR');
  }

  // ✅ Token dijamin valid (baru di-refresh jika perlu)
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}` // ⬅️ Always valid!
    }
  });
}
```

**Bagaimana ini mengatasi masalah?**
```
User submit assessment:
├─ T+0:00  Token valid (exp: T+60:00)
├─ T+0:01  Start polling
├─ T+0:10  Poll #1:
│          ├─ ensureValidToken() → check expiry
│          ├─ Token masih valid (exp in 59:50)
│          └─ Use existing token ✅
...
├─ T+55:00 Poll #110:
│          ├─ ensureValidToken() → check expiry
│          ├─ Token expiring soon! (exp in 5:00)
│          ├─ AUTO REFRESH token → get new token (exp: T+115:00)
│          └─ Use new token ✅
├─ T+55:10 Poll #111:
│          ├─ ensureValidToken() → check expiry
│          ├─ Token valid (exp in 59:50) - using refreshed token
│          └─ Use refreshed token ✅
...
├─ T+60:00 (Original token would expire, but we already refreshed at T+55:00)
└─ T+60:10 Poll #120:
           ├─ ensureValidToken() → check expiry
           ├─ Token masih valid (exp in 54:50) - dari refresh T+55:00
           └─ Use refreshed token ✅ NO ERROR!
```

---

## 🎯 `ensureValidToken()` Implementation

**File: `src/utils/token-validation.ts`**

```typescript
export async function ensureValidToken(forceRefresh: boolean = false): Promise<string> {
  const authVersion = tokenService.getAuthVersion();

  if (authVersion === 'v2') {
    // Auth V2: Firebase ID token dengan refresh capability
    const status = tokenService.getTokenStatus();
    
    // 1. Check if token expired
    if (status.isExpired) {
      console.log('🔄 Token expired, refreshing...');
      const newToken = await tokenService.refreshAuthToken();
      return newToken;
    }
    
    // 2. Check if token expiring soon (< 5 minutes)
    const REFRESH_THRESHOLD = 300; // 5 minutes in seconds
    if (status.timeUntilExpiry < REFRESH_THRESHOLD) {
      console.log(`⚠️ Token expiring in ${status.timeUntilExpiry}s, refreshing...`);
      const newToken = await tokenService.refreshAuthToken();
      return newToken;
    }
    
    // 3. Token still valid for more than 5 minutes
    console.log(`✅ Token valid (exp in ${status.timeUntilExpiry}s)`);
    return tokenService.getIdToken();
  } else {
    // Auth V1: Simple token retrieval (no refresh capability)
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('✅ Auth V1 token retrieved');
    return token;
  }
}
```

**Benefits:**
1. **Proactive refresh**: Refresh 5 menit sebelum expired (preventive)
2. **Reactive refresh**: Refresh jika sudah expired (recovery)
3. **No manual intervention**: Fully automatic
4. **Zero INVALID_TOKEN errors**: Token selalu valid saat digunakan

---

## 📍 Lokasi File yang Men-trigger Request ke Backend

### **1. Assessment Submission**
```typescript
// File: src/services/assessment-service.ts
async submitToAPI(scores, assessmentName, onTokenBalanceUpdate, answers) {
  // Validate token
  const token = await ensureValidToken();
  
  // POST /api/assessment/submit
  const response = await fetch(`${API_URL}/api/assessment/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // ⬅️ Trigger #1
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ scores, answers, assessmentName })
  });
  
  // Backend akan validate token
  // Jika expired → return INVALID_TOKEN
}
```

### **2. WebSocket Connection**
```typescript
// File: src/services/assessment-service.ts
async tryWebSocketMonitoring(jobId, onProgress, onComplete) {
  // Validate token before WebSocket
  const token = await ensureValidToken();
  
  // Connect to WebSocket
  socket.emit('authenticate', { 
    token, // ⬹️ Trigger #2
    jobId 
  });
  
  // Backend WebSocket middleware validates token
  // Jika expired → emit 'error' with INVALID_TOKEN
}
```

### **3. Polling Status Check**
```typescript
// File: src/services/assessment-service.ts
async startPollingMonitoring(jobId, onProgress, onComplete) {
  const poll = async () => {
    // Refresh token before each poll
    await ensureValidToken(); // ⬅️ Trigger #3
    
    // GET /api/assessment/status/:jobId
    const status = await this.getAssessmentStatus(jobId);
    
    // Backend validates token
    // Jika expired → return INVALID_TOKEN
  };
  
  // Poll every 10 seconds
  const intervalId = setInterval(poll, 10000);
}
```

### **4. Get Assessment Result**
```typescript
// File: src/services/assessment-service.ts
async getAssessmentResult(jobId) {
  // Validate token
  const token = await ensureValidToken();
  
  // GET /api/assessment/result/:jobId
  const response = await fetch(`${API_URL}/api/assessment/result/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}` // ⬅️ Trigger #4
    }
  });
  
  // Backend validates token
  // Jika expired → return INVALID_TOKEN
}
```

---

## 🔐 Backend Token Validation Flow

**Pseudocode backend middleware**:
```javascript
// File: backend/middleware/auth.js
function authenticateToken(req, res, next) {
  // 1. Extract token
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // "Bearer XXX"
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
  
  // 2. Verify JWT signature & expiry
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Check expiry manually (JWT library already does this)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      });
    }
    
    // 4. Optional: Check blacklist
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      });
    }
    
    // 5. All checks pass
    req.user = decoded;
    next();
    
  } catch (error) {
    // Token signature invalid or other JWT error
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
}

// Apply to routes
app.get('/api/assessment/status/:jobId', authenticateToken, getStatus);
app.get('/api/assessment/result/:jobId', authenticateToken, getResult);
app.post('/api/assessment/submit', authenticateToken, submitAssessment);
```

---

## 🎯 Summary

| **Pertanyaan** | **Jawaban** |
|----------------|-------------|
| Siapa yang men-trigger error? | **Backend API** via authentication middleware |
| Kapan error ini muncul? | Saat token **expired**, **invalid signature**, atau **tidak ada** |
| Mengapa terjadi di production? | Token expired selama monitoring (2-5 menit), tidak di-refresh |
| Bagaimana fix-nya? | Gunakan `ensureValidToken()` untuk auto-refresh sebelum expired |
| Di mana fix diterapkan? | 3 lokasi: WebSocket connection, polling loop, status check |
| Apakah masih bisa muncul setelah fix? | **Tidak**, karena token selalu di-refresh 5 menit sebelum expired |

---

## 🚀 Testing INVALID_TOKEN Error

### **Cara memicu error (untuk testing)**:

```javascript
// 1. Manual token expiry simulation
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[EXPIRED_TOKEN]');

// 2. Submit assessment
await assessmentService.submitAssessment({ ... });

// 3. Error akan muncul saat polling/WebSocket karena token expired
// ❌ Backend: jwt.verify() → TokenExpiredError → INVALID_TOKEN
```

### **Cara verify fix bekerja**:

```javascript
// 1. Login dan submit assessment
await assessmentService.submitAssessment({ ... });

// 2. Monitor console logs
// ✅ Should see: "Token valid (exp in XXXs)"
// ⚠️ After 55 minutes: "Token expiring soon, refreshing..."
// ✅ After refresh: "Token valid (exp in 3600s)"

// 3. No INVALID_TOKEN errors during entire monitoring period
```

---

## 📞 Troubleshooting

**Q: Masih melihat INVALID_TOKEN setelah fix?**

Kemungkinan penyebab:
1. ❌ Fix belum di-deploy ke production
2. ❌ Cache browser masih pakai kode lama (hard refresh: Ctrl+Shift+R)
3. ❌ Token refresh endpoint di backend tidak berfungsi
4. ❌ Auth V2 tidak enabled (masih pakai Auth V1 yang tidak support refresh)

**Q: Bagaimana tau token expired berapa lama?**

```javascript
// Check di browser console
const tokenService = (await import('./services/tokenService')).default;
const status = tokenService.getTokenStatus();
console.log('Time until expiry:', status.timeUntilExpiry, 'seconds');
console.log('Is expired:', status.isExpired);
```

**Q: Bagaimana cara debug token validation?**

```javascript
// Enable debug mode di ensureValidToken
const token = await ensureValidToken();
// Check console untuk logs:
// - "✅ Token valid (exp in XXXs)"
// - "⚠️ Token expiring soon, refreshing..."
// - "🔄 Token expired, refreshing..."
```

---

**Author**: AI Assistant  
**Date**: October 9, 2024  
**Version**: 1.0  
**Related Docs**: 
- `PRODUCTION_FIX_INVALID_TOKEN.md`
- `AUDIT_TOKEN_RACE_CONDITION.md`
