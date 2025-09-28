@echo off
echo ========================================
echo   FutureGuide Development Environment
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting both WebSocket Server and Next.js App...
echo.
echo WebSocket Server: ws://localhost:3002
echo Next.js App: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start both servers using npm script
npm run dev:full

pause
