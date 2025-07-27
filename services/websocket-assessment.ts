/**
 * WebSocket Assessment Service
 * Provides real-time assessment notifications to replace polling mechanism
 */

import { io, Socket } from 'socket.io-client';

// WebSocket Event Types - Updated to match API documentation
export interface AssessmentWebSocketEvent {
  type: 'analysis-started' | 'analysis-complete' | 'analysis-failed' | 'token-balance-updated';
  jobId?: string;
  resultId?: string; // For completed events
  status?: string;
  message?: string;
  error?: string; // For failed events
  metadata?: {
    assessmentName?: string;
    estimatedProcessingTime?: string;
    processingTime?: string;
    errorType?: string;
    balance?: number; // For token balance events
  };
  timestamp?: string;
}

// Callback types
export type AssessmentEventCallback = (event: AssessmentWebSocketEvent) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: Error) => void;

// WebSocket Configuration - Following API documentation
const WEBSOCKET_CONFIG = {
  // Use API Gateway WebSocket endpoint as per documentation
  DEVELOPMENT_URL: 'https://api.chhrone.web.id', // Use production URL even in development
  PRODUCTION_URL: 'https://api.chhrone.web.id', // API documentation URL
  RECONNECTION_ATTEMPTS: 3,
  RECONNECTION_DELAY: 1000,
  TIMEOUT: 10000,
  CONNECTION_TIMEOUT: 15000,
  AUTHENTICATION_TIMEOUT: 10000, // Must authenticate within 10 seconds as per API docs
  HEALTH_CHECK_TIMEOUT: 1500,
  PING_TIMEOUT: 3000, // Ping timeout for connection health
  PING_INTERVAL: 10000, // Ping every 10 seconds to keep connection alive
} as const;

/**
 * Safely extract error message from various error types
 */
function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error';

  // If it's already a string
  if (typeof error === 'string') return error;

  // If it has a message property
  if (error.message && typeof error.message === 'string') return error.message;

  // If it has a toString method
  if (typeof error.toString === 'function') {
    const stringified = error.toString();
    if (stringified !== '[object Object]') return stringified;
  }

  // If it's an object, try to stringify it
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return 'Error object could not be serialized';
    }
  }

  return 'Unknown error type';
}

export class WebSocketAssessmentService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private subscribedJobIds = new Set<string>();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  
  // Event callbacks
  private callbacks: {
    onAssessmentEvent: AssessmentEventCallback | null;
    onConnected: ConnectionCallback | null;
    onDisconnected: ConnectionCallback | null;
    onError: ErrorCallback | null;
    onAuthenticated: ConnectionCallback | null;
  } = {
    onAssessmentEvent: null,
    onConnected: null,
    onDisconnected: null,
    onError: null,
    onAuthenticated: null,
  };

  /**
   * Connect to WebSocket server
   */
  connect(token: string): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.isConnecting && this.connectionPromise) {
      console.log('WebSocket Assessment: Connection already in progress, returning existing promise');
      return this.connectionPromise;
    }

    // If already connected with same token, return resolved promise
    if (this.isConnected && this.isAuthenticated && this.token === token) {
      console.log('WebSocket Assessment: Already connected and authenticated');
      return Promise.resolve();
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        this.isConnecting = true;

        // Disconnect existing connection first
        if (this.socket) {
          console.log('WebSocket Assessment: Disconnecting existing connection...');
          this.disconnect();
        }

        // Set token AFTER disconnect to avoid it being cleared
        this.token = token;

        // Determine WebSocket URL based on environment
        const wsUrl = process.env.NODE_ENV === 'production'
          ? WEBSOCKET_CONFIG.PRODUCTION_URL
          : WEBSOCKET_CONFIG.DEVELOPMENT_URL;

        console.log('WebSocket Assessment: Connecting to', wsUrl);

        // Optional: Quick health check (can be disabled for faster connection)
        // Uncomment the following lines if you want pre-connection health check
        /*
        console.log('WebSocket Assessment: Performing health check...');
        const isHealthy = await checkWebSocketHealth(wsUrl);
        if (!isHealthy) {
          reject(new Error('WebSocket server is not available. Please ensure the WebSocket server is running on ' + wsUrl));
          return;
        }
        console.log('WebSocket Assessment: Health check passed');
        */

        // Create socket connection with optimized settings
        this.socket = io(wsUrl, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: WEBSOCKET_CONFIG.RECONNECTION_ATTEMPTS,
          reconnectionDelay: WEBSOCKET_CONFIG.RECONNECTION_DELAY,
          reconnectionDelayMax: 2000, // Max delay between reconnection attempts
          timeout: WEBSOCKET_CONFIG.CONNECTION_TIMEOUT,
          transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
          forceNew: true,
          upgrade: true, // Allow transport upgrades
          rememberUpgrade: false, // Don't remember transport upgrades for faster fallback
        });

        this.setupEventListeners();
        
        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          const wsUrl = process.env.NODE_ENV === 'production'
            ? WEBSOCKET_CONFIG.PRODUCTION_URL
            : WEBSOCKET_CONFIG.DEVELOPMENT_URL;

          const timeoutMessage = process.env.NODE_ENV === 'production'
            ? 'WebSocket connection timeout'
            : `WebSocket connection timeout to ${wsUrl}. Please ensure the WebSocket server is running. For development, run: start-mock-websocket.bat`;

          reject(new Error(timeoutMessage));
        }, WEBSOCKET_CONFIG.CONNECTION_TIMEOUT);

        // Handle successful connection
        this.socket.once('connect', () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          console.log('WebSocket Assessment: Connected successfully');
          this.authenticate().then(() => {
            this.isConnecting = false;
            this.connectionPromise = null;
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
          console.error('WebSocket Assessment: Connection failed', error);

          // Provide more helpful error message
          const wsUrl = process.env.NODE_ENV === 'production'
            ? WEBSOCKET_CONFIG.PRODUCTION_URL
            : WEBSOCKET_CONFIG.DEVELOPMENT_URL;

          const helpfulMessage = process.env.NODE_ENV === 'production'
            ? `WebSocket connection failed: ${getErrorMessage(error)}`
            : `WebSocket server not available at ${wsUrl}. For development, please run the mock WebSocket server: npm run start:websocket or run start-mock-websocket.bat`;

          reject(new Error(helpfulMessage));
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
    if (this.socket) {
      console.log('WebSocket Assessment: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset all connection state
    this.isConnected = false;
    this.isAuthenticated = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.subscribedJobIds.clear();
    this.token = null;

    // Notify callbacks
    this.callbacks.onDisconnected?.();
  }

  /**
   * Subscribe to assessment job updates
   */
  subscribeToJob(jobId: string): void {
    if (!this.isAuthenticated || !this.socket) {
      console.warn('WebSocket Assessment: Cannot subscribe - not authenticated');
      return;
    }

    if (this.subscribedJobIds.has(jobId)) {
      console.log('WebSocket Assessment: Already subscribed to job', jobId);
      return;
    }

    console.log('WebSocket Assessment: Subscribing to job', jobId);
    this.socket.emit('subscribe-assessment', { jobId });
    this.subscribedJobIds.add(jobId);
  }

  /**
   * Unsubscribe from assessment job updates
   */
  unsubscribeFromJob(jobId: string): void {
    if (!this.socket) return;

    console.log('WebSocket Assessment: Unsubscribing from job', jobId);
    this.socket.emit('unsubscribe-assessment', { jobId });
    this.subscribedJobIds.delete(jobId);
  }

  /**
   * Subscribe to token balance updates
   */
  subscribeToTokenUpdates(): void {
    if (!this.isAuthenticated || !this.socket) {
      console.warn('WebSocket Assessment: Cannot subscribe to token updates - not authenticated');
      return;
    }

    console.log('WebSocket Assessment: Subscribing to token balance updates');
    this.socket.emit('subscribe-token-balance');
  }

  /**
   * Unsubscribe from token balance updates
   */
  unsubscribeFromTokenUpdates(): void {
    if (!this.socket) return;

    console.log('WebSocket Assessment: Unsubscribing from token balance updates');
    this.socket.emit('unsubscribe-token-balance');
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: Partial<typeof this.callbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  async reconnect(): Promise<void> {
    if (!this.token) {
      throw new Error('No token available for reconnection');
    }

    console.log('WebSocket Assessment: Attempting to reconnect...');

    // Save token before disconnect clears it
    const savedToken = this.token;

    // Disconnect existing connection first
    this.disconnect();

    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Attempt to reconnect with saved token
    return this.connect(savedToken);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      subscribedJobs: Array.from(this.subscribedJobIds),
      socketId: this.socket?.id || null,
      socketConnected: this.socket?.connected || false,
    };
  }

  /**
   * Check if WebSocket server is reachable
   */
  async isServerReachable(): Promise<boolean> {
    try {
      const wsUrl = process.env.NODE_ENV === 'production'
        ? WEBSOCKET_CONFIG.PRODUCTION_URL
        : WEBSOCKET_CONFIG.DEVELOPMENT_URL;

      // For HTTP(S) URLs, we can do a simple fetch check
      const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${httpUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch {
        clearTimeout(timeoutId);
        return false;
      }
    } catch {
      return false;
    }
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

      console.log('WebSocket Assessment: Authenticating...');

      // Set up authentication timeout
      const authTimeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, WEBSOCKET_CONFIG.AUTHENTICATION_TIMEOUT);

      // Handle authentication success
      this.socket.once('authenticated', () => {
        clearTimeout(authTimeout);
        this.isAuthenticated = true;
        console.log('WebSocket Assessment: Authenticated successfully');
        this.callbacks.onAuthenticated?.();
        resolve();
      });

      // Handle authentication failure
      this.socket.once('auth_error', (error) => {
        clearTimeout(authTimeout);
        console.error('WebSocket Assessment: Authentication failed', error);
        reject(new Error(`Authentication failed: ${getErrorMessage(error)}`));
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
      console.log('WebSocket Assessment: Connected');
      this.callbacks.onConnected?.();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isAuthenticated = false;
      console.log('WebSocket Assessment: Disconnected', reason);
      this.callbacks.onDisconnected?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket Assessment: Connection error', error);
      this.callbacks.onError?.(new Error(`Connection error: ${getErrorMessage(error)}`));
    });

    // Analysis events - Updated to match API documentation
    this.socket.on('analysis-started', (data: any) => {
      console.log('WebSocket Assessment: Analysis started', data);
      const event: AssessmentWebSocketEvent = {
        type: 'analysis-started',
        jobId: data.jobId,
        status: data.status,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      };
      this.callbacks.onAssessmentEvent?.(event);
    });

    this.socket.on('analysis-complete', (data: any) => {
      console.log('WebSocket Assessment: Analysis completed', data);
      const event: AssessmentWebSocketEvent = {
        type: 'analysis-complete',
        jobId: data.jobId,
        resultId: data.resultId,
        status: data.status,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      };
      this.callbacks.onAssessmentEvent?.(event);
    });

    this.socket.on('analysis-failed', (data: any) => {
      console.log('WebSocket Assessment: Analysis failed', data);
      const event: AssessmentWebSocketEvent = {
        type: 'analysis-failed',
        jobId: data.jobId,
        error: data.error,
        message: data.message,
        metadata: data.metadata,
        timestamp: data.timestamp
      };
      this.callbacks.onAssessmentEvent?.(event);
    });

    // Token balance events
    this.socket.on('token-balance-update', (data: { balance: number }) => {
      console.log('WebSocket Assessment: Received token balance update', data);
      const tokenEvent: AssessmentWebSocketEvent = {
        type: 'token-balance-updated',
        metadata: {
          balance: data.balance
        }
      };
      this.callbacks.onAssessmentEvent?.(tokenEvent);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('WebSocket Assessment: Server error', error);
      this.callbacks.onError?.(new Error(`Server error: ${getErrorMessage(error)}`));
    });
  }
}

// Singleton instance
let assessmentWebSocketInstance: WebSocketAssessmentService | null = null;

/**
 * Get singleton WebSocket Assessment Service instance
 */
export function getAssessmentWebSocketService(): WebSocketAssessmentService {
  if (!assessmentWebSocketInstance) {
    assessmentWebSocketInstance = new WebSocketAssessmentService();
  }
  return assessmentWebSocketInstance;
}

/**
 * Utility function to check if WebSocket is supported
 */
export function isWebSocketSupported(): boolean {
  return typeof WebSocket !== 'undefined' || typeof window !== 'undefined';
}

/**
 * Health check for WebSocket server availability
 */
export async function checkWebSocketHealth(url: string): Promise<boolean> {
  if (!isWebSocketSupported()) return false;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, WEBSOCKET_CONFIG.HEALTH_CHECK_TIMEOUT);

    try {
      const testSocket = new WebSocket(url.replace('ws://', 'ws://').replace('wss://', 'wss://'));

      testSocket.onopen = () => {
        clearTimeout(timeout);
        testSocket.close();
        resolve(true);
      };

      testSocket.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      testSocket.onclose = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch (error) {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}
