import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { RateLimiter, SecurityLogger } from '@/lib/security';
import { queryClient, queryKeys, queryInvalidation } from '../lib/tanStackConfig';

// Enhanced Security Event Types
export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT_SUCCESS' | 'LOGOUT_FAILED' |
        'TOKEN_REFRESH' | 'TOKEN_EXPIRED' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' |
        'UNAUTHORIZED_ACCESS' | 'ACCOUNT_DELETED' | 'SECURITY_VIOLATION';
  timestamp: string;
  userId?: string;
  details: any;
  userAgent?: string;
  ip?: string;
}

// Enhanced Error Recovery Configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

// Unsaved Changes Detection
export interface UnsavedChanges {
  hasChanges: boolean;
  changes: Record<string, any>;
  timestamp: string;
}

// Enhanced Logout Validation Options
export interface LogoutValidationOptions {
  checkUnsavedChanges?: boolean;
  confirmDestructiveActions?: boolean;
  cleanupPendingOperations?: boolean;
  customValidation?: () => Promise<boolean>;
}

// Base URL dari laporan testing
const BASE_URL = 'https://api.futureguide.id';

// Types untuk API responses
export interface LoginResponse {
  success: boolean;
  data: {
    uid: string;
    email: string;
    displayName: string;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  message: string;
  timestamp: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    uid: string;
    email: string;
    displayName: string;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
    createdAt: string;
  };
  message: string;
  timestamp: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    idToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  message: string;
  timestamp: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      user_type: string;
      is_active: boolean;
      token_balance: number;
      last_login: string | null;
      created_at: string;
      profile: {
        user_id: string;
        full_name: string | null;
        date_of_birth: string | null;
        gender: string | null;
        school_id: string | null;
        created_at: string;
        updated_at: string;
        school: any;
      } | null;
    };
  };
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      user_type: string;
      is_active: boolean;
      token_balance: number;
      last_login: string | null;
      created_at: string;
      profile: {
        user_id: string;
        full_name: string | null;
        date_of_birth: string | null;
        gender: string | null;
        school_id: string | null;
        created_at: string;
        updated_at: string;
        school: any;
      } | null;
    };
    message: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  data: null;
  message: string;
  timestamp: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    data: {
      deletedAt: string;
      originalEmail: string;
    };
  };
}

// Type untuk login data
export interface LoginData {
  email: string;
  password: string;
}

// Type untuk register data
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

// Type untuk update profile data
export interface UpdateProfileData {
  full_name?: string;
  gender?: string;
  date_of_birth?: string;
  school_id?: string;
}

// Type untuk logout data
export interface LogoutData {
  refreshToken: string;
}

// Type untuk refresh token data
export interface RefreshTokenData {
  refreshToken: string;
}

// Error class untuk API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Enhanced token management utility with partial data support
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'futureguide_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'futureguide_refresh_token';
  private static readonly USER_DATA_KEY = 'futureguide_user_data';
  private static readonly PARTIAL_USER_DATA_KEY = 'futureguide_partial_user_data';
  
  // Rate limiting for warning messages
  private static lastWarningTime = 0;
  private static readonly WARNING_COOLDOWN = 5000; // 5 seconds

  // Enhanced user data interface
  static setTokens(accessToken: string, refreshToken: string, userData: any, isPartial: boolean = false) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      
      if (isPartial) {
        // Store partial data separately
        localStorage.setItem(this.PARTIAL_USER_DATA_KEY, JSON.stringify({
          ...userData,
          isPartial: true,
          storedAt: new Date().toISOString()
        }));
      } else {
        // Store complete data
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify({
          ...userData,
          isPartial: false,
          storedAt: new Date().toISOString()
        }));
        // Clear partial data when complete data is stored
        localStorage.removeItem(this.PARTIAL_USER_DATA_KEY);
      }
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static getUserData(): any {
    if (typeof window !== 'undefined') {
      // Try to get complete data first
      const completeData = localStorage.getItem(this.USER_DATA_KEY);
      if (completeData) {
        const parsed = JSON.parse(completeData);
        return { ...parsed, isPartial: false };
      }

      // Fallback to partial data
      const partialData = localStorage.getItem(this.PARTIAL_USER_DATA_KEY);
      if (partialData) {
        const parsed = JSON.parse(partialData);
        return { ...parsed, isPartial: true };
      }

      return null;
    }
    return null;
  }

  static getPartialUserData(): any {
    if (typeof window !== 'undefined') {
      const partialData = localStorage.getItem(this.PARTIAL_USER_DATA_KEY);
      return partialData ? JSON.parse(partialData) : null;
    }
    return null;
  }

  static getCompleteUserData(): any {
    if (typeof window !== 'undefined') {
      const completeData = localStorage.getItem(this.USER_DATA_KEY);
      return completeData ? JSON.parse(completeData) : null;
    }
    return null;
  }

  static mergeUserData(partialData: any, completeData: any): any {
    return {
      // Keep auth tokens from partial data
      uid: completeData.data?.user?.id || partialData.uid,
      email: completeData.data?.user?.email || partialData.email,
      displayName: completeData.data?.user?.username || partialData.displayName,
      
      // Add complete profile data
      id: completeData.data?.user?.id,
      username: completeData.data?.user?.username,
      user_type: completeData.data?.user?.user_type,
      is_active: completeData.data?.user?.is_active,
      token_balance: completeData.data?.user?.token_balance,
      last_login: completeData.data?.user?.last_login,
      created_at: completeData.data?.user?.created_at,
      
      // Profile details
      profile: completeData.data?.user?.profile,
      
      // Auth tokens
      idToken: partialData.idToken,
      refreshToken: partialData.refreshToken,
      expiresIn: partialData.expiresIn,
      
      // Metadata
      isPartial: false,
      mergedAt: new Date().toISOString()
    };
  }

  static upgradePartialToComplete(completeData: any) {
    if (typeof window !== 'undefined') {
      const partialData = this.getPartialUserData();
      if (partialData) {
        const mergedData = this.mergeUserData(partialData, completeData);
        
        // Store as complete data
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(mergedData));
        
        // Remove partial data
        localStorage.removeItem(this.PARTIAL_USER_DATA_KEY);
        
        return mergedData;
      }
    }
    return null;
  }

  static clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem(this.PARTIAL_USER_DATA_KEY);
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      // Validate token format before attempting to decode
      if (!this.isValidJWT(token)) {
        this.logWarningOnce('TokenManager: Token is not in valid JWT format, treating as expired');
        return true;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Validate payload structure
      if (!payload || typeof payload.exp !== 'number') {
        this.logWarningOnce('TokenManager: Invalid JWT payload structure, treating as expired');
        return true;
      }
      
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch (error) {
      this.logWarningOnce('TokenManager: Error checking token expiry:', error);
      // If we can't parse the token, treat it as expired for security
      return true;
    }
  }

  // Rate-limited warning logger to prevent console spam
  private static logWarningOnce(...args: any[]): void {
    const now = Date.now();
    if (now - this.lastWarningTime > this.WARNING_COOLDOWN) {
      console.warn(...args);
      this.lastWarningTime = now;
    }
  }

  // Helper method to validate JWT format
  private static isValidJWT(token: string): boolean {
    try {
      // Check if token has the correct format (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      // Try to decode the header to verify it's valid base64
      const header = JSON.parse(atob(parts[0]));
      // Basic JWT header validation
      return header && (header.alg || header.typ);
    } catch {
      return false;
    }
  }

  static isDataPartial(): boolean {
    const userData = this.getUserData();
    return userData ? userData.isPartial : false;
  }

  static getDataAge(): number {
    const userData = this.getUserData();
    if (userData && userData.storedAt) {
      return Date.now() - new Date(userData.storedAt).getTime();
    }
    return Infinity;
  }

  static isDataStale(maxAge: number = 5 * 60 * 1000): boolean {
    return this.getDataAge() > maxAge;
  }
}

// Enhanced Security Monitoring
class EnhancedSecurityLogger {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent' | 'ip'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ip: typeof window !== 'undefined' ? window.location.hostname : undefined,
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', securityEvent);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(securityEvent);
    }
  }

  private static sendToMonitoringService(event: SecurityEvent): void {
    // TODO: Implement actual monitoring service integration
    console.warn('Production Security Event:', event);
  }

  static getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  static getEventsByType(type: SecurityEvent['type'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  static detectSuspiciousPatterns(): SecurityEvent[] {
    const recentEvents = this.getRecentEvents(100);
    const suspiciousEvents: SecurityEvent[] = [];

    // Detect multiple failed logins
    const failedLogins = recentEvents.filter(e => e.type === 'LOGIN_FAILED');
    if (failedLogins.length >= 5) {
      suspiciousEvents.push({
        type: 'SUSPICIOUS_ACTIVITY',
        timestamp: new Date().toISOString(),
        details: { reason: 'Multiple failed login attempts', count: failedLogins.length },
        userAgent: '',
        ip: '',
      });
    }

    // Detect rapid token refresh attempts
    const tokenRefreshes = recentEvents.filter(e => e.type === 'TOKEN_REFRESH');
    if (tokenRefreshes.length >= 10) {
      suspiciousEvents.push({
        type: 'SUSPICIOUS_ACTIVITY',
        timestamp: new Date().toISOString(),
        details: { reason: 'Rapid token refresh attempts', count: tokenRefreshes.length },
        userAgent: '',
        ip: '',
      });
    }

    return suspiciousEvents;
  }
}

// Advanced Error Recovery with Exponential Backoff
class ErrorRecoveryManager {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error: any) => {
      // Retry on network errors and 5xx server errors
      return !error.response || (error.response.status >= 500 && error.response.status < 600);
    },
  };

  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if we should retry
        if (attempt === finalConfig.maxRetries ||
            (finalConfig.retryCondition && !finalConfig.retryCondition(error))) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt),
          finalConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitter = delay * 0.1 * Math.random();
        const finalDelay = delay + jitter;

        console.warn(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${finalDelay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }

    throw lastError;
  }
}

// Unsaved Changes Manager
class UnsavedChangesManager {
  private static readonly STORAGE_KEY = 'futureguide_unsaved_changes';
  
  static setUnsavedChanges(changes: Record<string, any>): void {
    if (typeof window === 'undefined') return;
    
    const unsavedChanges: UnsavedChanges = {
      hasChanges: Object.keys(changes).length > 0,
      changes,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(unsavedChanges));
  }

  static getUnsavedChanges(): UnsavedChanges | null {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  static clearUnsavedChanges(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static hasUnsavedChanges(): boolean {
    const changes = this.getUnsavedChanges();
    return changes?.hasChanges || false;
  }
}

// Authentication service class with TanStack Query integration
class AuthService {
  private apiClient: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];
  private rateLimiter = RateLimiter.getInstance('auth', 5, 60 * 1000); // 5 requests per minute

  constructor() {
    this.apiClient = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor untuk menambahkan authorization header
    this.apiClient.interceptors.request.use(
      (config) => {
        // Rate limiting check
        if (!this.rateLimiter.isAllowed()) {
          SecurityLogger.logRateLimitExceeded({
            url: config.url,
            method: config.method
          });
          return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
        }

        // CSRF protection removed as backend doesn't support it

        const token = TokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor untuk handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Jika sedang refresh, tambahkan request ke queue
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.apiClient(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = TokenManager.getRefreshToken();
          
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              const { idToken, refreshToken: newRefreshToken } = response.data;
              
              TokenManager.setTokens(
                idToken,
                newRefreshToken,
                TokenManager.getUserData(),
                TokenManager.isDataPartial()
              );

              // Process queued requests
              this.failedQueue.forEach(({ resolve }) => resolve(idToken));
              this.failedQueue = [];

              originalRequest.headers.Authorization = `Bearer ${idToken}`;
              return this.apiClient(originalRequest);
            } catch (refreshError) {
              // Refresh token failed, clear tokens and redirect to login
              TokenManager.clearTokens();
              this.failedQueue.forEach(({ reject }) => reject(refreshError));
              this.failedQueue = [];
              
              // Redirect ke login page
              if (typeof window !== 'undefined') {
                window.location.href = '/auth';
              }
              
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          } else {
            // No refresh token, clear tokens and redirect to login
            TokenManager.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Login method with enhanced security monitoring and error recovery
  async login(data: LoginData): Promise<LoginResponse> {
    return await ErrorRecoveryManager.retryWithBackoff(async () => {
      try {
        const response: AxiosResponse<LoginResponse> = await this.apiClient.post(
          '/api/auth/v2/login',
          data,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Log successful login
          EnhancedSecurityLogger.logSecurityEvent({
            type: 'LOGIN_SUCCESS',
            userId: response.data.data.uid,
            details: { email: data.email, timestamp: response.data.timestamp },
          });

          // Store partial data immediately for better UX
          const partialUserData = {
            uid: response.data.data.uid,
            email: response.data.data.email,
            displayName: response.data.data.displayName,
            idToken: response.data.data.idToken,
            refreshToken: response.data.data.refreshToken,
            expiresIn: response.data.data.expiresIn,
          };

          TokenManager.setTokens(
            response.data.data.idToken,
            response.data.data.refreshToken,
            partialUserData,
            true // Mark as partial data
          );

          // Set partial user data in cache immediately
          const cacheData = {
            uid: response.data.data.uid,
            email: response.data.data.email,
            displayName: response.data.data.displayName,
            isPartial: true,
          };
          
          queryClient.setQueryData(queryKeys.auth.user(), cacheData);
          
          // Prefetch complete profile data in background
          this.prefetchCompleteUserData();
          
          // Prefetch user data for better UX
          this.prefetchUserData();
        }

        return response.data;
      } catch (error: any) {
        // Log failed login attempt
        EnhancedSecurityLogger.logSecurityEvent({
          type: 'LOGIN_FAILED',
          details: {
            email: data.email,
            error: error.message,
            status: error.response?.status,
          },
        });

        throw this.handleError(error);
      }
    });
  }

  // Register method with enhanced security monitoring and error recovery
  async register(data: RegisterData): Promise<RegisterResponse> {
    return await ErrorRecoveryManager.retryWithBackoff(async () => {
      try {
        const response: AxiosResponse<RegisterResponse> = await this.apiClient.post(
          '/api/auth/v2/register',
          data,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Log successful registration
          EnhancedSecurityLogger.logSecurityEvent({
            type: 'LOGIN_SUCCESS', // Treat registration as successful login
            userId: response.data.data.uid,
            details: {
              email: data.email,
              displayName: data.displayName,
              action: 'registration',
              timestamp: response.data.timestamp,
            },
          });

          // Store partial data immediately for better UX
          const partialUserData = {
            uid: response.data.data.uid,
            email: response.data.data.email,
            displayName: response.data.data.displayName,
            idToken: response.data.data.idToken,
            refreshToken: response.data.data.refreshToken,
            expiresIn: response.data.data.expiresIn,
            createdAt: response.data.data.createdAt,
          };

          TokenManager.setTokens(
            response.data.data.idToken,
            response.data.data.refreshToken,
            partialUserData,
            true // Mark as partial data
          );

          // Set partial user data in cache immediately
          const cacheData = {
            uid: response.data.data.uid,
            email: response.data.data.email,
            displayName: response.data.data.displayName,
            isPartial: true,
          };
          
          queryClient.setQueryData(queryKeys.auth.user(), cacheData);
          
          // Prefetch complete profile data in background
          this.prefetchCompleteUserData();
          
          // Prefetch user data for better UX
          this.prefetchUserData();
        }

        return response.data;
      } catch (error: any) {
        // Log failed registration attempt
        EnhancedSecurityLogger.logSecurityEvent({
          type: 'LOGIN_FAILED',
          details: {
            email: data.email,
            displayName: data.displayName,
            error: error.message,
            status: error.response?.status,
            action: 'registration',
          },
        });

        throw this.handleError(error);
      }
    });
  }

  // Refresh token method with cache preservation
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response: AxiosResponse<RefreshTokenResponse> = await this.apiClient.post(
        '/api/auth/v2/refresh',
        { refreshToken }
      );
      
      // After successful token refresh, refetch user data
      if (response.data.success) {
        queryInvalidation.auth.profile();
        queryInvalidation.auth.user();
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get profile method with data merging and TanStack Query integration
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response: AxiosResponse<ProfileResponse> = await this.apiClient.get(
        '/api/auth/profile'
      );

      // If we have partial data, upgrade it to complete data
      if (TokenManager.isDataPartial()) {
        TokenManager.upgradePartialToComplete(response.data);
      }

      // Update cache with fresh profile data
      queryClient.setQueryData(queryKeys.auth.profile(), response.data);
      
      // Update user data with complete information
      const userData = this.getCurrentUser();
      if (userData && !userData.isPartial) {
        const completeUserData = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          id: userData.id,
          username: userData.username,
          user_type: userData.user_type,
          is_active: userData.is_active,
          token_balance: userData.token_balance,
          last_login: userData.last_login,
          created_at: userData.created_at,
          profile: userData.profile,
          isPartial: false,
        };
        
        queryClient.setQueryData(queryKeys.auth.user(), completeUserData);
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Method to fetch and merge complete profile data
  async fetchCompleteProfile(): Promise<ProfileResponse | null> {
    try {
      const profileData = await this.getProfile();
      
      // Ensure data is stored as complete
      if (!TokenManager.isDataPartial()) {
        const userData = TokenManager.getUserData();
        if (userData) {
          TokenManager.setTokens(
            userData.idToken,
            userData.refreshToken,
            userData,
            false // Mark as complete data
          );
        }
      }

      return profileData;
    } catch (error: any) {
      console.warn('Failed to fetch complete profile:', error);
      return null;
    }
  }

  // Method to check if user data needs upgrade and trigger upgrade if needed
  async ensureCompleteData() {
    if (this.needsDataUpgrade()) {
      try {
        await this.prefetchCompleteUserData();
        return true;
      } catch (error) {
        console.warn('Failed to upgrade user data:', error);
        return false;
      }
    }
    return true;
  }

  // Update profile method with cache invalidation
  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      const response: AxiosResponse<UpdateProfileResponse> = await this.apiClient.put(
        '/api/auth/profile',
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Invalidate profile queries to trigger refetch
      queryInvalidation.auth.profile();
      queryInvalidation.profile.details();

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Enhanced logout method with validation and security monitoring
  async logout(options: LogoutValidationOptions = {}): Promise<LogoutResponse> {
    const {
      checkUnsavedChanges = true,
      confirmDestructiveActions = true,
      cleanupPendingOperations = true,
      customValidation,
    } = options;

    try {
      // Enhanced logout validation
      if (checkUnsavedChanges && UnsavedChangesManager.hasUnsavedChanges()) {
        const unsavedChanges = UnsavedChangesManager.getUnsavedChanges();
        if (confirmDestructiveActions) {
          const confirmMessage = `Anda memiliki perubahan yang belum disimpan:\n${
            Object.keys(unsavedChanges?.changes || {}).join(', ')
          }\n\nApakah Anda yakin ingin keluar?`;
          
          if (!confirm(confirmMessage)) {
            throw new Error('Logout cancelled due to unsaved changes');
          }
        }
      }

      // Custom validation
      if (customValidation) {
        const isValid = await customValidation();
        if (!isValid) {
          throw new Error('Logout cancelled by custom validation');
        }
      }

      // Cleanup pending operations if requested
      if (cleanupPendingOperations) {
        await this.cleanupPendingOperations();
      }

      const refreshToken = TokenManager.getRefreshToken();
      const currentUser = this.getCurrentUser();
      
      if (refreshToken) {
        const response: AxiosResponse<LogoutResponse> = await ErrorRecoveryManager.retryWithBackoff(async () => {
          return await this.apiClient.post(
            '/api/auth/v2/logout',
            { refreshToken }
          );
        });
        
        // Log successful logout
        EnhancedSecurityLogger.logSecurityEvent({
          type: 'LOGOUT_SUCCESS',
          userId: currentUser?.uid,
          details: {
            timestamp: response.data.timestamp,
            hasUnsavedChanges: UnsavedChangesManager.hasUnsavedChanges(),
          },
        });
        
        // Clear all auth-related queries from cache
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
        queryClient.removeQueries({ queryKey: queryKeys.profile.all });
        queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
        
        return response.data;
      }
      
      // Return success response even if no refresh token
      const response = {
        success: true,
        data: null,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };

      // Log successful logout (no refresh token case)
      EnhancedSecurityLogger.logSecurityEvent({
        type: 'LOGOUT_SUCCESS',
        userId: currentUser?.uid,
        details: {
          timestamp: response.timestamp,
          reason: 'no_refresh_token',
        },
      });

      // Clear cache even if no refresh token
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });

      return response;
    } catch (error: any) {
      // Log failed logout attempt
      EnhancedSecurityLogger.logSecurityEvent({
        type: 'LOGOUT_FAILED',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });

      // Even if API call fails, clear cache for security
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
      
      throw this.handleError(error);
    } finally {
      // Always clear tokens on logout
      TokenManager.clearTokens();
      // Clear unsaved changes
      UnsavedChangesManager.clearUnsavedChanges();
    }
  }

  // Cleanup pending operations
  private async cleanupPendingOperations(): Promise<void> {
    try {
      // Cancel any ongoing requests
      const pendingRequests = this.failedQueue.length;
      if (pendingRequests > 0) {
        console.log(`Cancelling ${pendingRequests} pending requests during logout`);
        this.failedQueue = [];
      }

      // Clear any ongoing refresh operations
      if (this.isRefreshing) {
        this.isRefreshing = false;
      }

      // Reset rate limiter
      this.rateLimiter.reset();
    } catch (error) {
      console.warn('Error during cleanup of pending operations:', error);
    }
  }

  // Enhanced security monitoring methods
  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return EnhancedSecurityLogger.getRecentEvents(limit);
  }

  getSecurityEventsByType(type: SecurityEvent['type'], limit: number = 50): SecurityEvent[] {
    return EnhancedSecurityLogger.getEventsByType(type, limit);
  }

  detectSuspiciousActivity(): SecurityEvent[] {
    return EnhancedSecurityLogger.detectSuspiciousPatterns();
  }

  // Unsaved changes management
  setUnsavedChanges(changes: Record<string, any>): void {
    UnsavedChangesManager.setUnsavedChanges(changes);
  }

  getUnsavedChanges(): UnsavedChanges | null {
    return UnsavedChangesManager.getUnsavedChanges();
  }

  hasUnsavedChanges(): boolean {
    return UnsavedChangesManager.hasUnsavedChanges();
  }

  clearUnsavedChanges(): void {
    UnsavedChangesManager.clearUnsavedChanges();
  }

  // Delete account method with complete cache cleanup
  async deleteAccount(): Promise<DeleteAccountResponse> {
    try {
      const response: AxiosResponse<DeleteAccountResponse> = await this.apiClient.delete(
        '/api/auth/account'
      );
      
      // Clear all queries from cache
      queryClient.clear();
      
      // Clear tokens after successful account deletion
      TokenManager.clearTokens();
      
      return response.data;
    } catch (error: any) {
      // Even if API call fails, clear cache for security
      queryClient.clear();
      TokenManager.clearTokens();
      
      throw this.handleError(error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  // Get current user data
  getCurrentUser() {
    return TokenManager.getUserData();
  }

  // Method to check if user data needs upgrade
  needsDataUpgrade(): boolean {
    return TokenManager.isDataPartial() || TokenManager.isDataStale();
  }

  // Method to get current data status
  getDataStatus() {
    return {
      isPartial: TokenManager.isDataPartial(),
      isStale: TokenManager.isDataStale(),
      dataAge: TokenManager.getDataAge(),
      hasPartialData: !!TokenManager.getPartialUserData(),
      hasCompleteData: !!TokenManager.getCompleteUserData(),
    };
  }

  // Prefetch user data for better UX
  private async prefetchUserData() {
    try {
      // Prefetch profile data
      await queryClient.prefetchQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => this.getProfile(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      
      // Prefetch dashboard stats
      await queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.stats(),
        staleTime: 3 * 60 * 1000, // 3 minutes
      });
    } catch (error) {
      console.warn('Failed to prefetch user data:', error);
    }
  }

  // Prefetch complete user data for progressive loading
  private async prefetchCompleteUserData() {
    try {
      // Fetch complete profile data in background
      await queryClient.prefetchQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => this.fetchCompleteProfile(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    } catch (error) {
      console.warn('Failed to prefetch complete user data:', error);
    }
  }

  // Optimistic update helpers
  async optimisticProfileUpdate(data: UpdateProfileData) {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.auth.profile() });
    
    // Snapshot the previous value
    const previousProfile = queryClient.getQueryData(queryKeys.auth.profile());
    
    // Optimistically update to the new value
    queryClient.setQueryData(queryKeys.auth.profile(), (old: any) => {
      if (!old?.data) return old;
      
      return {
        ...old,
        data: {
          ...old.data,
          user: {
            ...old.data.user,
            profile: {
              ...old.data.user.profile,
              ...data,
              updated_at: new Date().toISOString(),
            },
          },
        },
      };
    });
    
    // Return a context object with the snapshotted value
    return { previousProfile };
  }

  // Rollback optimistic update
  rollbackProfileUpdate(context: { previousProfile?: any }) {
    if (context.previousProfile) {
      queryClient.setQueryData(queryKeys.auth.profile(), context.previousProfile);
    }
  }

  // Get cached profile data
  getCachedProfile(): ProfileResponse | undefined {
    return queryClient.getQueryData(queryKeys.auth.profile());
  }

  // Check if profile data is stale
  isProfileStale(): boolean {
    const queryState = queryClient.getQueryState(queryKeys.auth.profile());
    return queryState?.dataUpdatedAt ?
      Date.now() - queryState.dataUpdatedAt > 5 * 60 * 1000 : // 5 minutes
      true;
  }

  // Force refetch profile data
  async refetchProfile() {
    return queryClient.refetchQueries({ queryKey: queryKeys.auth.profile() });
  }

  // Error handling utility
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      const code = error.response?.data?.error?.code;
      const status = error.response?.status;
      
      return new ApiError(message, status, code, error.response?.data);
    }
    
    return new ApiError(error.message || 'An unknown error occurred');
  }
}

// Create singleton instance
const authService = new AuthService();

// Export service and utilities
export default authService;
export {
  TokenManager,
  queryKeys,
  queryInvalidation,
  EnhancedSecurityLogger,
  ErrorRecoveryManager,
  UnsavedChangesManager
};