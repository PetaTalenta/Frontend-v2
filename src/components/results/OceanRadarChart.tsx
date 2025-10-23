'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Brain } from 'lucide-react';
import { AssessmentScores, getDummyAssessmentScores } from '../../data/dummy-assessment-data';

interface OceanRadarChartProps {
  scores?: AssessmentScores;
}

function OceanRadarChartComponent({ scores }: OceanRadarChartProps) {
  // Use dummy data if no scores provided
  const assessmentScores = scores || getDummyAssessmentScores();

  // Transform OCEAN scores for radar chart
  const radarData = [
    {
      category: 'O',
      fullName: 'Openness',
      description: 'Keterbukaan terhadap pengalaman baru',
      score: assessmentScores.ocean.openness,
      fullMark: 100,
    },
    {
      category: 'C',
      fullName: 'Conscientiousness',
      description: 'Kehati-hatian dan kedisiplinan',
      score: assessmentScores.ocean.conscientiousness,
      fullMark: 100,
    },
    {
      category: 'E',
      fullName: 'Extraversion',
      description: 'Orientasi sosial dan energi',
      score: assessmentScores.ocean.extraversion,
      fullMark: 100,
    },
    {
      category: 'A',
      fullName: 'Agreeableness',
      description: 'Keramahan dan kerjasama',
      score: assessmentScores.ocean.agreeableness,
      fullMark: 100,
    },
    {
      category: 'N',
      fullName: 'Neuroticism',
      description: 'Stabilitas emosional',
      score: assessmentScores.ocean.neuroticism,
      fullMark: 100,
    },
  ];

  const chartConfig = {
    score: {
      label: "Score",
      color: "#6366f1",
    },
  };

  // Calculate statistics
  const averageScore = Math.round(radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length);
  const highestScore = Math.max(...radarData.map(item => item.score));
  const strongestTrait = radarData.find(item => item.score === highestScore);

  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#6366f1]/10 rounded-lg">
            <Brain className="w-5 h-5 text-[#6366f1]" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-[#1f2937]">
              Big Five Personality Radar
            </CardTitle>
            <p className="text-xs text-[#6b7280]">Visualisasi trait kepribadian OCEAN model</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                hideLabel
                formatter={(value, name) => {
                  const item = radarData.find(item => item.category === name);
                  return [
                    `${value}%`,
                    item ? `${item.fullName} - ${item.description}` : name
                  ];
                }}
              />}
            />
            <PolarGrid
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeOpacity={0.4}
              fill="none"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="category"
              tick={{
                fill: '#374151',
                fontSize: 12,
                fontWeight: 600
              }}
              tickFormatter={(value) => value}
              className="text-[#374151]"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: '#9ca3af',
                fontSize: 10
              }}
              tickCount={6}
              axisLine={false}
              className="text-[#9ca3af]"
            />
            <Radar
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.15}
              strokeWidth={2.5}
              dot={{
                fill: '#6366f1',
                strokeWidth: 2,
                stroke: '#ffffff',
                r: 4,
              }}
              activeDot={{
                fill: '#6366f1',
                strokeWidth: 3,
                stroke: '#ffffff',
                r: 6,
              }}
            />
          </RadarChart>
        </ChartContainer>
        
        {/* Legend/Summary */}
        <div className="mt-4 space-y-4">
          {/* Trait Details */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            {radarData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                    <span className="font-bold text-[#6366f1] text-sm">{item.category}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#374151] text-sm">{item.fullName}</span>
                    <span className="text-[#6b7280] text-xs">{item.description}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[#6366f1] font-bold text-lg">{item.score}</span>
                  <span className="text-[#9ca3af] text-xs ml-1">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Statistics */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#6366f1]/5 to-[#8b5cf6]/5 rounded-lg border border-[#6366f1]/10">
            <div className="text-center">
              <div className="text-xl font-bold text-[#6366f1]">
                {averageScore}%
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Rata-rata</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#059669]">
                {highestScore}%
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Tertinggi</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[#dc2626] max-w-[80px] truncate">
                {strongestTrait?.fullName}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Terkuat</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(OceanRadarChartComponent)
