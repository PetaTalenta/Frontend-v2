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
    errorType?: string;
    balance?: number;
  };
  timestamp?: string;
}

// Callback types
export type EventCallback = (event: WebSocketEvent) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: Error) => void;

// Configuration - Updated to match documentation
const WS_CONFIG = {
  URL: 'https://api.chhrone.web.id',
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,        // Reduced from 2000ms
  CONNECTION_TIMEOUT: 15000,       // Reduced from 20000ms for better UX
  AUTHENTICATION_TIMEOUT: 10000,   // Reduced from 15000ms
  HEARTBEAT_INTERVAL: 20000,       // Reduced from 30000ms
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
  private reconnectAttempts = 0;
  
  // Event callbacks
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

  /**
   * Connect to WebSocket server
   */
  async connect(token: string): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected with same token, return resolved promise
    if (this.isConnected && this.isAuthenticated && this.token === token) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        this.isConnecting = true;

        // Disconnect existing connection first
        if (this.socket) {
          this.disconnect();
        }

        this.token = token;

        console.log('WebSocket Service: Connecting to', WS_CONFIG.URL);

        // Create socket connection
        this.socket = io(WS_CONFIG.URL, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: WS_CONFIG.RECONNECTION_ATTEMPTS,
          reconnectionDelay: WS_CONFIG.RECONNECTION_DELAY,
          timeout: WS_CONFIG.CONNECTION_TIMEOUT,
          transports: ['websocket', 'polling'],
          forceNew: true,
        });

        this.setupEventListeners();
        
        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, WS_CONFIG.CONNECTION_TIMEOUT);

        // Handle successful connection
        this.socket.once('connect', () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          console.log('WebSocket Service: Connected successfully');
          this.authenticate().then(() => {
            this.isConnecting = false;
            this.connectionPromise = null;
            this.startHeartbeat(); // Start heartbeat after authentication
            resolve();
          }).catch((error) => {
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(error);
          });
        });

        // Handle connection error
        this.socket.once('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.reconnectAttempts++;

          console.error(`WebSocket Service: Connection failed (attempt ${this.reconnectAttempts}/${WS_CONFIG.RECONNECTION_ATTEMPTS})`, error);

          // Provide more helpful error message
          const errorMessage = this.reconnectAttempts >= WS_CONFIG.RECONNECTION_ATTEMPTS
            ? `WebSocket connection failed after ${WS_CONFIG.RECONNECTION_ATTEMPTS} attempts. Please check your internet connection and try again later.`
            : `WebSocket connection failed: ${error?.message || error}`;

          reject(new Error(errorMessage));
        });

        // Start connection
        this.socket.connect();

      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    // Stop heartbeat
    this.stopHeartbeat();

    if (this.socket) {
      console.log('WebSocket Service: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset all connection state
    this.isConnected = false;
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.subscribedJobs.clear();
    this.token = null;
    this.reconnectAttempts = 0;

    // Notify callbacks
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
    if (!this.socket) return;

    console.log('WebSocket Service: Unsubscribing from job', jobId);
    this.socket.emit('unsubscribe-assessment', { jobId });
    this.subscribedJobs.delete(jobId);
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: Partial<typeof this.callbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
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
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('WebSocket Service: Connected');
      this.callbacks.onConnected?.();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isAuthenticated = false;
      this.stopHeartbeat(); // Stop heartbeat on disconnect
      console.log('WebSocket Service: Disconnected', reason);
      this.callbacks.onDisconnected?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket Service: Connection error', error);
      this.callbacks.onError?.(new Error(`Connection error: ${error?.message || error}`));
    });

    // Analysis events
    this.socket.on('analysis-started', (data: any) => {
      console.log('WebSocket Service: Analysis started', data);
      const event: WebSocketEvent = {
        type: 'analysis-started',
        jobId: data.jobId,
        status: data.status,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      };
      this.callbacks.onEvent?.(event);
    });

    this.socket.on('analysis-complete', (data: any) => {
      console.log('WebSocket Service: Analysis completed', data);
      const event: WebSocketEvent = {
        type: 'analysis-complete',
        jobId: data.jobId,
        resultId: data.resultId,
        status: data.status,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      };
      this.callbacks.onEvent?.(event);
    });

    this.socket.on('analysis-failed', (data: any) => {
      console.log('WebSocket Service: Analysis failed', data);
      const event: WebSocketEvent = {
        type: 'analysis-failed',
        jobId: data.jobId,
        error: data.error,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      };
      this.callbacks.onEvent?.(event);
    });

    // Token balance events
    this.socket.on('token-balance-update', (data: { balance: number }) => {
      console.log('WebSocket Service: Token balance update', data);
      const event: WebSocketEvent = {
        type: 'token-balance-updated',
        metadata: {
          balance: data.balance
        }
      };
      this.callbacks.onEvent?.(event);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('WebSocket Service: Server error', error);
      this.callbacks.onError?.(new Error(`Server error: ${error?.message || error}`));
    });

    // Pong response for heartbeat
    this.socket.on('pong', () => {
      console.log('WebSocket Service: Received pong');
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        console.log('WebSocket Service: Sending ping');
        this.socket.emit('ping');
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
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
