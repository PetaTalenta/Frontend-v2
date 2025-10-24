import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import { queryKeys, queryInvalidation } from '../lib/tanStackConfig';
import type { JobsResponse, JobsParams, JobData } from '../types/dashboard';

interface UseJobsOptions {
  params?: JobsParams;
  enabled?: boolean;
}

interface UseJobsReturn {
  data: JobsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useJobs = ({ params = {}, enabled = true }: UseJobsOptions = {}): UseJobsReturn => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => authService.getJobs(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for infinite scroll pagination (if needed in the future)
export const useJobsInfinite = ({ params = {} }: UseJobsOptions = {}) => {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => authService.getJobs(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for getting a single job details
export const useJob = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.jobs.details(id),
    queryFn: () => {
      // This would need to be implemented in authService
      // For now, we'll filter from the list
      return authService.getJobs().then(response => {
        const job = response.data.jobs.find(job => job.id === id);
        if (!job) {
          throw new Error('Job not found');
        }
        return job;
      });
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation for refreshing jobs data
export const useRefreshJobs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: JobsParams) => {
      return authService.getJobs(params);
    },
    onSuccess: (data, variables) => {
      // Update the cache with fresh data
      queryClient.setQueryData(queryKeys.jobs.list(variables), data);
    },
    onError: (error) => {
      console.error('Failed to refresh jobs:', error);
    },
  });
};

// Utility function to format job data for the table
export const formatJobDataForTable = (jobs: JobData[]) => {
  return jobs.map(job => ({
    id: parseInt(job.id, 10) || Math.random(), // Convert string ID to number for compatibility
    archetype: job.archetype || job.assessment_name || 'Unknown',
    created_at: job.created_at,
    status: job.status,
    result_id: job.result_id,
    job_id: job.job_id
  }));
};

// Utility function to get status badge variant
export const getStatusBadgeVariant = (status: string) => {
  const s = String(status).toLowerCase();
  if (s === 'completed') return 'bg-[#d1fadf] text-[#027a48] border border-[#a6f4c5]';
  if (s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress') return 'bg-[#f2f2f2] text-[#666666] border border-[#e0e0e0]';
  if (s === 'failed' || s === 'error') return 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]';
  if (s === 'cancelled' || s === 'canceled') return 'bg-gray-100 text-gray-800 border-gray-200';
  return 'bg-[#f2f2f2] text-[#666666] border border-[#e0e0e0]';
};

// Utility function to get status text in Indonesian
export const getStatusText = (status: string) => {
  const s = String(status).toLowerCase();
  if (s === 'completed') return 'Selesai';
  if (s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress') return 'Sedang Diproses';
  if (s === 'failed' || s === 'error') return 'Gagal';
  if (s === 'cancelled' || s === 'canceled') return 'Dibatalkan';
  return 'Belum Selesai';
};

// Utility function to check if job is processing
export const isJobProcessing = (status: string) => {
  const s = String(status).toLowerCase();
  return s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress';
};

// Utility function to format date/time for table
export const formatDateTimeForTable = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if it's the same day
  const isSameDay = date.toDateString() === now.toDateString();
  
  if (isSameDay) {
    // Show time for same day
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else {
    // Show date for different days
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
};