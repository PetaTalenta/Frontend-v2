'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { AssessmentResult } from '../../../types/assessment-results';
import ResultsPageClient from '../../../components/results/ResultsPageClient';
import { getAssessmentResult } from '../../../services/assessment-api';

// Client-side component for results page
export default function ResultsPage() {
  const params = useParams();
  const resultId = params.id as string;
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ResultsPage: Loading result for ID:', resultId);

    const loadResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const assessmentResult = await getAssessmentResult(resultId);
        console.log('ResultsPage: Result loaded:', assessmentResult);

        if (!assessmentResult) {
          console.log('ResultsPage: No result found for ID:', resultId);
          setError('Assessment result not found');
          return;
        }

        setResult(assessmentResult);
      } catch (err) {
        console.error('ResultsPage: Error loading result:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment result');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Assessment Result Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'The assessment result you\'re looking for could not be found.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-[#6475e9] text-white px-4 py-2 rounded-lg hover:bg-[#5a6bd8]"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/my-results'}
                className="border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                View All Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ResultsPageClient initialResult={result} resultId={resultId} />;
}


