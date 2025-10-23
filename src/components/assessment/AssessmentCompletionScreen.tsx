'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from './Card';
import {
  CheckCircle,
  Clock,
  BookOpen,
  Loader2
} from 'lucide-react';

interface AssessmentCompletionScreenProps {
  personaTitle?: string;
  processingTime?: number;
  onViewResults?: () => void;
  isRedirecting?: boolean;
  className?: string;
}

export default function AssessmentCompletionScreen({
  personaTitle = "Profil Kepribadian Anda",
  processingTime = 0,
  onViewResults,
  isRedirecting = false,
  className = ''
}: AssessmentCompletionScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Trigger celebration animation after component mounts
    const timer = setTimeout(() => {
      setShowCelebration(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-lg space-y-6">

        {/* Success Header */}
        <div className="text-center space-y-4">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Assessment Selesai
            </h1>

            <p className="text-gray-600 max-w-md mx-auto">
              Hasil assessment Anda telah siap dan akan segera ditampilkan.
            </p>
          </div>
        </div>

        {/* Main Completion Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6 space-y-4">

            {/* Persona Result */}
            <div className="text-center space-y-3">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  {personaTitle}
                </h3>
                <p className="text-sm text-green-800">
                  Profil kepribadian Anda telah berhasil dianalisis
                </p>
              </div>
            </div>

            {/* Processing Time */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Diproses dalam {formatTime(processingTime)}</span>
              </div>
            </div>

            {/* Redirect Message */}
            {isRedirecting && (
              <div className="text-center py-3">
                <div className="flex items-center justify-center gap-3 text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Mengarahkan ke hasil...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What's Next Info */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Apa yang Akan Anda Dapatkan?
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Analisis kepribadian yang mendalam dan akurat
                  </p>
                  <button
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => router.push('/dashboard?refresh=1')}
                  >
                    Lihat Riwayat Assessment
                  </button>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Rekomendasi karir yang sesuai dengan profil Anda
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Saran pengembangan diri yang personal
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Insight tentang kekuatan dan area pengembangan
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
