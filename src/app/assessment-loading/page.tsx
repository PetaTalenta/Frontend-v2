'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AssessmentLoadingPage from '@/components/assessment/AssessmentLoadingPage';

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
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    status: 'processing',
    progress: 0,
    message: 'Memproses assessment Anda...',
  });

  // Simulate progress updates
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setWorkflowState(prev => {
        const newProgress = Math.min(prev.progress + Math.random() * 15, 95);
        
        // Update status based on progress
        let newStatus = prev.status;
        let newMessage = prev.message;
        
        if (newProgress >= 80) {
          newStatus = 'processing';
          newMessage = 'Menganalisis hasil assessment...';
        } else if (newProgress >= 60) {
          newStatus = 'processing';
          newMessage = 'Memproses data assessment...';
        } else if (newProgress >= 30) {
          newStatus = 'queued';
          newMessage = 'Assessment dalam antrian...';
        } else {
          newStatus = 'submitting';
          newMessage = 'Mengirim assessment ke server...';
        }
        
        return {
          ...prev,
          progress: newProgress,
          status: newStatus,
          message: newMessage,
        };
      });
    }, 1000);

    // Simulate completion after 10 seconds
    const completionTimeout = setTimeout(() => {
      setWorkflowState({
        status: 'completed',
        progress: 100,
        message: 'Assessment berhasil diproses!',
        result: { id: 'dummy-result-id' }
      });
      
      // Redirect to results after 2 seconds
      setTimeout(() => {
        router.push('/results/dummy-result-id');
      }, 2000);
    }, 10000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimeout);
    };
  }, [router]);

  const handleCancel = () => {
    // Dummy cancel function
    console.log('Cancel assessment processing');
    router.push('/dashboard');
  };

  const handleRetry = () => {
    // Dummy retry function
    console.log('Retry assessment processing');
    setWorkflowState({
      status: 'processing',
      progress: 0,
      message: 'Memproses assessment Anda...',
    });
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

