'use client';

import React, { useEffect, useState } from 'react';
import { AssessmentDataProvider } from '../../../contexts/AssessmentDataContext';
import { Skeleton } from '../../../components/results/ui-skeleton';

export default function ResultsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Resolve params to get the assessment ID
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const resolveParams = async () => {
      setIsLoading(true);
      const p = await params;
      setResolvedParams(p);
      setIsLoading(false);
    };
    resolveParams();
  }, [params]);
  
  // Show loading state while resolving params
  if (isLoading || !resolvedParams?.id) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <AssessmentDataProvider assessmentId={resolvedParams.id}>
      {children}
    </AssessmentDataProvider>
  );
}

