/**
 * ATMA API Authentication Service
 * Base URL: https://api.chhrone.web.id (uses mock API in development when external API is down)
 */

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '' // Use relative URLs in development (will use mock API or proxy)
  : 'https://api.chhrone.web.id';

// Check if we should use mock API
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// Types based on API documentation
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string; // Optional field for registration
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user?: {
      id: string;
      email: string;
      name?: string;
      avatar?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: {
      timestamp: string;
      request_id: string;
    };
  };
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
 * Login user with email and password
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    console.log('AuthAPI: Attempting login for:', credentials.email);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();
    
    console.log('AuthAPI: Login response status:', response.status);
    console.log('AuthAPI: Login response success:', data.success);

    if (!response.ok) {
      console.error('AuthAPI: Login failed with status:', response.status);
      console.error('AuthAPI: Error details:', data.error);
      
      // Return the error response as-is for proper error handling
      return data;
    }

    if (data.success && data.data?.token) {
      console.log('AuthAPI: Login successful, token received');
      return data;
    } else {
      console.error('AuthAPI: Login response missing token or success flag');
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response from server'
        }
      };
    }
  } catch (error) {
    console.error('AuthAPI: Login network error:', error);

    // Check if it's a JSON parsing error (likely HTML error page)
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: 'API service is currently unavailable. Using mock authentication for development.'
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection and try again.'
      }
    };
  }
}

/**
 * Register new user
 */
export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    console.log('AuthAPI: Attempting registration for:', userData.email);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data: AuthResponse = await response.json();
    
    console.log('AuthAPI: Registration response status:', response.status);
    console.log('AuthAPI: Registration response success:', data.success);

    if (!response.ok) {
      console.error('AuthAPI: Registration failed with status:', response.status);
      console.error('AuthAPI: Error details:', data.error);
      
      // Return the error response as-is for proper error handling
      return data;
    }

    if (data.success && data.data?.token) {
      console.log('AuthAPI: Registration successful, token received');
      return data;
    } else {
      console.error('AuthAPI: Registration response missing token or success flag');
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response from server'
        }
      };
    }
  } catch (error) {
    console.error('AuthAPI: Registration network error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection and try again.'
      }
    };
  }
}

/**
 * Validate JWT token (optional - for token verification)
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    // This endpoint might not exist in the API, but we can try
    const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('AuthAPI: Token validation error:', error);
    return false;
  }
}

/**
 * Get user profile (if available in API)
 */
export async function getUserProfile(token: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('AuthAPI: Get profile error:', error);
    return null;
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
