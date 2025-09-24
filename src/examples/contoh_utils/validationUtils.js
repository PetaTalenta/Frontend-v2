/**
 * Validation Utilities
 * Comprehensive validation functions for forms and user input
 */

import { sanitizeEmail, sanitizeText } from './sanitizationUtils';

/**
 * Strict email validation regex based on RFC 5322 specification
 * More restrictive than the basic pattern used before
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Additional email validation patterns for common issues
 */
const EMAIL_VALIDATION_PATTERNS = {
  // Check for consecutive dots
  consecutiveDots: /\.{2,}/,
  // Check for dots at start or end
  dotsAtEdges: /^\.|\.$/, 
  // Check for invalid characters in local part
  invalidLocalChars: /[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]/,
  // Check for too long local part (before @)
  longLocalPart: /^.{65,}@/,
  // Check for too long domain part (after @)
  longDomainPart: /@.{254,}$/,
  // Check for invalid domain format
  invalidDomain: /@[^a-zA-Z0-9.-]|@.*[^a-zA-Z0-9.-]$/
};

/**
 * Common disposable email domains to block (optional)
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'tempmail.org',
  'guerrillamail.com',
  'mailinator.com',
  'yopmail.com',
  'temp-mail.org',
  'throwaway.email'
];

/**
 * Validate email address with comprehensive checks
 * @param {string} email - Email address to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with details
 */
export const validateEmail = (email, options = {}) => {
  const {
    allowDisposable = true,
    maxLength = 254,
    requireTLD = true,
    customDomainBlacklist = []
  } = options;

  const result = {
    isValid: false,
    sanitizedEmail: null,
    errors: []
  };

  // Basic type and presence check
  if (!email || typeof email !== 'string') {
    result.errors.push('Email is required');
    return result;
  }

  // Sanitize the email first
  const sanitized = sanitizeEmail(email);
  if (!sanitized) {
    result.errors.push('Email contains invalid characters');
    return result;
  }

  result.sanitizedEmail = sanitized;

  // Length check
  if (sanitized.length > maxLength) {
    result.errors.push(`Email must be less than ${maxLength} characters`);
    return result;
  }

  // Basic format check
  if (!EMAIL_REGEX.test(sanitized)) {
    result.errors.push('Invalid email format');
    return result;
  }

  // Additional pattern checks
  const localPart = sanitized.split('@')[0];
  const domainPart = sanitized.split('@')[1];

  // Check for consecutive dots
  if (EMAIL_VALIDATION_PATTERNS.consecutiveDots.test(sanitized)) {
    result.errors.push('Email cannot contain consecutive dots');
    return result;
  }

  // Check for dots at edges of local part
  if (EMAIL_VALIDATION_PATTERNS.dotsAtEdges.test(localPart)) {
    result.errors.push('Email cannot start or end with a dot');
    return result;
  }

  // Check local part length
  if (localPart.length > 64) {
    result.errors.push('Email local part is too long');
    return result;
  }

  // Check domain part length
  if (domainPart.length > 253) {
    result.errors.push('Email domain part is too long');
    return result;
  }

  // Check for TLD requirement
  if (requireTLD && !domainPart.includes('.')) {
    result.errors.push('Email must include a valid domain');
    return result;
  }

  // Check for valid TLD
  if (requireTLD) {
    const tld = domainPart.split('.').pop();
    if (!tld || tld.length < 2 || tld.length > 6) {
      result.errors.push('Email must have a valid top-level domain');
      return result;
    }
  }

  // Check against disposable email domains
  if (!allowDisposable && DISPOSABLE_EMAIL_DOMAINS.includes(domainPart.toLowerCase())) {
    result.errors.push('Disposable email addresses are not allowed');
    return result;
  }

  // Check against custom domain blacklist
  if (customDomainBlacklist.length > 0 && customDomainBlacklist.includes(domainPart.toLowerCase())) {
    result.errors.push('This email domain is not allowed');
    return result;
  }

  // If we get here, email is valid
  result.isValid = true;
  return result;
};

/**
 * Simple email validation for React Hook Form
 * @param {string} email - Email to validate
 * @returns {string|boolean} Error message or true if valid
 */
export const validateEmailSimple = (email) => {
  const result = validateEmail(email);
  return result.isValid ? true : result.errors[0];
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with strength score
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    forbidCommonPasswords = true
  } = options;

  const result = {
    isValid: false,
    strength: 0,
    errors: [],
    suggestions: []
  };

  if (!password || typeof password !== 'string') {
    result.errors.push('Password is required');
    return result;
  }

  // Length checks
  if (password.length < minLength) {
    result.errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    result.errors.push(`Password must be less than ${maxLength} characters long`);
  }

  // Character type checks
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
    result.suggestions.push('Add an uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    result.strength += 1;
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
    result.suggestions.push('Add a lowercase letter');
  } else if (/[a-z]/.test(password)) {
    result.strength += 1;
  }

  if (requireNumbers && !/\d/.test(password)) {
    result.errors.push('Password must contain at least one number');
    result.suggestions.push('Add a number');
  } else if (/\d/.test(password)) {
    result.strength += 1;
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
    result.suggestions.push('Add a special character (!@#$%^&*)');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.strength += 1;
  }

  // Additional strength checks
  if (password.length >= 12) {
    result.strength += 1;
  }

  if (!/(.)\1{2,}/.test(password)) { // No repeated characters
    result.strength += 1;
  }

  // Common password check (basic)
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (forbidCommonPasswords && commonPasswords.includes(password.toLowerCase())) {
    result.errors.push('Password is too common');
    result.suggestions.push('Use a more unique password');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateUsername = (username, options = {}) => {
  const {
    minLength = 3,
    maxLength = 20,
    allowSpecialChars = false,
    reservedNames = ['admin', 'root', 'user', 'test', 'guest']
  } = options;

  const result = {
    isValid: false,
    sanitizedUsername: null,
    errors: []
  };

  if (!username || typeof username !== 'string') {
    result.errors.push('Username is required');
    return result;
  }

  // Sanitize username
  const sanitized = sanitizeText(username, maxLength).toLowerCase();
  if (!sanitized) {
    result.errors.push('Username contains invalid characters');
    return result;
  }

  result.sanitizedUsername = sanitized;

  // Length checks
  if (sanitized.length < minLength) {
    result.errors.push(`Username must be at least ${minLength} characters long`);
  }

  if (sanitized.length > maxLength) {
    result.errors.push(`Username must be less than ${maxLength} characters long`);
  }

  // Character checks
  if (allowSpecialChars) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(sanitized)) {
      result.errors.push('Username can only contain letters, numbers, dots, hyphens, and underscores');
    }
  } else {
    if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
      result.errors.push('Username can only contain letters, numbers, and underscores');
    }
  }

  // Must start with letter or number
  if (!/^[a-zA-Z0-9]/.test(sanitized)) {
    result.errors.push('Username must start with a letter or number');
  }

  // Check against reserved names
  if (reservedNames.includes(sanitized)) {
    result.errors.push('This username is reserved');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * React Hook Form validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: {
    required: 'Email is required',
    validate: validateEmailSimple
  },
  
  password: {
    required: 'Password is required',
    validate: (value) => {
      const result = validatePassword(value);
      return result.isValid ? true : result.errors[0];
    }
  },
  
  username: {
    required: 'Username is required',
    validate: (value) => {
      const result = validateUsername(value);
      return result.isValid ? true : result.errors[0];
    }
  }
};

export default {
  validateEmail,
  validateEmailSimple,
  validatePassword,
  validateUsername,
  VALIDATION_PATTERNS,
  EMAIL_REGEX
};
