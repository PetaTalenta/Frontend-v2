#!/bin/bash

# Shell script untuk menjalankan delete-all-results.js di Linux/Mac
# Usage: ./run-delete-all-results.sh [token]

echo "========================================"
echo "Delete All Assessment Results - Unix"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js tidak terinstall atau tidak ada di PATH"
    echo "Silakan install Node.js dari https://nodejs.org/"
    exit 1
fi

# Check if token is provided
if [ -z "$1" ]; then
    echo
    echo "ERROR: Token tidak diberikan"
    echo "Usage: ./run-delete-all-results.sh <token>"
    echo
    echo "Untuk mendapatkan token:"
    echo "1. Login ke aplikasi"
    echo "2. Buka browser console (F12)"
    echo "3. Jalankan: localStorage.getItem(\"token\")"
    echo "4. Copy token dan jalankan script ini"
    echo
    exit 1
fi

# Change to project directory
cd "$(dirname "$0")/.."

# Make script executable if it's not
if [ ! -x "scripts/delete-all-results.js" ]; then
    chmod +x scripts/delete-all-results.js
fi

# Run the script
echo "Menjalankan script penghapusan..."
echo
node scripts/delete-all-results.js "$1"

# Check exit code
if [ $? -ne 0 ]; then
    echo
    echo "Script selesai dengan error"
else
    echo
    echo "Script selesai dengan sukses"
fi
