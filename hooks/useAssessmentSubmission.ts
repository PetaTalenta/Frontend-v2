/**
 * Hook for handling assessment submission with loading page integration
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseAssessmentSubmissionOptions {
  /**
   * Whether to redirect to loading page automatically
   * @default true
   */
  autoRedirect?: boolean;
  
  /**
   * Custom assessment name
   * @default 'AI-Driven Talent Mapping'
   */
  assessmentName?: string;
  
  /**
   * Callback when submission starts
   */
  onSubmissionStart?: () => void;
  
  /**
   * Callback when submission fails before redirect
   */
  onSubmissionError?: (error: Error) => void;
}

export function useAssessmentSubmission(options: UseAssessmentSubmissionOptions = {}) {
  const router = useRouter();
  
  const {
    autoRedirect = true,
    assessmentName = 'AI-Driven Talent Mapping',
    onSubmissionStart,
    onSubmissionError
  } = options;

  /**
   * Submit assessment and redirect to loading page
   */
  const submitAssessment = useCallback(async (
    answers: Record<number, number | null>,
    customAssessmentName?: string
  ) => {
    try {
      const finalAssessmentName = customAssessmentName || assessmentName;
      
      // Validate answers
      if (!answers || Object.keys(answers).length === 0) {
        throw new Error('No answers provided');
      }

      // Check if all required questions are answered
      const unansweredQuestions = Object.entries(answers)
        .filter(([_, answer]) => answer === null || answer === undefined)
        .map(([questionId]) => questionId);

      if (unansweredQuestions.length > 0) {
        throw new Error(`Please answer all questions. Missing: ${unansweredQuestions.join(', ')}`);
      }

      // Call submission start callback
      if (onSubmissionStart) {
        onSubmissionStart();
      }

      // Save answers and assessment name to localStorage for the loading page
      localStorage.setItem('assessment-answers', JSON.stringify(answers));
      localStorage.setItem('assessment-name', finalAssessmentName);
      
      // Save submission timestamp
      localStorage.setItem('assessment-submission-time', new Date().toISOString());

      if (autoRedirect) {
        // Redirect to loading page
        router.push('/assessment-loading');
      }

      return true;
    } catch (error) {
      console.error('Assessment submission error:', error);
      
      if (onSubmissionError) {
        onSubmissionError(error as Error);
      }
      
      return false;
    }
  }, [router, autoRedirect, assessmentName, onSubmissionStart, onSubmissionError]);

  /**
   * Submit assessment with URL parameters (alternative method)
   */
  const submitAssessmentWithParams = useCallback(async (
    answers: Record<number, number | null>,
    customAssessmentName?: string
  ) => {
    try {
      const finalAssessmentName = customAssessmentName || assessmentName;
      
      // Validate answers
      if (!answers || Object.keys(answers).length === 0) {
        throw new Error('No answers provided');
      }

      // Call submission start callback
      if (onSubmissionStart) {
        onSubmissionStart();
      }

      // Create URL with parameters
      const params = new URLSearchParams({
        answers: encodeURIComponent(JSON.stringify(answers)),
        name: finalAssessmentName
      });

      if (autoRedirect) {
        // Redirect to loading page with parameters
        router.push(`/assessment-loading?${params.toString()}`);
      }

      return true;
    } catch (error) {
      console.error('Assessment submission error:', error);
      
      if (onSubmissionError) {
        onSubmissionError(error as Error);
      }
      
      return false;
    }
  }, [router, autoRedirect, assessmentName, onSubmissionStart, onSubmissionError]);

  /**
   * Check if there's a pending assessment submission
   */
  const hasPendingSubmission = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const savedAnswers = localStorage.getItem('assessment-answers');
    const submissionTime = localStorage.getItem('assessment-submission-time');
    
    if (!savedAnswers || !submissionTime) return false;
    
    // Check if submission is recent (within last hour)
    const submissionDate = new Date(submissionTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < 1;
  }, []);

  /**
   * Clear pending submission data
   */
  const clearPendingSubmission = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('assessment-answers');
    localStorage.removeItem('assessment-name');
    localStorage.removeItem('assessment-submission-time');
  }, []);

  /**
   * Get pending submission data
   */
  const getPendingSubmission = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedAnswers = localStorage.getItem('assessment-answers');
      const savedName = localStorage.getItem('assessment-name');
      const submissionTime = localStorage.getItem('assessment-submission-time');
      
      if (!savedAnswers) return null;
      
      return {
        answers: JSON.parse(savedAnswers),
        assessmentName: savedName || assessmentName,
        submissionTime: submissionTime ? new Date(submissionTime) : null
      };
    } catch (error) {
      console.error('Error getting pending submission:', error);
      return null;
    }
  }, [assessmentName]);

  /**
   * Resume pending submission (redirect to loading page)
   */
  const resumePendingSubmission = useCallback(() => {
    if (hasPendingSubmission()) {
      router.push('/assessment-loading');
      return true;
    }
    return false;
  }, [hasPendingSubmission, router]);

  return {
    submitAssessment,
    submitAssessmentWithParams,
    hasPendingSubmission,
    clearPendingSubmission,
    getPendingSubmission,
    resumePendingSubmission
  };
}
