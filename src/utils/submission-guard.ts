/**
 * Simplified Submission Guard Utilities
 *
 * ✅ REFACTORED: Removed complex atomic locks and redundant state tracking
 *
 * Prevents duplicate assessment submissions with simple, reliable checks:
 * - Single Map-based state tracking
 * - Cooldown period to prevent rapid resubmissions
 * - Clear error messages and logging
 *
 * @module submission-guard
 */

interface SubmissionState {
  submissionId: string;
  timestamp: number;
  source: 'header' | 'loading-page' | 'workflow' | 'unknown';
}

// ✅ SIMPLIFIED: Single Map for tracking active submissions
const activeSubmissions = new Map<string, SubmissionState>();

// ✅ SIMPLIFIED: Single Set for tracking completed submissions in current session
const completedInSession = new Set<string>();

/**
 * Generate unique submission key from answers
 */
function generateSubmissionKey(answers: Record<number, number | null>): string {
  const answersString = JSON.stringify(answers);
  return btoa(answersString).slice(0, 16);
}

/**
 * ✅ SIMPLIFIED: Check if submission is in progress
 */
export function isSubmissionInProgress(
  answers: Record<number, number | null>
): boolean {
  const key = generateSubmissionKey(answers);
  const state = activeSubmissions.get(key);

  if (!state) return false;

  // Auto-cleanup timed out submissions (3 minutes max)
  const now = Date.now();
  const maxSubmissionTime = 3 * 60 * 1000;

  if (now - state.timestamp > maxSubmissionTime) {
    console.log(`[SubmissionGuard] Cleaning up timed out submission: ${state.submissionId}`);
    activeSubmissions.delete(key);
    return false;
  }

  return true;
}

/**
 * ✅ SIMPLIFIED: Mark submission as started
 */
export function markSubmissionStarted(
  answers: Record<number, number | null>,
  source: 'header' | 'loading-page' | 'workflow' | 'unknown' = 'unknown'
): string {
  const key = generateSubmissionKey(answers);
  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  activeSubmissions.set(key, {
    submissionId,
    timestamp: Date.now(),
    source
  });

  console.log(`[SubmissionGuard] ✅ Started: ${submissionId} from ${source}`);
  return submissionId;
}

/**
 * ✅ SIMPLIFIED: Mark submission as completed
 */
export function markSubmissionCompleted(answers: Record<number, number | null>): void {
  const key = generateSubmissionKey(answers);
  const state = activeSubmissions.get(key);

  if (state) {
    console.log(`[SubmissionGuard] ✅ Completed: ${state.submissionId}`);
    completedInSession.add(key);
    activeSubmissions.delete(key);
  }
}

/**
 * ✅ SIMPLIFIED: Mark submission as failed
 */
export function markSubmissionFailed(answers: Record<number, number | null>): void {
  const key = generateSubmissionKey(answers);
  const state = activeSubmissions.get(key);

  if (state) {
    console.log(`[SubmissionGuard] ❌ Failed: ${state.submissionId}`);
    activeSubmissions.delete(key);
  }
}

/**
 * ✅ SIMPLIFIED: Clear all submission states
 */
export function clearAllSubmissionStates(): void {
  activeSubmissions.clear();
  completedInSession.clear();
  console.log('[SubmissionGuard] All states cleared');
}

/**
 * ✅ SIMPLIFIED: Get current submission state for debugging
 */
export function getSubmissionState(answers: Record<number, number | null>): SubmissionState | null {
  const key = generateSubmissionKey(answers);
  return activeSubmissions.get(key) || null;
}

/**
 * ✅ SIMPLIFIED: Get statistics for debugging
 */
export function getSessionStats() {
  return {
    activeSubmissions: activeSubmissions.size,
    completedInSession: completedInSession.size
  };
}

/**
 * ✅ SIMPLIFIED: Submission guard wrapper
 */
export async function withSubmissionGuard<T>(
  answers: Record<number, number | null>,
  submissionFunction: () => Promise<T>,
  source: 'header' | 'loading-page' | 'workflow' | 'unknown' = 'unknown'
): Promise<T> {
  // Check for existing submission
  if (isSubmissionInProgress(answers)) {
    const state = getSubmissionState(answers);
    throw new Error(
      `Submission already in progress (ID: ${state?.submissionId}). Please wait.`
    );
  }

  // Mark as started
  const submissionId = markSubmissionStarted(answers, source);

  try {
    console.log(`[SubmissionGuard] Executing: ${submissionId}`);
    const result = await submissionFunction();
    markSubmissionCompleted(answers);
    return result;
  } catch (error) {
    markSubmissionFailed(answers);
    throw error;
  }
}

/**
 * ✅ SIMPLIFIED: Check for recent submissions (cooldown check)
 */
export function hasRecentSubmission(answers: Record<number, number | null>): boolean {
  const key = generateSubmissionKey(answers);

  // Check if already completed in this session
  if (completedInSession.has(key)) {
    console.log('[SubmissionGuard] Already completed in this session');
    return true;
  }

  // Check localStorage for recent submission (30 second cooldown)
  try {
    const storageKey = `recent-submission-${key}`;
    const lastSubmission = localStorage.getItem(storageKey);

    if (!lastSubmission) return false;

    const timestamp = parseInt(lastSubmission, 10);
    const now = Date.now();
    const cooldownPeriod = 30 * 1000; // 30 seconds

    if (now - timestamp < cooldownPeriod) {
      console.log('[SubmissionGuard] Recent submission detected (cooldown active)');
      return true;
    }

    // Remove expired entry
    localStorage.removeItem(storageKey);
    return false;
  } catch (error) {
    console.error('[SubmissionGuard] Error checking recent submission:', error);
    return false;
  }
}

/**
 * ✅ SIMPLIFIED: Mark recent submission in localStorage
 */
export function markRecentSubmission(answers: Record<number, number | null>): void {
  try {
    const key = generateSubmissionKey(answers);
    const storageKey = `recent-submission-${key}`;
    localStorage.setItem(storageKey, Date.now().toString());
    console.log('[SubmissionGuard] Marked recent submission');
  } catch (error) {
    console.error('[SubmissionGuard] Error marking recent submission:', error);
  }
}
