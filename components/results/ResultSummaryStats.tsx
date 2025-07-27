'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { AssessmentScores } from '../../types/assessment-results';
import { getDominantRiasecType, getTopViaStrengths } from '../../utils/assessment-calculations';
import { BarChart3, Trophy, Target, Calendar } from 'lucide-react';

interface ResultSummaryStatsProps {
  scores: AssessmentScores;
  createdAt: string;
}

export default function ResultSummaryStats({ scores, createdAt }: ResultSummaryStatsProps) {
  const dominantRiasec = getDominantRiasecType(scores.riasec);
  const topStrengths = getTopViaStrengths(scores.viaIs, 3);
  
  // Calculate overall scores
  const riasecAverage = Math.round(
    Object.values(scores.riasec).reduce((sum, score) => sum + score, 0) / 6
  );
  const oceanAverage = Math.round(
    Object.values(scores.ocean).reduce((sum, score) => sum + score, 0) / 5
  );
  const viaAverage = Math.round(
    Object.values(scores.viaIs).reduce((sum, score) => sum + score, 0) / 24
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
        value={topStrengths[0]?.strength.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || 'N/A'}
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
        value={new Date(createdAt).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short' 
        })}
        subtitle={new Date(createdAt).toLocaleDateString('id-ID', { 
          year: 'numeric' 
        })}
        color="#8b5cf6"
      />
    </div>
  );
}
