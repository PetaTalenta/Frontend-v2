# Token Balance Debug Runner (PowerShell)
# Comprehensive debugging script for token balance issues

param(
    [string]$Token = "",
    [switch]$Help
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

function Write-Status {
    param(
        [string]$Color,
        [string]$Message
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Status "Blue" "📋 $Message"
    Write-Host "----------------------------------------"
}

function Write-Success {
    param([string]$Message)
    Write-Status "Green" "✅ $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Status "Yellow" "⚠️  $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Status "Red" "❌ $Message"
}

function Show-Help {
    Write-Host "Token Balance Debug Runner" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\scripts\run-token-debug.ps1 [-Token <token>] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Token    Optional authentication token for testing"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\run-token-debug.ps1"
    Write-Host "  .\scripts\run-token-debug.ps1 -Token 'eyJhbGciOiJIUzI1NiIsInR5cCI...'"
    Write-Host ""
    Write-Host "To get your token:"
    Write-Host "1. Login to the application"
    Write-Host "2. Open browser console (F12)"
    Write-Host "3. Run: localStorage.getItem('token')"
    Write-Host "4. Copy the token and run this script"
}

function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js is available ($nodeVersion)"
            return $true
        }
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
        return $false
    }
}

function Test-DevServer {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Development server is running on port 3000"
            return $true
        }
    }
    catch {
        Write-Warning "Development server is not running on port 3000"
        return $false
    }
}

function Test-Environment {
    Write-Step "Checking Environment Configuration"
    
    if (Test-Path ".env.local") {
        Write-Success "Found .env.local file"
        Write-Host "Environment variables:"
        Get-Content ".env.local" | Where-Object { $_ -match "^(NEXT_PUBLIC_|NODE_ENV)" }
    }
    else {
        Write-Warning "No .env.local file found"
    }
    
    if (Test-Path ".env") {
        Write-Success "Found .env file"
    }
}

function Test-ApiEndpoints {
    Write-Step "Testing API Endpoints"
    
    Write-Host "Testing API endpoints..."

    # Proxy API
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/proxy/auth/token-balance" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 401 -or $response.StatusCode -eq 200) {
            Write-Success "Proxy API endpoint is accessible"
        }
    }
    catch {
        Write-Error "Proxy API endpoint is not accessible"
    }
    
    # Real API
    Write-Host "Testing real API..."
    try {
        $response = Invoke-WebRequest -Uri "https://api.chhrone.web.id/api/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Real API is accessible"
        }
    }
    catch {
        Write-Warning "Real API is not accessible or down"
    }
}

function Invoke-NodeDebug {
    param([string]$Token)
    
    Write-Step "Running Node.js Debug Script"
    
    if (-not $Token) {
        Write-Warning "No token provided for Node.js debug script"
        Write-Host "To run with token:"
        Write-Host "  .\scripts\run-token-debug.ps1 -Token 'your-token-here'"
        return
    }
    
    if (Test-Path "scripts/debug-token-balance.js") {
        Write-Success "Running Node.js debug script..."
        node scripts/debug-token-balance.js $Token
    }
    else {
        Write-Error "Node.js debug script not found"
    }
}

function Test-ProjectStructure {
    Write-Step "Checking Project Structure"
    
    $files = @(
        "app/debug-token-balance/page.tsx",
        "utils/debug-token-balance.ts",
        "utils/token-balance-fixes.ts",
        "scripts/debug-token-balance.js",
        "docs/TOKEN_BALANCE_TROUBLESHOOTING.md"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "Found: $file"
        }
        else {
            Write-Error "Missing: $file"
        }
    }
}

function New-DebugReport {
    Write-Step "Generating Debug Report"
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $reportFile = "debug-report-$timestamp.txt"
    
    $report = @"
Token Balance Debug Report
=========================
Generated: $(Get-Date)

Environment:
-----------
"@
    
    if (Test-Path ".env.local") {
        $report += "`n" + (Get-Content ".env.local" -Raw)
    }
    
    $report += @"

Package.json scripts:
-------------------
"@
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        $report += "`n" + ($packageJson.scripts | ConvertTo-Json -Depth 2)
    }
    
    $report += @"

Node.js version:
---------------
$(node --version 2>$null)

NPM version:
-----------
$(npm --version 2>$null)

PowerShell version:
------------------
$($PSVersionTable.PSVersion)

Git status:
----------
"@
    
    try {
        $gitStatus = git status --porcelain 2>$null
        $report += "`n$gitStatus"
    }
    catch {
        $report += "`nNot a git repository"
    }
    
    $report += @"

Recent commits:
--------------
"@
    
    try {
        $gitLog = git log --oneline -5 2>$null
        $report += "`n$gitLog"
    }
    catch {
        $report += "`nNo git history"
    }
    
    $report | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "Debug report saved to: $reportFile"
}

function Open-DebugInterface {
    Write-Step "Opening Debug Interface"
    
    $url = "http://localhost:3000/debug-token-balance"
    
    if (Test-DevServer) {
        Write-Success "Opening debug interface in browser..."
        Start-Process $url
    }
    else {
        Write-Error "Cannot open debug interface - development server not running"
        Write-Host "Please run: npm run dev"
    }
}

function Main {
    param([string]$Token)
    
    Write-Host "🔍 Token Balance Debug Runner" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Step "Starting Token Balance Debug Session"
    
    # Basic checks
    if (-not (Test-NodeJS)) {
        return
    }
    
    Test-Environment
    Test-ProjectStructure
    
    # Server and API checks
    if (Test-DevServer) {
        Test-ApiEndpoints
        Open-DebugInterface
    }
    else {
        Write-Warning "Development server not running. Starting it might help."
        Write-Host "Run: npm run dev"
    }
    
    # Run Node.js debug if token provided
    if ($Token) {
        Invoke-NodeDebug -Token $Token
    }
    
    # Generate report
    New-DebugReport
    
    Write-Step "Debug Session Complete"
    Write-Success "All checks completed!"
    
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review the debug report"
    Write-Host "2. Open the web debug interface if server is running"
    Write-Host "3. Follow recommendations in the troubleshooting guide"
    Write-Host "4. Contact support if issues persist"
    Write-Host ""
    Write-Host "Documentation:"
    Write-Host "- README_TOKEN_BALANCE_DEBUG.md"
    Write-Host "- docs/TOKEN_BALANCE_TROUBLESHOOTING.md"
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Main -Token $Token
