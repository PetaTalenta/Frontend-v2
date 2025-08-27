'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AssessmentScores } from '../../types/assessment-results';
import VisualSummary from '../../components/results/VisualSummary';
import { ArrowLeft, CheckCircle, XCircle, Target, TrendingUp } from 'lucide-react';

export default function TalentProfileDemoPage() {
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
              <Target className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Talent Profile Summary - Perbaikan
              </h1>
              <p className="text-gray-600">
                Perbandingan sebelum dan sesudah perbaikan untuk alignment dengan tujuan projek
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Before */}
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg text-red-900">Sebelum Perbaikan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Performance Summary (Life Areas)</h4>
                  <ul className="space-y-1 text-red-700">
                    <li>• <strong>HOME:</strong> Hubungan keluarga dan kehidupan pribadi</li>
                    <li>• <strong>HABITS:</strong> Kedisiplinan dan pengaturan diri</li>
                    <li>• <strong>WORK:</strong> Kesesuaian dan efektivitas karir</li>
                    <li>• <strong>SOCIAL:</strong> Hubungan sosial dan keterlibatan komunitas</li>
                  </ul>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <p className="text-xs text-red-800">
                    <strong>Masalah:</strong> Fokus pada life areas yang luas, tidak sejalan dengan tujuan 
                    "AI-Driven Talent Mapping Assessment" yang seharusnya fokus pada talent dan karir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* After */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg text-green-900">Setelah Perbaikan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Talent Profile Summary (Career Competencies)</h4>
                  <ul className="space-y-1 text-green-700">
                    <li>• <strong>TECHNICAL:</strong> Kemampuan teknis, analitis, dan penelitian</li>
                    <li>• <strong>CREATIVE:</strong> Kemampuan kreatif, inovatif, dan artistik</li>
                    <li>• <strong>LEADERSHIP:</strong> Kemampuan memimpin, mengelola, dan berwirausaha</li>
                    <li>• <strong>INTERPERSONAL:</strong> Kemampuan berinteraksi, berkomunikasi, dan bekerja sama</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Solusi:</strong> Fokus pada career competencies yang sejalan dengan tujuan talent mapping, 
                    konsisten dengan RIASEC assessment, dan memberikan insight karir yang actionable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Improvements */}
        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Perbaikan Utama</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">1. Alignment dengan Tujuan Projek</h4>
                <ul className="space-y-2 text-blue-700">
                  <li>✅ Fokus pada talent mapping dan pengembangan karir</li>
                  <li>✅ Konsisten dengan RIASEC Holland codes</li>
                  <li>✅ Memberikan insight yang actionable untuk karir</li>
                  <li>✅ Selaras dengan radar chart yang sudah ada</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">2. Peningkatan User Experience</h4>
                <ul className="space-y-2 text-blue-700">
                  <li>✅ Terminologi yang lebih profesional</li>
                  <li>✅ Mapping ke RIASEC codes yang jelas</li>
                  <li>✅ Rekomendasi pengembangan yang spesifik</li>
                  <li>✅ Insight yang relevan untuk career planning</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Demo: Talent Profile Summary (Setelah Perbaikan)
          </h2>
          <VisualSummary scores={sampleScores} />
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Lihat Implementasi Lainnya
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="outline"
                onClick={() => router.push('/radar-charts-demo')}
              >
                Radar Charts Demo
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/results')}
              >
                Hasil Assessment
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-[#6475e9] hover:bg-[#5a6bd8]"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
