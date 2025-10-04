/**
 * @jest-environment jsdom
 */

// Import the actual implementation, not the mock
jest.unmock('../tokenService');

// @ts-ignore - JS module in TS test
const tokenService = require('../tokenService.js').default;

describe('tokenService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('storeTokens', () => {
    it('should store all token data in localStorage', () => {
      const tokenData = {
        idToken: 'test-id-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        uid: 'test-uid',
        email: 'test@example.com',
      };

      tokenService.storeTokens(tokenData);

      expect(localStorage.getItem('idToken')).toBe('test-id-token');
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
      expect(localStorage.getItem('uid')).toBe('test-uid');
      expect(localStorage.getItem('email')).toBe('test@example.com');
      expect(localStorage.getItem('tokenExpiry')).toBeTruthy();
    });

    it('should calculate correct expiry time', () => {
      const now = Date.now();
      const tokenData = {
        idToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresIn: 3600, // 1 hour
        uid: 'test-uid',
        email: 'test@example.com',
      };

      tokenService.storeTokens(tokenData);

      const storedExpiry = parseInt(localStorage.getItem('tokenExpiry') || '0');
      const expectedExpiry = now + 3600 * 1000;
      
      // Allow 1 second tolerance
      expect(storedExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(storedExpiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('getIdToken', () => {
    it('should return stored ID token', () => {
      localStorage.setItem('idToken', 'stored-id-token');
      
      const token = tokenService.getIdToken();
      
      expect(token).toBe('stored-id-token');
    });

    it('should return null when no token exists', () => {
      const token = tokenService.getIdToken();
      
      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return stored refresh token', () => {
      localStorage.setItem('refreshToken', 'stored-refresh-token');
      
      const token = tokenService.getRefreshToken();
      
      expect(token).toBe('stored-refresh-token');
    });

    it('should return null when no refresh token exists', () => {
      const token = tokenService.getRefreshToken();
      
      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const futureExpiry = Date.now() + 3600 * 1000; // 1 hour from now
      localStorage.setItem('tokenExpiry', futureExpiry.toString());
      
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastExpiry = Date.now() - 1000; // 1 second ago
      localStorage.setItem('tokenExpiry', pastExpiry.toString());
      
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(true);
    });

    it('should return true when no expiry time exists', () => {
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(true);
    });

    it('should consider 5-minute buffer before expiry', () => {
      // Token expires in 4 minutes (less than 5-minute buffer)
      const nearExpiry = Date.now() + 4 * 60 * 1000;
      localStorage.setItem('tokenExpiry', nearExpiry.toString());
      
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(true);
    });
  });

  describe('getAuthVersion', () => {
    it('should return v2 when Firebase tokens exist', () => {
      localStorage.setItem('idToken', 'firebase-token');
      localStorage.setItem('uid', 'firebase-uid');
      
      const version = tokenService.getAuthVersion();
      
      expect(version).toBe('v2');
    });

    it('should return v1 when JWT token exists', () => {
      localStorage.setItem('token', 'jwt-token');
      
      const version = tokenService.getAuthVersion();
      
      expect(version).toBe('v1');
    });

    it('should return v1 when no tokens exist (default)', () => {
      const version = tokenService.getAuthVersion();
      
      expect(version).toBe('v1');
    });

    it('should prioritize v2 over v1 when both exist', () => {
      localStorage.setItem('idToken', 'firebase-token');
      localStorage.setItem('uid', 'firebase-uid');
      localStorage.setItem('token', 'jwt-token');
      
      const version = tokenService.getAuthVersion();
      
      expect(version).toBe('v2');
    });
  });

  describe('getTokenStatus', () => {
    it('should return correct status for valid tokens', () => {
      const futureExpiry = Date.now() + 3600 * 1000;
      localStorage.setItem('idToken', 'test-token');
      localStorage.setItem('tokenExpiry', futureExpiry.toString());
      
      const status = tokenService.getTokenStatus();
      
      expect(status.hasTokens).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.needsRefresh).toBe(false);
    });

    it('should detect when token needs refresh (within 10 minutes)', () => {
      const nearExpiry = Date.now() + 8 * 60 * 1000; // 8 minutes
      localStorage.setItem('idToken', 'test-token');
      localStorage.setItem('tokenExpiry', nearExpiry.toString());
      
      const status = tokenService.getTokenStatus();
      
      expect(status.hasTokens).toBe(true);
      expect(status.needsRefresh).toBe(true);
    });

    it('should return no tokens when localStorage is empty', () => {
      const status = tokenService.getTokenStatus();
      
      expect(status.hasTokens).toBe(false);
      expect(status.isExpired).toBe(true);
    });
  });

  describe('clearTokens', () => {
    it('should remove all Firebase token data', () => {
      localStorage.setItem('idToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('uid', 'test-uid');
      localStorage.setItem('email', 'test@example.com');
      localStorage.setItem('tokenExpiry', '123456789');
      
      tokenService.clearTokens();
      
      expect(localStorage.getItem('idToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('uid')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
      expect(localStorage.getItem('tokenExpiry')).toBeNull();
    });

    it('should not affect other localStorage items', () => {
      localStorage.setItem('idToken', 'test-token');
      localStorage.setItem('otherData', 'should-remain');
      
      tokenService.clearTokens();
      
      expect(localStorage.getItem('idToken')).toBeNull();
      expect(localStorage.getItem('otherData')).toBe('should-remain');
    });
  });

  describe('refreshAuthToken', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should refresh token successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          idToken: 'new-id-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      localStorage.setItem('refreshToken', 'old-refresh-token');

      const newToken = await tokenService.refreshAuthToken();

      expect(newToken).toBe('new-id-token');
      expect(localStorage.getItem('idToken')).toBe('new-id-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    });

    it('should throw error when no refresh token exists', async () => {
      await expect(tokenService.refreshAuthToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('should throw error when refresh fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Refresh failed' }),
      } as Response);

      localStorage.setItem('refreshToken', 'invalid-refresh-token');

      await expect(tokenService.refreshAuthToken()).rejects.toThrow();
    });

    it('should clear tokens on refresh failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid refresh token' }),
      } as Response);

      localStorage.setItem('refreshToken', 'invalid-token');
      localStorage.setItem('idToken', 'old-token');

      try {
        await tokenService.refreshAuthToken();
      } catch (error) {
        // Expected to throw
      }

      expect(localStorage.getItem('idToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted tokenExpiry value', () => {
      localStorage.setItem('tokenExpiry', 'invalid-number');
      
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(true);
    });

    it('should handle very large expiry values', () => {
      const veryFarFuture = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
      localStorage.setItem('tokenExpiry', veryFarFuture.toString());
      
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(false);
    });

    it('should handle negative expiry values', () => {
      localStorage.setItem('tokenExpiry', '-1000');
      
      const isExpired = tokenService.isTokenExpired();
      
      expect(isExpired).toBe(true);
    });

    it('should handle empty string tokens', () => {
      localStorage.setItem('idToken', '');
      
      const token = tokenService.getIdToken();
      
      expect(token).toBe('');
    });
  });
});
