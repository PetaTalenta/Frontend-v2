/**
 * Enhanced Submission Guard Utilities
 * Prevents duplicate assessment submissions with improved session tracking
 */

interface SubmissionState {
  isSubmitting: boolean;
  submissionId: string | null;
  timestamp: number;
  source: 'header' | 'loading-page' | 'workflow' | 'unknown';
  retryCount: number;
}

interface SessionState {
  submissionAttempts: number;
  lastSubmissionTime: number;
  completedSubmissions: Set<string>;
}

// Global submission state tracking with enhanced metadata
const submissionStates = new Map<string, SubmissionState>();

// Session-level tracking to prevent cross-component conflicts
const sessionState: SessionState = {
  submissionAttempts: 0,
  lastSubmissionTime: 0,
  completedSubmissions: new Set<string>()
};

// Track first-time submissions per session to prevent initial double submission
const sessionFirstSubmissions = new Set<string>();

// Atomic operation lock to prevent race conditions
let atomicLock = false;

/**
 * Generate unique submission key from answers
 */
function generateSubmissionKey(answers: Record<number, number | null>): string {
  // Create a hash-like key from answers
  const answersString = JSON.stringify(answers);
  return btoa(answersString).slice(0, 16); // Use base64 encoding for uniqueness
}

/**
 * Atomic operation wrapper to prevent race conditions
 */
async function withAtomicLock<T>(operation: () => Promise<T> | T): Promise<T> {
  // Wait for any existing atomic operation to complete
  while (atomicLock) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  atomicLock = true;
  try {
    return await operation();
  } finally {
    atomicLock = false;
  }
}

/**
 * Enhanced submission progress check with session validation
 */
export async function isSubmissionInProgress(
  answers: Record<number, number | null>,
  source: 'header' | 'loading-page' | 'workflow' | 'unknown' = 'unknown'
): Promise<boolean> {
  return await withAtomicLock(() => {
    const key = generateSubmissionKey(answers);
    const state = submissionStates.get(key);

    if (!state) return false;

    // Check if submission is still active (within 3 minutes for faster recovery)
    const now = Date.now();
    const maxSubmissionTime = 3 * 60 * 1000; // 3 minutes

    if (now - state.timestamp > maxSubmissionTime) {
      // Submission has timed out, remove it
      console.log(`Submission Guard: Cleaning up timed out submission ${state.submissionId}`);
      submissionStates.delete(key);
      return false;
    }

    // Check for session-level conflicts
    if (sessionState.lastSubmissionTime > 0 &&
        now - sessionState.lastSubmissionTime < 2000) { // 2 second cooldown
      console.warn(`Submission Guard: Session cooldown active, blocking ${source} submission`);
      return true;
    }

    return state.isSubmitting;
  });
}

/**
 * Enhanced submission marking with session tracking
 */
export async function markSubmissionStarted(
  answers: Record<number, number | null>,
  source: 'header' | 'loading-page' | 'workflow' | 'unknown' = 'unknown'
): Promise<string> {
  return await withAtomicLock(() => {
    const key = generateSubmissionKey(answers);
    const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    // Update session state
    sessionState.submissionAttempts++;
    sessionState.lastSubmissionTime = now;

    submissionStates.set(key, {
      isSubmitting: true,
      submissionId,
      timestamp: now,
      source,
      retryCount: 0
    });

    console.log(`Submission Guard: Marked submission started with ID: ${submissionId} from ${source} (attempt #${sessionState.submissionAttempts})`);
    return submissionId;
  });
}

/**
 * Enhanced completion marking with session tracking
 */
export async function markSubmissionCompleted(answers: Record<number, number | null>): Promise<void> {
  return await withAtomicLock(() => {
    const key = generateSubmissionKey(answers);
    const state = submissionStates.get(key);

    if (state) {
      console.log(`Submission Guard: Marked submission completed for ID: ${state.submissionId} from ${state.source}`);

      // Add to completed submissions for session tracking
      sessionState.completedSubmissions.add(state.submissionId);

      // Clean up submission state
      submissionStates.delete(key);
    }
  });
}

/**
 * Enhanced failure marking with retry tracking
 */
export async function markSubmissionFailed(answers: Record<number, number | null>): Promise<void> {
  return await withAtomicLock(() => {
    const key = generateSubmissionKey(answers);
    const state = submissionStates.get(key);

    if (state) {
      console.log(`Submission Guard: Marked submission failed for ID: ${state.submissionId} from ${state.source} (retry count: ${state.retryCount})`);

      // Increment retry count but don't delete immediately to prevent rapid retries
      state.retryCount++;
      state.timestamp = Date.now(); // Update timestamp for timeout calculation

      // Only delete if retry count exceeds limit
      if (state.retryCount >= 3) {
        console.log(`Submission Guard: Removing failed submission after ${state.retryCount} retries`);
        submissionStates.delete(key);
      }
    }
  });
}

/**
 * Clear all submission states (for cleanup)
 */
export async function clearAllSubmissionStates(): Promise<void> {
  return await withAtomicLock(() => {
    submissionStates.clear();
    sessionState.submissionAttempts = 0;
    sessionState.lastSubmissionTime = 0;
    sessionState.completedSubmissions.clear();
    sessionFirstSubmissions.clear();
    console.log('Submission Guard: All submission states and session data cleared');
  });
}

/**
 * Clear session submission tracking (called after successful completion)
 */
export async function clearSessionSubmissionTracking(): Promise<void> {
  return await withAtomicLock(() => {
    sessionFirstSubmissions.clear();
    console.log('Submission Guard: Session submission tracking cleared');
  });
}

/**
 * Get session statistics for debugging
 */
export function getSessionStats(): SessionState & { activeSubmissions: number } {
  return {
    ...sessionState,
    activeSubmissions: submissionStates.size
  };
}

/**
 * Get current submission state for debugging
 */
export function getSubmissionState(answers: Record<number, number | null>): SubmissionState | null {
  const key = generateSubmissionKey(answers);
  return submissionStates.get(key) || null;
}

/**
 * Enhanced submission guard wrapper with atomic operations and session tracking
 */
export async function withSubmissionGuard<T>(
  answers: Record<number, number | null>,
  submissionFunction: () => Promise<T>,
  source: 'header' | 'loading-page' | 'workflow' | 'unknown' = 'unknown'
): Promise<T> {
  // Atomic check for existing submissions
  const isInProgress = await isSubmissionInProgress(answers, source);
  if (isInProgress) {
    throw new Error(`Assessment submission already in progress. Please wait for the current submission to complete. (Source: ${source})`);
  }

  // Mark as started with source tracking
  const submissionId = await markSubmissionStarted(answers, source);

  try {
    console.log(`Submission Guard: Starting protected submission: ${submissionId} from ${source}`);
    const result = await submissionFunction();

    // Mark as completed
    await markSubmissionCompleted(answers);
    console.log(`Submission Guard: Protected submission completed: ${submissionId} from ${source}`);

    return result;
  } catch (error) {
    // Mark as failed
    await markSubmissionFailed(answers);
    console.log(`Submission Guard: Protected submission failed: ${submissionId} from ${source}`, error);
    throw error;
  }
}

/**
 * Check for recent submissions in localStorage (additional safety)
 */
export function hasRecentSubmission(answers: Record<number, number | null>): boolean {
  try {
    const key = `recent-submission-${generateSubmissionKey(answers)}`;
    const lastSubmission = localStorage.getItem(key);

    // ENHANCED: Check for first-time submission in current session
    const sessionKey = generateSubmissionKey(answers);
    if (sessionFirstSubmissions.has(sessionKey)) {
      console.log('Submission Guard: First-time submission already processed in this session');
      return true;
    }

    if (!lastSubmission) return false;

    const timestamp = parseInt(lastSubmission, 10);
    const now = Date.now();
    const cooldownPeriod = 30 * 1000; // 30 seconds cooldown

    if (now - timestamp < cooldownPeriod) {
      console.log('Submission Guard: Recent submission detected, still in cooldown period');
      return true;
    }

    // Remove expired entry
    localStorage.removeItem(key);
    return false;
  } catch (error) {
    console.error('Submission Guard: Error checking recent submission:', error);
    return false;
  }
}

/**
 * Mark recent submission in localStorage
 */
export function markRecentSubmission(answers: Record<number, number | null>): void {
  try {
    const key = `recent-submission-${generateSubmissionKey(answers)}`;
    localStorage.setItem(key, Date.now().toString());

    // ENHANCED: Mark first-time submission for this session
    const sessionKey = generateSubmissionKey(answers);
    sessionFirstSubmissions.add(sessionKey);
    console.log('Submission Guard: Marked first-time submission for session');
  } catch (error) {
    console.error('Submission Guard: Error marking recent submission:', error);
  }
}



/**
 * Check if this is a first-time submission in current session
 */
export function isFirstTimeSubmissionInSession(answers: Record<number, number | null>): boolean {
  const sessionKey = generateSubmissionKey(answers);
  return !sessionFirstSubmissions.has(sessionKey);
}
