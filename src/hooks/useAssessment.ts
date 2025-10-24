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

// Assessment Progress Management with TanStack Query
interface AssessmentProgress {
  currentSection: number;
  currentPhase: number;
  totalSections: number;
  totalPhases: number;
  answers: Record<string, any>;
  isCompleted: boolean;
  startTime: number | null;
  endTime: number | null;
}

const initialAssessmentProgress: AssessmentProgress = {
  currentSection: 0,
  currentPhase: 0,
  totalSections: 10,
  totalPhases: 3,
  answers: {},
  isCompleted: false,
  startTime: null,
  endTime: null,
};

// LocalStorage utilities for assessment progress
const assessmentProgressStorage = {
  get: (): AssessmentProgress | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('assessment-progress');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  
  set: (progress: AssessmentProgress): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('assessment-progress', JSON.stringify(progress));
    } catch {
      // Silent fail for localStorage issues
    }
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('assessment-progress');
    } catch {
      // Silent fail for localStorage issues
    }
  },
};

// Custom hook for assessment progress management
export const useAssessmentProgress = () => {
  const queryClient = useQueryClient();

  const {
    data: progress = initialAssessmentProgress,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.assessments.progress(),
    queryFn: () => {
      // Load from localStorage on initial fetch
      const stored = assessmentProgressStorage.get();
      return stored || initialAssessmentProgress;
    },
    staleTime: Infinity, // Never stale, managed by mutations
    gcTime: Infinity, // Never remove from cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  // Update current section mutation
  const setCurrentSection = useMutation({
    mutationFn: async (section: number) => {
      const newSection = Math.max(0, Math.min(section, progress.totalSections - 1));
      return newSection;
    },
    onMutate: async (newSection) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      const updatedProgress = { ...progress, currentSection: newSection };
      queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
      assessmentProgressStorage.set(updatedProgress);
      
      return { previousProgress };
    },
    onError: (err, newSection, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  // Update current phase mutation
  const setCurrentPhase = useMutation({
    mutationFn: async (phase: number) => {
      const newPhase = Math.max(0, Math.min(phase, progress.totalPhases - 1));
      return newPhase;
    },
    onMutate: async (newPhase) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      const updatedProgress = { ...progress, currentPhase: newPhase };
      queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
      assessmentProgressStorage.set(updatedProgress);
      
      return { previousProgress };
    },
    onError: (err, newPhase, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  // Navigation mutations
  const nextSection = useMutation({
    mutationFn: async () => {
      const newSection = Math.min(progress.currentSection + 1, progress.totalSections - 1);
      return newSection;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      if (progress.currentSection < progress.totalSections - 1) {
        const updatedProgress = { ...progress, currentSection: progress.currentSection + 1 };
        queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
        assessmentProgressStorage.set(updatedProgress);
      }
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  const previousSection = useMutation({
    mutationFn: async () => {
      const newSection = Math.max(progress.currentSection - 1, 0);
      return newSection;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      if (progress.currentSection > 0) {
        const updatedProgress = { ...progress, currentSection: progress.currentSection - 1 };
        queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
        assessmentProgressStorage.set(updatedProgress);
      }
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  const nextPhase = useMutation({
    mutationFn: async () => {
      const newPhase = Math.min(progress.currentPhase + 1, progress.totalPhases - 1);
      return newPhase;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      if (progress.currentPhase < progress.totalPhases - 1) {
        const updatedProgress = {
          ...progress,
          currentPhase: progress.currentPhase + 1,
          currentSection: 0
        };
        queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
        assessmentProgressStorage.set(updatedProgress);
      }
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  const previousPhase = useMutation({
    mutationFn: async () => {
      const newPhase = Math.max(progress.currentPhase - 1, 0);
      return newPhase;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      if (progress.currentPhase > 0) {
        const updatedProgress = {
          ...progress,
          currentPhase: progress.currentPhase - 1,
          currentSection: 0
        };
        queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
        assessmentProgressStorage.set(updatedProgress);
      }
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  // Set answer mutation
  const setAnswer = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: any }) => {
      return { questionId, answer };
    },
    onMutate: async ({ questionId, answer }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      const updatedProgress = {
        ...progress,
        answers: {
          ...progress.answers,
          [questionId]: answer,
        },
      };
      queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
      assessmentProgressStorage.set(updatedProgress);
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  // Assessment lifecycle mutations
  const startAssessment = useMutation({
    mutationFn: async () => {
      return Date.now();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      const updatedProgress = {
        ...progress,
        startTime: Date.now(),
        isCompleted: false,
      };
      queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
      assessmentProgressStorage.set(updatedProgress);
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  const completeAssessment = useMutation({
    mutationFn: async () => {
      return Date.now();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      const updatedProgress = {
        ...progress,
        isCompleted: true,
        endTime: Date.now(),
      };
      queryClient.setQueryData(queryKeys.assessments.progress(), updatedProgress);
      assessmentProgressStorage.set(updatedProgress);
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  const resetAssessment = useMutation({
    mutationFn: async () => {
      return initialAssessmentProgress;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assessments.progress() });
      const previousProgress = queryClient.getQueryData<AssessmentProgress>(queryKeys.assessments.progress());
      
      queryClient.setQueryData(queryKeys.assessments.progress(), initialAssessmentProgress);
      assessmentProgressStorage.set(initialAssessmentProgress);
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.assessments.progress(), context.previousProgress);
        assessmentProgressStorage.set(context.previousProgress);
      }
    },
  });

  // Utility function to get progress percentage
  const getProgress = () => {
    const totalItems = progress.totalSections * progress.totalPhases;
    const currentItem = progress.currentPhase * progress.totalSections + progress.currentSection + 1;
    const percentage = (currentItem / totalItems) * 100;

    return {
      section: progress.currentSection,
      phase: progress.currentPhase,
      percentage,
    };
  };

  return {
    // State
    progress,
    loading: isLoading,
    error,
    
    // Actions
    setCurrentSection: setCurrentSection.mutate,
    setCurrentPhase: setCurrentPhase.mutate,
    nextSection: nextSection.mutate,
    previousSection: previousSection.mutate,
    nextPhase: nextPhase.mutate,
    previousPhase: previousPhase.mutate,
    setAnswer: setAnswer.mutate,
    startAssessment: startAssessment.mutate,
    completeAssessment: completeAssessment.mutate,
    resetAssessment: resetAssessment.mutate,
    
    // Utilities
    getProgress,
    
    // Loading states
    isUpdating: setCurrentSection.isPending || setCurrentPhase.isPending,
    isNavigating: nextSection.isPending || previousSection.isPending || nextPhase.isPending || previousPhase.isPending,
    isAnswering: setAnswer.isPending,
    isStarting: startAssessment.isPending,
    isCompleting: completeAssessment.isPending,
    isResetting: resetAssessment.isPending,
  };
};