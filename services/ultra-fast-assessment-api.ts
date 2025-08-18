/**
 * Ultra-Fast Assessment API Service
 * Combines optimized caching, smart polling, and real-time updates for fastest possible response
 */

import { getCached, setCached, invalidateCache } from './optimized-cache-service';
import { getLatestAssessmentResult, getAssessmentResultFromArchiveAPI } from './assessment-api';
import { calculateUserStats } from './user-stats';
import { getAssessmentWebSocketService, isWebSocketSupported } from './websocket-assessment';
import notificationService from './notification-service';
import type { AssessmentResult } from '../types/assessment-results';

// Ultra-optimized cache configuration
const CACHE_CONFIG = {
  USER_STATS: {
    ttl: 15000, // 15 seconds
    staleWhileRevalidate: 45000, // 45 seconds
    backgroundRefresh: true,
  },
  LATEST_RESULT: {
    ttl: 30000, // 30 seconds
    staleWhileRevalidate: 90000, // 1.5 minutes
    backgroundRefresh: true,
  },
  ASSESSMENT_RESULT: {
    ttl: 300000, // 5 minutes (results don't change often)
    staleWhileRevalidate: 600000, // 10 minutes
    backgroundRefresh: true,
  },
};

// Smart polling configuration
const SMART_POLLING_CONFIG = {
  INITIAL_INTERVAL: 100, // 100ms for ultra-fast initial checks
  PROCESSING_INTERVAL: 200, // 200ms during active processing
  QUEUED_INTERVAL: 500, // 500ms for queued assessments
  MAX_INTERVAL: 1000, // 1 second maximum
  TIMEOUT: 180000, // 3 minutes total timeout
};

class UltraFastAssessmentAPI {
  private activePolling = new Map<string, boolean>();
  private pollingTimeouts = new Map<string, NodeJS.Timeout>();
  private wsService = isWebSocketSupported() ? getAssessmentWebSocketService() : null;

  /**
   * Get user stats with ultra-fast caching
   */
  async getUserStatsUltraFast(userId: string): Promise<any> {
    const cacheKey = `user-stats-${userId}`;
    
    return getCached(
      cacheKey,
      () => calculateUserStats(userId),
      CACHE_CONFIG.USER_STATS
    );
  }

  /**
   * Get latest assessment result with optimistic updates
   */
  async getLatestResultUltraFast(userId: string): Promise<AssessmentResult | null> {
    const cacheKey = `latest-result-${userId}`;
    
    return getCached(
      cacheKey,
      () => getLatestAssessmentResult(userId),
      CACHE_CONFIG.LATEST_RESULT
    );
  }

  /**
   * Get specific assessment result with caching
   */
  async getAssessmentResultUltraFast(resultId: string): Promise<AssessmentResult> {
    const cacheKey = `assessment-result-${resultId}`;
    
    return getCached(
      cacheKey,
      () => getAssessmentResultFromArchiveAPI(resultId),
      CACHE_CONFIG.ASSESSMENT_RESULT
    );
  }

  /**
   * Monitor assessment with hybrid approach (WebSocket + Smart Polling)
   */
  async monitorAssessmentUltraFast(
    jobId: string,
    onProgress?: (status: any) => void,
    onComplete?: (result: AssessmentResult) => void,
    onError?: (error: Error) => void
  ): Promise<AssessmentResult> {
    console.log(`Ultra-Fast API: Starting hybrid monitoring for job ${jobId}`);

    // Try WebSocket first for real-time updates
    if (this.wsService && isWebSocketSupported()) {
      try {
        return await this.monitorWithWebSocketUltraFast(jobId, onProgress, onComplete, onError);
      } catch (wsError) {
        console.warn('Ultra-Fast API: WebSocket failed, falling back to smart polling', wsError);
        return await this.monitorWithSmartPolling(jobId, onProgress, onComplete, onError);
      }
    } else {
      console.log('Ultra-Fast API: WebSocket not available, using smart polling');
      return await this.monitorWithSmartPolling(jobId, onProgress, onComplete, onError);
    }
  }

  /**
   * WebSocket monitoring with ultra-fast fallback
   */
  private async monitorWithWebSocketUltraFast(
    jobId: string,
    onProgress?: (status: any) => void,
    onComplete?: (result: AssessmentResult) => void,
    onError?: (error: Error) => void
  ): Promise<AssessmentResult> {
    return new Promise(async (resolve, reject) => {
      let isResolved = false;
      let timeoutId: NodeJS.Timeout;

      try {
        // Ultra-fast timeout (20 seconds)
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.warn('Ultra-Fast API: WebSocket timeout (20s), falling back to smart polling');
            this.monitorWithSmartPolling(jobId, onProgress, onComplete, onError)
              .then(resolve)
              .catch(reject);
          }
        }, 20000);

        // Set up WebSocket callbacks
        this.wsService!.setCallbacks({
          onAssessmentEvent: async (event) => {
            if (event.jobId !== jobId || isResolved) return;

            console.log('Ultra-Fast API: WebSocket event', event);

            switch (event.type) {
              case 'analysis-started':
                onProgress?.({ status: 'processing', progress: 10 });
                break;

              case 'analysis-complete':
                if (!isResolved) {
                  clearTimeout(timeoutId);
                  isResolved = true;
                  
                  try {
                    // Get the completed result
                    const result = await this.getAssessmentResultUltraFast(event.resultId!);
                    
                    // Invalidate caches to ensure fresh data
                    invalidateCache(`latest-result-${result.userId}`);
                    invalidateCache(`user-stats-${result.userId}`);
                    
                    // Show notification
                    notificationService.showAssessmentCompleteNotification({
                      assessmentId: result.id,
                      assessmentType: 'AI-Driven Talent Mapping',
                      completedAt: result.createdAt,
                      resultUrl: `/results/${result.id}`,
                    });
                    
                    onComplete?.(result);
                    resolve(result);
                  } catch (error) {
                    onError?.(error as Error);
                    reject(error);
                  }
                }
                break;

              case 'analysis-failed':
                if (!isResolved) {
                  clearTimeout(timeoutId);
                  isResolved = true;
                  const error = new Error(event.error || 'Assessment processing failed');
                  onError?.(error);
                  reject(error);
                }
                break;
            }
          },
          onError: (error) => {
            if (!isResolved) {
              clearTimeout(timeoutId);
              isResolved = true;
              console.warn('Ultra-Fast API: WebSocket error, falling back to smart polling:', error);
              this.monitorWithSmartPolling(jobId, onProgress, onComplete, onError)
                .then(resolve)
                .catch(reject);
            }
          }
        });

        // Connect and subscribe
        if (!this.wsService!.isConnected()) {
          const token = localStorage.getItem('token') || '';
          await this.wsService!.connect(token);
        }
        this.wsService!.subscribeToJob(jobId);

      } catch (error) {
        if (!isResolved) {
          clearTimeout(timeoutId);
          isResolved = true;
          reject(error);
        }
      }
    });
  }

  /**
   * Smart polling with adaptive intervals
   */
  private async monitorWithSmartPolling(
    jobId: string,
    onProgress?: (status: any) => void,
    onComplete?: (result: AssessmentResult) => void,
    onError?: (error: Error) => void
  ): Promise<AssessmentResult> {
    console.log(`Ultra-Fast API: Starting smart polling for job ${jobId}`);

    this.activePolling.set(jobId, true);
    let attempts = 0;
    let interval = SMART_POLLING_CONFIG.INITIAL_INTERVAL;
    const startTime = Date.now();

    const poll = async (): Promise<AssessmentResult> => {
      if (!this.activePolling.get(jobId)) {
        throw new Error('Polling cancelled');
      }

      attempts++;
      const elapsed = Date.now() - startTime;

      // Check timeout
      if (elapsed > SMART_POLLING_CONFIG.TIMEOUT) {
        this.activePolling.delete(jobId);
        const error = new Error('Assessment monitoring timeout');
        onError?.(error);
        throw error;
      }

      try {
        // This would need to be implemented to check job status
        // For now, we'll simulate the polling behavior
        const status = await this.checkJobStatusUltraFast(jobId);
        
        onProgress?.(status);

        if (status.status === 'completed') {
          this.activePolling.delete(jobId);
          const result = await this.getAssessmentResultUltraFast(status.resultId);
          
          // Invalidate caches
          invalidateCache(`latest-result-${result.userId}`);
          invalidateCache(`user-stats-${result.userId}`);
          
          onComplete?.(result);
          return result;
        }

        if (status.status === 'failed') {
          this.activePolling.delete(jobId);
          const error = new Error(status.error || 'Assessment processing failed');
          onError?.(error);
          throw error;
        }

        // Adaptive interval based on status
        if (status.status === 'processing') {
          interval = SMART_POLLING_CONFIG.PROCESSING_INTERVAL;
        } else if (status.status === 'queued') {
          interval = SMART_POLLING_CONFIG.QUEUED_INTERVAL;
        }

        // Schedule next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        return poll();

      } catch (error) {
        console.error(`Ultra-Fast API: Polling error for job ${jobId}:`, error);
        
        if (attempts >= 3) {
          this.activePolling.delete(jobId);
          onError?.(error as Error);
          throw error;
        }

        // Retry with exponential backoff
        interval = Math.min(interval * 1.5, SMART_POLLING_CONFIG.MAX_INTERVAL);
        await new Promise(resolve => setTimeout(resolve, interval));
        return poll();
      }
    };

    return poll();
  }

  /**
   * Check job status (placeholder - needs actual implementation)
   */
  private async checkJobStatusUltraFast(jobId: string): Promise<any> {
    // This would call the actual API to check job status
    // For now, return a mock response
    return {
      status: 'processing',
      progress: 50,
      message: 'Processing assessment...',
    };
  }

  /**
   * Cancel monitoring for a job
   */
  cancelMonitoring(jobId: string): void {
    this.activePolling.set(jobId, false);
    
    const timeout = this.pollingTimeouts.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.pollingTimeouts.delete(jobId);
    }

    if (this.wsService) {
      this.wsService.unsubscribeFromJob(jobId);
    }

    console.log(`Ultra-Fast API: Cancelled monitoring for job ${jobId}`);
  }

  /**
   * Prefetch data for better performance
   */
  async prefetchUserData(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.getUserStatsUltraFast(userId),
        this.getLatestResultUltraFast(userId),
      ]);
      console.log(`Ultra-Fast API: Prefetch completed for user ${userId}`);
    } catch (error) {
      console.error(`Ultra-Fast API: Prefetch failed for user ${userId}`, error);
    }
  }
}

// Create singleton instance
const ultraFastAPI = new UltraFastAssessmentAPI();

export default ultraFastAPI;

// Export convenience functions
export const getUserStatsUltraFast = (userId: string) => ultraFastAPI.getUserStatsUltraFast(userId);
export const getLatestResultUltraFast = (userId: string) => ultraFastAPI.getLatestResultUltraFast(userId);
export const getAssessmentResultUltraFast = (resultId: string) => ultraFastAPI.getAssessmentResultUltraFast(resultId);
export const monitorAssessmentUltraFast = (jobId: string, onProgress?: any, onComplete?: any, onError?: any) =>
  ultraFastAPI.monitorAssessmentUltraFast(jobId, onProgress, onComplete, onError);
export const cancelMonitoring = (jobId: string) => ultraFastAPI.cancelMonitoring(jobId);
export const prefetchUserData = (userId: string) => ultraFastAPI.prefetchUserData(userId);
