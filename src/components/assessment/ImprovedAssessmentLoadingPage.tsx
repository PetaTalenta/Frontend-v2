'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain,
  Sparkles,
  Target,
  ArrowLeft,
  Wifi,
  WifiOff
} from 'lucide-react';

interface AssessmentState {
  status: 'idle' | 'submitting' | 'monitoring' | 'completed' | 'failed';
  progress: number;
  message: string;
  jobId?: string;
  error?: string;
}

interface ImprovedAssessmentLoadingPageProps {
  workflowState: AssessmentState;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

interface LoadingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  minProgress: number;
  maxProgress: number;
}

const LOADING_STEPS: LoadingStep[] = [
  {
    id: 'submitting',
    title: 'Mengirim Assessment',
    description: 'Mengunggah jawaban ke server',
    icon: Target,
    minProgress: 0,
    maxProgress: 15
  },
  {
    id: 'queued',
    title: 'Antrian Proses',
    description: 'Menunggu slot analisis tersedia',
    icon: Clock,
    minProgress: 15,
    maxProgress: 30
  },
  {
    id: 'processing',
    title: 'Analisis AI',
    description: 'Menganalisis pola kepribadian dengan AI',
    icon: Brain,
    minProgress: 30,
    maxProgress: 80
  },
  {
    id: 'finalizing',
    title: 'Menyiapkan Hasil',
    description: 'Menyusun laporan komprehensif',
    icon: Sparkles,
    minProgress: 80,
    maxProgress: 100
  }
];

export default function ImprovedAssessmentLoadingPage({
  workflowState,
  onCancel,
  onRetry,
  className = ''
}: ImprovedAssessmentLoadingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update current step based on progress
  useEffect(() => {
    const step = LOADING_STEPS.findIndex(step => 
      workflowState.progress >= step.minProgress && workflowState.progress < step.maxProgress
    );
    if (step !== -1) {
      setCurrentStep(step);
    }
  }, [workflowState.progress]);

  // Track elapsed time
  useEffect(() => {
    if (workflowState.status === 'submitting' || workflowState.status === 'monitoring') {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [workflowState.status]);

  // Format elapsed time
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'submitting':
      case 'monitoring':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitting':
      case 'monitoring':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  // Handle failed state
  if (workflowState.status === 'failed') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6 ${className}`}>
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Assessment Gagal
              </h2>
              <p className="text-gray-600 text-sm">
                {workflowState.error || 'Terjadi kesalahan saat memproses assessment'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              )}
              
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle completed state
  if (workflowState.status === 'completed') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6 ${className}`}>
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Assessment Selesai!
              </h2>
              <p className="text-gray-600 text-sm">
                Hasil assessment Anda telah siap. Anda akan diarahkan ke halaman hasil.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Waktu proses: {formatElapsedTime(elapsedTime)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main loading state
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6 ${className}`}>
      <Card className="w-full max-w-lg shadow-xl">
        <CardContent className="p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 ${getStatusColor(workflowState.status)} rounded-full flex items-center justify-center mx-auto text-white`}>
              {getStatusIcon(workflowState.status)}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Memproses Assessment
              </h1>
              <p className="text-gray-600">
                {workflowState.message}
              </p>
            </div>

            {/* Job ID */}
            {workflowState.jobId && (
              <Badge variant="outline" className="text-xs">
                ID: {workflowState.jobId.slice(-8)}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round(workflowState.progress)}%</span>
            </div>
            <Progress value={workflowState.progress} className="h-3" />
          </div>

          {/* Current Step */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Langkah Saat Ini:</h3>
            
            {LOADING_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = workflowState.progress > step.maxProgress;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive ? 'bg-blue-50 border border-blue-200' : 
                    isCompleted ? 'bg-green-50 border border-green-200' : 
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-blue-500 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Waktu: {formatElapsedTime(elapsedTime)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Terhubung</span>
              </div>
            </div>

            {onCancel && (
              <Button 
                onClick={onCancel}
                variant="outline"
                className="w-full"
                disabled={workflowState.status === 'submitting'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Batalkan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
