import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService, {
  LoginData,
  RegisterData,
  UpdateProfileData,
  ProfileResponse,
  ApiError,
  TokenManager
} from '../services/authService';

// Types untuk auth store
interface AuthState {
  // User state
  user: {
    uid: string;
    email: string;
    displayName: string;
  } | null;
  
  // Profile state
  profile: ProfileResponse | null;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Token management
  tokens: {
    idToken: string | null;
    refreshToken: string | null;
    expiryTime: number | null;
  };
  
  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  reset: () => void;
}

// Auth store dengan Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: {
        idToken: null,
        refreshToken: null,
        expiryTime: null,
      },

      // Initialize authentication on app start
      initializeAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          
          if (authService.isAuthenticated()) {
            const userData = authService.getCurrentUser();
            if (userData) {
              set({ 
                user: userData,
                isAuthenticated: true,
                tokens: {
                  idToken: TokenManager.getAccessToken() || null,
                  refreshToken: TokenManager.getRefreshToken() || null,
                  expiryTime: null, // We'll implement this later
                }
              });
              
              // Load profile
              await get().refreshProfile();
            }
          }
        } catch (err) {
          console.error('Error initializing auth:', err);
          set({ error: 'Failed to initialize authentication' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Login action
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.login(data);
          
          if (response.success) {
            const userData = {
              uid: response.data.uid,
              email: response.data.email,
              displayName: response.data.displayName,
            };
            
            set({
              user: userData,
              isAuthenticated: true,
              tokens: {
                idToken: TokenManager.getAccessToken() || null,
                refreshToken: TokenManager.getRefreshToken() || null,
                expiryTime: null,
              }
            });
            
            // Load profile after successful login
            await get().refreshProfile();
          } else {
            set({ error: response.message || 'Login failed' });
          }
        } catch (err) {
          const apiError = err as ApiError;
          set({ error: apiError.message || 'Login failed' });
          throw apiError;
        } finally {
          set({ isLoading: false });
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.register(data);
          
          if (response.success) {
            const userData = {
              uid: response.data.uid,
              email: response.data.email,
              displayName: response.data.displayName,
            };
            
            set({
              user: userData,
              isAuthenticated: true,
              tokens: {
                idToken: TokenManager.getAccessToken() || null,
                refreshToken: TokenManager.getRefreshToken() || null,
                expiryTime: null,
              }
            });
            
            // Load profile after successful registration
            await get().refreshProfile();
          } else {
            set({ error: response.message || 'Registration failed' });
          }
        } catch (err) {
          const apiError = err as ApiError;
          set({ error: apiError.message || 'Registration failed' });
          throw apiError;
        } finally {
          set({ isLoading: false });
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          await authService.logout();
        } catch (err) {
          const apiError = err as ApiError;
          set({ error: apiError.message || 'Logout failed' });
          // Still clear state even if logout API fails
        } finally {
          // Clear auth state
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            tokens: {
              idToken: null,
              refreshToken: null,
              expiryTime: null,
            },
            error: null,
            isLoading: false,
          });
        }
      },

      // Update profile action
      updateProfile: async (data: UpdateProfileData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.updateProfile(data);
          
          if (response) {
            set({ profile: response });
          } else {
            set({ error: 'Profile update failed' });
          }
        } catch (err) {
          const apiError = err as ApiError;
          set({ error: apiError.message || 'Profile update failed' });
          throw apiError;
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh profile action
      refreshProfile: async () => {
        try {
          const profileData = await authService.getProfile();
          set({ profile: profileData });
        } catch (err) {
          const apiError = err as ApiError;
          set({ error: apiError.message || 'Failed to refresh profile' });
          throw apiError;
        }
      },

      // Delete account action
      deleteAccount: async () => {
        set({ isLoading: true, error: null });

        try {
          await authService.deleteAccount();
          
          // Clear auth state after successful deletion
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            tokens: {
              idToken: null,
              refreshToken: null,
              expiryTime: null,
            },
          });
        } catch (err) {
          const apiError = err as ApiError;
          set({ error: apiError.message || 'Account deletion failed' });
          throw apiError;
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh token action
      refreshToken: async () => {
        const refreshTok = TokenManager.getRefreshToken();
        if (!refreshTok) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authService.refreshToken(refreshTok);
          const { idToken, refreshToken: newRefreshToken } = response.data;
          
          set({
            tokens: {
              idToken,
              refreshToken: newRefreshToken,
              expiryTime: null,
            }
          });
        } catch (error) {
          throw error;
        }
      },

      // Clear error action
      clearError: () => {
        set({ error: null });
      },

      // Set loading action
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Reset action
      reset: () => {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tokens: {
            idToken: null,
            refreshToken: null,
            expiryTime: null,
          },
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Use localStorage in browser, fallback to sessionStorage in other environments
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        tokens: state.tokens,
      }),
      // Custom storage version for migration
      version: 1,
      // Migration function to handle state versioning
      migrate: (persistedState: any, version: number) => {
        // If no persisted state, return initial state
        if (!persistedState) {
          return {
            user: null,
            profile: null,
            isAuthenticated: false,
            tokens: {
              idToken: null,
              refreshToken: null,
              expiryTime: null,
            },
          };
        }

        // Handle migration from older versions
        if (version === 0) {
          // Migrate from version 0 to 1
          return {
            ...persistedState,
            // Ensure tokens structure exists
            tokens: persistedState.tokens || {
              idToken: null,
              refreshToken: null,
              expiryTime: null,
            },
            // Ensure other required fields exist
            user: persistedState.user || null,
            profile: persistedState.profile || null,
            isAuthenticated: persistedState.isAuthenticated || false,
          };
        }

        // For current version, ensure all required fields exist
        return {
          user: persistedState.user || null,
          profile: persistedState.profile || null,
          isAuthenticated: persistedState.isAuthenticated || false,
          tokens: persistedState.tokens || {
            idToken: null,
            refreshToken: null,
            expiryTime: null,
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        // Validate rehydrated state
        if (state) {
          // Ensure tokens are valid
          if (!state.tokens) {
            state.tokens = {
              idToken: null,
              refreshToken: null,
              expiryTime: null,
            };
          }
        }
      },
    }
  )
);

// Selectors for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useTokens = () => useAuthStore((state) => state.tokens);