'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import AssessmentLoadingPage from '../../components/assessment/AssessmentLoadingPage';
import { useAssessmentWorkflow } from '../../hooks/useAssessmentWorkflow';
import { WorkflowState } from '../../utils/assessment-workflow';
import { addToAssessmentHistory } from '../../utils/assessment-history';

export default function AssessmentLoadingPageRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const [answers, setAnswers] = useState<Record<number, number | null> | null>(null);
  const [assessmentName, setAssessmentName] = useState<string>('AI-Driven Talent Mapping');

  // Submission guard to prevent multiple submissions
  const submissionAttempted = useRef(false);
  const isSubmitting = useRef(false);

  // Track useEffect calls to detect multiple submissions
  const useEffectCallCount = useRef(0);

  // Get assessment workflow with static WebSocket preference
  const {
    state,
    isIdle,
    isProcessing,
    isCompleted,
    isFailed,
    canRetry,
    result,
    submitFromAnswers,
    cancel,
    reset,
    retry
  } = useAssessmentWorkflow({
    preferWebSocket: true, // Static preference - let workflow handle fallback
    onComplete: (result) => {
      console.log('Assessment completed successfully:', result);
      console.log(`Assessment Loading: Received result with ID: ${result.id}, navigating to /results/${result.id}`);
      isSubmitting.current = false;

      // Add to assessment history with duplicate prevention
      addToAssessmentHistory({
        id: Date.now(),
        nama: result.persona_profile?.title || "Assessment Lengkap",
        tipe: "Personality Assessment",
        tanggal: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        status: "Selesai",
        resultId: result.id
      });

      // Redirect to results
      setTimeout(() => {
        console.log(`Assessment Loading: Executing navigation to /results/${result.id}`);
        router.push(`/results/${result.id}`);
      }, 500);
    },
    onError: (error) => {
      console.error('Assessment failed:', error);
      isSubmitting.current = false;
      // Reset submission guard on error to allow retry
      submissionAttempted.current = false;

      // Show specific error message for different failure types
      if (error.message.includes('WebSocket')) {
        console.error('WebSocket connection error - assessment requires real-time connection');
      } else if (error.message.includes('timeout')) {
        console.error('Assessment timeout - server took too long to respond');
      } else if (error.message.includes('Analysis timeout')) {
        console.error('Analysis timeout - assessment processing took longer than expected');
      }
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

  // Auto-submit when answers are loaded and workflow is idle (with guards)
  // FIXED: Simplified approach to prevent multiple submissions
  useEffect(() => {
    useEffectCallCount.current += 1;
    console.log(`Assessment Loading: useEffect called (call #${useEffectCallCount.current}) - checking submission conditions...`);

    if (
      answers &&
      isIdle &&
      !isProcessing &&
      !isCompleted &&
      !isFailed &&
      !submissionAttempted.current &&
      !isSubmitting.current
    ) {
      console.log('Assessment Loading: Auto-submitting assessment with answers (FIXED: Single submission only):', Object.keys(answers).length, 'answers');
      console.log('Assessment Loading: Submission guards - submissionAttempted:', submissionAttempted.current, 'isSubmitting:', isSubmitting.current);

      submissionAttempted.current = true;
      isSubmitting.current = true;

      // Submit with a small delay to ensure all hooks are ready
      setTimeout(() => {
        console.log('Assessment Loading: Executing submitFromAnswers - this will call the actual API (FIXED: Direct call)');
        submitFromAnswers(answers, assessmentName);
      }, 100);
    } else {
      console.log('Assessment Loading: Auto-submit conditions not met:', {
        hasAnswers: !!answers,
        isIdle,
        isProcessing,
        isCompleted,
        isFailed,
        submissionAttempted: submissionAttempted.current,
        isSubmitting: isSubmitting.current
      });
    }
  }, [answers, isIdle, isProcessing, isCompleted, isFailed, assessmentName]); // Removed submitFromAnswers to prevent loops

  // Handle cancel
  const handleCancel = () => {
    cancel();
    isSubmitting.current = false;
    submissionAttempted.current = false;
    // Clear saved data
    localStorage.removeItem('assessment-answers');
    localStorage.removeItem('assessment-name');
    router.push('/assessment');
  };

  // Handle retry
  const handleRetry = async () => {
    console.log('Assessment Loading: Retrying assessment...');
    isSubmitting.current = false;
    submissionAttempted.current = false;

    try {
      // Use the built-in retry functionality if available
      if (canRetry) {
        await retry();
      } else if (answers) {
        // Fallback to manual retry
        reset();
        setTimeout(() => {
          submissionAttempted.current = true;
          isSubmitting.current = true;
          submitFromAnswers(answers, assessmentName);
        }, 500);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      // Reset guards to allow another retry attempt
      isSubmitting.current = false;
      submissionAttempted.current = false;
    }
  };

  // Handle back to assessment (for failed state)
  const handleBackToAssessment = () => {
    isSubmitting.current = false;
    submissionAttempted.current = false;
    // Clear saved data
    localStorage.removeItem('assessment-answers');
    localStorage.removeItem('assessment-name');
    router.push('/assessment');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSubmitting.current = false;
      submissionAttempted.current = false;
    };
  }, []);

  // Show loading while checking auth or loading answers
  if (authLoading || (!answers && !isFailed)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">
            {authLoading ? 'Memverifikasi autentikasi...' : 'Memuat data assessment...'}
          </p>
          {state.webSocketConnected && (
            <p className="text-sm text-green-600">✓ WebSocket terhubung</p>
          )}
          {state.webSocketConnected === false && state.useWebSocket !== undefined && (
            <p className="text-sm text-red-600">✗ WebSocket tidak terhubung</p>
          )}
        </div>
      </div>
    );
  }

  // If no answers found, redirect to assessment
  if (!answers && !isProcessing && !isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Data Assessment Tidak Ditemukan
          </h2>
          <p className="text-gray-600">
            Sepertinya Anda belum menyelesaikan assessment atau data telah hilang. 
            Silakan kembali ke halaman assessment untuk memulai.
          </p>
          <button
            onClick={handleBackToAssessment}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentLoadingPage
      workflowState={state}
      onCancel={isFailed ? handleBackToAssessment : handleCancel}
      onRetry={isFailed ? handleRetry : undefined}
    />
  );
}
