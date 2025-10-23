'use client';

import React from 'react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import {
  Users,
  Clock,
} from 'lucide-react';

interface AssessmentQueueStatusProps {
  queuePosition?: number;
  estimatedTime?: string;
  isConnected?: boolean;
  currentStep?: string;
  className?: string;
}

export default function AssessmentQueueStatus({
  queuePosition,
  estimatedTime,
  isConnected = true,
  currentStep = "Dalam Antrian",
  className = ''
}: AssessmentQueueStatusProps) {

  const getQueueMessage = () => {
    if (!queuePosition) return "Mempersiapkan analisis...";
    
    if (queuePosition === 1) {
      return "Anda berikutnya! Analisis akan segera dimulai.";
    } else if (queuePosition <= 3) {
      return "Hampir tiba giliran Anda.";
    } else if (queuePosition <= 10) {
      return "Beberapa pengguna sedang diproses sebelum Anda.";
    } else {
      return "Sistem sedang memproses banyak assessment.";
    }
  };

  const getQueueColor = () => {
    if (!queuePosition) return "blue";
    
    if (queuePosition === 1) return "green";
    if (queuePosition <= 3) return "yellow";
    if (queuePosition <= 10) return "orange";
    return "red";
  };

  const queueColor = getQueueColor();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Queue Status Card - Simplified */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Queue Icon */}
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>

            {/* Queue Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStep}
                </h3>
                {queuePosition && (
                  <Badge variant="secondary" className="text-sm">
                    #{queuePosition}
                  </Badge>
                )}
              </div>

              <p className="text-gray-600 max-w-md mx-auto">
                {getQueueMessage()}
              </p>

              {estimatedTime && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Estimasi: {estimatedTime}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {queuePosition && queuePosition > 1 && (
              <div className="w-full max-w-xs mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(10, 100 - (queuePosition * 10))}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.max(0, queuePosition - 1)} pengguna di depan Anda
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status - Simplified */}
      <div className="flex items-center justify-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Terhubung</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Mode Fallback</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
