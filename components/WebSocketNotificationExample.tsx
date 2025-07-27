/**
 * Example React Component for WebSocket Notifications
 * Following API documentation: https://api.chhrone.web.id
 * 
 * This component demonstrates proper WebSocket implementation
 * according to the ATMA API documentation
 */

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisEvent {
  jobId: string;
  status: 'started' | 'completed' | 'failed';
  message: string;
  metadata?: {
    assessmentName?: string;
    estimatedProcessingTime?: string;
    processingTime?: string;
    errorType?: string;
  };
  timestamp: string;
  resultId?: string; // For completed events
  error?: string; // For failed events
}

interface AuthenticatedData {
  success: boolean;
  userId: string;
  email: string;
}

interface AuthError {
  message: 'Token required' | 'Authentication timeout' | 'Invalid token';
}

export const WebSocketNotificationExample: React.FC = () => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<AuthenticatedData | null>(null);

  useEffect(() => {
    if (!token) return;

    console.log('🔌 Connecting to WebSocket API...');
    
    // Create socket connection following API documentation
    const newSocket = io('https://api.chhrone.web.id', {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to notification service');
      setConnected(true);
      setConnectionError(null);
      
      // Authenticate with JWT token within 10 seconds (API requirement)
      console.log('🔐 Authenticating...');
      newSocket.emit('authenticate', { token });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      setConnected(false);
      setAuthenticated(false);
      setUserInfo(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnectionError(error.message);
    });

    // Authentication events (following API documentation)
    newSocket.on('authenticated', (data: AuthenticatedData) => {
      console.log('✅ Authenticated successfully:', data);
      setAuthenticated(true);
      setUserInfo(data);
      console.log(`📋 Joined to notification room: user:${data.userId}`);
    });

    newSocket.on('auth_error', (error: AuthError) => {
      console.error('❌ Authentication failed:', error);
      setConnectionError(`Authentication failed: ${error.message}`);
      setAuthenticated(false);
    });

    // Analysis events (following API documentation)
    newSocket.on('analysis-started', (data: AnalysisEvent) => {
      console.log('🔄 Analysis started:', data);
      setEvents(prev => [...prev, { ...data, status: 'started' }]);
    });

    newSocket.on('analysis-complete', (data: AnalysisEvent) => {
      console.log('✅ Analysis completed:', data);
      setEvents(prev => [...prev, { ...data, status: 'completed' }]);
    });

    newSocket.on('analysis-failed', (data: AnalysisEvent) => {
      console.log('❌ Analysis failed:', data);
      setEvents(prev => [...prev, { ...data, status: 'failed' }]);
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setConnectionError(error.message || 'Unknown socket error');
    });

    // Connect to server
    newSocket.connect();
    setSocket(newSocket);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      newSocket.close();
    };
  }, [token]);

  const getEventIcon = (status: string) => {
    switch (status) {
      case 'started': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '📢';
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'started': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed': return 'bg-green-50 border-green-200 text-green-800';
      case 'failed': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">WebSocket Notifications (API Compliant)</h2>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Connection Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm">Connected: {connected ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${authenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm">Authenticated: {authenticated ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm">API: api.chhrone.web.id</span>
          </div>
        </div>
        
        {userInfo && (
          <div className="mt-3 p-2 bg-green-100 rounded text-sm">
            <strong>User:</strong> {userInfo.email} (ID: {userInfo.userId})
          </div>
        )}
        
        {connectionError && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
            <strong>Error:</strong> {connectionError}
          </div>
        )}
      </div>

      {/* Events */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Analysis Events</h3>
          <button
            onClick={clearEvents}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            disabled={events.length === 0}
          >
            Clear Events
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-6 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            <p>No events received yet.</p>
            <p className="text-sm mt-2">Start an analysis to see real-time notifications.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getEventColor(event.status)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getEventIcon(event.status)}</span>
                  <div className="flex-1">
                    <div className="font-medium">{event.message}</div>
                    <div className="text-sm opacity-75 mt-1">
                      Job ID: {event.jobId}
                    </div>
                    {event.resultId && (
                      <div className="text-sm opacity-75">
                        Result ID: {event.resultId}
                      </div>
                    )}
                    {event.metadata && (
                      <div className="text-sm opacity-75 mt-2">
                        {event.metadata.assessmentName && (
                          <div>Assessment: {event.metadata.assessmentName}</div>
                        )}
                        {event.metadata.estimatedProcessingTime && (
                          <div>Estimated Time: {event.metadata.estimatedProcessingTime}</div>
                        )}
                        {event.metadata.processingTime && (
                          <div>Processing Time: {event.metadata.processingTime}</div>
                        )}
                        {event.metadata.errorType && (
                          <div>Error Type: {event.metadata.errorType}</div>
                        )}
                      </div>
                    )}
                    <div className="text-xs opacity-50 mt-2">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation Reference */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">API Documentation</h4>
        <p className="text-sm text-blue-700">
          This component follows the WebSocket implementation as documented in the ATMA API.
          Events are automatically received when user is authenticated and joined to room <code>user:{'{userId}'}</code>.
        </p>
      </div>
    </div>
  );
};
