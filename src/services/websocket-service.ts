/**
 * Simplified WebSocket Service
 * Clean, efficient WebSocket implementation for assessment monitoring
 */

import { io, Socket } from 'socket.io-client';

// WebSocket Event Types
export interface WebSocketEvent {
  type: 'analysis-started' | 'analysis-complete' | 'analysis-failed' | 'token-balance-updated';
  jobId?: string;
  resultId?: string;
  status?: string;
  message?: string;
  error?: string;
  metadata?: {
    assessmentName?: string;
    processingTime?: string;
    estimatedProcessingTime?: string;
    errorType?: string;
    balance?: number;
  };
  timestamp?: string;
  // API-specific fields (for backward compatibility)
  result_id?: string;
  assessment_name?: string;
}

// Callback types
export type EventCallback = (event: WebSocketEvent) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: Error) => void;

// Configuration - Optimized dengan exponential backoff
const WS_CONFIG = {
  URL: 'https://api.futureguide.id',

  // Connection settings
  CONNECTION_TIMEOUT: 10000, // 10 seconds - faster failure detection
  AUTHENTICATION_TIMEOUT: 8000, // 8 seconds

  // Reconnection settings - IMPROVED dengan exponential backoff
  RECONNECTION_ATTEMPTS: 5, // Increased to 5 attempts
  RECONNECTION_DELAY: 3000, // Initial delay: 3 seconds
  RECONNECTION_DELAY_MAX: 60000, // Max delay: 60 seconds (increased from 10s)
  BACKOFF_MULTIPLIER: 2, // Exponential backoff multiplier
  MAX_BACKOFF_DELAY: 300000, // 5 minutes max backoff after all attempts failed

  // Heartbeat - DISABLED (use Socket.IO built-in ping/pong only)
  HEARTBEAT_INTERVAL: 0, // Disabled - rely on Socket.IO's built-in mechanism

  // Error throttling
  ERROR_LOG_THROTTLE: 5000, // Log same error max once per 5 seconds
} as const;

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private subscribedJobs = new Set<string>();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Reconnection tracking dengan exponential backoff
  private reconnectAttempts = 0;
  private backoffDelay: number = WS_CONFIG.RECONNECTION_DELAY;

  // Server availability tracking
  private serverUnavailable = false;
  private lastErrorLog: { [key: string]: number } = {};
  private corsErrorCount = 0;

  // Event callbacks (primary single-callback interface kept for backward compatibility)
  private callbacks: {
    onEvent: EventCallback | null;
    onConnected: ConnectionCallback | null;
    onDisconnected: ConnectionCallback | null;
    onError: ErrorCallback | null;
  } = {
    onEvent: null,
    onConnected: null,
    onDisconnected: null,
    onError: null,
  };

  // Additional event listeners to avoid clobbering when multiple consumers want events
  private eventListeners: Set<EventCallback> = new Set();

  /**
   * Throttled error logging to prevent console spam
   */
  private logErrorThrottled(key: string, message: string, ...args: any[]): void {
    const now = Date.now();
    const lastLog = this.lastErrorLog[key] || 0;
    
    if (now - lastLog > WS_CONFIG.ERROR_LOG_THROTTLE) {
      console.error(message, ...args);
      this.lastErrorLog[key] = now;
    }
  }

  /**
   * Check if error is CORS-related
   */
  private isCorsError(error: any): boolean {
    const errorStr = error?.message?.toLowerCase() || '';
    return errorStr.includes('cors') || 
           errorStr.includes('access-control') ||
           errorStr.includes('502') ||
           errorStr.includes('bad gateway');
  }

  /**
   * Connect to WebSocket server - SIMPLIFIED
   */
  async connect(token: string): Promise<void> {
    // Check if server is marked as unavailable
    if (this.serverUnavailable) {
      console.warn('⚠️ WebSocket Service: Server unavailable, skipping connection');
      return Promise.reject(new Error('Server unavailable - backend is not running'));
    }

    // Return existing connection promise if already connecting
    if (this.isConnecting && this.connectionPromise) {
      console.log('♻️ WebSocket Service: Already connecting, reusing promise');
      return this.connectionPromise;
    }

    // If already connected with same token, return immediately
    if (this.isConnected && this.isAuthenticated && this.token === token) {
      console.log('✅ WebSocket Service: Already connected, reusing connection');
      return Promise.resolve();
    }

    // If token changed, disconnect first
    if (this.socket && this.token !== token) {
      console.log('🔄 WebSocket Service: Token changed, reconnecting');
      this.disconnect();
    }

    // Create new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      this.isConnecting = true;
      this.token = token;

      console.log('🔌 WebSocket Service: Connecting to', WS_CONFIG.URL);

      // Create socket with SIMPLIFIED configuration
      this.socket = io(WS_CONFIG.URL, {
        autoConnect: false,

        // Reconnection - REDUCED to fail fast when server is down
        reconnection: true,
        reconnectionAttempts: WS_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: WS_CONFIG.RECONNECTION_DELAY,
        reconnectionDelayMax: WS_CONFIG.RECONNECTION_DELAY_MAX,

        // Timeout - REDUCED for faster failure detection
        timeout: WS_CONFIG.CONNECTION_TIMEOUT,

        // Transport - Start with polling (more reliable)
        transports: ['polling', 'websocket'],
        upgrade: true,

        // Path
        path: '/socket.io/',
      });

      if (!this.socket) {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(new Error('Failed to create socket'));
        return;
      }

      // Setup event listeners
      this.setupEventListeners();

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        this.isConnecting = false;
        this.connectionPromise = null;
        this.socket?.disconnect();
        reject(new Error('Connection timeout'));
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      // Handle successful connection
      this.socket.once('connect', () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.serverUnavailable = false; // Reset server unavailable flag
        this.corsErrorCount = 0; // Reset CORS error count

        console.log('✅ WebSocket Service: Connected, socket ID:', this.socket?.id);

        // Authenticate after connection
        this.authenticate()
          .then(() => {
            this.isConnecting = false;
            this.connectionPromise = null;
            this.startHeartbeat();
            console.log('✅ WebSocket Service: Ready');
            resolve();
          })
          .catch((error) => {
            this.isConnecting = false;
            this.connectionPromise = null;
            console.error('❌ WebSocket Service: Auth failed:', error);
            reject(error);
          });
      });

      // Handle connection error
      this.socket.once('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.reconnectAttempts++;

        // Check for CORS/server unavailable errors
        const isCorsError = this.isCorsError(error);
        const isXhrPollError = error?.message?.includes('xhr poll error');

        if (isCorsError || isXhrPollError) {
          this.corsErrorCount++;

          // If we get 2+ CORS/poll errors, mark server as unavailable
          if (this.corsErrorCount >= 2) {
            this.serverUnavailable = true;
            console.error('🚫 WebSocket Service: Server unavailable (CORS/Network error)');
            reject(new Error('Server unavailable - please check if backend is running'));
            return;
          }
        }

        console.error(`❌ WebSocket Service: Connection failed (${this.reconnectAttempts}/${WS_CONFIG.RECONNECTION_ATTEMPTS})`, error);

        const errorMessage = this.reconnectAttempts >= WS_CONFIG.RECONNECTION_ATTEMPTS
          ? `WebSocket connection failed: ${error?.message || 'Unknown error'}`
          : `WebSocket connection failed: ${error?.message || error}`;

        reject(new Error(errorMessage));
      });

      // Start connection
      console.log('🔌 WebSocket Service: Connecting...');
      this.socket.connect();
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket server - SIMPLIFIED
   */
  disconnect(): void {
    console.log('🔌 WebSocket Service: Disconnecting...');

    // Stop heartbeat
    this.stopHeartbeat();

    if (this.socket) {
      // Keep subscriptions for reconnection
      if (this.subscribedJobs.size > 0) {
        console.log(`💾 Keeping ${this.subscribedJobs.size} subscriptions for reconnect`);
      }

      // Clean up socket
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset state (keep subscribedJobs for reconnection)
    this.isConnected = false;
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.token = null;
    this.reconnectAttempts = 0;

    console.log('✅ WebSocket Service: Disconnected');
    this.callbacks.onDisconnected?.();
  }

  /**
   * Subscribe to assessment job updates
   */
  subscribeToJob(jobId: string): void {
    if (!this.isAuthenticated || !this.socket) {
      console.warn('WebSocket Service: Cannot subscribe - not authenticated');
      return;
    }

    if (this.subscribedJobs.has(jobId)) {
      console.log('WebSocket Service: Already subscribed to job', jobId);
      return;
    }

    console.log('WebSocket Service: Subscribing to job', jobId);
    this.socket.emit('subscribe-assessment', { jobId });
    this.subscribedJobs.add(jobId);
  }

  /**
   * Unsubscribe from assessment job updates
   */
  unsubscribeFromJob(jobId: string): void {
    if (!this.socket) {
      console.log('WebSocket Service: No socket, just removing from local set:', jobId);
      this.subscribedJobs.delete(jobId);
      return;
    }

    console.log('WebSocket Service: Unsubscribing from job', jobId);
    this.socket.emit('unsubscribe-assessment', { jobId });
    this.subscribedJobs.delete(jobId);
  }

  /**
   * Clear all subscriptions (useful for logout)
   */
  clearAllSubscriptions(): void {
    console.log(`WebSocket Service: Clearing all ${this.subscribedJobs.size} subscriptions`);

    if (this.socket && this.isConnected) {
      this.subscribedJobs.forEach(jobId => {
        this.socket?.emit('unsubscribe-assessment', { jobId });
      });
    }

    this.subscribedJobs.clear();
  }

  /**
   * Set event callbacks (backward compatible)
   */
  setCallbacks(callbacks: Partial<typeof this.callbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Add an additional event listener without overriding the primary callback
   */
  addEventListener(listener: EventCallback): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Clear all additional event listeners
   */
  clearEventListeners(): void {
    this.eventListeners.clear();
  }

  /**
   * Reset server availability flag (call this when you want to retry connection)
   */
  resetServerAvailability(): void {
    console.log('🔄 WebSocket Service: Resetting server availability flag');
    this.serverUnavailable = false;
    this.corsErrorCount = 0;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      serverUnavailable: this.serverUnavailable,
      isAuthenticated: this.isAuthenticated,
      subscribedJobs: Array.from(this.subscribedJobs),
      socketId: this.socket?.id || null,
    };
  }

  /**
   * Check if WebSocket is supported
   */
  static isSupported(): boolean {
    return typeof WebSocket !== 'undefined' || typeof window !== 'undefined';
  }

  /**
   * Authenticate with the server
   */
  private authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.token) {
        reject(new Error('No socket or token available'));
        return;
      }

      console.log('WebSocket Service: Authenticating...');

      // Set up authentication timeout
      const authTimeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, WS_CONFIG.AUTHENTICATION_TIMEOUT);

      // Handle authentication success
      this.socket.once('authenticated', () => {
        clearTimeout(authTimeout);
        this.isAuthenticated = true;
        console.log('WebSocket Service: Authenticated successfully');
        resolve();
      });

      // Handle authentication failure
      this.socket.once('auth_error', (error) => {
        clearTimeout(authTimeout);
        console.error('WebSocket Service: Authentication failed', error);
        reject(new Error(`Authentication failed: ${error?.message || error}`));
      });

      // Send authentication
      this.socket.emit('authenticate', { token: this.token });
    });
  }

  /**
   * Setup event listeners - SIMPLIFIED
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ WebSocket: Connected');
      this.callbacks.onConnected?.();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isAuthenticated = false;
      this.stopHeartbeat();
      console.log('❌ WebSocket: Disconnected -', reason);
      this.callbacks.onDisconnected?.();
    });

    this.socket.on('connect_error', (error) => {
      const isCors = this.isCorsError(error);
      const isXhrPoll = error?.message?.includes('xhr poll error');

      if (isCors || isXhrPoll) {
        this.corsErrorCount++;

        // Log once
        if (this.corsErrorCount === 1) {
          console.error('🚫 WebSocket: Server not accessible - Backend may be offline');
        }

        // After 2 errors, mark server as unavailable
        if (this.corsErrorCount >= 2) {
          this.serverUnavailable = true;
          this.disconnect();
          return;
        }
      }

      this.callbacks.onError?.(new Error(`Connection error: ${error?.message || error}`));
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      // EXPONENTIAL BACKOFF FIX: Calculate delay dengan jitter
      this.backoffDelay = Math.min(
        WS_CONFIG.RECONNECTION_DELAY * Math.pow(WS_CONFIG.BACKOFF_MULTIPLIER, attemptNumber - 1),
        WS_CONFIG.RECONNECTION_DELAY_MAX
      );

      // Add jitter (random 0-20% variation) untuk prevent thundering herd
      const jitter = this.backoffDelay * 0.2 * Math.random();
      this.backoffDelay += jitter;

      console.log(`🔄 WebSocket: Reconnecting in ${Math.round(this.backoffDelay)}ms (attempt ${attemptNumber}/${WS_CONFIG.RECONNECTION_ATTEMPTS})`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket: Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;

      // Reset backoff on successful reconnect
      this.reconnectAttempts = 0;
      this.backoffDelay = WS_CONFIG.RECONNECTION_DELAY;
      this.serverUnavailable = false;
      this.corsErrorCount = 0;

      // Re-authenticate
      if (this.token) {
        this.authenticate()
          .then(() => {
            this.startHeartbeat();

            // Re-subscribe to jobs
            if (this.subscribedJobs.size > 0) {
              console.log(`📡 WebSocket: Re-subscribing to ${this.subscribedJobs.size} jobs`);
              this.subscribedJobs.forEach(jobId => {
                this.socket?.emit('subscribe-assessment', { jobId });
              });
            }
          })
          .catch((error) => {
            console.error('❌ WebSocket: Re-auth failed:', error);
          });
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket: All reconnection attempts failed');
      this.callbacks.onError?.(new Error('Reconnection failed'));

      // Mark server as unavailable dan wait longer before allowing retry
      this.serverUnavailable = true;

      setTimeout(() => {
        this.serverUnavailable = false;
        console.log('🔄 WebSocket: Server marked as potentially available, retry allowed');
      }, WS_CONFIG.MAX_BACKOFF_DELAY);
    });

    // Analysis events - SIMPLIFIED
    const emitEvent = (event: WebSocketEvent) => {
      this.callbacks.onEvent?.(event);
      this.eventListeners.forEach((cb) => {
        try { cb(event); } catch (e) { /* ignore */ }
      });
    };

    this.socket.on('analysis-started', (data: any) => {
      console.log('📊 WebSocket: Analysis started');
      emitEvent({
        type: 'analysis-started',
        jobId: data.jobId,
        status: data.status || 'started',
        message: data.message,
        metadata: {
          assessmentName: data.assessment_name,
          estimatedProcessingTime: data.estimated_processing_time,
          ...data.metadata
        },
        timestamp: data.timestamp,
        assessment_name: data.assessment_name
      } as any);
    });

    this.socket.on('analysis-complete', (data: any) => {
      console.log('✅ WebSocket: Analysis complete');
      emitEvent({
        type: 'analysis-complete',
        jobId: data.jobId,
        resultId: data.result_id || data.resultId,
        status: data.status || 'berhasil',
        message: data.message,
        metadata: {
          assessmentName: data.assessment_name,
          processingTime: data.processing_time,
          ...data.metadata
        },
        timestamp: data.timestamp,
        result_id: data.result_id,
        assessment_name: data.assessment_name
      } as any);
    });

    this.socket.on('analysis-failed', (data: any) => {
      console.log('❌ WebSocket: Analysis failed');
      emitEvent({
        type: 'analysis-failed',
        jobId: data.jobId,
        error: data.error,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      });
    });

    this.socket.on('token-balance-update', (data: { balance: number }) => {
      console.log('💰 WebSocket: Token balance update');
      emitEvent({
        type: 'token-balance-updated',
        metadata: { balance: data.balance }
      });
    });

    // Error events
    this.socket.on('error', (error) => {
      this.logErrorThrottled('socket-error', '❌ WebSocket: Server error', error);
      this.callbacks.onError?.(new Error(`Server error: ${error?.message || error}`));
    });

    // Engine error monitoring
    this.socket.io.on('error', (error) => {
      this.logErrorThrottled('engine-error', '❌ WebSocket: Engine error', error);
    });
  }

  /**
   * Start heartbeat - SIMPLIFIED (use Socket.IO built-in only)
   */
  private startHeartbeat(): void {
    // DISABLED: Custom heartbeat not needed
    // Socket.IO has built-in ping/pong mechanism that works well
    if (WS_CONFIG.HEARTBEAT_INTERVAL > 0) {
      this.stopHeartbeat();

      this.heartbeatInterval = setInterval(() => {
        if (this.socket && this.isConnected && this.isAuthenticated) {
          this.socket.emit('ping');
        } else {
          this.stopHeartbeat();
        }
      }, WS_CONFIG.HEARTBEAT_INTERVAL);
    }
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance
let webSocketInstance: WebSocketService | null = null;

/**
 * Get singleton WebSocket Service instance
 */
export function getWebSocketService(): WebSocketService {
  if (!webSocketInstance) {
    webSocketInstance = new WebSocketService();
  }
  return webSocketInstance;
}

/**
 * Check if WebSocket is supported
 */
export function isWebSocketSupported(): boolean {
  return WebSocketService.isSupported();
}

export default WebSocketService;
