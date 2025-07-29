#!/bin/bash

# Concurrent Assessment Testing Script for Linux/Mac
# This script provides an easy way to run various assessment tests

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
}

# Function to check if required files exist
check_files() {
    local files=("scripts/quick-token-test.js" "scripts/setup-test-users.js" "scripts/concurrent-assessment-test.js" "scripts/run-concurrent-tests.js")
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file not found: $file"
            exit 1
        fi
    done
}

# Main menu function
show_menu() {
    clear
    print_header "Concurrent Assessment Testing Suite"
    
    echo "Please select a test to run:"
    echo
    echo "1. Quick Token Test (Single assessment)"
    echo "2. Setup Test Users (Create test accounts)"
    echo "3. Concurrent Assessment Test (Multiple assessments)"
    echo "4. High Load Test (Multiple test instances)"
    echo "5. View Test Reports"
    echo "6. Cleanup Test Data"
    echo "7. Exit"
    echo
}

# Quick token test
run_quick_test() {
    print_header "Running Quick Token Test"
    
    echo "This test will:"
    echo "- Login with test user"
    echo "- Check initial token balance"
    echo "- Submit one assessment"
    echo "- Verify token deduction (should be 1)"
    echo
    
    read -p "Press Enter to continue..."
    
    node scripts/quick-token-test.js
    
    if [ $? -eq 0 ]; then
        print_success "Quick test completed successfully"
    else
        print_error "Quick test failed"
    fi
    
    echo
    read -p "Press Enter to return to menu..."
}

# Setup test users
setup_users() {
    print_header "Setting Up Test Users"
    
    echo "This will create 5 test users for concurrent testing."
    echo "Users will be saved to test-data/test-credentials.json"
    echo
    
    read -p "Continue? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
        return
    fi
    
    node scripts/setup-test-users.js
    
    if [ $? -eq 0 ]; then
        print_success "Test users setup completed"
    else
        print_error "Test users setup failed"
    fi
    
    echo
    read -p "Press Enter to return to menu..."
}

# Concurrent assessment test
run_concurrent_test() {
    print_header "Running Concurrent Assessment Test"
    
    echo "This test will:"
    echo "- Run 3 assessments simultaneously"
    echo "- Monitor via WebSocket"
    echo "- Verify token deduction accuracy"
    echo "- Generate detailed report"
    echo
    print_warning "Make sure you have updated the test user credentials in the script!"
    echo
    
    read -p "Press Enter to continue..."
    
    node scripts/concurrent-assessment-test.js
    
    if [ $? -eq 0 ]; then
        print_success "Concurrent test completed successfully"
    else
        print_error "Concurrent test failed"
    fi
    
    echo
    read -p "Press Enter to return to menu..."
}

# High load test
run_high_load_test() {
    print_header "Running High Load Test"
    
    echo "This will run multiple test instances simultaneously."
    print_warning "This may put significant load on the system."
    echo
    
    read -p "Continue with high load test? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
        return
    fi
    
    node scripts/run-concurrent-tests.js
    
    if [ $? -eq 0 ]; then
        print_success "High load test completed successfully"
    else
        print_error "High load test failed"
    fi
    
    echo
    read -p "Press Enter to return to menu..."
}

# View test reports
view_reports() {
    print_header "Test Reports"
    
    if [ -d "test-reports" ] && [ "$(ls -A test-reports)" ]; then
        echo "Available test reports:"
        ls -la test-reports/*.json 2>/dev/null
        echo
        
        read -p "Enter report filename to view (or press Enter to skip): " report
        if [ -n "$report" ] && [ -f "test-reports/$report" ]; then
            echo
            print_header "Report: $report"
            cat "test-reports/$report" | jq . 2>/dev/null || cat "test-reports/$report"
        elif [ -n "$report" ]; then
            print_error "Report not found: $report"
        fi
    else
        print_warning "No test reports found. Run some tests first."
    fi
    
    echo
    read -p "Press Enter to return to menu..."
}

# Cleanup test data
cleanup_data() {
    print_header "Cleanup Test Data"
    
    echo "This will remove:"
    echo "- Test report files"
    echo "- Test user data files"
    echo "- Log files"
    echo
    
    read -p "Are you sure? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
        return
    fi
    
    # Remove test reports
    if [ -d "test-reports" ]; then
        echo "Removing test reports..."
        rm -rf test-reports
        print_success "Test reports removed"
    fi
    
    # Remove test data
    if [ -d "test-data" ]; then
        echo "Removing test data..."
        rm -rf test-data
        print_success "Test data removed"
    fi
    
    # Remove log files
    if ls test-instance-*.log 1> /dev/null 2>&1; then
        echo "Removing log files..."
        rm -f test-instance-*.log
        print_success "Log files removed"
    fi
    
    print_success "Cleanup completed"
    echo
    read -p "Press Enter to return to menu..."
}

# Main script execution
main() {
    # Check prerequisites
    check_node
    check_files
    
    while true; do
        show_menu
        read -p "Enter your choice (1-7): " choice
        
        case $choice in
            1)
                run_quick_test
                ;;
            2)
                setup_users
                ;;
            3)
                run_concurrent_test
                ;;
            4)
                run_high_load_test
                ;;
            5)
                view_reports
                ;;
            6)
                cleanup_data
                ;;
            7)
                echo
                print_success "Thank you for using the Concurrent Assessment Testing Suite!"
                echo
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                sleep 2
                ;;
        esac
    done
}

# Run main function
main
