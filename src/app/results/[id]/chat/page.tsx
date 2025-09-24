'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AssessmentResult } from '../../../../types/assessment-results';
import apiService from '../../../../services/apiService';
import ChatInterface from '../../../../components/chat/ChatInterface';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../components/ui/alert';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resultId) {
      loadAssessmentResult();
    }
  }, [resultId]);

  const loadAssessmentResult = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resp = await apiService.getResultById(resultId);
      const result = resp?.success ? resp.data : null;

      if (!result) {
        setError('Hasil assessment tidak ditemukan. Pastikan Anda telah menyelesaikan assessment terlebih dahulu.');
        return;
      }

      if (result.status !== 'completed') {
        setError('Assessment belum selesai diproses. Silakan tunggu hingga proses analisis selesai.');
        return;
      }

      setAssessmentResult(result);
    } catch (err) {
      console.error('Failed to load assessment result:', err);
      setError('Gagal memuat hasil assessment. Silakan coba lagi atau kembali ke halaman hasil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/results/${resultId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Memuat Data Assessment
          </h2>
          <p className="text-gray-600">
            Sedang menyiapkan chatbot konselor karir Anda...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !assessmentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              {error || 'Terjadi kesalahan yang tidak diketahui.'}
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Tidak Dapat Mengakses Chatbot
            </h2>
            <p className="text-gray-600">
              Untuk menggunakan fitur chatbot, Anda perlu menyelesaikan assessment terlebih dahulu.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Dashboard
              </Button>
              
              <Button
                onClick={() => router.push('/assessment')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Mulai Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="h-screen flex flex-col">
      <ChatInterface 
        assessmentResult={assessmentResult} 
        onBack={handleBack}
      />
    </div>
  );
}
