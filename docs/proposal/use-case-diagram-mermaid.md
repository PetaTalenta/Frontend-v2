
# Use Case Diagram Umum FutureGuide (Mermaid)

Diagram ini menggambarkan interaksi aktor dengan sistem FutureGuide secara umum.

```mermaid
usecaseDiagram
    left to right direction
    actor Guest
    actor Pengguna

    Guest <|-- Pengguna

    rectangle "FutureGuide" {
        usecase "Pendaftaran Akun" as UC1
        usecase "Login" as UC2
        usecase "Mengikuti Asesmen" as UC3
        usecase "Melihat Hasil Asesmen" as UC4
        usecase "Mengelola Profil" as UC5
        usecase "Logout" as UC6
    }

    Guest --> UC1
    Guest --> UC2
    Pengguna --> UC3
    Pengguna --> UC4
    Pengguna --> UC5
    Pengguna --> UC6
```
