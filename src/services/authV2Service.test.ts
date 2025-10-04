/**
 * @jest-environment jsdom
 */

// Mock tokenService FIRST before importing
const mockTokenService = {
  storeTokens: jest.fn(),
  clearTokens: jest.fn(),
  getIdToken: jest.fn(),
  refreshAuthToken: jest.fn(),
};

jest.mock('../mockTokenService.js', () => ({
  __esModule: true,
  default: mockTokenService,
}));

// Use require for JS modules AFTER mocking
const authV2Service = require('../authV2Service.js').default;

// Mock fetch globally
global.fetch = jest.fn();

describe('authV2Service', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            uid: 'test-uid',
            email: 'test@example.com',
            displayName: 'Test User',
          },
          idToken: 'test-id-token',
          refreshToken: 'test-refresh-token',
          expiresIn: 3600,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authV2Service.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      expect(mockTokenService.storeTokens).toHaveBeenCalledWith({
        idToken: 'test-id-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        uid: 'test-uid',
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error with Firebase error code', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'auth/wrong-password',
          message: 'Invalid credentials',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => mockError,
      } as Response);

      await expect(
        authV2Service.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        authV2Service.login('test@example.com', 'password123')
      ).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should register user successfully with email/password', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            uid: 'new-uid',
            email: 'newuser@example.com',
            displayName: null,
          },
          idToken: 'new-id-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authV2Service.register(
        'newuser@example.com',
        'password123'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
          }),
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should register with optional displayName (username mapping)', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            uid: 'new-uid',
            email: 'newuser@example.com',
            displayName: 'NewUsername',
          },
          idToken: 'new-id-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await authV2Service.register(
        'newuser@example.com',
        'password123',
        'NewUsername'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/register'),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
            displayName: 'NewUsername',
          }),
        })
      );
    });

    it('should throw error for duplicate email', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'auth/email-already-in-use',
          message: 'Email sudah terdaftar',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockError,
      } as Response);

      await expect(
        authV2Service.register('existing@example.com', 'password123')
      ).rejects.toThrow('Email sudah terdaftar');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          idToken: 'refreshed-id-token',
          refreshToken: 'refreshed-refresh-token',
          expiresIn: 3600,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authV2Service.refreshToken('old-refresh-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            refreshToken: 'old-refresh-token',
          }),
        })
      );

      expect(mockTokenService.storeTokens).toHaveBeenCalled();
      expect(result.idToken).toBe('refreshed-id-token');
    });

    it('should clear tokens on invalid refresh token', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'auth/invalid-refresh-token',
          message: 'Token refresh tidak valid',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => mockError,
      } as Response);

      await expect(
        authV2Service.refreshToken('invalid-token')
      ).rejects.toThrow();

      expect(mockTokenService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Email reset password telah dikirim',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await authV2Service.forgotPassword('test@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should handle user not found error', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'auth/user-not-found',
          message: 'Email tidak ditemukan',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => mockError,
      } as Response);

      await expect(
        authV2Service.forgotPassword('nonexistent@example.com')
      ).rejects.toThrow('Email tidak ditemukan');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with oobCode', async () => {
      const mockResponse = {
        success: true,
        message: 'Password berhasil direset',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await authV2Service.resetPassword('valid-oob-code', 'newPassword123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            oobCode: 'valid-oob-code',
            newPassword: 'newPassword123',
          }),
        })
      );
    });

    it('should handle expired reset code', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'auth/expired-action-code',
          message: 'Kode reset sudah kadaluarsa',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockError,
      } as Response);

      await expect(
        authV2Service.resetPassword('expired-code', 'newPassword123')
      ).rejects.toThrow('Kode reset sudah kadaluarsa');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear tokens', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue('valid-token');

      const mockResponse = {
        success: true,
        message: 'Logout berhasil',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await authV2Service.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );

      expect(mockTokenService.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if API call fails', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue('valid-token');

      mockFetch.mockRejectedValue(new Error('Network error'));

      await authV2Service.logout();

      expect(mockTokenService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update displayName successfully', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue('valid-token');

      const mockResponse = {
        success: true,
        data: {
          uid: 'test-uid',
          displayName: 'Updated Name',
          photoURL: null,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authV2Service.updateProfile({
        displayName: 'Updated Name',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/profile'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
          body: JSON.stringify({
            displayName: 'Updated Name',
          }),
        })
      );

      expect(result.displayName).toBe('Updated Name');
    });

    it('should update photoURL successfully', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue('valid-token');

      const mockResponse = {
        success: true,
        data: {
          uid: 'test-uid',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await authV2Service.updateProfile({
        photoURL: 'https://example.com/photo.jpg',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/profile'),
        expect.objectContaining({
          body: JSON.stringify({
            photoURL: 'https://example.com/photo.jpg',
          }),
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue(null);

      await expect(
        authV2Service.updateProfile({ displayName: 'Test' })
      ).rejects.toThrow('No authentication token available');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully with password', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue('valid-token');

      const mockResponse = {
        success: true,
        message: 'Akun berhasil dihapus',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await authV2Service.deleteAccount('correctPassword123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/v2/delete'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
          body: JSON.stringify({
            password: 'correctPassword123',
          }),
        })
      );

      expect(mockTokenService.clearTokens).toHaveBeenCalled();
    });

    it('should throw error for wrong password', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue('valid-token');

      const mockError = {
        success: false,
        error: {
          code: 'auth/wrong-password',
          message: 'Password salah',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => mockError,
      } as Response);

      await expect(
        authV2Service.deleteAccount('wrongPassword')
      ).rejects.toThrow('Password salah');

      expect(mockTokenService.clearTokens).not.toHaveBeenCalled();
    });

    it('should require authentication token', async () => {
      (mockTokenService.getIdToken as jest.Mock).mockReturnValue(null);

      await expect(
        authV2Service.deleteAccount('password123')
      ).rejects.toThrow('No authentication token available');
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(
        authV2Service.login('test@example.com', 'password123')
      ).rejects.toThrow('Timeout');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(
        authV2Service.login('test@example.com', 'password123')
      ).rejects.toThrow();
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { message: 'Internal server error' },
        }),
      } as Response);

      await expect(
        authV2Service.login('test@example.com', 'password123')
      ).rejects.toThrow();
    });
  });
});
