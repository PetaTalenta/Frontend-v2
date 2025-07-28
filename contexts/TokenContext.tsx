'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TokenBalanceInfo, checkTokenBalance } from '../utils/token-balance';
import { useAuth } from './AuthContext';
import { useAssessmentWebSocket } from '../hooks/useAssessmentWebSocket';
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

  // Refresh token balance when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshTokenBalance();
    } else {
      setTokenInfo(null);
    }
  }, [isAuthenticated, user]);

  // WebSocket connection for real-time token balance updates
  const {
    isConnected: wsConnected,
    isAuthenticated: wsAuthenticated,
    connect: wsConnect,
    disconnect: wsDisconnect
  } = useAssessmentWebSocket({
    autoConnect: isAuthenticated,
    fallbackToPolling: false, // We'll handle fallback manually
    onAssessmentUpdate: (event) => {
      // Handle token balance updates from WebSocket
      if (event.type === 'token-balance-updated' && event.data?.balance !== undefined) {
        console.log('TokenContext: Received token balance update via WebSocket:', event.data.balance);
        updateTokenBalance(event.data.balance);
      }
    },
    onConnected: () => {
      console.log('TokenContext: WebSocket connected for token updates');
      // Subscribe to token balance updates when connected
      import('../services/websocket-assessment').then(({ getAssessmentWebSocketService }) => {
        const wsService = getAssessmentWebSocketService();
        wsService.subscribeToTokenUpdates();
      });
    },
    onDisconnected: () => {
      console.log('TokenContext: WebSocket disconnected');
    },
    onError: (error) => {
      console.warn('TokenContext: WebSocket error, will use manual refresh only:', error);
    }
  });

  // Fallback: Manual refresh only when WebSocket is not available
  // This replaces the automatic 30-second polling
  useEffect(() => {
    if (!isAuthenticated) return;

    // Only set up fallback polling if WebSocket is not connected after a reasonable time
    const fallbackTimer = setTimeout(() => {
      if (!wsConnected) {
        console.log('TokenContext: WebSocket not available, using manual refresh only');
        // We don't set up automatic polling anymore - user will need to refresh manually
        // or we can trigger refresh on specific user actions
      }
    }, 5000); // Wait 5 seconds for WebSocket to connect

    return () => clearTimeout(fallbackTimer);
  }, [isAuthenticated, wsConnected]);

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
