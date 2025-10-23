'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import authService, {
  LoginData,
  RegisterData,
  UpdateProfileData,
  ProfileResponse,
  ApiError
} from '../services/authService';

// Types untuk user data
export interface User {
  uid: string;
  email: string;
  displayName: string;
}

// Types untuk profile data
export interface Profile {
  user_id: string;
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  school_id: string | null;
  created_at: string;
  updated_at: string;
  school: any;
}

// Types untuk auth context
export interface AuthContextType {
  // State
  user: User | null;
  profile: ProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getCurrentUser();
          if (userData && isMounted) {
            setUser(userData);
            await loadProfile();
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error initializing auth:', err);
          setError('Failed to initialize authentication');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load profile data
  const loadProfile = useCallback(async () => {
    try {
      const profileData = await authService.getProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      // Don't set error for profile loading failure, as it's not critical
    }
  }, []);

  // Login function
  const login = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(data);
      
      if (response.success) {
        const userData = {
          uid: response.data.uid,
          email: response.data.email,
          displayName: response.data.displayName,
        };
        setUser(userData);
        await loadProfile();
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Login failed');
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);
      
      if (response.success) {
        const userData = {
          uid: response.data.uid,
          email: response.data.email,
          displayName: response.data.displayName,
        };
        setUser(userData);
        await loadProfile();
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Registration failed');
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Logout failed');
      // Still clear user data even if logout API fails
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.updateProfile(data);
      
      if (response.success) {
        setProfile(response);
      } else {
        setError(response.message || 'Profile update failed');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Profile update failed');
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    try {
      await loadProfile();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to refresh profile');
      throw apiError;
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.deleteAccount();
      setUser(null);
      setProfile(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Account deletion failed');
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value: AuthContextType = {
    // State
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    deleteAccount,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export context for testing
export { AuthContext };