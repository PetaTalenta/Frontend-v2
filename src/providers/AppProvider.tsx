'use client';

import React, { ReactNode, useEffect } from 'react';
import { TanStackProvider } from './QueryProvider';
import { optimizedPerformanceMonitor } from '../lib/performance-optimized';

interface AppProviderProps {
  children: ReactNode;
}

// Global provider yang menggabungkan semua state management
export function AppProvider({ children }: AppProviderProps) {
  // Initialize performance monitoring
  useEffect(() => {
    optimizedPerformanceMonitor.init();
  }, []);

  return (
    <TanStackProvider>
      {children}
    </TanStackProvider>
  );
}

// Hook untuk mengakses global state (simplified)
export const useGlobalState = () => {
  return {
    // Global state sekarang dikelola oleh TanStack Query
  };
};

// Selectors untuk optimized re-renders (simplified)
export const useAppLoading = () => {
  return {
    isLoading: false, // Loading state sekarang dikelola per query
    authLoading: false,
    assessmentLoading: false,
  };
};

export const useAppError = () => {
  return {
    error: null, // Error state sekarang dikelola per query
    authError: null,
    assessmentError: null,
    clearAuthError: () => {},
    clearAssessmentError: () => {},
  };
};