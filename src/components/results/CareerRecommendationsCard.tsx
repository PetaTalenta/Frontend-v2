'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CareerRecommendation, CareerProspectLevel } from '../../types/assessment-results';
import { Briefcase, TrendingUp, DollarSign, Users, BookOpen, Building } from 'lucide-react';

interface CareerRecommendationsCardProps {
  recommendations: CareerRecommendation[];
}

export default function CareerRecommendationsCard({ recommendations }: CareerRecommendationsCardProps) {
  const getProspectColor = (level: CareerProspectLevel): string => {
    switch (level) {
      case 'super high': return '#22c55e';
      case 'high': return '#3b82f6';
      case 'moderate': return '#eab308';
      case 'low': return '#f97316';
      case 'super low': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getProspectScore = (level: CareerProspectLevel): number => {
    switch (level) {
      case 'super high': return 100;
      case 'high': return 80;
      case 'moderate': return 60;
      case 'low': return 40;
      case 'super low': return 20;
      default: return 0;
    }
  };

  const ProspectIndicator = ({ 
    icon: Icon, 
    label, 
    level 
  }: { 
    icon: React.ElementType; 
    label: string; 
    level: CareerProspectLevel;
  }) => {
    const color = getProspectColor(level);
    const score = getProspectScore(level);
    
    return (
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-[#64707d]">{label}</span>
            <span className="text-xs font-medium" style={{ color }}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${score}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardHeader className="pb-4 lg:pb-6">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-2 lg:p-3 bg-[#e7eaff] rounded-lg">
            <Briefcase className="w-6 h-6 lg:w-7 lg:h-7 text-[#6475e9]" />
          </div>
          <div>
            <CardTitle className="text-xl lg:text-2xl font-semibold text-[#1e1e1e]">
              Rekomendasi Karir
            </CardTitle>
            <p className="text-sm lg:text-base text-[#64707d]">
              Karir yang sesuai dengan profil kepribadian Anda
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 lg:space-y-8">
        {recommendations.map((career, index) => (
          <div key={index} className="border border-[#eaecf0] rounded-lg p-4 lg:p-6 space-y-4 lg:space-y-5">
            {/* Career Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 lg:mb-3">
                  <h3 className="text-lg lg:text-xl font-semibold text-[#1e1e1e]">
                    {career.careerName}
                  </h3>
                  {career.matchPercentage && (
                    <Badge
                      variant="secondary"
                      className="bg-[#e7eaff] text-[#6475e9] font-medium text-sm lg:text-base"
                    >
                      {career.matchPercentage}% Match
                    </Badge>
                  )}
                </div>
                {career.description && (
                  <p className="text-sm lg:text-base text-[#64707d] leading-relaxed">
                    {career.description}
                  </p>
                )}
              </div>
            </div>

            {/* Match Percentage Bar */}
            {career.matchPercentage && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#1e1e1e]">
                    Tingkat Kesesuaian
                  </span>
                  <span className="text-sm font-medium text-[#6475e9]">
                    {career.matchPercentage}%
                  </span>
                </div>
                <Progress 
                  value={career.matchPercentage} 
                  className="h-2"
                  style={{
                    '--progress-background': '#6475e9'
                  } as React.CSSProperties}
                />
              </div>
            )}

            {/* Career Prospects */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#1e1e1e]">Prospek Karir</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProspectIndicator
                  icon={Users}
                  label="Ketersediaan Lowongan"
                  level={career.careerProspect.jobAvailability}
                />
                <ProspectIndicator
                  icon={DollarSign}
                  label="Potensi Gaji"
                  level={career.careerProspect.salaryPotential}
                />
                <ProspectIndicator
                  icon={TrendingUp}
                  label="Perkembangan Karir"
                  level={career.careerProspect.careerProgression}
                />
                <ProspectIndicator
                  icon={Building}
                  label="Pertumbuhan Industri"
                  level={career.careerProspect.industryGrowth}
                />
                <ProspectIndicator
                  icon={BookOpen}
                  label="Pengembangan Skill"
                  level={career.careerProspect.skillDevelopment}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Additional Info */}
        <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#e7eaff] rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#6475e9]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1e1e1e] mb-1">
                Tips Pengembangan Karir
              </h4>
              <p className="text-xs text-[#64707d] leading-relaxed">
                Rekomendasi karir di atas didasarkan pada analisis mendalam terhadap profil kepribadian Anda. 
                Pertimbangkan untuk mengeksplorasi peluang magang, kursus, atau sertifikasi yang relevan 
                untuk memperkuat kesesuaian Anda dengan karir pilihan.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
