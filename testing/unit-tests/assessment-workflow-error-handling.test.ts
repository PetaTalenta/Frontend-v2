/**
 * Assessment Workflow Error Handling Tests
 * Tests for WebSocket timeout and error handling improvements
 */

// Note: This test file needs to be updated to use the new consolidated assessment service
// import { AssessmentService } from '../services/assessment-service';
// import { AssessmentScores } from '../types/assessment-results';

// Mock the new consolidated WebSocket service
jest.mock('../services/websocket-service', () => {
  const mockWebSocketService = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    setCallbacks: jest.fn(),
    subscribeToJob: jest.fn(),
    unsubscribeFromJob: jest.fn(),
    getStatus: jest.fn(() => ({
      isConnected: false,
      isAuthenticated: false,
      subscribedJobs: []
    }))
  };

  return {
    getWebSocketService: () => mockWebSocketService,
    isWebSocketSupported: () => true
  };
});

// Mock the assessment API
jest.mock('../services/assessment-api', () => ({
  submitAssessment: jest.fn(() => Promise.resolve({
    data: { jobId: 'test-job-123' }
  })),
  isAssessmentServiceAvailable: jest.fn(() => Promise.resolve(true))
}));

describe('AssessmentWorkflow Error Handling', () => {
  let workflow: AssessmentWorkflow;
  let mockCallbacks: WorkflowCallbacks;
  let mockWebSocketService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock callbacks
    mockCallbacks = {
      onStatusChange: jest.fn(),
      onProgress: jest.fn(),
      onComplete: jest.fn(),
      onError: jest.fn(),
      onTokenBalanceUpdate: jest.fn()
    };

    // Create workflow instance
    workflow = new AssessmentWorkflow(mockCallbacks);

    // Get mock WebSocket service (updated for new consolidated service)
    const { getWebSocketService } = require('../services/websocket-service');
    mockWebSocketService = getWebSocketService();
  });

  describe('WebSocket Timeout Error Handling', () => {
    it('should set status to failed and call onError callback on WebSocket timeout', async () => {
      const mockScores: AssessmentScores = {
        openness: 75,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 40,
        realistic: 60,
        investigative: 80,
        artistic: 70,
        social: 75,
        enterprising: 65,
        conventional: 55
      };

      // Mock WebSocket service to simulate timeout
      mockWebSocketService.setCallbacks.mockImplementation((callbacks: any) => {
        // Simulate timeout after 100ms instead of 15 seconds for faster testing
        setTimeout(() => {
          if (callbacks.onError) {
            callbacks.onError(new Error('WebSocket connection timeout'));
          }
        }, 100);
      });

      try {
        await workflow.submitFromScores(mockScores);
        fail('Expected workflow to throw error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebSocket connection failed');
        
        // Verify that onError callback was called
        expect(mockCallbacks.onError).toHaveBeenCalled();
        
        // Verify that the workflow state was updated to 'failed'
        expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'failed'
          })
        );
      }
    });

    it('should handle assessment-failed WebSocket event properly', async () => {
      const mockScores: AssessmentScores = {
        openness: 75,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 40,
        realistic: 60,
        investigative: 80,
        artistic: 70,
        social: 75,
        enterprising: 65,
        conventional: 55
      };

      // Mock WebSocket service to simulate assessment-failed event
      mockWebSocketService.setCallbacks.mockImplementation((callbacks: any) => {
        setTimeout(() => {
          if (callbacks.onAssessmentEvent) {
            callbacks.onAssessmentEvent({
              type: 'assessment-failed',
              jobId: 'test-job-123',
              data: {
                error: 'Assessment processing failed due to server error'
              }
            });
          }
        }, 50);
      });

      try {
        await workflow.submitFromScores(mockScores);
        fail('Expected workflow to throw error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Assessment processing failed due to server error');
        
        // Verify that onError callback was called
        expect(mockCallbacks.onError).toHaveBeenCalled();
        
        // Verify that the workflow state was updated to 'failed'
        expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'failed',
            message: 'Assessment processing failed due to server error'
          })
        );
      }
    });

    it('should handle WebSocket connection errors properly', async () => {
      const mockScores: AssessmentScores = {
        openness: 75,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 40,
        realistic: 60,
        investigative: 80,
        artistic: 70,
        social: 75,
        enterprising: 65,
        conventional: 55
      };

      // Mock WebSocket service to simulate connection error
      mockWebSocketService.setCallbacks.mockImplementation((callbacks: any) => {
        setTimeout(() => {
          if (callbacks.onError) {
            callbacks.onError(new Error('Connection refused'));
          }
        }, 50);
      });

      try {
        await workflow.submitFromScores(mockScores);
        fail('Expected workflow to throw error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebSocket connection failed');
        
        // Verify that onError callback was called
        expect(mockCallbacks.onError).toHaveBeenCalled();
        
        // Verify that the workflow state was updated to 'failed'
        expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'failed'
          })
        );
      }
    });
  });

  describe('Error State Management', () => {
    it('should properly update workflow state when errors occur', async () => {
      const mockScores: AssessmentScores = {
        openness: 75,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 40,
        realistic: 60,
        investigative: 80,
        artistic: 70,
        social: 75,
        enterprising: 65,
        conventional: 55
      };

      // Mock WebSocket service to simulate timeout
      mockWebSocketService.setCallbacks.mockImplementation((callbacks: any) => {
        setTimeout(() => {
          if (callbacks.onError) {
            callbacks.onError(new Error('WebSocket connection timeout'));
          }
        }, 50);
      });

      try {
        await workflow.submitFromScores(mockScores);
      } catch (error) {
        // Verify the sequence of status changes
        const statusChangeCalls = mockCallbacks.onStatusChange as jest.Mock;
        const calls = statusChangeCalls.mock.calls;
        
        // Should have called with 'submitting', 'queued', and 'failed'
        expect(calls.some((call: any) => call[0].status === 'submitting')).toBe(true);
        expect(calls.some((call: any) => call[0].status === 'queued')).toBe(true);
        expect(calls.some((call: any) => call[0].status === 'failed')).toBe(true);
      }
    });
  });
});
