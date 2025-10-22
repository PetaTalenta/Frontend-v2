'use client';

import React from 'react';
import { useToken } from '../../contexts/TokenContext';

interface TokenBalanceProps {
  showDetails?: boolean;
  className?: string;
}

export const TokenBalance: React.FC<TokenBalanceProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { tokenInfo, isLoading, refreshTokenBalance } = useToken();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading tokens...</span>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">Token balance unavailable</span>
      </div>
    );
  }

  const getBalanceColor = () => {
    if (tokenInfo.error) return 'text-red-600';
    if (tokenInfo.balance < 2) return 'text-orange-600';
    if (tokenInfo.balance < 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBalanceIcon = () => {
    if (tokenInfo.error) return '⚠️';
    if (tokenInfo.balance < 2) return '🔴';
    if (tokenInfo.balance < 5) return '🟡';
    return '🟢';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-lg">{getBalanceIcon()}</span>
        <span className={`font-semibold ${getBalanceColor()}`}>
          {tokenInfo.error ? '?' : tokenInfo.balance} tokens
        </span>
      </div>
      
      {showDetails && (
        <div className="flex flex-col text-xs text-gray-500">
          <span>{tokenInfo.message}</span>
          {tokenInfo.lastUpdated && (
            <span>Updated: {new Date(tokenInfo.lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      )}

    </div>
  );
};

interface TokenWarningProps {
  onClose?: () => void;
}

export const TokenWarning: React.FC<TokenWarningProps> = ({ onClose }) => {
  const { tokenInfo } = useToken();

  if (!tokenInfo || tokenInfo.hasEnoughTokens || tokenInfo.error) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-orange-500 text-xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-orange-800 font-semibold text-sm">
            Token habis
          </h3>
          <p className="text-orange-700 text-sm mt-1">
            Kamu memiliki {tokenInfo.balance} token. Silahkan beli token untuk melanjutkan.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-orange-400 hover:text-orange-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface TokenSuccessProps {
  message: string;
  onClose?: () => void;
}

export const TokenSuccess: React.FC<TokenSuccessProps> = ({ message, onClose }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-green-500 text-xl">✅</span>
        </div>
        <div className="flex-1">
          <h3 className="text-green-800 font-semibold text-sm">
            Token Transaction Successful
          </h3>
          <p className="text-green-700 text-sm mt-1">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-green-400 hover:text-green-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
