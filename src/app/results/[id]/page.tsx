'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAssessmentResult } from '../../../hooks/useAssessmentResult';
import { LoadingSkeleton, ErrorState } from '../../../components/shared';

// Dynamic import for ResultsPageClient to improve compilation performance
const ResultsPageClient = dynamic(() => import('../../../components/results/ResultsPageClient'), {
  loading: () => <LoadingSkeleton />,
  ssr: true
});

// Client-Side Rendering Pattern for Dynamic Data
// Used for pages that require user-specific data like assessment results
export default function ResultsPage() {
  const params = useParams();
  const resultId = params.id as string;
  
  // Use custom hook for data fetching with consistent loading/error states
  const { data: result, transformedData, isLoading, error, refetch } = useAssessmentResult(resultId);

  // Consistent loading state across all dynamic pages
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Consistent error state with retry functionality
  if (error || !transformedData) {
    return (
      <ErrorState
        error={typeof error === 'string' ? error : error?.message || 'Assessment result not found'}
        onRetry={refetch}
        title="Hasil Assessment Tidak Ditemukan"
      />
    );
  }

  // Use the transformed data from the hook instead of manual transformation
  return <ResultsPageClient initialResult={transformedData} resultId={resultId} />;
}
