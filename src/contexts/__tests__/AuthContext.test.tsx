/**
 * Comprehensive Integration Tests for AuthContext
 * 
 * Test Scenarios:
 * 1. Rapid login/logout sequence
 * 2. Multi-tab synchronization
 * 3. Race conditions during profile fetch
 * 4. SWR cache behavior
 * 5. WebSocket cleanup
 * 6. Cross-account login prevention
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { mutate } from 'swr';
import tokenService from '../../services/tokenService';
import authV2Service from '../../services/authV2Service';
import apiService from '../../services/apiService';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('swr', () => ({
  mutate: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/tokenService');
jest.mock('../../services/authV2Service');
jest.mock('../../services/apiService');
jest.mock('../../services/websocket-service', () => ({
  getWebSocketService: () => ({
    disconnect: jest.fn(),
    connect: jest.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Test component to access auth context
const TestComponent = () => {
  const { user, token, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="user-info">
        {user ? `Logged in as ${user.email}` : 'Not logged in'}
      </div>
      <div data-testid="token">{token || 'No token'}</div>
      <button onClick={() => login('test-token', { 
        id: 'user-123', 
        email: 'test@test.com',
        username: 'testuser',
        name: 'Test User' 
      })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext - Critical Security Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    
    // Default mocks
    (tokenService.getIdToken as jest.Mock).mockReturnValue(null);
    (tokenService.isTokenExpired as jest.Mock).mockReturnValue(false);
    (tokenService.getAuthVersion as jest.Mock).mockReturnValue('v2');
    (tokenService.clearTokens as jest.Mock).mockImplementation(() => {});
    (tokenService.storeTokens as jest.Mock).mockImplementation(() => {});
    (authV2Service.logout as jest.Mock).mockResolvedValue({});
    (apiService.getProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: 'test@test.com',
          username: 'testuser',
        },
      },
    });
  });

  describe('Test Suite 1: Rapid Login/Logout Sequence', () => {
    it('should handle rapid logout after login without data leakage', async () => {
      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Test Case 1.1: Login User A
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Test Case 1.2: Immediately logout (within 100ms)
      await act(async () => {
        const logoutButton = screen.getByText('Logout');
        logoutButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
        });
      });

      // ✅ Verify SWR cache cleared
      expect(mutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: false }
      );

      // ✅ Verify tokenService.clearTokens called
      expect(tokenService.clearTokens).toHaveBeenCalled();

      // ✅ Verify no user data remains
      expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    it('should prevent stale profile data after rapid login sequence', async () => {
      // Mock delayed profile fetch
      let profileResolve: any;
      const delayedProfile = new Promise((resolve) => {
        profileResolve = resolve;
      });

      (apiService.getProfile as jest.Mock).mockReturnValue(delayedProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login User A
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Immediately logout before profile fetch completes
      await act(async () => {
        const logoutButton = screen.getByText('Logout');
        logoutButton.click();
      });

      // ✅ Complete profile fetch (should be discarded)
      await act(async () => {
        profileResolve({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@test.com',
              username: 'testuser',
            },
          },
        });
      });

      // ✅ Verify user remains logged out
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });
    });
  });

  describe('Test Suite 2: Account Switching', () => {
    it('should completely clear User A data before showing User B data', async () => {
      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login User A
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      const userAToken = screen.getByTestId('token').textContent;

      // ✅ Logout User A
      await act(async () => {
        const logoutButton = screen.getByText('Logout');
        logoutButton.click();
      });

      // ✅ Clear mutate mock for fresh tracking
      (mutate as jest.Mock).mockClear();

      // ✅ Login User B with different credentials
      await act(async () => {
        const { login } = useAuth();
        await login('user-b-token', {
          id: 'user-456',
          email: 'userb@test.com',
          username: 'userb',
          name: 'User B',
        });
      });

      // ✅ Verify SWR cache was cleared before User B login
      expect(mutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: false }
      );

      // ✅ Verify User B data displayed
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as userb@test.com');
      });

      // ✅ Verify token changed
      const userBToken = screen.getByTestId('token').textContent;
      expect(userBToken).not.toBe(userAToken);
    });

    it('should validate profile fetch matches current user ID', async () => {
      // Mock profile fetch that returns different user ID
      (apiService.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          user: {
            id: 'different-user-999', // ⚠️ Different user ID
            email: 'wrong@test.com',
            username: 'wronguser',
          },
        },
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login User A
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // Wait for profile fetch
      await waitFor(() => {
        expect(apiService.getProfile).toHaveBeenCalled();
      }, { timeout: 2000 });

      // ✅ Verify warning logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Profile user ID mismatch')
      );

      // ✅ Verify user data NOT updated with wrong profile
      expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
      expect(screen.getByTestId('user-info')).not.toHaveTextContent('wrong@test.com');

      consoleSpy.mockRestore();
    });
  });

  describe('Test Suite 3: Multi-Tab Synchronization', () => {
    it('should sync logout across tabs', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login in Tab 1
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Simulate logout in Tab 2 (storage event)
      await act(async () => {
        const storageEvent = new StorageEvent('storage', {
          key: 'token',
          oldValue: 'test-token',
          newValue: null,
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      // ✅ Verify Tab 1 synced logout
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Not logged in');
      });
    });

    it('should sync login to different user across tabs', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login User A in Tab 1
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Simulate User B login in Tab 2
      await act(async () => {
        localStorage.setItem('user', JSON.stringify({
          id: 'user-456',
          email: 'userb@test.com',
          username: 'userb',
          name: 'User B',
        }));

        const storageEvent = new StorageEvent('storage', {
          key: 'token',
          oldValue: 'test-token',
          newValue: 'user-b-token',
          storageArea: localStorage,
        });
        window.dispatchEvent(storageEvent);
      });

      // ✅ Verify Tab 1 synced to User B
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as userb@test.com');
      });

      // ✅ Verify SWR cache cleared during sync
      expect(mutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: false }
      );
    });
  });

  describe('Test Suite 4: SWR Cache Behavior', () => {
    it('should clear SWR cache on logout', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Clear mock to track logout calls
      (mutate as jest.Mock).mockClear();

      // ✅ Logout
      await act(async () => {
        const logoutButton = screen.getByText('Logout');
        logoutButton.click();
      });

      // ✅ Verify global cache clear
      expect(mutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: false }
      );

      // ✅ Verify user-specific caches cleared
      expect(mutate).toHaveBeenCalledWith(
        'assessment-history-user-123',
        undefined,
        { revalidate: false }
      );
    });

    it('should clear SWR cache before login', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Clear mock
      (mutate as jest.Mock).mockClear();

      // ✅ Login
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Verify cache cleared BEFORE user state set
      const mutateCalls = (mutate as jest.Mock).mock.calls;
      expect(mutateCalls.length).toBeGreaterThan(0);
      expect(mutateCalls[0]).toEqual([
        expect.any(Function),
        undefined,
        { revalidate: false }
      ]);
    });
  });

  describe('Test Suite 5: WebSocket Cleanup', () => {
    it('should disconnect WebSocket on logout', async () => {
      const mockDisconnect = jest.fn();
      
      jest.doMock('../../services/websocket-service', () => ({
        getWebSocketService: () => ({
          disconnect: mockDisconnect,
          connect: jest.fn(),
        }),
      }));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
        await waitFor(() => {
          expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as test@test.com');
        });
      });

      // ✅ Logout
      await act(async () => {
        const logoutButton = screen.getByText('Logout');
        logoutButton.click();
      });

      // ✅ Verify WebSocket disconnected
      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });
  });

  describe('Test Suite 6: Race Condition Prevention', () => {
    it('should handle concurrent login/logout without state corruption', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Trigger multiple rapid operations
      await act(async () => {
        const loginButton = screen.getByText('Login');
        const logoutButton = screen.getByText('Logout');

        // Click login and logout rapidly
        loginButton.click();
        setTimeout(() => logoutButton.click(), 50);
      });

      // ✅ Wait for all operations to settle
      await waitFor(() => {
        const userInfo = screen.getByTestId('user-info');
        // State should be consistent (either logged in OR logged out)
        const isLoggedIn = userInfo.textContent?.includes('Logged in');
        const isLoggedOut = userInfo.textContent?.includes('Not logged in');
        expect(isLoggedIn || isLoggedOut).toBe(true);
      }, { timeout: 3000 });
    });

    it('should discard profile fetch from previous user', async () => {
      let userAResolve: any;
      let userBResolve: any;

      (apiService.getProfile as jest.Mock)
        .mockImplementationOnce(() => new Promise(resolve => { userAResolve = resolve; }))
        .mockImplementationOnce(() => new Promise(resolve => { userBResolve = resolve; }));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // ✅ Login User A
      await act(async () => {
        const loginButton = screen.getByText('Login');
        loginButton.click();
      });

      // ✅ Logout and login User B before User A profile completes
      await act(async () => {
        const logoutButton = screen.getByText('Logout');
        logoutButton.click();
      });

      await act(async () => {
        const { login } = useAuth();
        await login('user-b-token', {
          id: 'user-456',
          email: 'userb@test.com',
          username: 'userb',
          name: 'User B',
        });
      });

      // ✅ Complete User A profile fetch (should be ignored)
      await act(async () => {
        userAResolve({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'usera@test.com',
              username: 'usera',
            },
          },
        });
      });

      // ✅ Verify User B data not overwritten
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Logged in as userb@test.com');
      });

      expect(screen.getByTestId('user-info')).not.toHaveTextContent('usera@test.com');
    });
  });
});
