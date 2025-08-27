'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  Send,
  X,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';
import { useAssessment } from '../../hooks/useAssessment';
import AssessmentStatusMonitor from './AssessmentStatusMonitor';
import { AssessmentResult } from '../../types/assessment-results';

interface EnhancedAssessmentSubmissionProps {
  answers: Record<number, number | null>;
  onComplete?: (result: AssessmentResult) => void;
  onCancel?: () => void;
  className?: string;
}

export default function EnhancedAssessmentSubmission({
  answers,
  onComplete,
  onCancel,
  className = ''
}: EnhancedAssessmentSubmissionProps) {

  const [assessmentName, setAssessmentName] = useState<string>('AI-Driven Talent Mapping');
  const [showAdvanced, setShowAdvanced] = useState(false);



  const {
    state,
    isIdle,
    isSubmitting: isProcessing,
    isCompleted,
    isFailed,
    result,
    submitFromAnswers,
    cancel,
    reset
  } = useAssessment({
    onComplete: (result) => {
      console.log('Assessment completed successfully:', result);
      if (onComplete) {
        onComplete(result);
      }
    },
    onError: (error) => {
      console.error('Assessment failed:', error);
    },
    onTokenBalanceUpdate: async () => {
      // This would typically refresh the token balance in the UI
      console.log('Token balance updated');
    },
    preferWebSocket: true
  });

  const handleSubmit = async () => {
    try {
      await submitFromAnswers(answers, assessmentName);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    }
  };

  const handleCancel = () => {
    cancel();
    if (onCancel) {
      onCancel();
    }
  };

  const handleReset = () => {
    reset();
  };

  // Count answered questions
  const answeredCount = Object.values(answers).filter(answer => answer !== null).length;
  const totalQuestions = Object.keys(answers).length;
  const completionRate = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Submission Card */}
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Assessment Progress
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Continue answering questions to complete your assessment
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {answeredCount}/{totalQuestions} answered
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Completion Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            
            {completionRate < 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete at least 50% of questions for meaningful results. 
                  Current: {Math.round(completionRate)}%
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Assessment Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Assessment Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'AI-Driven Talent Mapping', label: 'AI-Driven Talent Mapping', icon: Zap, recommended: true },
                { value: 'AI-Based IQ Test', label: 'AI-Based IQ Test', icon: Clock },
                { value: 'Custom Assessment', label: 'Custom Assessment', icon: CheckCircle }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAssessmentName(option.value)}
                  disabled={isProcessing}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    assessmentName === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {option.recommended && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons - Removed for assessment completion restriction */}
          <div className="space-y-3">
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">
                Assessment submission has been disabled.
              </p>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Advanced Settings</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Auto-retry on failure</span>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fallback to mock API</span>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Token cost</span>
                  <Badge variant="outline">1 token</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Monitor */}
      {!isIdle && (
        <AssessmentStatusMonitor 
          workflowState={state}
          showQueueInfo={true}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Success Message */}
      {isCompleted && result && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-900">
                  Assessment Berhasil Diselesaikan!
                </h3>
                <p className="text-green-800 text-lg">
                  Profil kepribadian Anda: <strong className="text-green-900">{result.persona_profile.title}</strong>
                </p>
                <p className="text-sm text-green-700 bg-green-100 rounded-lg px-4 py-2 inline-block">
                  Anda akan segera diarahkan ke halaman hasil lengkap dengan rekomendasi karir yang personal.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-green-600 mt-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm font-medium">Mempersiapkan hasil...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {isFailed && state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Assessment Failed:</strong> {state.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
