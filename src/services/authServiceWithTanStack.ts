import authService, {
  LoginData,
  RegisterData,
  UpdateProfileData,
  ProfileResponse,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  LogoutResponse,
  DeleteAccountResponse,
  ApiError
} from './authService';
import { queryClient, queryKeys, queryInvalidation } from '../lib/tanStackConfig';

// Enhanced auth service with TanStack Query integration
class AuthServiceWithTanStack {
  // Login with cache integration
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await authService.login(data);
      
      if (response.success) {
        // Invalidate and refetch user profile after successful login
        queryInvalidation.auth.profile();
        queryInvalidation.auth.user();
        
        // Prefetch dashboard stats for better UX
        this.prefetchUserData();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Register with cache integration
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await authService.register(data);
      
      if (response.success) {
        // Invalidate and refetch user profile after successful registration
        queryInvalidation.auth.profile();
        queryInvalidation.auth.user();
        
        // Prefetch user data for better UX
        this.prefetchUserData();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout with cache cleanup
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await authService.logout();
      
      // Clear all auth-related queries from cache
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
      
      return response;
    } catch (error) {
      // Even if API call fails, clear cache
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.profile.all });
      queryClient.removeQueries({ queryKey: queryKeys.dashboard.all });
      
      throw error;
    }
  }

  // Get profile with TanStack Query integration
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await authService.getProfile();
      
      // Update cache with fresh profile data
      queryClient.setQueryData(queryKeys.auth.profile(), response);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update profile with cache invalidation
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    try {
      const response = await authService.updateProfile(data);
      
      // Invalidate profile queries to trigger refetch
      queryInvalidation.auth.profile();
      queryInvalidation.profile.details();
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete account with complete cache cleanup
  async deleteAccount(): Promise<DeleteAccountResponse> {
    try {
      const response = await authService.deleteAccount();
      
      // Clear all queries from cache
      queryClient.clear();
      
      return response;
    } catch (error) {
      // Even if API call fails, clear cache for security
      queryClient.clear();
      
      throw error;
    }
  }

  // Refresh token with cache preservation
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await authService.refreshToken(refreshToken);
      
      // After successful token refresh, refetch user data
      if (response.success) {
        queryInvalidation.auth.profile();
        queryInvalidation.auth.user();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Check authentication status
  isAuthenticated(): boolean {
    return authService.isAuthenticated();
  }

  // Get current user data
  getCurrentUser() {
    return authService.getCurrentUser();
  }

  // Prefetch user data for better UX
  private async prefetchUserData() {
    try {
      // Prefetch profile data
      await queryClient.prefetchQuery({
        queryKey: queryKeys.auth.profile(),
        queryFn: () => this.getProfile(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      
      // Prefetch dashboard stats
      await queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.stats(),
        staleTime: 3 * 60 * 1000, // 3 minutes
      });
    } catch (error) {
      console.warn('Failed to prefetch user data:', error);
    }
  }

  // Optimistic update helpers
  async optimisticProfileUpdate(data: UpdateProfileData) {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.auth.profile() });
    
    // Snapshot the previous value
    const previousProfile = queryClient.getQueryData(queryKeys.auth.profile());
    
    // Optimistically update to the new value
    queryClient.setQueryData(queryKeys.auth.profile(), (old: any) => {
      if (!old?.data) return old;
      
      return {
        ...old,
        data: {
          ...old.data,
          user: {
            ...old.data.user,
            profile: {
              ...old.data.user.profile,
              ...data,
              updated_at: new Date().toISOString(),
            },
          },
        },
      };
    });
    
    // Return a context object with the snapshotted value
    return { previousProfile };
  }

  // Rollback optimistic update
  rollbackProfileUpdate(context: { previousProfile?: any }) {
    if (context.previousProfile) {
      queryClient.setQueryData(queryKeys.auth.profile(), context.previousProfile);
    }
  }

  // Get cached profile data
  getCachedProfile(): ProfileResponse | undefined {
    return queryClient.getQueryData(queryKeys.auth.profile());
  }

  // Check if profile data is stale
  isProfileStale(): boolean {
    const queryState = queryClient.getQueryState(queryKeys.auth.profile());
    return queryState?.dataUpdatedAt ?
      Date.now() - queryState.dataUpdatedAt > 5 * 60 * 1000 : // 5 minutes
      true;
  }

  // Force refetch profile data
  async refetchProfile() {
    return queryClient.refetchQueries({ queryKey: queryKeys.auth.profile() });
  }
}

// Create singleton instance
const authServiceWithTanStack = new AuthServiceWithTanStack();

// Export service and utilities
export default authServiceWithTanStack;
export { queryKeys, queryInvalidation };