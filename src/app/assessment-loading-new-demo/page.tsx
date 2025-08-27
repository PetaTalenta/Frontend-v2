'use client';

import React, { useState } from 'react';
import AssessmentLoadingPage from '../../components/assessment/AssessmentLoadingPage';
import { Button } from '../../components/ui/button';
import { WorkflowState } from '../../utils/assessment-workflow';

export default function AssessmentLoadingNewDemo() {
  const [currentStatus, setCurrentStatus] = useState<string>('processing');

  // Mock workflow state
  const mockWorkflowState: WorkflowState = {
    status: currentStatus as any,
    message: 'Menganalisis pola kepribadian Anda...',
    progress: 65,
    webSocketConnected: true,
    queuePosition: undefined,
    estimatedTimeRemaining: undefined,
    result: undefined
  };

  const statuses = [
    { id: 'validating', label: 'Validating' },
    { id: 'submitting', label: 'Submitting' },
    { id: 'queued', label: 'Queued' },
    { id: 'processing', label: 'Processing' },
    { id: 'generating', label: 'Generating' },
    { id: 'completed', label: 'Completed' },
    { id: 'failed', label: 'Failed' }
  ];

  const handleCancel = () => {
    console.log('Cancel clicked');
  };

  const handleRetry = () => {
    console.log('Retry clicked');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Controls */}
      <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="text-sm font-medium mb-3">Demo Controls</h3>
        <div className="space-y-2">
          {statuses.map((status) => (
            <Button
              key={status.id}
              variant={currentStatus === status.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentStatus(status.id)}
              className="w-full text-left justify-start"
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Assessment Loading Component */}
      <AssessmentLoadingPage
        workflowState={mockWorkflowState}
        onCancel={handleCancel}
        onRetry={handleRetry}
      />
    </div>
  );
}
