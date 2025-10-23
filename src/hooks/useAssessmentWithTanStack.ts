'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssessmentResult } from '../data/dummy-assessment-data';
import { queryKeys, queryInvalidation } from '../lib/tanStackConfig';
import { getDummyAssessmentResult } from '../data/dummy-assessment-data';

// Interface untuk API response
interface ApiResponse {
  success: boolean;
  data: AssessmentResult;
  message?: string;
}

// Fetcher function untuk assessment results
const fetchAssessmentResult = async (id: string): Promise<AssessmentResult> => {
  if (!id) {
    throw new Error('Assessment ID is required');
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
  
  try {
    const response = await fetch(`${baseUrl}/api/archive/results/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for better performance
      next: {
        revalidate: 3600, // Revalidate every hour
        tags: [`assessment-result-${id}`]
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const json: ApiResponse = await response.json();
    
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Invalid response format');
    }

    return json.data;
  } catch (error) {
    console.warn('API fetch failed, using dummy data:', error);
    // Fallback to dummy data
    return getDummyAssessmentResult();
  }
};

// Fetcher function untuk assessment list
const fetchAssessmentList = async (): Promise<AssessmentResult[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
  
  try {
    const response = await fetch(`${baseUrl}/api/archive/results`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Invalid response format');
    }

    return json.data;
  } catch (error) {
    console.warn('API fetch failed, returning empty list:', error);
    // Fallback to empty array
    return [];
  }
};

// Custom hook untuk assessment result dengan TanStack Query
export const useAssessmentResult = (id: string) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isRefetching,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: queryKeys.assessments.result(id),
    queryFn: () => fetchAssessmentResult(id),
    enabled: !!id, // Only fetch if ID is provided
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
  });

  // Prefetch related data when assessment is loaded
  const prefetchRelatedData = async () => {
    if (data && isSuccess) {
      // Prefetch other assessments if this is part of a list
      await queryClient.prefetchQuery({
        queryKey: queryKeys.assessments.list(),
        queryFn: fetchAssessmentList,
        staleTime: 3 * 60 * 1000, // 3 minutes
      });
    }
  };

  // Optimistic update mutation
  const updateAssessmentMutation = useMutation({
    mutationFn: async (updatedData: Partial<AssessmentResult>) => {
      // This would be an API call to update the assessment
      // For now, we'll just return the updated data
      return { ...data, ...updatedData } as AssessmentResult;
    },
    onMutate: async (updatedData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.result(id) });
      
      // Snapshot the previous value
      const previousAssessment = queryClient.getQueryData(queryKeys.assessments.result(id));
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.assessments.result(id), (old: any) => 
        old ? { ...old, ...updatedData } : updatedData
      );
      
      // Return a context object with the snapshotted value
      return { previousAssessment };
    },
    onError: (err, updatedData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAssessment) {
        queryClient.setQueryData(queryKeys.assessments.result(id), context.previousAssessment);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryInvalidation.assessments.result(id);
    },
  });

  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: async () => {
      // This would be an API call to delete the assessment
      // For now, we'll just return success
      return { success: true };
    },
    onSuccess: () => {
      // Remove the assessment from cache
      queryClient.removeQueries({ queryKey: queryKeys.assessments.result(id) });
      // Invalidate the list to update it
      queryInvalidation.assessments.list();
    },
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch,
    isFetching,
    isRefetching,
    isSuccess,
    isError,
    prefetchRelatedData,
    updateAssessment: updateAssessmentMutation.mutate,
    deleteAssessment: deleteAssessmentMutation.mutate,
    isUpdating: updateAssessmentMutation.isPending,
    isDeleting: deleteAssessmentMutation.isPending,
  };
};

// Custom hook untuk assessment list dengan TanStack Query
export const useAssessmentList = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
  } = useQuery({
    queryKey: queryKeys.assessments.list(),
    queryFn: fetchAssessmentList,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return {
    data: data || [],
    loading: isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
  };
};

// Custom hook untuk static data (auth, select-assessment, etc.)
export const useStaticData = <T>(fetcher: () => Promise<T>, queryKey: string[], dependencies: any[] = []) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetcher,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: dependencies.length === 0 || dependencies.every(dep => dep != null),
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch,
  };
};

// Hook untuk prefetch assessment data
export const usePrefetchAssessment = () => {
  const queryClient = useQueryClient();

  const prefetchAssessment = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.assessments.result(id),
      queryFn: () => fetchAssessmentResult(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchAssessmentList = async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.assessments.list(),
      queryFn: fetchAssessmentList,
      staleTime: 3 * 60 * 1000, // 3 minutes
    });
  };

  return {
    prefetchAssessment,
    prefetchAssessmentList,
  };
};

export default useAssessmentResult;