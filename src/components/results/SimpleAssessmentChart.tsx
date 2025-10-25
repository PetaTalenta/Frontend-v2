'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { RiasecScores, OceanScores, ViaScores } from '../../types/assessment-results';
import RechartsBarChart from './RechartsBarChart';

interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

interface SimpleAssessmentChartProps {
  scores?: AssessmentScores;
}

export default function SimpleAssessmentChart({ scores }: SimpleAssessmentChartProps) {
  // Use provided scores or return null if not available
  const assessmentScores = scores;

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    return (
      <RechartsBarChart
        config={{
          title: 'Data Tidak Tersedia',
          description: 'Data assessment belum lengkap. Silakan selesaikan assessment terlebih dahulu.',
          color: '#ef4444',
          data: [],
          icon: <BarChart3 className="w-5 h-5" />
        }}
      />
    );
  }

  // Prepare RIASEC data
  const riasecData = [
    { label: 'R', value: assessmentScores.riasec.realistic, fullName: 'Realistic' },
    { label: 'I', value: assessmentScores.riasec.investigative, fullName: 'Investigative' },
    { label: 'A', value: assessmentScores.riasec.artistic, fullName: 'Artistic' },
    { label: 'S', value: assessmentScores.riasec.social, fullName: 'Social' },
    { label: 'E', value: assessmentScores.riasec.enterprising, fullName: 'Enterprising' },
    { label: 'C', value: assessmentScores.riasec.conventional, fullName: 'Conventional' }
  ];

  // Prepare OCEAN data
  const oceanData = [
    { label: 'O', value: assessmentScores.ocean.openness, fullName: 'Openness' },
    { label: 'C', value: assessmentScores.ocean.conscientiousness, fullName: 'Conscientiousness' },
    { label: 'E', value: assessmentScores.ocean.extraversion, fullName: 'Extraversion' },
    { label: 'A', value: assessmentScores.ocean.agreeableness, fullName: 'Agreeableness' },
    { label: 'N', value: assessmentScores.ocean.neuroticism, fullName: 'Neuroticism' }
  ];

  // Prepare top VIA strengths
  const viaEntries = Object.entries(assessmentScores.viaIs).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value as number,
    fullName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
  
  // Sort and take top 8 VIA strengths
  const topViaData = viaEntries
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* RIASEC Chart */}
      <RechartsBarChart
        config={{
          title: 'RIASEC Holland Codes',
          description: 'Tipe kepribadian karir berdasarkan teori Holland',
          color: '#3b82f6',
          data: riasecData,
          icon: <BarChart3 className="w-5 h-5" />,
          showLabels: true,
          showGrid: true,
          barSize: 30,
          height: 250
        }}
      />

      {/* OCEAN Chart */}
      <RechartsBarChart
        config={{
          title: 'Big Five Personality Traits',
          description: 'Trait kepribadian berdasarkan model OCEAN',
          color: '#10b981',
          data: oceanData,
          icon: <BarChart3 className="w-5 h-5" />,
          showLabels: true,
          showGrid: true,
          barSize: 30,
          height: 250
        }}
      />

      {/* Top VIA Strengths */}
      <RechartsBarChart
        config={{
          title: 'Top Character Strengths',
          description: '8 kekuatan karakter tertinggi dari assessment VIA-IS',
          color: '#f59e0b',
          data: topViaData,
          icon: <BarChart3 className="w-5 h-5" />,
          showLabels: false,
          showGrid: true,
          barSize: 25,
          height: 300
        }}
      />
    </div>
  );
}
