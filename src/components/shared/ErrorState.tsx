'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../results/ui-button';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
  showBackButton?: boolean;
}

export const ErrorState = ({ 
  error, 
  onRetry, 
  title = "Terjadi Kesalahan",
  showRetry = true,
  showBackButton = true
}: ErrorStateProps) => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                className="bg-[#6475e9] text-white hover:bg-[#5a6bd8]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            )}
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotFoundState = ({ 
  message = "Halaman yang Anda cari tidak ditemukan.",
  showBackButton = true
}: { 
  message?: string;
  showBackButton?: boolean;
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          {showBackButton && (
            <Button
              onClick={handleBack}
              className="bg-[#6475e9] text-white hover:bg-[#5a6bd8]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;