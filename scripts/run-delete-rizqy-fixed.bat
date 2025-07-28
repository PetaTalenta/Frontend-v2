@echo off
REM Fixed delete script untuk akun rizqy2458@gmail.com
REM Usage: run-delete-rizqy-fixed.bat [token]

echo =====================================================
echo Delete All Results - FIXED untuk rizqy2458@gmail.com
echo =====================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js tidak terinstall atau tidak ada di PATH
    echo Silakan install Node.js dari https://nodejs.org/
    pause
    exit /b 1
)

REM Change to project directory
cd /d "%~dp0.."

REM Check if token is provided as argument
if not "%1"=="" (
    echo Menggunakan token dari argument...
    echo.
    echo PERINGATAN: Script ini akan menghapus SEMUA hasil assessment!
    echo Data yang dihapus tidak dapat dikembalikan.
    echo.
    set /p confirm="Apakah Anda yakin ingin melanjutkan? (y/N): "
    if /i not "%confirm%"=="y" (
        echo Dibatalkan oleh user.
        pause
        exit /b 0
    )
    echo.
    node scripts/fixed-delete-results.js %1
    goto :end
)

REM If no token provided, show instructions
echo.
echo Script ini telah DIPERBAIKI untuk mengatasi error API limit.
echo.
echo Untuk menggunakan script ini, Anda perlu token authentication.
echo.
echo CARA MENDAPATKAN TOKEN:
echo 1. Buka aplikasi PetaTalenta di browser
echo 2. Login dengan:
echo    Email: rizqy2458@gmail.com
echo    Password: kiana1234
echo 3. Buka Developer Console ^(F12^)
echo 4. Jika muncul peringatan "Don't paste code":
echo    - Ketik: allow pasting
echo    - Tekan Enter
echo 5. Paste: localStorage.getItem^("token"^)
echo 6. Copy token yang muncul
echo.
echo CARA MENGGUNAKAN:
echo 1. Dengan argument: run-delete-rizqy-fixed.bat "TOKEN_ANDA"
echo 2. Atau jalankan script ini dan masukkan token saat diminta
echo.

set /p choice="Apakah Anda sudah memiliki token? (y/N): "
if /i "%choice%"=="y" (
    echo.
    echo PERINGATAN: Script ini akan menghapus SEMUA hasil assessment!
    echo Data yang dihapus tidak dapat dikembalikan.
    echo.
    set /p confirm="Apakah Anda yakin ingin melanjutkan? (y/N): "
    if /i not "%confirm%"=="y" (
        echo Dibatalkan oleh user.
        pause
        exit /b 0
    )
    echo.
    echo Menjalankan script fixed delete...
    echo.
    set /p token="Masukkan token Anda: "
    if not "!token!"=="" (
        node scripts/fixed-delete-results.js "!token!"
    ) else (
        echo ERROR: Token tidak diberikan
    )
) else (
    echo.
    echo Silakan dapatkan token terlebih dahulu dengan mengikuti langkah di atas.
    echo Kemudian jalankan script ini lagi.
)

:end
echo.
echo Script selesai.
pause
