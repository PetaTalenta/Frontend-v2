# Concurrent Assessment Testing Script for PowerShell
# This script provides an easy way to run various assessment tests

# Function to print colored output
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Function to check if Node.js is available
function Test-Node {
    try {
        $null = Get-Command node -ErrorAction Stop
        return $true
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
        return $false
    }
}

# Function to check if required files exist
function Test-RequiredFiles {
    $files = @(
        "scripts/quick-token-test.js",
        "scripts/setup-test-users.js", 
        "scripts/concurrent-assessment-test.js",
        "scripts/run-concurrent-tests.js"
    )
    
    foreach ($file in $files) {
        if (-not (Test-Path $file)) {
            Write-Error "Required file not found: $file"
            return $false
        }
    }
    return $true
}

# Main menu function
function Show-Menu {
    Clear-Host
    Write-Header "Concurrent Assessment Testing Suite"
    
    Write-Host "Please select a test to run:"
    Write-Host ""
    Write-Host "1. Quick Token Test (Single assessment)"
    Write-Host "2. Setup Test Users (Create test accounts)"
    Write-Host "3. Concurrent Assessment Test (Multiple assessments)"
    Write-Host "4. High Load Test (Multiple test instances)"
    Write-Host "5. View Test Reports"
    Write-Host "6. Cleanup Test Data"
    Write-Host "7. Exit"
    Write-Host ""
}

# Quick token test
function Invoke-QuickTest {
    Write-Header "Running Quick Token Test"
    
    Write-Host "This test will:"
    Write-Host "- Login with test user"
    Write-Host "- Check initial token balance"
    Write-Host "- Submit one assessment"
    Write-Host "- Verify token deduction (should be 1)"
    Write-Host ""
    
    Read-Host "Press Enter to continue"
    
    try {
        node scripts/quick-token-test.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Quick test completed successfully"
        } else {
            Write-Error "Quick test failed"
        }
    }
    catch {
        Write-Error "Error running quick test: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to menu"
}

# Setup test users
function Invoke-SetupUsers {
    Write-Header "Setting Up Test Users"
    
    Write-Host "This will create 5 test users for concurrent testing."
    Write-Host "Users will be saved to test-data/test-credentials.json"
    Write-Host ""
    
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        return
    }
    
    try {
        node scripts/setup-test-users.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Test users setup completed"
        } else {
            Write-Error "Test users setup failed"
        }
    }
    catch {
        Write-Error "Error setting up test users: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to menu"
}

# Concurrent assessment test
function Invoke-ConcurrentTest {
    Write-Header "Running Concurrent Assessment Test"
    
    Write-Host "This test will:"
    Write-Host "- Run 3 assessments simultaneously"
    Write-Host "- Monitor via WebSocket"
    Write-Host "- Verify token deduction accuracy"
    Write-Host "- Generate detailed report"
    Write-Host ""
    Write-Warning "Make sure you have updated the test user credentials in the script!"
    Write-Host ""
    
    Read-Host "Press Enter to continue"
    
    try {
        node scripts/concurrent-assessment-test.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Concurrent test completed successfully"
        } else {
            Write-Error "Concurrent test failed"
        }
    }
    catch {
        Write-Error "Error running concurrent test: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to menu"
}

# High load test
function Invoke-HighLoadTest {
    Write-Header "Running High Load Test"
    
    Write-Host "This will run multiple test instances simultaneously."
    Write-Warning "This may put significant load on the system."
    Write-Host ""
    
    $confirm = Read-Host "Continue with high load test? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        return
    }
    
    try {
        node scripts/run-concurrent-tests.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "High load test completed successfully"
        } else {
            Write-Error "High load test failed"
        }
    }
    catch {
        Write-Error "Error running high load test: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to menu"
}

# View test reports
function Show-Reports {
    Write-Header "Test Reports"
    
    if (Test-Path "test-reports") {
        $reports = Get-ChildItem "test-reports" -Filter "*.json" -ErrorAction SilentlyContinue
        
        if ($reports) {
            Write-Host "Available test reports:"
            $reports | ForEach-Object { Write-Host "  $($_.Name)" }
            Write-Host ""
            
            $report = Read-Host "Enter report filename to view (or press Enter to skip)"
            if ($report -and (Test-Path "test-reports/$report")) {
                Write-Host ""
                Write-Header "Report: $report"
                Get-Content "test-reports/$report" | Write-Host
            } elseif ($report) {
                Write-Error "Report not found: $report"
            }
        } else {
            Write-Warning "No test reports found. Run some tests first."
        }
    } else {
        Write-Warning "No test reports directory found. Run some tests first."
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to menu"
}

# Cleanup test data
function Invoke-Cleanup {
    Write-Header "Cleanup Test Data"
    
    Write-Host "This will remove:"
    Write-Host "- Test report files"
    Write-Host "- Test user data files"
    Write-Host "- Log files"
    Write-Host ""
    
    $confirm = Read-Host "Are you sure? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        return
    }
    
    # Remove test reports
    if (Test-Path "test-reports") {
        Write-Host "Removing test reports..."
        Remove-Item "test-reports" -Recurse -Force
        Write-Success "Test reports removed"
    }
    
    # Remove test data
    if (Test-Path "test-data") {
        Write-Host "Removing test data..."
        Remove-Item "test-data" -Recurse -Force
        Write-Success "Test data removed"
    }
    
    # Remove log files
    $logFiles = Get-ChildItem "test-instance-*.log" -ErrorAction SilentlyContinue
    if ($logFiles) {
        Write-Host "Removing log files..."
        $logFiles | Remove-Item -Force
        Write-Success "Log files removed"
    }
    
    Write-Success "Cleanup completed"
    Write-Host ""
    Read-Host "Press Enter to return to menu"
}

# Main script execution
function Main {
    # Check prerequisites
    if (-not (Test-Node)) {
        exit 1
    }
    
    if (-not (Test-RequiredFiles)) {
        exit 1
    }
    
    while ($true) {
        Show-Menu
        $choice = Read-Host "Enter your choice (1-7)"
        
        switch ($choice) {
            "1" { Invoke-QuickTest }
            "2" { Invoke-SetupUsers }
            "3" { Invoke-ConcurrentTest }
            "4" { Invoke-HighLoadTest }
            "5" { Show-Reports }
            "6" { Invoke-Cleanup }
            "7" {
                Write-Host ""
                Write-Success "Thank you for using the Concurrent Assessment Testing Suite!"
                Write-Host ""
                exit 0
            }
            default {
                Write-Error "Invalid choice. Please try again."
                Start-Sleep -Seconds 2
            }
        }
    }
}

# Run main function
Main
