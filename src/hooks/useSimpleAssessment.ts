/**
 * ⚠️ DEPRECATED: Use useAssessmentUnified instead
 *
 * This file is maintained for backward compatibility only.
 * All functionality has been consolidated into useAssessmentUnified.
 *
 * Migration guide:
 * - Replace: import { useSimpleAssessment } from './hooks/useSimpleAssessment'
 * - With: import { useAssessmentUnified as useSimpleAssessment } from './hooks/useAssessmentUnified'
 */

import { useAssessmentUnified, UseAssessmentOptions, UseAssessmentReturn } from './useAssessmentUnified';
import type { AssessmentResult, AssessmentScores } from '../types/assessment-results';

export interface SimpleAssessmentOptions extends UseAssessmentOptions {
  onProgress?: (status: any) => void;
}

/**
 * @deprecated Use useAssessmentUnified instead
 */
export function useSimpleAssessment(options: SimpleAssessmentOptions = {}) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] useSimpleAssessment is deprecated. ' +
      'Please use useAssessmentUnified instead. ' +
      'This will be removed in the next major version.'
    );
  }

  const unified = useAssessmentUnified(options);

  // Map unified return to simple assessment interface for backward compatibility
  return {
    status: unified.state.status,
    progress: unified.state.progress,
    message: unified.state.message,
    error: unified.state.error,
    result: unified.result,
    jobId: unified.jobId,
    isActive: unified.isActive,
    isIdle: unified.isIdle,
    canRetry: unified.canRetry,
    formattedElapsedTime: unified.formattedElapsedTime,
    submitAssessment: unified.submitFromAnswers,
    retry: (scores: AssessmentScores) => unified.submitFromAnswers(scores),
    reset: unified.reset,
  };
}

export type { SimpleAssessmentOptions };
