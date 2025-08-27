'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  HelpCircle
} from 'lucide-react';

interface AssessmentErrorScreenProps {
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  isConnected?: boolean;
  processingTime?: number;
  className?: string;
}

export default function AssessmentErrorScreen({
  errorMessage = "Terjadi kesalahan saat memproses assessment Anda.",
  onRetry,
  onCancel,
  isConnected = true,
  processingTime = 0,
  className = ''
}: AssessmentErrorScreenProps) {

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getErrorType = () => {
    if (errorMessage.toLowerCase().includes('websocket')) return 'websocket';
    if (errorMessage.toLowerCase().includes('timeout')) return 'timeout';
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) return 'network';
    if (errorMessage.toLowerCase().includes('server')) return 'server';
    return 'general';
  };

  const getErrorIcon = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'websocket':
        return WifiOff;
      case 'timeout':
        return Clock;
      case 'network':
        return WifiOff;
      case 'server':
        return AlertTriangle;
      default:
        return XCircle;
    }
  };

  const getErrorTitle = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'websocket':
        return 'Koneksi Real-time Gagal';
      case 'timeout':
        return 'Waktu Pemrosesan Habis';
      case 'network':
        return 'Masalah Koneksi';
      case 'server':
        return 'Masalah Server';
      default:
        return 'Terjadi Kesalahan';
    }
  };

  const getErrorSuggestion = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'websocket':
        return 'Assessment memerlukan koneksi real-time yang stabil. Pastikan browser Anda mendukung WebSocket dan koneksi internet stabil.';
      case 'timeout':
        return 'Pemrosesan membutuhkan waktu lebih lama dari biasanya. Silakan coba lagi.';
      case 'network':
        return 'Periksa koneksi internet Anda dan coba lagi.';
      case 'server':
        return 'Server sedang mengalami gangguan. Silakan coba beberapa saat lagi.';
      default:
        return 'Silakan coba lagi atau hubungi dukungan teknis jika masalah berlanjut.';
    }
  };

  const ErrorIcon = getErrorIcon();

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-lg space-y-6">

        {/* Error Header */}
        <div className="text-center space-y-4">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <ErrorIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              {getErrorTitle()}
            </h1>

            <p className="text-gray-600 max-w-md mx-auto">
              {getErrorSuggestion()}
            </p>
          </div>
        </div>

        {/* Main Error Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6 space-y-4">

            {/* Error Details */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-center space-y-2">
                <h3 className="text-base font-medium text-red-900">
                  Detail Kesalahan
                </h3>
                <p className="text-red-800 text-sm">
                  {errorMessage}
                </p>
                {processingTime > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs text-red-700">
                    <Clock className="w-3 h-3" />
                    <span>Waktu proses: {formatTime(processingTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-center text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Terhubung</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Terputus</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              )}

              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  size="sm"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
