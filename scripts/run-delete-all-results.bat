@echo off
REM Batch script untuk menjalankan delete-all-results.js di Windows
REM Usage: run-delete-all-results.bat [token]

echo ========================================
echo Delete All Assessment Results - Windows
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js tidak terinstall atau tidak ada di PATH
    echo Silakan install Node.js dari https://nodejs.org/
    pause
    exit /b 1
)

REM Check if token is provided
if "%1"=="" (
    echo.
    echo ERROR: Token tidak diberikan
    echo Usage: run-delete-all-results.bat ^<token^>
    echo.
    echo Untuk mendapatkan token:
    echo 1. Login ke aplikasi
    echo 2. Buka browser console ^(F12^)
    echo 3. Jalankan: localStorage.getItem^("token"^)
    echo 4. Copy token dan jalankan script ini
    echo.
    pause
    exit /b 1
)

REM Change to project directory
cd /d "%~dp0.."

REM Run the script
echo Menjalankan script penghapusan...
echo.
node scripts/delete-all-results.js %1

REM Check exit code
if %errorlevel% neq 0 (
    echo.
    echo Script selesai dengan error
) else (
    echo.
    echo Script selesai dengan sukses
)

echo.
pause
