'use client';

// Re-export the context hook for centralized assessment data management
export { useAssessmentData, useAssessmentDataSelective, useAssessmentDataWithPrefetch } from '../contexts/AssessmentDataContext';

// Re-export the prefetch hooks for Phase 2 implementation
export { useAssessmentPrefetch, useAssessmentPrefetchByType } from './useAssessmentPrefetch';

// Re-export the TanStack Query version for backward compatibility
export { useAssessmentResult } from './useAssessment';
export { useAssessmentList, useStaticData } from './useAssessment';
export { default } from './useAssessment';