'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PersonaProfile } from '../../types/assessment-results';
import { User, Star, Target, Users } from 'lucide-react';

interface PersonaProfileCardProps {
  profile: PersonaProfile;
}

export default function PersonaProfileCard({ profile }: PersonaProfileCardProps) {
  return (
    <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
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
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-white/90 leading-relaxed">
            {profile.description}
          </p>
        </div>

        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-300" />
            <h3 className="font-semibold text-white">Kekuatan Utama</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {profile.strengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-300 rounded-full flex-shrink-0" />
                <span className="text-white/90 text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-green-300" />
            <h3 className="font-semibold text-white">Rekomendasi Pengembangan</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {profile.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full flex-shrink-0" />
                <span className="text-white/90 text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Models */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-300" />
            <h3 className="font-semibold text-white">Role Model</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.roleModel.map((model, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                {model}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
