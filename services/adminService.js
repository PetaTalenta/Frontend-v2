import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

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
      // Remove debug log to reduce console noise
      return response.data;
    } catch (error) {
      console.error('Admin API Error:', error);
      if (error.response?.status === 401) {
        // Token expired, clear admin session
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
      // Check if it's a connection error and provide fallback for development
      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend not available, using mock data for development');
        return this.mockLogin(username, password);
      }

      const errorData = error.response?.data;
      throw new Error(errorData?.error?.message || error.message || 'Login failed');
    }
  }

  // Mock login for development when backend is not available
  mockLogin(username, password) {
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
      console.warn('Logout request failed:', error.message);
    } finally {
      // Clear admin session regardless of API response
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      this.adminToken = null;
      this.adminUser = {};
    }
  }

  async getProfile() {
    try {
      return await this.adminApiRequest(API_ENDPOINTS.ADMIN.PROFILE);
    } catch (error) {
      // Check if it's a connection error and provide fallback for development
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        console.warn('Backend not available, using mock profile data for development');
        return this.mockGetProfile();
      }
      throw error;
    }
  }

  mockGetProfile() {
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

    return {
      success: true,
      data: {
        admin: mockAdmin
      }
    };
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
      // Check if it's a connection error and provide fallback for development
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        console.warn('Backend not available, using mock users data for development');
        return this.mockGetUsers(page, limit, search, sortBy, sortOrder);
      }

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

  mockGetUsers(page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC') {
    const mockUsers = [
      {
        id: 'user-1',
        username: 'john_doe',
        email: 'john@example.com',
        full_name: 'John Doe',
        token_balance: 100,
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        last_login: '2024-01-20T14:20:00Z'
      },
      {
        id: 'user-2',
        username: 'jane_smith',
        email: 'jane@example.com',
        full_name: 'Jane Smith',
        token_balance: 75,
        is_active: true,
        created_at: '2024-01-10T09:15:00Z',
        updated_at: '2024-01-10T09:15:00Z',
        last_login: '2024-01-19T16:45:00Z'
      },
      {
        id: 'user-3',
        username: 'bob_wilson',
        email: 'bob@example.com',
        full_name: 'Bob Wilson',
        token_balance: 50,
        is_active: false,
        created_at: '2024-01-05T11:00:00Z',
        updated_at: '2024-01-05T11:00:00Z',
        last_login: '2024-01-18T12:30:00Z'
      }
    ];

    // Apply search filter
    let filteredUsers = mockUsers;
    if (search) {
      filteredUsers = mockUsers.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.full_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'last_login') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    };
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

  // Error handling helper
  handleError(error) {
    console.error('Admin API Error:', error);
    
    const errorMessages = {
      'UNAUTHORIZED': 'Session expired. Please login again.',
      'FORBIDDEN': 'You do not have permission to perform this action.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'NOT_FOUND': 'The requested resource was not found.',
      'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
    };
    
    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }
}

// Export singleton instance
export default new AdminService();
