'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  Loader2
} from 'lucide-react';
import { WorkflowState, getAssessmentQueueInfo } from '../../utils/assessment-workflow';
import { formatTimeRemaining } from '../../services/enhanced-assessment-api';

interface AssessmentStatusMonitorProps {
  workflowState?: WorkflowState;
  showQueueInfo?: boolean;
  onRefresh?: () => void;
  className?: string;
}

interface QueueInfo {
  queueLength: number;
  estimatedWaitTime: string;
  averageProcessingTime: string;
  isServiceAvailable: boolean;
}

export default function AssessmentStatusMonitor({
  workflowState,
  showQueueInfo = true,
  onRefresh,
  className = ''
}: AssessmentStatusMonitorProps) {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load queue information
  const loadQueueInfo = async () => {
    if (!showQueueInfo) return;
    
    setIsLoadingQueue(true);
    try {
      const info = await getAssessmentQueueInfo();
      setQueueInfo(info);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading queue info:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Load queue info on mount and periodically
  useEffect(() => {
    loadQueueInfo();
    
    // Refresh queue info every 30 seconds
    const interval = setInterval(loadQueueInfo, 30000);
    return () => clearInterval(interval);
  }, [showQueueInfo]);

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'idle':
        return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Ready' };
      case 'validating':
        return { icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Validating' };
      case 'submitting':
        return { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Submitting' };
      case 'queued':
        return { icon: Users, color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: 'Queued' };
      case 'processing':
        return { icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Processing' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Failed' };
      case 'cancelled':
        return { icon: AlertCircle, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Cancelled' };
      default:
        return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const statusDisplay = workflowState ? getStatusDisplay(workflowState.status) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Assessment Status */}
      {workflowState && (
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Assessment Status
              </CardTitle>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="h-8 px-3"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              {statusDisplay && (
                <>
                  <div className={`p-2 rounded-lg ${statusDisplay.bgColor}`}>
                    <statusDisplay.icon 
                      className={`w-5 h-5 ${statusDisplay.color} ${
                        workflowState.status === 'submitting' || workflowState.status === 'processing' 
                          ? 'animate-spin' 
                          : ''
                      }`} 
                    />
                  </div>
                  <div>
                    <Badge 
                      variant={workflowState.status === 'completed' ? 'default' : 'secondary'}
                      className={`${statusDisplay.color} ${statusDisplay.bgColor} border-0`}
                    >
                      {statusDisplay.label}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">{workflowState.message}</p>
                  </div>
                </>
              )}
            </div>

            {/* Progress Bar */}
            {workflowState.progress > 0 && workflowState.status !== 'completed' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{workflowState.progress}%</span>
                </div>
                <Progress value={workflowState.progress} className="h-2" />
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {workflowState.jobId && (
                <div>
                  <span className="text-gray-500">Job ID:</span>
                  <p className="font-mono text-xs text-gray-700 mt-1 break-all">
                    {workflowState.jobId}
                  </p>
                </div>
              )}
              
              {workflowState.queuePosition && (
                <div>
                  <span className="text-gray-500">Queue Position:</span>
                  <p className="font-semibold text-gray-700 mt-1">
                    #{workflowState.queuePosition}
                  </p>
                </div>
              )}
              
              {workflowState.estimatedTimeRemaining && (
                <div className="col-span-2">
                  <span className="text-gray-500">Estimated Time Remaining:</span>
                  <p className="font-semibold text-gray-700 mt-1">
                    {workflowState.estimatedTimeRemaining}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {workflowState.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{workflowState.error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue Information */}
      {showQueueInfo && (
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Queue Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadQueueInfo}
                disabled={isLoadingQueue}
                className="h-8 px-3"
              >
                {isLoadingQueue ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {queueInfo ? (
              <div className="space-y-4">
                {/* Service Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    queueInfo.isServiceAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {queueInfo.isServiceAvailable ? 'Service Online' : 'Using Mock API'}
                  </span>
                </div>

                {/* Queue Stats */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Queue Length</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {queueInfo.queueLength} jobs
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Estimated Wait</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {queueInfo.estimatedWaitTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Avg. Processing</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {queueInfo.averageProcessingTime}
                    </span>
                  </div>
                </div>

                {/* Last Updated */}
                {lastUpdated && (
                  <p className="text-xs text-gray-500 text-center">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading queue information...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
