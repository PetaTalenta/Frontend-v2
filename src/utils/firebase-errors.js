/**
 * Firebase Auth Error Handler
 * 
 * This utility provides user-friendly error messages in Indonesian for Firebase authentication errors.
 * It maps Firebase error codes to localized, actionable error messages.
 * 
 * @module utils/firebase-errors
 */

/**
 * Firebase Error Code Mapping
 * Maps Firebase error codes to user-friendly Indonesian messages
 */
const FIREBASE_ERROR_MESSAGES = {
  // Authentication Errors
  'auth/user-not-found': 'Akun tidak ditemukan. Pastikan email Anda sudah terdaftar atau daftar terlebih dahulu.',
  'auth/wrong-password': 'Password yang Anda masukkan salah. Silakan coba lagi atau gunakan fitur lupa password.',
  'auth/invalid-email': 'Format email tidak valid. Periksa kembali email Anda.',
  'auth/user-disabled': 'Akun Anda telah dinonaktifkan. Hubungi administrator untuk informasi lebih lanjut.',
  'auth/invalid-credential': 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.',
  
  // Registration Errors
  'auth/email-already-in-use': 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
  'auth/email-already-exists': 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
  'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.',
  'auth/invalid-password': 'Password tidak valid. Gunakan minimal 6 karakter.',
  
  // Token / Session Errors
  'auth/id-token-expired': 'Sesi Anda telah berakhir. Silakan login kembali.',
  'auth/id-token-revoked': 'Sesi Anda telah dibatalkan. Silakan login kembali.',
  'auth/invalid-id-token': 'Token autentikasi tidak valid. Silakan login kembali.',
  'auth/session-expired': 'Sesi Anda telah berakhir. Silakan login kembali.',
  
  // Rate Limiting
  'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan tunggu beberapa saat dan coba lagi.',
  'auth/operation-not-allowed': 'Operasi ini tidak diizinkan. Hubungi administrator.',
  
  // Network Errors
  'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.',
  'auth/timeout': 'Permintaan memakan waktu terlalu lama. Periksa koneksi internet Anda.',
  
  // Password Reset Errors
  'auth/expired-action-code': 'Link reset password sudah kadaluarsa. Silakan minta link baru.',
  'auth/invalid-action-code': 'Link reset password tidak valid. Silakan minta link baru.',
  'auth/user-not-found-reset': 'Email tidak ditemukan. Pastikan email Anda sudah terdaftar.',
  
  // Account Management Errors
  'auth/requires-recent-login': 'Untuk keamanan, silakan login kembali untuk melanjutkan operasi ini.',
  'auth/invalid-user-token': 'Token pengguna tidak valid. Silakan login kembali.',
  'auth/user-token-expired': 'Token pengguna sudah kadaluarsa. Silakan login kembali.',
  
  // Generic/Unknown Errors
  'auth/internal-error': 'Terjadi kesalahan internal. Silakan coba lagi nanti.',
  'auth/unauthorized': 'Anda tidak memiliki akses. Silakan login terlebih dahulu.',
};

/**
 * HTTP Status Code Mapping
 * Maps HTTP status codes to user-friendly messages
 */
const HTTP_ERROR_MESSAGES = {
  400: 'Data yang Anda masukkan tidak valid. Periksa kembali form Anda.',
  401: 'Sesi Anda telah berakhir. Silakan login kembali.',
  403: 'Anda tidak memiliki akses untuk melakukan operasi ini.',
  404: 'Layanan tidak ditemukan. Silakan hubungi administrator.',
  409: 'Data sudah ada. Silakan gunakan data lain atau login.',
  422: 'Data yang Anda masukkan tidak sesuai format. Periksa kembali.',
  429: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.',
  500: 'Server mengalami gangguan. Silakan coba beberapa saat lagi.',
  502: 'Gateway server bermasalah. Silakan coba lagi nanti.',
  503: 'Layanan sedang dalam pemeliharaan. Silakan coba lagi nanti.',
  504: 'Koneksi ke server timeout. Periksa koneksi internet Anda.',
};

/**
 * API Error Code Mapping
 * Maps API error codes to user-friendly Indonesian messages
 */
const API_ERROR_MESSAGES = {
  // Authentication Errors
  'UNAUTHORIZED': 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.',
  'INVALID_EMAIL': 'Format email tidak valid. Periksa kembali email Anda.',
  'INVALID_PASSWORD': 'Password yang Anda masukkan salah. Silakan coba lagi atau gunakan fitur lupa password.',
  'USER_NOT_FOUND': 'Akun tidak ditemukan. Pastikan email Anda sudah terdaftar atau daftar terlebih dahulu.',
  'USER_DISABLED': 'Akun Anda telah dinonaktifkan. Hubungi administrator untuk informasi lebih lanjut.',
  'INVALID_CREDENTIALS': 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.',
  
  // Registration Errors
  'EMAIL_EXISTS': 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
  'EMAIL_ALREADY_IN_USE': 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
  'WEAK_PASSWORD': 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.',
  'PASSWORD_TOO_SHORT': 'Password terlalu pendek. Gunakan minimal 6 karakter.',
  
  // Token / Session Errors
  'TOKEN_EXPIRED': 'Sesi Anda telah berakhir. Silakan login kembali.',
  'TOKEN_INVALID': 'Token autentikasi tidak valid. Silakan login kembali.',
  'SESSION_EXPIRED': 'Sesi Anda telah berakhir. Silakan login kembali.',
  'INVALID_TOKEN': 'Token autentikasi tidak valid. Silakan login kembali.',
  
  // Rate Limiting
  'TOO_MANY_REQUESTS': 'Terlalu banyak percobaan. Silakan tunggu beberapa saat dan coba lagi.',
  'RATE_LIMIT_EXCEEDED': 'Terlalu banyak percobaan. Silakan tunggu beberapa saat dan coba lagi.',
  
  // Validation Errors
  'VALIDATION_ERROR': 'Data yang Anda masukkan tidak valid. Periksa kembali form Anda.',
  'MISSING_FIELD': 'Ada field yang wajib diisi. Periksa kembali form Anda.',
  'INVALID_INPUT': 'Data yang Anda masukkan tidak valid. Periksa kembali.',
  
  // Server Errors
  'INTERNAL_ERROR': 'Terjadi kesalahan internal. Silakan coba lagi nanti.',
  'SERVICE_UNAVAILABLE': 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
  'NETWORK_ERROR': 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.',
};

/**
 * Get user-friendly error message from Firebase error
 * 
 * @param {Error} error - Error object from Firebase or axios
 * @returns {string} - User-friendly error message in Indonesian
 */
export function getFirebaseErrorMessage(error) {
  // Check if error has Firebase error code (e.g., auth/user-not-found)
  if (error?.code) {
    // Try Firebase error codes first
    const firebaseMessage = FIREBASE_ERROR_MESSAGES[error.code];
    if (firebaseMessage) return firebaseMessage;
    
    // Try API error codes (e.g., UNAUTHORIZED, EMAIL_EXISTS)
    const apiMessage = API_ERROR_MESSAGES[error.code];
    if (apiMessage) return apiMessage;
  }

  // Check if it's an axios error with response
  if (error?.response) {
    const status = error.response.status;
    
    // ✅ PRIORITY 1: Try to get error code from nested error object
    const nestedErrorCode = error.response.data?.error?.code;
    if (nestedErrorCode) {
      // Try Firebase error codes
      if (FIREBASE_ERROR_MESSAGES[nestedErrorCode]) {
        return FIREBASE_ERROR_MESSAGES[nestedErrorCode];
      }
      // Try API error codes
      if (API_ERROR_MESSAGES[nestedErrorCode]) {
        return API_ERROR_MESSAGES[nestedErrorCode];
      }
    }
    
    // ✅ PRIORITY 2: Try to get error code from root level
    const rootErrorCode = error.response.data?.code;
    if (rootErrorCode) {
      // Try Firebase error codes
      if (FIREBASE_ERROR_MESSAGES[rootErrorCode]) {
        return FIREBASE_ERROR_MESSAGES[rootErrorCode];
      }
      // Try API error codes
      if (API_ERROR_MESSAGES[rootErrorCode]) {
        return API_ERROR_MESSAGES[rootErrorCode];
      }
    }
    
    // ✅ PRIORITY 3: Try to get specific error message from nested error object
    const nestedErrorMessage = error.response.data?.error?.message;
    if (nestedErrorMessage && nestedErrorMessage !== 'Operation failed') {
      // Map common English error messages to Indonesian
      const lowerMessage = nestedErrorMessage.toLowerCase();
      
      if (lowerMessage.includes('invalid email or password') || 
          lowerMessage.includes('invalid credentials')) {
        return 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.';
      }
      
      if (lowerMessage.includes('email already') || 
          lowerMessage.includes('email exists')) {
        return 'Email sudah terdaftar. Silakan login atau gunakan email lain.';
      }
      
      if (lowerMessage.includes('user not found')) {
        return 'Akun tidak ditemukan. Pastikan email Anda sudah terdaftar atau daftar terlebih dahulu.';
      }
      
      if (lowerMessage.includes('weak password') || 
          lowerMessage.includes('password too short')) {
        return 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.';
      }
      
      // If it's a meaningful message (not generic), use it
      return nestedErrorMessage;
    }
    
    // ✅ PRIORITY 4: Try HTTP status message
    if (HTTP_ERROR_MESSAGES[status]) {
      return HTTP_ERROR_MESSAGES[status];
    }
    
    // ✅ PRIORITY 5: Use root level message only as last resort
    const rootMessage = error.response.data?.message;
    if (rootMessage && rootMessage !== 'Operation failed') {
      return rootMessage;
    }

    // Generic status-based message
    return `Terjadi kesalahan (${status}). Silakan coba lagi.`;
  }

  // Check if it's a network error
  if (error?.request && !error?.response) {
    return HTTP_ERROR_MESSAGES[0] || 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }

  // Check error message for common patterns
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('network')) {
    return 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Permintaan memakan waktu terlalu lama. Periksa koneksi internet Anda.';
  }
  
  if (errorMessage.includes('expired') || errorMessage.includes('session')) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }
  
  if (errorMessage.includes('invalid email or password') || 
      errorMessage.includes('invalid credentials')) {
    return 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.';
  }

  // Fallback to generic error message (avoid showing "Operation failed")
  const finalMessage = error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
  return finalMessage === 'Operation failed' 
    ? 'Terjadi kesalahan. Silakan coba lagi.' 
    : finalMessage;
}

/**
 * Check if error is a Firebase auth error
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if it's a Firebase auth error
 */
export function isFirebaseAuthError(error) {
  return error?.code?.startsWith('auth/') === true;
}

/**
 * Check if error requires re-authentication
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if user needs to login again
 */
export function requiresReauth(error) {
  const reauthCodes = [
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/invalid-id-token',
    'auth/session-expired',
    'auth/user-token-expired',
    'auth/invalid-user-token',
    'auth/requires-recent-login',
  ];

  if (error?.code && reauthCodes.includes(error.code)) {
    return true;
  }

  if (error?.response?.status === 401) {
    return true;
  }

  return false;
}

/**
 * Check if error is a rate limit error
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if it's a rate limit error
 */
export function isRateLimitError(error) {
  return (
    error?.code === 'auth/too-many-requests' ||
    error?.response?.status === 429
  );
}

/**
 * Check if error is a network error
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if it's a network error
 */
export function isNetworkError(error) {
  return (
    error?.code === 'auth/network-request-failed' ||
    error?.code === 'NETWORK_ERROR' ||
    (error?.request && !error?.response)
  );
}

/**
 * Get error category for analytics/monitoring
 * 
 * @param {Error} error - Error object
 * @returns {string} - Error category (auth, network, validation, server, unknown)
 */
export function getErrorCategory(error) {
  if (isFirebaseAuthError(error)) return 'auth';
  if (isNetworkError(error)) return 'network';
  if (error?.response?.status === 400 || error?.response?.status === 422) return 'validation';
  if (error?.response?.status >= 500) return 'server';
  return 'unknown';
}

/**
 * Create user-friendly error object
 * 
 * @param {Error} error - Original error
 * @returns {Object} - User-friendly error object
 */
export function createUserError(error) {
  return {
    message: getFirebaseErrorMessage(error),
    category: getErrorCategory(error),
    requiresReauth: requiresReauth(error),
    isRateLimit: isRateLimitError(error),
    isNetwork: isNetworkError(error),
    originalError: error,
  };
}

/**
 * Log error for debugging (development only)
 * 
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 */
export function logAuthError(context, error) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Auth V2 Error] ${context}:`, {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      category: getErrorCategory(error),
      requiresReauth: requiresReauth(error),
    });
  }
}

// Export all utilities
export default {
  getFirebaseErrorMessage,
  isFirebaseAuthError,
  requiresReauth,
  isRateLimitError,
  isNetworkError,
  getErrorCategory,
  createUserError,
  logAuthError,
};
