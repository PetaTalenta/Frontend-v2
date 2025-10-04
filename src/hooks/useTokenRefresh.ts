import { useEffect, useRef, useCallback } from 'react';
import tokenService from '../services/tokenService';

/**
 * Return type for useTokenRefresh hook
 */
interface TokenRefreshHook {
  startRefreshTimer: () => void;
  stopRefreshTimer: () => void;
  refreshNow: () => Promise<boolean>;
}

/**
 * Token Refresh Hook for Auth V2 (Firebase)
 * 
 * This hook automatically refreshes Firebase ID tokens in the background to maintain
 * user sessions. Firebase tokens expire after 1 hour (3600 seconds), so this hook:
 * 
 * 1. Checks token status every 5 minutes
 * 2. Refreshes token when it's 50+ minutes old (before expiry)
 * 3. Handles refresh failures gracefully
 * 4. Cleans up interval on unmount
 * 
 * Usage:
 * ```tsx
 * function AuthProvider() {
 *   const { startRefreshTimer, stopRefreshTimer } = useTokenRefresh();
 *   
 *   useEffect(() => {
 *     if (authVersion === 'v2' && user) {
 *       startRefreshTimer();
 *     }
 *     return () => stopRefreshTimer();
 *   }, [authVersion, user]);
 * }
 * ```
 * 
 * @returns TokenRefreshHook { startRefreshTimer, stopRefreshTimer, refreshNow }
 */
const useTokenRefresh = (): TokenRefreshHook => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);

  /**
   * Attempt to refresh the token if needed
   * @returns {Promise<boolean>} true if refresh successful or not needed, false on error
   */
  const attemptRefresh = useCallback(async () => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      console.log('[useTokenRefresh] Refresh already in progress, skipping');
      return true;
    }

    try {
      isRefreshingRef.current = true;

      // Check if we're using Auth V2
      const authVersion = tokenService.getAuthVersion();
      if (authVersion !== 'v2') {
        console.log('[useTokenRefresh] Not using Auth V2, skipping refresh');
        return true;
      }

      // Get token status
      const status = tokenService.getTokenStatus() as any;
      
      // Token doesn't exist or already expired
      if (!status.hasTokens) {
        console.log('[useTokenRefresh] No tokens found, skipping refresh');
        return false;
      }

      if (status.isExpired) {
        console.warn('[useTokenRefresh] Token already expired, user will need to re-login');
        return false;
      }

      // Token is still fresh, no need to refresh yet
      if (!status.needsRefresh) {
        const minutesUntilRefresh = Math.floor(status.timeUntilRefresh / 60);
        console.log(`[useTokenRefresh] Token still fresh (${minutesUntilRefresh} min until refresh needed)`);
        return true;
      }

      // Token needs refresh - do it!
      console.log('[useTokenRefresh] Token needs refresh, attempting...');
      const newIdToken = await tokenService.refreshAuthToken();

      if (newIdToken && typeof newIdToken === 'string') {
        const minutesUntilExpiry = Math.floor(status.timeUntilExpiry / 60);
        console.log(`[useTokenRefresh] ✅ Token refreshed successfully (was ${minutesUntilExpiry} min from expiry)`);
        return true;
      } else {
        console.error('[useTokenRefresh] ❌ Token refresh failed: no token returned');
        return false;
      }

    } catch (error) {
      console.error('[useTokenRefresh] Unexpected error during token refresh:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  /**
   * Start the automatic token refresh timer
   * Checks token status every 5 minutes
   */
  const startRefreshTimer = useCallback(() => {
    // Clear any existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log('[useTokenRefresh] Starting token refresh timer (check every 5 minutes)');

    // Immediate check on start
    attemptRefresh();

    // Set up periodic check every 5 minutes (300,000 ms)
    intervalRef.current = setInterval(() => {
      attemptRefresh();
    }, 5 * 60 * 1000);

  }, [attemptRefresh]);

  /**
   * Stop the automatic token refresh timer
   */
  const stopRefreshTimer = useCallback(() => {
    if (intervalRef.current) {
      console.log('[useTokenRefresh] Stopping token refresh timer');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Manually trigger a token refresh (e.g., before critical operations)
   * @returns {Promise<boolean>} true if successful
   */
  const refreshNow = useCallback(async () => {
    console.log('[useTokenRefresh] Manual refresh requested');
    return await attemptRefresh();
  }, [attemptRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRefreshTimer();
    };
  }, [stopRefreshTimer]);

  return {
    startRefreshTimer,
    stopRefreshTimer,
    refreshNow
  };
};

export default useTokenRefresh;
