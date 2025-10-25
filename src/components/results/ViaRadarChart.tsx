'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui-chart';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Palette } from 'lucide-react';
import { RiasecScores, OceanScores, ViaScores } from '../../types/assessment-results';

interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

interface ViaRadarChartProps {
  scores?: AssessmentScores;
}

function ViaRadarChartComponent({ scores }: ViaRadarChartProps) {
  // Use provided scores or return null if not available
  const assessmentScores = scores;

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.viaIs) {
    return (
      <Card className="bg-white border-amber-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-2 bg-amber-100 rounded-full">
                <Palette className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Data Tidak Tersedia
              </h3>
              <p className="text-amber-700">
                Data VIA-IS tidak tersedia. Pastikan assessment telah selesai diproses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group VIA-IS scores into 6 main categories
  const radarData = [
    {
      category: 'WISDOM',
      fullName: 'Wisdom & Knowledge',
      description: 'Kebijaksanaan dan pengetahuan',
      score: Math.round((
        assessmentScores.viaIs.creativity +
        assessmentScores.viaIs.curiosity +
        assessmentScores.viaIs.judgment +
        assessmentScores.viaIs.loveOfLearning +
        assessmentScores.viaIs.perspective
      ) / 5),
      fullMark: 100,
      strengths: ['Creativity', 'Curiosity', 'Judgment', 'Love of Learning', 'Perspective']
    },
    {
      category: 'COURAGE',
      fullName: 'Courage',
      description: 'Keberanian dan ketahanan',
      score: Math.round((
        assessmentScores.viaIs.bravery +
        assessmentScores.viaIs.perseverance +
        assessmentScores.viaIs.honesty +
        assessmentScores.viaIs.zest
      ) / 4),
      fullMark: 100,
      strengths: ['Bravery', 'Perseverance', 'Honesty', 'Zest']
    },
    {
      category: 'HUMANITY',
      fullName: 'Humanity',
      description: 'Kemanusiaan dan kasih sayang',
      score: Math.round((
        assessmentScores.viaIs.love +
        assessmentScores.viaIs.kindness +
        assessmentScores.viaIs.socialIntelligence
      ) / 3),
      fullMark: 100,
      strengths: ['Love', 'Kindness', 'Social Intelligence']
    },
    {
      category: 'JUSTICE',
      fullName: 'Justice',
      description: 'Keadilan dan kepemimpinan',
      score: Math.round((
        assessmentScores.viaIs.teamwork +
        assessmentScores.viaIs.fairness +
        assessmentScores.viaIs.leadership
      ) / 3),
      fullMark: 100,
      strengths: ['Teamwork', 'Fairness', 'Leadership']
    },
    {
      category: 'TEMPERANCE',
      fullName: 'Temperance',
      description: 'Pengendalian diri dan kebijaksanaan',
      score: Math.round((
        assessmentScores.viaIs.forgiveness +
        assessmentScores.viaIs.humility +
        assessmentScores.viaIs.prudence +
        assessmentScores.viaIs.selfRegulation
      ) / 4),
      fullMark: 100,
      strengths: ['Forgiveness', 'Humility', 'Prudence', 'Self-Regulation']
    },
    {
      category: 'TRANSCENDENCE',
      fullName: 'Transcendence',
      description: 'Transendensi dan makna hidup',
      score: Math.round((
        assessmentScores.viaIs.appreciationOfBeauty +
        assessmentScores.viaIs.gratitude +
        assessmentScores.viaIs.hope +
        assessmentScores.viaIs.humor +
        assessmentScores.viaIs.spirituality
      ) / 5),
      fullMark: 100,
      strengths: ['Appreciation of Beauty', 'Gratitude', 'Hope', 'Humor', 'Spirituality']
    },
  ];

  const chartConfig = {
    score: {
      label: "Score",
      color: "#8b5cf6",
    },
  };

  // Calculate statistics
  const averageScore = Math.round(radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length);
  const highestScore = Math.max(...radarData.map(item => item.score));
  const strongestCategory = radarData.find(item => item.score === highestScore);

  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#8b5cf6]/10 rounded-lg">
            <Palette className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-[#1f2937]">
              VIA Character Strengths Radar
            </CardTitle>
            <p className="text-xs text-[#6b7280]">Visualisasi 6 kategori kekuatan karakter</p>
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
                fontSize: 10,
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
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.15}
              strokeWidth={2.5}
              dot={{
                fill: '#8b5cf6',
                strokeWidth: 2,
                stroke: '#ffffff',
                r: 4,
              }}
              activeDot={{
                fill: '#8b5cf6',
                strokeWidth: 3,
                stroke: '#ffffff',
                r: 6,
              }}
            />
          </RadarChart>
        </ChartContainer>
        
        {/* Legend/Summary */}
        <div className="mt-4 space-y-4">
          {/* Category Details */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            {radarData.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                      <span className="font-bold text-[#8b5cf6] text-xs">{item.category.slice(0, 3)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#374151] text-sm">{item.fullName}</span>
                      <span className="text-[#6b7280] text-xs">{item.description}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8b5cf6] font-bold text-lg">{item.score}</span>
                    <span className="text-[#9ca3af] text-xs ml-1">%</span>
                  </div>
                </div>
                <div className="ml-11">
                  <div className="flex flex-wrap gap-1">
                    {item.strengths.map((strength, idx) => (
                      <span key={idx} className="text-xs bg-[#8b5cf6]/10 text-[#8b5cf6] px-2 py-1 rounded-md">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Statistics */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8b5cf6]/5 to-[#a855f7]/5 rounded-lg border border-[#8b5cf6]/10">
            <div className="text-center">
              <div className="text-xl font-bold text-[#8b5cf6]">
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
                {strongestCategory?.fullName}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Terkuat</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(ViaRadarChartComponent)
