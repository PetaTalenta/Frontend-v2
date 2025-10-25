// @ts-nocheck
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui-card';
import { Badge } from './ui-badge';
import { Progress } from './ui-progress';
import { BarChart3, Brain, Palette, TrendingUp } from 'lucide-react';
import RiasecRadarChart from './RiasecRadarChart';
import OceanRadarChart from './OceanRadarChart';
import ViaRadarChart from './ViaRadarChart';
import {
  RiasecScores,
  ViaScores,
  OceanScores
} from '../../types/assessment-results';
import { useAssessmentResult } from '@/hooks/useAssessmentResult';

interface CombinedAssessmentGridProps {
  scores?: any;
  resultId?: string;
}

function CombinedAssessmentGrid({ scores, resultId }: CombinedAssessmentGridProps) {
  // Get result ID from props
  const assessmentId = resultId || '';
  
  // Use API hook for fetching assessment data
  const { 
    transformedData, 
    isLoading, 
    isError 
  } = useAssessmentResult(assessmentId);
  
  // Extract scores from transformed data or use props
  const assessmentScores = useMemo(() => {
    if (transformedData?.test_data) {
      return {
        riasec: transformedData.test_data.riasec,
        ocean: transformedData.test_data.ocean,
        viaIs: transformedData.test_data.viaIs,
        industryScore: {}
      };
    }
    return scores;
  }, [transformedData, scores]);

  // Helper functions for RIASEC and VIA
  const getDominantRiasecType = (riasec: RiasecScores) => {
    const entries = Object.entries(riasec) as [keyof RiasecScores, number][];
    const sorted = entries.sort(([, a], [, b]) => b - a);
    const primary = sorted[0][0];
    const secondary = sorted[1][0];
    const tertiary = sorted[2][0];
    
    return {
      primary,
      secondary,
      tertiary,
      code: `${primary[0].toUpperCase()}${secondary[0].toUpperCase()}${tertiary[0].toUpperCase()}`
    };
  };

  const getTopViaStrengths = (via: ViaScores, count: number) => {
    const entries = Object.entries(via) as [keyof ViaScores, number][];
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([strength, score]) => ({ strength, score, category: getViaCategory(strength) }));
  };

  const getViaCategory = (strength: keyof ViaScores): string => {
    const VIA_CATEGORIES = {
      'Wisdom & Knowledge': ['creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective'],
      'Courage': ['bravery', 'perseverance', 'honesty', 'zest'],
      'Humanity': ['love', 'kindness', 'socialIntelligence'],
      'Justice': ['teamwork', 'fairness', 'leadership'],
      'Temperance': ['forgiveness', 'humility', 'prudence', 'selfRegulation'],
      'Transcendence': ['appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality']
    };
    
    for (const [category, strengths] of Object.entries(VIA_CATEGORIES)) {
      if (strengths.includes(strength)) {
        return category;
      }
    }
    return 'Other';
  };

  // Get dominant types and top strengths
  const dominantRiasec = useMemo(() => getDominantRiasecType(assessmentScores.riasec), [assessmentScores.riasec]);
  const topViaStrengths = useMemo(() => getTopViaStrengths(assessmentScores.viaIs, 3), [assessmentScores.viaIs]);
  
  // Get highest Big Five trait
  const oceanEntries = useMemo(() => {
    if (!assessmentScores?.ocean) return [];
    return Object.entries(assessmentScores.ocean).sort(([,a], [,b]) => (b as number) - (a as number));
  }, [assessmentScores?.ocean]);
  const topOceanTrait = useMemo(() => oceanEntries[0], [oceanEntries]);
  
  // Calculate overall scores
  const riasecAverage = useMemo(() => {
    if (!assessmentScores?.riasec) return 0;
    return Math.round(
      Object.values(assessmentScores.riasec).reduce((sum, score) => sum + (score as number), 0) / 6
    );
  }, [assessmentScores?.riasec]);
  
  const oceanAverage = useMemo(() => {
    if (!assessmentScores?.ocean) return 0;
    return Math.round(
      Object.values(assessmentScores.ocean).reduce((sum, score) => sum + (score as number), 0) / 5
    );
  }, [assessmentScores?.ocean]);
  
  const viaAverage = useMemo(() => {
    if (!assessmentScores?.viaIs) return 0;
    return Math.round(
      Object.values(assessmentScores.viaIs).reduce((sum, score) => sum + (score as number), 0) / 24
    );
  }, [assessmentScores?.viaIs]);

  const overallScore = useMemo(() => Math.round((riasecAverage + oceanAverage + viaAverage) / 3), [riasecAverage, oceanAverage, viaAverage]);

  // Show loading state while fetching data
  if (isLoading && !scores) {
    return (
      <div className="w-full max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 gap-6 lg:gap-8 h-auto">
          {/* RIASEC Card Skeleton */}
          <Card className="bg-white border-[#eaecf0] h-[600px] lg:h-[750px]">
            <CardHeader className="pb-4 lg:pb-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-2 lg:p-3 bg-[#e7eaff] rounded-lg animate-pulse w-12 h-12"></div>
                <div className="w-32 lg:w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-5 h-[calc(100%-120px)] lg:h-[calc(100%-140px)]">
              <div className="bg-gradient-to-r from-[#6475e9] to-[#4f46e5] text-white rounded-lg p-4 lg:p-6 animate-pulse h-20"></div>
              <div className="h-[280px] -mx-2 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* OCEAN Card Skeleton */}
          <Card className="bg-white border-[#eaecf0] h-[600px]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#e7eaff] rounded-lg animate-pulse w-12 h-12"></div>
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 h-[calc(100%-120px)]">
              <div className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-lg p-4 animate-pulse h-20"></div>
              <div className="h-[280px] -mx-2 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* VIA Card Skeleton */}
          <Card className="bg-white border-[#eaecf0] h-[600px]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#e7eaff] rounded-lg animate-pulse w-12 h-12"></div>
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 h-[calc(100%-120px)]">
              <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg p-4 animate-pulse h-20"></div>
              <div className="h-[280px] -mx-2 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Summary Card Skeleton */}
          <Card className="bg-white border-[#eaecf0] h-[600px]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#e7eaff] rounded-lg animate-pulse w-12 h-12"></div>
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 h-[calc(100%-120px)]">
              <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-lg p-4 animate-pulse h-20"></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-indigo-100 rounded animate-pulse w-48"></div>
                  <div className="h-4 bg-indigo-100 rounded animate-pulse w-64"></div>
                  <div className="h-4 bg-indigo-100 rounded animate-pulse w-56"></div>
                  <div className="h-4 bg-indigo-100 rounded animate-pulse w-52"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && !scores) {
    return (
      <div className="w-full max-w-[1280px] mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Gagal memuat data assessment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    return (
      <div className="w-full max-w-[1280px] mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Data assessment tidak tersedia</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // RIASEC labels
  const riasecLabels = {
    realistic: 'Realistic (R)',
    investigative: 'Investigative (I)',
    artistic: 'Artistic (A)',
    social: 'Social (S)',
    enterprising: 'Enterprising (E)',
    conventional: 'Conventional (C)'
  };

  // OCEAN labels
  const oceanLabels = {
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Neuroticism'
  };

  // VIA strengths labels mapping
  const viaLabels: { [key: string]: string } = {
    creativity: 'Creativity',
    curiosity: 'Curiosity',
    judgment: 'Judgment',
    loveOfLearning: 'Love of Learning',
    perspective: 'Perspective',
    bravery: 'Bravery',
    perseverance: 'Perseverance',
    honesty: 'Honesty',
    zest: 'Zest',
    love: 'Love',
    kindness: 'Kindness',
    socialIntelligence: 'Social Intelligence',
    teamwork: 'Teamwork',
    fairness: 'Fairness',
    leadership: 'Leadership',
    forgiveness: 'Forgiveness',
    humility: 'Humility',
    prudence: 'Prudence',
    selfRegulation: 'Self-Regulation',
    appreciationOfBeauty: 'Appreciation of Beauty',
    gratitude: 'Gratitude',
    hope: 'Hope',
    humor: 'Humor',
    spirituality: 'Spirituality'
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto">
      <div className="grid grid-cols-2 gap-6 lg:gap-8 h-auto">
        {/* RIASEC - Top Left */}
        <Card className="bg-white border-[#eaecf0] h-[600px] lg:h-[750px]">
          <CardHeader className="pb-4 lg:pb-6">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-2 lg:p-3 bg-[#e7eaff] rounded-lg">
                <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-[#6475e9]" />
              </div>
              <div>
                <CardTitle className="text-lg lg:text-xl font-semibold text-[#1e1e1e]">
                  RIASEC Holland Codes
                </CardTitle>
                <p className="text-xs lg:text-sm text-[#64707d]">Tipe Kepribadian Karir</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-5 h-[calc(100%-120px)] lg:h-[calc(100%-140px)] overflow-y-auto">
            {/* Dominant Type Summary */}
            <div className="bg-gradient-to-r from-[#6475e9] to-[#4f46e5] text-white rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base lg:text-lg">Tipe Dominan</h3>
                  <p className="text-lg lg:text-xl font-bold">{dominantRiasec.code}</p>
                  <p className="text-sm lg:text-base opacity-90">
                    {riasecLabels[dominantRiasec.primary as keyof typeof riasecLabels]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl lg:text-3xl font-bold">
                    {assessmentScores.riasec[dominantRiasec.primary as keyof typeof assessmentScores.riasec]}
                  </p>
                  <p className="text-sm lg:text-base opacity-90">Skor</p>
                </div>
              </div>
            </div>

            {/* Mini Radar Chart */}
            <div className="h-[280px] -mx-2">
              <RiasecRadarChart scores={assessmentScores} />
            </div>

            {/* Top 3 RIASEC Scores */}
            <div className="space-y-2">
              {Object.entries(assessmentScores.riasec)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([type, score]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {riasecLabels[type as keyof typeof riasecLabels]}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={score} className="w-16 h-2" />
                      <span className="text-sm font-semibold w-8">{score}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* OCEAN - Top Right */}
        <Card className="bg-white border-[#eaecf0] h-[600px]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#e7eaff] rounded-lg">
                <Brain className="w-5 h-5 text-[#6475e9]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
                  Big Five (OCEAN)
                </CardTitle>
                <p className="text-xs text-[#64707d]">Trait Kepribadian</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 h-[calc(100%-120px)] overflow-y-auto">
            {/* Top Trait Summary */}
            <div className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Trait Tertinggi</h3>
                  <p className="text-lg font-bold">
                    {oceanLabels[topOceanTrait[0] as keyof typeof oceanLabels]}
                  </p>
                  <p className="text-sm opacity-90">Kepribadian Dominan</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{topOceanTrait[1]}</p>
                  <p className="text-sm opacity-90">Skor</p>
                </div>
              </div>
            </div>

            {/* Mini Radar Chart */}
            <div className="h-[280px] -mx-2">
              <OceanRadarChart scores={assessmentScores} />
            </div>

            {/* All OCEAN Scores */}
            <div className="space-y-2">
              {oceanEntries.map(([trait, score]) => (
                <div key={trait} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {oceanLabels[trait as keyof typeof oceanLabels]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={score as number} className="w-16 h-2" />
                    <span className="text-sm font-semibold w-8">{score}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* VIA - Bottom Left */}
        <Card className="bg-white border-[#eaecf0] h-[600px]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#e7eaff] rounded-lg">
                <Palette className="w-5 h-5 text-[#6475e9]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
                  VIA Character Strengths
                </CardTitle>
                <p className="text-xs text-[#64707d]">Kekuatan Karakter</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 h-[calc(100%-120px)] overflow-y-auto">
            {/* Top Strength Summary */}
            <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Kekuatan Utama</h3>
                  <p className="text-lg font-bold">
                    {viaLabels[topViaStrengths[0]?.strength] || topViaStrengths[0]?.strength}
                  </p>
                  <p className="text-sm opacity-90">{topViaStrengths[0]?.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{topViaStrengths[0]?.score}</p>
                  <p className="text-sm opacity-90">Skor</p>
                </div>
              </div>
            </div>

            {/* Mini Radar Chart */}
            <div className="h-[280px] -mx-2">
              <ViaRadarChart scores={assessmentScores} />
            </div>

            {/* Top 5 VIA Strengths */}
            <div className="space-y-2">
              {topViaStrengths.slice(0, 5).map((strength, index) => (
                <div key={strength.strength} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {viaLabels[strength.strength] || strength.strength}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={strength.score} className="w-16 h-2" />
                    <span className="text-sm font-semibold w-8">{strength.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Summary - Bottom Right */}
        <Card className="bg-white border-[#eaecf0] h-[600px]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#e7eaff] rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#6475e9]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
                  Overall Summary
                </CardTitle>
                <p className="text-xs text-[#64707d]">Ringkasan Keseluruhan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 h-[calc(100%-120px)] overflow-y-auto">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-lg p-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Skor Keseluruhan</h3>
                <p className="text-4xl font-bold mb-2">{overallScore}</p>
                <p className="text-sm opacity-90">Rata-rata Assessment</p>
              </div>
            </div>

            {/* Assessment Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#6475e9]" />
                  <span className="text-sm font-medium">RIASEC</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={riasecAverage} className="w-16 h-2" />
                  <span className="text-sm font-semibold w-8">{riasecAverage}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#10b981]" />
                  <span className="text-sm font-medium">OCEAN</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={oceanAverage} className="w-16 h-2" />
                  <span className="text-sm font-semibold w-8">{oceanAverage}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#8b5cf6]" />
                  <span className="text-sm font-medium">VIA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={viaAverage} className="w-16 h-2" />
                  <span className="text-sm font-semibold w-8">{viaAverage}</span>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">
                Key Insights
              </h4>
              <div className="space-y-2 text-xs text-indigo-700">
                <p>• <strong>Karir:</strong> {dominantRiasec.code} - {riasecLabels[dominantRiasec.primary as keyof typeof riasecLabels]}</p>
                <p>• <strong>Kepribadian:</strong> {oceanLabels[topOceanTrait[0] as keyof typeof oceanLabels]} dominan</p>
                <p>• <strong>Kekuatan:</strong> {viaLabels[topViaStrengths[0]?.strength] || topViaStrengths[0]?.strength}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default React.memo(CombinedAssessmentGrid, (prevProps, nextProps) => {
  // Enhanced comparison for optimal performance
  // Compare resultId first as it's most likely to change
  if (prevProps.resultId !== nextProps.resultId) {
    return false;
  }
  
  // Deep comparison for scores if it exists
  if (prevProps.scores !== nextProps.scores) {
    // If both are undefined/null, they're equal
    if (!prevProps.scores && !nextProps.scores) {
      return true;
    }
    // If one is undefined/null, they're different
    if (!prevProps.scores || !nextProps.scores) {
      return false;
    }
    // Compare key score properties for performance
    return (
      prevProps.scores.riasec?.realistic === nextProps.scores.riasec?.realistic &&
      prevProps.scores.riasec?.investigative === nextProps.scores.riasec?.investigative &&
      prevProps.scores.riasec?.artistic === nextProps.scores.riasec?.artistic &&
      prevProps.scores.riasec?.social === nextProps.scores.riasec?.social &&
      prevProps.scores.riasec?.enterprising === nextProps.scores.riasec?.enterprising &&
      prevProps.scores.riasec?.conventional === nextProps.scores.riasec?.conventional &&
      prevProps.scores.ocean?.openness === nextProps.scores.ocean?.openness &&
      prevProps.scores.ocean?.conscientiousness === nextProps.scores.ocean?.conscientiousness &&
      prevProps.scores.ocean?.extraversion === nextProps.scores.ocean?.extraversion &&
      prevProps.scores.ocean?.agreeableness === nextProps.scores.ocean?.agreeableness &&
      prevProps.scores.ocean?.neuroticism === nextProps.scores.ocean?.neuroticism
    );
  }
  
  return true;
});
