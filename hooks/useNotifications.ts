/**
 * React Hook for WebSocket notifications following API documentation
 * Provides real-time notifications for analysis status updates
 */

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface NotificationData {
  jobId?: string;
  resultId?: string;
  status?: string;
  message?: string;
  error?: string;
  metadata?: {
    assessmentName?: string;
    estimatedProcessingTime?: string;
    processingTime?: string;
    errorType?: string;
  };
  timestamp?: string;
}

export interface Notification extends NotificationData {
  type: 'info' | 'success' | 'error';
  id: string;
}

export const useNotifications = (token?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;

    // Create socket connection following API documentation
    const newSocket = io('https://api.chhrone.web.id', {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    newSocket.connect();

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to notification service');
      setConnected(true);
      
      // Authenticate with JWT token within 10 seconds
      newSocket.emit('authenticate', { token });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification service');
      setConnected(false);
      setAuthenticated(false);
    });

    // Authentication events (following API documentation)
    newSocket.on('authenticated', (data) => {
      console.log('Authenticated successfully:', data);
      // Expected format: { success: true, userId: "uuid", email: "user@example.com" }
      setAuthenticated(true);
      console.log(`User joined to notification room: user:${data.userId}`);
    });

    newSocket.on('auth_error', (error) => {
      console.error('Authentication failed:', error);
      // Expected format: { message: "Token required" | "Authentication timeout" | "Invalid token" }
      setAuthenticated(false);
    });

    // Analysis events following API documentation
    newSocket.on('analysis-started', (data: NotificationData) => {
      console.log('Analysis started:', data);
      const notification: Notification = {
        ...data,
        type: 'info',
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      };
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('analysis-complete', (data: NotificationData) => {
      console.log('Analysis completed:', data);
      const notification: Notification = {
        ...data,
        type: 'success',
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      };
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('analysis-failed', (data: NotificationData) => {
      console.error('Analysis failed:', data);
      const notification: Notification = {
        ...data,
        type: 'error',
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      };
      setNotifications(prev => [...prev, notification]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    socket,
    connected,
    authenticated,
    notifications,
    clearNotifications,
    removeNotification
  };
};
