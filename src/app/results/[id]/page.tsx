'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AssessmentResult } from '../../../types/assessment-results';
import apiService from '../../../services/apiService';
import ResultsPageClient from '../../../components/results/ResultsPageClient';

// Comprehensive results page using ResultsPageClient
export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.log('ResultsPage: Loading result for ID:', resultId);

    const loadResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await apiService.getResultById(resultId);
        const assessmentResult = resp?.success ? resp.data : null;
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
    const handleRetry = async () => {
      if (!resultId) return;
      try {
        setRetrying(true);
        const resp = await apiService.retryAssessment(resultId);
        if (resp?.success && resp?.data?.jobId) {
          // Redirect ke halaman loading/monitoring atau tetap di sini sampai WS redirect
          // Paling aman: arahkan ke halaman dashboard (di sana ada global WS listener),
          // atau bisa ke halaman loading jika tersedia.
          router.push('/dashboard');
        } else {
          alert(resp?.error?.message || 'Gagal mengirim ulang assessment.');
        }
      } catch (e) {
        alert(e?.message || 'Gagal mengirim ulang assessment.');
      } finally {
        setRetrying(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              assessment result not found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'The assessment result you\'re looking for could not be found.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#6475e9] text-white px-4 py-2 rounded-lg hover:bg-[#5a6bd8]"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                {retrying ? 'Submitting…' : 'Submit ulang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use the comprehensive ResultsPageClient component
  return <ResultsPageClient initialResult={result} resultId={resultId} />;
}


