import io from 'socket.io-client';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.callbacks = {
      onAuthenticated: null,
      onAuthError: null,
      onAnalysisStarted: null,
      onAnalysisComplete: null,
      onAnalysisFailed: null,
      onConnect: null,
      onDisconnect: null
    };
  }

  connect(token, options = {}) {
    if (this.socket) {
      this.disconnect();
    }

    // Updated to match API documentation
    const socketUrl = options.url || (process.env.NODE_ENV === 'production'
      ? 'https://api.futureguide.id'
      : 'http://localhost:3000');

    this.socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      ...options.socketOptions
    });

    this.token = token;
    this.setupEventListeners();
    this.socket.connect();

    return this;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
  }

  authenticate() {
    if (this.socket && this.socket.connected && this.token) {
      this.socket.emit('authenticate', { token: this.token });
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.authenticate();
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.isAuthenticated = false;
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      // Connection failed - handled silently
    });

    this.socket.on('reconnect_failed', () => {
      // Failed to reconnect after maximum attempts - handled silently
    });

    // Authentication events
    this.socket.on('authenticated', () => {
      this.isAuthenticated = true;
      this.callbacks.onAuthenticated?.();
    });

    this.socket.on('auth_error', (error) => {
      this.isAuthenticated = false;
      this.callbacks.onAuthError?.(error);
    });

    // Notification events - Updated to match API documentation
    this.socket.on('analysis-started', (data) => {
      this.callbacks.onAnalysisStarted?.(data);
    });

    this.socket.on('analysis-complete', (data) => {
      this.callbacks.onAnalysisComplete?.(data);
    });

    this.socket.on('analysis-failed', (data) => {
      this.callbacks.onAnalysisFailed?.(data);
    });
  }

  // Callback setters
  onAuthenticated(callback) {
    this.callbacks.onAuthenticated = callback;
    return this;
  }

  onAuthError(callback) {
    this.callbacks.onAuthError = callback;
    return this;
  }

  onAnalysisStarted(callback) {
    this.callbacks.onAnalysisStarted = callback;
    return this;
  }

  onAnalysisComplete(callback) {
    this.callbacks.onAnalysisComplete = callback;
    return this;
  }

  onAnalysisFailed(callback) {
    this.callbacks.onAnalysisFailed = callback;
    return this;
  }

  onConnect(callback) {
    this.callbacks.onConnect = callback;
    return this;
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect = callback;
    return this;
  }

  // Status getters
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      socketId: this.socket?.id
    };
  }
}

// Browser notification helpers (to replace notification-service.ts convenience functions)
export async function showAssessmentCompleteNotification(data) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch (_) {}
  }
  if (Notification.permission !== 'granted') return null;
  const n = new Notification('🎉 Assessment Complete!', {
    body: `Your ${data.assessmentType} assessment has been completed and is ready to view.`,
    icon: '/icons/assessment-complete.png',
    tag: `assessment-${data.assessmentId}`,
    requireInteraction: true,
    data,
  });
  n.onclick = () => { window.focus(); window.location.href = data.resultUrl; n.close(); };
  return n;
}

export async function showAssessmentProcessingNotification(assessmentType, estimatedTime) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (_) {} }
  if (Notification.permission !== 'granted') return null;
  return new Notification('⏳ Assessment Processing', {
    body: `Your ${assessmentType} assessment is being processed${estimatedTime ? `. Estimated time: ${estimatedTime}` : ''}.`,
    icon: '/icons/assessment-processing.png',
    tag: 'assessment-processing',
    silent: true,
    requireInteraction: false,
  });
}

export async function showAssessmentFailedNotification(assessmentType, error) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (_) {} }
  if (Notification.permission !== 'granted') return null;
  return new Notification('❌ Assessment Failed', {
    body: `Your ${assessmentType} assessment failed to process${error ? `: ${error}` : ''}. Please try again.`,
    icon: '/icons/assessment-failed.png',
    tag: 'assessment-failed',
    requireInteraction: true,
  });
}


// Create singleton instance
const notificationService = new NotificationService();

// Minimal WebSocket facade re-exports so consumers don't need to import websocket-service directly
// Note: keep this light; api surface remains the same 3 public services
import { getWebSocketService as _getWebSocketService, isWebSocketSupported as _isWebSocketSupported } from './websocket-service';
export const getWebSocketService = _getWebSocketService;
export const isWebSocketSupported = _isWebSocketSupported;

export default notificationService;
