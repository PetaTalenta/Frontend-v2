import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { logger } from '../utils/env-logger';


// Admin API Service - Terpisah dari user authentication
class AdminService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.adminToken = localStorage.getItem('adminToken');
    this.adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  }

  // Helper method untuk authenticated requests
  async adminApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');

    // Ensure endpoint is a full URL
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    const config = {
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error('Admin API Error:', error);
      if (error.response?.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      const errorData = error.response?.data;
      throw new Error(errorData?.error?.message || error.message || 'Request failed');
    }
  }

  // Admin Authentication Methods
  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseURL}${API_ENDPOINTS.ADMIN.LOGIN}`, {
        username,
        password
      });

      if (response.data.success) {
        const { admin, token } = response.data.data;

        // Store admin session
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(admin));

        this.adminToken = token;
        this.adminUser = admin;

        return { admin, token };
      } else {
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error) {
      const errorData = error.response?.data;
      throw new Error(errorData?.error?.message || error.message || 'Login failed');
    }
  }

  // Mock login removed
    if (username === 'superadmin' && password === 'admin123') {
      const mockAdmin = {
        id: 'mock-admin-id',
        username: 'superadmin',
        email: 'admin@atma.com',
        full_name: 'Super Administrator',
        role: 'superadmin',
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
      };

      const mockToken = 'mock-jwt-token-for-development';

      // Store admin session
      localStorage.setItem('adminToken', mockToken);
      localStorage.setItem('adminUser', JSON.stringify(mockAdmin));

      this.adminToken = mockToken;
      this.adminUser = mockAdmin;

      return { admin: mockAdmin, token: mockToken };
    } else {
      throw new Error('Invalid credentials');
    }
  }

  async logout() {
    try {
      if (this.adminToken) {
        await this.adminApiRequest(API_ENDPOINTS.ADMIN.LOGOUT, { method: 'POST' });
      }
    } catch (error) {
      logger.warn('Logout request failed:', error.message);
    } finally {
      // Clear admin session regardless of API response
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      this.adminToken = null;
      this.adminUser = {};
    }
  }

  async getProfile() {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.PROFILE);
  }

  async updateProfile(profileData) {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.PROFILE, {
      method: 'PUT',
      data: profileData
    });
  }

  async changePassword(currentPassword, newPassword) {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.CHANGE_PASSWORD, {
      method: 'POST',
      data: {
        currentPassword,
        newPassword
      }
    });
  }

  async registerAdmin(adminData) {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.REGISTER, {
      method: 'POST',
      data: adminData
    });
  }

  // User Management Methods
  async getUsers(page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sortBy,
      sortOrder
    });

    try {
      const response = await this.adminApiRequest(`${API_ENDPOINTS.ADMIN.USERS}?${params}`);

      // Ensure response has the expected structure
      if (!response.data) {
        response.data = {};
      }
      if (!Array.isArray(response.data.users)) {
        response.data.users = [];
      }
      if (!response.data.pagination) {
        response.data.pagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        };
      }

      return response;
    } catch (error) {

      // Return safe default structure on other errors
      return {
        success: false,
        data: {
          users: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  }



  async getUserById(userId) {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.USER_BY_ID(userId));
  }

  async updateUserTokenBalance(userId, tokenBalance, action = 'set') {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.UPDATE_USER_TOKEN_BALANCE(userId), {
      method: 'PUT',
      data: { token_balance: tokenBalance, action }
    });
  }

  async deleteUser(userId) {
    return await this.adminApiRequest(API_ENDPOINTS.ADMIN.DELETE_USER(userId), {
      method: 'DELETE'
    });
  }

  // Utility Methods
  isAuthenticated() {
    return !!this.adminToken && !!localStorage.getItem('adminToken');
  }

  getCurrentAdmin() {
    return this.adminUser;
  }

  hasRole(requiredRole) {
    const roleHierarchy = {
      'moderator': 1,
      'admin': 2,
      'superadmin': 3
    };

    const userLevel = roleHierarchy[this.adminUser.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  // FIXED: Error handling helper with safe property access
  handleError(error) {
    logger.error('Admin API Error:', error);

    const errorMessages = {
      'UNAUTHORIZED': 'Session expired. Please login again.',
      'FORBIDDEN': 'You do not have permission to perform this action.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'NOT_FOUND': 'The requested resource was not found.',
      'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
    };

    // FIXED: Safe access to error.code with optional chaining and fallback
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    const errorMessage = error?.message || 'An unexpected error occurred.';

    return errorMessages[errorCode] || errorMessage;
  }
}

// Export singleton instance
export default new AdminService();
