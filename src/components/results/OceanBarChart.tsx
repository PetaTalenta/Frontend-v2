'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { AssessmentScores, getScoreInterpretation } from '../../types/assessment-results';
import { Brain } from 'lucide-react';

interface OceanBarChartProps {
  scores: AssessmentScores;
}

export default function OceanBarChart({ scores }: OceanBarChartProps) {
  // Transform OCEAN scores for bar chart with requested abbreviations
  const barData = [
    {
      trait: 'OPNS',
      fullName: 'Openness',
      description: 'Keterbukaan terhadap pengalaman baru',
      score: scores.ocean.openness,
      fill: '#8b5cf6', // Purple
    },
    {
      trait: 'CONS',
      fullName: 'Conscientiousness', 
      description: 'Kehati-hatian dan kedisiplinan',
      score: scores.ocean.conscientiousness,
      fill: '#06b6d4', // Cyan
    },
    {
      trait: 'EXTN',
      fullName: 'Extraversion',
      description: 'Orientasi sosial dan energi',
      score: scores.ocean.extraversion,
      fill: '#10b981', // Emerald
    },
    {
      trait: 'AGRS',
      fullName: 'Agreeableness',
      description: 'Keramahan dan kerjasama',
      score: scores.ocean.agreeableness,
      fill: '#f59e0b', // Amber
    },
    {
      trait: 'NESM',
      fullName: 'Neuroticism',
      description: 'Stabilitas emosional',
      score: scores.ocean.neuroticism,
      fill: '#ef4444', // Red
    },
  ];

  const chartConfig = {
    score: {
      label: "Skor",
      color: "#6366f1",
    },
  };

  // Calculate statistics
  const averageScore = Math.round(barData.reduce((sum, item) => sum + item.score, 0) / barData.length);
  const highestScore = Math.max(...barData.map(item => item.score));
  const strongestTrait = barData.find(item => item.score === highestScore);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const interpretation = getScoreInterpretation(data.score);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600 mb-2">{data.description}</p>
          <p className="text-lg font-bold" style={{ color: data.fill }}>
            Skor: {data.score}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            Level: {interpretation.level}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              OCEAN Personality Traits
            </CardTitle>
            <p className="text-xs text-gray-600">Big Five Personality Assessment</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bar Chart */}
        <div className="h-80">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
                barCategoryGap="20%"
              >
                <XAxis 
                  dataKey="trait"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={0}
                  textAnchor="middle"
                  height={60}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  domain={[0, 100]}
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="score" 
                  radius={[4, 4, 0, 0]}
                  fill="#6366f1"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{averageScore}</p>
            <p className="text-sm text-gray-600">Rata-rata Skor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{highestScore}</p>
            <p className="text-sm text-gray-600">Skor Tertinggi</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{strongestTrait?.trait}</p>
            <p className="text-sm text-gray-600">Trait Terkuat</p>
          </div>
        </div>

        {/* Trait Details */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-3">Detail Traits:</h4>
          {barData.map((trait) => {
            const interpretation = getScoreInterpretation(trait.score);
            return (
              <div key={trait.trait} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: trait.fill }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {trait.trait} - {trait.fullName}
                    </p>
                    <p className="text-sm text-gray-600">{trait.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{trait.score}</p>
                  <p className="text-xs text-gray-500 capitalize">{interpretation.level}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
