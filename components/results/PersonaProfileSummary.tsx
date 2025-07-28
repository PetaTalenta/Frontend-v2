'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PersonaProfile } from '../../types/assessment-results';
import { User, Star, ArrowRight, Briefcase } from 'lucide-react';

interface PersonaProfileSummaryProps {
  profile: PersonaProfile;
  resultId: string;
}

export default function PersonaProfileSummary({ profile, resultId }: PersonaProfileSummaryProps) {
  // Ensure profile data exists to prevent errors
  if (!profile) {
    console.error('PersonaProfileSummary: Missing profile data');
    return (
      <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-white/80">
            <p>Data profil tidak tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get first 2 sentences of description for summary
  const getShortDescription = (description: string) => {
    if (!description) return 'Deskripsi tidak tersedia';
    const sentences = description.split('. ');
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
  };

  // Get top 3 strengths
  const topStrengths = (profile.strengths || []).slice(0, 3);

  // Get top 2 career recommendations
  const topCareers = (profile.careerRecommendation || []).slice(0, 2);

  return (
    <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {profile.title}
              </CardTitle>
              <p className="text-white/80 text-sm">Profil Kepribadian Anda</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Short Description */}
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-white/90 leading-relaxed text-sm">
            {getShortDescription(profile.description)}
          </p>
        </div>

        {/* Top 3 Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-300" />
            <h3 className="font-semibold text-white">Kekuatan Utama</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {topStrengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-300 rounded-full flex-shrink-0" />
                <span className="text-white/90 text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Career Recommendations */}
        {topCareers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Rekomendasi Karir</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {topCareers.map((career, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/90 text-sm font-medium">{career.careerName}</span>
                    {career.matchPercentage && (
                      <span className="text-green-300 text-xs font-semibold">
                        {career.matchPercentage}% match
                      </span>
                    )}
                  </div>
                  {career.description && (
                    <p className="text-white/70 text-xs leading-relaxed">
                      {career.description.length > 80
                        ? career.description.substring(0, 80) + '...'
                        : career.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}




        {/* View Full Profile Button */}
        <div className="pt-2">
          <Link href={`/results/${resultId}/persona`}>
            <Button 
              variant="secondary" 
              className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
            >
              <span>Lihat Profil Lengkap</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
