'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { toast } from '../ui/use-toast';
import { AssessmentResult, AssessmentScores, ApiAssessmentData } from '../../types/assessment-results';
import { exportResultAsPDF } from '../../services/assessment-api';
// Toggle public API
async function toggleResultPublic(resultId: string, isPublic: boolean): Promise<{success: boolean, is_public: boolean}> {
  // Use proxy endpoint to avoid CORS issues if needed
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error('Authentication token not found');
  const response = await fetch(`/api/proxy/archive/results/${resultId}/public`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_public: isPublic }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Gagal mengubah status publikasi hasil assessment');
  }
  return { success: true, is_public: data.data.is_public };
}
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
// Static imports to avoid webpack dynamic import issues
import AssessmentRadarChart from './AssessmentRadarChart';
import CareerStatsCard from './CareerStatsCard';
import SimpleAssessmentChart from './SimpleAssessmentChart';

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

// Fallback component for when charts can't be rendered
const ChartFallback = ({ title = 'Chart Unavailable' }: { title?: string }) => (
  <Card className="bg-white border-gray-200/60 shadow-sm">
    <div className="p-6">
      <div className="text-center space-y-4">
        <div className="text-yellow-600">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">
            Chart tidak dapat dimuat karena masalah teknis. Data Anda tetap aman.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    </div>
  </Card>
);

// Safe chart wrapper component with multiple fallback levels
const SafeAssessmentRadarChart = ({ scores }: { scores: AssessmentScores }) => {
  const [isClient, setIsClient] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [useSimpleChart, setUseSimpleChart] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (hasError || useSimpleChart) {
    return <SimpleAssessmentChart scores={scores} />;
  }

  try {
    return (
      <React.Suspense fallback={
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      }>
        <AssessmentRadarChart scores={scores} />
      </React.Suspense>
    );
  } catch (error) {
    console.error('Error rendering AssessmentRadarChart, falling back to SimpleChart:', error);
    setHasError(true);
    return <SimpleAssessmentChart scores={scores} />;
  }
};

// Safe career stats wrapper component
const SafeCareerStatsCard = ({ scores }: { scores: AssessmentScores }) => {
  try {
    return <CareerStatsCard scores={scores} />;
  } catch (error) {
    console.error('Error rendering CareerStatsCard:', error);
    return <ChartFallback title="Career Stats Unavailable" />;
  }
};

interface ResultsPageClientProps {
  initialResult: AssessmentResult;
  resultId: string;
}

export default function ResultsPageClient({ initialResult, resultId }: ResultsPageClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult>(initialResult);
  const [exporting, setExporting] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(initialResult?.is_public ?? false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

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


  // Toggle public/private status
  const handleTogglePublic = async () => {
    if (!result?.id) return;
    setIsTogglingPublic(true);
    try {
      const nextPublic = !isPublic;
      const res = await toggleResultPublic(result.id, nextPublic);
      setIsPublic(res.is_public);
      toast({
        title: res.is_public ? 'Hasil assessment kini bersifat publik!' : 'Hasil assessment kini bersifat privat!',
        description: res.is_public
          ? 'Siapa saja yang memiliki link dapat melihat hasil assessment ini.'
          : 'Hasil assessment ini kini hanya dapat diakses oleh Anda.',
      });
    } catch (err: any) {
      toast({
        title: 'Gagal mengubah status publikasi',
        description: err?.message || 'Terjadi kesalahan saat mengubah status publikasi.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingPublic(false);
    }
  };

  // Share link (copy/share)
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

      console.log('Starting PDF export for result ID:', result.id);
      const pdfBlob = await exportResultAsPDF(result.id);

      // Create download link for the PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `assessment-result-${result.id}-${timestamp}.pdf`;

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`PDF downloaded successfully: ${filename}, size: ${pdfBlob.size} bytes`);

      toast({
        title: "PDF berhasil diunduh!",
        description: "Hasil assessment telah diunduh dalam format PDF.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);

      // Provide more specific error messages
      let errorMessage = "Terjadi kesalahan saat mengunduh PDF. Silakan coba lagi.";

      if (typeof error === 'object' && error && 'message' in error && typeof (error as any).message === 'string') {
        const msg = (error as any).message as string;
        if (msg.includes('format lama yang tidak lagi didukung')) {
          errorMessage = "Hasil assessment ini menggunakan format lama. Silakan buat assessment baru untuk mendapatkan fitur unduh PDF.";
        } else if (msg.includes('Authentication token not found')) {
          errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
        } else if (msg.includes('not found')) {
          errorMessage = "Hasil assessment tidak ditemukan. Data mungkin sudah dihapus.";
        } else if (msg.includes('Format ID') && msg.includes('tidak valid')) {
          errorMessage = "Format ID hasil assessment tidak valid. Silakan hubungi administrator.";
        }
        toast({
          title: "Gagal mengunduh PDF",
          description: errorMessage,
          variant: "destructive",
          action: msg.includes('format lama') ? (
            <button
              onClick={handleScreenshot}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Unduh Screenshot
            </button>
          ) : undefined,
        });
      } else {
        toast({
          title: "Gagal mengunduh PDF",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
          description: Array.isArray((limitations as any).warnings) ? (limitations as any).warnings.join(', ') : 'Browser tidak mendukung fitur screenshot.',
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
        {/* Header - Responsive Layout */}
        <div className="flex flex-col gap-2 sm:gap-4 mb-2">
          {/* Top row: Buttons (Back, Share, Salin Link, Unduh) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBack}
                className="border-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-2">
              {/* Button Bagikan/Public/Private disembunyikan sesuai permintaan */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-gray-200"
                title="Salin atau bagikan link hasil assessment"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Salin Link
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
            </div>
          </div>
          {/* Bottom row: Title and Date, always below buttons on mobile */}
          <div className="flex flex-col items-start sm:items-start mt-2 sm:mt-0">
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
                <SafeAssessmentRadarChart scores={scores} />
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
