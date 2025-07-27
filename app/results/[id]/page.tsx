'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '../../../components/ui/use-toast';
import { AssessmentResult } from '../../../types/assessment-results';
import { getAssessmentResult, exportResultAsPDF } from '../../../services/assessment-api';
import PersonaProfileCard from '../../../components/results/PersonaProfileCard';
import PersonaProfileSummary from '../../../components/results/PersonaProfileSummary';
import AssessmentScoresChart from '../../../components/results/AssessmentScoresChart';
import AssessmentScoresSummary from '../../../components/results/AssessmentScoresSummary';

import ResultSummaryStats from '../../../components/results/ResultSummaryStats';
import VisualSummary from '../../../components/results/VisualSummary';

// Note: Full results page is now the default

// Dynamic imports for chart components to avoid SSR issues
const AssessmentRadarChart = dynamic(
  () => import('../../../components/results/AssessmentRadarChart'),
  {
    ssr: false,
    loading: () => (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }
);

const CareerStatsCard = dynamic(
  () => import('../../../components/results/CareerStatsCard'),
  {
    ssr: false,
    loading: () => (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    )
  }
);
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  AlertCircle,
  MessageCircle
} from 'lucide-react';

function FullResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Component initialization logging
  console.log('FullResultsPage: Component mounted with resultId:', resultId);

  // Fetch result data when component mounts
  useEffect(() => {
    if (resultId && loading && !result && !error) {
      fetchResult();
    }
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAssessmentResult(resultId);
      console.log('FullResultsPage: Successfully loaded result:', data?.persona_profile?.title);
      setResult(data);
    } catch (err) {
      console.error('FullResultsPage: Error fetching result:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment result');
      toast({
        title: 'Error',
        description: 'Gagal memuat hasil assessment. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const blob = await exportResultAsPDF(resultId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-result-${resultId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Hasil assessment berhasil diunduh.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Gagal mengunduh hasil assessment.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assessment Result - ${result?.persona_profile.title}`,
          text: result?.persona_profile.description,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Link hasil assessment telah disalin ke clipboard.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          
          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-1" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-[#eaecf0]">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1e1e1e] mb-2">
                    Hasil Assessment Tidak Ditemukan
                  </h2>
                  <p className="text-[#64707d] mb-4">
                    {error || 'Assessment result dengan ID tersebut tidak dapat ditemukan.'}
                  </p>
                  <p className="text-[#64707d] mb-4">
                    Data assessment tidak ditemukan di browser Anda. Jika Anda baru saja membersihkan data browser, silakan lakukan assessment ulang untuk mendapatkan hasil.
                  </p>

                  {/* Debug Information */}
                  <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left">
                    <h3 className="font-semibold text-gray-800 mb-2">Debug Information:</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Result ID:</strong> {resultId}</p>
                      <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
                      <p><strong>Error:</strong> {error || 'No error message'}</p>
                      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      className="border-[#eaecf0]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Kembali ke Dashboard
                    </Button>
                    <Button onClick={fetchResult}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Coba Lagi
                    </Button>
                    <Button
                      onClick={() => router.push('/assessment')}
                      className="bg-[#6475e9] hover:bg-[#5a6bd8]"
                    >
                      Mulai Assessment Baru
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
                Hasil Assessment
              </h1>
              <p className="text-sm text-[#64707d]">
                ID: {resultId} • {new Date(result.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/results/${resultId}/chat`)}
              className="border-[#eaecf0] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat dengan AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-[#eaecf0]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
              className="bg-[#6475e9] hover:bg-[#5a6bd8]"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Stats and Persona Profile */}
          <div className="space-y-6">
            {/* Summary Statistics */}
            <ResultSummaryStats
              scores={result.assessment_data}
              createdAt={result.createdAt}
            />

            {/* Persona Profile Summary */}
            <PersonaProfileSummary
              profile={result.persona_profile}
              resultId={result.id}
            />
          </div>

          {/* Right Column - Performance Summary */}
          <VisualSummary scores={result.assessment_data} />
        </div>

        {/* Radar Chart & Assessment Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart - Left */}
          <AssessmentRadarChart scores={result.assessment_data} />

          {/* Assessment Scores Summary - Right */}
          <AssessmentScoresSummary
            scores={result.assessment_data}
            resultId={result.id}
          />
        </div>
      </div>
    </div>
  );
}

// Main export - use the full results page
export default function ResultsPage() {
  console.log('ResultsPage: Rendering full results page');

  return <FullResultsPage />;
}
