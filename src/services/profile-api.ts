/**
 * Profile API Service
 * Handles user profile operations including get, update, and password change
 */

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '' // Use relative URLs in development (will use proxy)
  : 'https://api.chhrone.web.id';

// Types for API requests and responses
export interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Make API request with proper error handling and fallback
 */
async function makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<{ response: Response; apiSource: 'real' | 'mock' }> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'PetaTalenta-Frontend/1.0',
  };

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Removed forced mock API usage for debugging

  try {
    // Try real API first
    console.log(`Profile API: Attempting request to real API: ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestOptions,
      signal: AbortSignal.timeout(15000), // 15 seconds timeout
    });

    console.log(`Profile API: Real API responded with status ${response.status}`);
    return { response, apiSource: 'real' };
  } catch (error) {
    console.error('Profile API: Real API failed:', error);

    // Fallback to mock API for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Profile API: Falling back to mock API');
      return { response: await getMockResponse(endpoint, requestOptions), apiSource: 'mock' };
    }

    throw error;
  }
}

/**
 * Mock API responses for development
 */
async function getMockResponse(endpoint: string, options: RequestInit): Promise<Response> {
  const method = options.method || 'GET';
  
  // Mock profile data
  const mockProfile = {
    user: {
      id: 'mock-user-id',
      email: 'user@example.com',
      username: 'johndoe',
      user_type: 'user',
      is_active: true,
      token_balance: 10,
      created_at: '2024-01-15T10:30:00.000Z',
      updated_at: new Date().toISOString()
    },
    profile: {
      full_name: 'John Doe',
      date_of_birth: '1990-01-15',
      gender: 'male',
      school_id: 1
    }
  };

  if (endpoint === '/api/proxy/auth/profile') {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: mockProfile
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (method === 'PUT') {
      // Update profile
      const body = options.body ? JSON.parse(options.body as string) : {};
      const updatedProfile = {
        ...mockProfile,
        user: {
          ...mockProfile.user,
          username: body.username || mockProfile.user.username,
          updated_at: new Date().toISOString()
        },
        profile: {
          ...mockProfile.profile,
          full_name: body.full_name || mockProfile.profile.full_name,
          date_of_birth: body.date_of_birth || mockProfile.profile.date_of_birth,
          gender: body.gender || mockProfile.profile.gender,
          school_id: body.school_id || mockProfile.profile.school_id
        }
      };

      return new Response(JSON.stringify({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else if (endpoint === '/api/proxy/auth/change-password' && method === 'POST') {
    return new Response(JSON.stringify({
      success: true,
      message: 'Password changed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Default error response
  return new Response(JSON.stringify({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    }
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get user profile
 */
export async function getUserProfile(token: string): Promise<ApiResponse> {
  try {
    console.log('Profile API: Getting user profile');
    
    const { response, apiSource } = await makeApiRequest('/api/proxy/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: ApiResponse = await response.json();
    
    console.log(`Profile API: Profile retrieved from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);

    if (!response.ok) {
      console.error('Profile API: Get profile failed with status:', response.status);
      console.error('Profile API: Error details:', data.error);
    }

    return data;
  } catch (error) {
    console.error('Profile API: Get profile error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get profile'
      }
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(token: string, profileData: UpdateProfileRequest): Promise<ApiResponse> {
  try {
    console.log('Profile API: Updating user profile', profileData);

    // Clean up the data - remove undefined values and empty strings
    const cleanedData = Object.entries(profileData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    console.log('Profile API: Cleaned data to send:', cleanedData);

    const { response, apiSource } = await makeApiRequest('/api/proxy/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cleanedData),
    });

    const data: ApiResponse = await response.json();

    console.log(`Profile API: Profile updated from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);
    console.log('Profile API: Full response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Profile API: Update profile failed with status:', response.status);
      console.error('Profile API: Error details:', JSON.stringify(data.error, null, 2));
      console.error('Profile API: Full error response:', JSON.stringify(data, null, 2));
      console.error('Profile API: Response headers:', response.headers);
    }

    return data;
  } catch (error) {
    console.error('Profile API: Update profile error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update profile'
      }
    };
  }
}

/**
 * Change user password
 */
export async function changeUserPassword(token: string, passwordData: ChangePasswordRequest): Promise<ApiResponse> {
  try {
    console.log('Profile API: Changing user password');
    
    const { response, apiSource } = await makeApiRequest('/api/proxy/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    const data: ApiResponse = await response.json();
    
    console.log(`Profile API: Password changed from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);

    if (!response.ok) {
      console.error('Profile API: Change password failed with status:', response.status);
      console.error('Profile API: Error details:', data.error);
    }

    return data;
  } catch (error) {
    console.error('Profile API: Change password error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to change password'
      }
    };
  }
}

/**
 * Helper function to check if error is a specific error code
 */
export function isErrorCode(response: ApiResponse, code: string): boolean {
  return response.error?.code === code;
}

/**
 * Helper function to get error message from API response
 */
export function getErrorMessage(response: ApiResponse): string {
  if (response.error) {
    return response.error.message || 'An error occurred';
  }
  return 'Unknown error occurred';
}

/**
 * Check API status
 */
export async function getApiStatus(): Promise<{
  isRealApiAvailable: boolean;
  currentApiSource: 'real' | 'mock';
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proxy/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 seconds timeout for health check
    });
    
    return {
      isRealApiAvailable: response.ok,
      currentApiSource: response.ok ? 'real' : 'mock'
    };
  } catch (error) {
    console.log('Profile API: Real API health check failed, using mock API');
    return {
      isRealApiAvailable: false,
      currentApiSource: 'mock'
    };
  }
}
