// Security utilities for Phase 2 Implementation
// CSRF Protection, Secure Cookies, Rate Limiting

// CSRF Protection
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token';
  private static readonly HEADER_NAME = 'X-CSRF-Token';

  // Generate CSRF token
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get current CSRF token
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Set CSRF token
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  // Generate and set new token
  static generateAndSetToken(): string {
    const token = this.generateToken();
    this.setToken(token);
    return token;
  }

  // Validate CSRF token
  static validateToken(receivedToken: string): boolean {
    const currentToken = this.getToken();
    return currentToken !== null && currentToken === receivedToken;
  }

  // Add CSRF token to headers
  static addToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[this.HEADER_NAME] = token;
    }
    return headers;
  }

  // Clear CSRF token
  static clearToken(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}

// Rate Limiting
export class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  // Get or create rate limiter instance
  static getInstance(key: string, maxRequests?: number, windowMs?: number): RateLimiter {
    if (!this.instances.has(key)) {
      this.instances.set(key, new RateLimiter(maxRequests, windowMs));
    }
    return this.instances.get(key)!;
  }

  // Check if request is allowed
  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );

    // Check if under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  // Get remaining requests
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  // Get reset time
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs;
  }

  // Reset rate limiter
  reset(): void {
    this.requests = [];
  }
}

// Secure Cookie Management
export class SecureCookieManager {
  // Set secure cookie
  static setSecureCookie(
    name: string, 
    value: string, 
    options: {
      expires?: Date;
      maxAge?: number;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    } = {}
  ): void {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
    
    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`;
    }
    
    if (options.secure !== false) {
      cookieString += '; secure';
    }
    
    if (options.httpOnly) {
      cookieString += '; httponly';
    }
    
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }
    
    // Always add SameSite by default for security
    if (!options.sameSite) {
      cookieString += '; samesite=strict';
    }

    document.cookie = cookieString;
  }

  // Get cookie value
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    
    return null;
  }

  // Delete cookie
  static deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    
    this.setSecureCookie(name, '', {
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
      maxAge: -1
    });
  }

  // Check if cookie exists
  static hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }
}

// Content Security Policy (CSP) Generator
export class CSPGenerator {
  static generateCSP(): string {
    const directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Adjust based on needs
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'connect-src': ["'self'", "https://api.futureguide.id"],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    return Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }
}

// Security Headers Utility
export class SecurityHeaders {
  static getHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': CSPGenerator.generateCSP(),
      
      // XSS Protection
      'X-XSS-Protection': '1; mode=block',
      
      // Content Type Options
      'X-Content-Type-Options': 'nosniff',
      
      // Frame Options
      'X-Frame-Options': 'DENY',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      
      // Strict Transport Security (only in production with HTTPS)
      ...(process.env.NODE_ENV === 'production' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      })
    };
  }
}

// Input Sanitization
export class InputSanitizer {
  // Sanitize HTML input
  static sanitizeHTML(input: string): string {
    if (typeof window === 'undefined') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Sanitize string input
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .substring(0, 1000); // Limit length
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Security Event Logger
export class SecurityLogger {
  private static logEvent(event: string, details: any): void {
    if (typeof window === 'undefined') return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.warn('Security Event:', logEntry);
      // TODO: Send to security monitoring service
    } else {
      console.log('Security Event (Dev):', logEntry);
    }
  }

  static logCSRFViolation(details: any): void {
    this.logEvent('CSRF_VIOLATION', details);
  }

  static logRateLimitExceeded(details: any): void {
    this.logEvent('RATE_LIMIT_EXCEEDED', details);
  }

  static logSuspiciousActivity(details: any): void {
    this.logEvent('SUSPICIOUS_ACTIVITY', details);
  }
}

// All classes are already exported above