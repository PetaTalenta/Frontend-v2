/**
 * Enhanced ATMA API Authentication Service
 * Automatically detects API availability and falls back to mock API when needed
 */

import { checkApiHealth, getApiBaseUrl, shouldUseMockApi } from '../utils/api-health';
import { 
  showTokenError, 
  showTokenSuccess, 
  showTokenBalanceRefresh 
} from '../utils/token-notifications';

// Types based on API documentation
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  // Note: Real API only requires email and password, name is handled via profile update
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user?: {
      id: string;
      email: string;
      username?: string | null;
      user_type?: string;
      is_active?: boolean;
      token_balance?: number;
      created_at?: string;
      updated_at?: string;
    };
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: {
      timestamp: string;
      request_id: string;
    };
  };
  apiSource?: 'real' | 'mock'; // Track which API was used
}

export interface TokenBalanceResponse {
  success: boolean;
  data?: {
    userId: string;
    tokenBalance: number;
    lastUpdated: string;
  };
  error?: {
    code: string;
    message: string;
  };
  apiSource?: 'real' | 'mock';
}

export interface ApiError {
  code: string;
  message: string;
  details?: {
    timestamp: string;
    request_id: string;
  };
}

/**
 * Check if a token is a mock token
 */
function isMockToken(token: string): boolean {
  return token.startsWith('mock-jwt-token-');
}

/**
 * Make API request with automatic fallback to mock API
 */
async function makeApiRequest(
  endpoint: string,
  options: RequestInit,
  fallbackToMock: boolean = true
): Promise<{ response: Response; apiSource: 'real' | 'mock' }> {

  // Check if we're using a mock token - if so, force mock API
  const authHeader = options.headers?.['Authorization'] as string;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (isMockToken(token)) {
      console.log('Enhanced Auth API: Mock token detected, forcing mock API');
      // Skip to mock API section
    } else {
      // Try real API first for real tokens
      const baseUrl = await getApiBaseUrl();
      const isUsingMock = baseUrl === '';

      if (!isUsingMock) {
        try {
          console.log(`Enhanced Auth API: Attempting real API request to ${baseUrl}${endpoint}`);

          const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });

          console.log(`Enhanced Auth API: Real API responded with status ${response.status}`);
          return { response, apiSource: 'real' };

        } catch (error) {
          console.error('Enhanced Auth API: Real API request failed:', error);

          if (!fallbackToMock) {
            throw error;
          }

          console.log('Enhanced Auth API: Falling back to mock API');
        }
      }
    }
  } else {
    // No auth header, try real API first
    const baseUrl = await getApiBaseUrl();
    const isUsingMock = baseUrl === '';

    if (!isUsingMock) {
      try {
        console.log(`Enhanced Auth API: Attempting real API request to ${baseUrl}${endpoint}`);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        console.log(`Enhanced Auth API: Real API responded with status ${response.status}`);
        return { response, apiSource: 'real' };

      } catch (error) {
        console.error('Enhanced Auth API: Real API request failed:', error);

        if (!fallbackToMock) {
          throw error;
        }

        console.log('Enhanced Auth API: Falling back to mock API');
      }
    }
  }
  
  // Fall back to mock API (local endpoints)
  console.log(`Enhanced Auth API: Using mock API for ${endpoint}`);
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  return { response, apiSource: 'mock' };
}

/**
 * Make API request using ONLY the real API (no fallback to mock)
 * This function will throw an error if the real API is not available
 */
async function makeRealApiRequest(
  endpoint: string,
  options: RequestInit
): Promise<{ response: Response; apiSource: 'real' }> {

  // Force use of proxy API (which connects to real API)
  const PROXY_API_BASE_URL = '/api/proxy';

  // Map auth endpoints to correct proxy paths
  let proxyEndpoint = endpoint;
  if (endpoint.startsWith('/api/auth/')) {
    proxyEndpoint = endpoint; // Keep as is: /api/auth/login -> /api/proxy/api/auth/login
  }

  console.log(`Enhanced Auth API: Forcing real API request to ${PROXY_API_BASE_URL}${proxyEndpoint}`);

  const response = await fetch(`${PROXY_API_BASE_URL}${proxyEndpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  console.log(`Enhanced Auth API: Real API responded with status ${response.status}`);
  return { response, apiSource: 'real' };
}

/**
 * Login user with email and password
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    console.log('Enhanced Auth API: Attempting login for:', credentials.email);
    
    const { response, apiSource } = await makeApiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();
    data.apiSource = apiSource;
    
    console.log(`Enhanced Auth API: Login response from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);

    if (!response.ok) {
      console.error('Enhanced Auth API: Login failed with status:', response.status);
      console.error('Enhanced Auth API: Error details:', data.error);
      return data;
    }

    if (data.success && data.data?.token) {
      console.log(`Enhanced Auth API: Login successful via ${apiSource} API`);
      
      // Show success notification
      showTokenSuccess(
        `Login successful via ${apiSource === 'real' ? 'server' : 'demo mode'}`,
        `Welcome back, ${data.data.user?.name || data.data.user?.email}!`
      );
      
      return data;
    } else {
      console.error('Enhanced Auth API: Login response missing token or success flag');
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response from server'
        },
        apiSource
      };
    }
  } catch (error) {
    console.error('Enhanced Auth API: Login error:', error);

    // Show error notification
    showTokenError(
      'Login failed',
      'Please check your connection and try again.'
    );

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection and try again.'
      },
      apiSource: 'mock'
    };
  }
}

/**
 * Register new user
 */
export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    console.log('Enhanced Auth API: Attempting registration for:', userData.email);
    
    const { response, apiSource } = await makeApiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const data: AuthResponse = await response.json();
    data.apiSource = apiSource;
    
    console.log(`Enhanced Auth API: Registration response from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);

    if (!response.ok) {
      console.error('Enhanced Auth API: Registration failed with status:', response.status);
      console.error('Enhanced Auth API: Error details:', data.error);
      return data;
    }

    if (data.success && data.data?.token) {
      console.log(`Enhanced Auth API: Registration successful via ${apiSource} API`);
      
      // Show success notification
      showTokenSuccess(
        `Registration successful via ${apiSource === 'real' ? 'server' : 'demo mode'}`,
        `Welcome, ${data.data.user?.name || data.data.user?.email}!`
      );
      
      return data;
    } else {
      console.error('Enhanced Auth API: Registration response missing token or success flag');
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response from server'
        },
        apiSource
      };
    }
  } catch (error) {
    console.error('Enhanced Auth API: Registration error:', error);

    // Show error notification
    showTokenError(
      'Registration failed',
      'Please check your connection and try again.'
    );

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection and try again.'
      },
      apiSource: 'mock'
    };
  }
}

/**
 * Validate JWT token
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const { response } = await makeApiRequest('/api/auth/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, false); // Don't fallback for token validation

    return response.ok;
  } catch (error) {
    console.error('Enhanced Auth API: Token validation error:', error);
    return false;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(token: string): Promise<any> {
  try {
    const { response, apiSource } = await makeApiRequest('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Enhanced Auth API: Profile retrieved from ${apiSource} API`);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Enhanced Auth API: Get profile error:', error);
    return null;
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(token: string): Promise<TokenBalanceResponse> {
  try {
    const { response, apiSource } = await makeApiRequest('/api/auth/token-balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Enhanced Auth API: Token balance retrieved from ${apiSource} API`);

      // Handle the real API response format: { userId, tokenBalance, lastUpdated }
      const balance = data.data?.tokenBalance || data.data?.balance || 0;
      showTokenBalanceRefresh(balance);

      return {
        ...data,
        apiSource,
        data: {
          userId: data.data?.userId || data.data?.user?.id || '',
          tokenBalance: balance,
          lastUpdated: data.data?.lastUpdated || new Date().toISOString()
        }
      };
    }

    return {
      success: false,
      error: { code: 'REQUEST_FAILED', message: 'Failed to get token balance' },
      apiSource
    };
  } catch (error) {
    console.error('Enhanced Auth API: Get token balance error:', error);
    showTokenError('Unable to check token balance. Please try again.');
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Network error' },
      apiSource: 'mock'
    };
  }
}

/**
 * Helper function to get error message from API response
 */
export function getErrorMessage(response: AuthResponse): string {
  if (response.error) {
    return response.error.message || 'An error occurred';
  }
  return 'Unknown error occurred';
}

/**
 * Helper function to check if error is a specific type
 */
export function isErrorCode(response: AuthResponse, code: string): boolean {
  return response.error?.code === code;
}

/**
 * Get API status information
 */
export async function getApiStatus(): Promise<{
  isRealApiAvailable: boolean;
  currentApiSource: 'real' | 'mock';
  healthCheck: any;
}> {
  const healthCheck = await checkApiHealth();
  const isRealApiAvailable = healthCheck.isAvailable;
  const currentApiSource = isRealApiAvailable ? 'real' : 'mock';
  
  return {
    isRealApiAvailable,
    currentApiSource,
    healthCheck
  };
}

// ===== REAL API ONLY FUNCTIONS (NO FALLBACK) =====

/**
 * Login user using ONLY the real API (no fallback to mock)
 * This function will throw an error if the real API is not available
 */
export async function loginUserRealApiOnly(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    console.log('Enhanced Auth API: Attempting login via REAL API ONLY for:', credentials.email);

    const { response, apiSource } = await makeRealApiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();

    if (response.ok && data.success) {
      console.log('Enhanced Auth API: Real API login successful');

      // Store token if login successful
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
        showTokenSuccess(`Login successful! Token balance: ${data.data.user?.token_balance || 0}`);
      }

      return { ...data, apiSource };
    } else {
      console.error('Enhanced Auth API: Real API login failed:', data);
      if (data.error?.message?.includes('token')) {
        showTokenError(data.error.message);
      }
      return { ...data, apiSource };
    }

  } catch (error: any) {
    console.error('Enhanced Auth API: Real API login error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'REAL_API_ERROR',
        message: `Real API login failed: ${error.message}`,
      },
      apiSource: 'real' as const
    };

    showTokenError(errorResponse.error.message);
    return errorResponse;
  }
}

/**
 * Register user using ONLY the real API (no fallback to mock)
 * This function will throw an error if the real API is not available
 */
export async function registerUserRealApiOnly(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    console.log('Enhanced Auth API: Attempting registration via REAL API ONLY for:', userData.email);

    const { response, apiSource } = await makeRealApiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const data: AuthResponse = await response.json();

    if (response.ok && data.success) {
      console.log('Enhanced Auth API: Real API registration successful');

      // Store token if registration successful
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
        showTokenSuccess(`Registration successful! Token balance: ${data.data.user?.token_balance || 0}`);
      }

      return { ...data, apiSource };
    } else {
      console.error('Enhanced Auth API: Real API registration failed:', data);
      if (data.error?.message?.includes('token')) {
        showTokenError(data.error.message);
      }
      return { ...data, apiSource };
    }

  } catch (error: any) {
    console.error('Enhanced Auth API: Real API registration error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'REAL_API_ERROR',
        message: `Real API registration failed: ${error.message}`,
      },
      apiSource: 'real' as const
    };

    showTokenError(errorResponse.error.message);
    return errorResponse;
  }
}
