'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider, useQueryClient as useTanStackQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/tanStackConfig';

interface TanStackProviderProps {
  children: ReactNode;
}

// Provider component for TanStack Query
export function TanStackProvider({ children }: TanStackProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}

// Hook to get the query client instance
export const useQueryClient = useTanStackQueryClient;

export default TanStackProvider;