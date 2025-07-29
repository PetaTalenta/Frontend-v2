@echo off
echo ========================================
echo  Starting Optimized WebSocket Server
echo ========================================
echo.
echo Starting Mock WebSocket Server with optimizations...
echo - Faster authentication response
echo - Reduced connection timeouts
echo - Better error handling
echo.

node testing/mock-servers/mock-websocket-server.js

pause
