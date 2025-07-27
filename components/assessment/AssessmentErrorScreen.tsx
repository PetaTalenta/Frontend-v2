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
    <div className={`min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Error Header */}
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-xl">
              <ErrorIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {getErrorTitle()}
            </h1>
            
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              {getErrorSuggestion()}
            </p>
          </div>
        </div>

        {/* Main Error Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-red-200 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            
            {/* Error Details */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Detail Kesalahan
                  </h3>
                  <p className="text-red-800 text-sm">
                    {errorMessage}
                  </p>
                  {processingTime > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
                      <Clock className="w-4 h-4" />
                      <span>Waktu pemrosesan sebelum error: {formatTime(processingTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">Koneksi Aktif</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">Koneksi Terputus</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              )}
              
              {onCancel && (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex-1 border-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting Tips */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Tips Mengatasi Masalah
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Pastikan koneksi internet Anda stabil
                  </p>
                  {getErrorType() === 'websocket' && (
                    <p className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Gunakan browser modern yang mendukung WebSocket (Chrome, Firefox, Safari, Edge)
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Refresh halaman dan coba lagi
                  </p>
                  {getErrorType() === 'websocket' && (
                    <p className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Nonaktifkan sementara VPN atau proxy jika digunakan
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Jika masalah berlanjut, coba beberapa menit kemudian
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Hubungi dukungan teknis jika error terus terjadi
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Butuh bantuan? 
            <a href="mailto:support@petatalenta.com" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
              Hubungi Tim Dukungan
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
