'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService, {
  LoginData,
  RegisterData,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  queryKeys,
  queryInvalidation,
  LogoutValidationOptions,
  UnsavedChanges
} from '../services/authService';

// Custom hook untuk authentication dengan TanStack Query
export const useAuth = () => {
  const queryClient = useQueryClient();

  // Query untuk user data (supports partial and complete data)
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => {
      const userData = authService.getCurrentUser();
      if (!userData) {
        throw new Error('User not authenticated');
      }
      return userData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: authService.isAuthenticated(),
    retry: false,
  });

  // Query untuk profile data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => authService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: authService.isAuthenticated(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Query untuk data status monitoring
  const {
    data: dataStatus,
    isLoading: statusLoading,
  } = useQuery({
    queryKey: queryKeys.auth.dataStatus(),
    queryFn: () => authService.getDataStatus(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: authService.isAuthenticated(),
    refetchInterval: 60 * 1000, // Check every minute
  });

  // Login mutation with progressive data loading
  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (data: LoginResponse) => {
      if (data.success) {
        // Set partial user data in cache immediately
        const partialUserData = {
          uid: data.data.uid,
          email: data.data.email,
          displayName: data.data.displayName,
          isPartial: true,
        };
        
        queryClient.setQueryData(queryKeys.auth.user(), partialUserData);
        
        // Invalidate and refetch profile data
        queryInvalidation.auth.profile();
        
        // Trigger background data upgrade
        authService.ensureCompleteData();
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Register mutation with progressive data loading
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data: RegisterResponse) => {
      if (data.success) {
        // Set partial user data in cache immediately
        const partialUserData = {
          uid: data.data.uid,
          email: data.data.email,
          displayName: data.data.displayName,
          isPartial: true,
        };
        
        queryClient.setQueryData(queryKeys.auth.user(), partialUserData);
        
        // Invalidate and refetch profile data
        queryInvalidation.auth.profile();
        
        // Trigger background data upgrade
        authService.ensureCompleteData();
      }
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });

  // Enhanced logout mutation with validation options
  const logoutMutation = useMutation({
    mutationFn: (options?: LogoutValidationOptions) => authService.logout(options),
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout fails, clear cache for security
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  // Login function
  const login = async (data: LoginData) => {
    return loginMutation.mutateAsync(data);
  };

  // Register function
  const register = async (data: RegisterData) => {
    return registerMutation.mutateAsync(data);
  };

  // Enhanced logout function with validation options
  const logout = async (options?: LogoutValidationOptions) => {
    return logoutMutation.mutateAsync(options);
  };

  // Enhanced security monitoring functions
  const getSecurityEvents = (limit?: number) => {
    return authService.getSecurityEvents(limit);
  };

  const getSecurityEventsByType = (type: any, limit?: number) => {
    return authService.getSecurityEventsByType(type, limit);
  };

  const detectSuspiciousActivity = () => {
    return authService.detectSuspiciousActivity();
  };

  // Unsaved changes management
  const setUnsavedChanges = (changes: Record<string, any>) => {
    authService.setUnsavedChanges(changes);
  };

  const getUnsavedChanges = (): UnsavedChanges | null => {
    return authService.getUnsavedChanges();
  };

  const hasUnsavedChanges = (): boolean => {
    return authService.hasUnsavedChanges();
  };

  const clearUnsavedChanges = () => {
    authService.clearUnsavedChanges();
  };

  // Check authentication status
  const isAuthenticated = authService.isAuthenticated();

  // Get current user data
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  // Refresh user data
  const refreshUserData = async () => {
    queryInvalidation.auth.user();
    queryInvalidation.auth.profile();
  };

  // Get cached profile data
  const getCachedProfile = () => {
    return authService.getCachedProfile();
  };

  // Ensure complete data is loaded
  const ensureCompleteData = async () => {
    return await authService.ensureCompleteData();
  };

  // Check if user data is partial
  const isUserDataPartial = () => {
    return user?.isPartial || false;
  };

  // Get data status
  const getDataStatus = () => {
    return authService.getDataStatus();
  };

  return {
    // State
    user,
    profile,
    isAuthenticated,
    isLoading: userLoading || profileLoading || statusLoading,
    error: userError || profileError,
    dataStatus,

    // Actions
    login,
    register,
    logout,
    refreshUserData,
    getCurrentUser,
    getCachedProfile,
    ensureCompleteData,

    // Utilities
    isUserDataPartial,
    getDataStatus,

    // Enhanced security monitoring
    getSecurityEvents,
    getSecurityEventsByType,
    detectSuspiciousActivity,

    // Unsaved changes management
    setUnsavedChanges,
    getUnsavedChanges,
    hasUnsavedChanges,
    clearUnsavedChanges,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Mutation errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
};

// Custom hook untuk login form state management
export const useLoginForm = () => {
  const [formData, setFormData] = React.useState<LoginData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { login, isLoggingIn, loginError } = useAuth();

  // Handle form field changes
  const handleChange = (field: keyof LoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (onSuccess?: () => void) => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting: isLoggingIn,
    loginError,
  };
};

// Custom hook untuk register form state management
export const useRegisterForm = () => {
  const [formData, setFormData] = React.useState<RegisterData>({
    email: '',
    password: '',
    displayName: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { register, isRegistering, registerError } = useAuth();

  // Handle form field changes
  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (onSuccess?: () => void) => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting: isRegistering,
    registerError,
  };
};

export default useAuth;