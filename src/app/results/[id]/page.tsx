'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAssessmentData } from '../../../hooks/useAssessmentData';
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
  const { data: result, loading, error, refetch } = useAssessmentData(resultId);

  // Consistent loading state across all dynamic pages
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Consistent error state with retry functionality
  if (error || !result) {
    return (
      <ErrorState
        error={error || 'Assessment result not found'}
        onRetry={refetch}
        title="Hasil Assessment Tidak Ditemukan"
      />
    );
  }

  // Render the main component with fetched data
  return <ResultsPageClient initialResult={result} resultId={resultId} />;
}
