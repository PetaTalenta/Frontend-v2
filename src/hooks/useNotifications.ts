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

    ws.setCallbacks({
      onConnected: () => setConnected(true),
      onDisconnected: () => {
        setConnected(false);
        setAuthenticated(false);
      },
      onEvent: (data: any) => {
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
      }
    });

    const authToken = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    if (!authToken) return;
    ws.connect(authToken).catch(() => {});

    return () => {
      ws.disconnect();
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
