/**
 * ⚠️ DEPRECATED: Use useAssessmentUnified instead
 *
 * This file is maintained for backward compatibility only.
 * All functionality has been consolidated into useAssessmentUnified.
 *
 * Migration guide:
 * - Replace: import { useAssessment } from './hooks/useAssessment'
 * - With: import { useAssessmentUnified as useAssessment } from './hooks/useAssessmentUnified'
 */

import { useAssessmentUnified, UseAssessmentOptions, UseAssessmentReturn } from './useAssessmentUnified';

/**
 * @deprecated Use useAssessmentUnified instead
 */
export function useAssessment(options: UseAssessmentOptions = {}): UseAssessmentReturn {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] useAssessment from hooks/useAssessment.ts is deprecated. ' +
      'Please use useAssessmentUnified from hooks/useAssessmentUnified.ts instead. ' +
      'This will be removed in the next major version.'
    );
  }

  return useAssessmentUnified(options);
}

export type { UseAssessmentOptions, UseAssessmentReturn };

export default useAssessment;
