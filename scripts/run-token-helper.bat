@echo off
REM Token Helper script untuk membantu mengambil token
REM Usage: run-token-helper.bat

echo =====================================================
echo Token Helper untuk PetaTalenta
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

REM Run the script
echo Menjalankan token helper...
echo.
node scripts/token-helper.js

echo.
echo Script selesai.
pause
