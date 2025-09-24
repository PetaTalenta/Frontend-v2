import { getAuthToken, getUserData } from './cookieUtils';
import axios from 'axios';

/**
 * Debug utility untuk memeriksa status authentication
 */
export const debugAuth = () => {
  console.group('🔍 Authentication Debug');
  
  // Check token in cookies
  const token = getAuthToken();
  console.log('📝 Token from cookies:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  
  // Check user data in cookies
  const userData = getUserData();
  console.log('👤 User data from cookies:', userData);
  
  // Check axios default headers
  console.log('🔧 Axios default headers:', axios.defaults.headers.common);
  
  // Check if Authorization header is set
  const authHeader = axios.defaults.headers.common['Authorization'];
  console.log('🔑 Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NOT SET');
  
  // Check localStorage (should be empty after migration)
  const localToken = localStorage.getItem('token');
  const localUser = localStorage.getItem('user');
  console.log('💾 localStorage token:', localToken ? 'FOUND (should be migrated)' : 'NOT FOUND');
  console.log('💾 localStorage user:', localUser ? 'FOUND (should be migrated)' : 'NOT FOUND');
  
  console.groupEnd();
  
  return {
    hasToken: !!token,
    hasUserData: !!userData,
    hasAuthHeader: !!authHeader,
    token: token,
    userData: userData
  };
};

/**
 * Test API call dengan logging detail
 */
export const testApiCall = async (endpoint = '/api/auth/profile') => {
  console.group('🧪 Testing API Call');
  console.log('📍 Endpoint:', endpoint);
  
  try {
    // Log request details
    const token = getAuthToken();
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    const response = await axios.get(endpoint);
    console.log('✅ Success:', response.status, response.statusText);
    console.log('📦 Response data:', response.data);
    
    console.groupEnd();
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('📦 Error data:', error.response?.data);
    console.log('🔧 Request config:', error.config);
    
    console.groupEnd();
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Comprehensive auth check
 */
export const checkAuthStatus = async () => {
  console.group('🔐 Comprehensive Auth Check');
  
  const debugInfo = debugAuth();
  
  if (!debugInfo.hasToken) {
    console.log('❌ No token found - user needs to login');
    console.groupEnd();
    return { authenticated: false, reason: 'No token found' };
  }
  
  // Test with profile endpoint
  const profileTest = await testApiCall('/api/auth/profile');
  
  if (profileTest.success) {
    console.log('✅ Authentication working correctly');
    console.groupEnd();
    return { authenticated: true, user: profileTest.data };
  } else {
    console.log('❌ Authentication failed');
    console.groupEnd();
    return { authenticated: false, reason: 'API call failed', error: profileTest.error };
  }
};
