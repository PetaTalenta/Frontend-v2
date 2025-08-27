'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ArrowLeft, Bot, MessageCircle } from 'lucide-react';
import { AssessmentResult } from '../../types/assessment-results';

interface ChatHeaderProps {
  assessmentResult: AssessmentResult;
  onBack: () => void;
}

export default function ChatHeader({ assessmentResult, onBack }: ChatHeaderProps) {
  const persona = assessmentResult.persona_profile;

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Bot Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>

        {/* Chat Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-900">AI Konselor Karir</h1>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Konsultasi untuk profil: <span className="font-medium">{persona.title}</span>
          </p>
        </div>

        {/* Chat Icon */}
        <div className="text-gray-400">
          <MessageCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Assessment Context Info */}
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Konteks Assessment Anda
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Saya memiliki akses ke hasil assessment lengkap Anda termasuk profil kepribadian, 
              kekuatan, dan rekomendasi karir. Silakan bertanya tentang apapun yang ingin Anda ketahui!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
