'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr'; // ✅ CRITICAL FIX: Import mutate for SWR cache invalidation
import { clearDemoAssessmentData } from '../utils/user-stats';
import apiService from '../services/apiService';
import authV2Service from '../services/authV2Service';
import tokenService from '../services/tokenService';
import { shouldUseAuthV2 } from '../config/auth-v2-config';
import { StorageTransaction } from '../utils/storage-transaction'; // ✅ Atomic storage operations
import useTokenRefresh from '../hooks/useTokenRefresh';
import { storageManager } from '../utils/storage-manager';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  displayName?: string; // For Auth V2 compatibility
  photoURL?: string; // For Auth V2 compatibility
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authVersion: 'v1' | 'v2'; // Track which auth version user is using
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  register: (token: string, user: User) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authVersion, setAuthVersion] = useState<'v1' | 'v2'>('v1');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Initialize token refresh hook for Auth V2
  const { startRefreshTimer, stopRefreshTimer } = useTokenRefresh();

  useEffect(() => {
    console.log('AuthContext: useEffect starting, isLoading:', isLoading);

    // Detect auth version and restore session
    const detectedVersion = tokenService.getAuthVersion() as 'v1' | 'v2';
    setAuthVersion(detectedVersion);
    console.log('AuthContext: Detected auth version:', detectedVersion);

    if (detectedVersion === 'v2') {
      // Auth V2: Restore from tokenService
      const idToken = tokenService.getIdToken();
      const savedUser = localStorage.getItem('user');

      console.log('AuthContext V2: idToken exists:', !!idToken);
      console.log('AuthContext V2: savedUser exists:', !!savedUser);

      if (idToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(idToken);
          setUser(parsedUser);

          console.log('AuthContext V2: Restored existing authentication for user:', parsedUser.email);

          // Check if token needs refresh
          if (tokenService.isTokenExpired()) {
            console.log('AuthContext V2: Token expired, will refresh on first API call');
          }
        } catch (error) {
          // Clear invalid data
          tokenService.clearTokens();
          localStorage.removeItem('user');
          console.log('AuthContext V2: Cleared invalid authentication data, error:', error);
        }
      } else {
        console.log('AuthContext V2: No existing authentication found');
      }
    } else {
      // Auth V1: Original logic
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log('AuthContext V1: savedToken exists:', !!savedToken);
      console.log('AuthContext V1: savedUser exists:', !!savedUser);

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);

          // Ensure cookie is set for server-side middleware
          document.cookie = `token=${savedToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
          console.log('AuthContext V1: Restored existing authentication for user:', parsedUser.name);

          // Always try to fetch the latest username from profile to ensure it's up to date
          console.log('AuthContext V1: Triggering username fetch from profile on mount...');
          // ✅ Pass user ID for validation
          fetchUsernameFromProfile(savedToken, parsedUser.id);
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          console.log('AuthContext V1: Cleared invalid authentication data, error:', error);
        }
      } else {
        console.log('AuthContext V1: No existing authentication found, user needs to login');
      }
    }

    console.log('AuthContext: Setting isLoading to false');
    setIsLoading(false);
  }, []);

  // Token refresh timer for Auth V2 users
  useEffect(() => {
    if (authVersion === 'v2' && user && token) {
      console.log('[AuthContext] Starting token refresh timer for Auth V2 user:', user.email);
      startRefreshTimer();

      return () => {
        console.log('[AuthContext] Stopping token refresh timer');
        stopRefreshTimer();
      };
    }
  }, [authVersion, user, token, startRefreshTimer, stopRefreshTimer]);

  // ✅ CRITICAL FIX #5: Cross-Tab Synchronization
  // Listen for storage changes from other tabs to keep auth state synchronized
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle storage events from OTHER tabs (e.oldValue !== null means it's external)
      if (!e.key) return;

      console.log('🔄 AuthContext: Storage change detected from another tab:', e.key);

      // Handle token changes
      if (e.key === 'token' || e.key === 'authV2_idToken') {
        const newToken = e.newValue;
        
        if (!newToken && token) {
          // Token was removed (logout in another tab)
          console.log('⚠️ Token removed in another tab, logging out current session...');
          
          // Clear SWR cache
          mutate(() => true, undefined, { revalidate: false }).catch(console.error);
          
          // Clear state
          setToken(null);
          setUser(null);
          setAuthVersion('v1');
          
          // Redirect to auth page
          router.push('/auth');
        } else if (newToken && newToken !== token) {
          // Token changed (different user logged in another tab)
          console.log('⚠️ Different user logged in another tab, syncing state...');
          
          // Get updated user data
          const savedUser = localStorage.getItem('user');
          const savedAuthVersion = tokenService.getAuthVersion() as 'v1' | 'v2';
          
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              
              // Clear SWR cache to force refresh with new user
              mutate(() => true, undefined, { revalidate: false }).catch(console.error);
              
              // Update state with new user
              setToken(newToken);
              setUser(parsedUser);
              setAuthVersion(savedAuthVersion);
              
              console.log('✅ State synchronized with tab change, new user:', parsedUser.email);
            } catch (error) {
              console.error('❌ Failed to parse user data from storage:', error);
              // On error, logout to prevent inconsistent state
              setToken(null);
              setUser(null);
              router.push('/auth');
            }
          }
        }
      }

      // Handle user data changes
      if (e.key === 'user') {
        const newUserData = e.newValue;
        
        if (!newUserData && user) {
          // User was removed (logout in another tab)
          console.log('⚠️ User data removed in another tab, logging out...');
          setUser(null);
          setToken(null);
          router.push('/auth');
        } else if (newUserData) {
          try {
            const parsedUser = JSON.parse(newUserData);
            if (parsedUser.id !== user?.id) {
              // Different user logged in another tab
              console.log('⚠️ Different user detected in another tab:', parsedUser.email);
              
              // Clear SWR cache
              mutate(() => true, undefined, { revalidate: false }).catch(console.error);
              
              // Update user state
              setUser(parsedUser);
              
              console.log('✅ User state synchronized with tab change');
            }
          } catch (error) {
            console.error('❌ Failed to parse user data:', error);
          }
        }
      }
    };

    // ✅ Register storage event listener for cross-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      console.log('✅ AuthContext: Cross-tab synchronization enabled');
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        console.log('AuthContext: Cross-tab synchronization disabled');
      }
    };
  }, [token, user, router]);

  // PERFORMANCE FIX: Wrap functions dengan useCallback untuk stable references
  const updateUser = useCallback(async (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) {
        console.log('AuthContext: Cannot update user - no user currently logged in');
        return prevUser;
      }

      console.log('AuthContext: Updating user data with:', userData);
      const updatedUser = { ...prevUser, ...userData };
      
      // ✅ ATOMIC FIX: Use transaction for safe user update
      const transaction = new StorageTransaction();
      transaction.add('user', JSON.stringify(updatedUser));
      
      transaction.commit()
        .then(() => {
          console.log('✅ AuthContext: User data successfully updated:', updatedUser);
        })
        .catch((error) => {
          console.error('❌ AuthContext: Failed to update user in storage:', error);
        })
        .finally(() => {
          transaction.clear();
        });

      return updatedUser;
    });
  }, []);

  // ✅ CRITICAL FIX #2: Fetch username from profile with user ID validation
  // This prevents race condition where profile data from previous user overwrites current user
  const fetchUsernameFromProfile = useCallback(async (authToken: string, expectedUserId: string) => {
    try {
      console.log('AuthContext: Fetching username from profile for user:', expectedUserId);
      const profileData = await apiService.getProfile();
      console.log('AuthContext: Profile data received:', profileData);

      if (profileData && profileData.success && profileData.data?.user) {
        const profileUser = profileData.data.user;

        // ✅ CRITICAL VALIDATION: Ensure profile data matches expected user
        // This prevents race condition where profile from User A overwrites User B
        if (profileUser.id !== expectedUserId) {
          console.warn('⚠️ AuthContext: Profile data mismatch! Discarding outdated data.', {
            expected: expectedUserId,
            received: profileUser.id
          });
          return; // Discard profile data from wrong user
        }

        const updates: Partial<User> = {};

        // Update username if available
        if (profileUser.username) {
          updates.username = profileUser.username;
          console.log('AuthContext: Username fetched from profile:', profileUser.username);
        }

        // Also update other user data if available
        if (profileUser.email) {
          updates.email = profileUser.email;
        }

        // Update name from profile full_name if available
        if (profileData.data.profile?.full_name) {
          updates.name = profileData.data.profile.full_name;
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          console.log('✅ AuthContext: Updating user with validated profile data:', updates);
          updateUser(updates);
        } else {
          console.log('AuthContext: No new data to update from profile');
        }
      } else {
        console.log('AuthContext: No user data found in profile response or profile fetch failed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to fetch username from profile:', error);
      // Don't throw error, just log it - this is optional enhancement
    }
  }, [updateUser]);

  const login = useCallback(async (newToken: string, newUser: User) => {
    console.log('AuthContext: User logging in:', newUser.email);

    // ✅ CRITICAL FIX #4: Clear SWR cache BEFORE setting new user
    // This prevents cached data from previous user being displayed
    try {
      console.log('🧹 AuthContext: Clearing SWR cache before login...');
      await mutate(
        () => true,
        undefined,
        { revalidate: false }
      );
      console.log('✅ AuthContext: SWR cache cleared successfully');
    } catch (error) {
      console.error('⚠️ AuthContext: Failed to clear SWR cache:', error);
    }

    // Clear any existing demo data to ensure clean user statistics
    clearDemoAssessmentData();

    // ✅ Store user identifier for validation
    const currentUserId = newUser.id;

    // ✅ CRITICAL FIX: Set state FIRST before any async operations
    // This ensures the user is set immediately to prevent race conditions
    setToken(newToken);
    setUser(newUser);

    // ✅ Atomic localStorage update untuk prevent race conditions
    // Note: tokenService.storeTokens already synced token to all keys
    await storageManager.setMultiple({
      'token': newToken,
      'user': newUser
    });

    // Set cookie for server-side middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

    console.log('AuthContext: Login successful, user state updated');

    // ✅ FIXED: Fetch profile in background WITH user ID validation
    // This prevents race conditions and ensures faster login experience
    fetchUsernameFromProfile(newToken, currentUserId).catch(error => {
      console.warn('AuthContext: Failed to fetch profile (non-blocking):', error);
    });

    console.log('AuthContext: Redirecting to dashboard...');

    // Redirect to dashboard after login
    router.push('/dashboard');
  }, [router, fetchUsernameFromProfile]);

  const register = useCallback(async (newToken: string, newUser: User) => {
    console.log('AuthContext: User registering:', newUser.email);

    // Clear any existing demo data to ensure clean user statistics
    clearDemoAssessmentData();

    // ✅ Store user identifier for validation
    const currentUserId = newUser.id;

    setToken(newToken);
    setUser(newUser);

    // ✅ Atomic localStorage update untuk prevent race conditions
    await storageManager.setMultiple({
      'token': newToken,
      'user': newUser
    });

    // Set cookie for server-side middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

    console.log('AuthContext: Registration successful, fetching username from profile...');

    // ✅ Fetch username from profile WITH user ID validation
    await fetchUsernameFromProfile(newToken, currentUserId);

    console.log('AuthContext: Profile data fetched, redirecting to dashboard...');

    // Redirect to dashboard after registration
    router.push('/dashboard');
  }, [router, fetchUsernameFromProfile]);

  const logout = useCallback(async () => {
    console.log('AuthContext: Logout initiated, auth version:', authVersion);

    // ✅ CRITICAL FIX #1: Clear ALL SWR cache FIRST before logout
    // This ensures no cached data from previous user persists
    try {
      console.log('🧹 AuthContext: Clearing SWR cache for all user data...');
      
      // Method 1: Clear all cache globally (most thorough)
      await mutate(
        () => true, // Match all keys
        undefined, // Set to undefined (delete cache)
        { revalidate: false } // Don't revalidate immediately
      );

      // Method 2: Explicitly clear user-specific caches if user exists
      if (user?.id) {
        await Promise.all([
          mutate(`assessment-history-${user.id}`, undefined, { revalidate: false }),
          mutate(`user-stats-${user.id}`, undefined, { revalidate: false }),
          mutate(`latest-result-${user.id}`, undefined, { revalidate: false }),
          mutate('/api/profile', undefined, { revalidate: false }),
          mutate('/api/token-balance', undefined, { revalidate: false }),
        ]);
      }

      console.log('✅ AuthContext: SWR cache cleared successfully');
    } catch (error) {
      console.error('⚠️ AuthContext: Failed to clear SWR cache:', error);
      // Continue with logout even if cache clear fails
    }

    // ✅ CRITICAL FIX: Clear ALL tokens and user data regardless of auth version
    // This ensures complete cleanup and prevents wrong account login

    if (authVersion === 'v2') {
      // Auth V2: Revoke refresh tokens via API
      try {
        await authV2Service.logout();
        console.log('AuthContext V2: Logout API call successful');
      } catch (error) {
        console.error('AuthContext V2: Logout API call failed (continuing anyway):', error);
      }
    }

    // ✅ FIXED: Use tokenService.clearTokens() which now clears ALL keys
    tokenService.clearTokens();

    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    // Clear state
    setToken(null);
    setUser(null);
    setAuthVersion('v1'); // Reset to v1

    // ✅ CRITICAL FIX: Disconnect WebSocket on logout
    try {
      const { getWebSocketService } = await import('../services/websocket-service');
      const wsService = getWebSocketService();
      wsService.disconnect();
      console.log('AuthContext: WebSocket disconnected');
    } catch (error) {
      console.warn('AuthContext: Failed to disconnect WebSocket:', error);
    }

    // ✅ CRITICAL FIX: Clear apiService caches to prevent stale data
    try {
      const { apiService } = await import('../services/apiService');
      // Clear in-memory cache
      if ((apiService as any)._cache) {
        (apiService as any)._cache.clear();
        console.log('AuthContext: apiService memory cache cleared');
      }
      // Clear in-flight requests
      if ((apiService as any)._inflight) {
        (apiService as any)._inflight.clear();
        console.log('AuthContext: apiService in-flight requests cleared');
      }
    } catch (error) {
      console.warn('AuthContext: Failed to clear apiService caches:', error);
    }

    // ✅ Clear localStorage token balance cache (user-specific and legacy)
    if (user?.id) {
      localStorage.removeItem(`tokenBalanceCache_${user.id}`);
    }
    localStorage.removeItem('tokenBalanceCache');
    console.log('AuthContext: Token balance caches cleared');

    console.log('✅ AuthContext: Logout complete, all data cleared, redirecting to auth page');

    // Redirect to login page
    router.push('/auth');
  }, [authVersion, user, router]);

  // PERFORMANCE FIX: Memoize context value untuk prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    authVersion,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    isAuthenticated: !!token
  }), [user, token, authVersion, isLoading, login, logout, register, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
