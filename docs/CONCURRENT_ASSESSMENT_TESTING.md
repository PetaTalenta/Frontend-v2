# Concurrent Assessment Testing Guide

Panduan lengkap untuk menjalankan testing assessment secara bersamaan untuk memverifikasi sistem pengurangan token dan stabilitas backend.

## 📋 Overview

Testing ini dirancang untuk:
1. **Memverifikasi sistem pengurangan token** - Memastikan hanya 1 token yang dikurangi per assessment
2. **Menguji stabilitas backend** - Memastikan sistem dapat menangani multiple request bersamaan
3. **Mendeteksi race conditions** - Mengidentifikasi masalah konkurensi dalam token management
4. **Validasi WebSocket** - Memastikan notifikasi real-time bekerja dengan benar

## 🛠️ Setup

### Prerequisites
```bash
# Pastikan dependencies tersedia
npm install socket.io-client axios

# Pastikan development server berjalan
npm run dev

# (Optional) Jalankan mock WebSocket server untuk testing lokal
npm run start:websocket
```

### Environment Variables
```bash
# Optional: Enable cleanup of test users after testing
export CLEANUP_TEST_USERS=true

# Optional: Set custom timeout for assessments
export ASSESSMENT_TIMEOUT=300000
```

## 🧪 Testing Scripts

### 1. Quick Token Test (`quick-token-test.js`)
**Tujuan**: Test cepat untuk memverifikasi pengurangan 1 token per assessment

```bash
node scripts/quick-token-test.js
```

**Konfigurasi**:
```javascript
// Update credentials di script
const CONFIG = {
  testUser: {
    email: 'your-test-email@example.com',
    password: 'YourTestPassword123!'
  }
};
```

**Output**:
```
🧪 Quick Token Deduction Test
================================
[+0.50s] 🔐 Logging in...
[+1.20s] ✅ Login successful
[+1.25s] 💰 Initial token balance: 10
[+2.10s] 📝 Assessment submitted with jobId: job_abc123
[+2.15s] 💰 Token balance after submission: 9
[+2.15s] 🔍 Token deduction: 1
✅ SUCCESS: Token deduction is correct (1 token)
```

### 2. Concurrent Assessment Test (`concurrent-assessment-test.js`)
**Tujuan**: Test multiple assessment bersamaan dengan monitoring WebSocket

```bash
node scripts/concurrent-assessment-test.js
```

**Fitur**:
- Menjalankan 3 assessment bersamaan (configurable)
- Monitoring real-time via WebSocket
- Verifikasi token deduction yang akurat
- Laporan detail dengan timing

**Konfigurasi**:
```javascript
const TEST_CONFIG = {
  concurrentAssessments: 3, // Jumlah assessment bersamaan
  testTimeout: 300000, // 5 menit timeout
  testUser: {
    email: 'test.concurrent@example.com',
    password: 'TestPassword123!'
  }
};
```

### 3. Setup Test Users (`setup-test-users.js`)
**Tujuan**: Membuat multiple test users untuk testing

```bash
node scripts/setup-test-users.js
```

**Output**: Membuat file `test-data/test-credentials.json` dengan user credentials

### 4. Run Concurrent Tests (`run-concurrent-tests.js`)
**Tujuan**: Menjalankan multiple instance test secara bersamaan

```bash
node scripts/run-concurrent-tests.js
```

## 📊 Test Scenarios

### Scenario 1: Basic Token Verification
```bash
# 1. Setup test user
node scripts/setup-test-users.js

# 2. Run quick test
node scripts/quick-token-test.js
```

### Scenario 2: Concurrent Load Testing
```bash
# 1. Setup multiple test users
node scripts/setup-test-users.js

# 2. Update credentials in concurrent-assessment-test.js
# 3. Run concurrent test
node scripts/concurrent-assessment-test.js
```

### Scenario 3: High Load Stress Testing
```bash
# 1. Setup test users
node scripts/setup-test-users.js

# 2. Run multiple test instances
node scripts/run-concurrent-tests.js
```

## 🔍 What to Look For

### ✅ Expected Behavior
1. **Token Deduction**: Exactly 1 token deducted per successful assessment
2. **No Race Conditions**: Token balance consistent across concurrent requests
3. **WebSocket Notifications**: Real-time updates for all assessments
4. **Error Handling**: Graceful handling of failures without token loss

### ❌ Potential Issues
1. **Incorrect Token Deduction**: More or less than 1 token deducted
2. **Race Conditions**: Inconsistent token balance with concurrent requests
3. **WebSocket Failures**: Missing or delayed notifications
4. **Backend Errors**: 500 errors or timeouts under load

## 📈 Interpreting Results

### Token Verification Report
```json
{
  "tokenVerification": {
    "initialBalance": 10,
    "finalBalance": 7,
    "expectedDeduction": 3,
    "actualDeduction": 3,
    "deductionCorrect": true
  }
}
```

### Assessment Results
```json
{
  "testSummary": {
    "totalDuration": "45.2s",
    "concurrentAssessments": 3,
    "successfulAssessments": 3,
    "failedAssessments": 0,
    "successRate": "100.0%"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
❌ Authentication failed: Invalid credentials
```
**Solution**: Update test user credentials in script

#### 2. Insufficient Tokens
```bash
❌ Insufficient tokens. Required: 3, Available: 2
```
**Solution**: Use account with more tokens or reduce concurrent assessments

#### 3. WebSocket Connection Errors
```bash
❌ WebSocket connection error: Connection timeout
```
**Solution**: Check if backend WebSocket server is running

#### 4. Backend API Errors
```bash
❌ Assessment submission failed: 500 Internal Server Error
```
**Solution**: Check backend logs and API health

### Debug Mode
Enable verbose logging:
```javascript
// Add to script
console.log('DEBUG: Token before submission:', tokenBefore);
console.log('DEBUG: Token after submission:', tokenAfter);
```

## 📁 Output Files

### Test Reports
- `test-reports/concurrent-assessment-{timestamp}.json` - Detailed test results
- `test-data/test-users-{timestamp}.json` - Created test users
- `test-data/test-credentials.json` - User credentials for reuse

### Log Files
- `test-instance-{number}.log` - Individual test instance logs

## 🔧 Customization

### Modify Test Parameters
```javascript
// In concurrent-assessment-test.js
const TEST_CONFIG = {
  concurrentAssessments: 5, // Increase load
  testTimeout: 600000, // 10 minutes
  assessmentTimeout: 180000, // 3 minutes per assessment
};
```

### Add Custom Assertions
```javascript
// Custom token verification
if (actualDeduction !== expectedDeduction) {
  throw new Error(`Token deduction mismatch: expected ${expectedDeduction}, got ${actualDeduction}`);
}
```

## 📊 NPM Scripts

Untuk kemudahan, gunakan npm scripts yang telah disediakan:

```bash
# Quick token test
npm run test:token:quick

# Concurrent assessment test
npm run test:token:concurrent

# Setup test users
npm run test:setup-users

# High load test
npm run test:high-load

# Generate test summary
npm run test:summary
```

## 📈 Test Summary

Setelah menjalankan beberapa test, generate summary dengan:

```bash
npm run test:summary
```

Output akan menampilkan:
- Overall test statistics
- Assessment success rates
- Token verification accuracy
- Performance metrics
- Error analysis

## 📞 Support

Jika mengalami masalah:
1. Check backend logs untuk error details
2. Verify API endpoints are accessible
3. Ensure WebSocket server is running
4. Check test user credentials are valid
5. Review network connectivity

## 🎯 Best Practices

1. **Start Small**: Begin with quick-token-test.js
2. **Monitor Resources**: Watch CPU/memory during high load tests
3. **Clean Up**: Remove test users after testing (set CLEANUP_TEST_USERS=true)
4. **Document Issues**: Save error logs for debugging
5. **Regular Testing**: Run tests after backend changes
6. **Use Summary**: Generate test summary to track progress over time
