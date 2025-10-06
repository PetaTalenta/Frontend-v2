'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearDemoAssessmentData } from '../utils/user-stats';
import apiService from '../services/apiService';
import authV2Service from '../services/authV2Service';
import tokenService from '../services/tokenService';
import { shouldUseAuthV2 } from '../config/auth-v2-config';
import useTokenRefresh from '../hooks/useTokenRefresh';

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
          fetchUsernameFromProfile(savedToken);
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

  // PERFORMANCE FIX: Wrap functions dengan useCallback untuk stable references
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) {
        console.log('AuthContext: Cannot update user - no user currently logged in');
        return prevUser;
      }

      console.log('AuthContext: Updating user data with:', userData);
      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('AuthContext: User data successfully updated:', updatedUser);

      return updatedUser;
    });
  }, []);

  // Fetch username from profile if not available
  const fetchUsernameFromProfile = useCallback(async (authToken: string) => {
    try {
      console.log('AuthContext: Fetching username from profile...');
      const profileData = await apiService.getProfile();
      console.log('AuthContext: Profile data received:', profileData);

      if (profileData && profileData.success && profileData.data?.user) {
        const profileUser = profileData.data.user;
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
          console.log('AuthContext: Updating user with profile data:', updates);
          updateUser(updates);
        } else {
          console.log('AuthContext: No new data to update from profile');
        }
      } else {
        console.log('AuthContext: No user data found in profile response or profile fetch failed');
      }
    } catch (error) {
      console.error('AuthContext: Failed to fetch username from profile:', error);
      // Don't throw error, just log it - this is optional enhancement
    }
  }, [updateUser]);

  const login = useCallback(async (newToken: string, newUser: User) => {
    console.log('AuthContext: User logging in:', newUser.email);

    // Clear any existing demo data to ensure clean user statistics
    clearDemoAssessmentData();

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Set cookie for server-side middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

    console.log('AuthContext: Login successful, fetching username from profile...');

    // Fetch username from profile to ensure we have the latest data
    await fetchUsernameFromProfile(newToken);

    console.log('AuthContext: Profile data fetched, redirecting to dashboard...');

    // Redirect to dashboard after login
    router.push('/dashboard');
  }, [router, fetchUsernameFromProfile]);

  const register = useCallback(async (newToken: string, newUser: User) => {
    console.log('AuthContext: User registering:', newUser.email);

    // Clear any existing demo data to ensure clean user statistics
    clearDemoAssessmentData();

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Set cookie for server-side middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

    console.log('AuthContext: Registration successful, fetching username from profile...');

    // Fetch username from profile to ensure we have the latest data
    await fetchUsernameFromProfile(newToken);

    console.log('AuthContext: Profile data fetched, redirecting to dashboard...');

    // Redirect to dashboard after registration
    router.push('/dashboard');
  }, [router, fetchUsernameFromProfile]);

  const logout = useCallback(async () => {
    console.log('AuthContext: Logout initiated, auth version:', authVersion);

    if (authVersion === 'v2') {
      // Auth V2: Revoke refresh tokens via API
      try {
        await authV2Service.logout();
        console.log('AuthContext V2: Logout API call successful');
      } catch (error) {
        console.error('AuthContext V2: Logout API call failed (continuing anyway):', error);
      }

      // Clear V2 tokens
      tokenService.clearTokens();
    } else {
      // Auth V1: Clear V1 tokens
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }

    // Clear common data
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    setAuthVersion('v1'); // Reset to v1

    console.log('AuthContext: Logout complete, redirecting to auth page');

    // Redirect to login page
    router.push('/auth');
  }, [authVersion, router]);

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
