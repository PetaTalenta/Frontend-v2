'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearDemoAssessmentData } from '../services/user-stats';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  register: (token: string, user: User) => void;
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

  const login = (newToken: string, newUser: User) => {
    console.log('AuthContext: User logging in:', newUser.email);

    // Clear any existing demo data to ensure clean user statistics
    clearDemoAssessmentData();

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Set cookie for server-side middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

    console.log('AuthContext: Login successful, redirecting to dashboard');

    // Redirect to dashboard after login
    router.push('/dashboard');
  };

  const register = (newToken: string, newUser: User) => {
    console.log('AuthContext: User registering:', newUser.email);

    // Clear any existing demo data to ensure clean user statistics
    clearDemoAssessmentData();

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Set cookie for server-side middleware
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

    console.log('AuthContext: Registration successful, redirecting to dashboard');

    // Redirect to dashboard after registration
    router.push('/dashboard');
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
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
