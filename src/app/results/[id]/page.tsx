'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ResultsPageClient from '../../../components/results/ResultsPageClient';
import apiService from '../../../services/apiService';
import { useResultContext } from '../../../contexts/ResultsContext';

// Results page using shared SWR context
export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = params.id as string;

  const { result, isLoading, error } = useResultContext();
  const [retrying, setRetrying] = useState(false);

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

  if (error || !result) {
    const handleRetry = async () => {
      if (!resultId) return;
      try {
        setRetrying(true);
        const jobIdFromQuery = searchParams?.get('jobId') || null;
        let jobId: string | null = jobIdFromQuery;
        const r: any = result as any;
        if (!jobId) jobId = r?.job_id || r?.jobId || r?.job?.id || null;
        if (!jobId) {
          try {
            // @ts-ignore - apiService is JS
            jobId = await apiService.findJobIdByResultId(resultId);
          } catch (_) {
            jobId = null;
          }
        }
        if (!jobId) {
          alert('Job ID tidak ditemukan untuk hasil ini. Coba lagi nanti.');
          return;
        }
        // @ts-ignore - apiService is JS
        const resp = await apiService.retryAssessmentByJob(jobId);
        if (resp?.success && (resp?.data?.jobId || resp?.data?.id)) {
          alert('Assessment berhasil dikirim ulang! Anda akan diarahkan ke Dashboard.');
          router.push('/dashboard');
        } else {
          const errorMsg = resp?.error?.message || resp?.error || 'Gagal mengirim ulang assessment.';
          alert(errorMsg);
        }
      } catch (e: any) {
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
              {typeof error === 'string' ? error : 'The assessment result you\'re looking for could not be found.'}
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

  // Use the comprehensive ResultsPageClient component with shared data
  return <ResultsPageClient initialResult={result} resultId={resultId} />;
}
