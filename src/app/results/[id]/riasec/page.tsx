'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/results/ui-button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/results/ui-card';
import { Progress } from '../../../../components/results/ui-progress';
import { Badge } from '../../../../components/results/ui-badge';
import { Skeleton } from '../../../../components/results/ui-skeleton';
import { toast } from '../../../../components/results/ui-use-toast';
import { ArrowLeft, BarChart3, Users, Lightbulb, Wrench, Search, Palette } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for RiasecRadarChart to reduce bundle size
const RiasecRadarChart = dynamic(() => import('../../../../components/results/StandardizedRadarCharts').then(mod => ({ default: mod.RiasecRadarChart })), {
  loading: () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false
});
import {
  getScoreInterpretation,
  getDominantRiasecType
} from '../../../../data/dummy-assessment-data';
import { useAssessmentResult } from '../../../../hooks/useAssessmentResult';

export default function RiasecDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const resultId = params.id as string;
  
  // Using real assessment data with useAssessmentResult hook
  const { data: result, isLoading, error } = useAssessmentResult(resultId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{(error as any)?.message || 'Failed to load assessment result'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const riasecScores = result?.data?.test_data?.riasec || {};
  const dominantType = getDominantRiasecType(riasecScores);

  // RIASEC types with detailed information
  const riasecTypes = [
    {
      key: 'realistic',
      name: 'Realistic (R)',
      icon: Wrench,
      color: '#ef4444',
      description: 'Praktis, hands-on, teknis',
      detailedDescription: 'Orang dengan tipe Realistic menyukai aktivitas yang melibatkan manipulasi objek, alat, mesin, atau hewan. Mereka cenderung praktis, stabil, dan menyukai pekerjaan yang konkret dan terukur.',
      characteristics: [
        'Menyukai pekerjaan hands-on dan praktis',
        'Lebih suka bekerja dengan alat dan mesin',
        'Cenderung realistis dan down-to-earth',
        'Menyukai lingkungan kerja yang terstruktur'
      ],
      careers: ['Engineer', 'Teknisi', 'Pilot', 'Arsitek', 'Programmer'],
      score: riasecScores.realistic
    },
    {
      key: 'investigative',
      name: 'Investigative (I)',
      icon: Search,
      color: '#3b82f6',
      description: 'Analitis, penelitian, sains',
      detailedDescription: 'Tipe Investigative menyukai aktivitas yang melibatkan observasi dan investigasi simbolis, sistematis, dan kreatif terhadap fenomena fisik, biologis, dan budaya.',
      characteristics: [
        'Menyukai pemecahan masalah kompleks',
        'Berpikir analitis dan sistematis',
        'Menyukai penelitian dan eksperimen',
        'Cenderung intelektual dan introspektif'
      ],
      careers: ['Scientist', 'Researcher', 'Analyst', 'Doctor', 'Psychologist'],
      score: riasecScores.investigative
    },
    {
      key: 'artistic',
      name: 'Artistic (A)',
      icon: Palette,
      color: '#8b5cf6',
      description: 'Kreatif, ekspresif, inovatif',
      detailedDescription: 'Orang dengan tipe Artistic menyukai aktivitas yang ambigu, bebas, dan tidak sistematis yang memungkinkan ekspresi kreatif dalam berbagai media artistik.',
      characteristics: [
        'Menyukai ekspresi kreatif dan artistik',
        'Berpikir imajinatif dan inovatif',
        'Menyukai kebebasan dalam bekerja',
        'Sensitif terhadap keindahan dan estetika'
      ],
      careers: ['Designer', 'Artist', 'Writer', 'Musician', 'Photographer'],
      score: riasecScores.artistic
    },
    {
      key: 'social',
      name: 'Social (S)',
      icon: Users,
      color: '#10b981',
      description: 'Membantu orang, interpersonal',
      detailedDescription: 'Tipe Social menyukai aktivitas yang melibatkan interaksi dengan orang lain untuk menginformasikan, melatih, mengembangkan, menyembuhkan, atau mencerahkan.',
      characteristics: [
        'Menyukai interaksi dan membantu orang lain',
        'Empati dan kepedulian sosial tinggi',
        'Komunikasi interpersonal yang baik',
        'Menyukai lingkungan kerja yang kooperatif'
      ],
      careers: ['Teacher', 'Counselor', 'Social Worker', 'Nurse', 'HR Manager'],
      score: riasecScores.social
    },
    {
      key: 'enterprising',
      name: 'Enterprising (E)',
      icon: Lightbulb,
      color: '#f59e0b',
      description: 'Kepemimpinan, persuasif, bisnis',
      detailedDescription: 'Orang dengan tipe Enterprising menyukai aktivitas yang melibatkan manipulasi orang lain untuk mencapai tujuan organisasi atau keuntungan ekonomi.',
      characteristics: [
        'Menyukai kepemimpinan dan pengaruh',
        'Berorientasi pada pencapaian dan kompetisi',
        'Kemampuan persuasi dan negosiasi',
        'Menyukai tantangan bisnis dan entrepreneurship'
      ],
      careers: ['Manager', 'Sales Executive', 'Entrepreneur', 'Lawyer', 'Marketing Director'],
      score: riasecScores.enterprising
    },
    {
      key: 'conventional',
      name: 'Conventional (C)',
      icon: BarChart3,
      color: '#6b7280',
      description: 'Terorganisir, detail, administratif',
      detailedDescription: 'Tipe Conventional menyukai aktivitas yang melibatkan manipulasi data yang eksplisit, teratur, dan sistematis untuk berkontribusi pada tujuan organisasi.',
      characteristics: [
        'Menyukai keteraturan dan struktur',
        'Perhatian detail yang tinggi',
        'Kemampuan organisasi dan administrasi',
        'Menyukai prosedur dan sistem yang jelas'
      ],
      careers: ['Accountant', 'Administrator', 'Data Analyst', 'Banker', 'Project Manager'],
      score: riasecScores.conventional
    }
  ];

  // Sort by score (highest first)
  const sortedTypes = [...riasecTypes].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/results/${resultId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Ringkasan
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <BarChart3 className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                RIASEC Holland Codes
              </h1>
              <p className="text-gray-600">
                Detail lengkap tipe kepribadian karir Anda
              </p>
            </div>
          </div>

          {/* Dominant Type Summary */}
          <Card className="bg-gradient-to-r from-[#6475e9] to-[#5a6bd8] text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Tipe Dominan Anda</h2>
                  <p className="text-lg font-semibold">{dominantType.code}</p>
                  <p className="text-white/80">
                    {dominantType.primary.charAt(0).toUpperCase() + dominantType.primary.slice(1)} - {dominantType.secondary.charAt(0).toUpperCase() + dominantType.secondary.slice(1)} - {dominantType.tertiary.charAt(0).toUpperCase() + dominantType.tertiary.slice(1)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{sortedTypes[0].score}</p>
                  <p className="text-white/80">Skor Tertinggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        <div className="mb-8">
          <RiasecRadarChart scores={{
            riasec: result?.data?.test_data?.riasec || {},
            ocean: result?.data?.test_data?.ocean || {},
            viaIs: result?.data?.test_data?.viaIs || {}
          }} />
        </div>

        {/* Detailed RIASEC Types - 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedTypes.map((type, index) => {
            const interpretation = getScoreInterpretation(type.score);
            const Icon = type.icon;

            return (
              <Card key={type.key} className="bg-white border-gray-200 shadow-sm h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">
                        {index + 1}
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: type.color + '20' }}
                      >
                        <Icon className="w-6 h-6" style={{ color: type.color }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: type.color }}>
                        {type.score}
                      </p>
                      <Badge
                        style={{
                          backgroundColor: interpretation.color + '20',
                          color: interpretation.color
                        }}
                        className="font-medium"
                      >
                        {interpretation.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {type.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress
                      value={type.score}
                      className="h-3"
                      style={{
                        '--progress-background': type.color,
                      } as React.CSSProperties}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {type.detailedDescription}
                    </p>
                  </div>

                  {/* Characteristics */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Karakteristik Utama:</h4>
                    <div className="space-y-2">
                      {type.characteristics.map((char, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: type.color }} />
                          <span className="text-sm text-gray-700 leading-relaxed">{char}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Career Examples */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Contoh Karir:</h4>
                    <div className="flex flex-wrap gap-2">
                      {type.careers.map((career, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: type.color + '10',
                            color: type.color,
                            borderColor: type.color + '30'
                          }}
                        >
                          {career}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Back to Summary */}
        <div className="mt-8 text-center">
          <Link href={`/results/${resultId}`}>
            <Button size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Ringkasan Hasil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
