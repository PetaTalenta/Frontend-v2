# 🗑️ Panduan Penggunaan Script Delete untuk Akun rizqy2458@gmail.com

Panduan ini menjelaskan cara menggunakan script delete-all-results dengan akun yang telah diberikan.

## 🔐 Informasi Akun

- **Email**: `rizqy2458@gmail.com`
- **Password**: `kiana1234`

## 🚀 Cara Penggunaan (Langkah demi Langkah)

### Langkah 1: Login dan Dapatkan Token

1. **Buka aplikasi PetaTalenta** di browser
2. **Login** dengan kredensial:
   - Email: `rizqy2458@gmail.com`
   - Password: `kiana1234`
3. **Setelah login berhasil**, buka Developer Console (tekan **F12**)
4. **Pilih tab "Console"**
5. **Jalankan command berikut**:
   ```javascript
   localStorage.getItem("token")
   ```
6. **Copy token** yang muncul (tanpa tanda kutip)

### Langkah 2: Pilih Metode Penggunaan

#### 🎯 Metode 1: Quick Delete (Recommended)
Script khusus untuk akun rizqy2458@gmail.com dengan validasi otomatis:

```bash
# Windows Command Prompt
scripts\run-quick-delete-rizqy.bat "PASTE_TOKEN_HERE"

# Atau jalankan interaktif (akan meminta token)
scripts\run-quick-delete-rizqy.bat

# Direct Node.js
node scripts/quick-delete-rizqy.js "PASTE_TOKEN_HERE"
```

#### 🔧 Metode 2: Script Umum
Menggunakan script delete umum:

```bash
# Windows Command Prompt
scripts\run-delete-all-results.bat "PASTE_TOKEN_HERE"

# Windows PowerShell
.\scripts\run-delete-all-results.ps1 "PASTE_TOKEN_HERE"

# Direct Node.js
node scripts/delete-all-results.js "PASTE_TOKEN_HERE"
```

### Langkah 3: Test Script (Opsional tapi Disarankan)

Sebelum menghapus data, test script terlebih dahulu:

```bash
node scripts/test-delete-all-results.js "PASTE_TOKEN_HERE"
```

## 📊 Contoh Penggunaan Lengkap

### Skenario 1: Menggunakan Quick Delete Script

```cmd
C:\PetaTalenta-FrontEnd> scripts\run-quick-delete-rizqy.bat

=====================================================
Quick Delete untuk Akun rizqy2458@gmail.com
=====================================================

Untuk menggunakan script ini, Anda perlu token authentication.

CARA MENDAPATKAN TOKEN:
1. Buka aplikasi PetaTalenta di browser
2. Login dengan:
   Email: rizqy2458@gmail.com
   Password: kiana1234
3. Buka Developer Console (F12)
4. Pilih tab "Console"
5. Jalankan: localStorage.getItem("token")
6. Copy token yang muncul

Apakah Anda sudah memiliki token? (y/N): y

Menjalankan script interaktif...

🗑️  Quick Delete untuk Akun rizqy2458@gmail.com
================================================

Masukkan token Anda: [PASTE_TOKEN_HERE]

✅ Token valid untuk akun rizqy2458@gmail.com
📧 User: rizqy2458@gmail.com
⏰ Expires: 2024-01-20T10:30:00.000Z

📋 Mengambil daftar hasil assessment...
📊 Ditemukan 3 hasil assessment:
   1. AI-Driven Talent Mapping (15/01/2024)
   2. RIASEC Assessment (14/01/2024)
   3. Big Five Assessment (13/01/2024)

⚠️  Anda akan menghapus 3 hasil assessment. Lanjutkan? (y/N): y

🗑️  Memulai penghapusan...
[1/3] Menghapus 550e8400-e29b-41d4-a716-446655440001...
[1/3] ✅ Berhasil dihapus
[2/3] Menghapus 550e8400-e29b-41d4-a716-446655440002...
[2/3] ✅ Berhasil dihapus
[3/3] Menghapus 550e8400-e29b-41d4-a716-446655440003...
[3/3] ✅ Berhasil dihapus

📊 Ringkasan penghapusan:
   ✅ Berhasil: 3
   ❌ Gagal: 0

🎉 Semua hasil assessment berhasil dihapus!
```

### Skenario 2: Menggunakan Token sebagai Argument

```cmd
C:\PetaTalenta-FrontEnd> scripts\run-quick-delete-rizqy.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

=====================================================
Quick Delete untuk Akun rizqy2458@gmail.com
=====================================================

Menggunakan token dari argument...

✅ Token valid untuk akun rizqy2458@gmail.com
📧 User: rizqy2458@gmail.com
⏰ Expires: 2024-01-20T10:30:00.000Z

📋 Mengambil daftar hasil assessment...
✅ Tidak ada hasil assessment yang perlu dihapus

Script selesai.
```

## 🧪 Testing Script

### Test Functionality
```bash
C:\PetaTalenta-FrontEnd> node scripts/test-delete-all-results.js "YOUR_TOKEN"

🧪 Delete All Results - Test Suite
===================================

🧪 Testing token validation...
   ✅ Test 1: Invalid token correctly rejected
   ✅ Test 2: Invalid token correctly rejected
   📊 Token validation tests: 6/6 passed

🌐 Testing API connectivity...
   ✅ API connectivity successful
   📊 Found 2 assessment results

🗑️  Testing delete functionality (dry run)...
   🎯 Testing delete on: 550e8400-e29b-41d4-a716-446655440001
   ⚠️  Skipping actual delete to preserve data
   ✅ Delete function structure validated

📊 Test Report
==============
Total Tests: 5
Passed: 5
Failed: 0
Success Rate: 100.0%

🎉 All tests passed! Script is ready to use.
```

## 🔧 Fitur Khusus Quick Delete Script

### ✅ Validasi Akun Otomatis
- Memastikan token adalah untuk akun `rizqy2458@gmail.com`
- Menolak token dari akun lain
- Validasi expiry token

### ✅ User Experience yang Lebih Baik
- Instruksi yang jelas untuk akun spesifik
- Input interaktif jika token tidak diberikan
- Progress tracking real-time

### ✅ Keamanan Tambahan
- Validasi email dalam token JWT
- Pengecekan expiry token
- Konfirmasi eksplisit sebelum penghapusan

## 🛠️ Troubleshooting

### Token Tidak Valid untuk Akun
```
❌ Token untuk user other@example.com, diharapkan rizqy2458@gmail.com
```
**Solusi**: Pastikan Anda login dengan akun `rizqy2458@gmail.com` sebelum mengambil token

### Token Expired
```
❌ Token sudah expired
```
**Solusi**: Login ulang dan ambil token baru

### Tidak Ada Hasil Assessment
```
✅ Tidak ada hasil assessment yang perlu dihapus
```
**Info**: Akun tidak memiliki hasil assessment atau sudah dihapus sebelumnya

### API Connection Error
```
💥 Script gagal: Gagal mengambil daftar hasil: Network error
```
**Solusi**: 
- Pastikan koneksi internet stabil
- Pastikan development server berjalan (jika menggunakan proxy)
- Coba lagi setelah beberapa saat

## ⚠️ PERINGATAN PENTING

1. **Data Permanen**: Script akan menghapus SEMUA hasil assessment secara permanen
2. **Tidak Dapat Dikembalikan**: Data yang sudah dihapus tidak dapat dikembalikan
3. **Akun Spesifik**: Quick delete script hanya bekerja untuk akun `rizqy2458@gmail.com`
4. **Backup Recommended**: Backup data penting sebelum penghapusan

## 📁 File yang Tersedia

### Script Utama
- `scripts/quick-delete-rizqy.js` - Script khusus untuk akun rizqy2458@gmail.com
- `scripts/run-quick-delete-rizqy.bat` - Windows wrapper untuk quick delete
- `scripts/delete-all-results.js` - Script umum untuk semua akun

### Testing & Demo
- `scripts/test-delete-all-results.js` - Test suite
- `scripts/demo-delete-usage.js` - Demo penggunaan
- `scripts/list-scripts.js` - Daftar semua script

### Dokumentasi
- `scripts/DELETE_ALL_RESULTS_GUIDE.md` - Panduan lengkap
- `DELETE_ALL_RESULTS_SUMMARY.md` - Ringkasan semua script
- `PENGGUNAAN_SCRIPT_RIZQY.md` - Panduan ini

## 🎯 Rekomendasi Penggunaan

1. **Mulai dengan Test**: Jalankan test script terlebih dahulu
2. **Gunakan Quick Delete**: Lebih aman karena ada validasi akun
3. **Backup Data**: Jika ada data penting yang mungkin diperlukan
4. **Monitor Progress**: Perhatikan output untuk memastikan tidak ada error
5. **Verify Results**: Cek aplikasi untuk memastikan data sudah terhapus

## 📞 Support

Jika mengalami masalah:
1. Periksa dokumentasi troubleshooting di atas
2. Jalankan test suite untuk diagnosa: `node scripts/test-delete-all-results.js "TOKEN"`
3. Cek log error yang ditampilkan
4. Pastikan menggunakan akun dan token yang benar

Script ini dirancang khusus untuk memberikan pengalaman yang aman dan mudah dalam menghapus semua hasil assessment untuk akun `rizqy2458@gmail.com`.
