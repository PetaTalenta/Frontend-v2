/**
 * WebSocket Assessment Service Tests
 * Tests for error handling and connection management
 */

import { WebSocketAssessmentService } from '../services/websocket-assessment';

// Mock Socket.IO
jest.mock('socket.io-client', () => {
  const mockSocket = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    connected: false,
    id: 'mock-socket-id',
  };

  return {
    io: jest.fn(() => mockSocket),
    Socket: mockSocket,
  };
});

describe('WebSocketAssessmentService', () => {
  let service: WebSocketAssessmentService;
  let mockSocket: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new service instance
    service = new WebSocketAssessmentService();
    
    // Get mock socket
    const { io } = require('socket.io-client');
    mockSocket = io();
  });

  describe('Error Handling', () => {
    it('should handle connection errors with missing message property', async () => {
      const errorCallback = jest.fn();
      service.setCallbacks({ onError: errorCallback });

      // Mock connection error without message property
      const errorWithoutMessage = { code: 'CONNECTION_FAILED' };

      // Simulate connection error
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(errorWithoutMessage), 0);
        }
      });

      try {
        await service.connect('test-token');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebSocket connection failed');
        expect((error as Error).message).toContain('CONNECTION_FAILED');
      }
    });

    it('should handle connection errors with null/undefined error', async () => {
      const errorCallback = jest.fn();
      service.setCallbacks({ onError: errorCallback });

      // Mock connection error with null
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(null), 0);
        }
      });

      try {
        await service.connect('test-token');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebSocket connection failed');
        expect((error as Error).message).toContain('Unknown error');
      }
    });

    it('should handle connection errors with string error', async () => {
      const errorCallback = jest.fn();
      service.setCallbacks({ onError: errorCallback });

      // Mock connection error with string
      const stringError = 'Network timeout';
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(stringError), 0);
        }
      });

      try {
        await service.connect('test-token');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebSocket connection failed');
        expect((error as Error).message).toContain('Network timeout');
      }
    });

    it('should handle connection errors with object error', async () => {
      const errorCallback = jest.fn();
      service.setCallbacks({ onError: errorCallback });

      // Mock connection error with complex object
      const complexError = { 
        type: 'TransportError', 
        description: 'xhr poll error',
        context: { transport: 'polling' }
      };

      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(complexError), 0);
        }
      });

      try {
        await service.connect('test-token');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebSocket connection failed');
        // Should contain serialized object
        expect((error as Error).message).toContain('TransportError');
      }
    });
  });

  describe('Connection Management', () => {
    it('should properly initialize connection state', () => {
      const status = service.getStatus();
      expect(status.isConnected).toBe(false);
      expect(status.isAuthenticated).toBe(false);
      expect(status.subscribedJobs).toEqual([]);
    });

    it('should handle successful connection', async () => {
      const connectedCallback = jest.fn();
      const authenticatedCallback = jest.fn();
      
      service.setCallbacks({ 
        onConnected: connectedCallback,
        onAuthenticated: authenticatedCallback 
      });

      // Mock successful connection and authentication
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        } else if (event === 'authenticated') {
          setTimeout(() => callback(), 10);
        }
      });

      await service.connect('test-token');

      expect(mockSocket.connect).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticate', { token: 'test-token' });
    });

    it('should handle disconnection properly', () => {
      service.disconnect();
      
      const status = service.getStatus();
      expect(status.isConnected).toBe(false);
      expect(status.isAuthenticated).toBe(false);
      expect(status.subscribedJobs).toEqual([]);
    });
  });

  describe('Job Subscription', () => {
    beforeEach(async () => {
      // Mock successful connection and authentication
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        } else if (event === 'authenticated') {
          setTimeout(() => callback(), 10);
        }
      });

      await service.connect('test-token');
    });

    it('should subscribe to job when authenticated', () => {
      const jobId = 'test-job-123';
      service.subscribeToJob(jobId);

      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe-assessment', { jobId });
      
      const status = service.getStatus();
      expect(status.subscribedJobs).toContain(jobId);
    });

    it('should unsubscribe from job', () => {
      const jobId = 'test-job-123';
      
      // First subscribe
      service.subscribeToJob(jobId);
      
      // Then unsubscribe
      service.unsubscribeFromJob(jobId);

      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe-assessment', { jobId });
      
      const status = service.getStatus();
      expect(status.subscribedJobs).not.toContain(jobId);
    });
  });

  describe('Server Reachability', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true when server is reachable', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const isReachable = await service.isServerReachable();
      expect(isReachable).toBe(true);
    });

    it('should return false when server is not reachable', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const isReachable = await service.isServerReachable();
      expect(isReachable).toBe(false);
    });

    it('should return false when server returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const isReachable = await service.isServerReachable();
      expect(isReachable).toBe(false);
    });
  });
});
