/**
 * Parallel Assessment Monitoring Service
 * Monitors assessment progress using both WebSocket and polling simultaneously
 */

import { AssessmentStatusResponse } from '../types/assessment-results';
import { getAssessmentWebSocketService } from './websocket-assessment';
import { getAssessmentStatus } from './enhanced-assessment-api';
import { performanceMonitor } from './performance-monitoring';

interface MonitoringOptions {
  jobId: string;
  onProgress?: (status: AssessmentStatusResponse) => void;
  onComplete?: (result: AssessmentStatusResponse) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

class ParallelAssessmentMonitor {
  private activeMonitors = new Map<string, {
    websocketActive: boolean;
    pollingActive: boolean;
    resolved: boolean;
    timeoutId?: NodeJS.Timeout;
  }>();

  /**
   * Start parallel monitoring using both WebSocket and polling
   */
  async startMonitoring(options: MonitoringOptions): Promise<AssessmentStatusResponse> {
    const { jobId, onProgress, onComplete, onError, timeout = 240000 } = options;
    
    // Track performance
    const operationId = `parallel-monitor-${jobId}`;
    performanceMonitor.startTracking(operationId, 'Parallel Assessment Monitoring', { jobId });

    return new Promise<AssessmentStatusResponse>((resolve, reject) => {
      // Initialize monitoring state
      const monitorState = {
        websocketActive: true,
        pollingActive: true,
        resolved: false,
        timeoutId: undefined as NodeJS.Timeout | undefined,
      };

      this.activeMonitors.set(jobId, monitorState);

      // Shared completion handler
      const handleCompletion = (result: AssessmentStatusResponse, source: 'websocket' | 'polling') => {
        if (monitorState.resolved) return;
        
        monitorState.resolved = true;
        console.log(`[ParallelMonitor] Assessment ${jobId} completed via ${source}`);
        
        // Clean up
        this.cleanup(jobId);
        
        // Track performance
        performanceMonitor.completeTracking(operationId, true);
        
        // Call callbacks
        onComplete?.(result);
        resolve(result);
      };

      // Shared error handler
      const handleError = (error: Error, source: 'websocket' | 'polling') => {
        console.error(`[ParallelMonitor] ${source} error for ${jobId}:`, error);
        
        if (source === 'websocket') {
          monitorState.websocketActive = false;
        } else {
          monitorState.pollingActive = false;
        }

        // If both methods failed, reject
        if (!monitorState.websocketActive && !monitorState.pollingActive && !monitorState.resolved) {
          monitorState.resolved = true;
          this.cleanup(jobId);
          performanceMonitor.completeTracking(operationId, false);
          onError?.(error);
          reject(error);
        }
      };

      // Start WebSocket monitoring
      this.startWebSocketMonitoring(jobId, onProgress, handleCompletion, handleError);

      // Start polling monitoring (with slight delay to prefer WebSocket)
      setTimeout(() => {
        if (!monitorState.resolved) {
          this.startPollingMonitoring(jobId, onProgress, handleCompletion, handleError);
        }
      }, 1000);

      // Set overall timeout
      monitorState.timeoutId = setTimeout(() => {
        if (!monitorState.resolved) {
          monitorState.resolved = true;
          this.cleanup(jobId);
          performanceMonitor.completeTracking(operationId, false);
          const timeoutError = new Error(`Assessment monitoring timeout after ${timeout}ms`);
          onError?.(timeoutError);
          reject(timeoutError);
        }
      }, timeout);
    });
  }

  /**
   * Start WebSocket monitoring
   */
  private async startWebSocketMonitoring(
    jobId: string,
    onProgress?: (status: AssessmentStatusResponse) => void,
    onComplete?: (result: AssessmentStatusResponse, source: 'websocket') => void,
    onError?: (error: Error, source: 'websocket') => void
  ) {
    try {
      const wsService = getAssessmentWebSocketService();
      
      wsService.setCallbacks({
        onAssessmentEvent: (event) => {
          if (event.jobId !== jobId) return;

          const monitorState = this.activeMonitors.get(jobId);
          if (!monitorState || monitorState.resolved) return;

          console.log(`[ParallelMonitor] WebSocket event for ${jobId}:`, event.status);

          const statusResponse: AssessmentStatusResponse = {
            success: true,
            data: {
              jobId: event.jobId,
              status: event.status as any,
              progress: event.progress || 0,
              message: event.message || '',
              result: event.result,
            },
          };

          onProgress?.(statusResponse);

          if (event.status === 'completed' && event.result) {
            onComplete?.(statusResponse, 'websocket');
          }
        },
        onError: (error) => {
          onError?.(error, 'websocket');
        },
      });

      // Ensure WebSocket connection
      await wsService.connect();
      console.log(`[ParallelMonitor] WebSocket monitoring started for ${jobId}`);

    } catch (error) {
      console.error(`[ParallelMonitor] Failed to start WebSocket monitoring for ${jobId}:`, error);
      onError?.(error as Error, 'websocket');
    }
  }

  /**
   * Start polling monitoring
   */
  private async startPollingMonitoring(
    jobId: string,
    onProgress?: (status: AssessmentStatusResponse) => void,
    onComplete?: (result: AssessmentStatusResponse, source: 'polling') => void,
    onError?: (error: Error, source: 'polling') => void
  ) {
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes worth of attempts
    let delay = 100; // Start with 100ms

    const poll = async () => {
      const monitorState = this.activeMonitors.get(jobId);
      if (!monitorState || monitorState.resolved || !monitorState.pollingActive) {
        return;
      }

      attempts++;

      try {
        const status = await getAssessmentStatus(jobId);
        
        console.log(`[ParallelMonitor] Polling status for ${jobId}: ${status.data.status} (attempt ${attempts})`);
        
        onProgress?.(status);

        if (status.data.status === 'completed') {
          onComplete?.(status, 'polling');
          return;
        }

        if (status.data.status === 'failed') {
          onError?.(new Error('Assessment failed'), 'polling');
          return;
        }

        // Check max attempts
        if (attempts >= maxAttempts) {
          onError?.(new Error('Polling timeout: Too many attempts'), 'polling');
          return;
        }

        // Adaptive delay based on status
        if (status.data.status === 'processing') {
          delay = 150; // Fast polling during processing
        } else if (status.data.status === 'queued') {
          delay = 300; // Moderate polling for queued
        } else {
          delay = Math.min(delay * 1.02, 500); // Gradual backoff
        }

        // Schedule next poll
        setTimeout(poll, delay);

      } catch (error) {
        console.error(`[ParallelMonitor] Polling error for ${jobId} (attempt ${attempts}):`, error);
        
        if (attempts >= 3) {
          onError?.(error as Error, 'polling');
          return;
        }

        // Retry with exponential backoff
        delay = Math.min(delay * 1.5, 1000);
        setTimeout(poll, delay);
      }
    };

    console.log(`[ParallelMonitor] Polling monitoring started for ${jobId}`);
    poll();
  }

  /**
   * Stop monitoring for a specific job
   */
  stopMonitoring(jobId: string): void {
    const monitorState = this.activeMonitors.get(jobId);
    if (monitorState) {
      monitorState.resolved = true;
      this.cleanup(jobId);
    }
  }

  /**
   * Clean up monitoring resources
   */
  private cleanup(jobId: string): void {
    const monitorState = this.activeMonitors.get(jobId);
    if (monitorState) {
      if (monitorState.timeoutId) {
        clearTimeout(monitorState.timeoutId);
      }
      this.activeMonitors.delete(jobId);
    }
  }

  /**
   * Get active monitoring jobs
   */
  getActiveJobs(): string[] {
    return Array.from(this.activeMonitors.keys());
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    for (const jobId of this.activeMonitors.keys()) {
      this.stopMonitoring(jobId);
    }
  }
}

// Global instance
export const parallelAssessmentMonitor = new ParallelAssessmentMonitor();

export default parallelAssessmentMonitor;
