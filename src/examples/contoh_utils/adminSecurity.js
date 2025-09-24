/**
 * Admin Security Utilities
 * Additional security measures for admin panel access
 */

/**
 * Get client IP address (best effort in browser environment)
 * Note: This is not foolproof as IP can be spoofed, but adds a layer of security
 */
export const getClientIP = async () => {
  try {
    // Try to get IP from external service (for demo purposes)
    // In production, this should be handled by the backend
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not determine client IP:', error);
    return null;
  }
};

/**
 * Check if IP is in allowed list
 * @param {string} clientIP - Client IP address
 * @param {string} allowedIPs - Comma-separated list of allowed IPs/CIDR blocks
 */
export const isIPAllowed = (clientIP, allowedIPs) => {
  if (!clientIP || !allowedIPs) {
    return true; // If no restrictions configured, allow access
  }

  const allowedList = allowedIPs.split(',').map(ip => ip.trim());
  
  for (const allowed of allowedList) {
    if (allowed.includes('/')) {
      // CIDR notation - simplified check (for demo)
      const [network, prefix] = allowed.split('/');
      if (clientIP.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefix) / 8)).join('.'))) {
        return true;
      }
    } else {
      // Exact IP match
      if (clientIP === allowed) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check login attempt rate limiting
 * @param {string} identifier - IP or username
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} timeWindow - Time window in milliseconds
 */
export const checkRateLimit = (identifier, maxAttempts = 5, timeWindow = 15 * 60 * 1000) => {
  const key = `admin_login_attempts_${identifier}`;
  const now = Date.now();
  
  let attempts = JSON.parse(localStorage.getItem(key) || '[]');
  
  // Remove old attempts outside time window
  attempts = attempts.filter(attempt => now - attempt < timeWindow);
  
  if (attempts.length >= maxAttempts) {
    return {
      allowed: false,
      remainingTime: Math.ceil((attempts[0] + timeWindow - now) / 1000 / 60), // minutes
      attempts: attempts.length
    };
  }
  
  // Record this attempt
  attempts.push(now);
  localStorage.setItem(key, JSON.stringify(attempts));
  
  return {
    allowed: true,
    attempts: attempts.length,
    remainingAttempts: maxAttempts - attempts.length
  };
};

/**
 * Generate device fingerprint for additional security
 */
export const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
    timestamp: Date.now()
  };
  
  return btoa(JSON.stringify(fingerprint));
};

/**
 * Validate device fingerprint
 * @param {string} storedFingerprint - Previously stored fingerprint
 * @param {string} currentFingerprint - Current device fingerprint
 */
export const validateDeviceFingerprint = (storedFingerprint, currentFingerprint) => {
  try {
    const stored = JSON.parse(atob(storedFingerprint));
    const current = JSON.parse(atob(currentFingerprint));
    
    // Check critical properties
    const criticalMatch = 
      stored.userAgent === current.userAgent &&
      stored.platform === current.platform &&
      stored.screen === current.screen;
    
    return criticalMatch;
  } catch (error) {
    console.warn('Device fingerprint validation failed:', error);
    return false;
  }
};

/**
 * Check if admin access is allowed based on time restrictions
 */
export const isTimeBasedAccessAllowed = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Get time restrictions from environment
  const timeRestricted = import.meta.env.VITE_ADMIN_TIME_RESTRICTED === 'true';
  
  if (!timeRestricted) {
    return true;
  }
  
  // Business hours: 8 AM - 6 PM, Monday-Friday
  const isBusinessHours = hour >= 8 && hour <= 18 && day >= 1 && day <= 5;
  
  return isBusinessHours;
};

/**
 * Log security event (in production, this should send to backend)
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 */
export const logSecurityEvent = (event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In development, log to console
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.warn('Security Event:', logEntry);
  }
  
  // In production, this should be sent to a security monitoring service
  // Example: sendToSecurityService(logEntry);
};

/**
 * Comprehensive admin security check
 * @param {Object} options - Security check options
 */
export const performAdminSecurityCheck = async (options = {}) => {
  const {
    checkIP = true,
    checkRateLimit: checkRate = true,
    checkTimeAccess = false,
    identifier = 'unknown'
  } = options;
  
  const results = {
    passed: true,
    failures: [],
    warnings: []
  };
  
  // IP whitelist check
  if (checkIP) {
    const allowedIPs = import.meta.env.VITE_ADMIN_ALLOWED_IPS;
    if (allowedIPs) {
      try {
        const clientIP = await getClientIP();
        if (clientIP && !isIPAllowed(clientIP, allowedIPs)) {
          results.passed = false;
          results.failures.push('IP_NOT_ALLOWED');
          logSecurityEvent('admin_access_denied_ip', { clientIP, allowedIPs });
        }
      } catch (error) {
        results.warnings.push('IP_CHECK_FAILED');
      }
    }
  }
  
  // Rate limiting check
  if (checkRate) {
    const maxAttempts = parseInt(import.meta.env.VITE_ADMIN_MAX_LOGIN_ATTEMPTS) || 5;
    const rateCheck = checkRateLimit(identifier, maxAttempts);
    
    if (!rateCheck.allowed) {
      results.passed = false;
      results.failures.push('RATE_LIMIT_EXCEEDED');
      results.rateLimitInfo = rateCheck;
      logSecurityEvent('admin_rate_limit_exceeded', { identifier, attempts: rateCheck.attempts });
    }
  }
  
  // Time-based access check
  if (checkTimeAccess) {
    if (!isTimeBasedAccessAllowed()) {
      results.passed = false;
      results.failures.push('TIME_ACCESS_DENIED');
      logSecurityEvent('admin_access_denied_time', { timestamp: new Date().toISOString() });
    }
  }
  
  return results;
};

export default {
  getClientIP,
  isIPAllowed,
  checkRateLimit,
  generateDeviceFingerprint,
  validateDeviceFingerprint,
  isTimeBasedAccessAllowed,
  logSecurityEvent,
  performAdminSecurityCheck
};
