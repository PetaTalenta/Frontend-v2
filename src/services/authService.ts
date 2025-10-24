import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { RateLimiter, SecurityLogger } from '@/lib/security';

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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
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

// Authentication service class
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

  // Login method with partial data storage
  async login(data: LoginData): Promise<LoginResponse> {
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
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Register method with partial data storage
  async register(data: RegisterData): Promise<RegisterResponse> {
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
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Refresh token method
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response: AxiosResponse<RefreshTokenResponse> = await this.apiClient.post(
        '/api/auth/v2/refresh',
        { refreshToken }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get profile method with data merging
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response: AxiosResponse<ProfileResponse> = await this.apiClient.get(
        '/api/auth/profile'
      );

      // If we have partial data, upgrade it to complete data
      if (TokenManager.isDataPartial()) {
        TokenManager.upgradePartialToComplete(response.data);
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

  // Update profile method
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
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Logout method
  async logout(): Promise<LogoutResponse> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      
      if (refreshToken) {
        const response: AxiosResponse<LogoutResponse> = await this.apiClient.post(
          '/api/auth/v2/logout',
          { refreshToken }
        );
        return response.data;
      }
      
      // Return success response even if no refresh token
      return {
        success: true,
        data: null,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error);
    } finally {
      // Always clear tokens on logout
      TokenManager.clearTokens();
    }
  }

  // Delete account method
  async deleteAccount(): Promise<DeleteAccountResponse> {
    try {
      const response: AxiosResponse<DeleteAccountResponse> = await this.apiClient.delete(
        '/api/auth/account'
      );
      
      // Clear tokens after successful account deletion
      TokenManager.clearTokens();
      
      return response.data;
    } catch (error: any) {
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
export { TokenManager };