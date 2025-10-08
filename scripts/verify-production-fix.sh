#!/bin/bash
# Verify INVALID_TOKEN Fix in Production
# Run this script after deployment to verify the fix is working

echo "🔍 Verifying INVALID_TOKEN Fix in Production"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="https://futureguide.id"
API_URL="https://api.futureguide.id"
CHECK_DURATION=300  # 5 minutes

echo "📋 Configuration:"
echo "  Production URL: $PRODUCTION_URL"
echo "  API URL: $API_URL"
echo "  Check Duration: ${CHECK_DURATION}s"
echo ""

# Function to check logs for INVALID_TOKEN errors
check_invalid_token_errors() {
    echo "🔎 Checking for INVALID_TOKEN errors in last hour..."
    
    # This would connect to your logging service (Datadog, CloudWatch, etc.)
    # For now, we'll simulate
    
    ERROR_COUNT=$(curl -s "${API_URL}/admin/logs?query=INVALID_TOKEN&since=1h" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        | jq '.count // 0')
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ No INVALID_TOKEN errors found${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $ERROR_COUNT INVALID_TOKEN errors${NC}"
        return 1
    fi
}

# Function to test token refresh mechanism
test_token_refresh() {
    echo ""
    echo "🔄 Testing Token Refresh Mechanism..."
    
    # Login and get token
    TOKEN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpass"}')
    
    TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token // empty')
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Failed to get auth token${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Auth token obtained${NC}"
    
    # Check token validity
    TOKEN_STATUS=$(curl -s "${API_URL}/api/auth/token-status" \
        -H "Authorization: Bearer ${TOKEN}" \
        | jq -r '.data.isValid // false')
    
    if [ "$TOKEN_STATUS" = "true" ]; then
        echo -e "${GREEN}✅ Token is valid${NC}"
        return 0
    else
        echo -e "${RED}❌ Token is invalid${NC}"
        return 1
    fi
}

# Function to monitor assessment submission
monitor_assessment_submission() {
    echo ""
    echo "📊 Monitoring Assessment Submission..."
    echo "  This will take approximately 5 minutes..."
    
    # Submit test assessment
    echo "  1. Submitting test assessment..."
    
    SUBMIT_RESPONSE=$(curl -s -X POST "${API_URL}/api/assessment/submit" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d @test-assessment-data.json)
    
    JOB_ID=$(echo $SUBMIT_RESPONSE | jq -r '.data.jobId // empty')
    
    if [ -z "$JOB_ID" ]; then
        echo -e "${RED}❌ Failed to submit assessment${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Assessment submitted (Job ID: $JOB_ID)${NC}"
    
    # Monitor status
    echo "  2. Monitoring assessment status..."
    
    INVALID_TOKEN_COUNT=0
    STATUS_CHECK_COUNT=0
    
    for i in $(seq 1 60); do
        sleep 5
        STATUS_CHECK_COUNT=$((STATUS_CHECK_COUNT + 1))
        
        STATUS_RESPONSE=$(curl -s "${API_URL}/api/assessment/status/${JOB_ID}" \
            -H "Authorization: Bearer ${TOKEN}")
        
        STATUS=$(echo $STATUS_RESPONSE | jq -r '.data.status // "unknown"')
        ERROR=$(echo $STATUS_RESPONSE | jq -r '.error // empty')
        
        # Check for INVALID_TOKEN error
        if [ "$ERROR" = "INVALID_TOKEN" ]; then
            INVALID_TOKEN_COUNT=$((INVALID_TOKEN_COUNT + 1))
            echo -e "${RED}     ❌ INVALID_TOKEN error detected at check #${STATUS_CHECK_COUNT}${NC}"
        fi
        
        echo -ne "\r     Status: $STATUS (Check #${STATUS_CHECK_COUNT}, Errors: ${INVALID_TOKEN_COUNT})"
        
        # Break if completed or failed
        if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
            break
        fi
    done
    
    echo ""
    
    if [ $INVALID_TOKEN_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ No INVALID_TOKEN errors during monitoring${NC}"
        return 0
    else
        echo -e "${RED}❌ Detected $INVALID_TOKEN_COUNT INVALID_TOKEN errors${NC}"
        return 1
    fi
}

# Function to check token refresh logs
check_token_refresh_logs() {
    echo ""
    echo "📝 Checking Token Refresh Logs..."
    
    # Check for successful token refreshes
    REFRESH_SUCCESS=$(curl -s "${API_URL}/admin/logs?query=Token+refreshed+successfully&since=1h" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        | jq '.count // 0')
    
    # Check for failed token refreshes
    REFRESH_FAILURE=$(curl -s "${API_URL}/admin/logs?query=Token+refresh+failed&since=1h" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        | jq '.count // 0')
    
    TOTAL_REFRESH=$((REFRESH_SUCCESS + REFRESH_FAILURE))
    
    if [ $TOTAL_REFRESH -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No token refresh attempts found${NC}"
        return 0
    fi
    
    SUCCESS_RATE=$(echo "scale=2; $REFRESH_SUCCESS * 100 / $TOTAL_REFRESH" | bc)
    
    echo "  Total Refreshes: $TOTAL_REFRESH"
    echo "  Successful: $REFRESH_SUCCESS"
    echo "  Failed: $REFRESH_FAILURE"
    echo "  Success Rate: ${SUCCESS_RATE}%"
    
    if (( $(echo "$SUCCESS_RATE >= 95" | bc -l) )); then
        echo -e "${GREEN}✅ Token refresh success rate is healthy (>= 95%)${NC}"
        return 0
    else
        echo -e "${RED}❌ Token refresh success rate is low (< 95%)${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo "🚀 Starting Verification..."
    echo ""
    
    PASS_COUNT=0
    FAIL_COUNT=0
    
    # Test 1: Check for existing errors
    if check_invalid_token_errors; then
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Test 2: Test token refresh
    if test_token_refresh; then
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Test 3: Monitor assessment (optional - takes 5 min)
    read -p "Run assessment monitoring test? (5 minutes) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if monitor_assessment_submission; then
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    fi
    
    # Test 4: Check refresh logs
    if check_token_refresh_logs; then
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Summary
    echo ""
    echo "=============================================="
    echo "📊 Verification Summary"
    echo "=============================================="
    echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
    echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
    echo ""
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! Fix is working correctly.${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some checks failed. Review logs and investigate.${NC}"
        exit 1
    fi
}

# Run main
main
