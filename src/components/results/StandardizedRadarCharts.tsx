'use client';

import React from 'react';
import { BarChart3, Brain, Palette } from 'lucide-react';
import { RiasecScores, OceanScores, ViaScores } from '../../types/assessment-results';
import BaseRadarChart, { RadarChartConfig, RadarDataPoint } from './BaseRadarChart';

interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

// VIA Categories for radar chart
const VIA_CATEGORIES = {
  'Wisdom & Knowledge': ['creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective'],
  'Courage': ['bravery', 'perseverance', 'honesty', 'zest'],
  'Humanity': ['love', 'kindness', 'socialIntelligence'],
  'Justice': ['teamwork', 'fairness', 'leadership'],
  'Temperance': ['forgiveness', 'humility', 'prudence', 'selfRegulation'],
  'Transcendence': ['appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality']
};

interface StandardizedRadarChartsProps {
  scores?: AssessmentScores;
  type?: 'riasec' | 'ocean' | 'viais';
  showTabs?: boolean;
}

export default function StandardizedRadarCharts({ scores, type, showTabs = false }: StandardizedRadarChartsProps) {
  // Use provided scores or return null if not available
  const assessmentScores = scores;

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    return (
      <BaseRadarChart
        config={{
          title: 'Data Tidak Tersedia',
          description: 'Data radar chart tidak tersedia. Pastikan assessment telah selesai diproses.',
          color: '#ef4444',
          data: []
        }}
      />
    );
  }

  // RIASEC radar data
  const riasecData: RadarDataPoint[] = [
    {
      category: 'R',
      fullName: 'Realistic',
      score: assessmentScores.riasec.realistic,
      fullMark: 100,
      description: 'Praktis, hands-on, teknis'
    },
    {
      category: 'I',
      fullName: 'Investigative',
      score: assessmentScores.riasec.investigative,
      fullMark: 100,
      description: 'Analitis, penelitian, ilmiah'
    },
    {
      category: 'A',
      fullName: 'Artistic',
      score: assessmentScores.riasec.artistic,
      fullMark: 100,
      description: 'Kreatif, ekspresif, inovatif'
    },
    {
      category: 'S',
      fullName: 'Social',
      score: assessmentScores.riasec.social,
      fullMark: 100,
      description: 'Membantu, mengajar, melayani'
    },
    {
      category: 'E',
      fullName: 'Enterprising',
      score: assessmentScores.riasec.enterprising,
      fullMark: 100,
      description: 'Memimpin, menjual, persuasif'
    },
    {
      category: 'C',
      fullName: 'Conventional',
      score: assessmentScores.riasec.conventional,
      fullMark: 100,
      description: 'Terorganisir, detail, sistematis'
    },
  ];

  // OCEAN radar data
  const oceanData: RadarDataPoint[] = [
    {
      category: 'O',
      fullName: 'Openness',
      score: assessmentScores.ocean.openness,
      fullMark: 100,
      description: 'Keterbukaan terhadap pengalaman baru'
    },
    {
      category: 'C',
      fullName: 'Conscientiousness',
      score: assessmentScores.ocean.conscientiousness,
      fullMark: 100,
      description: 'Kehati-hatian dan kedisiplinan'
    },
    {
      category: 'E',
      fullName: 'Extraversion',
      score: assessmentScores.ocean.extraversion,
      fullMark: 100,
      description: 'Orientasi sosial dan energi'
    },
    {
      category: 'A',
      fullName: 'Agreeableness',
      score: assessmentScores.ocean.agreeableness,
      fullMark: 100,
      description: 'Keramahan dan kerjasama'
    },
    {
      category: 'N',
      fullName: 'Neuroticism',
      score: assessmentScores.ocean.neuroticism,
      fullMark: 100,
      description: 'Stabilitas emosional'
    },
  ];

  // VIA-IS radar data (using top 6 categories)
  const viaCategories = Object.entries(VIA_CATEGORIES);
  const viaisData: RadarDataPoint[] = viaCategories.map(([categoryName, strengths]) => {
    const categoryScore = strengths.reduce((sum, strength) => {
      return sum + (assessmentScores.viaIs[strength as keyof typeof assessmentScores.viaIs] || 0);
    }, 0) / strengths.length;

    return {
      category: categoryName.split(' ')[0], // Use first word as abbreviation
      fullName: categoryName,
      score: Math.round(categoryScore),
      fullMark: 100,
      description: `Kategori ${categoryName.toLowerCase()}`
    };
  });

  // Get radar config based on type
  const getRadarConfig = (radarType: 'riasec' | 'ocean' | 'viais'): RadarChartConfig => {
    switch (radarType) {
      case 'riasec':
        return {
          title: 'RIASEC Analysis',
          description: 'Career interest assessment based on Holland\'s theory',
          color: '#4f46e5',
          data: riasecData,
          icon: <BarChart3 className="w-5 h-5" />,
          showLegend: true,
          showStatistics: true
        };
      case 'ocean':
        return {
          title: 'Big Five Personality',
          description: 'Personality traits assessment (OCEAN model)',
          color: '#059669',
          data: oceanData,
          icon: <Brain className="w-5 h-5" />,
          showLegend: true,
          showStatistics: true
        };
      case 'viais':
        return {
          title: 'Character Strengths',
          description: 'VIA character strengths assessment',
          color: '#dc2626',
          data: viaisData,
          icon: <Palette className="w-5 h-5" />,
          showLegend: true,
          showStatistics: true
        };
      default:
        return {
          title: 'RIASEC Analysis',
          description: 'Career interest assessment based on Holland\'s theory',
          color: '#4f46e5',
          data: riasecData,
          icon: <BarChart3 className="w-5 h-5" />,
          showLegend: true,
          showStatistics: true
        };
    }
  };

  // If specific type is requested, render only that chart
  if (type) {
    const config = getRadarConfig(type);
    return <BaseRadarChart config={config} />;
  }

  // Otherwise, render all charts (for AssessmentRadarChart replacement)
  return (
    <div className="space-y-6">
      <BaseRadarChart config={getRadarConfig('riasec')} />
      <BaseRadarChart config={getRadarConfig('ocean')} />
      <BaseRadarChart config={getRadarConfig('viais')} />
    </div>
  );
}

// Export individual chart components for specific use cases
export const RiasecRadarChart = ({ scores }: { scores?: AssessmentScores }) => (
  <StandardizedRadarCharts scores={scores} type="riasec" />
);

export const OceanRadarChart = ({ scores }: { scores?: AssessmentScores }) => (
  <StandardizedRadarCharts scores={scores} type="ocean" />
);

export const ViaRadarChart = ({ scores }: { scores?: AssessmentScores }) => (
  <StandardizedRadarCharts scores={scores} type="viais" />
);