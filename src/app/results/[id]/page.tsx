'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAssessmentData } from '../../../contexts/AssessmentDataContext';
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
  
  // Use assessment data context for centralized data management
  const { getSpecificData, isLoading, isFetching, error, refresh } = useAssessmentData();
  const transformedData = getSpecificData('all');

  // Consistent loading state across all dynamic pages
  // Show loading while data is being fetched or processed to prevent flash
  if (isLoading || isFetching || (!transformedData && !error)) {
    return <LoadingSkeleton />;
  }

  // Consistent error state with retry functionality
  if (error || !transformedData) {
    return (
      <ErrorState
        error={typeof error === 'string' ? error : error?.message || 'Assessment result not found'}
        onRetry={refresh}
        title="Hasil Assessment Tidak Ditemukan"
      />
    );
  }

  // Use the transformed data from the context instead of manual transformation
  return <ResultsPageClient initialResult={transformedData} resultId={resultId} />;
}
