'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui-card';
import { Progress } from './ui-progress';
import { Badge } from './ui-badge';
import { Building, TrendingUp, Star, Target } from 'lucide-react';
import {
  RiasecScores
} from '../../types/assessment-results';

interface IndustryCompatibilityCardProps {
  industryScores?: { [key: string]: number };
}

export default function IndustryCompatibilityCard({ industryScores }: IndustryCompatibilityCardProps) {
  // Use provided industry scores or empty object
  const industryScoresData = industryScores || {};
  
  // Helper function to get top industries
  const getTopIndustries = (scores: { [key: string]: number }, count: number) => {
    const entries = Object.entries(scores);
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([industry, score]) => ({
        industry,
        displayName: industry.charAt(0).toUpperCase() + industry.slice(1),
        score
      }));
  };
  
  const topIndustries = getTopIndustries(industryScoresData, 8);

  // Get industry icons mapping
  const getIndustryIcon = (industry: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      teknologi: '💻',
      kesehatan: '🏥',
      keuangan: '💰',
      pendidikan: '🎓',
      rekayasa: '⚙️',
      pemasaran: '📈',
      hukum: '⚖️',
      kreatif: '🎨',
      media: '📺',
      penjualan: '🤝',
      sains: '🔬',
      manufaktur: '🏭',
      agrikultur: '🌾',
      pemerintahan: '🏛️',
      konsultasi: '💼',
      pariwisata: '✈️',
      logistik: '🚚',
      energi: '⚡',
      sosial: '🤲',
      olahraga: '⚽',
      properti: '🏠',
      kuliner: '🍽️',
      perdagangan: '🛒',
      telekomunikasi: '📡'
    };
    return iconMap[industry] || '🏢';
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-500" />
          Kompatibilitas Industri
        </CardTitle>
        <p className="text-gray-600">
          Industri yang paling sesuai dengan kepribadian Anda berdasarkan analisis RIASEC, OCEAN, dan VIA
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Top 3 Industries Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topIndustries.slice(0, 3).map((industry, index) => {
            // Helper function to get industry compatibility level
            const getIndustryCompatibilityLevel = (score: number) => {
              if (score >= 80) return { level: 'Sangat Cocok', color: 'bg-green-100 text-green-800' };
              if (score >= 70) return { level: 'Cocok', color: 'bg-blue-100 text-blue-800' };
              if (score >= 60) return { level: 'Cukup Cocok', color: 'bg-yellow-100 text-yellow-800' };
              return { level: 'Kurang Cocok', color: 'bg-red-100 text-red-800' };
            };
            
            const compatibility = getIndustryCompatibilityLevel(industry.score);
            return (
              <div
                key={industry.industry}
                className={`p-4 rounded-lg border-2 ${
                  index === 0 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : index === 1 
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-orange-300 bg-orange-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{getIndustryIcon(industry.industry)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{industry.displayName}</h3>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Star className="w-4 h-4 text-yellow-500" />}
                      <span className="text-2xl font-bold text-gray-900">{industry.score}%</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${compatibility.color} bg-white/80 text-xs`}
                >
                  {compatibility.level}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Detailed Industry List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Semua Industri</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topIndustries.map((industry) => {
              // Helper function to get industry compatibility level
              const getIndustryCompatibilityLevel = (score: number) => {
                if (score >= 80) return { level: 'Sangat Cocok', color: 'bg-green-100 text-green-800' };
                if (score >= 70) return { level: 'Cocok', color: 'bg-blue-100 text-blue-800' };
                if (score >= 60) return { level: 'Cukup Cocok', color: 'bg-yellow-100 text-yellow-800' };
                return { level: 'Kurang Cocok', color: 'bg-red-100 text-red-800' };
              };
              
              const compatibility = getIndustryCompatibilityLevel(industry.score);
              return (
                <div
                  key={industry.industry}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="text-lg">{getIndustryIcon(industry.industry)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {industry.displayName}
                      </span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {industry.score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={industry.score} 
                        className="flex-1 h-2"
                      />
                      <Badge 
                        variant="outline" 
                        className={`${compatibility.color} text-xs px-2 py-0.5 whitespace-nowrap`}
                      >
                        {compatibility.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Cara Membaca Skor Kompatibilitas</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>80-100%:</strong> Sangat Cocok - Kepribadian Anda sangat sesuai dengan industri ini</p>
                <p><strong>70-79%:</strong> Cocok - Kepribadian Anda cukup sesuai dengan industri ini</p>
                <p><strong>60-69%:</strong> Cukup Cocok - Ada beberapa aspek kepribadian yang sesuai</p>
                <p><strong>Di bawah 60%:</strong> Kurang Cocok - Mungkin memerlukan pengembangan lebih lanjut</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <p>
            <strong>Catatan:</strong> Skor kompatibilitas dihitung berdasarkan kesesuaian kepribadian Anda 
            dengan karakteristik yang dibutuhkan di setiap industri. Skor tinggi menunjukkan potensi 
            kesuksesan yang lebih besar, namun bukan berarti Anda tidak bisa berhasil di industri lain 
            dengan pengembangan yang tepat.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
