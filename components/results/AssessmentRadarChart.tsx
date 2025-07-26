'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AssessmentScores } from '../../types/assessment-results';
import { BarChart3 } from 'lucide-react';

interface AssessmentRadarChartProps {
  scores: AssessmentScores;
}

export default function AssessmentRadarChart({ scores }: AssessmentRadarChartProps) {
  // Transform RIASEC scores to match the categories in your image
  // Using 6 categories to create a hexagonal radar chart like the image
  const radarData = [
    {
      category: 'DEV',
      fullName: 'Development',
      score: scores.riasec.investigative, // Investigative maps to Development
      fullMark: 100,
    },
    {
      category: 'DESIGN',
      fullName: 'Design',
      score: scores.riasec.artistic, // Artistic maps to Design
      fullMark: 100,
    },
    {
      category: 'MGMT',
      fullName: 'Management',
      score: scores.riasec.enterprising, // Enterprising maps to Management
      fullMark: 100,
    },
    {
      category: 'SALES',
      fullName: 'Sales',
      score: Math.round((scores.riasec.enterprising + scores.riasec.social) / 2), // Combination for Sales
      fullMark: 100,
    },
    {
      category: 'SUPPORT',
      fullName: 'Support',
      score: scores.riasec.social, // Social maps to Support
      fullMark: 100,
    },
    {
      category: 'ADMIN',
      fullName: 'Administration',
      score: scores.riasec.conventional, // Conventional maps to Administration
      fullMark: 100,
    },
  ];

  const chartConfig = {
    score: {
      label: "Score",
      color: "#4f46e5",
    },
  };

  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-[#4f46e5]" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-[#1f2937]">
              Skills Radar Analysis
            </CardTitle>
            <p className="text-xs text-[#6b7280]">Career competency assessment based on RIASEC model</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[450px]">
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                hideLabel
                formatter={(value, name) => [
                  `${value}`,
                  radarData.find(item => item.category === name)?.fullName || name
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
              stroke="#4f46e5"
              fill="#4f46e5"
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{
                fill: '#4f46e5',
                strokeWidth: 2,
                stroke: '#ffffff',
                r: 3,
              }}
              activeDot={{
                fill: '#4f46e5',
                strokeWidth: 2,
                stroke: '#ffffff',
                r: 5,
              }}
            />
          </RadarChart>
        </ChartContainer>
        
        {/* Legend/Summary */}
        <div className="mt-2 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {radarData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50/50 rounded-md border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-medium text-[#374151] text-xs">{item.category}</span>
                  <span className="text-[#9ca3af] text-[10px]">{item.fullName}</span>
                </div>
                <span className="text-[#4f46e5] font-bold text-sm">{item.score}</span>
              </div>
            ))}
          </div>

          {/* Overall Statistics */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#4f46e5]/5 to-[#7c3aed]/5 rounded-lg border border-[#4f46e5]/10">
            <div className="text-center">
              <div className="text-xl font-bold text-[#4f46e5]">
                {Math.round(radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length)}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Average</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#059669]">
                {Math.max(...radarData.map(item => item.score))}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Highest</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[#dc2626]">
                {radarData.find(item => item.score === Math.max(...radarData.map(i => i.score)))?.fullName}
              </div>
              <div className="text-xs text-[#6b7280] font-medium">Strongest</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
