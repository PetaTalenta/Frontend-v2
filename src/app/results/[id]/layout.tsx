'use client';

import React, { useEffect } from 'react';
import { ResultsProvider } from '../../../contexts/ResultsContext';
import { usePrefetch } from '../../../hooks/usePrefetch';

export default function ResultsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const resultId = params.id;
  const { prefetchRoutes } = usePrefetch();

  useEffect(() => {
    if (!resultId) return;
    // Prefetch related sub-pages to remove loading between tabs
    prefetchRoutes([
      `/results/${resultId}/riasec`,
      `/results/${resultId}/ocean`,
      `/results/${resultId}/via`,
      `/results/${resultId}/combined`,
    ], { priority: 'high' });
  }, [resultId, prefetchRoutes]);

  return (
    <ResultsProvider resultId={resultId}>
      {children}
    </ResultsProvider>
  );
}

