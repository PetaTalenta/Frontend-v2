'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { swrConfig } from '@/lib/swrConfig';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}