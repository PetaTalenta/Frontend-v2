'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ImprovedAssessmentLoadingPage from '../../components/assessment/ImprovedAssessmentLoadingPage';
// Note: WorkflowState and WorkflowStatus types need to be updated for the new consolidated service

const DEMO_STATUSES: { status: WorkflowStatus; label: string; description: string }[] = [
  {
    status: 'validating',
    label: 'Validating',
    description: 'Memvalidasi jawaban assessment'
  },
  {
    status: 'submitting',
    label: 'Submitting',
    description: 'Mengirim data ke server'
  },
  {
    status: 'queued',
    label: 'Queued',
    description: 'Dalam antrian untuk diproses'
  },
  {
    status: 'processing',
    label: 'Processing',
    description: 'AI sedang menganalisis data'
  },
  {
    status: 'completed',
    label: 'Completed',
    description: 'Assessment selesai diproses'
  },
  {
    status: 'failed',
    label: 'Failed',
    description: 'Terjadi kesalahan dalam proses'
  }
];

export default function AssessmentLoadingDemoPage() {
  const router = useRouter();
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [queuePosition, setQueuePosition] = useState<number | undefined>(3);
  const [estimatedTime, setEstimatedTime] = useState<string | undefined>('2 menit');

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentStatusIndex(prev => {
        if (prev >= DEMO_STATUSES.length - 1) {
          setIsAutoPlay(false);
          return 0;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  // Update progress based on status
  useEffect(() => {
    const status = DEMO_STATUSES[currentStatusIndex].status;
    
    switch (status) {
      case 'validating':
        setProgress(10);
        setQueuePosition(undefined);
        setEstimatedTime(undefined);
        break;
      case 'submitting':
        setProgress(25);
        setQueuePosition(undefined);
        setEstimatedTime(undefined);
        break;
      case 'queued':
        setProgress(35);
        setQueuePosition(3);
        setEstimatedTime('2 menit');
        break;
      case 'processing':
        setProgress(75);
        setQueuePosition(undefined);
        setEstimatedTime('1 menit');
        break;
      case 'completed':
        setProgress(100);
        setQueuePosition(undefined);
        setEstimatedTime(undefined);
        break;
      case 'failed':
        setProgress(45);
        setQueuePosition(undefined);
        setEstimatedTime(undefined);
        break;
      default:
        setProgress(0);
    }
  }, [currentStatusIndex]);

  const currentStatus = DEMO_STATUSES[currentStatusIndex];

  // Create mock workflow state
  const mockWorkflowState: WorkflowState = {
    status: currentStatus.status,
    progress,
    message: currentStatus.description,
    queuePosition,
    estimatedTimeRemaining: estimatedTime,
    jobId: 'demo-job-123',
    result: undefined
  };

  const handleStatusChange = (index: number) => {
    setCurrentStatusIndex(index);
    setIsAutoPlay(false);
  };

  const handleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
    if (!isAutoPlay) {
      setCurrentStatusIndex(0);
    }
  };

  const handleReset = () => {
    setIsAutoPlay(false);
    setCurrentStatusIndex(0);
  };

  const handleCancel = () => {
    console.log('Demo: Cancel clicked');
  };

  const handleRetry = () => {
    console.log('Demo: Retry clicked');
    setCurrentStatusIndex(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Assessment Loading Page Demo
                </h1>
                <p className="text-sm text-gray-600">
                  Preview halaman loading dengan animasi CSS untuk proses assessment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoPlay}
                className="flex items-center gap-2"
              >
                {isAutoPlay ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Auto Play
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Demo Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Demo Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Status Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Status Assessment
                </h4>
                <div className="space-y-2">
                  {DEMO_STATUSES.map((status, index) => (
                    <button
                      key={status.status}
                      onClick={() => handleStatusChange(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        index === currentStatusIndex
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{status.label}</p>
                          <p className="text-xs text-gray-600">{status.description}</p>
                        </div>
                        {index === currentStatusIndex && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current State Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Current State
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{currentStatus.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  {queuePosition && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Queue:</span>
                      <span className="font-medium">#{queuePosition}</span>
                    </div>
                  )}
                  {estimatedTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ETA:</span>
                      <span className="font-medium">{estimatedTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto Play Status */}
              {isAutoPlay && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-800 font-medium">
                      Auto Play Active
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Status akan berubah otomatis setiap 3 detik
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loading Page Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Loading Page Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
                <AssessmentLoadingPage
                  workflowState={mockWorkflowState}
                  onCancel={handleCancel}
                  onRetry={currentStatus.status === 'failed' ? handleRetry : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
