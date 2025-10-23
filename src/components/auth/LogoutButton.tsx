'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'link';
  onClick?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  children = 'Logout', 
  variant = 'button',
  onClick 
}) => {
  const { logout, isLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut || isLoading) return;

    setIsLoggingOut(true);
    
    try {
      await logout();
      
      // Call optional onClick callback
      if (onClick) {
        onClick();
      }
      
      // Redirect to login page
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/auth');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const baseClasses = variant === 'button' 
    ? 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'text-red-600 hover:text-red-800 font-medium text-sm';

  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (variant === 'button') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut || isLoading}
        className={combinedClasses}
      >
        {isLoggingOut || isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging out...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {children}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut || isLoading}
      className={combinedClasses}
    >
      {isLoggingOut || isLoading ? 'Logging out...' : children}
    </button>
  );
};

export default LogoutButton;