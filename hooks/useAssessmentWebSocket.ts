/**
 * React Hook for Assessment WebSocket
 * Provides easy-to-use WebSocket functionality for assessment real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getAssessmentWebSocketService, 
  AssessmentWebSocketEvent,
  isWebSocketSupported 
} from '../services/websocket-assessment';

export interface UseAssessmentWebSocketOptions {
  autoConnect?: boolean;
  onAssessmentUpdate?: (event: AssessmentWebSocketEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  fallbackToPolling?: boolean;
}

export interface UseAssessmentWebSocketReturn {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  isSupported: boolean;
  connectionError: Error | null;
  
  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToJob: (jobId: string) => void;
  unsubscribeFromJob: (jobId: string) => void;
  
  // Status
  subscribedJobs: string[];
}

export function useAssessmentWebSocket(
  options: UseAssessmentWebSocketOptions = {}
): UseAssessmentWebSocketReturn {
  const { token, isAuthenticated: authIsAuthenticated } = useAuth();
  const {
    autoConnect = true,
    onAssessmentUpdate,
    onConnected,
    onDisconnected,
    onError,
    fallbackToPolling = true,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [subscribedJobs, setSubscribedJobs] = useState<string[]>([]);

  // Refs
  const wsServiceRef = useRef(getAssessmentWebSocketService());
  const isConnectingRef = useRef(false);

  // Check WebSocket support
  const isSupported = isWebSocketSupported();

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      const error = new Error('WebSocket not supported in this environment');
      setConnectionError(error);
      onError?.(error);
      return;
    }

    if (!token || !authIsAuthenticated) {
      const error = new Error('Authentication required for WebSocket connection');
      setConnectionError(error);
      onError?.(error);
      return;
    }

    if (isConnectingRef.current || isConnected) {
      console.log('WebSocket Hook: Already connected or connecting');
      return;
    }

    try {
      isConnectingRef.current = true;
      setConnectionError(null);

      console.log('WebSocket Hook: Attempting to connect...');
      
      // Set up callbacks
      wsServiceRef.current.setCallbacks({
        onAssessmentEvent: (event) => {
          console.log('WebSocket Hook: Assessment event received', event);
          onAssessmentUpdate?.(event);
        },
        onConnected: () => {
          setIsConnected(true);
          setConnectionError(null);
          onConnected?.();
        },
        onDisconnected: () => {
          setIsConnected(false);
          setIsAuthenticated(false);
          setSubscribedJobs([]);
          onDisconnected?.();
        },
        onError: (error) => {
          console.error('WebSocket Hook: Error', error);
          setConnectionError(error);
          onError?.(error);
        },
        onAuthenticated: () => {
          setIsAuthenticated(true);
          console.log('WebSocket Hook: Authenticated successfully');
        },
      });

      // Connect
      await wsServiceRef.current.connect(token);
      
      console.log('WebSocket Hook: Connected successfully');

    } catch (error) {
      const wsError = error instanceof Error ? error : new Error('Unknown WebSocket error');
      console.error('WebSocket Hook: Connection failed', wsError);
      setConnectionError(wsError);
      onError?.(wsError);
      
      // If fallback is enabled, let the caller know WebSocket failed
      if (fallbackToPolling) {
        console.log('WebSocket Hook: Falling back to polling mechanism');
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [token, authIsAuthenticated, isSupported, isConnected, onAssessmentUpdate, onConnected, onDisconnected, onError, fallbackToPolling]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback((): void => {
    console.log('WebSocket Hook: Disconnecting...');
    wsServiceRef.current.disconnect();
    setIsConnected(false);
    setIsAuthenticated(false);
    setSubscribedJobs([]);
    setConnectionError(null);
  }, []);

  /**
   * Subscribe to job updates
   */
  const subscribeToJob = useCallback((jobId: string): void => {
    if (!isAuthenticated) {
      console.warn('WebSocket Hook: Cannot subscribe - not authenticated');
      return;
    }

    console.log('WebSocket Hook: Subscribing to job', jobId);
    wsServiceRef.current.subscribeToJob(jobId);
    
    setSubscribedJobs(prev => {
      if (prev.includes(jobId)) return prev;
      return [...prev, jobId];
    });
  }, [isAuthenticated]);

  /**
   * Unsubscribe from job updates
   */
  const unsubscribeFromJob = useCallback((jobId: string): void => {
    console.log('WebSocket Hook: Unsubscribing from job', jobId);
    wsServiceRef.current.unsubscribeFromJob(jobId);
    
    setSubscribedJobs(prev => prev.filter(id => id !== jobId));
  }, []);

  /**
   * Auto-connect effect
   */
  useEffect(() => {
    if (autoConnect && token && authIsAuthenticated && isSupported && !isConnected && !isConnectingRef.current) {
      console.log('WebSocket Hook: Auto-connecting...');
      connect().catch(error => {
        console.error('WebSocket Hook: Auto-connect failed', error);
      });
    }
  }, [autoConnect, token, authIsAuthenticated, isSupported, isConnected, connect]);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (isConnected) {
        console.log('WebSocket Hook: Cleaning up connection...');
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  /**
   * Auth change effect - disconnect if auth is lost
   */
  useEffect(() => {
    if (!authIsAuthenticated && isConnected) {
      console.log('WebSocket Hook: Auth lost, disconnecting...');
      disconnect();
    }
  }, [authIsAuthenticated, isConnected, disconnect]);

  return {
    // Connection state
    isConnected,
    isAuthenticated,
    isSupported,
    connectionError,
    
    // Methods
    connect,
    disconnect,
    subscribeToJob,
    unsubscribeFromJob,
    
    // Status
    subscribedJobs,
  };
}

/**
 * Hook specifically for assessment job monitoring
 * Automatically subscribes to a job and handles the complete workflow
 */
export function useAssessmentJobMonitor(
  jobId: string | null,
  options: {
    onQueued?: (event: AssessmentWebSocketEvent) => void;
    onProcessing?: (event: AssessmentWebSocketEvent) => void;
    onCompleted?: (event: AssessmentWebSocketEvent) => void;
    onFailed?: (event: AssessmentWebSocketEvent) => void;
    autoConnect?: boolean;
    fallbackToPolling?: boolean;
  } = {}
) {
  const {
    onQueued,
    onProcessing,
    onCompleted,
    onFailed,
    autoConnect = true,
    fallbackToPolling = true,
  } = options;

  const webSocket = useAssessmentWebSocket({
    autoConnect,
    fallbackToPolling,
    onAssessmentUpdate: (event) => {
      // Only handle events for our job
      if (event.jobId !== jobId) return;

      switch (event.type) {
        case 'assessment-queued':
          onQueued?.(event);
          break;
        case 'assessment-processing':
          onProcessing?.(event);
          break;
        case 'assessment-completed':
          onCompleted?.(event);
          break;
        case 'assessment-failed':
          onFailed?.(event);
          break;
      }
    },
  });

  // Subscribe to job when jobId is available and WebSocket is authenticated
  useEffect(() => {
    if (jobId && webSocket.isAuthenticated) {
      console.log('Assessment Job Monitor: Subscribing to job', jobId);
      webSocket.subscribeToJob(jobId);

      return () => {
        console.log('Assessment Job Monitor: Unsubscribing from job', jobId);
        webSocket.unsubscribeFromJob(jobId);
      };
    }
  }, [jobId, webSocket.isAuthenticated, webSocket.subscribeToJob, webSocket.unsubscribeFromJob]);

  return {
    ...webSocket,
    jobId,
    isMonitoring: jobId ? webSocket.subscribedJobs.includes(jobId) : false,
  };
}
