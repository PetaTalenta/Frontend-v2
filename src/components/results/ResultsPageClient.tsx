'use client';

import React, { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from './ui-use-toast';
import OptimizedChart from '../ui/OptimizedChart';
import {
  AssessmentResultData
} from '../../types/assessment-results';
import PersonaProfileSummary from './PersonaProfileSummary';
import ResultSummaryStats from './ResultSummaryStats';
import VisualSummary from './VisualSummary';
import AssessmentScoresSummary from './AssessmentScoresSummary';
import { removeDebounced, flushDebounced } from '../../utils/localStorageUtils';
import { useAssessmentResult } from '@/hooks/useAssessmentResult';

// Dynamic imports for chart components to improve compilation performance
const AssessmentRadarChart = dynamic(() => import('./StandardizedRadarCharts').then(mod => ({ default: mod.default })), {
  loading: () => (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  ),
  ssr: false
});

const CareerStatsCard = dynamic(() => import('./CareerStatsCard'), {
  loading: () => (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  ),
  ssr: true
});

const SimpleAssessmentChart = dynamic(() => import('./SimpleAssessmentChart'), {
  loading: () => (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  ),
  ssr: false
});

import {
  ArrowLeft,
  Share2,
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
} from './ui-dropdown-menu';

// Safe date parsing and formatting helper (handles various API shapes)
const parseDateFlexible = (input: any): Date | null => {
  const tryParse = (v: any): Date | null => {
    if (v === null || v === undefined || v === '') return null;
    // Numeric epoch handling (seconds vs milliseconds)
    if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))) {
      const n = typeof v === 'string' ? Number(v) : v;
      const ms = n < 1e12 ? n * 1000 : n; // if seconds, convert to ms
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  // Direct value
  const direct = tryParse(input);
  if (direct) return direct;
  // Common field fallbacks from backend responses
  if (input && typeof input === 'object') {
    const fields = ['createdAt', 'created_at', 'createdAtUtc', 'updated_at', 'updatedAt', 'timestamp'];
    for (const f of fields) {
      const d = tryParse((input as any)[f]);
      if (d) return d;
    }
  }
  return null;
};

const formatDateID = (value: any): string => {
  const d = parseDateFlexible(value);
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};


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
const SafeAssessmentRadarChart = ({ scores }: { scores: any }) => {
  const [hasError, setHasError] = React.useState(false);
  const [useSimpleChart, setUseSimpleChart] = React.useState(false);

  if (hasError || useSimpleChart) {
    return <SimpleAssessmentChart scores={scores} />;
  }

  return (
    <div onError={() => {
      console.error('Error rendering AssessmentRadarChart, falling back to SimpleChart');
      setHasError(true);
    }}>
      <AssessmentRadarChart scores={scores} />
    </div>
  );
};

// Safe career stats wrapper component
const SafeCareerStatsCard = ({ scores }: { scores: any }) => {
  return <CareerStatsCard scores={scores} />;
};

interface ResultsPageClientProps {
  initialResult?: AssessmentResultData;
  resultId?: string;
}

function ResultsPageClientComponent({ initialResult, resultId: propResultId }: ResultsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get result ID from props or search params
  const assessmentId = propResultId || searchParams.get('id') || '';
  
  // Use API hook for fetching assessment data
  const {
    data: apiData,
    transformedData,
    isLoading,
    isError,
    error
  } = useAssessmentResult(assessmentId);
  
  // Use API data or fallback to initial result
  const shouldUseFallback = !assessmentId || isError;
  const assessmentResult = shouldUseFallback ? initialResult : apiData?.data;
  
  const currentResultId = useMemo(() => assessmentId || assessmentResult?.id || '', [assessmentId, assessmentResult?.id]);
  
  const [result, setResult] = useState<AssessmentResultData | null>(assessmentResult || null);
  const [exporting, setExporting] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(assessmentResult?.is_public ?? false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Refs for screenshot capture
  const pageRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);
  const personaCardRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef<HTMLDivElement>(null);

  // Clear assessment data when results are displayed (run once on mount)
  // Safe approach: Clear directly without depending on AssessmentProvider
  useEffect(() => {
    // Clear assessment data using debounced localStorage utility
    if (typeof window !== 'undefined') {
      try {
        removeDebounced('assessment-answers');
        removeDebounced('assessment-current-section-index');
        removeDebounced('assessment-name');
        removeDebounced('assessment-submission-time');
        removeDebounced('flagged-questions-encrypted');
        removeDebounced('flagged-questions');
        
        // Flush immediately to ensure data is cleared
        flushDebounced();
      } catch (e) {
        console.error('Failed to clear assessment data:', e);
      }
    }
  }, []); // Empty dependency array = run only once on mount

  // Preload critical chart components for better navigation performance
  useEffect(() => {
    // Preload chart components untuk navigasi yang lebih smooth
    import('./StandardizedRadarCharts');
    import('./CareerStatsCard');
    import('./SimpleAssessmentChart');
  }, []);

  // Helper function to extract scores from transformed data or assessment_data
  const extractScores = useCallback((source: any): any => {
    if (!source) {
      return null;
    }

    // Handle transformed data structure
    if (source.test_data) {
      const { test_data } = source;
      return {
        riasec: test_data.riasec,
        ocean: test_data.ocean,
        viaIs: test_data.viaIs,
        industryScore: {
          technology: Math.round((test_data.riasec.investigative + test_data.riasec.realistic) / 2),
          healthcare: Math.round((test_data.riasec.social + test_data.riasec.investigative) / 2),
          education: Math.round((test_data.riasec.social + test_data.riasec.investigative + test_data.riasec.artistic) / 3),
          business: Math.round((test_data.riasec.enterprising + test_data.riasec.conventional + test_data.riasec.social) / 3),
          creative: Math.round((test_data.riasec.artistic + test_data.riasec.investigative + test_data.riasec.enterprising) / 3),
          service: Math.round((test_data.riasec.social + test_data.riasec.enterprising) / 2)
        }
      };
    }

    // Handle legacy assessment_data structure
    if (source.riasec && source.ocean && source.viaIs) {
      return {
        riasec: source.riasec,
        ocean: source.ocean,
        viaIs: source.viaIs,
        industryScore: source.industryScore
      };
    }

    return null;
  }, []);

  // Extract scores once to avoid multiple calls
  const scores = useMemo(() => {
    if (transformedData && !shouldUseFallback) {
      return extractScores(transformedData);
    }
    return extractScores(result?.test_data);
  }, [extractScores, transformedData, result?.test_data, shouldUseFallback]);

  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);


  // Toggle public/private status (removed API calls)
  const handleTogglePublic = useCallback(async () => {
    setIsTogglingPublic(true);
    try {
      const nextPublic = !isPublic;
      setIsPublic(nextPublic);
      toast({
        title: nextPublic ? 'Hasil assessment kini bersifat publik!' : 'Hasil assessment kini bersifat privat!',
        description: nextPublic
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
  }, [isPublic]);

  const copyToClipboard = useCallback((text: string) => {
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
  }, []);

  // Share link (copy/share)
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hasil Assessment - ${result?.test_result?.archetype || 'FutureGuide'}`,
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
  }, [result?.test_result?.archetype, copyToClipboard]);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting(true);
      setExportType('pdf');

      // Show demo message instead of actual PDF export
      toast({
        title: "Demo Mode",
        description: "PDF export tidak tersedia dalam mode demo.",
        variant: "destructive",
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
  }, []);

  const handleScreenshot = useCallback(async () => {
    try {
      setScreenshotting(true);

      // Show demo message instead of actual screenshot
      toast({
        title: "Demo Mode",
        description: "Screenshot tidak tersedia dalam mode demo.",
        variant: "destructive",
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
  }, []);

  const handleChatbot = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && result) {
        // Cache assessment result so Chat AI page can read it without refetching
        sessionStorage.setItem(`assessmentResult:${currentResultId}`, JSON.stringify(result));
      }
    } catch (e) {
      console.warn('Failed to cache assessment result for chat:', e);
    }
    router.push(`/results/${currentResultId}/chat`);
  }, [result, currentResultId, router]);

  const handleRetrySubmit = useCallback(async () => {
    try {
      setRetrying(true);

      // Show demo message instead of actual retry
      toast({
        title: 'Demo Mode',
        description: 'Submit ulang tidak tersedia dalam mode demo.',
        variant: 'destructive',
      });
    } catch (e: any) {
      toast({
        title: 'Gagal submit ulang',
        description: e?.message || 'Terjadi kesalahan saat mengirim ulang assessment.',
        variant: 'destructive',
      });
    } finally {
      setRetrying(false);
    }
  }, []);

  // Show loading state while fetching data
  if (isLoading && !shouldUseFallback) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-2 sm:gap-4 mb-2">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2 sm:gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-start mt-2 sm:mt-0">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="columns-1 lg:columns-2 gap-6 space-y-6">
            <div className="break-inside-avoid mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="break-inside-avoid mb-6">
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="break-inside-avoid mb-6">
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="break-inside-avoid mb-6">
              <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="break-inside-avoid mb-6">
              <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && !shouldUseFallback) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1f2937] mb-2">
              Error Memuat Hasil Assessment
            </h1>
            <p className="text-[#6b7280] mb-6">
              {error?.message || 'Terjadi kesalahan saat memuat hasil assessment.'}
            </p>
            <Button onClick={handleBack} className="bg-[#6475e9] hover:bg-[#5a6bd8]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              {/* Button Bagikan/Public/Private dipindah ke dropdown */}
              {/* Chat AI Button - kembalikan tombol chat AI di halaman hasil */}
              <Button
                size="sm"
                onClick={handleChatbot}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Diskusikan hasil assessment Anda dengan AI"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat AI
              </Button>
              <button
                onClick={handleRetrySubmit}
                disabled={retrying}
                className="border border-gray-200 px-3 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-60"
                title="Kirim ulang assessment Anda untuk diproses"
              >
                {retrying ? 'Submitting…' : 'submit ulang'}
              </button>
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
                      <Share2 className="w-4 h-4 mr-2" />
                    )}
                    {exporting ? `Mengunduh ${exportType.toUpperCase()}...` :
                     screenshotting ? 'Mengambil Screenshot...' : 'Share'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Salin/Bagikan Link
                  </DropdownMenuItem>
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
              Hasil Assessment - {(transformedData?.test_result?.archetype || result?.test_result?.archetype) || 'Assessment'}
            </h1>
            <p className="text-sm text-[#6b7280]">
              Tanggal: {formatDateID(transformedData || result)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="columns-1 lg:columns-2 gap-6 space-y-6">
          {/* Summary Stats - Grid 2x2 */}
          {scores && (
            <div className="break-inside-avoid mb-6">
              <ResultSummaryStats scores={scores} createdAt={result} />
            </div>
          )}

          {/* Profil Kepribadian Anda */}
          {(transformedData?.test_result || result?.test_result) && (
            <div className="break-inside-avoid mb-6" ref={personaCardRef}>
              <PersonaProfileSummary
                persona={{
                  ...(transformedData?.test_result || result?.test_result),
                  riskTolerance: (transformedData?.test_result?.riskTolerance || result?.test_result?.riskTolerance) as 'high' | 'moderate' | 'low'
                }}
                resultId={currentResultId}
              />
            </div>
          )}

          {/* Assessment Scores Summary */}
          {scores && (
            <div className="break-inside-avoid mb-6">
              <AssessmentScoresSummary
                scores={scores}
                resultId={currentResultId}
              />
            </div>
          )}

          {/* Talent Profile Summary */}
          {scores && (
            <div className="break-inside-avoid mb-6">
              <VisualSummary scores={scores} />
            </div>
          )}

          {/* Radar Chart */}
          {scores && (
            <div className="break-inside-avoid mb-6" ref={radarChartRef}>
              <OptimizedChart
                type="radar"
                data={scores}
                className="w-full"
                lazy={true}
              />
            </div>
          )}

          {/* Show loading message if data is not available */}
          {(!scores || !(transformedData?.test_result || result?.test_result)) && !isLoading && (
            <div className="text-center py-8 col-span-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assessment data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ResultsPageClientComponent, (prevProps, nextProps) => {
  // Enhanced comparison for optimal performance
  // Compare resultId first as it's the most likely to change
  if (prevProps.resultId !== nextProps.resultId) {
    return false;
  }
  
  // Deep comparison for initialResult if it exists
  if (prevProps.initialResult !== nextProps.initialResult) {
    // If both are undefined/null, they're equal
    if (!prevProps.initialResult && !nextProps.initialResult) {
      return true;
    }
    // If one is undefined/null, they're different
    if (!prevProps.initialResult || !nextProps.initialResult) {
      return false;
    }
    // Compare key properties for performance
    return (
      prevProps.initialResult.id === nextProps.initialResult.id &&
      prevProps.initialResult?.test_result?.archetype === nextProps.initialResult?.test_result?.archetype &&
      prevProps.initialResult.is_public === nextProps.initialResult.is_public
    );
  }
  
  return true;
})
