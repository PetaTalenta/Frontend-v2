'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AssessmentScores } from '../../types/assessment-results';
import OceanRadarChart from '../../components/results/OceanRadarChart';
import RiasecRadarChart from '../../components/results/RiasecRadarChart';
import ViaRadarChart from '../../components/results/ViaRadarChart';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function RadarChartsDemoPage() {
  const router = useRouter();

  // Sample assessment data for demonstration
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

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <BarChart3 className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Radar Charts Demo
              </h1>
              <p className="text-gray-600">
                Visualisasi radar chart untuk setiap jenis assessment
              </p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <Card className="bg-white border-gray-200/60 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Tentang Radar Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                Radar charts (spider charts) memberikan visualisasi yang mudah dipahami untuk melihat 
                profil kepribadian dan kekuatan karakter Anda dalam bentuk grafik multi-dimensi.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">OCEAN (Big Five)</h4>
                  <p className="text-blue-700">
                    Menampilkan 5 dimensi kepribadian: Openness, Conscientiousness, 
                    Extraversion, Agreeableness, dan Neuroticism.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">RIASEC Holland</h4>
                  <p className="text-green-700">
                    Menampilkan 6 tipe kepribadian karir: Realistic, Investigative, 
                    Artistic, Social, Enterprising, dan Conventional.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">VIA Character Strengths</h4>
                  <p className="text-purple-700">
                    Menampilkan 6 kategori kekuatan karakter: Wisdom, Courage, 
                    Humanity, Justice, Temperance, dan Transcendence.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Charts Grid */}
        <div className="space-y-8">
          {/* OCEAN Radar Chart */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Big Five Personality (OCEAN) Radar Chart
            </h2>
            <OceanRadarChart scores={sampleScores} />
          </div>

          {/* RIASEC Radar Chart */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              RIASEC Holland Codes Radar Chart
            </h2>
            <RiasecRadarChart scores={sampleScores} />
          </div>

          {/* VIA-IS Radar Chart */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              VIA Character Strengths Radar Chart
            </h2>
            <ViaRadarChart scores={sampleScores} />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Lihat Implementasi di Halaman Detail
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="outline"
                onClick={() => router.push('/radar-demo')}
              >
                Radar Demo Asli
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/assessment')}
                className="bg-[#6475e9] hover:bg-[#5a6bd8]"
              >
                Mulai Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
