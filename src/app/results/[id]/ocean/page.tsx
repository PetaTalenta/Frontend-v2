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
import { VIA_CATEGORIES } from '../../../../data/dummy-assessment-data';
import { ArrowLeft, Brain, Eye, Heart, Zap, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for OceanRadarChart to reduce bundle size
const OceanRadarChart = dynamic(() => import('../../../../components/results/OceanRadarChart'), {
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
  getDummyAssessmentResult,
  getScoreInterpretation as getDummyScoreInterpretation
} from '../../../../data/dummy-assessment-data';

export default function OceanDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Using dummy data instead of context
  const result = getDummyAssessmentResult();
  const isLoading = false;
  const error = null;

  const resultId = params.id as string;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
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
            <p className="text-gray-600 mb-6">{(error as any)?.message || 'Assessment result not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const oceanScores = result.assessment_data.ocean;

  // Big Five traits with detailed information
  const oceanTraits = [
    {
      key: 'openness',
      name: 'Openness to Experience',
      shortName: 'Openness',
      icon: Eye,
      color: '#8b5cf6',
      description: 'Keterbukaan terhadap pengalaman baru',
      detailedDescription: 'Openness mencerminkan sejauh mana seseorang terbuka terhadap pengalaman baru, ide-ide kreatif, dan cara berpikir yang tidak konvensional. Orang dengan skor tinggi cenderung imajinatif, artistik, dan intelektual.',
      highTraits: [
        'Imajinatif dan kreatif',
        'Menyukai pengalaman baru dan variasi',
        'Berpikiran terbuka dan fleksibel',
        'Menyukai seni dan keindahan',
        'Intelektual dan filosofis'
      ],
      lowTraits: [
        'Praktis dan realistis',
        'Menyukai rutinitas dan tradisi',
        'Konservatif dalam berpikir',
        'Fokus pada hal-hal konkret',
        'Lebih suka cara yang sudah terbukti'
      ],
      score: oceanScores.openness
    },
    {
      key: 'conscientiousness',
      name: 'Conscientiousness',
      shortName: 'Conscientiousness',
      icon: CheckCircle,
      color: '#10b981',
      description: 'Kehati-hatian dan kedisiplinan',
      detailedDescription: 'Conscientiousness mengukur tingkat kedisiplinan, keteraturan, dan orientasi pencapaian seseorang. Orang dengan skor tinggi cenderung terorganisir, dapat diandalkan, dan bekerja keras.',
      highTraits: [
        'Terorganisir dan rapi',
        'Disiplin dan dapat diandalkan',
        'Berorientasi pada pencapaian',
        'Perencanaan yang baik',
        'Bertanggung jawab dan teliti'
      ],
      lowTraits: [
        'Spontan dan fleksibel',
        'Santai terhadap aturan',
        'Kurang terorganisir',
        'Lebih impulsif',
        'Fokus pada hal-hal yang menyenangkan'
      ],
      score: oceanScores.conscientiousness
    },
    {
      key: 'extraversion',
      name: 'Extraversion',
      shortName: 'Extraversion',
      icon: Zap,
      color: '#f59e0b',
      description: 'Orientasi sosial dan energi',
      detailedDescription: 'Extraversion mengukur sejauh mana seseorang energik, asertif, dan mencari stimulasi dari dunia luar. Orang dengan skor tinggi cenderung outgoing, ramah, dan menyukai interaksi sosial.',
      highTraits: [
        'Outgoing dan ramah',
        'Energik dan antusias',
        'Asertif dan percaya diri',
        'Menyukai interaksi sosial',
        'Optimis dan positif'
      ],
      lowTraits: [
        'Tenang dan reserved',
        'Lebih suka aktivitas soliter',
        'Reflektif dan introspektif',
        'Hati-hati dalam berinteraksi',
        'Lebih suka kelompok kecil'
      ],
      score: oceanScores.extraversion
    },
    {
      key: 'agreeableness',
      name: 'Agreeableness',
      shortName: 'Agreeableness',
      icon: Heart,
      color: '#ef4444',
      description: 'Keramahan dan kerjasama',
      detailedDescription: 'Agreeableness mencerminkan kecenderungan seseorang untuk kooperatif, percaya, dan peduli terhadap orang lain. Orang dengan skor tinggi cenderung altruistik, empati, dan mudah bergaul.',
      highTraits: [
        'Empati dan peduli',
        'Kooperatif dan mudah bergaul',
        'Percaya pada orang lain',
        'Altruistik dan membantu',
        'Menghindari konflik'
      ],
      lowTraits: [
        'Skeptis dan kritis',
        'Kompetitif dan asertif',
        'Objektif dalam penilaian',
        'Langsung dalam komunikasi',
        'Fokus pada kepentingan sendiri'
      ],
      score: oceanScores.agreeableness
    },
    {
      key: 'neuroticism',
      name: 'Neuroticism',
      shortName: 'Neuroticism',
      icon: Brain,
      color: '#6b7280',
      description: 'Stabilitas emosional (skor tinggi = kurang stabil)',
      detailedDescription: 'Neuroticism mengukur kecenderungan seseorang mengalami emosi negatif seperti kecemasan, depresi, dan kemarahan. Skor rendah menunjukkan stabilitas emosional yang baik.',
      highTraits: [
        'Sensitif terhadap stress',
        'Mudah cemas dan khawatir',
        'Emosional dan reaktif',
        'Rentan terhadap mood negatif',
        'Mudah terpengaruh situasi'
      ],
      lowTraits: [
        'Stabil secara emosional',
        'Tenang dan rileks',
        'Tahan terhadap stress',
        'Optimis dan positif',
        'Tidak mudah terganggu'
      ],
      score: oceanScores.neuroticism
    }
  ];

  // Sort by score (highest first)
  const sortedTraits = [...oceanTraits].sort((a, b) => b.score - a.score);

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
              <Brain className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Big Five Personality Traits
              </h1>
              <p className="text-gray-600">
                Detail lengkap trait kepribadian Anda (OCEAN Model)
              </p>
            </div>
          </div>

          {/* Highest Trait Summary */}
          <Card className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Trait Tertinggi Anda</h2>
                  <p className="text-lg font-semibold">{sortedTraits[0].shortName}</p>
                  <p className="text-white/80">
                    {sortedTraits[0].description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{sortedTraits[0].score}</p>
                  <p className="text-white/80">Skor Tertinggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Visualization */}
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Visualisasi Data</h3>
            </div>
          </div>

          {/* Chart Display */}
          <OceanRadarChart scores={{
            riasec: result.assessment_data.riasec,
            ocean: result.assessment_data.ocean,
            viaIs: result.assessment_data.viaIs,
            industryScore: result.assessment_data.industryScore
          }} />
        </div>

        {/* Detailed Big Five Traits */}
        <div className="space-y-6">
          {sortedTraits.map((trait, index) => {
            const interpretation = getDummyScoreInterpretation(trait.score);
            const Icon = trait.icon;
            const isHigh = trait.score >= 60;
            const relevantTraits = isHigh ? trait.highTraits : trait.lowTraits;

            return (
              <Card key={trait.key} className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">
                        {index + 1}
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: trait.color + '20' }}
                      >
                        <Icon className="w-6 h-6" style={{ color: trait.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          {trait.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{trait.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: trait.color }}>
                        {trait.score}
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
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress
                      value={trait.score}
                      className="h-3"
                      style={{
                        '--progress-background': trait.color,
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
                    <p className="text-gray-700 leading-relaxed">
                      {trait.detailedDescription}
                    </p>
                  </div>

                  {/* Relevant Characteristics */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Karakteristik Anda ({isHigh ? 'Skor Tinggi' : 'Skor Rendah'}):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {relevantTraits.map((char, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: trait.color }} />
                          <span className="text-sm text-gray-700">{char}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interpretation Note */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Catatan:</strong> {
                        trait.key === 'neuroticism'
                          ? isHigh
                            ? "Skor tinggi pada Neuroticism menunjukkan kecenderungan mengalami emosi negatif. Ini normal dan dapat dikelola dengan teknik manajemen stress."
                            : "Skor rendah pada Neuroticism menunjukkan stabilitas emosional yang baik dan ketahanan terhadap stress."
                          : isHigh
                            ? `Skor tinggi pada ${trait.shortName} menunjukkan kekuatan yang dapat Anda manfaatkan dalam berbagai situasi.`
                            : `Skor rendah pada ${trait.shortName} menunjukkan pendekatan yang berbeda namun tetap valid dalam berinteraksi dengan dunia.`
                      }
                    </p>
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
