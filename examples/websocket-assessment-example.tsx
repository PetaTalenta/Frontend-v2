/**
 * Example implementation of WebSocket Assessment
 * This file demonstrates how to use the WebSocket assessment system
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAssessmentWebSocket, useAssessmentJobMonitor } from '../hooks/useAssessmentWebSocket';
import { useAssessmentWorkflow } from '../hooks/useAssessmentWorkflow';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2 
} from 'lucide-react';

export default function WebSocketAssessmentExample() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Example assessment data
  const sampleAnswers = {
    1: 4, 2: 3, 3: 5, 4: 2, 5: 4,
    // ... more answers would be here
  };

  // WebSocket connection management
  const webSocket = useAssessmentWebSocket({
    autoConnect: true,
    onConnected: () => {
      console.log('✅ WebSocket connected successfully');
    },
    onDisconnected: () => {
      console.log('❌ WebSocket disconnected');
    },
    onError: (error) => {
      console.error('🔥 WebSocket error:', error);
    },
  });

  // Job monitoring (when we have a jobId)
  const jobMonitor = useAssessmentJobMonitor(currentJobId, {
    onQueued: (event) => {
      console.log('📋 Assessment queued:', event);
    },
    onProcessing: (event) => {
      console.log('⚙️ Assessment processing:', event);
    },
    onCompleted: (event) => {
      console.log('🎉 Assessment completed:', event);
      if (event.data.resultId) {
        router.push(`/results/${event.data.resultId}`);
      }
    },
    onFailed: (event) => {
      console.error('💥 Assessment failed:', event);
    },
  });

  // Assessment workflow with WebSocket preference
  const workflow = useAssessmentWorkflow({
    preferWebSocket: true,
    onComplete: (result) => {
      console.log('🏆 Workflow completed:', result);
      router.push(`/results/${result.id}`);
    },
    onError: (error) => {
      console.error('❌ Workflow error:', error);
    },
  });

  const handleSubmitAssessment = async () => {
    try {
      const result = await workflow.submitFromAnswers(sampleAnswers);
      if (result) {
        setCurrentJobId(workflow.state.jobId || null);
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    }
  };

  const handleTestWebSocket = async () => {
    if (webSocket.isConnected) {
      webSocket.disconnect();
    } else {
      await webSocket.connect();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <p>Please log in to test WebSocket assessment</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">WebSocket Assessment Demo</h1>
        <p className="text-gray-600">
          Test real-time assessment processing with WebSocket connections
        </p>
      </div>

      {/* WebSocket Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            WebSocket Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Connection Status:</span>
            <Badge variant={webSocket.isConnected ? "default" : "secondary"}>
              {webSocket.isConnected ? (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Authentication:</span>
            <Badge variant={webSocket.isAuthenticated ? "default" : "outline"}>
              {webSocket.isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>WebSocket Support:</span>
            <Badge variant={webSocket.isSupported ? "default" : "destructive"}>
              {webSocket.isSupported ? "Supported" : "Not Supported"}
            </Badge>
          </div>

          {webSocket.connectionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                <strong>Error:</strong> {webSocket.connectionError.message}
              </p>
            </div>
          )}

          <Button 
            onClick={handleTestWebSocket}
            variant={webSocket.isConnected ? "destructive" : "default"}
            className="w-full"
          >
            {webSocket.isConnected ? "Disconnect WebSocket" : "Connect WebSocket"}
          </Button>
        </CardContent>
      </Card>

      {/* Assessment Workflow Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Assessment Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="font-medium">{workflow.state.status}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Progress:</span>
              <p className="font-medium">{workflow.state.progress}%</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Connection Type:</span>
              <p className="font-medium">
                {workflow.state.useWebSocket === undefined ? 'Not Started' :
                 workflow.state.useWebSocket ? 'WebSocket' : 'Polling'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Job ID:</span>
              <p className="font-medium text-xs">
                {workflow.state.jobId || 'None'}
              </p>
            </div>
          </div>

          {workflow.state.progress > 0 && (
            <div className="space-y-2">
              <Progress value={workflow.state.progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {workflow.state.message}
              </p>
            </div>
          )}

          {workflow.state.estimatedTimeRemaining && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated time remaining: {workflow.state.estimatedTimeRemaining}
              </p>
            </div>
          )}

          <Button 
            onClick={handleSubmitAssessment}
            disabled={workflow.isProcessing}
            className="w-full"
          >
            {workflow.isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Assessment...
              </>
            ) : (
              'Submit Test Assessment'
            )}
          </Button>

          {workflow.isCompleted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Assessment completed successfully!
              </p>
            </div>
          )}

          {workflow.isFailed && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Assessment failed: {workflow.state.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Monitor Card */}
      {currentJobId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Real-time Job Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Job ID:</span>
                <p className="font-medium text-xs">{currentJobId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Monitoring:</span>
                <Badge variant={jobMonitor.isMonitoring ? "default" : "outline"}>
                  {jobMonitor.isMonitoring ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700 text-sm">
                This job is being monitored via WebSocket for real-time updates.
                You'll receive instant notifications when the status changes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify({
              webSocket: {
                isConnected: webSocket.isConnected,
                isAuthenticated: webSocket.isAuthenticated,
                subscribedJobs: webSocket.subscribedJobs,
              },
              workflow: {
                status: workflow.state.status,
                progress: workflow.state.progress,
                useWebSocket: workflow.state.useWebSocket,
                webSocketConnected: workflow.state.webSocketConnected,
              },
              jobMonitor: currentJobId ? {
                jobId: jobMonitor.jobId,
                isMonitoring: jobMonitor.isMonitoring,
              } : null,
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
