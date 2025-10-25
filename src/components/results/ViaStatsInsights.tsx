'use client';

import React from 'react';
import { Card, CardContent } from './ui-card';
import { Badge } from './ui-badge';
import { Progress } from './ui-progress';
import { BarChart3 } from 'lucide-react';
import { ViaScores, VIA_CATEGORIES } from '../../data/dummy-assessment-data';

interface ViaStatsInsightsProps {
  viaScores: ViaScores;
  topStrengths: Array<{ strength: keyof ViaScores; score: number; category: string }>;
}

export default function ViaStatsInsights({ viaScores, topStrengths }: ViaStatsInsightsProps) {
  // Calculate statistics
  const scores = Object.values(viaScores);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const scoreRange = highestScore - lowestScore;

  // Find highest and lowest strengths
  const highestStrength = topStrengths[0];
  const lowestStrength = topStrengths[topStrengths.length - 1];

  // Calculate category averages
  const categoryStats = Object.entries(VIA_CATEGORIES).map(([category, strengths]) => {
    const categoryScores = strengths.map(strength => viaScores[strength as keyof ViaScores]);
    const avgScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length);
    return { category, avgScore, count: categoryScores.length };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const dominantCategory = categoryStats[0];
  const weakestCategory = categoryStats[categoryStats.length - 1];

  // Determine score distribution
  const highScores = scores.filter(score => score >= 80).length;
  const mediumScores = scores.filter(score => score >= 60 && score < 80).length;
  const lowScores = scores.filter(score => score < 60).length;


  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-purple-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 60) return 'bg-purple-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* Statistics Overview */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik VIA Anda</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{averageScore}</div>
              <div className="text-xs text-gray-600">Skor Rata-rata</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(highestScore)}`}>{highestScore}</div>
              <div className="text-xs text-gray-600">Skor Tertinggi</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(lowestScore)}`}>{lowestScore}</div>
              <div className="text-xs text-gray-600">Skor Terendah</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{scoreRange}</div>
              <div className="text-xs text-gray-600">Rentang Skor</div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Distribusi Skor</span>
              <span className="text-gray-600">{highScores} Tinggi, {mediumScores} Sedang, {lowScores} Rendah</span>
            </div>
            <div className="flex gap-1">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Tinggi (≥80)</div>
                <Progress value={(highScores / 24) * 100} className="h-2" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Sedang (60-79)</div>
                <Progress value={(mediumScores / 24) * 100} className="h-2" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Rendah (&lt;60)</div>
                <Progress value={(lowScores / 24) * 100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa per Kategori</h3>
          <div className="space-y-3">
            {categoryStats.map(({ category, avgScore }) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                    <span className={`text-sm font-bold ${getScoreColor(avgScore)}`}>{avgScore}</span>
                  </div>
                  <Progress 
                    value={avgScore} 
                    className="h-2"
                    style={{
                      '--progress-background': avgScore >= 80 ? '#22c55e' : 
                                             avgScore >= 70 ? '#3b82f6' : 
                                             avgScore >= 60 ? '#8b5cf6' : 
                                             avgScore >= 50 ? '#f59e0b' : '#ef4444',
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Kekuatan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Kekuatan Terkuat</h4>
              <div className={`p-3 rounded-lg ${getScoreBgColor(highestStrength.score)}`}>
                <div className="font-medium text-gray-900">{highestStrength.strength}</div>
                <div className="text-sm text-gray-600">{highestStrength.category}</div>
                <div className={`text-lg font-bold ${getScoreColor(highestStrength.score)}`}>
                  {highestStrength.score}
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Area Pengembangan</h4>
              <div className={`p-3 rounded-lg ${getScoreBgColor(lowestStrength.score)}`}>
                <div className="font-medium text-gray-900">{lowestStrength.strength}</div>
                <div className="text-sm text-gray-600">{lowestStrength.category}</div>
                <div className={`text-lg font-bold ${getScoreColor(lowestStrength.score)}`}>
                  {lowestStrength.score}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}