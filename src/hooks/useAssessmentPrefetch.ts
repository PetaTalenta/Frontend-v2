'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryPrefetch } from '../lib/tanStackConfig';

interface UseAssessmentPrefetchOptions {
  enabled?: boolean;
  delay?: number; // Delay in milliseconds before prefetching
  prefetchOnMount?: boolean;
  prefetchOnDataChange?: boolean;
}

interface AssessmentDataForPrefetch {
  data: any;
  isLoading: boolean;
  isDataFresh: () => boolean;
  assessmentId: string;
}

/**
 * Custom hook for smart prefetching of assessment data
 * Automatically prefetches data for all sub-pages when main data is available
 */
export function useAssessmentPrefetch(
  assessmentData: AssessmentDataForPrefetch | null,
  options: UseAssessmentPrefetchOptions = {}
) {
  const {
    enabled = true,
    delay = 1000, // 1 second default delay
    prefetchOnMount = true,
    prefetchOnDataChange = true,
  } = options;

  const queryClient = useQueryClient();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetchedRef = useRef(false);
  
  // Use provided assessment data or default values
  const data = assessmentData?.data;
  const isLoading = assessmentData?.isLoading ?? true;
  const assessmentId = assessmentData?.assessmentId ?? '';
  
  // Memoize the isDataFresh function to prevent unnecessary re-renders
  const isDataFresh = useMemo(() => {
    return assessmentData?.isDataFresh ?? (() => false);
  }, [assessmentData?.isDataFresh]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  // Prefetch function for all assessment sub-pages
  const prefetchAllAssessmentData = useCallback(async () => {
    if (!enabled || !assessmentId || !data || isLoading) {
      return;
    }

    // Don't prefetch if data is stale
    if (!isDataFresh()) {
      return;
    }

    // Don't prefetch if already done recently
    if (hasPrefetchedRef.current) {
      return;
    }

    try {
      // Prefetch all assessment types with different stale times
      await Promise.all([
        // Prefetch RIASEC data with longer stale time
        queryClient.prefetchQuery({
          queryKey: [...queryKeys.assessments.result(assessmentId), 'type', 'riasec'],
          queryFn: () => Promise.resolve(data?.data?.test_data?.riasec || null),
          staleTime: 20 * 60 * 1000, // 20 minutes
          gcTime: 25 * 60 * 1000, // 25 minutes
        }),

        // Prefetch OCEAN data with longer stale time
        queryClient.prefetchQuery({
          queryKey: [...queryKeys.assessments.result(assessmentId), 'type', 'ocean'],
          queryFn: () => Promise.resolve(data?.data?.test_data?.ocean || null),
          staleTime: 20 * 60 * 1000, // 20 minutes
          gcTime: 25 * 60 * 1000, // 25 minutes
        }),

        // Prefetch VIA data with longer stale time
        queryClient.prefetchQuery({
          queryKey: [...queryKeys.assessments.result(assessmentId), 'type', 'via'],
          queryFn: () => Promise.resolve(data?.data?.test_data?.viaIs || null),
          staleTime: 20 * 60 * 1000, // 20 minutes
          gcTime: 25 * 60 * 1000, // 25 minutes
        }),

        // Prefetch Persona data with longer stale time
        queryClient.prefetchQuery({
          queryKey: [...queryKeys.assessments.result(assessmentId), 'type', 'persona'],
          queryFn: () => Promise.resolve(data?.data?.test_result || null),
          staleTime: 20 * 60 * 1000, // 20 minutes
          gcTime: 25 * 60 * 1000, // 25 minutes
        }),

        // Prefetch related user data
        queryPrefetch.userProfile(),
        
        // Prefetch dashboard stats for context
        queryPrefetch.dashboardStats(),
      ]);

      hasPrefetchedRef.current = true;
      
      // Reset flag after 5 minutes to allow re-prefetching
      setTimeout(() => {
        hasPrefetchedRef.current = false;
      }, 5 * 60 * 1000);

      console.log('Assessment data prefetched successfully');
    } catch (error) {
      console.warn('Failed to prefetch assessment data:', error);
    }
  }, [enabled, assessmentId, data, isLoading, isDataFresh, queryClient]);

  // Prefetch on mount if data is available
  useEffect(() => {
    if (prefetchOnMount && data && !isLoading) {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }

      prefetchTimeoutRef.current = setTimeout(() => {
        prefetchAllAssessmentData();
      }, delay);
    }
  }, [data, isLoading, prefetchOnMount, delay, prefetchAllAssessmentData]);

  // Prefetch when data changes
  useEffect(() => {
    if (prefetchOnDataChange && data && !isLoading) {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }

      prefetchTimeoutRef.current = setTimeout(() => {
        prefetchAllAssessmentData();
      }, delay);
    }
  }, [data, isLoading, prefetchOnDataChange, delay, prefetchAllAssessmentData]);

  // Manual prefetch function
  const manualPrefetch = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    return prefetchAllAssessmentData();
  };

  // Check if specific data is prefetched
  const isDataPrefetched = (type: 'riasec' | 'ocean' | 'via' | 'persona') => {
    const queryKey = [...queryKeys.assessments.result(assessmentId || ''), 'type', type];
    return queryClient.getQueryState(queryKey)?.status === 'success';
  };

  // Get prefetched data
  const getPrefetchedData = (type: 'riasec' | 'ocean' | 'via' | 'persona') => {
    const queryKey = [...queryKeys.assessments.result(assessmentId || ''), 'type', type];
    return queryClient.getQueryData(queryKey);
  };

  return {
    // Functions
    prefetchAll: prefetchAllAssessmentData,
    manualPrefetch,
    isDataPrefetched,
    getPrefetchedData,
    
    // State
    hasPrefetched: hasPrefetchedRef.current,
    canPrefetch: enabled && !!assessmentId && !!data && !isLoading && isDataFresh(),
  };
}

/**
 * Hook for prefetching specific assessment data type
 */
export function useAssessmentPrefetchByType(
  type: 'riasec' | 'ocean' | 'via' | 'persona',
  assessmentData: AssessmentDataForPrefetch | null,
  options: UseAssessmentPrefetchOptions = {}
) {
  const queryClient = useQueryClient();
  const { enabled = true, delay = 500 } = options;
  
  // Use provided assessment data or default values
  const data = assessmentData?.data;
  const assessmentId = assessmentData?.assessmentId ?? '';

  const prefetchSpecificData = useCallback(async () => {
    if (!enabled || !assessmentId || !data) {
      return;
    }

    try {
      let queryData;
      switch (type) {
        case 'riasec':
          queryData = data?.data?.test_data?.riasec;
          break;
        case 'ocean':
          queryData = data?.data?.test_data?.ocean;
          break;
        case 'via':
          queryData = data?.data?.test_data?.viaIs;
          break;
        case 'persona':
          queryData = data?.data?.test_result;
          break;
      }

      await queryClient.prefetchQuery({
        queryKey: [...queryKeys.assessments.result(assessmentId), 'type', type],
        queryFn: () => Promise.resolve(queryData || null),
        staleTime: 20 * 60 * 1000, // 20 minutes
        gcTime: 25 * 60 * 1000, // 25 minutes
      });

      console.log(`${type} data prefetched successfully`);
    } catch (error) {
      console.warn(`Failed to prefetch ${type} data:`, error);
    }
  }, [enabled, assessmentId, data, type, queryClient]);

  useEffect(() => {
    if (data) {
      const timeout = setTimeout(() => {
        prefetchSpecificData();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [data, type, delay, prefetchSpecificData]);

  return {
    prefetch: prefetchSpecificData,
    isPrefetched: () => {
      const queryKey = [...queryKeys.assessments.result(assessmentId || ''), 'type', type];
      return queryClient.getQueryState(queryKey)?.status === 'success';
    },
    getData: () => {
      const queryKey = [...queryKeys.assessments.result(assessmentId || ''), 'type', type];
      return queryClient.getQueryData(queryKey);
    },
  };
}

export default useAssessmentPrefetch;