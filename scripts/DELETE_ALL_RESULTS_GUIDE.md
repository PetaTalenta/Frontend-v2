# Delete All Assessment Results - Panduan Penggunaan

Script ini digunakan untuk menghapus semua hasil assessment yang ada untuk user yang sedang login.

## ⚠️ PERINGATAN

**Script ini akan menghapus SEMUA hasil assessment secara permanen!**
- Data yang sudah dihapus tidak dapat dikembalikan
- Pastikan Anda benar-benar ingin menghapus semua data
- Disarankan untuk backup data terlebih dahulu jika diperlukan

## 📋 Fitur

- ✅ Mengambil semua hasil assessment dari user yang sedang login
- ✅ Menampilkan ringkasan sebelum penghapusan
- ✅ Meminta konfirmasi user sebelum menghapus
- ✅ Menghapus satu per satu dengan rate limiting
- ✅ Menampilkan progress real-time
- ✅ Memberikan ringkasan hasil penghapusan
- ✅ Mendukung proxy dan direct API
- ✅ Error handling yang komprehensif

## 🚀 Cara Penggunaan

### 1. Mendapatkan Token

Sebelum menjalankan script, Anda perlu mendapatkan authentication token:

1. Login ke aplikasi PetaTalenta
2. Buka browser console (tekan F12)
3. Jalankan command berikut:
   ```javascript
   localStorage.getItem("token")
   ```
4. Copy token yang muncul (tanpa tanda kutip)

### 2. Menjalankan Script

#### Windows (Command Prompt)
```bash
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

### 3. Contoh Output

```
🗑️  Delete All Assessment Results
==================================

🔐 Token info:
   User: user@example.com
   Expires: 2024-01-20T10:30:00.000Z

📋 Mengambil daftar semua hasil assessment...
   ✅ Berhasil mengambil 5 hasil assessment

📊 Ringkasan hasil assessment:
   1. 550e8400-e29b-41d4-a716-446655440001 - AI-Driven Talent Mapping (15/01/2024)
   2. 550e8400-e29b-41d4-a716-446655440002 - RIASEC Assessment (14/01/2024)
   3. 550e8400-e29b-41d4-a716-446655440003 - Big Five Assessment (13/01/2024)
   4. 550e8400-e29b-41d4-a716-446655440004 - VIA Strengths (12/01/2024)
   5. 550e8400-e29b-41d4-a716-446655440005 - Career Mapping (11/01/2024)

⚠️  Anda akan menghapus 5 hasil assessment. Lanjutkan? (y/N): y

🗑️  Memulai penghapusan...
[1/5] Menghapus 550e8400-e29b-41d4-a716-446655440001...
[1/5] ✅ Berhasil dihapus
[2/5] Menghapus 550e8400-e29b-41d4-a716-446655440002...
[2/5] ✅ Berhasil dihapus
[3/5] Menghapus 550e8400-e29b-41d4-a716-446655440003...
[3/5] ✅ Berhasil dihapus
[4/5] Menghapus 550e8400-e29b-41d4-a716-446655440004...
[4/5] ✅ Berhasil dihapus
[5/5] Menghapus 550e8400-e29b-41d4-a716-446655440005...
[5/5] ✅ Berhasil dihapus

📊 Ringkasan penghapusan:
   ✅ Berhasil: 5
   ❌ Gagal: 0

🎉 Semua hasil assessment berhasil dihapus!
```

## 🔧 Konfigurasi

Script menggunakan konfigurasi berikut:

```javascript
const API_CONFIG = {
  BASE_URL: 'https://api.chhrone.web.id',
  PROXY_URL: 'http://localhost:3000/api/proxy',
  TIMEOUT: 30000, // 30 seconds
  RATE_LIMIT_DELAY: 1000 // 1 second delay between requests
};
```

## 🛠️ Troubleshooting

### Token Tidak Valid
```
❌ Token tidak valid
```
**Solusi:**
- Pastikan token masih valid (belum expired)
- Login ulang untuk mendapatkan token baru
- Pastikan token di-copy dengan benar (tanpa spasi atau karakter tambahan)

### API Tidak Dapat Diakses
```
💥 Script gagal: Gagal mengambil daftar hasil: Network error
```
**Solusi:**
- Pastikan koneksi internet stabil
- Cek apakah development server berjalan (untuk proxy)
- Coba jalankan ulang setelah beberapa saat

### Rate Limit Exceeded
```
❌ Gagal: Too Many Requests
```
**Solusi:**
- Script sudah menggunakan delay 1 detik antar request
- Jika masih error, tunggu beberapa menit sebelum mencoba lagi
- Rate limit: 5000 requests per 15 minutes

### Sebagian Gagal Dihapus
```
📊 Ringkasan penghapusan:
   ✅ Berhasil: 3
   ❌ Gagal: 2
```
**Solusi:**
- Periksa error details yang ditampilkan
- Jalankan script lagi untuk menghapus yang tersisa
- Pastikan user memiliki permission untuk menghapus hasil tersebut

## 📁 File yang Terkait

- `scripts/delete-all-results.js` - Script utama
- `scripts/run-delete-all-results.bat` - Batch script untuk Windows
- `scripts/run-delete-all-results.sh` - Shell script untuk Linux/Mac
- `scripts/run-delete-all-results.ps1` - PowerShell script untuk Windows
- `scripts/DELETE_ALL_RESULTS_GUIDE.md` - Dokumentasi ini

## 🔒 Keamanan

- Script hanya dapat menghapus hasil assessment milik user yang sedang login
- Menggunakan Bearer token authentication
- Tidak menyimpan atau mencatat token di file log
- Meminta konfirmasi eksplisit sebelum penghapusan

## 📝 API Endpoint

Script menggunakan endpoint berikut:

- `GET /api/archive/results` - Mengambil daftar hasil assessment
- `DELETE /api/archive/results/:resultId` - Menghapus hasil assessment

## 🤝 Kontribusi

Jika menemukan bug atau ingin menambah fitur:

1. Buat issue di repository
2. Fork repository
3. Buat branch untuk fitur/fix
4. Submit pull request

## 📞 Support

Jika mengalami masalah:

1. Periksa dokumentasi troubleshooting di atas
2. Cek log error yang ditampilkan
3. Hubungi tim development dengan detail error
