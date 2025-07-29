#!/bin/bash

echo "Starting Mock WebSocket Server for Assessment Testing..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if socket.io is installed
if [ ! -d "node_modules/socket.io" ]; then
    echo "Installing Socket.IO dependencies..."
    npm install socket.io@^4.7.5
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

echo
echo "========================================"
echo "   Mock WebSocket Server Starting..."
echo "========================================"
echo
echo "Server will run on: ws://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo

# Start the mock server
node testing/mock-servers/mock-websocket-server.js
