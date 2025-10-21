@startuml Alur_Aplikasi_FutureGuide_Manage_Profile
!theme plain

skinparam swimlaneBorderColor #6475e9
skinparam swimlaneBorderThickness 2

title Alur Aplikasi FutureGuide (Termasuk Manajemen Profil)

|Pengguna|
start

if (Sudah punya akun?) then (ya)
    :Menampilkan halaman Login;
    :Memasukkan kredensial;
else (tidak)
    :Menampilkan halaman Pendaftaran;
    :Mengisi form & submit;
    |Sistem|
    :Membuat akun baru;
endif

|Sistem|
if (Autentikasi berhasil?) then (ya)
    :Menampilkan Dashboard;
    |Pengguna|
    :Mengakses menu "Profil";
    |Sistem|
    :Menampilkan halaman Manajemen Profil dengan data pengguna saat ini;
    |Pengguna|
    :Mengubah informasi profil (nama, email, password, dll.);
    :Menyimpan perubahan;
    |Sistem|
    :Memvalidasi input;
    if (Validasi berhasil?) then (ya)
        :Memperbarui data profil di database;
        :Menampilkan pesan sukses;
    else (tidak)
        :Menampilkan pesan error validasi;
    endif
    |Pengguna|
    :Kembali ke Dashboard atau melanjutkan edit;
else (tidak)
    :Menampilkan pesan error autentikasi;
endif

stop

@enduml