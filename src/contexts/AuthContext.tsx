'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearDemoAssessmentData } from '../services/user-stats';
import { getUserProfile } from '../services/profile-api';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('AuthContext: useEffect starting, isLoading:', isLoading);

    // Check for existing token on app start
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    console.log('AuthContext: savedToken exists:', !!savedToken);
    console.log('AuthContext: savedUser exists:', !!savedUser);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // Ensure cookie is set for server-side middleware
        document.cookie = `token=${savedToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
        console.log('AuthContext: Restored existing authentication for user:', parsedUser.name);

        // Always try to fetch the latest username from profile to ensure it's up to date
        console.log('AuthContext: Triggering username fetch from profile on mount...');
        fetchUsernameFromProfile(savedToken);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        console.log('AuthContext: Cleared invalid authentication data, error:', error);
      }
    } else {
      console.log('AuthContext: No existing authentication found, user needs to login');
    }

    console.log('AuthContext: Setting isLoading to false');
    setIsLoading(false);
  }, []);

  const login = async (newToken: string, newUser: User) => {
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
    // Wait for it to complete to ensure username is available
    await fetchUsernameFromProfile(newToken);

    console.log('AuthContext: Profile data fetched, redirecting to dashboard...');

    // Redirect to dashboard after login
    router.push('/dashboard');
  };

  const register = async (newToken: string, newUser: User) => {
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
    // Wait for it to complete to ensure username is available
    await fetchUsernameFromProfile(newToken);

    console.log('AuthContext: Profile data fetched, redirecting to dashboard...');

    // Redirect to dashboard after registration
    router.push('/dashboard');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) {
      console.log('AuthContext: Cannot update user - no user currently logged in');
      return;
    }

    console.log('AuthContext: Updating user data with:', userData);
    console.log('AuthContext: Current user before update:', user);

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    console.log('AuthContext: User data successfully updated:', updatedUser);

    // Force a re-render by updating the state
    // This ensures components using the user data will re-render with the new data
  };

  // Fetch username from profile if not available
  const fetchUsernameFromProfile = async (token: string) => {
    try {
      console.log('AuthContext: Fetching username from profile...');
      const profileData = await getUserProfile(token);
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
        if (profileUser.email && !user?.email) {
          updates.email = profileUser.email;
        }

        // Update name from profile full_name if available
        if (profileData.data.profile?.full_name && !user?.name) {
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
        console.log('AuthContext: Profile structure:', JSON.stringify(profileData, null, 2));
      }
    } catch (error) {
      console.error('AuthContext: Failed to fetch username from profile:', error);
      // Don't throw error, just log it - this is optional enhancement
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    // Redirect to login page
    router.push('/auth');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
