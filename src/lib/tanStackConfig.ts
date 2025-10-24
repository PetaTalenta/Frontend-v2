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
      
      // Background refetch interval for real-time data
      refetchInterval: (query) => {
        // Only refetch critical data in background
        if (query.queryKey.includes('stats')) {
          return 2 * 60 * 1000; // 2 minutes for stats
        }
        return false; // Disable for other queries
      },
      
      // Don't refetch in background if tab is not visible
      refetchIntervalInBackground: false,
      
      // Network mode for better offline support
      networkMode: 'online',
      
      // Default error handler
      throwOnError: false,
    },
    mutations: {
      // Retry mutations
      retry: 1,
      
      // Default error handler
      throwOnError: false,
      
      // Network mode for mutations
      networkMode: 'online',
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
  
  // Jobs queries
  jobs: {
    all: ['jobs'] as const,
    list: (params?: any) => [...queryKeys.jobs.all, 'list', params] as const,
    details: (id: string) => [...queryKeys.jobs.all, 'details', id] as const,
    stats: () => [...queryKeys.jobs.all, 'stats'] as const,
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
  
  // Invalidate jobs-related queries
  jobs: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
    list: (params?: any) => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list(params) }),
    details: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.details(id) }),
    stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.stats() }),
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
  
  // Prefetch jobs list
  jobsList: async (params?: any) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.jobs.list(params),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  // Prefetch jobs stats
  jobsStats: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.jobs.stats(),
      staleTime: 3 * 60 * 1000, // 3 minutes
    });
  },
  
  // Prefetch dashboard stats with priority
  dashboardStatsPriority: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      staleTime: 1 * 60 * 1000, // 1 minute for priority data
      gcTime: 5 * 60 * 1000, // 5 minutes cache
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
  
  // Intelligent cache invalidation for dashboard stats
  invalidateDashboardStats: (reason?: string) => {
    console.log(`Invalidating dashboard stats: ${reason || 'manual'}`);
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.stats() });
  },
  
  // Selective cache invalidation based on data type
  invalidateByDataType: (dataType: 'jobs' | 'profile' | 'stats') => {
    switch (dataType) {
      case 'jobs':
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        break;
      case 'profile':
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
        break;
      case 'stats':
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.stats() });
        break;
    }
  },
  
  // Cache warming for better perceived performance
  warmCache: async () => {
    try {
      // Prefetch critical data in parallel
      await Promise.all([
        queryPrefetch.dashboardStatsPriority(),
        queryPrefetch.jobsStats(),
        queryPrefetch.userProfile(),
      ]);
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },
  
  // Get cache statistics for monitoring
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      inactiveQueries: queries.filter(q => !q.getObserversCount()).length,
    };
  },
  
  // Clear stale cache entries
  clearStaleCache: () => {
    const cache = queryClient.getQueryCache();
    const staleQueries = cache.getAll().filter(q => q.isStale());
    
    staleQueries.forEach(query => {
      cache.remove(query);
    });
    
    return staleQueries.length;
  },
} as const;

// Advanced caching strategies for dashboard stats
export const dashboardCacheStrategy = {
  // Preload data when user is likely to need it
  preloadOnUserAction: async (action: 'view_dashboard' | 'refresh_stats') => {
    switch (action) {
      case 'view_dashboard':
        await Promise.all([
          queryPrefetch.dashboardStatsPriority(),
          queryPrefetch.jobsStats(),
        ]);
        break;
      case 'refresh_stats':
        cacheUtils.invalidateDashboardStats('user_refresh');
        await queryPrefetch.dashboardStatsPriority();
        break;
    }
  },
  
  // Smart refetch based on user activity
  smartRefetch: (userActive: boolean) => {
    if (userActive) {
      // More aggressive refetch when user is active
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(),
        refetchType: 'active'
      });
    }
  },
  
  // Background sync for offline support
  backgroundSync: async () => {
    if (navigator.onLine) {
      try {
        await cacheUtils.warmCache();
      } catch (error) {
        console.warn('Background sync failed:', error);
      }
    }
  },
} as const;

export default queryClient;