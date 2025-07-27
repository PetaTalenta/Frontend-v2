'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  CheckCircle,
  Sparkles,
  Clock,
  ArrowRight,
  Target,
  TrendingUp,
  BookOpen,
  User,
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
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Success Header */}
        <div className="text-center space-y-6">
          {/* Success Animation */}
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <div className="relative">
              {/* Main success circle */}
              <div className={`w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
                showCelebration ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}>
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              {/* Celebration sparkles */}
              {showCelebration && (
                <>
                  <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.4s' }}>
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="absolute -top-2 -left-2 animate-bounce" style={{ animationDelay: '0.6s' }}>
                    <Sparkles className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 animate-bounce" style={{ animationDelay: '0.8s' }}>
                    <Sparkles className="w-5 h-5 text-orange-500" />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Assessment Selesai!
            </h1>
            
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Hasil assessment Anda telah siap. Kami akan mengarahkan Anda ke halaman hasil.
            </p>
          </div>
        </div>

        {/* Main Completion Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            
            {/* Persona Result */}
            <div className="text-center space-y-4 py-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Profil Kepribadian Anda
                </h2>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  {personaTitle}
                </h3>
                <p className="text-green-800">
                  Analisis mendalam telah mengidentifikasi karakteristik unik kepribadian Anda
                </p>
              </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">Parameter Dianalisis</p>
                <p className="text-lg font-bold text-blue-700">200+</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Akurasi Analisis</p>
                <p className="text-lg font-bold text-purple-700">95%</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">Waktu Proses</p>
                <p className="text-lg font-bold text-orange-700">{formatTime(processingTime)}</p>
              </div>
            </div>

            {/* Redirect Status */}
            {isRedirecting ? (
              <div className="text-center py-6">
                <div className="flex items-center justify-center gap-3 text-green-700 bg-green-100 rounded-xl px-6 py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Mengarahkan ke halaman hasil...</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Button 
                  onClick={onViewResults}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg shadow-lg"
                >
                  Lihat Hasil Lengkap
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
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
