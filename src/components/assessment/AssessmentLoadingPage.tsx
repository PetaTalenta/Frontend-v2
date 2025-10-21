'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Zap,
  ArrowLeft,
  Shield,
  GraduationCap,
  Lightbulb,
  Globe,
  Award,
  BarChart3
} from 'lucide-react';
// Trivia data & helpers (following docs/assessmentTrivia.js)
import { getTriviaForStage, getRandomTrivia } from '../../../docs/assessmentTrivia';
// Note: WorkflowState type needs to be updated for the new consolidated service
interface WorkflowState {
  status: string;
  progress: number;
  message: string;
  jobId?: string;
  error?: string;
}
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

// Progress steps for the new design
const PROGRESS_STEPS = [
  {
    id: 'processing',
    title: 'Processing',
    number: 1,
    status: 'completed'
  },
  {
    id: 'analysis',
    title: 'Analysis',
    number: 2,
    status: 'active'
  },
  {
    id: 'report',
    title: 'Report',
    number: 3,
    status: 'pending'
  }
];

// Simplified loading steps with modern design
const LOADING_STEPS: LoadingStep[] = [
  {
    id: 'validating',
    title: 'Validasi Data',
    description: 'Memverifikasi jawaban assessment',
    icon: CheckCircle,
    estimatedTime: 1
  },
  {
    id: 'submitting',
    title: 'Mengirim Data',
    description: 'Mengunggah ke sistem analisis',
    icon: Activity,
    estimatedTime: 2
  },
  {
    id: 'queued',
    title: 'Antrian Proses',
    description: 'Menunggu slot analisis tersedia',
    icon: Clock,
    estimatedTime: 5
  },
  {
    id: 'processing',
    title: 'Analisis AI',
    description: 'Menganalisis pola kepribadian',
    icon: Brain,
    estimatedTime: 20
  },
  {
    id: 'generating',
    title: 'Menyusun Laporan',
    description: 'Membuat insight personal',
    icon: Sparkles,
    estimatedTime: 10
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
  const [currentProgressStep, setCurrentProgressStep] = useState(0); // 0 = Processing, 1 = Analysis, 2 = Report

  // Trivia state and rotation (see docs/trivia.md)
  const [currentTrivia, setCurrentTrivia] = useState<any | null>(null);
  const [displayTrivia, setDisplayTrivia] = useState<any | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const triviaIntervalRef = useRef<any>(null);

  // Visual mapping for trivia categories
  const getVisualForCategory = (category?: string) => {
    switch (category) {
      case 'history':
        return { icon: Clock, bg: 'bg-blue-100', text: 'text-blue-600', badgeBg: 'bg-blue-100', badgeText: 'text-blue-600' };
      case 'theory':
        return { icon: Lightbulb, bg: 'bg-yellow-100', text: 'text-yellow-600', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-600' };
      case 'concept':
        return { icon: BookOpen, bg: 'bg-green-100', text: 'text-green-600', badgeBg: 'bg-green-100', badgeText: 'text-green-600' };
      case 'research':
      case 'statistics':
        return { icon: BarChart3, bg: 'bg-purple-100', text: 'text-purple-600', badgeBg: 'bg-purple-100', badgeText: 'text-purple-600' };
      case 'application':
        return { icon: Target, bg: 'bg-red-100', text: 'text-red-600', badgeBg: 'bg-red-100', badgeText: 'text-red-600' };
      case 'objectivity':
        return { icon: Shield, bg: 'bg-indigo-100', text: 'text-indigo-600', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-600' };
      case 'learning':
        return { icon: GraduationCap, bg: 'bg-violet-100', text: 'text-violet-600', badgeBg: 'bg-violet-100', badgeText: 'text-violet-600' };
      case 'success':
        return { icon: Award, bg: 'bg-emerald-100', text: 'text-emerald-600', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-600' };
      case 'culture':
        return { icon: Globe, bg: 'bg-cyan-100', text: 'text-cyan-600', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-600' };
      case 'development':
        return { icon: TrendingUp, bg: 'bg-orange-100', text: 'text-orange-600', badgeBg: 'bg-orange-100', badgeText: 'text-orange-600' };
      default:
        return { icon: BookOpen, bg: 'bg-purple-100', text: 'text-purple-600', badgeBg: 'bg-purple-100', badgeText: 'text-purple-600' };
    }
  };

  // Map our workflow statuses to trivia stages described in docs
  const getStageForTrivia = (status: string): 'processing' | 'analyzing' | 'preparing' => {
    switch (status) {
      case 'processing':
        return 'analyzing'; // show AI advantages while analyzing
      case 'generating':
        return 'preparing'; // preparing stage
      case 'queued':
      case 'submitting':
      case 'validating':
      default:
        return 'processing'; // general trivia while waiting
    }
  };

  const updateTrivia = () => {
    const stage = getStageForTrivia(workflowState.status);
    const trivia = getTriviaForStage(stage);

    // Prevent immediate duplicate
    if (currentTrivia && trivia && trivia.id === currentTrivia.id) {
      const alternative = getRandomTrivia();
      if (alternative && alternative.id !== currentTrivia.id) {
        setCurrentTrivia(alternative);
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setDisplayTrivia(alternative);
          setIsAnimating(false);
        }, 300);
        return () => clearTimeout(timer as any);
      }
    }

    setCurrentTrivia(trivia);
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayTrivia(trivia);
      setIsAnimating(false);
    }, 300);
    return () => clearTimeout(timer as any);
  };

  const startTriviaRotation = () => {
    if (triviaIntervalRef.current) return;
    updateTrivia();
    triviaIntervalRef.current = setInterval(() => {
      updateTrivia();
    }, 5000); // 10s per docs
  };

  const stopTriviaRotation = () => {
    if (triviaIntervalRef.current) {
      clearInterval(triviaIntervalRef.current);
      triviaIntervalRef.current = null;
    }
  };

  // Get dynamic progress steps based on current status
  const getProgressSteps = () => {
    const steps = [...PROGRESS_STEPS];

    // Update steps based on workflow status or auto-progression
    if (workflowState.status === 'completed') {
      // All steps completed
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      steps[2].status = 'completed';
    } else {
      // Use currentProgressStep for auto-progression
      // Step 0 = Processing active, Step 1 = Analysis active, Step 2 = Report active
      if (currentProgressStep >= 0) {
        steps[0].status = 'completed'; // Processing completed
      }
      if (currentProgressStep >= 1) {
        steps[1].status = 'active';    // Analysis active
      } else {
        steps[1].status = 'pending';   // Analysis pending
      }
      if (currentProgressStep >= 2) {
        steps[2].status = 'active';    // Report active
      } else {
        steps[2].status = 'pending';   // Report pending
      }
    }

    return steps;
  };

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

  // Auto-progress indicator: Processing -> Analysis after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentProgressStep(1); // Move to Analysis (index 1)
    }, 3000);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Trivia lifecycle: start/stop rotation based on status
  useEffect(() => {
    startTriviaRotation();
    return () => {
      stopTriviaRotation();
    };
  }, [workflowState.status]);

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
        personaTitle={workflowState.result?.persona_profile?.archetype || workflowState.result?.persona_profile?.title || "Profil Kepribadian Anda"}
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
        errorMessage={workflowState.error || workflowState.message || "Terjadi kesalahan saat memproses assessment Anda."}
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
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-6 ${className}`}>
        <div className="w-full max-w-lg">
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
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-gray-900">
            Memproses Asesmen
          </h1>
          <p className="text-gray-600">
            Asesmen Anda sedang diproses menggunakan teknologi kecerdasan buatan (AI).
          </p>

          {/* Real-time updates indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600">Real-time updates aktif</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center space-x-8">
            {getProgressSteps().map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed'
                      ? 'bg-gray-800 text-white'
                      : step.status === 'active'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`mt-2 text-sm ${
                    step.status === 'active' ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>

                {index < getProgressSteps().length - 1 && (
                  <div className={`w-10 h-px mx-2 ${
                    step.status === 'completed' ? 'bg-gray-800' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Loading Section */}
        <div className="text-center space-y-6">
          {/* Loading Spinner */}
          <div className="w-16 h-16 mx-auto">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Menganalisis dengan AI
            </h2>
            <p className="text-gray-600">
              Menganalisis pola dan menghasilkan wawasan
            </p>
          </div>
        </div>



        {/* Information Card - Tahukah Anda (dynamic trivia) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ minHeight: '180px' }}>
          <div className={`flex items-start gap-4 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {(() => {
              const visual = getVisualForCategory(displayTrivia?.category);
              const Icon = visual.icon;
              return (
                <>
                  <div className={`p-3 rounded-lg ${visual.bg}`}>
                    <Icon className={`w-6 h-6 ${visual.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">TAHUKAH ANDA?</span>
                      <span className={`text-xs px-2 py-1 rounded ${visual.badgeBg} ${visual.badgeText}`}>
                        {displayTrivia?.category || 'learning'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {displayTrivia?.title || 'Memproses dengan AI'}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {displayTrivia?.content || 'Kami sedang menyiapkan insight terbaik untuk Anda.'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              // Skip writing local history. Source of truth is now Archive API.
              // Intentionally no-op here to avoid conflicts between local vs API data.
              window.location.href = '/dashboard';
            }}
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-800 px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            You can check your assessment status in the dashboard
          </p>
        </div>




      </div>
    </div>
  );
}
