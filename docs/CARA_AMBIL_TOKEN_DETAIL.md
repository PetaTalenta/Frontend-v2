# 🔐 Cara Mengambil Token Authentication - Panduan Detail

Panduan lengkap untuk mengambil token dari browser dengan mengatasi peringatan keamanan.

## 🚨 Tentang Peringatan Browser

Peringatan yang muncul:
```
Warning: Don't paste code into the DevTools Console that you don't understand or haven't reviewed yourself. This could allow attackers to steal your identity or take control of your computer. Please type 'allow pasting' below and press Enter to allow pasting.
```

**Ini adalah fitur keamanan normal** untuk melindungi dari serangan XSS. Peringatan ini muncul di Chrome, Edge, dan browser berbasis Chromium lainnya.

## 🔧 Cara Mengatasi Peringatan

### Metode 1: Enable Pasting (Recommended)
1. **Ketik** (jangan paste): `allow pasting`
2. **Tekan Enter**
3. Sekarang Anda bisa paste command: `localStorage.getItem("token")`

### Metode 2: Ketik Manual
Jika tidak ingin enable pasting, ketik manual:
```javascript
localStorage.getItem("token")
```

### Metode 3: Gunakan Sources Tab
1. Buka tab **Sources** di Developer Tools
2. Buka **Console** drawer (tekan Escape)
3. Di console drawer, paste command: `localStorage.getItem("token")`

## 📋 Langkah Lengkap untuk Akun rizqy2458@gmail.com

### Langkah 1: Login ke Aplikasi
1. **Buka browser** (Chrome, Edge, Firefox, dll)
2. **Navigasi** ke aplikasi PetaTalenta
3. **Login** dengan:
   - Email: `rizqy2458@gmail.com`
   - Password: `kiana1234`
4. **Pastikan login berhasil** (Anda masuk ke dashboard)

### Langkah 2: Buka Developer Console
1. **Tekan F12** (atau klik kanan → Inspect Element)
2. **Pilih tab "Console"**
3. **Pastikan** Anda berada di tab Console (bukan Elements, Network, dll)

### Langkah 3: Ambil Token
#### Opsi A: Dengan Enable Pasting
1. **Paste** command: `localStorage.getItem("token")`
2. **Akan muncul peringatan** seperti yang Anda alami
3. **Ketik**: `allow pasting` (tanpa tanda kutip)
4. **Tekan Enter**
5. **Paste lagi** command: `localStorage.getItem("token")`
6. **Tekan Enter**
7. **Copy token** yang muncul (tanpa tanda kutip)

#### Opsi B: Ketik Manual
1. **Ketik** (jangan paste): `localStorage.getItem("token")`
2. **Tekan Enter**
3. **Copy token** yang muncul (tanpa tanda kutip)

### Langkah 4: Verifikasi Token
Token yang valid akan terlihat seperti:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Ciri-ciri token valid:**
- Panjang sekitar 200-500 karakter
- Terdiri dari 3 bagian dipisahkan titik (.)
- Dimulai dengan huruf/angka (biasanya "eyJ")

## 🚀 Menggunakan Token di Script

Setelah mendapatkan token, gunakan salah satu cara berikut:

### Windows Command Prompt
```cmd
scripts\run-quick-delete-rizqy.bat "PASTE_TOKEN_DISINI"
```

### Direct Node.js
```bash
node scripts/quick-delete-rizqy.js "PASTE_TOKEN_DISINI"
```

### Interactive Mode
```cmd
scripts\run-quick-delete-rizqy.bat
```
Kemudian masukkan token saat diminta.

## 🔍 Troubleshooting

### Token Tidak Muncul atau Null
```javascript
localStorage.getItem("token")
// Output: null
```

**Kemungkinan penyebab:**
1. **Belum login** - Login terlebih dahulu
2. **Token dengan nama lain** - Coba:
   ```javascript
   localStorage.getItem("authToken")
   localStorage.getItem("auth_token")
   localStorage.getItem("jwt")
   ```
3. **Token di sessionStorage** - Coba:
   ```javascript
   sessionStorage.getItem("token")
   ```

### Peringatan Terus Muncul
Jika peringatan terus muncul setelah mengetik "allow pasting":
1. **Refresh halaman** dan login ulang
2. **Coba browser lain** (Firefox tidak memiliki peringatan ini)
3. **Gunakan metode ketik manual**

### Token Terlalu Panjang untuk Copy
Jika token terlalu panjang:
1. **Klik kanan** pada token di console
2. **Pilih "Copy"** atau "Copy string contents"
3. **Atau** select all dengan Ctrl+A, lalu Ctrl+C

### Browser Lain

#### Firefox
- **Tidak ada peringatan pasting**
- Langsung paste `localStorage.getItem("token")`

#### Safari
- **Enable Developer Menu** terlebih dahulu
- Develop → Show Web Inspector → Console

#### Edge
- **Sama seperti Chrome** (peringatan pasting ada)
- Ketik "allow pasting" untuk enable

## 📱 Alternative: Mobile Browser

Jika menggunakan mobile:
1. **Chrome Mobile**: Buka chrome://inspect
2. **Firefox Mobile**: Enable remote debugging
3. **Atau gunakan desktop browser** (lebih mudah)

## 🛡️ Keamanan

**Mengapa peringatan ini muncul?**
- Melindungi dari **XSS attacks**
- Mencegah **malicious code injection**
- Memastikan user **memahami code** yang dijalankan

**Apakah aman mengetik "allow pasting"?**
- **Ya, aman** untuk command `localStorage.getItem("token")`
- Command ini **hanya membaca data**, tidak mengubah atau mengirim
- **Tidak berbahaya** untuk akun Anda

## 📞 Bantuan Tambahan

Jika masih mengalami kesulitan:

1. **Screenshot error** yang muncul
2. **Coba browser lain** (Firefox recommended)
3. **Pastikan sudah login** dengan benar
4. **Refresh halaman** dan coba lagi

## 🎯 Quick Reference

```javascript
// Command untuk ambil token
localStorage.getItem("token")

// Jika tidak ada, coba alternatif:
localStorage.getItem("authToken")
localStorage.getItem("auth_token")
sessionStorage.getItem("token")

// Untuk melihat semua data localStorage:
console.log(localStorage)
```

Peringatan browser adalah hal yang normal dan menunjukkan browser bekerja dengan baik untuk melindungi Anda. Ikuti langkah di atas untuk mengatasinya dengan aman!
