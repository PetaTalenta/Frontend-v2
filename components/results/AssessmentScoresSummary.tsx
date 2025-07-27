'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { AssessmentScores, getScoreInterpretation } from '../../types/assessment-results';
import { getDominantRiasecType, getTopViaStrengths } from '../../utils/assessment-calculations';
import { BarChart3, Brain, Palette, ArrowRight, Grid3X3 } from 'lucide-react';

interface AssessmentScoresSummaryProps {
  scores: AssessmentScores;
  resultId: string;
}

export default function AssessmentScoresSummary({ scores, resultId }: AssessmentScoresSummaryProps) {
  // Get dominant RIASEC type
  const dominantRiasec = getDominantRiasecType(scores.riasec);
  const dominantRiasecScore = scores.riasec[dominantRiasec.primary as keyof typeof scores.riasec];

  // Get highest Big Five trait
  const oceanEntries = Object.entries(scores.ocean).sort(([,a], [,b]) => b - a);
  const topOceanTrait = oceanEntries[0];
  const topOceanScore = topOceanTrait[1];

  // Get top 3 VIA strengths
  const topViaStrengths = getTopViaStrengths(scores.viaIs, 3);

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
            score={topOceanScore}
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

        {/* Combined Grid View Button */}
        <div className="pt-4 border-t border-gray-200">
          <Link href={`/results/${resultId}/combined`}>
            <Button className="w-full mb-3 bg-[#6475e9] hover:bg-[#5a67d8] text-white">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Tampilan Grid 2x2 - Semua Assessment
            </Button>
          </Link>
        </div>

        {/* View Details Button */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href={`/results/${resultId}/riasec`}>
              <Button variant="outline" className="w-full justify-between">
                <span>Detail RIASEC</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/results/${resultId}/ocean`}>
              <Button variant="outline" className="w-full justify-between">
                <span>Detail Big Five</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/results/${resultId}/via`}>
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
