'use client';

import React from 'react';
import { Card, CardContent } from './ui-card';
import { BarChart3, Trophy, Target, Calendar } from 'lucide-react';
import { RiasecScores, OceanScores, ViaScores } from '../../types/assessment-results';

interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

// Helper functions for score interpretation
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

interface ResultSummaryStatsProps {
  scores?: AssessmentScores;
  // Accept flexible input so we can parse fields like createdAt/created_at/createdAtUtc or nested
  createdAt?: any;
}

// Safe date parsing and formatting helpers
const parseDateFlexible = (input: any): Date | null => {
  const tryParse = (v: any): Date | null => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))) {
      const n = typeof v === 'string' ? Number(v) : v;
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  const direct = tryParse(input);
  if (direct) return direct;
  if (input && typeof input === 'object') {
    const fields = ['createdAt', 'created_at', 'createdAtUtc', 'updated_at', 'updatedAt', 'timestamp'];
    for (const f of fields) {
      const d = tryParse((input as any)[f]);
      if (d) return d;
    }
  }
  return null;
};

const formatDateIDParts = (value: any): { main: string; sub: string } => {
  const d = parseDateFlexible(value);
  if (!d) return { main: '-', sub: '' };
  const main = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const sub = d.toLocaleDateString('id-ID', { year: 'numeric' });
  return { main, sub };
};


export default function ResultSummaryStats({ scores, createdAt }: ResultSummaryStatsProps) {
  // Use provided scores
  const assessmentScores = scores;

  // Ensure scores data exists to prevent errors
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    console.error('ResultSummaryStats: Missing required scores data');
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Data skor tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dominantRiasec = getDominantRiasecType(assessmentScores.riasec);
  const topStrengths = getTopViaStrengths(assessmentScores.viaIs, 3);

  // Calculate overall scores
  const riasecAverage = Math.round(
    Object.values(assessmentScores.riasec).reduce((sum: number, score: number) => sum + score, 0) / 6
  );
  const oceanAverage = Math.round(
    Object.values(assessmentScores.ocean).reduce((sum: number, score: number) => sum + score, 0) / 5
  );
  const viaAverage = Math.round(
    Object.values(assessmentScores.viaIs).reduce((sum: number, score: number) => sum + score, 0) / 24
  );

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = '#6475e9'
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle: string;
    color?: string;
  }) => (
    <Card className="bg-white border-[#eaecf0] hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: color + '20' }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-3xl font-bold text-[#1e1e1e] truncate">
              {value}
            </div>
            <div className="text-base font-medium text-[#1e1e1e] truncate">
              {title}
            </div>
            <div className="text-sm text-[#64707d] truncate">
              {subtitle}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4">
      <StatCard
        icon={BarChart3}
        title="Holland Code"
        value={dominantRiasec.code}
        subtitle={`${dominantRiasec.primary.charAt(0).toUpperCase() + dominantRiasec.primary.slice(1)} dominan`}
        color="#6475e9"
      />

      <StatCard
        icon={Trophy}
        title="Top Strength"
        value={topStrengths[0]?.strength.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()) || 'N/A'}
        subtitle={`Skor: ${topStrengths[0]?.score || 0}`}
        color="#22c55e"
      />

      <StatCard
        icon={Target}
        title="Overall Score"
        value={Math.round((riasecAverage + oceanAverage + viaAverage) / 3)}
        subtitle="Rata-rata semua assessment"
        color="#f59e0b"
      />

      <StatCard
        icon={Calendar}
        title="Assessment Date"
        value={formatDateIDParts(createdAt).main}
        subtitle={formatDateIDParts(createdAt).sub}
        color="#8b5cf6"
      />
    </div>
  );
}
