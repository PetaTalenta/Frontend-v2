'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '../../lib/swr-config';

interface SWRProviderProps {
  children: React.ReactNode;
  fallback?: Record<string, any>;
}

export default function SWRProvider({ children, fallback = {} }: SWRProviderProps) {
  return (
    <SWRConfig value={{ ...swrConfig, fallback }}>
      {children}
    </SWRConfig>
  );
}
