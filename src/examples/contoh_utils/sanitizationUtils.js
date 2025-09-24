/**
 * Input Sanitization Utilities with DOMPurify
 * Comprehensive sanitization functions for user input and content
 */

import DOMPurify from 'dompurify';

/**
 * Default DOMPurify configuration for general content
 */
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['style', 'on*'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Strict configuration for user input (text only)
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: ['#text'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: false,
  FORBID_TAGS: ['*'],
  FORBID_ATTR: ['*']
};

/**
 * Configuration for rich text content
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'iframe'],
  FORBID_ATTR: ['style', 'on*', 'javascript:*'],
  KEEP_CONTENT: true
};

/**
 * Sanitize general HTML content
 * @param {string} input - HTML content to sanitize
 * @param {Object} config - Custom DOMPurify configuration (optional)
 * @returns {string} Sanitized HTML content
 */
export const sanitizeHTML = (input, config = DEFAULT_CONFIG) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(input.trim(), config);
  } catch (error) {
    console.warn('HTML sanitization failed:', error);
    return '';
  }
};

/**
 * Sanitize user input text (removes all HTML)
 * @param {string} input - Text input to sanitize
 * @param {number} maxLength - Maximum length allowed (default: 1000)
 * @returns {string} Sanitized text
 */
export const sanitizeText = (input, maxLength = 1000) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    // First pass: Remove HTML tags completely
    const textOnly = DOMPurify.sanitize(input, STRICT_CONFIG);
    
    // Second pass: Additional text sanitization
    return textOnly
      .trim()
      .slice(0, maxLength)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  } catch (error) {
    console.warn('Text sanitization failed:', error);
    return '';
  }
};

/**
 * Sanitize rich text content (allows safe HTML formatting)
 * @param {string} input - Rich text content to sanitize
 * @param {number} maxLength - Maximum length allowed (default: 10000)
 * @returns {string} Sanitized rich text
 */
export const sanitizeRichText = (input, maxLength = 10000) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    const sanitized = DOMPurify.sanitize(input.trim().slice(0, maxLength), RICH_TEXT_CONFIG);
    
    // Additional validation for links
    return sanitized.replace(/<a\s+href="([^"]*)"[^>]*>/gi, (match, href) => {
      // Only allow safe protocols
      if (href.match(/^(https?:\/\/|mailto:|tel:|#)/i)) {
        return match;
      }
      // Remove href if protocol is not safe
      return match.replace(/href="[^"]*"/i, '');
    });
  } catch (error) {
    console.warn('Rich text sanitization failed:', error);
    return '';
  }
};

/**
 * Sanitize URL input
 * @param {string} url - URL to sanitize
 * @param {Array} allowedProtocols - Allowed URL protocols (default: ['http', 'https'])
 * @returns {string|null} Sanitized URL or null if invalid
 */
export const sanitizeURL = (url, allowedProtocols = ['http', 'https']) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const trimmedUrl = url.trim();
    
    // Check for javascript: or data: protocols
    if (trimmedUrl.match(/^(javascript|data|vbscript):/i)) {
      return null;
    }

    const urlObj = new URL(trimmedUrl);
    
    // Check if protocol is allowed
    const protocol = urlObj.protocol.slice(0, -1); // Remove trailing ':'
    if (!allowedProtocols.includes(protocol.toLowerCase())) {
      return null;
    }

    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, try with protocol prefix
    try {
      if (!url.match(/^https?:\/\//i)) {
        const urlWithProtocol = `https://${url}`;
        const urlObj = new URL(urlWithProtocol);
        return urlObj.toString();
      }
    } catch (secondError) {
      console.warn('URL sanitization failed:', error);
    }
    return null;
  }
};

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string|null} Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Remove any HTML tags
    const textOnly = DOMPurify.sanitize(trimmedEmail, STRICT_CONFIG);
    
    // Basic email validation (more strict than before)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (emailRegex.test(textOnly)) {
      return textOnly;
    }
    
    return null;
  } catch (error) {
    console.warn('Email sanitization failed:', error);
    return null;
  }
};

/**
 * Sanitize filename input
 * @param {string} filename - Filename to sanitize
 * @param {number} maxLength - Maximum length allowed (default: 255)
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename, maxLength = 255) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  try {
    // Remove HTML tags
    const textOnly = DOMPurify.sanitize(filename, STRICT_CONFIG);
    
    // Remove dangerous characters and normalize
    return textOnly
      .trim()
      .slice(0, maxLength)
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous filename characters
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();
  } catch (error) {
    console.warn('Filename sanitization failed:', error);
    return '';
  }
};

/**
 * Sanitize JSON input
 * @param {string} jsonString - JSON string to sanitize
 * @param {number} maxDepth - Maximum object depth allowed (default: 10)
 * @returns {Object|null} Parsed and sanitized JSON object or null if invalid
 */
export const sanitizeJSON = (jsonString, maxDepth = 10) => {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  try {
    // Remove HTML tags first
    const textOnly = DOMPurify.sanitize(jsonString, STRICT_CONFIG);
    
    const parsed = JSON.parse(textOnly);
    
    // Check depth and sanitize string values recursively
    const sanitizeObject = (obj, depth = 0) => {
      if (depth > maxDepth) {
        throw new Error('Maximum depth exceeded');
      }
      
      if (typeof obj === 'string') {
        return sanitizeText(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, depth + 1));
      } else if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          const sanitizedKey = sanitizeText(key, 100);
          if (sanitizedKey) {
            sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
          }
        }
        return sanitized;
      }
      
      return obj;
    };
    
    return sanitizeObject(parsed);
  } catch (error) {
    console.warn('JSON sanitization failed:', error);
    return null;
  }
};

/**
 * Comprehensive input sanitizer that detects input type and applies appropriate sanitization
 * @param {any} input - Input to sanitize
 * @param {string} type - Expected input type ('text', 'html', 'richtext', 'url', 'email', 'filename', 'json')
 * @param {Object} options - Additional options
 * @returns {any} Sanitized input
 */
export const sanitizeInput = (input, type = 'text', options = {}) => {
  const { maxLength, allowedProtocols, maxDepth } = options;

  switch (type.toLowerCase()) {
    case 'html':
      return sanitizeHTML(input, options.config);
    case 'richtext':
      return sanitizeRichText(input, maxLength);
    case 'url':
      return sanitizeURL(input, allowedProtocols);
    case 'email':
      return sanitizeEmail(input);
    case 'filename':
      return sanitizeFilename(input, maxLength);
    case 'json':
      return sanitizeJSON(input, maxDepth);
    case 'text':
    default:
      return sanitizeText(input, maxLength);
  }
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeRichText,
  sanitizeURL,
  sanitizeEmail,
  sanitizeFilename,
  sanitizeJSON,
  sanitizeInput,
  DEFAULT_CONFIG,
  STRICT_CONFIG,
  RICH_TEXT_CONFIG
};
