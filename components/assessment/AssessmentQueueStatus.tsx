'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Users,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Zap,
  CheckCircle,
  AlertCircle
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
      {/* Main Queue Status Card */}
      <Card className={`border-2 ${
        queueColor === 'green' ? 'border-green-200 bg-green-50' :
        queueColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
        queueColor === 'orange' ? 'border-orange-200 bg-orange-50' :
        queueColor === 'red' ? 'border-red-200 bg-red-50' :
        'border-blue-200 bg-blue-50'
      } shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Queue Icon */}
            <div className={`p-4 rounded-xl ${
              queueColor === 'green' ? 'bg-green-100' :
              queueColor === 'yellow' ? 'bg-yellow-100' :
              queueColor === 'orange' ? 'bg-orange-100' :
              queueColor === 'red' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              <Users className={`w-8 h-8 ${
                queueColor === 'green' ? 'text-green-600' :
                queueColor === 'yellow' ? 'text-yellow-600' :
                queueColor === 'orange' ? 'text-orange-600' :
                queueColor === 'red' ? 'text-red-600' :
                'text-blue-600'
              }`} />
            </div>

            {/* Queue Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {currentStep}
                </h3>
                {queuePosition && (
                  <Badge className={`${
                    queueColor === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                    queueColor === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    queueColor === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    queueColor === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    Posisi #{queuePosition}
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-700 mb-3">
                {getQueueMessage()}
              </p>

              {estimatedTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Estimasi waktu: {estimatedTime}</span>
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full animate-pulse ${
                queueColor === 'green' ? 'bg-green-500' :
                queueColor === 'yellow' ? 'bg-yellow-500' :
                queueColor === 'orange' ? 'bg-orange-500' :
                queueColor === 'red' ? 'bg-red-500' :
                'bg-blue-500'
              }`}></div>
              <p className="text-xs text-gray-500 mt-1">Live</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Koneksi Real-time Aktif</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-600 font-medium">Mode Fallback</span>
            </>
          )}
        </div>
        
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">Powered by AI</span>
        </div>
      </div>

      {/* Queue Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                Mengapa Ada Antrian?
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  Analisis AI membutuhkan komputasi yang intensif
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  Kami memproses setiap assessment dengan detail tinggi
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  Hasil yang akurat memerlukan waktu pemrosesan optimal
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Visualization */}
      {queuePosition && queuePosition > 1 && (
        <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Progress Antrian</span>
              <span className="text-sm text-gray-500">{Math.max(0, queuePosition - 1)} tersisa</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  queueColor === 'green' ? 'bg-green-500' :
                  queueColor === 'yellow' ? 'bg-yellow-500' :
                  queueColor === 'orange' ? 'bg-orange-500' :
                  queueColor === 'red' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ 
                  width: `${Math.max(10, 100 - (queuePosition * 10))}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
