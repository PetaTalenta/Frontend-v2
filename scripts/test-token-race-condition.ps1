# Run Token Race Condition Tests
# Script untuk menjalankan test suite assessment token timing

Write-Host "🧪 Running Assessment Token Race Condition Tests..." -ForegroundColor Cyan
Write-Host ""

# Check if Playwright is installed
if (-not (Test-Path "node_modules/@playwright/test")) {
    Write-Host "❌ Playwright not found. Installing..." -ForegroundColor Red
    npm install --save-dev @playwright/test@latest
}

# Run the test suite
Write-Host "📋 Running test suite: assessment-token-race-condition.spec.ts" -ForegroundColor Yellow
Write-Host ""

npx playwright test tests/e2e/assessment-token-race-condition.spec.ts --reporter=html,list

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Opening HTML report..." -ForegroundColor Cyan
    npx playwright show-report
} else {
    Write-Host "❌ Some tests failed. Exit code: $exitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 Check report: playwright-report/index.html" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Test Summary:" -ForegroundColor Cyan
Write-Host "  - TC-1: Token decrease immediately"
Write-Host "  - TC-2: No INVALID_TOKEN errors"
Write-Host "  - TC-3: Token consistency across pages"
Write-Host "  - TC-4: Handle slow backend"
Write-Host "  - TC-5: Prevent rapid submission race"
Write-Host "  - TC-6: Cache expiration (30s)"
Write-Host "  - TC-7: Auth V1/V2 compatibility"
Write-Host "  - TC-8: Token deduct even on failure"
Write-Host "  - PERF-1: Update within 2 seconds"
Write-Host "  - PERF-2: Cache hit performance"
Write-Host ""

exit $exitCode
