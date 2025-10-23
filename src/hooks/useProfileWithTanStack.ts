'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authServiceWithTanStack from '../services/authServiceWithTanStack';
import { UpdateProfileData, ProfileResponse } from '../services/authService';
import { queryKeys, queryInvalidation } from '../lib/tanStackConfig';

// Custom hook untuk profile data dengan TanStack Query
export const useProfile = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => authServiceWithTanStack.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: authServiceWithTanStack.isAuthenticated(), // Only fetch if user is authenticated
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => authServiceWithTanStack.updateProfile(data),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.profile() });
      
      // Get context for optimistic update
      const context = await authServiceWithTanStack.optimisticProfileUpdate(data);
      
      return context;
    },
    onError: (error, data, context) => {
      // Rollback optimistic update on error
      if (context) {
        authServiceWithTanStack.rollbackProfileUpdate(context);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryInvalidation.auth.profile();
      queryInvalidation.profile.details();
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => authServiceWithTanStack.deleteAccount(),
    onSuccess: () => {
      // Clear all queries from cache
      queryClient.clear();
    },
  });

  // Refresh profile
  const refreshProfile = async () => {
    try {
      await authServiceWithTanStack.refetchProfile();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  // Check if profile data is stale
  const isProfileStale = () => {
    return authServiceWithTanStack.isProfileStale();
  };

  // Get cached profile data
  const getCachedProfile = () => {
    return authServiceWithTanStack.getCachedProfile();
  };

  return {
    data,
    loading: isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
    isError,
    updateProfile: updateProfileMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
    refreshProfile,
    isProfileStale,
    getCachedProfile,
  };
};

// Custom hook untuk user data (basic auth info)
export const useUser = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isSuccess,
  } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => {
      const user = authServiceWithTanStack.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      return user;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: authServiceWithTanStack.isAuthenticated(), // Only fetch if user is authenticated
    retry: false, // Don't retry if user is not authenticated
  });

  // Refresh user data
  const refreshUser = async () => {
    queryInvalidation.auth.user();
  };

  return {
    data,
    loading: isLoading,
    error,
    refetch,
    isSuccess,
    refreshUser,
  };
};

// Custom hook untuk profile settings
export const useProfileSettings = () => {
  const {
    data: profile,
    loading,
    error,
    refetch,
  } = useProfile();

  // Extract settings from profile data
  const settings = profile?.data?.user ? {
    id: profile.data.user.id,
    username: profile.data.user.username,
    email: profile.data.user.email,
    user_type: profile.data.user.user_type,
    is_active: profile.data.user.is_active,
    token_balance: profile.data.user.token_balance,
    last_login: profile.data.user.last_login,
    created_at: profile.data.user.created_at,
    profile: profile.data.user.profile,
  } : null;

  return {
    data: settings,
    loading,
    error,
    refetch,
  };
};

// Custom hook untuk profile statistics
export const useProfileStats = () => {
  const {
    data: profile,
    loading,
    error,
  } = useProfile();

  // Extract stats from profile data
  const stats = profile?.data?.user ? {
    token_balance: profile.data.user.token_balance,
    assessments_completed: 0, // This would come from API when available
    last_login: profile.data.user.last_login,
    account_age: profile.data.user.created_at ? 
      Math.floor((Date.now() - new Date(profile.data.user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 
      0, // days
  } : null;

  return {
    data: stats,
    loading,
    error,
  };
};

// Hook untuk prefetch profile data
export const usePrefetchProfile = () => {
  const queryClient = useQueryClient();

  const prefetchProfile = async () => {
    if (authServiceWithTanStack.isAuthenticated()) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => authServiceWithTanStack.getProfile(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  };

  const prefetchUser = async () => {
    if (authServiceWithTanStack.isAuthenticated()) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.auth.user(),
        queryFn: () => {
          const user = authServiceWithTanStack.getCurrentUser();
          if (!user) {
            throw new Error('User not authenticated');
          }
          return user;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    }
  };

  return {
    prefetchProfile,
    prefetchUser,
  };
};

// Custom hook untuk profile form state management
export const useProfileForm = () => {
  const { data: profile, updateProfile, isUpdating } = useProfile();
  
  // Initialize form data with current profile
  const initialFormData = profile?.data?.user?.profile ? {
    full_name: profile.data.user.profile.full_name || '',
    gender: profile.data.user.profile.gender || '',
    date_of_birth: profile.data.user.profile.date_of_birth || '',
    school_id: profile.data.user.profile.school_id || '',
  } : {
    full_name: '',
    gender: '',
    date_of_birth: '',
    school_id: '',
  };

  const [formData, setFormData] = React.useState(initialFormData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Update form data when profile changes
  React.useEffect(() => {
    if (profile?.data?.user?.profile) {
      setFormData({
        full_name: profile.data.user.profile.full_name || '',
        gender: profile.data.user.profile.gender || '',
        date_of_birth: profile.data.user.profile.date_of_birth || '',
        school_id: profile.data.user.profile.school_id || '',
      });
    }
  }, [profile]);

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (age < 13 || age > 120) {
        newErrors.date_of_birth = 'Please enter a valid date of birth';
      }
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
      await updateProfile(formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting: isUpdating,
  };
};

export default useProfile;