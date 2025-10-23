'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import authService, { TokenManager } from '../../services/authService';

interface TokenExpiryWarningProps {
  warningThreshold?: number; // minutes before expiry to show warning
  onRefresh?: () => Promise<void>;
}

const TokenExpiryWarning: React.FC<TokenExpiryWarningProps> = ({ 
  warningThreshold = 5, 
  onRefresh 
}) => {
  const { user, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const token = TokenManager.getAccessToken();
      if (!token) return;

      try {
        // Decode JWT payload to get expiry time
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // Convert to minutes
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
        
        setTimeRemaining(minutesUntilExpiry);
        
        // Show warning if within threshold
        if (minutesUntilExpiry <= warningThreshold && minutesUntilExpiry > 0) {
          setShowWarning(true);
          setDismissed(false);
        } else if (minutesUntilExpiry <= 0) {
          // Token expired, logout user
          logout();
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
      }
    };

    // Check immediately
    checkTokenExpiry();
    
    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);
    
    return () => clearInterval(interval);
  }, [user, warningThreshold, logout]);

  const handleRefreshToken = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setShowWarning(false);
      setDismissed(true);
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, logout user
      handleLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if logout fails
      window.location.href = '/auth';
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning || dismissed || !user || timeRemaining <= 0) {
    return null;
  }

  const getWarningMessage = () => {
    if (timeRemaining <= 1) {
      return 'Sesi Anda akan berakhir dalam kurang dari 1 menit';
    } else if (timeRemaining <= warningThreshold) {
      return `Sesi Anda akan berakhir dalam ${timeRemaining} menit`;
    }
    return '';
  };

  const getWarningColor = () => {
    if (timeRemaining <= 2) return 'bg-red-50 border-red-200 text-red-800';
    if (timeRemaining <= 5) return 'bg-orange-50 border-orange-200 text-orange-800';
    return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg ${getWarningColor()} transition-all duration-300`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            Peringatan Sesi
          </h3>
          <div className="mt-1 text-sm">
            {getWarningMessage()}
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memperbarui...
                </>
              ) : (
                'Perpanjang Sesi'
              )}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Keluar
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpiryWarning;