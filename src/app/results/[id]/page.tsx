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

  // Render main component with fetched data
  // Transform AssessmentResult to AssessmentResultData format if needed
  const transformedResult = result ? {
    id: result.id,
    user_id: 'dummy-user', // Add dummy user_id
    test_data: {
      riasec: result.assessment_data.riasec,
      ocean: result.assessment_data.ocean,
      viaIs: result.assessment_data.viaIs
    },
    test_result: result.persona_profile || {
      archetype: 'Unknown',
      coreMotivators: [],
      learningStyle: 'Unknown',
      shortSummary: 'No summary available',
      strengthSummary: '',
      strengths: [],
      weaknessSummary: '',
      weaknesses: [],
      careerRecommendation: [],
      insights: [],
      skillSuggestion: [],
      possiblePitfalls: [],
      riskTolerance: 'moderate',
      workEnvironment: '',
      roleModel: [],
      developmentActivities: {
        extracurricular: [],
        bookRecommendations: []
      }
    } as any, // Type assertion to handle compatibility
    status: 'completed' as const,
    error_message: null,
    assessment_name: 'Comprehensive Assessment',
    is_public: result.is_public || false,
    created_at: result.created_at || result.createdAt || new Date().toISOString(),
    updated_at: result.created_at || result.createdAt || new Date().toISOString()
  } : null;

  return <ResultsPageClient initialResult={transformedResult || undefined} resultId={resultId} />;
}
