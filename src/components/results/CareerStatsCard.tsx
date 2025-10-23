'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui-card';
import { Badge } from './ui-badge';
import { TrendingUp, Target, Award, Users } from 'lucide-react';
import { AssessmentScores, getDummyAssessmentScores } from '../../data/dummy-assessment-data';

interface CareerStatsCardProps {
  scores?: AssessmentScores;
}

function CareerStatsCardComponent({ scores }: CareerStatsCardProps) {
  // Use dummy data if no scores provided
  const assessmentScores = scores || getDummyAssessmentScores();

  // Early return if scores data is not available
  if (!assessmentScores || !assessmentScores.riasec || !assessmentScores.ocean || !assessmentScores.viaIs) {
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Data statistik karir tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate career-focused statistics matching the radar chart
  const riasecScores = [
    { name: 'Development', score: assessmentScores.riasec.investigative, category: 'Technical' },
    { name: 'Design', score: assessmentScores.riasec.artistic, category: 'Creative' },
    { name: 'Management', score: assessmentScores.riasec.enterprising, category: 'Leadership' },
    { name: 'Sales', score: Math.round((assessmentScores.riasec.enterprising + assessmentScores.riasec.social) / 2), category: 'Business' },
    { name: 'Support', score: assessmentScores.riasec.social, category: 'Social' },
    { name: 'Administration', score: assessmentScores.riasec.conventional, category: 'Operational' },
  ];

  const topSkill = riasecScores.reduce((prev, current) => 
    prev.score > current.score ? prev : current
  );

  const averageScore = Math.round(
    riasecScores.reduce((sum, skill) => sum + skill.score, 0) / riasecScores.length
  );

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: 'Expert', color: '#22c55e' };
    if (score >= 60) return { label: 'Advanced', color: '#3b82f6' };
    if (score >= 40) return { label: 'Intermediate', color: '#eab308' };
    if (score >= 20) return { label: 'Beginner', color: '#f97316' };
    return { label: 'Novice', color: '#ef4444' };
  };

  const topSkillLevel = getScoreLevel(topSkill.score);
  const overallLevel = getScoreLevel(averageScore);

  // Calculate skill distribution
  const skillDistribution = {
    technical: assessmentScores.riasec.investigative + assessmentScores.riasec.realistic,
    creative: assessmentScores.riasec.artistic,
    social: assessmentScores.riasec.social,
    business: assessmentScores.riasec.enterprising,
    operational: assessmentScores.riasec.conventional,
  };

  const maxDistribution = Math.max(...Object.values(skillDistribution));
  const dominantArea = Object.entries(skillDistribution).find(
    ([_, value]) => value === maxDistribution
  )?.[0] || 'technical';

  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <CardHeader className="pb-4 lg:pb-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-[#4f46e5]/10 rounded-lg">
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-[#4f46e5]" />
          </div>
          <div>
            <CardTitle className="text-lg lg:text-xl font-semibold text-[#1f2937]">
              Performance Insights
            </CardTitle>
            <p className="text-xs lg:text-sm text-[#6b7280]">Detailed analysis of your career competencies</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 lg:space-y-6">
        {/* Top Skill */}
        <div className="p-4 lg:p-6 bg-gradient-to-r from-[#22c55e]/10 to-[#16a34a]/10 rounded-lg border border-[#22c55e]/20">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="flex items-center gap-2 lg:gap-3">
              <Award className="w-4 h-4 lg:w-5 lg:h-5 text-[#22c55e]" />
              <span className="text-sm lg:text-base font-medium text-[#1e1e1e]">Top Skill</span>
            </div>
            <Badge
              style={{ backgroundColor: topSkillLevel.color + '20', color: topSkillLevel.color }}
              className="text-xs lg:text-sm font-medium"
            >
              {topSkillLevel.label}
            </Badge>
          </div>
          <div className="text-lg font-bold text-[#22c55e]">{topSkill.name}</div>
          <div className="text-sm text-[#64707d]">Score: {topSkill.score}/100</div>
        </div>

        {/* Overall Performance */}
        <div className="p-4 bg-gradient-to-r from-[#6475e9]/10 to-[#5a6bd8]/10 rounded-lg border border-[#6475e9]/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#6475e9]" />
              <span className="text-sm font-medium text-[#1e1e1e]">Overall Level</span>
            </div>
            <Badge 
              style={{ backgroundColor: overallLevel.color + '20', color: overallLevel.color }}
              className="text-xs font-medium"
            >
              {overallLevel.label}
            </Badge>
          </div>
          <div className="text-lg font-bold text-[#6475e9]">{averageScore}/100</div>
          <div className="text-sm text-[#64707d]">Average across all skills</div>
        </div>

        {/* Dominant Area */}
        <div className="p-4 bg-gradient-to-r from-[#f59e0b]/10 to-[#d97706]/10 rounded-lg border border-[#f59e0b]/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-sm font-medium text-[#1e1e1e]">Dominant Area</span>
          </div>
          <div className="text-lg font-bold text-[#f59e0b] capitalize">{dominantArea}</div>
          <div className="text-sm text-[#64707d]">
            {dominantArea === 'technical' && 'Problem-solving & Analysis'}
            {dominantArea === 'creative' && 'Design & Innovation'}
            {dominantArea === 'social' && 'Communication & Teamwork'}
            {dominantArea === 'business' && 'Leadership & Strategy'}
            {dominantArea === 'operational' && 'Organization & Process'}
          </div>
        </div>

        {/* Skills Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#1e1e1e]">Skills Breakdown</h4>
          {riasecScores.map((skill, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-[#64707d]">{skill.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#6475e9] rounded-full transition-all duration-300"
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#64707d] w-8 text-right">
                  {skill.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(CareerStatsCardComponent)
