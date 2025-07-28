# 🧪 Concurrent Assessment Testing Scripts - Summary

Saya telah membuat suite lengkap script testing untuk menguji beberapa assessment secara bersamaan dan memverifikasi sistem pengurangan token. Berikut adalah ringkasan lengkap dari semua yang telah dibuat:

## 📁 File yang Dibuat

### Core Testing Scripts
1. **`scripts/quick-token-test.js`** - Test cepat untuk verifikasi pengurangan 1 token per assessment
2. **`scripts/concurrent-assessment-test.js`** - Test multiple assessment bersamaan dengan WebSocket monitoring
3. **`scripts/setup-test-users.js`** - Membuat multiple test users untuk testing
4. **`scripts/run-concurrent-tests.js`** - Menjalankan multiple test instances secara bersamaan
5. **`scripts/test-summary.js`** - Generate comprehensive summary dari test reports

### Data Management Scripts
6. **`scripts/delete-all-results.js`** - Script utama untuk menghapus semua hasil assessment user
7. **`scripts/test-delete-all-results.js`** - Test suite untuk memverifikasi script delete
8. **`scripts/list-scripts.js`** - Menampilkan daftar semua script yang tersedia

### User Interface Scripts
9. **`scripts/run-assessment-tests.bat`** - Menu interaktif untuk Windows (Command Prompt)
10. **`scripts/run-assessment-tests.ps1`** - Menu interaktif untuk PowerShell
11. **`scripts/run-assessment-tests.sh`** - Menu interaktif untuk Linux/Mac
12. **`scripts/run-delete-all-results.bat`** - Windows wrapper untuk delete script
13. **`scripts/run-delete-all-results.ps1`** - PowerShell wrapper untuk delete script
14. **`scripts/run-delete-all-results.sh`** - Linux/Mac wrapper untuk delete script

### Configuration & Documentation
15. **`scripts/config.example.js`** - Contoh konfigurasi untuk semua scripts
16. **`scripts/README.md`** - Dokumentasi lengkap untuk menggunakan scripts
17. **`scripts/DELETE_ALL_RESULTS_GUIDE.md`** - Panduan lengkap untuk delete script
18. **`docs/CONCURRENT_ASSESSMENT_TESTING.md`** - Panduan komprehensif testing

## 🎯 Tujuan Testing

Scripts ini dirancang untuk memverifikasi:

### ✅ Token Management
- **Pengurangan Token yang Benar**: Memastikan hanya 1 token dikurangi per assessment
- **No Race Conditions**: Token balance konsisten saat multiple request bersamaan
- **Error Handling**: Token tidak hilang saat terjadi error

### ✅ System Stability
- **Concurrent Request Handling**: Backend dapat menangani multiple request bersamaan
- **WebSocket Reliability**: Notifikasi real-time bekerja dengan benar
- **Performance Under Load**: System tetap stabil saat high load

### ✅ Data Integrity
- **Assessment Processing**: Semua assessment diproses dengan benar
- **Result Consistency**: Hasil assessment konsisten dan akurat
- **Error Recovery**: System recovery dengan baik dari error

## 🚀 Cara Menggunakan

### Quick Start (Recommended)
```bash
# Windows Command Prompt
scripts\run-assessment-tests.bat

# Windows PowerShell
.\scripts\run-assessment-tests.ps1

# Linux/Mac
./scripts/run-assessment-tests.sh
```

### Manual Commands
```bash
# Quick test (single assessment)
npm run test:token:quick

# Setup test users
npm run test:setup-users

# Concurrent test (multiple assessments)
npm run test:token:concurrent

# High load test
npm run test:high-load

# Generate summary
npm run test:summary
```

### Data Management Commands
```bash
# Delete all assessment results (Windows CMD)
scripts\run-delete-all-results.bat "YOUR_TOKEN_HERE"

# Delete all assessment results (PowerShell)
.\scripts\run-delete-all-results.ps1 "YOUR_TOKEN_HERE"

# Delete all assessment results (Linux/Mac)
./scripts/run-delete-all-results.sh "YOUR_TOKEN_HERE"

# Direct Node.js execution
node scripts/delete-all-results.js "YOUR_TOKEN_HERE"

# Test delete script functionality
node scripts/test-delete-all-results.js "YOUR_TOKEN_HERE"

# List all available scripts
node scripts/list-scripts.js
```

**⚠️ PERINGATAN**: Delete script akan menghapus SEMUA hasil assessment secara permanen!

## 📊 Output dan Reports

### Console Output Real-time
```
🧪 Concurrent Assessment Test
[+1.20s] 🔐 Authentication successful
[+1.25s] 💰 Initial token balance: 10
[+2.10s] 🚀 Starting 3 concurrent assessments...
[+5.30s] ✅ Assessment 1 completed
[+5.45s] ✅ Assessment 2 completed  
[+5.60s] ✅ Assessment 3 completed
[+6.00s] 💰 Final token balance: 7
[+6.00s] 🔍 Token deduction: 3 (Expected: 3)
✅ SUCCESS: Token deduction is correct
```

### Generated Files
- **`test-reports/`** - Detailed JSON reports untuk setiap test run
- **`test-data/`** - Test user credentials dan data
- **`test-instance-*.log`** - Individual test instance logs

### Sample Report Structure
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
  },
  "assessmentResults": [...],
  "errors": []
}
```

## 🔧 Konfigurasi

### Update Test Credentials
Sebelum menjalankan, update credentials di scripts:

```javascript
// Di quick-token-test.js dan concurrent-assessment-test.js
const CONFIG = {
  testUser: {
    email: 'your-test-email@example.com',
    password: 'YourPassword123!'
  }
};
```

### Environment Variables
```bash
# Optional: Enable cleanup
export CLEANUP_TEST_USERS=true

# Optional: Custom timeout
export ASSESSMENT_TIMEOUT=300000
```

## 🧪 Test Scenarios

### Scenario 1: Basic Verification
```bash
npm run test:token:quick
```
- Login dengan test user
- Submit 1 assessment
- Verify 1 token dikurangi

### Scenario 2: Concurrent Load Testing
```bash
npm run test:setup-users
npm run test:token:concurrent
```
- Setup multiple test users
- Submit 3 assessments bersamaan
- Monitor via WebSocket
- Verify token deduction accuracy

### Scenario 3: High Load Stress Testing
```bash
npm run test:high-load
```
- Multiple test instances bersamaan
- Stress test system under load
- Comprehensive error tracking

## 🔍 What to Look For

### ✅ Expected Behavior
1. **Exact Token Deduction**: 1 token per successful assessment
2. **Consistent Balance**: No race conditions in token management
3. **Real-time Notifications**: WebSocket updates untuk semua assessments
4. **Graceful Error Handling**: System recovery tanpa token loss

### ❌ Potential Issues
1. **Incorrect Token Deduction**: Lebih atau kurang dari 1 token
2. **Race Conditions**: Inconsistent token balance
3. **WebSocket Failures**: Missing atau delayed notifications
4. **Backend Errors**: 500 errors atau timeouts

## 📈 Monitoring dan Analysis

### Real-time Monitoring
- Console output dengan timestamps
- Progress tracking untuk setiap assessment
- Error logging dengan details

### Post-test Analysis
```bash
npm run test:summary
```
- Comprehensive analysis dari semua test reports
- Performance metrics dan trends
- Error pattern analysis
- Token accuracy statistics

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### Authentication Errors
```
❌ Authentication failed: Invalid credentials
```
**Solution**: Update test user credentials di script

#### Insufficient Tokens
```
❌ Insufficient tokens. Required: 3, Available: 2
```
**Solution**: Use account dengan lebih banyak tokens

#### WebSocket Connection Errors
```
❌ WebSocket connection error: Connection timeout
```
**Solution**: Check backend WebSocket server status

#### Backend API Errors
```
❌ Assessment submission failed: 500 Internal Server Error
```
**Solution**: Check backend logs dan API health

## 🎯 Best Practices

1. **Start Small**: Mulai dengan `quick-token-test.js`
2. **Monitor Resources**: Watch CPU/memory saat high load tests
3. **Clean Up**: Remove test users setelah testing
4. **Document Issues**: Save error logs untuk debugging
5. **Regular Testing**: Run tests setelah backend changes
6. **Use Summary**: Generate test summary untuk track progress

## 📞 Next Steps

1. **Update Credentials**: Ganti test user credentials dengan akun yang valid
2. **Run Quick Test**: Mulai dengan `npm run test:token:quick`
3. **Setup Test Users**: Jalankan `npm run test:setup-users` untuk concurrent testing
4. **Run Concurrent Test**: Test multiple assessments dengan `npm run test:token:concurrent`
5. **Analyze Results**: Generate summary dengan `npm run test:summary`

## 🎉 Benefits

Scripts ini memberikan:
- **Automated Testing**: No manual testing required
- **Comprehensive Coverage**: Test semua aspek token management
- **Real-time Monitoring**: Live feedback saat testing
- **Detailed Reports**: Comprehensive analysis dan metrics
- **Easy to Use**: Simple commands dan interactive menus
- **Cross-platform**: Works di Windows, Linux, dan Mac

Dengan scripts ini, Anda dapat dengan mudah memverifikasi bahwa sistem pengurangan token bekerja dengan benar dan backend dapat menangani multiple assessment requests secara bersamaan tanpa masalah.
