'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Clock,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { WorkflowState } from '../../utils/assessment-workflow';

interface AssessmentLoadingPageProps {
  workflowState: WorkflowState;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

interface LoadingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  estimatedTime: number; // in seconds
}

const LOADING_STEPS: LoadingStep[] = [
  {
    id: 'validating',
    title: 'Memvalidasi Jawaban',
    description: 'Memeriksa kelengkapan dan konsistensi jawaban Anda',
    icon: CheckCircle,
    estimatedTime: 2
  },
  {
    id: 'submitting',
    title: 'Mengirim Data',
    description: 'Mengirim data assessment ke sistem AI',
    icon: Activity,
    estimatedTime: 3
  },
  {
    id: 'queued',
    title: 'Dalam Antrian',
    description: 'Menunggu giliran untuk diproses oleh AI',
    icon: Users,
    estimatedTime: 10
  },
  {
    id: 'processing',
    title: 'Analisis AI',
    description: 'AI sedang menganalisis kepribadian dan bakat Anda',
    icon: Brain,
    estimatedTime: 30
  },
  {
    id: 'generating',
    title: 'Membuat Profil',
    description: 'Menyusun profil talenta dan rekomendasi karir',
    icon: Sparkles,
    estimatedTime: 15
  }
];

export default function AssessmentLoadingPage({
  workflowState,
  onCancel,
  onRetry,
  className = ''
}: AssessmentLoadingPageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);



  // Update current step based on workflow status
  useEffect(() => {
    const stepIndex = LOADING_STEPS.findIndex(step => step.id === workflowState.status);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [workflowState.status]);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'processing':
      case 'queued':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressValue = () => {
    if (workflowState.progress !== undefined) {
      return workflowState.progress;
    }
    
    // Calculate progress based on current step
    const baseProgress = (currentStepIndex / LOADING_STEPS.length) * 100;
    const stepProgress = (elapsedTime % 10) * 2; // Simulate progress within step
    return Math.min(baseProgress + stepProgress, 95);
  };

  const currentStep = LOADING_STEPS[currentStepIndex];
  const isCompleted = workflowState.status === 'completed';
  const isFailed = workflowState.status === 'failed';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            {/* Enhanced CSS Animation */}
            <div className="relative">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
              </div>

              {/* Middle pulsing circle */}
              <div className="absolute inset-2 animate-pulse">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-purple-600" />
                </div>
              </div>

              {/* Inner bouncing sparkles */}
              <div className="absolute inset-6 animate-bounce" style={{ animationDuration: '2s' }}>
                <div className="w-12 h-12 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
              </div>

              {/* Floating books */}
              <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {isCompleted ? 'Assessment Selesai!' : 
             isFailed ? 'Terjadi Kesalahan' : 
             'Sedang Memproses Assessment Anda'}
          </h1>
          
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {isCompleted ? 'Hasil assessment Anda telah siap. Kami akan mengarahkan Anda ke halaman hasil.' :
             isFailed ? 'Terjadi kesalahan saat memproses assessment Anda. Silakan coba lagi.' :
             'AI kami sedang menganalisis jawaban Anda untuk memberikan insight yang mendalam tentang kepribadian dan bakat Anda.'}
          </p>
        </div>

        {/* Connection Status */}
        {(workflowState.useWebSocket !== undefined) && (
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-3">
                {workflowState.useWebSocket ? (
                  <>
                    {workflowState.webSocketConnected ? (
                      <>
                        <Zap className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-green-700">
                          Real-time Connection Active
                        </span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          WebSocket
                        </Badge>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium text-orange-700">
                          Connecting to Real-time Updates...
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Wifi className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      Standard Connection
                    </span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Polling
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Status Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 space-y-6">

            {/* Current Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentStep && (
                  <>
                    <div className={`p-3 rounded-xl ${getStatusColor(workflowState.status)}`}>
                      <currentStep.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {currentStep.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {workflowState.message || currentStep.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <Badge variant="secondary" className="text-sm">
                {formatTime(elapsedTime)}
              </Badge>
            </div>

            {/* Progress Bar */}
            {!isCompleted && !isFailed && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{Math.round(getProgressValue())}%</span>
                </div>
                <Progress value={getProgressValue()} className="h-2" />
              </div>
            )}

            {/* Queue Information */}
            {workflowState.queuePosition && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Posisi dalam antrian: #{workflowState.queuePosition}
                    </p>
                    {workflowState.estimatedTimeRemaining && (
                      <p className="text-xs text-blue-700">
                        Estimasi waktu: {workflowState.estimatedTimeRemaining}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {isFailed && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      Assessment gagal diproses
                    </p>
                    <p className="text-xs text-red-700">
                      {workflowState.message || 'Terjadi kesalahan yang tidak diketahui'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isFailed && onRetry && (
                <Button onClick={onRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              )}
              
              {onCancel && !isCompleted && (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className={isFailed ? "flex-1" : "w-full"}
                >
                  {isFailed ? 'Kembali' : 'Batalkan'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing Steps */}
        {!isCompleted && !isFailed && (
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Tahapan Proses
              </h4>
              
              <div className="space-y-3">
                {LOADING_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  const isPending = index > currentStepIndex;
                  
                  return (
                    <div 
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive ? 'bg-blue-50 border border-blue-200' :
                        isCompleted ? 'bg-green-50 border border-green-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-blue-100 text-blue-600' :
                        isCompleted ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-blue-900' :
                          isCompleted ? 'text-green-900' :
                          'text-gray-600'
                        }`}>
                          {step.title}
                        </p>
                        <p className={`text-xs ${
                          isActive ? 'text-blue-700' :
                          isCompleted ? 'text-green-700' :
                          'text-gray-500'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      
                      {isActive && (
                        <Badge variant="secondary" className="text-xs">
                          ~{step.estimatedTime}s
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {!isCompleted && !isFailed && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Tahukah Anda?
                  </h4>
                  <p className="text-sm text-gray-700">
                    AI kami menganalisis lebih dari 200 parameter kepribadian untuk memberikan 
                    insight yang akurat tentang bakat dan potensi karir Anda. Proses ini membutuhkan 
                    waktu beberapa menit untuk hasil yang optimal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
