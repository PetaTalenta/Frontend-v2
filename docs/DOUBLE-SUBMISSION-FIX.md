# Double Submission Fix Documentation

## Problem Analysis

The application was experiencing double submission issues that caused:
1. **Token deduction of 2 instead of 1** per assessment
2. **Duplicate assessment history entries** (2 entries per assessment)
3. **Multiple API calls** for the same assessment

## Root Causes Identified

### 1. Multiple Submission Paths
- **Path 1:** Direct submission from `AssessmentHeader.tsx`
- **Path 2:** Submission through `assessment-loading` page
- Both paths were creating separate assessment history entries

### 2. Duplicate Callback Execution
- `onComplete` callbacks were being called multiple times
- Assessment workflow had no protection against duplicate callback execution
- Each callback call created a new history entry

### 3. No Submission Guard
- No mechanism to prevent rapid successive submissions
- No validation for duplicate submissions with same answers
- No cooldown period between submissions

### 4. Manual History Management
- Direct localStorage manipulation without duplicate checking
- No centralized history management
- Multiple components creating history entries independently

## Solutions Implemented

### 1. Submission Guard System (`utils/submission-guard.ts`)

**Features:**
- Prevents duplicate submissions based on answer content
- Implements cooldown period (30 seconds)
- Tracks active submissions with timeout (5 minutes)
- Provides wrapper function `withSubmissionGuard()` for protected submissions

**Key Functions:**
```typescript
// Check if submission is in progress
isSubmissionInProgress(answers: Record<number, number | null>): boolean

// Protect submission with guard
withSubmissionGuard<T>(answers, submissionFunction): Promise<T>

// Check for recent submissions
hasRecentSubmission(answers: Record<number, number | null>): boolean
```

### 2. Centralized History Management (`utils/assessment-history.ts`)

**Features:**
- Duplicate prevention based on `resultId`
- Recent duplicate detection (within 5 seconds)
- Automatic deduplication when retrieving history
- Consistent history item structure

**Key Functions:**
```typescript
// Add with duplicate prevention
addToAssessmentHistory(item: AssessmentHistoryItem): void

// Get deduplicated history
getAssessmentHistory(): AssessmentHistoryItem[]

// Check existence
assessmentExistsInHistory(resultId: string): boolean
```

### 3. Callback Protection in Assessment Workflow

**Changes Made:**
- Added `callbackCalled` flag to prevent duplicate callback execution
- Reset flag on new submissions and workflow reset
- Protected all `onComplete` callback calls

**Implementation:**
```typescript
// Only call callback once
if (this.callbacks.onComplete && !this.callbackCalled) {
  this.callbackCalled = true;
  this.callbacks.onComplete(result);
}
```

### 4. Updated Component Integration

**AssessmentHeader.tsx:**
- Integrated submission guard
- Uses centralized history management
- Added recent submission checking
- Protected both full and flexible submissions

**assessment-loading/page.tsx:**
- Added history creation in onComplete callback
- Uses centralized history management
- Prevents duplicate history entries

## Implementation Details

### Submission Flow Protection

1. **Pre-submission Check:**
   ```typescript
   if (hasRecentSubmission(answers)) {
     alert('Assessment sedang diproses. Mohon tunggu sebentar sebelum mencoba lagi.');
     return;
   }
   ```

2. **Protected Submission:**
   ```typescript
   const result = await withSubmissionGuard(answers, async () => {
     markRecentSubmission(answers);
     return await submitAssessment(answers, user?.id, refreshTokenBalance);
   });
   ```

3. **History Creation:**
   ```typescript
   addToAssessmentHistory({
     id: Date.now(),
     nama: personaTitle || "Assessment Lengkap",
     tipe: "Personality Assessment",
     tanggal: new Date().toLocaleDateString('id-ID', {
       day: 'numeric',
       month: 'long',
       year: 'numeric'
     }),
     status: "Selesai",
     resultId: resultId
   });
   ```

### Duplicate Detection Logic

**By ResultId:**
- Primary method for detecting duplicates
- Updates existing entry instead of creating new one

**By Timestamp and Content:**
- Fallback method for entries without resultId
- Detects duplicates within 5-second window
- Compares assessment name and status

**By Answer Content:**
- Generates unique key from answers using base64 encoding
- Tracks active submissions globally
- Implements cooldown period

## Testing Recommendations

### 1. Manual Testing
- Submit assessment multiple times rapidly
- Verify only 1 token is deducted
- Check that only 1 history entry is created
- Test both full and partial submissions

### 2. Edge Cases
- Network interruptions during submission
- Browser refresh during submission
- Multiple browser tabs submitting simultaneously
- Rapid navigation between pages

### 3. Verification Points
- Token balance changes
- Assessment history count
- localStorage entries
- API call logs
- Console warnings for duplicate attempts

## Monitoring and Debugging

### Console Logs Added
- Submission guard status messages
- History management operations
- Callback execution tracking
- Duplicate detection warnings

### Key Log Messages
```
"Submission Guard: Recent submission detected, preventing duplicate"
"Assessment History: Duplicate found, updating existing entry"
"Assessment Workflow: Calling onComplete callback with result ID: [id]"
```

## Future Improvements

1. **Server-side Validation:**
   - Implement idempotency keys
   - Server-side duplicate detection
   - Database constraints

2. **Enhanced UI Feedback:**
   - Loading states during submission
   - Clear progress indicators
   - Better error messages

3. **Retry Mechanism:**
   - Automatic retry for failed submissions
   - Exponential backoff
   - Network error handling

## Configuration

### Timeouts and Limits
```typescript
// Submission guard timeouts
const maxSubmissionTime = 5 * 60 * 1000; // 5 minutes
const cooldownPeriod = 30 * 1000; // 30 seconds

// History limits
const maxHistoryItems = 50; // Maximum items in history

// Duplicate detection window
const duplicateWindow = 5000; // 5 seconds
```

These values can be adjusted based on usage patterns and requirements.
