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
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes cache
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
  
  // Prefetch assessment results with priority
  assessmentResultPriority: async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.assessments.result(id),
      staleTime: 5 * 60 * 1000, // 5 minutes for priority data
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
  
  // Phase 2: Enhanced prefetch utilities for assessment sub-pages
  assessmentSubPage: async (id: string, type: 'riasec' | 'ocean' | 'via' | 'persona') => {
    await queryClient.prefetchQuery({
      queryKey: [...queryKeys.assessments.result(id), 'type', type],
      staleTime: 20 * 60 * 1000, // 20 minutes for sub-page data
      gcTime: 25 * 60 * 1000, // 25 minutes cache
    });
  },
  
  // Prefetch all assessment sub-pages
  assessmentAllSubPages: async (id: string) => {
    await Promise.all([
      queryPrefetch.assessmentSubPage(id, 'riasec'),
      queryPrefetch.assessmentSubPage(id, 'ocean'),
      queryPrefetch.assessmentSubPage(id, 'via'),
      queryPrefetch.assessmentSubPage(id, 'persona'),
    ]);
  },
  
  // Prefetch assessment data with selective loading
  assessmentSelective: async (id: string, types: ('riasec' | 'ocean' | 'via' | 'persona')[]) => {
    await Promise.all(
      types.map(type => queryPrefetch.assessmentSubPage(id, type))
    );
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

// Phase 2: Advanced caching strategies for assessment data
export const assessmentCacheStrategy = {
  // Preload assessment sub-pages when main data is available
  preloadSubPages: async (assessmentId: string) => {
    await queryPrefetch.assessmentAllSubPages(assessmentId);
  },
  
  // Selective preload based on user behavior patterns
  preloadBasedOnBehavior: async (assessmentId: string, userAction: 'view_main' | 'view_riasec' | 'view_ocean' | 'view_via' | 'view_persona') => {
    switch (userAction) {
      case 'view_main':
        // Preload all sub-pages when viewing main results
        await queryPrefetch.assessmentAllSubPages(assessmentId);
        break;
      case 'view_riasec':
        // Preload related personality data
        await Promise.all([
          queryPrefetch.assessmentSubPage(assessmentId, 'ocean'),
          queryPrefetch.assessmentSubPage(assessmentId, 'persona'),
        ]);
        break;
      case 'view_ocean':
        // Preload related personality data
        await Promise.all([
          queryPrefetch.assessmentSubPage(assessmentId, 'riasec'),
          queryPrefetch.assessmentSubPage(assessmentId, 'via'),
        ]);
        break;
      case 'view_via':
        // Preload character strengths data
        await Promise.all([
          queryPrefetch.assessmentSubPage(assessmentId, 'ocean'),
          queryPrefetch.assessmentSubPage(assessmentId, 'persona'),
        ]);
        break;
      case 'view_persona':
        // Preload all assessment data for career context
        await queryPrefetch.assessmentAllSubPages(assessmentId);
        break;
    }
  },
  
  // Smart cache warming for assessment data
  warmAssessmentCache: async (assessmentId: string) => {
    try {
      await Promise.all([
        queryPrefetch.assessmentResultPriority(assessmentId),
        queryPrefetch.assessmentAllSubPages(assessmentId),
        queryPrefetch.userProfile(),
        queryPrefetch.dashboardStats(),
      ]);
    } catch (error) {
      console.warn('Assessment cache warming failed:', error);
    }
  },
  
  // Background sync for assessment data
  backgroundSyncAssessment: async (assessmentId: string) => {
    if (navigator.onLine) {
      try {
        // Refresh main assessment data if stale
        const queryState = queryClient.getQueryState(queryKeys.assessments.result(assessmentId));
        if (queryState && queryState.dataUpdatedAt) {
          const dataAge = Date.now() - queryState.dataUpdatedAt;
          const staleTime = 15 * 60 * 1000; // 15 minutes
          
          if (dataAge > staleTime) {
            await queryClient.refetchQueries({
              queryKey: queryKeys.assessments.result(assessmentId)
            });
          }
        }
        
        // Prefetch related data
        await queryPrefetch.assessmentAllSubPages(assessmentId);
      } catch (error) {
        console.warn('Assessment background sync failed:', error);
      }
    }
  },
  
  // Selective cache invalidation
  invalidateSelective: (assessmentId: string, dataType?: 'riasec' | 'ocean' | 'via' | 'persona' | 'all') => {
    if (dataType === 'all' || !dataType) {
      // Invalidate all assessment data
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.result(assessmentId) });
    } else {
      // Invalidate specific sub-page data
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.assessments.result(assessmentId), 'type', dataType]
      });
    }
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

// Phase 2: Selective data loading utilities
export const selectiveDataLoader = {
  // Load specific assessment data type with optimized caching
  loadAssessmentType: async (assessmentId: string, type: 'riasec' | 'ocean' | 'via' | 'persona') => {
    const queryKey = [...queryKeys.assessments.result(assessmentId), 'type', type];
    
    // Check if data is already cached
    const cachedData = queryClient.getQueryData(queryKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch and cache the specific data
    const result = await queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        // Get main assessment data first
        const mainData = queryClient.getQueryData(queryKeys.assessments.result(assessmentId)) as any;
        
        // Extract specific data based on type
        switch (type) {
          case 'riasec':
            return mainData?.data?.test_data?.riasec || null;
          case 'ocean':
            return mainData?.data?.test_data?.ocean || null;
          case 'via':
            return mainData?.data?.test_data?.viaIs || null;
          case 'persona':
            return mainData?.data?.test_result || null;
          default:
            return null;
        }
      },
      staleTime: 20 * 60 * 1000, // 20 minutes
      gcTime: 25 * 60 * 1000, // 25 minutes
    });
    
    return result;
  },
  
  // Load multiple assessment types efficiently
  loadMultipleTypes: async (assessmentId: string, types: ('riasec' | 'ocean' | 'via' | 'persona')[]) => {
    const results = await Promise.allSettled(
      types.map(type => selectiveDataLoader.loadAssessmentType(assessmentId, type))
    );
    
    return types.reduce((acc, type, index) => {
      const result = results[index];
      acc[type] = result.status === 'fulfilled' ? result.value : null;
      return acc;
    }, {} as Record<string, any>);
  },
  
  // Check if specific assessment data is cached and fresh
  isDataFresh: (assessmentId: string, type: 'riasec' | 'ocean' | 'via' | 'persona', maxAge: number = 20 * 60 * 1000) => {
    const queryKey = [...queryKeys.assessments.result(assessmentId), 'type', type];
    const queryState = queryClient.getQueryState(queryKey);
    
    if (!queryState || !queryState.dataUpdatedAt) {
      return false;
    }
    
    return Date.now() - queryState.dataUpdatedAt < maxAge;
  },
} as const;

export default queryClient;