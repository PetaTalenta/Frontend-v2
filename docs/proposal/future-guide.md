# Dokumentasi Use Case: Aplikasi PetaTalenta

## 1. Pendahuluan

Dokumen ini menjelaskan use case (kasus penggunaan) utama dari aplikasi PetaTalenta dari perspektif pengguna akhir. Aplikasi ini adalah sebuah platform asesmen mandiri yang memungkinkan pengguna untuk mengikuti berbagai jenis tes psikometri dan melihat hasilnya untuk pengembangan diri dan karir.

**Aktor Utama:**
*   **Pengguna:** Individu yang mendaftar, mengikuti asesmen, dan melihat hasilnya.

## 2. Diagram Use Case (Tingkat Tinggi)

```
+-------------------------------------------------+
|                Aplikasi PetaTalenta             |
|                                                 |
|  +----------------------+                       |
|  |   Manajemen Akun     |                       |
|  |  (UC-01, UC-02)      |                       |
|  +----------------------+                       |
|                                                 |
|  +----------------------+                       |
|  |  Mengikuti Asesmen   |                       |
|  |       (UC-03)        |                       |
|  +----------------------+                       |
|                                                 |
|  +----------------------+                       |
|  |   Melihat Hasil      |                       |
|  |       (UC-04)        |                       |
|  +----------------------+                       |
|                                                 |
|  +----------------------+                       |
|  |   Mengelola Profil   |                       |
|  |       (UC-05)        |                       |
|  +----------------------+                       |
|                                                 |
+-------------------------------------------------+
      ^
      |
+-----------+
| Pengguna  |
+-----------+
```

## 3. Detail Use Case

---

### **UC-01: Pendaftaran Akun Baru**

*   **Aktor:** Pengguna
*   **Deskripsi:** Pengguna baru membuat akun untuk dapat mengakses fitur-fitur aplikasi.
*   **Pra-kondisi:** Pengguna belum memiliki akun dan berada di halaman utama atau halaman login.
*   **Alur Utama:**
    1.  Pengguna memilih opsi "Daftar" atau "Register".
    2.  Sistem menampilkan formulir pendaftaran yang meminta nama, alamat email, dan kata sandi.
    3.  Pengguna mengisi semua kolom yang diperlukan.
    4.  Pengguna menyetujui syarat dan ketentuan (jika ada).
    5.  Pengguna menekan tombol "Daftar".
    6.  Sistem memvalidasi data:
        *   Memastikan semua kolom terisi.
        *   Memastikan format email valid.
        *   Memastikan kata sandi memenuhi kriteria keamanan.
        *   Memastikan email belum terdaftar.
    7.  Sistem membuat akun baru untuk pengguna.
    8.  Sistem secara otomatis mengautentikasi pengguna (login) dan mengarahkannya ke halaman Dashboard.
*   **Pasca-kondisi:** Akun pengguna berhasil dibuat dan pengguna dalam keadaan login.
*   **Alur Alternatif:**
    *   **6a.** Jika ada data yang tidak valid (misal: email sudah terdaftar), sistem akan menampilkan pesan kesalahan yang sesuai dan meminta pengguna untuk memperbaiki data.

---

### **UC-02: Login Pengguna**

*   **Aktor:** Pengguna
*   **Deskripsi:** Pengguna yang sudah terdaftar masuk ke dalam aplikasi untuk mengakses akunnya.
*   **Pra-kondisi:** Pengguna sudah memiliki akun dan berada di halaman login.
*   **Alur Utama:**
    1.  Pengguna memasukkan alamat email dan kata sandi yang terdaftar.
    2.  Pengguna menekan tombol "Login" atau "Masuk".
    3.  Sistem memverifikasi kredensial pengguna.
    4.  Jika kredensial valid, sistem mengarahkan pengguna ke halaman Dashboard.
*   **Pasca-kondisi:** Pengguna berhasil login dan dapat mengakses fitur-fitur yang memerlukan autentikasi.
*   **Alur Alternatif:**
    *   **3a.** Jika kredensial tidak valid (email atau kata sandi salah), sistem akan menampilkan pesan kesalahan.

---

### **UC-03: Mengikuti Asesmen**

*   **Aktor:** Pengguna
*   **Deskripsi:** Pengguna memilih dan menyelesaikan salah satu asesmen yang tersedia.
*   **Pra-kondisi:** Pengguna dalam keadaan login.
*   **Alur Utama:**
    1.  Dari Dashboard atau halaman "Pilih Asesmen", pengguna melihat daftar asesmen yang tersedia (misalnya: Big Five Inventory, RIASEC Holland Codes, VIA Character Strengths).
    2.  Pengguna memilih salah satu asesmen.
    3.  Sistem menampilkan halaman instruksi untuk asesmen yang dipilih, menjelaskan cara mengerjakan dan estimasi waktu.
    4.  Pengguna menekan tombol "Mulai Asesmen".
    5.  Sistem menampilkan serangkaian pertanyaan satu per satu atau dalam satu halaman.
    6.  Pengguna menjawab setiap pertanyaan sesuai dengan pilihan yang diberikan.
    7.  Setelah semua pertanyaan terjawab, pengguna menekan tombol "Selesai" atau "Submit".
    8.  Sistem menyimpan jawaban pengguna dan memproses hasilnya.
    9.  Sistem mengarahkan pengguna ke halaman "Hasil Saya" atau menampilkan ringkasan hasil.
*   **Pasca-kondisi:** Jawaban asesmen pengguna tersimpan dan hasilnya telah dihitung.
*   **Alur Alternatif:**
    *   **7a.** Jika pengguna mencoba menyelesaikan asesmen tanpa menjawab semua pertanyaan, sistem akan memberikan notifikasi untuk melengkapi jawaban.

---

### **UC-04: Melihat Hasil Asesmen**

*   **Aktor:** Pengguna
*   **Deskripsi:** Pengguna melihat dan mempelajari hasil dari asesmen yang telah diselesaikan.
*   **Pra-kondisi:** Pengguna dalam keadaan login dan telah menyelesaikan minimal satu asesmen.
*   **Alur Utama:**
    1.  Pengguna menavigasi ke halaman "Hasil Saya" atau "My Results" dari menu utama.
    2.  Sistem menampilkan daftar semua asesmen yang pernah diikuti oleh pengguna.
    3.  Pengguna memilih salah satu hasil asesmen untuk dilihat detailnya.
    4.  Sistem menampilkan laporan hasil yang terperinci, yang dapat mencakup:
        *   Skor atau tipe kepribadian (misal: OCEAN, RIASEC).
        *   Deskripsi dan interpretasi dari setiap skor/tipe.
        *   Visualisasi data seperti grafik atau bagan.
        *   Rekomendasi pengembangan diri atau karir berdasarkan hasil.
    5.  Pengguna dapat menavigasi kembali untuk melihat hasil asesmen lainnya.
*   **Pasca-kondisi:** Pengguna mendapatkan pemahaman tentang hasil asesmennya.

---

### **UC-05: Mengelola Profil**

*   **Aktor:** Pengguna
*   **Deskripsi:** Pengguna melihat atau memperbarui informasi pribadi di akunnya.
*   **Pra-kondisi:** Pengguna dalam keadaan login.
*   **Alur Utama:**
    1.  Pengguna menavigasi ke halaman "Profil".
    2.  Sistem menampilkan informasi profil pengguna saat ini (misal: nama, email, foto profil).
    3.  Pengguna memilih opsi untuk "Edit Profil".
    4.  Pengguna mengubah informasi yang diinginkan (misal: mengganti nama atau mengunggah foto profil baru).
    5.  Pengguna menekan tombol "Simpan".
    6.  Sistem memvalidasi dan menyimpan perubahan.
    7.  Sistem menampilkan pesan konfirmasi bahwa profil telah diperbarui.
*   **Pasca-kondisi:** Informasi profil pengguna telah diperbarui.
*   **Alur Alternatif:**
    *   **6a.** Jika ada data yang tidak valid saat pengeditan, sistem akan menampilkan pesan kesalahan.

---