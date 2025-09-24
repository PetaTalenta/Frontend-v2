#!/bin/bash

# Token Balance Debug Runner
# Comprehensive debugging script for token balance issues

set -e

echo "🔍 Token Balance Debug Runner"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_step() {
    echo ""
    print_status $BLUE "📋 $1"
    echo "----------------------------------------"
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_warning() {
    print_status $YELLOW "⚠️  $1"
}

print_error() {
    print_status $RED "❌ $1"
}

# Check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    print_success "Node.js is available"
}

# Check if development server is running
check_dev_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Development server is running on port 3000"
        return 0
    else
        print_warning "Development server is not running on port 3000"
        return 1
    fi
}

# Check environment variables
check_environment() {
    print_step "Checking Environment Configuration"
    
    if [ -f ".env.local" ]; then
        print_success "Found .env.local file"
        echo "Environment variables:"
        grep -E "^(NEXT_PUBLIC_|NODE_ENV)" .env.local || true
    else
        print_warning "No .env.local file found"
    fi
    
    if [ -f ".env" ]; then
        print_success "Found .env file"
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_step "Testing API Endpoints"
    
    # Test local endpoints
    echo "Testing local endpoints..."
    
    # Mock API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/token-balance | grep -q "401\|200"; then
        print_success "Mock API endpoint is accessible"
    else
        print_error "Mock API endpoint is not accessible"
    fi
    
    # Proxy API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/proxy/auth/token-balance | grep -q "401\|200"; then
        print_success "Proxy API endpoint is accessible"
    else
        print_error "Proxy API endpoint is not accessible"
    fi
    
    # Real API
    echo "Testing real API..."
    if curl -s -o /dev/null -w "%{http_code}" https://api.futureguide.id/api/health | grep -q "200"; then
        print_success "Real API is accessible"
    else
        print_warning "Real API is not accessible or down"
    fi
}

# Run Node.js debug script
run_node_debug() {
    print_step "Running Node.js Debug Script"
    
    if [ -z "$1" ]; then
        print_warning "No token provided for Node.js debug script"
        echo "To run with token:"
        echo "  $0 \"your-token-here\""
        return 1
    fi
    
    if [ -f "scripts/debug-token-balance.js" ]; then
        print_success "Running Node.js debug script..."
        node scripts/debug-token-balance.js "$1"
    else
        print_error "Node.js debug script not found"
    fi
}

# Check project structure
check_project_structure() {
    print_step "Checking Project Structure"
    
    local files=(
        "app/debug-token-balance/page.tsx"
        "utils/debug-token-balance.ts"
        "utils/token-balance-fixes.ts"
        "scripts/debug-token-balance.js"
        "docs/TOKEN_BALANCE_TROUBLESHOOTING.md"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_success "Found: $file"
        else
            print_error "Missing: $file"
        fi
    done
}

# Generate debug report
generate_debug_report() {
    print_step "Generating Debug Report"
    
    local report_file="debug-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Token Balance Debug Report"
        echo "========================="
        echo "Generated: $(date)"
        echo ""
        
        echo "Environment:"
        echo "-----------"
        if [ -f ".env.local" ]; then
            cat .env.local
        fi
        echo ""
        
        echo "Package.json scripts:"
        echo "-------------------"
        if [ -f "package.json" ]; then
            grep -A 10 '"scripts"' package.json || true
        fi
        echo ""
        
        echo "Node.js version:"
        echo "---------------"
        node --version
        echo ""
        
        echo "NPM version:"
        echo "-----------"
        npm --version
        echo ""
        
        echo "Git status:"
        echo "----------"
        git status --porcelain || echo "Not a git repository"
        echo ""
        
        echo "Recent commits:"
        echo "--------------"
        git log --oneline -5 || echo "No git history"
        
    } > "$report_file"
    
    print_success "Debug report saved to: $report_file"
}

# Open debug interface
open_debug_interface() {
    print_step "Opening Debug Interface"
    
    local url="http://localhost:3000/debug-token-balance"
    
    if check_dev_server; then
        print_success "Opening debug interface in browser..."
        
        # Try different ways to open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v open &> /dev/null; then
            open "$url"
        elif command -v start &> /dev/null; then
            start "$url"
        else
            print_warning "Could not open browser automatically"
            echo "Please open: $url"
        fi
    else
        print_error "Cannot open debug interface - development server not running"
        echo "Please run: npm run dev"
    fi
}

# Main execution
main() {
    local token="$1"
    
    print_step "Starting Token Balance Debug Session"
    
    # Basic checks
    check_node
    check_environment
    check_project_structure
    
    # Server and API checks
    if check_dev_server; then
        test_api_endpoints
        open_debug_interface
    else
        print_warning "Development server not running. Starting it might help."
        echo "Run: npm run dev"
    fi
    
    # Run Node.js debug if token provided
    if [ -n "$token" ]; then
        run_node_debug "$token"
    fi
    
    # Generate report
    generate_debug_report
    
    print_step "Debug Session Complete"
    print_success "All checks completed!"
    
    echo ""
    echo "Next steps:"
    echo "1. Review the debug report"
    echo "2. Open the web debug interface if server is running"
    echo "3. Follow recommendations in the troubleshooting guide"
    echo "4. Contact support if issues persist"
    echo ""
    echo "Documentation:"
    echo "- README_TOKEN_BALANCE_DEBUG.md"
    echo "- docs/TOKEN_BALANCE_TROUBLESHOOTING.md"
}

# Help function
show_help() {
    echo "Token Balance Debug Runner"
    echo ""
    echo "Usage:"
    echo "  $0 [token]"
    echo ""
    echo "Arguments:"
    echo "  token    Optional authentication token for testing"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run basic checks"
    echo "  $0 \"eyJhbGciOiJIUzI1NiIsInR5cCI...\"   # Run with token"
    echo ""
    echo "To get your token:"
    echo "1. Login to the application"
    echo "2. Open browser console (F12)"
    echo "3. Run: localStorage.getItem('token')"
    echo "4. Copy the token and run this script"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main "$1"
