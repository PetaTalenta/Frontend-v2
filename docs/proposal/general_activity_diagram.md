```mermaid
activityDiagram
  title Diagram Aktivitas Umum FutureGuide
  
  |Pengguna|
  start
  :Membuka aplikasi;
  
  |Sistem|
  if (Sudah Terautentikasi?) then (belum)
    :Arahkan ke Halaman Login/Registrasi;
    |Pengguna|
    if (Pilih Aksi) then (Login)
      :Memasukkan kredensial;
    else (Registrasi)
      :Mengisi formulir registrasi;
    endif
    |Sistem|
    if (Aksi == Login) then (true)
      :Mengautentikasi pengguna;
    else (false)
      :Membuat pengguna baru;
    endif
  else (sudah)
    :Pengguna sudah login;
  endif
  :Tampilkan Dasbor;
  
  |Pengguna|
  :Memilih asesmen;
  
  |Sistem|
  :Tampilkan instruksi asesmen;
  
  |Pengguna|
  :Menjawab pertanyaan asesmen;
  :Mengirimkan asesmen;
  
  |Sistem|
  :Menghitung hasil;
  :Tampilkan hasil asesmen;
  
  |Pengguna|
  :Melihat laporan detail;
  stop
```
