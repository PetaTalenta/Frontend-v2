'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useAssessmentStore } from '../stores/useAssessmentStore';

interface AppProviderProps {
  children: ReactNode;
}

// Global provider yang menggabungkan semua state management
export function AppProvider({ children }: AppProviderProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}

// Hook untuk mengakses global state
export const useGlobalState = () => {
  const auth = useAuthStore();
  const assessment = useAssessmentStore();
  
  return {
    auth,
    assessment,
  };
};

// Selectors untuk optimized re-renders
export const useAppLoading = () => {
  const authLoading = useAuthStore((state) => state.isLoading);
  const assessmentLoading = useAssessmentStore((state) => state.isLoading);
  
  return {
    isLoading: authLoading || assessmentLoading,
    authLoading,
    assessmentLoading,
  };
};

export const useAppError = () => {
  const authError = useAuthStore((state) => state.error);
  const assessmentError = useAssessmentStore((state) => state.error);
  
  return {
    error: authError || assessmentError,
    authError,
    assessmentError,
    clearAuthError: useAuthStore((state) => state.clearError),
    clearAssessmentError: useAssessmentStore((state) => state.setError),
  };
};