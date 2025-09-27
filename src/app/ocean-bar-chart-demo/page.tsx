'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from '../../components/ui/use-toast';
import { AssessmentResult, AssessmentScores } from '../../types/assessment-results';
import apiService from '../../services/apiService';
import OceanBarChart from '../../components/results/OceanBarChart';
import { ArrowLeft, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

export default function OceanBarChartDemoPage() {
  const router = useRouter();
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sample data as fallback
  const sampleScores: AssessmentScores = {
    riasec: {
      realistic: 65,
      investigative: 85,
      artistic: 78,
      social: 72,
      enterprising: 68,
      conventional: 58,
    },
    ocean: {
      openness: 82,
      conscientiousness: 75,
      extraversion: 68,
      agreeableness: 79,
      neuroticism: 45,
    },
    viaIs: {
      creativity: 88,
      curiosity: 85,
      judgment: 78,
      loveOfLearning: 82,
      perspective: 75,
      bravery: 70,
      perseverance: 85,
      honesty: 88,
      zest: 72,
      love: 75,
      kindness: 82,
      socialIntelligence: 78,
      teamwork: 80,
      fairness: 85,
      leadership: 68,
      forgiveness: 75,
      humility: 70,
      prudence: 72,
      selfRegulation: 68,
      appreciationOfBeauty: 78,
      gratitude: 82,
      hope: 80,
      humor: 75,
      spirituality: 65,
    },
  };

  const loadLatestAssessment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading latest assessment result...');
      const archive = await apiService.getResults({ limit: 1, status: 'completed', sort: 'created_at', order: 'DESC' });
      const resultResp = archive?.data?.results?.[0] ? await apiService.getResultById(archive.data.results[0].id) : null;
      const result = resultResp?.success ? resultResp.data : null;

      if (result) {
        setLatestResult(result);
        console.log('Latest assessment loaded:', result.id);
        const created = (result as any)?.created_at || (result as any)?.createdAt;
        toast({
          title: "Data Terbaru Dimuat",
          description: `Assessment terbaru dari ${created ? new Date(created).toLocaleDateString('id-ID') : '-'}`,
        });
      } else {
        console.log('No latest assessment found, using sample data');
        setLatestResult(null);
        toast({
          title: "Menggunakan Data Sample",
          description: "Tidak ada assessment terbaru, menampilkan data contoh",
          variant: "default",
        });
      }
    } catch (err) {
      console.error('Error loading latest assessment:', err);
      setError('Gagal memuat data assessment terbaru');
      toast({
        title: "Error",
        description: "Gagal memuat data assessment terbaru",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestAssessment();
  }, []);

  const displayScores = latestResult?.assessment_data || sampleScores;
  const isUsingLatestData = !!latestResult;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadLatestAssessment}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <BarChart3 className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                OCEAN Bar Chart Demo
              </h1>
              <p className="text-gray-600">
                Visualisasi bar chart untuk Big Five personality traits (OPNS, CONS, EXTN, AGRS, NESM)
              </p>
            </div>
          </div>

          {/* Data Source Info */}
          <Card className={`mb-6 ${isUsingLatestData ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {isUsingLatestData ? (
                  <>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">
                        Menggunakan Data Assessment Terbaru
                      </p>
                      <p className="text-sm text-green-700">
                        Assessment ID: {latestResult?.id} | 
                        Dibuat: {(() => {
                          const created = (latestResult as any)?.created_at || (latestResult as any)?.createdAt;
                          return created ? new Date(created).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-';
                        })()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Menggunakan Data Sample
                      </p>
                      <p className="text-sm text-blue-700">
                        Tidak ada assessment terbaru ditemukan. Menampilkan data contoh untuk demonstrasi.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OCEAN Bar Chart */}
        <div className="mb-8">
          <OceanBarChart scores={displayScores} />
        </div>

        {/* Additional Info */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Tentang OCEAN Bar Chart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Singkatan Traits:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>OPNS</strong> - Openness: Keterbukaan terhadap pengalaman baru</li>
                <li><strong>CONS</strong> - Conscientiousness: Kehati-hatian dan kedisiplinan</li>
                <li><strong>EXTN</strong> - Extraversion: Orientasi sosial dan energi</li>
                <li><strong>AGRS</strong> - Agreeableness: Keramahan dan kerjasama</li>
                <li><strong>NESM</strong> - Neuroticism: Stabilitas emosional</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Fitur Chart:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Visualisasi bar chart interaktif dengan tooltip detail</li>
                <li>• Warna berbeda untuk setiap trait personality</li>
                <li>• Statistik ringkasan (rata-rata, skor tertinggi, trait terkuat)</li>
                <li>• Detail lengkap setiap trait dengan interpretasi level</li>
                <li>• Responsif untuk berbagai ukuran layar</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
