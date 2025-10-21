'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { TokenBalanceInfo, checkTokenBalance } from '../utils/token-balance';
import { useAuth } from './AuthContext';
// Removed useAssessmentWebSocket import - using new consolidated WebSocket service
import { hasEnoughTokensForAssessment, getInsufficientTokensMessage } from '../config/token-config';

interface TokenContextType {
  tokenInfo: TokenBalanceInfo | null;
  isLoading: boolean;
  refreshTokenBalance: () => Promise<void>;
  updateTokenBalance: (newBalance: number) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useToken = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};

interface TokenProviderProps {
  children: ReactNode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const [tokenInfo, setTokenInfo] = useState<TokenBalanceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wsService, setWsService] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // PERFORMANCE FIX: Use useCallback untuk stable function references
  const refreshTokenBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setTokenInfo(null);
      return;
    }

    setIsLoading(true);

    try {
      // ✅ CACHE FIX: Use centralized cache invalidation
      if (typeof window !== 'undefined' && user?.id) {
        try {
          const { invalidateTokenBalanceCache } = await import('../utils/cache-invalidation');
          await invalidateTokenBalanceCache(user.id);
        } catch (error) {
          console.error('TokenContext: Error invalidating cache:', error);
          // Fallback to manual clearing
          localStorage.removeItem(`tokenBalanceCache_${user.id}`);
          localStorage.removeItem('tokenBalanceCache');
        }
      }

      // ✅ CRITICAL FIX: Pass user ID for validation to prevent cross-user data leakage
      const newTokenInfo = await checkTokenBalance(user?.id, true); // Skip cache on manual refresh

      setTokenInfo(newTokenInfo);

      // Show notification if there was an error
      if (newTokenInfo.error) {
        console.warn('TokenContext: Token balance refresh had errors:', newTokenInfo.message);
      }

    } catch (error) {
      console.error('TokenContext: Unexpected error during token balance refresh:', error);
      setTokenInfo({
        balance: -1,
        hasEnoughTokens: false,
        message: 'Unexpected error loading token balance. Please try again.',
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const updateTokenBalance = useCallback((newBalance: number) => {
    setTokenInfo(prevTokenInfo => {
      if (!prevTokenInfo) return prevTokenInfo;

      return {
        ...prevTokenInfo,
        balance: newBalance,
        hasEnoughTokens: hasEnoughTokensForAssessment(newBalance),
        message: hasEnoughTokensForAssessment(newBalance)
          ? `You have ${newBalance} tokens available.`
          : getInsufficientTokensMessage(newBalance),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Initialize WebSocket service for token updates
  // MEMORY LEAK FIX: Proper cleanup dengan isActive flag dan no conflicting useEffect
  useEffect(() => {
    // Early return untuk unauthenticated state
    if (!isAuthenticated || !user) {
      setTokenInfo(null);
      setWsService(null);
      setWsConnected(false);
      return;
    }

    // Refresh token balance on mount
    refreshTokenBalance();

    // Track if component is still mounted
    let isActive = true;
    let cleanupListener: (() => void) | null = null;

    // Initialize WebSocket service for real-time token updates
    const initWebSocket = async () => {
      try {
        const { getWebSocketService } = await import('../services/websocket-service');
        const tokenServiceModule = await import('../services/tokenService');
        const service = getWebSocketService();

        // CRITICAL FIX: Register event listener BEFORE connecting
        cleanupListener = service.addEventListener(async (event) => {
          // Guard against stale closures - only update if component still mounted
          if (!isActive) return;

          if (event.type === 'token-balance-updated' && event.metadata?.balance !== undefined) {
            // ✅ SECURITY FIX: Validate user ID to prevent cross-user updates
            const eventUserId = (event.metadata as any)?.userId;
            if (eventUserId && eventUserId !== user?.id) {
              console.warn('TokenContext: Received token balance update for different user, ignoring', {
                eventUserId,
                currentUserId: user?.id
              });
              return;
            }

            // ✅ CACHE FIX: Invalidate all caches before updating state
            try {
              const { invalidateTokenBalanceCache } = await import('../utils/cache-invalidation');
              await invalidateTokenBalanceCache(user?.id || eventUserId);
            } catch (error) {
              console.error('TokenContext: Error invalidating cache:', error);
            }

            // Update local state after cache invalidation
            updateTokenBalance(event.metadata.balance);
          }
        });

        // ✅ CRITICAL FIX: Use tokenService.getIdToken() instead of hardcoded localStorage
        const token = tokenServiceModule.default.getIdToken();
        if (token && isActive) {
          // Check if already connected
          const status = service.getStatus();
          if (!status.isConnected) {
            await service.connect(token);
          }

          // Only update state if component still mounted
          if (isActive) {
            setWsService(service);
            setWsConnected(true);
          }
        } else {
          console.warn('TokenContext: No token available for WebSocket connection');
        }
      } catch (error) {
        console.warn('TokenContext: Failed to initialize WebSocket for token updates:', error);
      }
    };

    initWebSocket();

    // Cleanup function
    return () => {
      // Mark as inactive to prevent stale closure updates
      isActive = false;

      // Remove event listener (CRITICAL: don't disconnect shared singleton)
      if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
      }

      // Clear local state
      setWsService(null);
      setWsConnected(false);
    };
  }, [isAuthenticated, user, updateTokenBalance]);

  // PERFORMANCE FIX: Memoize context value untuk prevent unnecessary re-renders
  const value: TokenContextType = useMemo(() => ({
    tokenInfo,
    isLoading,
    refreshTokenBalance,
    updateTokenBalance,
  }), [tokenInfo, isLoading, refreshTokenBalance, updateTokenBalance]);

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};
