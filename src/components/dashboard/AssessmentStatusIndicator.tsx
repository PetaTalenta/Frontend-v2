/**
 * Real-time Assessment Status Indicator
 * Shows live status of processing assessments with progress and notifications
 */

import React, { useState, useEffect } from 'react';
// Note: This component needs to be updated to use the new consolidated WebSocket service
// import { WebSocketEvent } from '../../services/websocket-service';

interface AssessmentStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  estimatedTimeRemaining?: string;
  startedAt: Date;
}

interface AssessmentStatusIndicatorProps {
  className?: string;
  showNotifications?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function AssessmentStatusIndicator({
  className = '',
  showNotifications = true,
  autoHide = true,
  autoHideDelay = 5000,
}: AssessmentStatusIndicatorProps) {
  const [activeAssessments, setActiveAssessments] = useState<Map<string, AssessmentStatus>>(new Map());
  const [isVisible, setIsVisible] = useState(false);

  // TODO: Update to use new consolidated WebSocket service
  // const webSocket = useWebSocketService({
  //   autoConnect: true,
  //   onEvent: (event: WebSocketEvent) => {
  //     handleAssessmentEvent(event);
  //   },
  // });

  const handleAssessmentEvent = (event: any) => {
    if (!event.jobId) return;

    setActiveAssessments(prev => {
      const updated = new Map(prev);
      
      switch (event.type) {
        case 'analysis-started':
          updated.set(event.jobId, {
            jobId: event.jobId,
            status: 'queued',
            progress: 0,
            message: event.message || 'Assessment queued for processing',
            estimatedTimeRemaining: event.metadata?.estimatedProcessingTime,
            startedAt: new Date(),
          });
          setIsVisible(true);
          break;

        case 'analysis-complete':
          if (updated.has(event.jobId)) {
            updated.set(event.jobId, {
              ...updated.get(event.jobId)!,
              status: 'completed',
              progress: 100,
              message: event.message || 'Assessment completed successfully',
            });
            
            // Auto-hide completed assessments
            if (autoHide) {
              setTimeout(() => {
                setActiveAssessments(current => {
                  const newMap = new Map(current);
                  newMap.delete(event.jobId!);
                  if (newMap.size === 0) {
                    setIsVisible(false);
                  }
                  return newMap;
                });
              }, autoHideDelay);
            }
          }
          break;

        case 'analysis-failed':
          if (updated.has(event.jobId)) {
            updated.set(event.jobId, {
              ...updated.get(event.jobId)!,
              status: 'failed',
              progress: 0,
              message: event.error || 'Assessment processing failed',
            });
          }
          break;

        default:
          // Handle progress updates for processing status
          if (updated.has(event.jobId)) {
            const current = updated.get(event.jobId)!;
            updated.set(event.jobId, {
              ...current,
              status: 'processing',
              progress: Math.min(current.progress + 10, 90), // Simulate progress
              message: event.message || 'Processing assessment...',
            });
          }
          break;
      }

      return updated;
    });
  };

  // Auto-hide when no active assessments
  useEffect(() => {
    if (activeAssessments.size === 0) {
      const timer = setTimeout(() => setIsVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeAssessments.size]);

  if (!isVisible || activeAssessments.size === 0) {
    return null;
  }

  const getStatusColor = (status: AssessmentStatus['status']) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'processing': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'failed': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: AssessmentStatus['status']) => {
    switch (status) {
      case 'queued': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '📊';
    }
  };

  const formatElapsedTime = (startedAt: Date) => {
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {Array.from(activeAssessments.values()).map((assessment) => (
        <div
          key={assessment.jobId}
          className={`
            max-w-sm p-4 rounded-lg border-2 shadow-lg backdrop-blur-sm
            transition-all duration-300 ease-in-out
            ${getStatusColor(assessment.status)}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(assessment.status)}</span>
              <div>
                <h4 className="font-semibold text-sm">Assessment Status</h4>
                <p className="text-xs opacity-75">
                  {formatElapsedTime(assessment.startedAt)} elapsed
                </p>
              </div>
            </div>
            
            {assessment.status !== 'completed' && assessment.status !== 'failed' && (
              <button
                onClick={() => {
                  setActiveAssessments(prev => {
                    const updated = new Map(prev);
                    updated.delete(assessment.jobId);
                    return updated;
                  });
                }}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium">{assessment.message}</p>
            
            {assessment.estimatedTimeRemaining && assessment.status !== 'completed' && (
              <p className="text-xs opacity-75 mt-1">
                Est. time remaining: {assessment.estimatedTimeRemaining}
              </p>
            )}
          </div>

          {/* Progress bar for processing assessments */}
          {(assessment.status === 'processing' || assessment.status === 'queued') && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{assessment.progress}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className="bg-current h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${assessment.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons for completed/failed assessments */}
          {assessment.status === 'completed' && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
              >
                View Dashboard
              </button>
              <button
                onClick={() => {
                  // Navigate to my results page to see all assessment results
                  window.location.href = '/my-results';
                }}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
              >
                View Results
              </button>
            </div>
          )}

          {assessment.status === 'failed' && (
            <div className="mt-3">
              <button
                onClick={() => window.location.href = '/assessment'}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Connection status indicator */}
      <div className="text-xs text-right opacity-50">
        {webSocket.isConnected ? (
          <span className="text-green-600">🟢 Live updates active</span>
        ) : (
          <span className="text-red-600">🔴 Connecting...</span>
        )}
      </div>
    </div>
  );
}
