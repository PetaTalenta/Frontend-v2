# Assessment Testing Scripts

Kumpulan script untuk menguji sistem assessment secara bersamaan dan memverifikasi sistem pengurangan token.

## 🎯 Tujuan Testing

1. **Verifikasi Token Deduction**: Memastikan hanya 1 token yang dikurangi per assessment
2. **Test Concurrent Requests**: Memastikan backend dapat menangani multiple request bersamaan
3. **Deteksi Race Conditions**: Mengidentifikasi masalah konkurensi dalam token management
4. **Validasi WebSocket**: Memastikan notifikasi real-time bekerja dengan benar

## 📁 File Scripts

### Core Testing Scripts
- `quick-token-test.js` - Test cepat untuk verifikasi token deduction
- `concurrent-assessment-test.js` - Test multiple assessment bersamaan
- `setup-test-users.js` - Membuat test users untuk testing
- `run-concurrent-tests.js` - Menjalankan multiple test instances

### Data Management Scripts
- `delete-all-results.js` - Menghapus semua hasil assessment user
- `run-delete-all-results.bat` - Wrapper Windows untuk delete script
- `run-delete-all-results.ps1` - Wrapper PowerShell untuk delete script
- `run-delete-all-results.sh` - Wrapper Linux/Mac untuk delete script

### Utility Scripts
- `run-assessment-tests.bat` - Menu interaktif untuk Windows
- `run-assessment-tests.ps1` - Menu interaktif PowerShell
- `run-assessment-tests.sh` - Menu interaktif untuk Linux/Mac

### Debug Scripts
- `debug-token-balance.js` - Debug token balance issues
- `debug-assessment-flow.js` - Debug assessment workflow

## 🚀 Quick Start

### Windows (Command Prompt)
```cmd
scripts\run-assessment-tests.bat
```

### Windows (PowerShell)
```powershell
.\scripts\run-assessment-tests.ps1
```

### Linux/Mac
```bash
chmod +x scripts/run-assessment-tests.sh
./scripts/run-assessment-tests.sh
```

## 🗑️ Data Management

### Delete All Assessment Results
Menghapus semua hasil assessment untuk user yang sedang login:

#### Windows (Command Prompt)
```cmd
scripts\run-delete-all-results.bat "YOUR_TOKEN_HERE"
```

#### Windows (PowerShell)
```powershell
.\scripts\run-delete-all-results.ps1 "YOUR_TOKEN_HERE"
```

#### Linux/Mac
```bash
chmod +x scripts/run-delete-all-results.sh
./scripts/run-delete-all-results.sh "YOUR_TOKEN_HERE"
```

#### Direct Node.js
```bash
node scripts/delete-all-results.js "YOUR_TOKEN_HERE"
```

**⚠️ PERINGATAN**: Script ini akan menghapus SEMUA hasil assessment secara permanen!

Untuk panduan lengkap, lihat: `scripts/DELETE_ALL_RESULTS_GUIDE.md`

## 📋 Manual Usage

### 1. Quick Token Test
Test sederhana untuk memverifikasi pengurangan 1 token per assessment:

```bash
node scripts/quick-token-test.js
```

**Sebelum menjalankan**, update credentials di script:
```javascript
const CONFIG = {
  testUser: {
    email: 'rizqy2458@gmail.com',
    password: 'kiana1234'
  }
};
```

### 2. Setup Test Users
Membuat multiple test users:

```bash
node scripts/setup-test-users.js
```

Output: File `test-data/test-credentials.json` dengan user credentials.

### 3. Concurrent Assessment Test
Test multiple assessment bersamaan:

```bash
node scripts/concurrent-assessment-test.js
```

**Konfigurasi**:
```javascript
const TEST_CONFIG = {
  concurrentAssessments: 3, // Jumlah assessment bersamaan
  testUser: {
    email: 'test.concurrent@example.com',
    password: 'TestPassword123!'
  }
};
```

### 4. High Load Test
Menjalankan multiple test instances:

```bash
node scripts/run-concurrent-tests.js
```

## 🔧 Konfigurasi

### Environment Variables
```bash
# Optional: Enable cleanup of test users
export CLEANUP_TEST_USERS=true

# Optional: Custom timeout
export ASSESSMENT_TIMEOUT=300000
```

### Test User Credentials
Update credentials di setiap script sebelum menjalankan:

```javascript
// Di quick-token-test.js
const CONFIG = {
  testUser: {
    email: 'test.token@example.com',
    password: 'TestPassword123!'
  }
};

// Di concurrent-assessment-test.js
const TEST_CONFIG = {
  testUser: {
    email: 'test.concurrent@example.com', 
    password: 'TestPassword123!'
  }
};
```

## 📊 Output dan Reports

### Console Output
```
🧪 Quick Token Deduction Test
================================
[+0.50s] 🔐 Logging in...
[+1.20s] ✅ Login successful
[+1.25s] 💰 Initial token balance: 10
[+2.10s] 📝 Assessment submitted
[+2.15s] 💰 Token balance after submission: 9
[+2.15s] 🔍 Token deduction: 1
✅ SUCCESS: Token deduction is correct (1 token)
```

### Generated Files
- `test-reports/concurrent-assessment-{timestamp}.json` - Detailed test results
- `test-data/test-users-{timestamp}.json` - Created test users
- `test-data/test-credentials.json` - User credentials for reuse
- `test-instance-{number}.log` - Individual test instance logs

### Sample Report
```json
{
  "testSummary": {
    "totalDuration": "45.2s",
    "concurrentAssessments": 3,
    "successfulAssessments": 3,
    "failedAssessments": 0,
    "successRate": "100.0%"
  },
  "tokenVerification": {
    "initialBalance": 10,
    "finalBalance": 7,
    "expectedDeduction": 3,
    "actualDeduction": 3,
    "deductionCorrect": true
  }
}
```

## 🔍 What to Look For

### ✅ Expected Results
- **Token Deduction**: Exactly 1 token per successful assessment
- **No Race Conditions**: Consistent token balance across concurrent requests
- **WebSocket Notifications**: Real-time updates for all assessments
- **Error Handling**: Graceful failure handling without token loss

### ❌ Potential Issues
- **Incorrect Token Deduction**: More or less than 1 token deducted
- **Race Conditions**: Inconsistent token balance
- **WebSocket Failures**: Missing or delayed notifications
- **Backend Errors**: 500 errors or timeouts under load

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors
```
❌ Authentication failed: Invalid credentials
```
**Solution**: Update test user credentials in script

#### Insufficient Tokens
```
❌ Insufficient tokens. Required: 3, Available: 2
```
**Solution**: Use account with more tokens or reduce concurrent assessments

#### WebSocket Connection Errors
```
❌ WebSocket connection error: Connection timeout
```
**Solution**: Check if backend WebSocket server is running

#### Backend API Errors
```
❌ Assessment submission failed: 500 Internal Server Error
```
**Solution**: Check backend logs and API health

### Debug Tips
1. Check if development server is running (`npm run dev`)
2. Verify API endpoints are accessible
3. Ensure WebSocket server is running
4. Check test user credentials are valid
5. Review network connectivity

## 📝 Test Scenarios

### Scenario 1: Basic Verification
```bash
# 1. Quick test
node scripts/quick-token-test.js
```

### Scenario 2: Concurrent Load
```bash
# 1. Setup users
node scripts/setup-test-users.js

# 2. Update credentials in concurrent-assessment-test.js
# 3. Run concurrent test
node scripts/concurrent-assessment-test.js
```

### Scenario 3: Stress Testing
```bash
# 1. Setup users
node scripts/setup-test-users.js

# 2. Run multiple instances
node scripts/run-concurrent-tests.js
```

## 🧹 Cleanup

### Manual Cleanup
```bash
# Remove test reports
rm -rf test-reports/

# Remove test data
rm -rf test-data/

# Remove log files
rm -f test-instance-*.log
```

### Automatic Cleanup
Set environment variable:
```bash
export CLEANUP_TEST_USERS=true
```

## 📞 Support

Jika mengalami masalah:
1. Check console output untuk error details
2. Review generated log files
3. Verify backend API is running
4. Check WebSocket server status
5. Ensure test user credentials are valid

## 🎯 Best Practices

1. **Start Small**: Begin with `quick-token-test.js`
2. **Monitor Resources**: Watch CPU/memory during high load tests
3. **Clean Up**: Remove test users after testing
4. **Document Issues**: Save error logs for debugging
5. **Regular Testing**: Run tests after backend changes
