@echo off
REM Concurrent Assessment Testing Script for Windows
REM This script provides an easy way to run various assessment tests

echo ========================================
echo   Concurrent Assessment Testing Suite
echo ========================================
echo.

:MENU
echo Please select a test to run:
echo.
echo 1. Quick Token Test (Single assessment)
echo 2. Setup Test Users (Create test accounts)
echo 3. Concurrent Assessment Test (Multiple assessments)
echo 4. High Load Test (Multiple test instances)
echo 5. View Test Reports
echo 6. Cleanup Test Data
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto QUICK_TEST
if "%choice%"=="2" goto SETUP_USERS
if "%choice%"=="3" goto CONCURRENT_TEST
if "%choice%"=="4" goto HIGH_LOAD_TEST
if "%choice%"=="5" goto VIEW_REPORTS
if "%choice%"=="6" goto CLEANUP
if "%choice%"=="7" goto EXIT
echo Invalid choice. Please try again.
echo.
goto MENU

:QUICK_TEST
echo.
echo ========================================
echo   Running Quick Token Test
echo ========================================
echo.
echo This test will:
echo - Login with test user
echo - Check initial token balance
echo - Submit one assessment
echo - Verify token deduction (should be 1)
echo.
pause
node scripts/quick-token-test.js
echo.
echo Test completed. Press any key to return to menu...
pause >nul
goto MENU

:SETUP_USERS
echo.
echo ========================================
echo   Setting Up Test Users
echo ========================================
echo.
echo This will create 5 test users for concurrent testing.
echo Users will be saved to test-data/test-credentials.json
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto MENU

node scripts/setup-test-users.js
echo.
echo Setup completed. Press any key to return to menu...
pause >nul
goto MENU

:CONCURRENT_TEST
echo.
echo ========================================
echo   Running Concurrent Assessment Test
echo ========================================
echo.
echo This test will:
echo - Run 3 assessments simultaneously
echo - Monitor via WebSocket
echo - Verify token deduction accuracy
echo - Generate detailed report
echo.
echo Make sure you have updated the test user credentials in the script!
echo.
pause
node scripts/concurrent-assessment-test.js
echo.
echo Test completed. Press any key to return to menu...
pause >nul
goto MENU

:HIGH_LOAD_TEST
echo.
echo ========================================
echo   Running High Load Test
echo ========================================
echo.
echo This will run multiple test instances simultaneously.
echo WARNING: This may put significant load on the system.
echo.
set /p confirm="Continue with high load test? (y/n): "
if /i not "%confirm%"=="y" goto MENU

node scripts/run-concurrent-tests.js
echo.
echo High load test completed. Press any key to return to menu...
pause >nul
goto MENU

:VIEW_REPORTS
echo.
echo ========================================
echo   Test Reports
echo ========================================
echo.
if exist "test-reports" (
    echo Available test reports:
    dir /b test-reports\*.json
    echo.
    set /p report="Enter report filename to view (or press Enter to skip): "
    if not "%report%"=="" (
        if exist "test-reports\%report%" (
            type "test-reports\%report%"
        ) else (
            echo Report not found: %report%
        )
    )
) else (
    echo No test reports found. Run some tests first.
)
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:CLEANUP
echo.
echo ========================================
echo   Cleanup Test Data
echo ========================================
echo.
echo This will remove:
echo - Test report files
echo - Test user data files
echo - Log files
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto MENU

if exist "test-reports" (
    echo Removing test reports...
    rmdir /s /q test-reports
)

if exist "test-data" (
    echo Removing test data...
    rmdir /s /q test-data
)

if exist "test-instance-*.log" (
    echo Removing log files...
    del test-instance-*.log
)

echo Cleanup completed.
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:EXIT
echo.
echo Thank you for using the Concurrent Assessment Testing Suite!
echo.
pause
exit /b 0
