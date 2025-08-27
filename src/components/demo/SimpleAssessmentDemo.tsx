/**
 * Simple Assessment Demo Component
 * Demonstrates the new simple assessment flow
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useSimpleAssessment } from '../../hooks/useSimpleAssessment';
import { useAuth } from '../../contexts/AuthContext';
import { useToken } from '../../contexts/TokenContext';
import { calculateAllScores } from '../../utils/assessment-calculations';
import { Clock, CheckCircle, XCircle, Loader2, Zap, Timer } from 'lucide-react';

// Sample assessment data for demo
const SAMPLE_ANSWERS = {
  // RIASEC questions (1-30)
  1: 4, 2: 3, 3: 5, 4: 2, 5: 4, 6: 3, 7: 5, 8: 4, 9: 3, 10: 4,
  11: 5, 12: 3, 13: 4, 14: 2, 15: 5, 16: 4, 17: 3, 18: 5, 19: 4, 20: 3,
  21: 4, 22: 5, 23: 3, 24: 4, 25: 2, 26: 5, 27: 4, 28: 3, 29: 5, 30: 4,
  
  // OCEAN questions (31-80)
  31: 4, 32: 3, 33: 5, 34: 2, 35: 4, 36: 3, 37: 5, 38: 4, 39: 3, 40: 4,
  41: 5, 42: 3, 43: 4, 44: 2, 45: 5, 46: 4, 47: 3, 48: 5, 49: 4, 50: 3,
  51: 4, 52: 5, 53: 3, 54: 4, 55: 2, 56: 5, 57: 4, 58: 3, 59: 5, 60: 4,
  61: 3, 62: 4, 63: 5, 64: 2, 65: 4, 66: 3, 67: 5, 68: 4, 69: 3, 70: 4,
  71: 5, 72: 3, 73: 4, 74: 2, 75: 5, 76: 4, 77: 3, 78: 5, 79: 4, 80: 3,
  
  // VIA questions (81-200)
  81: 4, 82: 3, 83: 5, 84: 2, 85: 4, 86: 3, 87: 5, 88: 4, 89: 3, 90: 4,
  91: 5, 92: 3, 93: 4, 94: 2, 95: 5, 96: 4, 97: 3, 98: 5, 99: 4, 100: 3,
  // ... (continuing pattern for remaining VIA questions)
  101: 4, 102: 5, 103: 3, 104: 4, 105: 2, 106: 5, 107: 4, 108: 3, 109: 5, 110: 4,
  111: 3, 112: 4, 113: 5, 114: 2, 115: 4, 116: 3, 117: 5, 118: 4, 119: 3, 120: 4,
  121: 5, 122: 3, 123: 4, 124: 2, 125: 5, 126: 4, 127: 3, 128: 5, 129: 4, 130: 3,
  131: 4, 132: 5, 133: 3, 134: 4, 135: 2, 136: 5, 137: 4, 138: 3, 139: 5, 140: 4,
  141: 3, 142: 4, 143: 5, 144: 2, 145: 4, 146: 3, 147: 5, 148: 4, 149: 3, 150: 4,
  151: 5, 152: 3, 153: 4, 154: 2, 155: 5, 156: 4, 157: 3, 158: 5, 159: 4, 160: 3,
  161: 4, 162: 5, 163: 3, 164: 4, 165: 2, 166: 5, 167: 4, 168: 3, 169: 5, 170: 4,
  171: 3, 172: 4, 173: 5, 174: 2, 175: 4, 176: 3, 177: 5, 178: 4, 179: 3, 180: 4,
  181: 5, 182: 3, 183: 4, 184: 2, 185: 5, 186: 4, 187: 3, 188: 5, 189: 4, 190: 3,
  191: 4, 192: 5, 193: 3, 194: 4, 195: 2, 196: 5, 197: 4, 198: 3, 199: 5, 200: 4,
};

export default function SimpleAssessmentDemo() {
  const { user } = useAuth();
  const { refreshTokenBalance } = useToken();
  
  const simpleAssessment = useSimpleAssessment({
    onTokenBalanceUpdate: refreshTokenBalance,
    onProgress: (status) => {
      console.log('Demo: Progress update:', status);
    },
    onComplete: (result) => {
      console.log('Demo: Assessment completed:', result);
    },
    onError: (error) => {
      console.error('Demo: Assessment failed:', error);
    },
  });

  const handleSubmitDemo = async () => {
    if (!user) {
      alert('Please login first to test the assessment');
      return;
    }

    try {
      // Calculate scores from sample answers
      const scores = calculateAllScores(SAMPLE_ANSWERS);
      console.log('Demo: Calculated scores:', scores);

      // Submit using simple flow
      await simpleAssessment.submitAssessment(scores, 'Simple Flow Demo Assessment');
      
    } catch (error) {
      console.error('Demo submission failed:', error);
    }
  };

  const getStatusIcon = () => {
    switch (simpleAssessment.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'submitting':
      case 'queued':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (simpleAssessment.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'submitting':
      case 'queued':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Simple Assessment Flow Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the new optimized assessment flow that matches the other FE performance
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={`${getStatusColor()} flex items-center gap-1`}>
              {getStatusIcon()}
              {simpleAssessment.status}
            </Badge>
          </div>

          {simpleAssessment.jobId && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Job ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {simpleAssessment.jobId}
              </code>
            </div>
          )}

          {simpleAssessment.formattedElapsedTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Timer className="h-4 w-4" />
                Elapsed Time:
              </span>
              <span className="text-sm font-mono">
                {simpleAssessment.formattedElapsedTime}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {simpleAssessment.isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress:</span>
              <span className="text-sm text-muted-foreground">
                {simpleAssessment.progress}%
              </span>
            </div>
            <Progress value={simpleAssessment.progress} className="w-full" />
          </div>
        )}

        {/* Message */}
        {simpleAssessment.message && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{simpleAssessment.message}</p>
          </div>
        )}

        {/* Error Display */}
        {simpleAssessment.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {simpleAssessment.error}
            </p>
          </div>
        )}

        {/* Result Display */}
        {simpleAssessment.result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Assessment Completed!</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Result ID:</strong> {simpleAssessment.result.id}</p>
              <p><strong>Status:</strong> {simpleAssessment.result.status}</p>
              <p><strong>Created:</strong> {new Date(simpleAssessment.result.createdAt).toLocaleString()}</p>
              {simpleAssessment.result.persona_profile?.title && (
                <p><strong>Persona:</strong> {simpleAssessment.result.persona_profile.title}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmitDemo}
            disabled={simpleAssessment.isActive || !user}
            className="flex-1"
          >
            {simpleAssessment.isActive ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Simple Flow
              </>
            )}
          </Button>

          {simpleAssessment.canRetry && (
            <Button
              onClick={() => simpleAssessment.retry(calculateAllScores(SAMPLE_ANSWERS))}
              variant="outline"
            >
              Retry
            </Button>
          )}

          {!simpleAssessment.isIdle && (
            <Button
              onClick={simpleAssessment.reset}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Performance Comparison */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Expected Performance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700"><strong>Old Flow:</strong> 5+ minutes</p>
              <p className="text-blue-600">Complex WebSocket + Polling</p>
            </div>
            <div>
              <p className="text-blue-700"><strong>Simple Flow:</strong> 1.5-2 minutes</p>
              <p className="text-blue-600">Direct API + Simple Polling</p>
            </div>
          </div>
        </div>

        {!user && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Please login to test the assessment flow
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
