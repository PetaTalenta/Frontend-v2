'use client';

import React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback
function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1e1e1e] mb-2">
                Oops! Terjadi Kesalahan
              </h2>
              <p className="text-[#64707d] mb-4">
                Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba lagi atau kembali ke halaman utama.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left bg-gray-100 p-3 rounded text-sm mb-4">
                  <summary className="cursor-pointer font-medium">Detail Error</summary>
                  <pre className="mt-2 text-xs overflow-auto">{error.message}</pre>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={resetError}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button onClick={() => router.push('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  Beranda
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Data fetch error component
export function DataFetchError({ 
  error, 
  onRetry, 
  title = "Gagal Memuat Data",
  description = "Terjadi kesalahan saat memuat data. Silakan coba lagi."
}: {
  error: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
            <p className="text-red-700 mb-4">{description}</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-100 p-3 rounded text-sm mb-4">
                <summary className="cursor-pointer font-medium">Detail Error</summary>
                <pre className="mt-2 text-xs overflow-auto">{error.message}</pre>
              </details>
            )}
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <DataFetchError
      error={new Error('Network error')}
      onRetry={onRetry}
      title="Koneksi Bermasalah"
      description="Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
    />
  );
}

// Not found error component
export function NotFoundError({ 
  title = "Tidak Ditemukan",
  description = "Halaman atau data yang Anda cari tidak ditemukan.",
  onBack
}: {
  title?: string;
  description?: string;
  onBack?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl mb-4">🔍</div>
            <div>
              <h2 className="text-xl font-semibold text-[#1e1e1e] mb-2">{title}</h2>
              <p className="text-[#64707d] mb-4">{description}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onBack || (() => router.back())}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button onClick={() => router.push('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  Beranda
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline error component
export function InlineError({ 
  error, 
  onRetry,
  className = ""
}: {
  error: Error;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 mb-3">Gagal memuat data</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        )}
      </div>
    </div>
  );
}
