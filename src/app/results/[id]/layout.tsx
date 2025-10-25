'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/tanStackConfig';
import authService from '@/services/authService';

export default function ResultsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const queryClient = useQueryClient();
  
  // Resolve params to get the assessment ID
  const [resolvedParams, setResolvedParams] = React.useState<{ id: string } | null>(null);
  
  useEffect(() => {
    const resolveParams = async () => {
      const p = await params;
      setResolvedParams(p);
    };
    resolveParams();
  }, [params]);
  
  useEffect(() => {
    // Prefetch assessment data when layout loads and params are resolved
    if (resolvedParams?.id) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.assessments.result(resolvedParams.id),
        queryFn: () => authService.getAssessmentResult(resolvedParams.id),
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    }
  }, [resolvedParams?.id, queryClient]);
  
  return (
    <div>
      {children}
    </div>
  );
}

