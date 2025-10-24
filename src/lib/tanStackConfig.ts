import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Time in milliseconds that inactive queries will remain in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      
      // Number of times to retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Delay between retries in milliseconds (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount
      refetchOnMount: true,
      
      // Default error handler
      throwOnError: false,
    },
    mutations: {
      // Retry mutations
      retry: 1,
      
      // Default error handler
      throwOnError: false,
    },
  },
});

// Query keys factory for better cache management
export const queryKeys = {
  // Auth queries
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    partialUser: () => [...queryKeys.auth.all, 'partialUser'] as const,
    completeUser: () => [...queryKeys.auth.all, 'completeUser'] as const,
    dataStatus: () => [...queryKeys.auth.all, 'dataStatus'] as const,
  },
  
  // Assessment queries
  assessments: {
    all: ['assessments'] as const,
    results: () => [...queryKeys.assessments.all, 'results'] as const,
    result: (id: string) => [...queryKeys.assessments.results(), id] as const,
    list: () => [...queryKeys.assessments.all, 'list'] as const,
    progress: () => [...queryKeys.assessments.all, 'progress'] as const,
  },
  
  // Profile queries
  profile: {
    all: ['profile'] as const,
    details: () => [...queryKeys.profile.all, 'details'] as const,
    settings: () => [...queryKeys.profile.all, 'settings'] as const,
  },
  
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recent: () => [...queryKeys.dashboard.all, 'recent'] as const,
  },
} as const;

// Query invalidation utilities
export const queryInvalidation = {
  // Invalidate auth-related queries
  auth: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
    profile: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() }),
    user: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() }),
    partialUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.partialUser() }),
    completeUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.completeUser() }),
    dataStatus: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.dataStatus() }),
  },
  
  // Invalidate assessment-related queries
  assessments: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.assessments.all }),
    results: () => queryClient.invalidateQueries({ queryKey: queryKeys.assessments.results() }),
    result: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.assessments.result(id) }),
    list: () => queryClient.invalidateQueries({ queryKey: queryKeys.assessments.list() }),
    progress: () => queryClient.invalidateQueries({ queryKey: queryKeys.assessments.progress() }),
  },
  
  // Invalidate profile-related queries
  profile: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
    details: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.details() }),
    settings: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.settings() }),
  },
  
  // Invalidate dashboard-related queries
  dashboard: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() }),
    recent: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recent() }),
  },
} as const;

// Prefetch utilities for better UX
export const queryPrefetch = {
  // Prefetch assessment results
  assessmentResult: async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.assessments.result(id),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  },
  
  // Prefetch user profile
  userProfile: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.profile(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  // Prefetch complete user data
  completeUserData: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.completeUser(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  // Prefetch dashboard stats
  dashboardStats: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      staleTime: 3 * 60 * 1000, // 3 minutes
    });
  },
} as const;

// Cache utilities for progressive data loading
export const cacheUtils = {
  // Set partial user data
  setPartialUser: (userData: any) => {
    queryClient.setQueryData(queryKeys.auth.partialUser(), userData);
  },
  
  // Get partial user data
  getPartialUser: () => {
    return queryClient.getQueryData(queryKeys.auth.partialUser());
  },
  
  // Set complete user data
  setCompleteUser: (userData: any) => {
    queryClient.setQueryData(queryKeys.auth.completeUser(), userData);
    // Clear partial data when complete data is set
    queryClient.removeQueries({ queryKey: queryKeys.auth.partialUser() });
  },
  
  // Get complete user data
  getCompleteUser: () => {
    return queryClient.getQueryData(queryKeys.auth.completeUser());
  },
  
  // Check if user data is partial
  isUserDataPartial: () => {
    const partialData = queryClient.getQueryData(queryKeys.auth.partialUser());
    const completeData = queryClient.getQueryData(queryKeys.auth.completeUser());
    return partialData && !completeData;
  },
  
  // Merge partial and complete data
  mergeUserData: (partialData: any, completeData: any) => {
    const mergedData = {
      ...partialData,
      ...completeData,
      isPartial: false,
      mergedAt: new Date().toISOString(),
    };
    cacheUtils.setCompleteUser(mergedData);
    return mergedData;
  },
} as const;

export default queryClient;