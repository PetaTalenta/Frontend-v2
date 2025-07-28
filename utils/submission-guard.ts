/**
 * Submission Guard Utilities
 * Prevents duplicate assessment submissions
 */

interface SubmissionState {
  isSubmitting: boolean;
  submissionId: string | null;
  timestamp: number;
}

// Global submission state tracking
const submissionStates = new Map<string, SubmissionState>();

/**
 * Generate unique submission key from answers
 */
function generateSubmissionKey(answers: Record<number, number | null>): string {
  // Create a hash-like key from answers
  const answersString = JSON.stringify(answers);
  return btoa(answersString).slice(0, 16); // Use base64 encoding for uniqueness
}

/**
 * Check if submission is already in progress
 */
export function isSubmissionInProgress(answers: Record<number, number | null>): boolean {
  const key = generateSubmissionKey(answers);
  const state = submissionStates.get(key);
  
  if (!state) return false;
  
  // Check if submission is still active (within 5 minutes)
  const now = Date.now();
  const maxSubmissionTime = 5 * 60 * 1000; // 5 minutes
  
  if (now - state.timestamp > maxSubmissionTime) {
    // Submission has timed out, remove it
    submissionStates.delete(key);
    return false;
  }
  
  return state.isSubmitting;
}

/**
 * Mark submission as started
 */
export function markSubmissionStarted(answers: Record<number, number | null>): string {
  const key = generateSubmissionKey(answers);
  const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  submissionStates.set(key, {
    isSubmitting: true,
    submissionId,
    timestamp: Date.now()
  });
  
  console.log('Submission Guard: Marked submission started with ID:', submissionId);
  return submissionId;
}

/**
 * Mark submission as completed
 */
export function markSubmissionCompleted(answers: Record<number, number | null>): void {
  const key = generateSubmissionKey(answers);
  const state = submissionStates.get(key);
  
  if (state) {
    console.log('Submission Guard: Marked submission completed for ID:', state.submissionId);
    submissionStates.delete(key);
  }
}

/**
 * Mark submission as failed
 */
export function markSubmissionFailed(answers: Record<number, number | null>): void {
  const key = generateSubmissionKey(answers);
  const state = submissionStates.get(key);
  
  if (state) {
    console.log('Submission Guard: Marked submission failed for ID:', state.submissionId);
    submissionStates.delete(key);
  }
}

/**
 * Clear all submission states (for cleanup)
 */
export function clearAllSubmissionStates(): void {
  submissionStates.clear();
  console.log('Submission Guard: All submission states cleared');
}

/**
 * Get current submission state for debugging
 */
export function getSubmissionState(answers: Record<number, number | null>): SubmissionState | null {
  const key = generateSubmissionKey(answers);
  return submissionStates.get(key) || null;
}

/**
 * Wrapper function to prevent duplicate submissions
 */
export async function withSubmissionGuard<T>(
  answers: Record<number, number | null>,
  submissionFunction: () => Promise<T>
): Promise<T> {
  // Check if already submitting
  if (isSubmissionInProgress(answers)) {
    throw new Error('Assessment submission already in progress. Please wait for the current submission to complete.');
  }
  
  // Mark as started
  const submissionId = markSubmissionStarted(answers);
  
  try {
    console.log('Submission Guard: Starting protected submission:', submissionId);
    const result = await submissionFunction();
    
    // Mark as completed
    markSubmissionCompleted(answers);
    console.log('Submission Guard: Protected submission completed:', submissionId);
    
    return result;
  } catch (error) {
    // Mark as failed
    markSubmissionFailed(answers);
    console.log('Submission Guard: Protected submission failed:', submissionId);
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
  } catch (error) {
    console.error('Submission Guard: Error marking recent submission:', error);
  }
}
