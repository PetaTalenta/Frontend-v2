'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import { queryKeys } from '../lib/tanStackConfig';
import { transformAssessmentResult } from '../utils/dataTransformations';
import type { AssessmentResultResponse, AssessmentResultTransformed } from '../types/assessment-results';

// State interface for assessment data
interface AssessmentDataState {
  assessmentId: string | null;
  data: AssessmentResultResponse | null;
  transformedData: AssessmentResultTransformed | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  lastUpdated: number | null;
}

// Action types for the reducer
type AssessmentDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FETCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_DATA'; payload: { data: AssessmentResultResponse; transformedData: AssessmentResultTransformed } }
  | { type: 'SET_ASSESSMENT_ID'; payload: string }
  | { type: 'CLEAR_DATA' }
  | { type: 'REFRESH_DATA' };

// Initial state
const initialState: AssessmentDataState = {
  assessmentId: null,
  data: null,
  transformedData: null,
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null,
  lastUpdated: null,
};

// Reducer function
function assessmentDataReducer(
  state: AssessmentDataState,
  action: AssessmentDataAction
): AssessmentDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_FETCHING':
      return { ...state, isFetching: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        isError: !!action.payload, 
        error: action.payload, 
        isLoading: false 
      };
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload.data,
        transformedData: action.payload.transformedData,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        lastUpdated: Date.now(),
      };
    case 'SET_ASSESSMENT_ID':
      return { ...state, assessmentId: action.payload };
    case 'CLEAR_DATA':
      return { ...initialState };
    case 'REFRESH_DATA':
      return { ...state, isFetching: true };
    default:
      return state;
  }
}

// Context interface
interface AssessmentDataContextType extends AssessmentDataState {
  // Actions
  refresh: () => void;
  clearData: () => void;
  setAssessmentId: (id: string) => void;
  
  // Data accessors
  getSpecificData: (type: 'riasec' | 'ocean' | 'via' | 'persona' | 'all') => any;
  getTestData: () => any;
  getTestResult: () => any;
  
  // Utility functions
  isDataFresh: (maxAgeMs?: number) => boolean;
  getDataAge: () => number | null;
}

// Create context
const AssessmentDataContext = createContext<AssessmentDataContextType | undefined>(undefined);

// Provider props
interface AssessmentDataProviderProps {
  children: ReactNode;
  assessmentId: string;
}

// Cache configuration
const CACHE_CONFIG = {
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
};

// Provider component
export function AssessmentDataProvider({ children, assessmentId }: AssessmentDataProviderProps) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(assessmentDataReducer, initialState);

  // Set assessment ID when it changes
  useEffect(() => {
    if (assessmentId !== state.assessmentId) {
      dispatch({ type: 'SET_ASSESSMENT_ID', payload: assessmentId });
      dispatch({ type: 'CLEAR_DATA' });
    }
  }, [assessmentId, state.assessmentId]);

  // Query for assessment data
  const query = useQuery({
    queryKey: queryKeys.assessments.result(assessmentId),
    queryFn: () => authService.getAssessmentResult(assessmentId),
    enabled: !!assessmentId,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: 3,
    retryDelay: 1000,
    // Error handling
    throwOnError: (error: any) => {
      // Don't throw on 404 (not found) or 403 (access denied)
      if (error?.status === 404 || error?.status === 403) {
        return false;
      }
      return true;
    },
  });

  // Update state based on query state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: query.isLoading });
    dispatch({ type: 'SET_FETCHING', payload: query.isFetching });
    
    if (query.error) {
      dispatch({ type: 'SET_ERROR', payload: query.error as Error });
    }
    
    if (query.data) {
      const transformedData = transformAssessmentResult(query.data.data);
      dispatch({ 
        type: 'SET_DATA', 
        payload: { data: query.data, transformedData } 
      });
    }
  }, [query.isLoading, query.isFetching, query.error, query.data]);

  // Action functions
  const refresh = () => {
    dispatch({ type: 'REFRESH_DATA' });
    queryClient.refetchQueries({ queryKey: queryKeys.assessments.result(assessmentId) });
  };

  const clearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
    queryClient.removeQueries({ queryKey: queryKeys.assessments.result(assessmentId) });
  };

  const setAssessmentId = (id: string) => {
    dispatch({ type: 'SET_ASSESSMENT_ID', payload: id });
  };

  // Data accessor functions
  const getSpecificData = (type: 'riasec' | 'ocean' | 'via' | 'persona' | 'all') => {
    if (!state.transformedData) return null;
    
    switch (type) {
      case 'riasec':
        return state.transformedData.test_data.riasec;
      case 'ocean':
        return state.transformedData.test_data.ocean;
      case 'via':
        return state.transformedData.test_data.viaIs;
      case 'persona':
        return state.transformedData.test_result;
      case 'all':
        return state.transformedData;
      default:
        return null;
    }
  };

  const getTestData = () => {
    return state.data?.data?.test_data || null;
  };

  const getTestResult = () => {
    return state.data?.data?.test_result || null;
  };

  // Utility functions
  const isDataFresh = (maxAgeMs: number = CACHE_CONFIG.staleTime) => {
    if (!state.lastUpdated) return false;
    return Date.now() - state.lastUpdated < maxAgeMs;
  };

  const getDataAge = () => {
    if (!state.lastUpdated) return null;
    return Date.now() - state.lastUpdated;
  };

  // Context value
  const contextValue: AssessmentDataContextType = {
    ...state,
    refresh,
    clearData,
    setAssessmentId,
    getSpecificData,
    getTestData,
    getTestResult,
    isDataFresh,
    getDataAge,
  };

  return (
    <AssessmentDataContext.Provider value={contextValue}>
      {children}
    </AssessmentDataContext.Provider>
  );
}

// Hook to use the context
export function useAssessmentData() {
  const context = useContext(AssessmentDataContext);
  if (context === undefined) {
    throw new Error('useAssessmentData must be used within an AssessmentDataProvider');
  }
  return context;
}

// Hook for selective data loading
export function useAssessmentDataSelective(type: 'riasec' | 'ocean' | 'via' | 'persona' | 'all') {
  const { getSpecificData, isLoading, isError, error, isDataFresh } = useAssessmentData();
  
  const data = getSpecificData(type);
  
  return {
    data,
    isLoading,
    isError,
    error,
    isDataFresh: isDataFresh(),
  };
}

export default AssessmentDataContext;