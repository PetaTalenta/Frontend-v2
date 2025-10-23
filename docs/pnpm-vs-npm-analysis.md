# Analisis pnpm vs npm untuk Project FutureGuide

## Ringkasan

Dokumentasi ini menjelaskan perbedaan antara pnpm dan npm, alasan penggunaan pnpm dalam project ini, dan apakah mungkin untuk beralih ke npm.

## Apa itu pnpm dan npm?

### npm (Node Package Manager)
- Package manager default yang datang dengan Node.js
- Pertama kali diluncurkan pada tahun 2010
- Menggunakan struktur node_modules yang bersarang (nested)
- Menyimpan dependensi secara lokal di setiap project

### pnpm (Performant npm)
- Package manager alternatif yang diluncurkan pada tahun 2017
- Menggunakan symlink untuk mengelola dependensi
- Menggunakan content-addressable storage untuk menghindari duplikasi
- Lebih hemat ruang disk dan lebih cepat

## Perbedaan Utama

### 1. Cara Penyimpanan Dependensi

**npm:**
```
project/
└── node_modules/
    ├── package-a/
    │   └── node_modules/
    │       └── package-b/
    ├── package-c/
    │   └── node_modules/
    │       └── package-b/ (duplikat)
    └── package-b/
```

**pnpm:**
```
project/
└── node_modules/
    ├── .pnpm/
    │   ├── package-a@1.0.0/
    │   ├── package-b@2.0.0/
    │   └── package-c@3.0.0/
    ├── package-a/ (symlink)
    ├── package-c/ (symlink)
    └── package-b/ (symlink)
```

### 2. Penggunaan Ruang Disk

- **npm**: Setiap project menyimpan salinan lengkap dependensi
- **pnpm**: Satu copy untuk setiap versi package di seluruh sistem, digunakan bersama oleh semua project

### 3. Kecepatan Instalasi

- **pnpm**: Lebih cepat karena:
  - Tidak perlu mengunduh package yang sudah ada di cache
  - Parallel installation
  - Tidak perlu membuat banyak folder bersarang

### 4. Keamanan

- **pnpm**: Lebih aman karena:
  - Hanya package yang terdaftar di package.json yang dapat diakses
  - Mencegah "phantom dependencies" (dependensi yang tidak terdaftar tapi bisa diakses)

## Mengapa Project Ini Menggunakan pnpm?

Berdasarkan analisis file project:

1. **Efisiensi Ruang Disk**: Project memiliki banyak dependensi (77 package), pnpm menghemat ruang signifikan

2. **Kecepatan Instalasi**: Dengan jumlah dependensi yang banyak, pnpm memberikan keuntungan kecepatan

3. **Konsistensi**: Menghindari masalah phantom dependencies yang sering terjadi dengan npm

4. **Developer Experience**: Lebih cepat untuk setup development environment

## Keputusan: Hanya Menggunakan pnpm

**Keputusan: Project akan menggunakan pnpm secara eksklusif**

Berdasarkan analisis dan keputusan tim, project FutureGuide akan menggunakan pnpm sebagai package manager tunggal.

### Alasan Keputusan:

1. **Performa Superior**: Instalasi dependensi lebih cepat
2. **Efisiensi Disk**: Menghemat ruang penyimpanan signifikan
3. **Konsistensi**: Mencegah phantom dependencies
4. **Developer Experience**: Setup environment lebih cepat

### Perubahan yang Telah Dilakukan:

1. **Menghapus package-lock.json**
   - File lock npm telah dihapus untuk menghindari konflik
   - Hanya menggunakan pnpm-lock.yaml

2. **Update README.md**
   - Mengubah prerequisite dari "npm/pnpm" menjadi "pnpm" saja
   - Mengubah semua perintah `npm install` menjadi `pnpm install`
   - Mengubah semua perintah `npm run` menjadi `pnpm`
   - Mengubah semua perintah `npm test` menjadi `pnpm test`

3. **Standardisasi Perintah**
   - Development: `pnpm run dev`
   - Build: `pnpm run build`
   - Test: `pnpm run test`
   - Install: `pnpm install`

### Best Practices dengan pnpm:

1. **Instalasi pnpm** (jika belum ada):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependensi**:
   ```bash
   pnpm install
   ```

3. **Menambah package baru**:
   ```bash
   pnpm add package-name
   pnpm add -D package-name  # untuk dev dependencies
   ```

4. **Update package**:
   ```bash
   pnpm update package-name
   pnpm update  # update semua package
   ```

5. **Hapus package**:
   ```bash
   pnpm remove package-name
   ```

## Implementasi Saat Ini

Project saat ini menggunakan:
- package.json untuk definisi dependensi
- Kedua lock file ada: package-lock.json dan pnpm-lock.yaml
- Berdasarkan timestamp, pnpm-lock.yaml lebih baru (23 Oktober 2025, 10:31) dibandingkan package-lock.json (22 Oktober 2025, 22:52)
- Ini menunjukkan project mungkin pernah menggunakan npm dan kemudian beralih ke pnpm
- Tidak ada script spesifik pnpm di package.json

## Status Package Manager

**Package manager yang sedang aktif: pnpm**
Berdasarkan lock file yang lebih baru, project saat ini menggunakan pnpm sebagai package manager utama.

## Konfigurasi Saat Ini

Berdasarkan analisis file-file project:

1. **README.md** sudah mendukung kedua package manager:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Package.json scripts** menggunakan format standar yang kompatibel dengan kedua package manager:
   - `npm run dev`, `npm run build`, dll.
   - Tidak ada script spesifik pnpm

3. **vercel.json** tidak memiliki konfigurasi package manager spesifik

4. **Kedua lock file ada**:
   - `package-lock.json` (lebih tua: 22 Oktober 2025, 22:52)
   - `pnpm-lock.yaml` (lebih baru: 23 Oktober 2025, 10:31)

Ini menunjukkan project:
- Awalnya menggunakan npm
- Kemudian beralih ke pnpm
- Saat ini aktif menggunakan pnpm
- Dokumentasi sudah mendukung kedua opsi

## Kesimpulan

Project FutureGuide telah memutuskan untuk menggunakan pnpm secara eksklusif sebagai package manager. Keputusan ini didasarkan pada keunggulan performa, efisiensi disk, dan konsistensi yang ditawarkan oleh pnpm.

### Perubahan yang Sudah Dilakukan:

1. ✅ **Menghapus package-lock.json**
2. ✅ **Update README.md** untuk hanya mereferensikan pnpm
3. ✅ **Standardisasi semua perintah** menggunakan pnpm dengan format `pnpm run [script]`

### Tujuan Penggunaan pnpm:

1. **Performa**: Instalasi dependensi lebih cepat, terutama untuk project dengan banyak package
2. **Efisiensi Disk**: Menghindari duplikasi dependensi antar project
3. **Konsistensi**: Mencegah phantom dependencies yang bisa menyebabkan masalah di production
4. **Developer Experience**: Setup development environment lebih cepat untuk tim baru

### Keuntungan Final:

- **Satu sumber kebenaran**: Hanya ada satu lock file (pnpm-lock.yaml)
- **Dokumentasi konsisten**: Semua instruksi menggunakan pnpm
- **Tidak ada konflik**: Tidak ada risiko konflik antara lock file npm dan pnpm
- **Performa optimal**: Memaksimalkan keuntungan yang ditawarkan pnpm

Project sekarang sepenuhnya menggunakan pnpm dan semua dokumentasi telah diperbarui untuk mencerminkan keputusan ini.