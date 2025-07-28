# PowerShell script untuk menjalankan delete-all-results.js
# Usage: .\run-delete-all-results.ps1 [token]

param(
    [Parameter(Mandatory=$false)]
    [string]$Token
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Delete All Assessment Results - PowerShell" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js tidak terinstall atau tidak ada di PATH" -ForegroundColor Red
    Write-Host "Silakan install Node.js dari https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if token is provided
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host ""
    Write-Host "ERROR: Token tidak diberikan" -ForegroundColor Red
    Write-Host "Usage: .\run-delete-all-results.ps1 <token>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Untuk mendapatkan token:" -ForegroundColor Cyan
    Write-Host "1. Login ke aplikasi" -ForegroundColor White
    Write-Host "2. Buka browser console (F12)" -ForegroundColor White
    Write-Host "3. Jalankan: localStorage.getItem(`"token`")" -ForegroundColor White
    Write-Host "4. Copy token dan jalankan script ini" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Change to project directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

# Run the script
Write-Host "Menjalankan script penghapusan..." -ForegroundColor Yellow
Write-Host ""

try {
    & node "scripts/delete-all-results.js" $Token
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Script selesai dengan sukses" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Script selesai dengan error (Exit code: $LASTEXITCODE)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "Error menjalankan script: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
