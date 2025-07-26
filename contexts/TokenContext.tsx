'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TokenBalanceInfo, checkTokenBalance } from '../utils/token-balance';
import { useAuth } from './AuthContext';

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
        hasEnoughTokens: newBalance >= 2,
        message: newBalance >= 2 
          ? `You have ${newBalance} tokens available.`
          : `Insufficient tokens. You have ${newBalance} tokens but need at least 2 to submit an assessment.`,
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

  // Auto-refresh token balance every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshTokenBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
