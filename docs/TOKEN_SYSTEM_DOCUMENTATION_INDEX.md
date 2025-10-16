# 📚 Token System Documentation Index

> Comprehensive documentation untuk sistem token dan refresh token di FutureGuide Frontend

---

## 📖 Quick Navigation

### 🚀 Start Here

**Untuk Quick Overview:**
- 📄 [Quick Summary](./TOKEN_SYSTEM_QUICK_SUMMARY.md) - 5-minute read
- 📊 [Visual Guide](./TOKEN_SYSTEM_VISUAL_GUIDE.md) - Diagrams & flowcharts

**Untuk Detailed Analysis:**
- 📝 [Comprehensive Audit](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md) - Full technical details
- ⚠️ [Gap Analysis](./TOKEN_SYSTEM_GAP_ANALYSIS.md) - Expectation vs Reality

---

## 📋 Documents Overview

### 1. TOKEN_SYSTEM_QUICK_SUMMARY.md
**Purpose:** Executive summary untuk quick understanding  
**Target Audience:** All team members, stakeholders  
**Reading Time:** 5 minutes  
**Content:**
- ✅ Status checklist
- 🎯 3 jenis token overview
- 🔄 Refresh mechanism summary
- ⚠️ Gap identification
- 🔧 Quick fix instructions

**Use When:**
- Need quick status update
- Explaining to stakeholders
- Quick reference for developers

---

### 2. TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md
**Purpose:** Detailed technical documentation  
**Target Audience:** Developers, technical leads  
**Reading Time:** 30 minutes  
**Content:**
- 🔐 Complete token types explanation
- 🔄 Refresh system deep dive
- 📦 Storage strategy details
- ⚙️ Configuration guide
- 🛡️ Security features
- 📊 Performance metrics
- 🧪 Testing guidelines

**Use When:**
- Debugging token issues
- Implementing new features
- Understanding architecture
- Onboarding new developers

---

### 3. TOKEN_SYSTEM_VISUAL_GUIDE.md
**Purpose:** Visual representation of token flows  
**Target Audience:** All team members  
**Reading Time:** 15 minutes  
**Content:**
- 🎨 Architecture diagrams
- 📊 Timeline visualizations
- 🔄 Flow charts
- 🗺️ Storage layouts
- 📈 Sequence diagrams
- 🎯 Quick reference card

**Use When:**
- Visual learners
- Presentations
- Architecture reviews
- Documentation supplements

---

### 4. TOKEN_SYSTEM_GAP_ANALYSIS.md
**Purpose:** Analysis of expectation vs implementation  
**Target Audience:** Stakeholders, product owners, technical leads  
**Reading Time:** 20 minutes  
**Content:**
- ⚠️ Gap identification
- 🔍 Root cause analysis
- 💡 Solution recommendations
- 📊 Impact analysis
- 🧪 Testing checklist
- 📈 Monitoring plan
- ✅ Decision matrix

**Use When:**
- Requirement discussions
- Decision making
- Stakeholder updates
- Planning changes

---

## 🎯 Quick Answers

### "Apa saja jenis token yang ada?"
**Answer:** Ada 3 jenis token:
1. **Firebase ID Token** - Expires in 1 hour
2. **Firebase Refresh Token** - Long-lived
3. **Legacy JWT Token** - For v1 compatibility

👉 See: [Quick Summary - Section 2](./TOKEN_SYSTEM_QUICK_SUMMARY.md#-3-jenis-token)

---

### "Apakah ada sistem refresh token?"
**Answer:** ✅ Ya, ada sistem auto-refresh yang lengkap:
- Check setiap 5 menit
- Refresh di menit ke-50 (bukan 30!)
- Race condition protection
- Cross-tab synchronization

👉 See: [Quick Summary - Section 3](./TOKEN_SYSTEM_QUICK_SUMMARY.md#-sistem-refresh-token)

---

### "Mengapa refresh di menit 50, bukan 30?"
**Answer:** Karena mengikuti Firebase best practice:
- Refresh shortly before expiry (10 min buffer)
- Mengurangi API calls (1x vs 2x per hour)
- Lebih efficient
- Tetap aman dengan 10 menit buffer

👉 See: [Gap Analysis - Section 2](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-2-root-cause-analysis)

---

### "Bagaimana cara ubah ke refresh setiap 30 menit?"
**Answer:** Set environment variable:
```bash
NEXT_PUBLIC_AUTH_V2_REFRESH_BEFORE_EXPIRY=1800
```

👉 See: [Gap Analysis - Section 3](./TOKEN_SYSTEM_GAP_ANALYSIS.md#--option-2-change-to-30-minute-refresh)

---

### "Di mana token disimpan?"
**Answer:** Multi-location storage:
- `localStorage.authV2_idToken` (primary)
- `localStorage.token` (fallback)
- `localStorage.auth_token` (fallback)
- `document.cookie.token` (for middleware)

👉 See: [Comprehensive Audit - Section 4](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md#-4-token-storage-strategy)

---

### "Bagaimana flow login & token storage?"
**Answer:** See visual diagram:

👉 [Visual Guide - Section 3](./TOKEN_SYSTEM_VISUAL_GUIDE.md#3-login--token-storage-flow)

---

## 🗂️ File Locations in Codebase

### Core Implementation Files

```
src/
├── services/
│   ├── tokenService.js          ⭐ Token management & refresh
│   ├── authV2Service.js         ⭐ Firebase auth API
│   └── apiService.js            → Uses token for API calls
│
├── hooks/
│   └── useTokenRefresh.ts       ⭐ Auto-refresh hook (5 min interval)
│
├── contexts/
│   ├── AuthContext.tsx          ⭐ Auth state + refresh integration
│   └── TokenContext.tsx         → Token balance (different concept)
│
├── config/
│   ├── auth-v2-config.js        ⭐ Timing configuration
│   └── api.js                   → API endpoints
│
└── utils/
    ├── token-validation.ts      → Token validation helpers
    ├── token-storage.ts         → Storage utilities
    └── token-balance.ts         → Assessment token balance
```

### Test Files

```
src/
├── services/
│   ├── tokenService.test.ts     → Token service tests
│   └── authV2Service.test.ts    → Auth V2 tests
│
└── utils/
    └── __tests__/
        └── storage-transaction.test.ts → Storage tests
```

### Documentation Files

```
docs/
├── TOKEN_SYSTEM_QUICK_SUMMARY.md           ⭐ Start here!
├── TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md     ⭐ Full details
├── TOKEN_SYSTEM_VISUAL_GUIDE.md            ⭐ Diagrams
├── TOKEN_SYSTEM_GAP_ANALYSIS.md            ⭐ Gap analysis
├── TOKEN_SYSTEM_DOCUMENTATION_INDEX.md     ⭐ This file
│
└── (Related docs)
    ├── INVALID_TOKEN_ERROR_FLOW.md
    └── PRODUCTION_FIX_INVALID_TOKEN.md
```

---

## 🔍 Common Use Cases

### 1. "Saya baru join tim, mau understand token system"

**Reading Order:**
1. [Quick Summary](./TOKEN_SYSTEM_QUICK_SUMMARY.md) - Get overview
2. [Visual Guide](./TOKEN_SYSTEM_VISUAL_GUIDE.md) - See diagrams
3. [Comprehensive Audit](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md) - Deep dive

**Key Files to Review:**
- `src/services/tokenService.js`
- `src/hooks/useTokenRefresh.ts`
- `src/contexts/AuthContext.tsx`

---

### 2. "User complain token expired saat pakai aplikasi"

**Debugging Steps:**
1. Check [Comprehensive Audit - Section 9](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md#-9-kesimpulan--rekomendasi)
2. Review monitoring metrics
3. Check refresh logs in browser console
4. Verify token refresh is running (look for `[useTokenRefresh]` logs)

**Related Files:**
- `src/hooks/useTokenRefresh.ts` - Check if timer running
- `src/services/tokenService.js` - Check refresh logic

---

### 3. "Mau implement feature baru yang butuh token"

**Implementation Guide:**
1. Read [Comprehensive Audit - Section 3](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md#-3-token-flow-architecture)
2. See [Visual Guide - Section 5](./TOKEN_SYSTEM_VISUAL_GUIDE.md#5-api-request-with-token)
3. Use `tokenService.getIdToken()` untuk get token
4. Add to Authorization header: `Bearer ${token}`

**Example:**
```typescript
import tokenService from '@/services/tokenService';

const token = tokenService.getIdToken();
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 4. "Stakeholder tanya why not 30 minutes refresh?"

**Answer Template:**
1. Show [Gap Analysis - Executive Summary](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-executive-summary)
2. Explain with [Visual Guide - Timeline](./TOKEN_SYSTEM_VISUAL_GUIDE.md#2-token-lifecycle-timeline)
3. Present [Gap Analysis - Decision Matrix](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-7-decision-matrix)
4. Use [Stakeholder Communication Template](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-9-stakeholder-communication-template)

---

### 5. "Mau change configuration refresh interval"

**Steps:**
1. Read [Gap Analysis - Option 2](./TOKEN_SYSTEM_GAP_ANALYSIS.md#--option-2-change-to-30-minute-refresh)
2. Set environment variable
3. Follow [Testing Checklist](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-5-testing-checklist-if-changing-to-30-min)
4. Monitor metrics as per [Monitoring Plan](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-6-monitoring--metrics)

**Command:**
```bash
# .env.local
NEXT_PUBLIC_AUTH_V2_REFRESH_BEFORE_EXPIRY=1800  # for 30 min
# or
NEXT_PUBLIC_AUTH_V2_REFRESH_BEFORE_EXPIRY=600   # for 50 min (current)
```

---

## 📊 Key Metrics to Monitor

```javascript
// Add to monitoring dashboard

Token Health:
✓ refresh_success_rate        (target: >99.9%)
✓ token_expiry_incidents       (target: 0)
✓ refresh_latency_p95          (target: <500ms)

User Experience:
✓ unexpected_logouts           (target: 0)
✓ session_interruptions        (target: 0)

System Performance:
✓ refresh_api_calls_per_hour
✓ concurrent_refresh_requests
✓ memory_leak_detection
```

👉 See: [Gap Analysis - Section 6](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-6-monitoring--metrics)

---

## 🧪 Testing

### Run Tests
```bash
# Token service tests
npm test tokenService

# Auth V2 tests
npm test authV2Service

# Storage transaction tests
npm test storage-transaction

# Full test suite
npm test
```

### Manual Testing
```bash
# Check token status in browser console
tokenService.getTokenStatus()

# Force refresh token
tokenService.refreshAuthToken()

# Check token expiry
tokenService.isTokenExpired()
```

---

## 🆘 Troubleshooting

### Token keeps expiring
**Solution:** Check if refresh hook is running
```javascript
// Look for these logs in console:
[useTokenRefresh] Starting token refresh timer
[useTokenRefresh] Token still fresh (X min until refresh needed)
```

### Refresh not working
**Solution:** Check configuration
```javascript
// Verify in browser console:
AUTH_V2_CONFIG.refreshBeforeExpiry // Should be 600 or 1800
```

### Cross-tab issues
**Solution:** Check storage event listener
```javascript
// Should see logs:
🔄 AuthContext: Storage change detected from another tab
```

### Race condition
**Solution:** Check for concurrent refresh prevention
```javascript
// Should see logs:
Auth V2: Refresh already in progress, reusing existing promise
```

---

## 📞 Support & Contact

### For Technical Issues:
- Check this documentation first
- Review browser console logs
- Check `src/services/tokenService.js` implementation

### For Business/Requirement Questions:
- See [Gap Analysis - Stakeholder Communication](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-9-stakeholder-communication-template)
- Review [Decision Matrix](./TOKEN_SYSTEM_GAP_ANALYSIS.md#-7-decision-matrix)

### For Architecture Discussions:
- Review [Comprehensive Audit](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md)
- See [Visual Guide](./TOKEN_SYSTEM_VISUAL_GUIDE.md) for diagrams

---

## 📝 Document Maintenance

### Update Frequency:
- **This Index:** When new docs are added
- **Quick Summary:** When major changes occur
- **Comprehensive Audit:** Quarterly review
- **Gap Analysis:** When requirements change
- **Visual Guide:** When architecture changes

### Version History:
| Date | Version | Changes |
|------|---------|---------|
| 2025-01-09 | 1.0 | Initial documentation suite |

### Contributors:
- Frontend Team
- AI Assistant (Audit & Documentation)

---

## 🔗 Related Documentation

### Project-wide:
- `.github/copilot-instructions.md` - Project overview
- `README.md` - Project setup

### Auth-related:
- `docs/INVALID_TOKEN_ERROR_FLOW.md` - Error handling
- `docs/PRODUCTION_FIX_INVALID_TOKEN.md` - Production fixes
- `docs/PASSWORD_FIX_SUMMARY.md` - Password issues

### Other Systems:
- `docs/FLAG_STATE_*.md` - Flagged questions system
- `docs/AUDIT_*.md` - Various audits

---

## ✅ Quick Checklist

Before deploying token-related changes:

- [ ] Read relevant documentation
- [ ] Test in development
- [ ] Check browser console for errors
- [ ] Verify refresh hook is running
- [ ] Test cross-tab synchronization
- [ ] Monitor for memory leaks
- [ ] Check race condition prevention
- [ ] Verify token storage in multiple locations
- [ ] Test error handling (network failure, 401)
- [ ] Update monitoring dashboard
- [ ] Document changes
- [ ] Notify team

---

**Last Updated:** January 9, 2025  
**Documentation Suite Version:** 1.0  
**Maintained By:** Frontend Team

---

## 📚 Appendix: Glossary

| Term | Definition |
|------|------------|
| **ID Token** | Short-lived Firebase JWT token (1 hour), used for authentication |
| **Refresh Token** | Long-lived token used to obtain new ID tokens |
| **Token Expiry** | Time when token becomes invalid (60 minutes) |
| **Refresh Trigger** | Time when auto-refresh starts (50 minutes) |
| **Race Condition** | Multiple concurrent refresh requests |
| **Cross-Tab Sync** | Synchronizing token state across browser tabs |
| **Token Age** | Time elapsed since token was issued |
| **Safety Buffer** | Time before expiry when refresh starts (10 min) |
| **Multi-Key Storage** | Storing token in multiple localStorage keys |
| **Auth V1** | Legacy authentication system (JWT) |
| **Auth V2** | Firebase-based authentication system |

---

**🎯 TL;DR:** 
- Start with [Quick Summary](./TOKEN_SYSTEM_QUICK_SUMMARY.md)
- For visuals: [Visual Guide](./TOKEN_SYSTEM_VISUAL_GUIDE.md)
- For deep dive: [Comprehensive Audit](./TOKEN_SYSTEM_COMPREHENSIVE_AUDIT.md)
- For decisions: [Gap Analysis](./TOKEN_SYSTEM_GAP_ANALYSIS.md)
