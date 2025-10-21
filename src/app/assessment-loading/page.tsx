'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AssessmentLoadingPage from '@/components/assessment/AssessmentLoadingPage';
import apiService from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

interface WorkflowState {
  status: 'idle' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  jobId?: string;
  error?: string;
  result?: any;
}

export default function AssessmentLoadingPageRoute() {
  const router = useRouter();
  const { token } = useAuth();
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    status: 'submitting',
    progress: 0,
    message: 'Memproses assessment Anda...',
  });
  const [minimumLoadingTimePassed, setMinimumLoadingTimePassed] = useState(false);

  // Minimum loading time to ensure user sees the loading page
  const MINIMUM_LOADING_TIME = 3000; // 3 seconds

  // Monitor assessment status
  const monitorAssessmentStatus = useCallback(async (jobId: string) => {
    try {
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes with 5-second intervals
      const pollInterval = 5000; // 5 seconds

      while (attempts < maxAttempts) {
        try {
          // Use axiosInstance directly from apiService
          const response = await apiService.axiosInstance.get(
            `/api/assessment/status/${jobId}`,
            { timeout: 10000 }
          );

          if (response?.data) {
            const { status, progress, message, result } = response.data;

            setWorkflowState(prev => ({
              ...prev,
              status: status || prev.status,
              progress: progress || prev.progress,
              message: message || prev.message,
              result: result || prev.result,
            }));

            // If completed, wait for minimum loading time before redirect
            if (status === 'completed' && result?.id) {
              // Wait for both minimum loading time and then redirect
              const waitForMinimumTime = () => {
                if (minimumLoadingTimePassed) {
                  setTimeout(() => {
                    router.push(`/results/${result.id}`);
                  }, 2000);
                } else {
                  // Wait a bit more and check again
                  setTimeout(waitForMinimumTime, 500);
                }
              };
              waitForMinimumTime();
              return;
            }

            // If failed, show error
            if (status === 'failed') {
              setWorkflowState(prev => ({
                ...prev,
                status: 'failed',
                error: message || 'Assessment processing failed',
              }));
              return;
            }
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (error) {
          console.error('Error checking assessment status:', error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }

      // Timeout after max attempts
      setWorkflowState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Assessment processing timeout. Please check your dashboard for status.',
      }));
    } catch (error) {
      console.error('Error monitoring assessment:', error);
      setWorkflowState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Failed to monitor assessment status',
      }));
    }
  }, [router, minimumLoadingTimePassed]);

  // Initialize monitoring on mount
  useEffect(() => {
    if (!token) {
      router.push('/auth');
      return;
    }

    // Check if we're in submission mode or monitoring mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode'); // 'submit' (legacy) or 'monitor' (new)

    if (mode === 'submit') {
      // Legacy mode: Handle submission from loading page
      handleSubmissionMode();
    } else if (mode === 'monitor') {
      // New mode: Submission already started in sidebar, just monitor
      handleMonitoringMode();
    } else {
      // Default: Try monitoring mode
      handleMonitoringMode();
    }

    // Start minimum loading timer
    const minimumLoadingTimer = setTimeout(() => {
      setMinimumLoadingTimePassed(true);
    }, MINIMUM_LOADING_TIME);

    // Cleanup
    return () => {
      clearTimeout(minimumLoadingTimer);
      // Optional: cancel any pending requests
    };
  }, [token, router]);

  // Handle submission mode (new assessment submission)
  const handleSubmissionMode = async () => {
    try {
      // Get submission data from sessionStorage
      const submissionDataStr = sessionStorage.getItem('assessment-submission-data');
      if (!submissionDataStr) {
        console.error('No submission data found');
        setWorkflowState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Data assessment tidak ditemukan. Silakan coba lagi.',
        }));
        return;
      }

      const submissionData = JSON.parse(submissionDataStr);
      const { answers, assessmentName } = submissionData;

      // Clear the submission data immediately
      sessionStorage.removeItem('assessment-submission-data');

      // Start submission process
      setWorkflowState(prev => ({
        ...prev,
        status: 'submitting',
        progress: 0,
        message: 'Mengirim assessment ke server...',
      }));

      // Submit assessment with progress tracking
      const result = await apiService.processAssessmentUnified(answers, assessmentName, {
        onProgress: (status: any) => {
          console.log('Submission progress:', status);

          // Save jobId when available
          if (status?.data?.jobId) {
            localStorage.setItem('assessment-job-id', status.data.jobId);
          }

          setWorkflowState(prev => ({
            ...prev,
            status: 'submitting',
            progress: status?.data?.progress || prev.progress,
            message: status?.data?.message || 'Memproses assessment...',
            jobId: status?.data?.jobId || prev.jobId,
          }));
        },
        onError: (error: any) => {
          console.error('Submission error:', error);
          setWorkflowState(prev => ({
            ...prev,
            status: 'failed',
            error: error.message || 'Gagal mengirim assessment',
          }));
        },
        preferWebSocket: true,
      });

      if (result) {
        // Submission successful, switch to monitoring mode
        setWorkflowState(prev => ({
          ...prev,
          status: 'queued',
          progress: 10,
          message: 'Assessment dalam antrian...',
        }));

        // Start monitoring the submitted assessment
        const jobId = localStorage.getItem('assessment-job-id');
        if (jobId) {
          monitorAssessmentStatus(jobId);
        } else {
          throw new Error('Job ID tidak ditemukan setelah submission');
        }
      }

    } catch (error: any) {
      console.error('Submission mode error:', error);
      setWorkflowState(prev => ({
        ...prev,
        status: 'failed',
        error: error.message || 'Gagal memproses assessment',
      }));
    }
  };

  // Handle monitoring mode (existing behavior)
  const handleMonitoringMode = () => {
    // Get result ID from localStorage (saved after submission)
    const resultId = typeof window !== 'undefined'
      ? localStorage.getItem('assessment-job-id') ||
        new URLSearchParams(window.location.search).get('resultId')
      : null;

    if (!resultId) {
      // No result ID found, redirect to assessment
      router.push('/assessment');
      return;
    }

    // Start monitoring
    monitorAssessmentStatus(resultId);
  };

  const handleCancel = () => {
    // Clear job ID and redirect to dashboard
    if (typeof window !== 'undefined') {
      localStorage.removeItem('assessment-job-id');
    }
    router.push('/dashboard');
  };

  const handleRetry = () => {
    // Retry by going back to assessment
    router.push('/assessment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <AssessmentLoadingPage
        workflowState={workflowState}
        onCancel={handleCancel}
        onRetry={handleRetry}
      />
    </div>
  );
}

