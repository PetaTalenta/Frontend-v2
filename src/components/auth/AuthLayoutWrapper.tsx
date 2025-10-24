'use client';

import React from 'react';
import TokenExpiryWarning from './TokenExpiryWarning';
import OfflineStatusIndicator from './OfflineStatusIndicator';
import { useAuth } from '../../hooks/useAuthWithTanStack';

interface AuthLayoutWrapperProps {
  children: React.ReactNode;
}

const AuthLayoutWrapper: React.FC<AuthLayoutWrapperProps> = ({ children }) => {
  const { logout } = useAuth();

  const handleRefresh = async () => {
    await logout();
  };

  return (
    <>
      {children}
      <TokenExpiryWarning onRefresh={handleRefresh} />
      <OfflineStatusIndicator />
    </>
  );
};

export default AuthLayoutWrapper;