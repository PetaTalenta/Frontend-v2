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
import { useAssessmentWorkflow } from '../../hooks/useAssessmentWorkflow';
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
    isProcessing,
    isCompleted,
    isFailed,
    result,
    submitFromAnswers,
    cancel,
    reset
  } = useAssessmentWorkflow({
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
    }
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
                Submit Assessment for AI Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Get personalized career insights powered by AI
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isIdle && (
              <Button
                onClick={handleSubmit}
                disabled={completionRate < 50}
                className="flex-1"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Analysis
              </Button>
            )}

            {isProcessing && (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}

            {(isCompleted || isFailed) && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Submit Another
              </Button>
            )}
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
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">
                  Assessment Completed Successfully!
                </h3>
                <p className="text-green-800 mt-1">
                  Your personality profile: <strong>{result.persona_profile.title}</strong>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  You can now view your detailed results and career recommendations.
                </p>
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
