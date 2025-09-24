/**
 * Content Security Policy Utilities
 * Utilities for managing CSP nonces and security headers
 */

/**
 * Generate a cryptographically secure nonce for CSP
 * @returns {string} Base64 encoded nonce
 */
export const generateNonce = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

/**
 * Get or create CSP nonce for the current session
 * @returns {string} CSP nonce
 */
export const getCSPNonce = () => {
  let nonce = sessionStorage.getItem('csp-nonce');
  if (!nonce) {
    nonce = generateNonce();
    sessionStorage.setItem('csp-nonce', nonce);
  }
  return nonce;
};

/**
 * Create inline script with CSP nonce
 * @param {string} scriptContent - JavaScript code to execute
 * @param {string} nonce - CSP nonce (optional, will generate if not provided)
 * @returns {HTMLScriptElement} Script element with nonce
 */
export const createSecureScript = (scriptContent, nonce = null) => {
  const script = document.createElement('script');
  script.nonce = nonce || getCSPNonce();
  script.textContent = scriptContent;
  return script;
};

/**
 * Create inline style with CSP nonce
 * @param {string} styleContent - CSS content
 * @param {string} nonce - CSP nonce (optional, will generate if not provided)
 * @returns {HTMLStyleElement} Style element with nonce
 */
export const createSecureStyle = (styleContent, nonce = null) => {
  const style = document.createElement('style');
  style.nonce = nonce || getCSPNonce();
  style.textContent = styleContent;
  return style;
};

/**
 * Validate if a URL is allowed by CSP
 * @param {string} url - URL to validate
 * @param {string} directive - CSP directive (e.g., 'script-src', 'img-src')
 * @returns {boolean} Whether URL is allowed
 */
export const isURLAllowedByCSP = (url, directive = 'default-src') => {
  try {
    const urlObj = new URL(url);
    
    // Define allowed sources based on our CSP policy
    const allowedSources = {
      'default-src': ['self'],
      'script-src': ['self'],
      'style-src': ['self', 'https://fonts.googleapis.com'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'img-src': ['self', 'data:', 'https:'],
      'connect-src': ['self', 'https://api.ipify.org', 'https://api.chhrone.web.id'],
      'frame-src': [],
      'object-src': []
    };
    
    const allowed = allowedSources[directive] || allowedSources['default-src'];
    
    // Check if URL matches allowed sources
    for (const source of allowed) {
      if (source === 'self' && urlObj.origin === window.location.origin) {
        return true;
      }
      if (source === 'data:' && urlObj.protocol === 'data:') {
        return true;
      }
      if (source === 'https:' && urlObj.protocol === 'https:') {
        return true;
      }
      if (source.startsWith('https://') && urlObj.origin === source) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('CSP URL validation failed:', error);
    return false;
  }
};

/**
 * Report CSP violations (for monitoring)
 * @param {Object} violationReport - CSP violation report
 */
export const reportCSPViolation = (violationReport) => {
  console.warn('CSP Violation:', violationReport);
  
  // In production, you might want to send this to a monitoring service
  if (import.meta.env.PROD) {
    // Example: Send to monitoring service
    // fetch('/api/csp-violations', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(violationReport)
    // });
  }
};

/**
 * Initialize CSP violation reporting
 */
export const initCSPReporting = () => {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    reportCSPViolation({
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      timestamp: new Date().toISOString()
    });
  });
};

/**
 * Sanitize and validate external resource URLs
 * @param {string} url - URL to validate
 * @param {string} type - Resource type ('script', 'style', 'img', etc.)
 * @returns {string|null} Validated URL or null if invalid
 */
export const validateExternalResource = (url, type) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS for external resources
    if (urlObj.protocol !== 'https:' && urlObj.origin !== window.location.origin) {
      console.warn(`Blocked non-HTTPS external resource: ${url}`);
      return null;
    }
    
    // Check against CSP policy
    const directive = type === 'script' ? 'script-src' : 
                     type === 'style' ? 'style-src' :
                     type === 'img' ? 'img-src' :
                     type === 'font' ? 'font-src' : 'default-src';
    
    if (!isURLAllowedByCSP(url, directive)) {
      console.warn(`URL blocked by CSP policy: ${url}`);
      return null;
    }
    
    return url;
  } catch (error) {
    console.warn(`Invalid URL: ${url}`, error);
    return null;
  }
};

export default {
  generateNonce,
  getCSPNonce,
  createSecureScript,
  createSecureStyle,
  isURLAllowedByCSP,
  reportCSPViolation,
  initCSPReporting,
  validateExternalResource
};
