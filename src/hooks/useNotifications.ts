/**
 * React Hook for WebSocket notifications following API documentation
 * Provides real-time notifications for analysis status updates
 */

import { useEffect, useState, useCallback } from 'react';
import { getWebSocketService } from '../services/notificationService';

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
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;

    const ws = getWebSocketService();

    // CRITICAL FIX: Register event listener BEFORE connecting to avoid race condition
    // This ensures we don't miss any events that arrive during/immediately after connection
    const removeEventListener = ws.addEventListener((data: any) => {
      if (data?.type === 'authenticated') {
        setAuthenticated(true);
        return;
      }
      if (data?.type === 'analysis-started') {
        const notification: Notification = { ...data, type: 'info', id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}` };
        setNotifications(prev => [...prev, notification]);
      } else if (data?.type === 'analysis-complete') {
        const notification: Notification = { ...data, type: 'success', id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}` };
        setNotifications(prev => [...prev, notification]);
      } else if (data?.type === 'analysis-failed') {
        const notification: Notification = { ...data, type: 'error', id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}` };
        setNotifications(prev => [...prev, notification]);
      }
    });

    console.log('useNotifications: Event listener registered (before connect)');

    // Check connection status to update state
    const checkStatus = () => {
      const status = ws.getStatus();
      setConnected(status.isConnected);
      setAuthenticated(status.isAuthenticated);
    };

    // Initial status check
    checkStatus();

    // Connect if not already connected
    const authToken = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    if (!authToken) {
      // Clean up listener if no token
      removeEventListener();
      return;
    }

    // Only connect if not already connected
    const status = ws.getStatus();
    if (!status.isConnected) {
      ws.connect(authToken).then(() => {
        setConnected(true);
        setAuthenticated(true);
        console.log('useNotifications: WebSocket connected');
      }).catch(() => {
        setConnected(false);
        setAuthenticated(false);
        console.warn('useNotifications: WebSocket connection failed');
      });
    } else {
      console.log('useNotifications: WebSocket already connected, reusing connection');
    }

    return () => {
      // Only remove this hook's event listener, don't disconnect the shared WebSocket
      removeEventListener();
    };
  }, [token]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    connected,
    authenticated,
    notifications,
    clearNotifications,
    removeNotification
  };
};
