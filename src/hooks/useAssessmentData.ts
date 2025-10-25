'use client';

// Re-export the context hook for centralized assessment data management
export { useAssessmentData, useAssessmentDataSelective } from '../contexts/AssessmentDataContext';

// Re-export the TanStack Query version for backward compatibility
export { useAssessmentResult } from './useAssessment';
export { useAssessmentList, useStaticData } from './useAssessment';
export { default } from './useAssessment';