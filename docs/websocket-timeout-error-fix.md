# WebSocket Timeout Error Handling Fix

## Problem Description

The application was experiencing WebSocket connection timeout errors that were not being properly handled, causing the assessment workflow to get stuck without showing appropriate error messages to users.

### Error Symptoms
- WebSocket connection timeout errors in console
- Assessment workflow status not changing to 'failed'
- AssessmentErrorScreen not being displayed
- Users seeing loading screen indefinitely
- Error callbacks not being triggered

### Root Cause Analysis

The issue was in the `assessment-workflow.ts` file where WebSocket errors were being caught and logged, but the workflow state was not being properly updated to reflect the failure:

1. **Missing Status Update**: When WebSocket errors occurred, the `updateState` calls were missing the `status: 'failed'` property
2. **Missing Error Callbacks**: Error callbacks were not being invoked when errors occurred
3. **Inconsistent Error Handling**: Different error scenarios (timeout, connection error, assessment failure) were not consistently updating the workflow state

## Solution Implemented

### 1. Fixed WebSocket Submission Error Handling

**File**: `utils/assessment-workflow.ts` (lines 244-258)

```typescript
// Update state to show WebSocket failure
this.updateState({
  status: 'failed',  // ✅ Added missing status update
  useWebSocket: false,
  webSocketConnected: false,
  message: 'WebSocket connection failed. Please check your connection and try again.',
});

// Call error callback
if (this.callbacks.onError) {  // ✅ Added error callback
  this.callbacks.onError(error instanceof Error ? error : new Error('WebSocket connection failed'), this.state);
}
```

### 2. Fixed Assessment Failed Event Handling

**File**: `utils/assessment-workflow.ts` (lines 315-329)

```typescript
} else if (event.type === 'assessment-failed') {
  isResolved = true;
  const errorMessage = event.data.error || 'Assessment processing failed';
  this.updateState({
    status: 'failed',  // ✅ Added status update
    message: errorMessage
  });
  
  // Call error callback
  if (this.callbacks.onError) {  // ✅ Added error callback
    this.callbacks.onError(new Error(errorMessage), this.state);
  }
  
  reject(new Error(errorMessage));
}
```

### 3. Fixed WebSocket Error Handler

**File**: `utils/assessment-workflow.ts` (lines 341-357)

```typescript
onError: (error) => {
  console.error('Assessment Workflow: WebSocket error', error);
  if (!isResolved) {
    isResolved = true;
    this.updateState({
      status: 'failed',  // ✅ Added status update
      message: `WebSocket error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    
    // Call error callback
    if (this.callbacks.onError) {  // ✅ Added error callback
      this.callbacks.onError(error instanceof Error ? error : new Error('WebSocket error'), this.state);
    }
    
    reject(error);
  }
},
```

### 4. Fixed Timeout Handler

**File**: `utils/assessment-workflow.ts` (lines 365-380)

```typescript
setTimeout(() => {
  if (!isResolved && !this.webSocketConnected) {
    isResolved = true;
    this.updateState({
      status: 'failed',  // ✅ Added status update
      message: 'WebSocket connection timeout. Please check your connection and try again.'
    });
    
    // Call error callback
    if (this.callbacks.onError) {  // ✅ Added error callback
      this.callbacks.onError(new Error('WebSocket connection timeout'), this.state);
    }
    
    reject(new Error('WebSocket connection timeout'));
  }
}, 15000);
```

## How the Fix Works

### Error Flow Before Fix
1. WebSocket timeout occurs
2. Error is logged to console
3. Workflow state remains in 'queued' or 'processing'
4. AssessmentLoadingPage continues showing loading screen
5. User sees infinite loading

### Error Flow After Fix
1. WebSocket timeout occurs
2. Error is logged to console
3. **Workflow state is updated to 'failed'** ✅
4. **Error callback is triggered** ✅
5. **AssessmentLoadingPage detects `isFailed` status** ✅
6. **AssessmentErrorScreen is displayed** ✅
7. User sees appropriate error message with retry options

## Components Affected

### 1. AssessmentLoadingPage
The component already had proper error detection logic:

```typescript
const isFailed = workflowState.status === 'failed';

if (isFailed) {
  return (
    <AssessmentErrorScreen
      errorMessage={workflowState.message || "Terjadi kesalahan saat memproses assessment Anda."}
      onRetry={onRetry}
      onCancel={onCancel}
      isConnected={workflowState.webSocketConnected}
      processingTime={elapsedTime}
      className={className}
    />
  );
}
```

### 2. AssessmentErrorScreen
The component already had proper WebSocket error detection:

```typescript
const getErrorType = () => {
  if (errorMessage.toLowerCase().includes('websocket')) return 'websocket';
  if (errorMessage.toLowerCase().includes('timeout')) return 'timeout';
  // ... other error types
};
```

## Testing

### Manual Testing
A test page was created at `/test-websocket-timeout-fix.html` to verify the error handling:

1. **WebSocket Timeout Test**: Simulates connection timeout
2. **Assessment Failed Test**: Simulates server-side processing failure
3. **Connection Error Test**: Simulates immediate connection failure

### Expected Results
- Status changes from 'idle' → 'submitting' → 'queued' → 'failed'
- Error callbacks are triggered
- Appropriate error messages are displayed
- UI properly reflects the error state

## Benefits

1. **Better User Experience**: Users now see clear error messages instead of infinite loading
2. **Proper Error Recovery**: Users can retry or cancel failed assessments
3. **Consistent Error Handling**: All WebSocket error scenarios are handled uniformly
4. **Debugging Improvement**: Error callbacks provide better error tracking
5. **UI State Consistency**: Workflow state properly reflects actual status

## Future Improvements

1. **Retry Logic**: Implement automatic retry with exponential backoff
2. **Error Analytics**: Track error patterns for monitoring
3. **Offline Support**: Handle network disconnection scenarios
4. **Error Recovery**: Implement smart recovery strategies
5. **User Guidance**: Provide more specific troubleshooting steps

## Verification Steps

To verify the fix is working:

1. Navigate to `/assessment-loading` page
2. Start an assessment submission
3. Disconnect internet or block WebSocket connections
4. Observe that the page shows AssessmentErrorScreen after timeout
5. Check that error message mentions WebSocket connection issues
6. Verify retry and cancel buttons are functional
