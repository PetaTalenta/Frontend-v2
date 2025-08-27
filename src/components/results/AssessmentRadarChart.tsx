'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AssessmentScores, VIA_CATEGORIES } from '../../types/assessment-results';
import { BarChart3, AlertCircle } from 'lucide-react';
import { ChartErrorBoundary } from '../ui/chart-error-boundary';

interface AssessmentRadarChartProps {
  scores: AssessmentScores;
}

type RadarType = 'riasec' | 'ocean' | 'viais';

function AssessmentRadarChartComponent({ scores }: AssessmentRadarChartProps) {
  const [activeRadar, setActiveRadar] = useState<RadarType>('riasec');

  // Early return if scores data is not available
  if (!scores || !scores.riasec || !scores.ocean || !scores.viaIs) {
    return (
      <Card className="bg-white border-amber-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Data Tidak Tersedia
              </h3>
              <p className="text-amber-700">
                Data radar chart tidak tersedia. Pastikan assessment telah selesai diproses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // RIASEC radar data
  const riasecData = [
    {
      category: 'R',
      fullName: 'Realistic',
      score: scores.riasec.realistic,
      fullMark: 100,
    },
    {
      category: 'I',
      fullName: 'Investigative',
      score: scores.riasec.investigative,
      fullMark: 100,
    },
    {
      category: 'A',
      fullName: 'Artistic',
      score: scores.riasec.artistic,
      fullMark: 100,
    },
    {
      category: 'S',
      fullName: 'Social',
      score: scores.riasec.social,
      fullMark: 100,
    },
    {
      category: 'E',
      fullName: 'Enterprising',
      score: scores.riasec.enterprising,
      fullMark: 100,
    },
    {
      category: 'C',
      fullName: 'Conventional',
      score: scores.riasec.conventional,
      fullMark: 100,
    },
  ];

  // OCEAN radar data
  const oceanData = [
    {
      category: 'O',
      fullName: 'Openness',
      score: scores.ocean.openness,
      fullMark: 100,
    },
    {
      category: 'C',
      fullName: 'Conscientiousness',
      score: scores.ocean.conscientiousness,
      fullMark: 100,
    },
    {
      category: 'E',
      fullName: 'Extraversion',
      score: scores.ocean.extraversion,
      fullMark: 100,
    },
    {
      category: 'A',
      fullName: 'Agreeableness',
      score: scores.ocean.agreeableness,
      fullMark: 100,
    },
    {
      category: 'N',
      fullName: 'Neuroticism',
      score: scores.ocean.neuroticism,
      fullMark: 100,
    },
  ];

  // VIA-IS radar data (using top 6 categories)
  const viaCategories = Object.entries(VIA_CATEGORIES);
  const viaisData = viaCategories.map(([categoryName, strengths]) => {
    const categoryScore = strengths.reduce((sum, strength) => {
      return sum + (scores.viaIs[strength as keyof typeof scores.viaIs] || 0);
    }, 0) / strengths.length;

    return {
      category: categoryName.split(' ')[0], // Use first word as abbreviation
      fullName: categoryName,
      score: Math.round(categoryScore),
      fullMark: 100,
    };
  });

  // Get current radar data based on active tab
  const getCurrentRadarData = () => {
    switch (activeRadar) {
      case 'riasec':
        return riasecData;
      case 'ocean':
        return oceanData;
      case 'viais':
        return viaisData;
      default:
        return riasecData;
    }
  };

  const currentRadarData = getCurrentRadarData();

  // Get radar info based on active tab
  const getRadarInfo = () => {
    switch (activeRadar) {
      case 'riasec':
        return {
          title: 'RIASEC Analysis',
          description: 'Career interest assessment based on Holland\'s theory',
          color: '#4f46e5'
        };
      case 'ocean':
        return {
          title: 'Big Five Personality',
          description: 'Personality traits assessment (OCEAN model)',
          color: '#059669'
        };
      case 'viais':
        return {
          title: 'Character Strengths',
          description: 'VIA character strengths assessment',
          color: '#dc2626'
        };
      default:
        return {
          title: 'RIASEC Analysis',
          description: 'Career interest assessment based on Holland\'s theory',
          color: '#4f46e5'
        };
    }
  };

  const radarInfo = getRadarInfo();

  const chartConfig = {
    score: {
      label: "Score",
      color: radarInfo.color,
    },
  };

  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${radarInfo.color}10` }}>
              <BarChart3 className="w-5 h-5" style={{ color: radarInfo.color }} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1f2937]">
                {radarInfo.title}
              </CardTitle>
              <p className="text-xs text-[#6b7280]">{radarInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveRadar('riasec')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeRadar === 'riasec'
                ? 'bg-white text-[#4f46e5] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            RIASEC
          </button>
          <button
            onClick={() => setActiveRadar('ocean')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeRadar === 'ocean'
                ? 'bg-white text-[#059669] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            OCEAN
          </button>
          <button
            onClick={() => setActiveRadar('viais')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeRadar === 'viais'
                ? 'bg-white text-[#dc2626] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            VIA-IS
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[450px]">
            <RadarChart data={currentRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => [
                    `${value}`,
                    currentRadarData.find(item => item.category === name)?.fullName || name
                  ]}
                />}
              />
              <PolarGrid
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeOpacity={0.3}
                fill="none"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{
                  fill: '#9ca3af',
                  fontSize: 11,
                  fontWeight: 500
                }}
                tickFormatter={(value) => value}
                className="text-[#9ca3af]"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: '#d1d5db',
                  fontSize: 9
                }}
                tickCount={5}
                axisLine={false}
                className="text-[#d1d5db]"
              />
              <Radar
                dataKey="score"
                stroke={radarInfo.color}
                fill={radarInfo.color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{
                  fill: radarInfo.color,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                  r: 3,
                }}
                activeDot={{
                  fill: radarInfo.color,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                  r: 5,
                }}
              />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* Legend/Summary */}
        <div className="mt-2 space-y-4">
          <div className={`grid gap-2 text-xs ${
            activeRadar === 'viais' ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {currentRadarData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50/50 rounded-md border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-medium text-[#374151] text-xs">{item.category}</span>
                  <span className="text-[#9ca3af] text-[10px]">{item.fullName}</span>
                </div>
                <span className="font-bold text-sm" style={{ color: radarInfo.color }}>{item.score}</span>
              </div>
            ))}
          </div>

          {/* Overall Statistics */}
          <div className="flex items-center justify-between p-4 rounded-lg border"
               style={{
                 background: `linear-gradient(to right, ${radarInfo.color}05, ${radarInfo.color}10)`,
                 borderColor: `${radarInfo.color}20`
               }}>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: radarInfo.color }}>
                {Math.round(currentRadarData.reduce((sum, item) => sum + item.score, 0) / currentRadarData.length)}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Average</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#059669]">
                {Math.max(...currentRadarData.map(item => item.score))}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Highest</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[#dc2626]">
                {currentRadarData.find(item => item.score === Math.max(...currentRadarData.map(i => i.score)))?.fullName}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Strongest</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrap the component with error boundary
export default function AssessmentRadarChart(props: AssessmentRadarChartProps) {
  return (
    <ChartErrorBoundary>
      <AssessmentRadarChartComponent {...props} />
    </ChartErrorBoundary>
  );
}
