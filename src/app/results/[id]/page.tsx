'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ResultsPageClient from '../../../components/results/ResultsPageClient';
import { getDummyAssessmentResult } from '../../../data/dummy-assessment-data';

// Results page using dummy data
export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  // Use dummy data instead of context
  const dummyResult = getDummyAssessmentResult();
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  if (error || !dummyResult) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              assessment result not found
            </h1>
            <p className="text-gray-600 mb-6">
              {typeof error === 'string' ? error : 'The assessment result you\'re looking for could not be found.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#6475e9] text-white px-4 py-2 rounded-lg hover:bg-[#5a6bd8]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use the comprehensive ResultsPageClient component with dummy data
  return <ResultsPageClient initialResult={dummyResult} resultId={resultId} />;
}
