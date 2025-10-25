// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './ui-card';
import { Button } from './ui-button';
import { Badge } from './ui-badge';
import { BarChart3, Brain, Palette, ArrowRight } from 'lucide-react';
import { RiasecScores, OceanScores, ViaScores } from '../../types/assessment-results';

interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

// Helper functions for score interpretation
const getScoreInterpretation = (score: number) => {
  if (score >= 80) return { label: 'Very High', color: '#22c55e' };
  if (score >= 70) return { label: 'High', color: '#3b82f6' };
  if (score >= 60) return { label: 'Above Average', color: '#8b5cf6' };
  if (score >= 50) return { label: 'Average', color: '#f59e0b' };
  if (score >= 40) return { label: 'Below Average', color: '#f97316' };
  return { label: 'Low', color: '#ef4444' };
};

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

interface AssessmentScoresSummaryProps {
  scores?: any;
  resultId?: string;
}

export default function AssessmentScoresSummary({ scores, resultId }: AssessmentScoresSummaryProps) {
  // Use provided scores
  const assessmentScores = scores;
  const currentResultId = resultId || '';

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Data ringkasan skor tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get dominant RIASEC type
  const dominantRiasec = getDominantRiasecType(assessmentScores.riasec);
  const dominantRiasecScore = assessmentScores.riasec[dominantRiasec.primary as keyof typeof assessmentScores.riasec];

  // Get highest Big Five trait
  const oceanEntries = Object.entries(assessmentScores.ocean).sort(([,a], [,b]) => b - a);
  const topOceanTrait = oceanEntries[0];
  const topOceanScore = topOceanTrait[1];

  // Get top 3 VIA strengths
  const topViaStrengths = getTopViaStrengths(assessmentScores.viaIs, 3);

  // RIASEC labels mapping
  const riasecLabels: { [key: string]: string } = {
    realistic: 'Realistic (R)',
    investigative: 'Investigative (I)', 
    artistic: 'Artistic (A)',
    social: 'Social (S)',
    enterprising: 'Enterprising (E)',
    conventional: 'Conventional (C)'
  };

  // Big Five labels mapping
  const oceanLabels: { [key: string]: string } = {
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

  const ScoreDisplay = ({ 
    label, 
    score, 
    icon: Icon 
  }: { 
    label: string; 
    score: number; 
    icon: React.ElementType;
  }) => {
    const interpretation = getScoreInterpretation(score);
    
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">Skor: {score}</p>
          </div>
        </div>
        <Badge 
          style={{ 
            backgroundColor: interpretation.color + '20', 
            color: interpretation.color,
            borderColor: interpretation.color + '40'
          }}
          className="font-medium"
        >
          {interpretation.label}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#e7eaff] rounded-lg">
              <BarChart3 className="w-6 h-6 text-[#6475e9]" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-[#1e1e1e]">
                Assessment Overview
              </CardTitle>
              <p className="text-sm text-[#64707d]">
                Ringkasan hasil assessment kepribadian Anda
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* RIASEC Dominant Type */}
        <div>
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6475e9]" />
            RIASEC Holland Code
          </h3>
          <ScoreDisplay
            label={riasecLabels[dominantRiasec.primary]}
            score={dominantRiasecScore}
            icon={BarChart3}
          />
          <div className="mt-2 text-sm text-[#64707d]">
            Tipe kepribadian karir dominan: <span className="font-medium">{dominantRiasec.code}</span>
          </div>
        </div>

        {/* Big Five Top Trait */}
        <div>
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#22c55e]" />
            Big Five Personality
          </h3>
          <ScoreDisplay
            label={oceanLabels[topOceanTrait[0]]}
            score={topOceanScore as number}
            icon={Brain}
          />
          <div className="mt-2 text-sm text-[#64707d]">
            Trait kepribadian tertinggi Anda
          </div>
        </div>

        {/* Top 3 VIA Strengths */}
        <div>
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-3 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#f59e0b]" />
            Character Strengths
          </h3>
          <div className="space-y-3">
            {topViaStrengths.map((strength, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-[#f59e0b] text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {viaLabels[strength.strength] || strength.strength}
                    </p>
                    <p className="text-sm text-gray-500">{strength.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#f59e0b]">{strength.score}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Details Button */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href={`/results/${currentResultId}/riasec`}>
              <Button variant="outline" className="w-full justify-between">
                <span>Detail RIASEC</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/results/${currentResultId}/ocean`}>
              <Button variant="outline" className="w-full justify-between">
                <span>Detail Big Five</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/results/${currentResultId}/via`}>
              <Button variant="outline" className="w-full justify-between">
                <span>Detail VIA</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
