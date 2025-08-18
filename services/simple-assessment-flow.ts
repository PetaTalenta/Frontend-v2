/**
 * Simple Assessment Flow Service
 * Implements the same efficient flow as the other FE:
 * Assessment → AssessmentStatus → Results
 */

import { AssessmentScores, AssessmentResult, AssessmentStatusResponse } from '../types/assessment-results';
import { getAssessmentWebSocketService } from './websocket-assessment';

interface SimpleAssessmentOptions {
  onProgress?: (status: AssessmentStatusResponse) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
  timeout?: number;
}

class SimpleAssessmentFlowService {
  private readonly API_BASE_URL = 'https://api.chhrone.web.id';
  private readonly SIMPLE_POLLING_INTERVAL = 2000; // 2 seconds - simple and effective
  private readonly DEFAULT_TIMEOUT = 180000; // 3 minutes

  /**
   * Submit assessment using simple flow
   * POST /api/assessment/submit → Submit assessment
   */
  async submitAssessment(
    assessmentData: AssessmentScores,
    assessmentName: string = 'AI-Driven Talent Mapping',
    options: SimpleAssessmentOptions = {}
  ): Promise<AssessmentResult> {
    console.log('🚀 Simple Flow: Starting assessment submission...');
    
    const startTime = performance.now();
    
    try {
      // Step 1: Submit assessment
      const jobId = await this.submitToAPI(assessmentData, assessmentName, options.onTokenBalanceUpdate);
      console.log(`✅ Simple Flow: Assessment submitted with jobId: ${jobId}`);

      // Step 2: Monitor status with simple approach
      const result = await this.monitorAssessmentStatus(jobId, options);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      console.log(`🎉 Simple Flow: Assessment completed in ${(totalTime / 1000).toFixed(2)} seconds`);
      
      return result;

    } catch (error) {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      console.error(`❌ Simple Flow: Assessment failed after ${(totalTime / 1000).toFixed(2)} seconds:`, error);
      throw error;
    }
  }

  /**
   * Submit assessment data to API
   */
  private async submitToAPI(
    assessmentData: AssessmentScores,
    assessmentName: string,
    onTokenBalanceUpdate?: () => Promise<void>
  ): Promise<string> {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    const requestData = {
      assessmentName,
      riasec: assessmentData.riasec,
      ocean: assessmentData.ocean,
      viaIs: assessmentData.viaIs,
    };

    const response = await fetch(`${this.API_BASE_URL}/api/assessment/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 402) {
        throw new Error('Insufficient tokens. Please purchase more tokens.');
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update token balance if callback provided
    if (onTokenBalanceUpdate) {
      try {
        await onTokenBalanceUpdate();
      } catch (error) {
        console.warn('Simple Flow: Failed to update token balance:', error);
      }
    }

    return result.data.jobId;
  }

  /**
   * Monitor assessment status with hybrid approach (WebSocket + Simple Polling)
   */
  private async monitorAssessmentStatus(
    jobId: string,
    options: SimpleAssessmentOptions
  ): Promise<AssessmentResult> {
    const { onProgress, timeout = this.DEFAULT_TIMEOUT } = options;

    console.log(`🔍 Simple Flow: Starting status monitoring for job ${jobId}`);

    return new Promise(async (resolve, reject) => {
      let isResolved = false;
      let websocketFailed = false;

      // Set overall timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error('Assessment timeout - please check results page'));
        }
      }, timeout);

      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      // Try WebSocket first (preferred)
      try {
        const wsService = getAssessmentWebSocketService();
        
        wsService.setCallbacks({
          onAssessmentEvent: async (event) => {
            if (event.jobId !== jobId || isResolved) return;

            console.log(`📡 Simple Flow: WebSocket event for ${jobId}:`, event.status);

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
              isResolved = true;
              cleanup();
              resolve(event.result);
            } else if (event.status === 'failed') {
              isResolved = true;
              cleanup();
              reject(new Error('Assessment processing failed'));
            }
          },
          onError: (error) => {
            console.warn('Simple Flow: WebSocket error, falling back to polling:', error);
            websocketFailed = true;
          },
        });

        await wsService.connect();
        console.log('✅ Simple Flow: WebSocket connected successfully');

        // Start simple polling as backup after 10 seconds
        setTimeout(() => {
          if (!isResolved) {
            console.log('🔄 Simple Flow: Starting backup polling...');
            this.startSimplePolling(jobId, onProgress, resolve, reject, cleanup);
          }
        }, 10000);

      } catch (error) {
        console.warn('Simple Flow: WebSocket setup failed, using polling only:', error);
        websocketFailed = true;
      }

      // If WebSocket failed, start polling immediately
      if (websocketFailed) {
        this.startSimplePolling(jobId, onProgress, resolve, reject, cleanup);
      }
    });
  }

  /**
   * Simple polling implementation (like the other FE)
   */
  private startSimplePolling(
    jobId: string,
    onProgress?: (status: AssessmentStatusResponse) => void,
    resolve?: (result: AssessmentResult) => void,
    reject?: (error: Error) => void,
    cleanup?: () => void
  ): void {
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes worth of 2-second intervals

    const poll = async () => {
      attempts++;

      try {
        const status = await this.checkAssessmentStatus(jobId);
        
        console.log(`🔍 Simple Flow: Status check ${attempts}/${maxAttempts} for ${jobId}: ${status.data.status}`);
        
        onProgress?.(status);

        if (status.data.status === 'completed') {
          // Fetch the final result
          const result = await this.fetchAssessmentResult(status.data.result?.id || jobId);
          cleanup?.();
          resolve?.(result);
          return;
        }

        if (status.data.status === 'failed') {
          cleanup?.();
          reject?.(new Error('Assessment processing failed'));
          return;
        }

        // Continue polling if still processing/queued
        if (attempts < maxAttempts && (status.data.status === 'processing' || status.data.status === 'queued')) {
          setTimeout(poll, this.SIMPLE_POLLING_INTERVAL);
        } else if (attempts >= maxAttempts) {
          cleanup?.();
          reject?.(new Error('Assessment polling timeout'));
        }

      } catch (error) {
        console.error(`Simple Flow: Polling error (attempt ${attempts}):`, error);
        
        if (attempts >= 3) {
          cleanup?.();
          reject?.(error as Error);
        } else {
          // Retry after a short delay
          setTimeout(poll, this.SIMPLE_POLLING_INTERVAL);
        }
      }
    };

    console.log('🔄 Simple Flow: Starting simple polling...');
    poll();
  }

  /**
   * Check assessment status
   * GET /api/assessment/status/{jobId} → Check status
   */
  private async checkAssessmentStatus(jobId: string): Promise<AssessmentStatusResponse> {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

    const response = await fetch(`${this.API_BASE_URL}/api/assessment/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch assessment result
   * GET /api/results/{resultId} → Fetch results
   */
  private async fetchAssessmentResult(resultId: string): Promise<AssessmentResult> {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

    // Try the results endpoint first (like the other FE)
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/results/${resultId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'PetaTalenta-Frontend/1.0',
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Simple Flow: Results endpoint failed, trying archive endpoint:', error);
    }

    // Fallback to archive endpoint
    const response = await fetch(`${this.API_BASE_URL}/api/assessment/archive/${resultId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Global instance
export const simpleAssessmentFlow = new SimpleAssessmentFlowService();

export default simpleAssessmentFlow;
