'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatInterface from '../../../../components/chat/ChatInterface';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { getDummyAssessmentResult } from '../../../../data/dummy-assessment-data';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  // Use dummy data instead of API calls
  const dummyResult = getDummyAssessmentResult();
  const isLoading = false;
  const error = null;

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
  if (error || !dummyResult) {
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
        assessmentResult={{
          ...dummyResult,
          // Force ChatInterface context building to focus on persona profile only
          assessment_data: dummyResult.assessment_data, // untouched
          persona_profile: dummyResult.persona_profile,
        }}
        onBack={handleBack}
      />
    </div>
  );
}
