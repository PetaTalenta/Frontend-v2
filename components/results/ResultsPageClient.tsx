'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { toast } from '../ui/use-toast';
import { AssessmentResult, AssessmentScores, ApiAssessmentData } from '../../types/assessment-results';
import { exportResultAsPDF } from '../../services/assessment-api';
import {
  captureElementScreenshot,
  capturePageScreenshot,
  downloadBlob,
  captureMultipleScreenshots,
  isScreenshotSupported,
  getBrowserLimitations
} from '../../utils/screenshot-utils';
import { exportCompletePDF, downloadPDF } from '../../utils/pdf-export-utils';
import { exportAdvancedPDF, downloadAdvancedPDF } from '../../utils/advanced-pdf-export';
import { exportMultiPagePDF, downloadMultiPagePDF } from '../../utils/multi-page-pdf-export';
import PersonaProfileSummary from './PersonaProfileSummary';
import AssessmentScoresChart from './AssessmentScoresChart';
import AssessmentScoresSummary from './AssessmentScoresSummary';
import ResultSummaryStats from './ResultSummaryStats';
import VisualSummary from './VisualSummary';

import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Loader2,
  ChevronDown,
  Camera,
  FileText,
  BookOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Dynamic imports for chart components to avoid SSR issues
const AssessmentRadarChart = dynamic(
  () => import('./AssessmentRadarChart'),
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
  () => import('./CareerStatsCard'),
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

interface ResultsPageClientProps {
  initialResult: AssessmentResult;
  resultId: string;
}

export default function ResultsPageClient({ initialResult, resultId }: ResultsPageClientProps) {
  const router = useRouter();
  const [result] = useState<AssessmentResult>(initialResult);
  const [exporting, setExporting] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);
  const [exportType, setExportType] = useState<string>('');

  // Refs for screenshot capture
  const pageRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);
  const personaCardRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef<HTMLDivElement>(null);

  // Helper function to extract scores from assessment_data
  const extractScores = (assessmentData: any): AssessmentScores | null => {
    if (!assessmentData) {
      return null;
    }

    // Handle the actual API response structure (without assessmentName)
    if (assessmentData.riasec && assessmentData.ocean && assessmentData.viaIs) {
      return {
        riasec: assessmentData.riasec,
        ocean: assessmentData.ocean,
        viaIs: assessmentData.viaIs,
        industryScore: assessmentData.industryScore
      };
    }

    return null;
  };

  // Extract scores once to avoid multiple calls
  const scores = extractScores(result.assessment_data);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hasil Assessment - ${result.persona_profile?.archetype || 'PetaTalenta'}`,
          text: 'Lihat hasil assessment kepribadian dan bakat saya',
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link disalin!",
        description: "Link hasil assessment telah disalin ke clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Gagal menyalin",
        description: "Tidak dapat menyalin link. Silakan salin manual dari address bar.",
        variant: "destructive",
      });
    });
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setExportType('pdf');
      
      console.log('Starting PDF export...');
      await exportResultAsPDF(result);
      
      toast({
        title: "PDF berhasil diunduh!",
        description: "Hasil assessment telah diunduh dalam format PDF.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Gagal mengunduh PDF",
        description: "Terjadi kesalahan saat mengunduh PDF. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  const handleScreenshot = async () => {
    try {
      setScreenshotting(true);
      
      if (!isScreenshotSupported()) {
        const limitations = getBrowserLimitations();
        toast({
          title: "Screenshot tidak didukung",
          description: limitations.join(', '),
          variant: "destructive",
        });
        return;
      }

      console.log('Taking page screenshot...');
      const blob = await capturePageScreenshot();
      downloadBlob(blob, `assessment-result-${resultId}.png`);
      
      toast({
        title: "Screenshot berhasil!",
        description: "Screenshot hasil assessment telah diunduh.",
      });
    } catch (error) {
      console.error('Error taking screenshot:', error);
      toast({
        title: "Gagal mengambil screenshot",
        description: "Terjadi kesalahan saat mengambil screenshot. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setScreenshotting(false);
    }
  };

  const handleChatbot = () => {
    router.push(`/results/${resultId}/chat`);
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1f2937] mb-2">
              Hasil Assessment Tidak Ditemukan
            </h1>
            <p className="text-[#6b7280] mb-6">
              Hasil assessment yang Anda cari tidak ditemukan atau mungkin telah dihapus.
            </p>
            <Button onClick={handleBack} className="bg-[#6475e9] hover:bg-[#5a6bd8]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Hasil Saya
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6" ref={pageRef}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBack}
              className="border-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#1f2937]">
                Hasil Assessment - {result.persona_profile?.archetype || 'Assessment'}
              </h1>
              <p className="text-sm text-[#6b7280]">
                Tanggal: {new Date(result.createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-gray-200"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={exporting || screenshotting}
                  className="border-gray-200"
                >
                  {(exporting || screenshotting) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exporting ? `Mengunduh ${exportType.toUpperCase()}...` : 
                   screenshotting ? 'Mengambil Screenshot...' : 'Unduh'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Unduh PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleScreenshot}>
                  <Camera className="w-4 h-4 mr-2" />
                  Screenshot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={handleChatbot}
              className="bg-[#6475e9] hover:bg-[#5a6bd8]"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat AI
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Main Layout - 2 Columns */}
          {(scores || result.persona_profile) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Summary Stats - Grid 2x2 */}
                {scores && (
                  <ResultSummaryStats scores={scores} createdAt={result.createdAt} />
                )}

                {/* Profil Kepribadian Anda */}
                {result.persona_profile && (
                  <div ref={personaCardRef}>
                    <PersonaProfileSummary persona={result.persona_profile} resultId={result.id} />
                  </div>
                )}
              </div>

              {/* Right Column - Talent Profile Summary */}
              {scores && (
                <VisualSummary scores={scores} />
              )}
            </div>
          )}

          {/* Radar Chart & Assessment Overview */}
          {scores && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart - Left */}
              <div ref={radarChartRef}>
                <AssessmentRadarChart scores={scores} />
              </div>

              {/* Assessment Scores Summary - Right */}
              <AssessmentScoresSummary
                scores={scores}
                resultId={result.id}
              />
            </div>
          )}

          {/* Show loading message if data is not available */}
          {(!scores || !result.persona_profile) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assessment data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
