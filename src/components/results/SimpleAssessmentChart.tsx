'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui-card';
import { BarChart3 } from 'lucide-react';
import { AssessmentScores, getDummyAssessmentScores } from '../../data/dummy-assessment-data';

interface SimpleAssessmentChartProps {
  scores?: AssessmentScores;
}

// Simple bar chart component that doesn't rely on external chart libraries
const SimpleBarChart = ({ data, title, color }: {
  data: Array<{ label: string; value: number; fullName?: string }>;
  title: string;
  color: string;
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">{item.fullName || item.label}</span>
              <span className="text-gray-600">{item.value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SimpleAssessmentChart({ scores }: SimpleAssessmentChartProps) {
  // Use dummy data if no scores provided
  const assessmentScores = scores || getDummyAssessmentScores();

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    return (
      <Card className="bg-white border-amber-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="text-amber-600">
              <BarChart3 className="w-8 h-8 mx-auto" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Tidak Tersedia</h3>
              <p className="text-gray-600 text-sm">
                Data assessment belum lengkap. Silakan selesaikan assessment terlebih dahulu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-[#1f2937]">
              Assessment Overview
            </CardTitle>
            <p className="text-xs text-[#6b7280]">
              Ringkasan hasil assessment kepribadian dan minat karir Anda
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* RIASEC Chart */}
        <SimpleBarChart
          data={riasecData}
          title="RIASEC Holland Codes"
          color="#3b82f6"
        />

        {/* OCEAN Chart */}
        <SimpleBarChart
          data={oceanData}
          title="Big Five Personality Traits"
          color="#10b981"
        />

        {/* Top VIA Strengths */}
        <SimpleBarChart
          data={topViaData}
          title="Top Character Strengths"
          color="#f59e0b"
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((riasecData.reduce((sum, item) => sum + item.value, 0) / riasecData.length))}%
            </div>
            <div className="text-sm text-gray-600">RIASEC Avg</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((oceanData.reduce((sum, item) => sum + item.value, 0) / oceanData.length))}%
            </div>
            <div className="text-sm text-gray-600">OCEAN Avg</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
