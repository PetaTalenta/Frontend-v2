@startuml Alur_Aplikasi_FutureGuide_Dengan_Gateway
!theme plain

skinparam swimlaneBorderColor #6475e9
skinparam swimlaneBorderThickness 2

title Alur Aplikasi FutureGuide (Termasuk Pembelian Token)

|Pengguna|
start

if (Sudah punya akun?) then (ya)
    :Menampilkan halaman Login;
    :Memasukkan kredensial;
else (tidak)
    :Menampilkan halaman Pendaftaran;
    :Mengisi form & submit;
    :Membuat akun baru;
endif

if (Autentikasi berhasil?) then (ya)
    :Menampilkan Dashboard;
    :Memilih untuk memulai asesmen;

    if (Punya token asesmen?) then (ya)
        :Mengurangi 1 token;
        :Menampilkan halaman asesmen;
    else (tidak)
        :Arahkan ke halaman pembelian token;
        :Melakukan proses pembayaran (Payment Gateway);
        
        if (Pembayaran berhasil?) then (ya)
            :Menambahkan token ke akun pengguna;
            :Menampilkan halaman asesmen;
        else (tidak)
            :Menampilkan pesan error pembayaran;
            stop
        endif
    endif
    
    :Mengerjakan dan menyelesaikan asesmen;
    :Menghitung dan menyimpan hasil;
    :Menampilkan halaman hasil asesmen;
    :Melihat hasil;
else (tidak)
    :Menampilkan pesan error autentikasi;
endif

stop

@enduml