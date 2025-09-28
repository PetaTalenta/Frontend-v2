@echo off
REM Quick delete script untuk akun rizqy2458@gmail.com
REM Usage: run-quick-delete-rizqy.bat [token]

echo =====================================================
echo Quick Delete untuk Akun rizqy2458@gmail.com
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
    node scripts/quick-delete-rizqy.js %1
    goto :end
)

REM If no token provided, show instructions
echo.
echo Untuk menggunakan script ini, Anda perlu token authentication.
echo.
echo CARA MENDAPATKAN TOKEN:
echo 1. Buka aplikasi FutureGuide di browser
echo 2. Login dengan:
echo    Email: rizqy2458@gmail.com
echo    Password: kiana1234
echo 3. Buka Developer Console ^(F12^)
echo 4. Pilih tab "Console"
echo 5. Jalankan: localStorage.getItem^("token"^)
echo 6. Copy token yang muncul
echo.
echo CARA MENGGUNAKAN:
echo 1. Dengan argument: run-quick-delete-rizqy.bat "TOKEN_ANDA"
echo 2. Atau jalankan script ini dan masukkan token saat diminta
echo.

set /p choice="Apakah Anda sudah memiliki token? (y/N): "
if /i "%choice%"=="y" (
    echo.
    echo Menjalankan script interaktif...
    echo.
    node scripts/quick-delete-rizqy.js
) else (
    echo.
    echo Silakan dapatkan token terlebih dahulu dengan mengikuti langkah di atas.
    echo Kemudian jalankan script ini lagi.
)

:end
echo.
echo Script selesai.
pause
