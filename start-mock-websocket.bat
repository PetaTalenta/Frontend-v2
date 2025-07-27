@echo off
echo Starting Mock WebSocket Server for Assessment Testing...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if socket.io is installed
if not exist "node_modules\socket.io" (
    echo Installing Socket.IO dependencies...
    npm install socket.io@^4.7.5
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Mock WebSocket Server Starting...
echo ========================================
echo.
echo Server will run on: ws://localhost:3002
echo Press Ctrl+C to stop the server
echo.

REM Start the mock server
node mock-websocket-server.js

pause
