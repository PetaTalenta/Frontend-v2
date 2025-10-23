'use client';

import React from 'react';
import TokenExpiryWarning from './TokenExpiryWarning';
import OfflineStatusIndicator from './OfflineStatusIndicator';
import { useAuthStore } from '../../stores/useAuthStore';

interface AuthLayoutWrapperProps {
  children: React.ReactNode;
}

const AuthLayoutWrapper: React.FC<AuthLayoutWrapperProps> = ({ children }) => {
  const { refreshToken } = useAuthStore();

  return (
    <>
      {children}
      <TokenExpiryWarning onRefresh={refreshToken} />
      <OfflineStatusIndicator />
    </>
  );
};

export default AuthLayoutWrapper;