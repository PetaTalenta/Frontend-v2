'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import AssessmentLoadingPage from '../../components/assessment/AssessmentLoadingPage';
import { useAssessment } from '../../hooks/useAssessment';
// import { addToAssessmentHistory } from '../../utils/assessment-history';
import { hasRecentSubmission, markRecentSubmission } from '../../utils/submission-guard';
// NOTE: Local assessment-history utilities are deprecated for dashboard usage.

export default function AssessmentLoadingPageRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const [answers, setAnswers] = useState<Record<number, number | null> | null>(null);
  const [assessmentName, setAssessmentName] = useState<string>('AI-Driven Talent Mapping');

  // ✅ SIMPLIFIED: Single submission guard
  const submissionAttempted = useRef(false);

  // Get assessment hook with simplified interface
  const {
    state,
    isIdle,
    isSubmitting: isProcessing,
    isCompleted,
    isFailed,
    result,
    submitFromAnswers,
    reset,
    cancel
  } = useAssessment({
    preferWebSocket: true,
    onComplete: (result) => {
      console.log(`[AssessmentLoading] ✅ Completed: ${result.id}`);

      // Clear saved answers to prevent re-submission
      try {
        localStorage.removeItem('assessment-answers');
        localStorage.removeItem('assessment-name');
        localStorage.removeItem('assessment-submission-time');
      } catch (e) {
        console.warn('[AssessmentLoading] Failed to clear saved answers:', e);
      }

      // Navigate to results
      setTimeout(() => {
        router.push(`/results/${result.id}`);
      }, 500);
    },
    onError: (error) => {
      console.error('[AssessmentLoading] ❌ Failed:', error);
      // Reset guard to allow retry
      submissionAttempted.current = false;
    },
    onTokenBalanceUpdate: async () => {
      console.log('Token balance updated');
    }
  });

  // Note: Using useCallback approach instead of useRef for better stability

  // Load answers from localStorage or URL params on mount
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    // Try to get answers from localStorage first
    const savedAnswers = localStorage.getItem('assessment-answers');
    if (savedAnswers) {
      try {
        const parsedAnswers = JSON.parse(savedAnswers);
        setAnswers(parsedAnswers);
        
        // Get assessment name from localStorage if available
        const savedAssessmentName = localStorage.getItem('assessment-name');
        if (savedAssessmentName) {
          setAssessmentName(savedAssessmentName);
        }
      } catch (error) {
        console.error('Error parsing saved answers:', error);
      }
    }

    // Check URL params for answers (fallback)
    const answersParam = searchParams.get('answers');
    const nameParam = searchParams.get('name');
    
    if (answersParam && !savedAnswers) {
      try {
        const parsedAnswers = JSON.parse(decodeURIComponent(answersParam));
        setAnswers(parsedAnswers);
      } catch (error) {
        console.error('Error parsing answers from URL:', error);
      }
    }

    if (nameParam) {
      setAssessmentName(nameParam);
    }
  }, [authLoading, isAuthenticated, router, searchParams]);

  // ✅ SIMPLIFIED: Auto-submit when answers are loaded
  useEffect(() => {
    if (!answers) return;

    // Check for recent submission (cooldown)
    if (hasRecentSubmission(answers)) {
      console.log('[AssessmentLoading] Recent submission detected, skipping auto-submit');
      submissionAttempted.current = true;
      return;
    }

    // Check if ready to submit
    if (isIdle && !isProcessing && !isCompleted && !isFailed && !submissionAttempted.current) {
      console.log('[AssessmentLoading] Auto-submitting assessment...');

      submissionAttempted.current = true;
      markRecentSubmission(answers);

      // Submit with small delay for hooks to stabilize
      setTimeout(() => {
        submitFromAnswers(answers, assessmentName);
      }, 100);
    }
  }, [answers, isIdle, isProcessing, isCompleted, isFailed, assessmentName, submitFromAnswers]);

  // ✅ SIMPLIFIED: Handle cancel
  const handleCancel = () => {
    cancel();
    submissionAttempted.current = false;
    localStorage.removeItem('assessment-answers');
    localStorage.removeItem('assessment-name');
    router.push('/assessment');
  };

  // ✅ SIMPLIFIED: Handle retry
  const handleRetry = async () => {
    console.log('[AssessmentLoading] Retrying assessment...');
    submissionAttempted.current = false;

    if (answers) {
      reset();
      setTimeout(() => {
        submissionAttempted.current = true;
        submitFromAnswers(answers, assessmentName);
      }, 500);
    }
  };

  // Handle back to assessment (for failed state)
  const handleBackToAssessment = () => {
    submissionAttempted.current = false;
    // Clear saved data
    localStorage.removeItem('assessment-answers');
    localStorage.removeItem('assessment-name');
    router.push('/dashboard');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      submissionAttempted.current = false;
    };
  }, []);

  // Show loading while checking auth or loading answers
  if (authLoading || (!answers && !isFailed)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-sm">
            {authLoading ? 'Memverifikasi autentikasi...' : 'Memuat data assessment...'}
          </p>

        </div>
      </div>
    );
  }

  // If no answers found, redirect to assessment
  if (!answers && !isProcessing && !isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Data Assessment Tidak Ditemukan
          </h2>
          <p className="text-gray-600 text-sm">
            Sepertinya Anda belum menyelesaikan assessment atau data telah hilang.
            Silakan kembali ke halaman assessment untuk memulai.
          </p>
          <button
            onClick={handleBackToAssessment}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Kembali ke Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentLoadingPage
      workflowState={{
        status: state.status,
        progress: state.progress,
        message: state.message,
        jobId: state.jobId,
        error: state.error
      }}
      onCancel={isFailed ? handleBackToAssessment : handleCancel}
      onRetry={isFailed ? handleRetry : undefined}
    />
  );
}
