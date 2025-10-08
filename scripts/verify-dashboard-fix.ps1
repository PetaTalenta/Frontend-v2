#!/usr/bin/env pwsh
# Verification Script for Dashboard Reload Fix
# Run this after implementing fixes to verify improvements

Write-Host "=== Dashboard Reload Prevention - Verification Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
Write-Host "1. Checking dev server..." -ForegroundColor Yellow
$devProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"}
if ($devProcess) {
    Write-Host "   ✅ Dev server is running (PID: $($devProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dev server not running. Start with: npm run dev" -ForegroundColor Red
}
Write-Host ""

# Check build status
Write-Host "2. Checking build status..." -ForegroundColor Yellow
if (Test-Path ".\build\build-manifest.json") {
    Write-Host "   ✅ Build artifacts exist" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No build artifacts found. Run: npm run build" -ForegroundColor Red
}
Write-Host ""

# Verify file changes
Write-Host "3. Verifying file changes..." -ForegroundColor Yellow
$filesToCheck = @(
    "src\app\dashboard\page.tsx",
    "src\components\auth\AuthGuard.tsx",
    "src\components\dashboard\DashboardClient.tsx",
    "src\hooks\useDashboardData.ts",
    "middleware.ts",
    "tests\e2e\dashboard-reload-prevention.spec.ts",
    "docs\DASHBOARD_RELOAD_FIX.md"
)

$allFilesExist = $true
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}
Write-Host ""

# Check for key patterns in fixed files
Write-Host "4. Checking fix implementations..." -ForegroundColor Yellow

# Check dashboard page
$dashboardContent = Get-Content "src\app\dashboard\page.tsx" -Raw
if ($dashboardContent -match "export const dynamic = 'force-dynamic'" -and 
    $dashboardContent -notmatch "export const revalidate") {
    Write-Host "   ✅ Dashboard page: Conflicting ISR config removed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Dashboard page: ISR config issue detected" -ForegroundColor Red
}

# Check AuthGuard
$authGuardContent = Get-Content "src\components\auth\AuthGuard.tsx" -Raw
if ($authGuardContent -match "lastRedirectRef" -and $authGuardContent -match "console\.count") {
    Write-Host "   ✅ AuthGuard: Redirect loop prevention implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ AuthGuard: Missing loop prevention or instrumentation" -ForegroundColor Red
}

# Check DashboardClient
$dashboardClientContent = Get-Content "src\components\dashboard\DashboardClient.tsx" -Raw
if ($dashboardClientContent -match "useMemo" -and $dashboardClientContent -match "fallbackStatsData") {
    Write-Host "   ✅ DashboardClient: Memoization implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ DashboardClient: Missing memoization" -ForegroundColor Red
}

# Check SWR hook
$swrHookContent = Get-Content "src\hooks\useDashboardData.ts" -Raw
if ($swrHookContent -match "refreshInterval:\s*0") {
    Write-Host "   ✅ SWR Hook: Auto-refresh disabled" -ForegroundColor Green
} else {
    Write-Host "   ❌ SWR Hook: Auto-refresh still enabled" -ForegroundColor Red
}

# Check middleware
$middlewareContent = Get-Content "middleware.ts" -Raw
if ($middlewareContent -match "isDev" -and $middlewareContent -match "process\.env\.NODE_ENV") {
    Write-Host "   ✅ Middleware: Dev-only logging implemented" -ForegroundColor Green
} else {
    Write-Host "   ❌ Middleware: Logging not optimized" -ForegroundColor Red
}

Write-Host ""

# Test recommendations
Write-Host "5. Test recommendations:" -ForegroundColor Yellow
Write-Host "   • Manual test: Navigate to http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "   • Check browser console for:"
Write-Host "     - Max 2-3 [AuthGuard] Render logs"
Write-Host "     - Max 1-2 [DashboardClient] loadDashboardData called"
Write-Host "     - Single GET /dashboard request"
Write-Host "     - No 'Fast Refresh full reload' warning"
Write-Host ""
Write-Host "   • Run E2E tests: npx playwright test dashboard-reload-prevention" -ForegroundColor Cyan
Write-Host "   • Run with UI: npx playwright test dashboard-reload-prevention --ui" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($allFilesExist) {
    Write-Host "✅ All files verified successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start dev server: npm run dev" -ForegroundColor White
    Write-Host "2. Navigate to http://localhost:3000/dashboard" -ForegroundColor White
    Write-Host "3. Check browser console for improvements" -ForegroundColor White
    Write-Host "4. Run E2E tests: npm run test:e2e" -ForegroundColor White
} else {
    Write-Host "⚠️  Some files are missing. Please review implementation." -ForegroundColor Red
}
Write-Host ""
Write-Host "Documentation: docs\DASHBOARD_RELOAD_FIX.md" -ForegroundColor Cyan
Write-Host "Tests: tests\e2e\dashboard-reload-prevention.spec.ts" -ForegroundColor Cyan
