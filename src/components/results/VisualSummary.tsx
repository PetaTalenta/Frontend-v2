'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AssessmentScores, getScoreInterpretation } from '../../types/assessment-results';
import { getDominantRiasecType, getTopViaStrengths } from '../../utils/assessment-calculations';
import { TrendingUp, BarChart3, Palette } from 'lucide-react';

interface VisualSummaryProps {
  scores: AssessmentScores;
}

export default function VisualSummary({ scores }: VisualSummaryProps) {
  // State for hover effects - must be before early returns
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Ensure scores data exists to prevent errors
  if (!scores) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Data visual summary tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scores.riasec || !scores.ocean || !scores.viaIs) {
    console.error('VisualSummary: Missing required scores data', {
      hasRiasec: !!scores.riasec,
      hasOcean: !!scores.ocean,
      hasViaIs: !!scores.viaIs
    });
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Data visual summary tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top categories from each assessment type
  const dominantRiasec = getDominantRiasecType(scores.riasec);
  const topViaStrengths = getTopViaStrengths(scores.viaIs, 1);

  // Get highest Big Five trait
  const oceanEntries = Object.entries(scores.ocean).sort(([,a], [,b]) => b - a);
  const topOceanTrait = oceanEntries[0];

  // Calculate career competency scores based on assessment results
  // Aligned with talent mapping objectives and radar chart categories

  // TECHNICAL: Development and analytical capabilities
  // Based on Investigative RIASEC + analytical traits + technical VIA strengths
  const technicalScore = Math.round((
    scores.riasec.investigative +
    scores.ocean.openness +
    (scores.viaIs.curiosity || 0) +
    (scores.viaIs.judgment || 0) +
    (scores.viaIs.loveOfLearning || 0)
  ) / 5);

  // CREATIVE: Design and innovation capabilities
  // Based on Artistic RIASEC + creative traits + innovative VIA strengths
  const creativeScore = Math.round((
    scores.riasec.artistic +
    scores.ocean.openness +
    (scores.viaIs.creativity || 0) +
    (scores.viaIs.appreciationOfBeauty || 0) +
    (scores.viaIs.perspective || 0)
  ) / 5);

  // LEADERSHIP: Management and entrepreneurial capabilities
  // Based on Enterprising RIASEC + leadership traits + management VIA strengths
  const leadershipScore = Math.round((
    scores.riasec.enterprising +
    scores.ocean.extraversion +
    scores.ocean.conscientiousness +
    (scores.viaIs.leadership || 0) +
    (scores.viaIs.bravery || 0)
  ) / 5);

  // INTERPERSONAL: Social and support capabilities
  // Based on Social RIASEC + social traits + interpersonal VIA strengths
  const interpersonalScore = Math.round((
    scores.riasec.social +
    scores.ocean.agreeableness +
    scores.ocean.extraversion +
    (scores.viaIs.socialIntelligence || 0) +
    (scores.viaIs.kindness || 0) +
    (scores.viaIs.teamwork || 0)
  ) / 6);

  const careerCompetencies = [
    {
      name: 'TECHNICAL',
      shortName: 'TECH',
      score: technicalScore,
      color: '#4f46e5', // Indigo - matches development/investigative
      icon: BarChart3,
      type: 'Technical & Analytical',
      description: 'Kemampuan teknis, analitis, dan penelitian',
      riasecMapping: 'Investigative (I)',
      keyStrengths: ['Problem Solving', 'Research', 'Analysis']
    },
    {
      name: 'CREATIVE',
      shortName: 'CREATE',
      score: creativeScore,
      color: '#ec4899', // Pink - matches artistic/creative
      icon: Palette,
      type: 'Creative & Innovation',
      description: 'Kemampuan kreatif, inovatif, dan artistik',
      riasecMapping: 'Artistic (A)',
      keyStrengths: ['Creativity', 'Design', 'Innovation']
    },
    {
      name: 'LEADERSHIP',
      shortName: 'LEAD',
      score: leadershipScore,
      color: '#f59e0b', // Amber - matches enterprising/leadership
      icon: TrendingUp,
      type: 'Leadership & Management',
      description: 'Kemampuan memimpin, mengelola, dan berwirausaha',
      riasecMapping: 'Enterprising (E)',
      keyStrengths: ['Leadership', 'Management', 'Strategy']
    },
    {
      name: 'INTERPERSONAL',
      shortName: 'SOCIAL',
      score: interpersonalScore,
      color: '#10b981', // Emerald - matches social/interpersonal
      icon: BarChart3,
      type: 'Social & Communication',
      description: 'Kemampuan berinteraksi, berkomunikasi, dan bekerja sama',
      riasecMapping: 'Social (S)',
      keyStrengths: ['Communication', 'Teamwork', 'Empathy']
    }
  ];

  // Sort by score to show highest first
  const sortedCompetencies = careerCompetencies.sort((a, b) => b.score - a.score);

  // Circular Progress Component with hover effects
  const CircularProgress = ({
    percentage,
    color,
    size = 120,
    strokeWidth = 8,
    index = 0,
    category,
    isHovered = false
  }: {
    percentage: number;
    color: string;
    size?: number;
    strokeWidth?: number;
    index?: number;
    category: any;
    isHovered?: boolean;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Hilangkan spiralRotation agar concentric circle selalu terpusat dan proporsional
    return (
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        style={{ zIndex: 100 - index }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg
          width={size}
          height={size}
          className="transition-all duration-300"
          style={{
            // Hapus rotasi spiral, hanya scale saat hover
            transform: `rotate(-90deg) scale(${isHovered ? 1.05 : 1})`,
            filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        >
          {/* Background circle - very light */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f8fafc"
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.5}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
            style={{
              opacity: isHovered ? 1 : 0.9
            }}
          />
        </svg>
      </div>
    );
  };

  // Calculate overall talent score
  const overallTalentScore = Math.round(
    (sortedCompetencies.reduce((sum, comp) => sum + comp.score, 0)) / 4
  );

  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#e7eaff] rounded-lg">
            <TrendingUp className="w-6 h-6 text-[#6475e9]" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-[#1e1e1e]">
              Talent Profile Summary
            </CardTitle>
            <p className="text-sm text-[#64707d]">
              Profil kompetensi karir berdasarkan assessment
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Responsive: radial bar on top, grid below on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Radial bar - responsive size and alignment */}
          <div
            className="relative flex items-center justify-center mx-auto sm:mx-0 transition-all duration-300"
            style={{
              width: '280px', // diperbesar dari 220px
              height: '280px',
              maxWidth: '100%',
              filter: hoveredIndex !== null ? 'brightness(1.05)' : 'brightness(1)'
            }}
          >
            <div
              className="hidden sm:block absolute -inset-10" // diperbesar paddingnya
              aria-hidden="true"
            />
            {/* Background glow effect when hovering */}
            {hoveredIndex !== null && (
              <div
                className="absolute inset-0 rounded-full opacity-20 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, ${sortedCompetencies[hoveredIndex].color}20 0%, transparent 70%)`,
                  transform: 'scale(1.2)'
                }}
              />
            )}

            {/* Concentric circles - responsive size */}
            {sortedCompetencies.map((competency, index) => (
              <div
                key={index}
                className="absolute inset-0"
                style={{
                  zIndex: hoveredIndex === index ? 1000 : 100 - index,
                  opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.6 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <CircularProgress
                  percentage={competency.score}
                  color={competency.color}
                  size={
                    200 - index * 30
                  }
                  strokeWidth={16}
                  index={index}
                  category={competency}
                  isHovered={hoveredIndex === index}
                />
              </div>
            ))}
          </div>

          {/* Kompetensi grid: 2x2 on mobile, vertical on desktop */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-6 mt-4 sm:mt-0">
            {sortedCompetencies.map((competency, index) => (
              <div
                key={index}
                className={`group cursor-pointer transition-all duration-300 p-3 rounded-lg ${
                  hoveredIndex === index
                    ? 'bg-gray-50 shadow-md transform scale-105'
                    : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      hoveredIndex === index ? 'w-5 h-5 shadow-lg' : ''
                    }`}
                    style={{
                      backgroundColor: competency.color,
                      boxShadow: hoveredIndex === index ? `0 0 10px ${competency.color}40` : 'none'
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-sm font-medium uppercase tracking-wider transition-colors duration-300 ${
                          hoveredIndex === index ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {competency.shortName}
                        </span>
                        <p className={`text-xs mt-1 transition-colors duration-300 ${
                          hoveredIndex === index ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {competency.description}
                        </p>
                        <p className={`text-xs mt-1 font-medium transition-colors duration-300 ${
                          hoveredIndex === index ? 'text-blue-600' : 'text-blue-500'
                        }`}>
                          {competency.riasecMapping}
                        </p>
                      </div>
                      <span
                        className={`text-2xl font-bold transition-all duration-300 ${
                          hoveredIndex === index ? 'text-3xl' : ''
                        }`}
                        style={{ color: competency.color }}
                      >
                        {competency.score}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Talent Insights */}
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div>
            <h4 className="text-sm font-semibold text-indigo-900 mb-2">
              Talent Profile Insight
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed mb-3">
              {overallTalentScore >= 80
                ? "Anda memiliki profil talenta yang sangat kuat dengan kompetensi karir yang menonjol. Fokuskan pada pengembangan area terkuat untuk mencapai potensi maksimal."
                : overallTalentScore >= 60
                ? "Anda menunjukkan profil talenta yang seimbang dengan beberapa kompetensi karir yang menonjol. Pertimbangkan karir yang memanfaatkan kekuatan utama Anda."
                : "Anda memiliki potensi talenta yang baik untuk dikembangkan. Fokuskan pada pengembangan kompetensi dengan skor tertinggi untuk membangun keunggulan karir."
              }
            </p>

            <div className="mt-3 p-2 bg-white rounded border border-indigo-200">
              <p className="text-xs font-medium text-indigo-900 mb-1">Rekomendasi Pengembangan:</p>
              <p className="text-xs text-indigo-700">
                Kompetensi terkuat Anda: <strong>{sortedCompetencies[0]?.name}</strong>.
                Pertimbangkan karir di bidang <strong>{sortedCompetencies[0]?.type}</strong>
                yang memanfaatkan kekuatan {sortedCompetencies[0]?.riasecMapping}.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
