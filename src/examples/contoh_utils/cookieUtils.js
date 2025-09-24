import Cookies from 'js-cookie';

/**
 * Cookie utility functions for secure token storage
 * Provides secure cookie management with proper security settings
 */

// Default cookie configuration
const DEFAULT_COOKIE_OPTIONS = {
  secure: window.location.protocol === 'https:', // Only send over HTTPS in production
  sameSite: 'strict', // CSRF protection
  expires: 7, // 7 days
  path: '/', // Available throughout the app
};

// Admin cookie configuration (shorter expiry)
const ADMIN_COOKIE_OPTIONS = {
  ...DEFAULT_COOKIE_OPTIONS,
  expires: 1, // 1 day for admin sessions
};

/**
 * Set a secure cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Additional cookie options
 */
export const setSecureCookie = (name, value, options = {}) => {
  try {
    const cookieOptions = {
      ...DEFAULT_COOKIE_OPTIONS,
      ...options,
    };

    // Note: httpOnly cannot be set from JavaScript for security reasons
    // This should be handled by the backend when setting authentication cookies
    Cookies.set(name, value, cookieOptions);
    
    return true;
  } catch (error) {
    console.error(`Failed to set cookie ${name}:`, error);
    return false;
  }
};

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  try {
    return Cookies.get(name) || null;
  } catch (error) {
    console.error(`Failed to get cookie ${name}:`, error);
    return null;
  }
};

/**
 * Remove a cookie
 * @param {string} name - Cookie name
 * @param {Object} options - Additional options (path, domain)
 */
export const removeCookie = (name, options = {}) => {
  try {
    const cookieOptions = {
      path: '/',
      ...options,
    };
    
    Cookies.remove(name, cookieOptions);
    return true;
  } catch (error) {
    console.error(`Failed to remove cookie ${name}:`, error);
    return false;
  }
};

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} - True if cookie exists
 */
export const hasCookie = (name) => {
  return getCookie(name) !== null;
};

/**
 * Set authentication token cookie
 * @param {string} token - Authentication token
 * @returns {boolean} - Success status
 */
export const setAuthToken = (token) => {
  return setSecureCookie('authToken', token, {
    expires: 7, // 7 days
  });
};

/**
 * Get authentication token from cookie
 * @returns {string|null} - Token or null
 */
export const getAuthToken = () => {
  return getCookie('authToken');
};

/**
 * Remove authentication token cookie
 * @returns {boolean} - Success status
 */
export const removeAuthToken = () => {
  return removeCookie('authToken');
};

/**
 * Set admin token cookie (shorter expiry)
 * @param {string} token - Admin token
 * @returns {boolean} - Success status
 */
export const setAdminToken = (token) => {
  return setSecureCookie('adminToken', token, ADMIN_COOKIE_OPTIONS);
};

/**
 * Get admin token from cookie
 * @returns {string|null} - Admin token or null
 */
export const getAdminToken = () => {
  return getCookie('adminToken');
};

/**
 * Remove admin token cookie
 * @returns {boolean} - Success status
 */
export const removeAdminToken = () => {
  return removeCookie('adminToken');
};

/**
 * Set user data cookie (non-sensitive user info)
 * @param {Object} userData - User data object
 * @returns {boolean} - Success status
 */
export const setUserData = (userData) => {
  try {
    const userDataString = JSON.stringify(userData);
    return setSecureCookie('userData', userDataString, {
      expires: 7,
    });
  } catch (error) {
    console.error('Failed to set user data cookie:', error);
    return false;
  }
};

/**
 * Get user data from cookie
 * @returns {Object|null} - User data object or null
 */
export const getUserData = () => {
  try {
    const userDataString = getCookie('userData');
    if (!userDataString) {
      return null;
    }
    return JSON.parse(userDataString);
  } catch (error) {
    console.error('Failed to parse user data cookie:', error);
    return null;
  }
};

/**
 * Remove user data cookie
 * @returns {boolean} - Success status
 */
export const removeUserData = () => {
  return removeCookie('userData');
};

/**
 * Set admin user data cookie
 * @param {Object} adminData - Admin user data
 * @returns {boolean} - Success status
 */
export const setAdminUserData = (adminData) => {
  try {
    const adminDataString = JSON.stringify(adminData);
    return setSecureCookie('adminUserData', adminDataString, ADMIN_COOKIE_OPTIONS);
  } catch (error) {
    console.error('Failed to set admin user data cookie:', error);
    return false;
  }
};

/**
 * Get admin user data from cookie
 * @returns {Object|null} - Admin user data or null
 */
export const getAdminUserData = () => {
  try {
    const adminDataString = getCookie('adminUserData');
    if (!adminDataString) {
      return null;
    }
    return JSON.parse(adminDataString);
  } catch (error) {
    console.error('Failed to parse admin user data cookie:', error);
    return null;
  }
};

/**
 * Remove admin user data cookie
 * @returns {boolean} - Success status
 */
export const removeAdminUserData = () => {
  return removeCookie('adminUserData');
};

/**
 * Clear all authentication cookies
 */
export const clearAllAuthCookies = () => {
  removeAuthToken();
  removeUserData();
  removeAdminToken();
  removeAdminUserData();
};

/**
 * Migration utility to move from localStorage to cookies
 * @param {string} localStorageKey - localStorage key to migrate
 * @param {Function} setCookieFunction - Function to set the cookie
 */
export const migrateFromLocalStorage = (localStorageKey, setCookieFunction) => {
  try {
    const value = localStorage.getItem(localStorageKey);
    if (value) {
      // Try to set cookie
      const success = setCookieFunction(value);
      if (success) {
        // Remove from localStorage after successful migration
        localStorage.removeItem(localStorageKey);
        console.log(`Migrated ${localStorageKey} from localStorage to cookie`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Failed to migrate ${localStorageKey}:`, error);
    return false;
  }
};

export default {
  setSecureCookie,
  getCookie,
  removeCookie,
  hasCookie,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setAdminToken,
  getAdminToken,
  removeAdminToken,
  setUserData,
  getUserData,
  removeUserData,
  setAdminUserData,
  getAdminUserData,
  removeAdminUserData,
  clearAllAuthCookies,
  migrateFromLocalStorage,
};
