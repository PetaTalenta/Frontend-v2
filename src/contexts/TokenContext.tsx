'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const refreshTokenBalance = async () => {
    if (!isAuthenticated) {
      console.log('TokenContext: User not authenticated, clearing token info');
      setTokenInfo(null);
      return;
    }

    console.log('TokenContext: Starting token balance refresh...');
    setIsLoading(true);

    try {
      // Clear any cached data before refreshing
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tokenBalanceCache');
      }

      console.log('TokenContext: Calling checkTokenBalance...');
      const newTokenInfo = await checkTokenBalance();

      console.log('TokenContext: Token balance refresh completed:', {
        balance: newTokenInfo.balance,
        hasEnoughTokens: newTokenInfo.hasEnoughTokens,
        error: newTokenInfo.error,
        lastUpdated: newTokenInfo.lastUpdated
      });

      setTokenInfo(newTokenInfo);

      // Show notification if there was an error
      if (newTokenInfo.error) {
        console.warn('TokenContext: Token balance refresh had errors:', newTokenInfo.message);
      } else {
        console.log('TokenContext: Token balance successfully refreshed');
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
      console.log('TokenContext: Token balance refresh process completed');
    }
  };

  const updateTokenBalance = (newBalance: number) => {
    if (tokenInfo) {
      const updatedTokenInfo: TokenBalanceInfo = {
        ...tokenInfo,
        balance: newBalance,
        hasEnoughTokens: hasEnoughTokensForAssessment(newBalance),
        message: hasEnoughTokensForAssessment(newBalance)
          ? `You have ${newBalance} tokens available.`
          : getInsufficientTokensMessage(newBalance),
        lastUpdated: new Date().toISOString(),
      };
      setTokenInfo(updatedTokenInfo);
      console.log('TokenContext: Token balance manually updated:', updatedTokenInfo);
    }
  };

  // Initialize WebSocket service for token updates
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshTokenBalance();

      // Initialize WebSocket service for real-time token updates
      const initWebSocket = async () => {
        try {
          const { getWebSocketService } = await import('../services/websocket-service');
          const service = getWebSocketService();

          // CRITICAL FIX: Register event listener BEFORE connecting to avoid race condition
          const removeEventListener = service.addEventListener((event) => {
            if (event.type === 'token-balance-updated' && event.metadata?.balance !== undefined) {
              console.log('TokenContext: Received token balance update via WebSocket:', event.metadata.balance);
              updateTokenBalance(event.metadata.balance);
            }
          });

          console.log('TokenContext: Event listener registered (before connect)');

          const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
          if (token) {
            // Check if already connected
            const status = service.getStatus();
            if (!status.isConnected) {
              await service.connect(token);
              console.log('TokenContext: WebSocket connected');
            } else {
              console.log('TokenContext: WebSocket already connected, reusing connection');
            }
            setWsService(service);
            setWsConnected(true);
          }

          // Return cleanup function
          return removeEventListener;
        } catch (error) {
          console.warn('TokenContext: Failed to initialize WebSocket for token updates:', error);
          return undefined;
        }
      };

      let cleanup: (() => void) | undefined;
      initWebSocket().then((cleanupFn) => {
        cleanup = cleanupFn;
      });

      return () => {
        // Only remove event listener, don't disconnect shared WebSocket
        if (cleanup) {
          cleanup();
        }
      };
    } else {
      setTokenInfo(null);
      if (wsService) {
        setWsService(null);
        setWsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsService) {
        wsService.disconnect();
      }
    };
  }, [wsService]);

  const value: TokenContextType = {
    tokenInfo,
    isLoading,
    refreshTokenBalance,
    updateTokenBalance,
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};
