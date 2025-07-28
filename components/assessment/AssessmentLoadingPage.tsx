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
import AssessmentCompletionScreen from './AssessmentCompletionScreen';
import AssessmentQueueStatus from './AssessmentQueueStatus';
import AssessmentErrorScreen from './AssessmentErrorScreen';

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

  // Show completion screen when assessment is completed
  if (isCompleted) {
    return (
      <AssessmentCompletionScreen
        personaTitle={workflowState.result?.persona_profile?.title || "Profil Kepribadian Anda"}
        processingTime={elapsedTime}
        isRedirecting={true}
        className={className}
      />
    );
  }

  // Show error screen when failed
  if (isFailed) {
    return (
      <AssessmentErrorScreen
        errorMessage={workflowState.message || "Terjadi kesalahan saat memproses assessment Anda."}
        onRetry={onRetry}
        onCancel={onCancel}
        isConnected={workflowState.webSocketConnected}
        processingTime={elapsedTime}
        className={className}
      />
    );
  }

  // Show queue status when in queue
  if (workflowState.status === 'queued' && workflowState.queuePosition) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 ${className}`}>
        <div className="w-full max-w-2xl">
          <AssessmentQueueStatus
            queuePosition={workflowState.queuePosition}
            estimatedTime={workflowState.estimatedTimeRemaining}
            isConnected={workflowState.webSocketConnected}
            currentStep="Dalam Antrian"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-6">
          {/* Success Animation for Completed State */}
          {isCompleted ? (
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <div className="relative">
                {/* Success checkmark with celebration animation */}
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>

                {/* Celebration sparkles */}
                <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="absolute -top-2 -left-2 animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 animate-bounce" style={{ animationDelay: '0.8s' }}>
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </div>
          ) : isFailed ? (
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <XCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              {isCompleted ? 'Assessment Selesai!' :
               isFailed ? 'Terjadi Kesalahan' :
               'Sedang Memproses Assessment Anda'}
            </h1>

            <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
              {isCompleted ? 'Hasil assessment Anda telah siap. Kami akan mengarahkan Anda ke halaman hasil.' :
               isFailed ? 'Terjadi kesalahan saat memproses assessment Anda. Silakan coba lagi.' :
               'AI kami sedang menganalisis jawaban Anda untuk memberikan insight yang mendalam tentang kepribadian dan bakat Anda.'}
            </p>
          </div>
        </div>



        {/* Main Status Card - Only for processing states */}
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

            {/* Progress Bar - Enhanced for processing state */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Progress</span>
                <span className="font-semibold text-blue-600">{Math.round(getProgressValue())}%</span>
              </div>
              <div className="relative">
                <Progress value={getProgressValue()} className="h-3 bg-gray-200" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Estimasi waktu tersisa: {currentStep ? `${currentStep.estimatedTime - (elapsedTime % currentStep.estimatedTime)} detik` : 'Menghitung...'}
              </p>
            </div>

            {/* Action Buttons - Only cancel for processing */}
            {onCancel && (
              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="w-full border-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  Batalkan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Steps - Enhanced Design */}
        {!isCompleted && !isFailed && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-gray-700" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Tahapan Proses Assessment
                </h4>
              </div>

              <div className="space-y-4">
                {LOADING_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isStepCompleted = index < currentStepIndex;
                  const isPending = index > currentStepIndex;

                  return (
                    <div
                      key={step.id}
                      className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                        isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md' :
                        isStepCompleted ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' :
                        'bg-gray-50 border border-gray-200 opacity-60'
                      }`}
                    >
                      {/* Step Number & Icon */}
                      <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl ${
                        isActive ? 'bg-blue-500 text-white shadow-lg' :
                        isStepCompleted ? 'bg-green-500 text-white' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {isStepCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : isActive ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <step.icon className="w-6 h-6" />
                        )}

                        {/* Step number badge */}
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          isActive ? 'bg-blue-600 text-white' :
                          isStepCompleted ? 'bg-green-600 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className={`font-semibold ${
                            isActive ? 'text-blue-900' :
                            isStepCompleted ? 'text-green-900' :
                            'text-gray-600'
                          }`}>
                            {step.title}
                          </h5>

                          {isActive && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              ~{step.estimatedTime}s
                            </Badge>
                          )}

                          {isStepCompleted && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              ✓ Selesai
                            </Badge>
                          )}
                        </div>

                        <p className={`text-sm ${
                          isActive ? 'text-blue-700' :
                          isStepCompleted ? 'text-green-700' :
                          'text-gray-500'
                        }`}>
                          {step.description}
                        </p>
                      </div>

                      {/* Active step pulse effect */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-blue-200 opacity-20 animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        {!isCompleted && !isFailed && (
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {workflowState.webSocketConnected ? (
                <>
                  <Zap className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">WebSocket Terhubung</span>
                </>
              ) : workflowState.webSocketConnected === false ? (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 font-medium">WebSocket Terputus</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600 font-medium">Menghubungkan...</span>
                </>
              )}
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              {workflowState.webSocketConnected && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <Zap className="w-3 h-3 mr-1" />
                  WebSocket
                </Badge>
              )}
              <span className="text-gray-600 text-xs">Real-time Processing</span>
            </div>
          </div>
        )}

        {/* Tips & Information */}
        {!isCompleted && !isFailed && (
          <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Sedang Menganalisis Profil Anda
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      AI menganalisis lebih dari 200 parameter kepribadian
                    </p>
                    <p className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Mengidentifikasi kekuatan dan potensi karir Anda
                    </p>
                    <p className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      Menyusun rekomendasi pengembangan yang personal
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-white/60 rounded-lg border border-white/40">
                    <p className="text-xs text-gray-600 italic">
                      "Proses analisis mendalam ini memastikan hasil yang akurat dan insight yang berharga untuk pengembangan karir Anda."
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}
