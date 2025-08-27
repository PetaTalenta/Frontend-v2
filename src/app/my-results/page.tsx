'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AssessmentResult } from '../../types/assessment-results';
import { useUserAssessmentResults } from '../../hooks/useAssessmentData';
import { AssessmentListLoading } from '../../components/ui/loading-states';
import { DataFetchError } from '../../components/ui/error-states';
import { formatDate } from '../../utils/formatters';
import {
  Eye,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Plus
} from 'lucide-react';

export default function MyResultsPage() {
  const router = useRouter();
  const { results, isLoading, error, refetch } = useUserAssessmentResults();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'processing': return 'Diproses';
      case 'queued': return 'Antrian';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  if (isLoading) {
    return <AssessmentListLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1e1e1e]">Hasil Assessment Saya</h1>
          </div>
          <DataFetchError
            error={error}
            onRetry={refetch}
            title="Gagal Memuat Hasil Assessment"
            description="Terjadi kesalahan saat memuat daftar hasil assessment Anda."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-[#eaecf0]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#1e1e1e]">
                Hasil Assessment Saya
              </h1>
              <p className="text-sm text-[#64707d]">
                Lihat dan kelola hasil assessment Anda
              </p>
            </div>
          </div>
          
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="border-[#eaecf0]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Results Grid */}
        <>
          {results && results.length === 0 ? (
              <Card className="bg-white border-[#eaecf0]">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-[#e7eaff] rounded-full">
                      <TrendingUp className="w-8 h-8 text-[#6475e9]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1e1e1e] mb-2">
                        Belum Ada Hasil Assessment
                      </h3>
                      <p className="text-[#64707d] mb-4">
                        Mulai assessment pertama Anda untuk melihat hasil analisis kepribadian.
                      </p>
                      <Button 
                        onClick={() => router.push('/select-assessment')}
                        className="bg-[#6475e9] hover:bg-[#5a6bd8]"
                      >
                        Mulai Assessment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result) => (
                  <Card key={result.id} className="bg-white border-[#eaecf0] hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-[#1e1e1e] mb-1">
                            {result.persona_profile.archetype || result.persona_profile.title || 'Assessment Result'}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs text-[#64707d]">
                            <Calendar className="w-3 h-3" />
                            {formatDate(result.createdAt)}
                          </div>
                        </div>
                        <Badge 
                          className={`text-xs ${getStatusColor(result.status)}`}
                          variant="secondary"
                        >
                          {getStatusText(result.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-[#64707d] line-clamp-3">
                        {result.persona_profile?.shortSummary || result.persona_profile?.description || 'Deskripsi tidak tersedia'}
                      </p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#f8fafc] rounded-lg p-2">
                          <div className="font-medium text-[#1e1e1e]">
                            {result.persona_profile?.careerRecommendation?.length || 0}
                          </div>
                          <div className="text-[#64707d]">Rekomendasi Karir</div>
                        </div>
                        <div className="bg-[#f8fafc] rounded-lg p-2">
                          <div className="font-medium text-[#1e1e1e]">
                            {result.persona_profile?.strengths?.length || 0}
                          </div>
                          <div className="text-[#64707d]">Kekuatan</div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <Button
                        className="w-full bg-[#6475e9] hover:bg-[#5a6bd8] text-white"
                        onClick={() => router.push(`/results/${result.id}`)}
                        disabled={result.status !== 'completed'}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {result.status === 'completed' ? 'Lihat Detail' : 'Sedang Diproses'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </>

        {/* Demo Links */}
        <Card className="bg-[#f8fafc] border-[#e2e8f0]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#1e1e1e] mb-1">
                  Demo Results
                </h4>
                <p className="text-xs text-[#64707d]">
                  Lihat contoh hasil assessment untuk referensi
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/results/result-001')}
                  className="border-[#eaecf0] text-xs"
                >
                  Creative Investigator
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/results/result-002')}
                  className="border-[#eaecf0] text-xs"
                >
                  Inspiring Leader
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
