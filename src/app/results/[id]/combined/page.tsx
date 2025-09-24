'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import { toast } from '../../../../components/ui/use-toast';
import { AssessmentResult } from '../../../../types/assessment-results';
import apiService from '../../../../services/apiService';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import CombinedAssessmentGrid from '../../../../components/results/CombinedAssessmentGrid';

export default function CombinedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resultId = params.id as string;

  useEffect(() => {
    async function fetchResult() {
      if (!resultId) return;

      try {
        setLoading(true);
        const resp = await apiService.getResultById(resultId);
        if (resp?.success) setResult(resp.data); else throw new Error('Failed to load');
      } catch (err) {
        console.error('Error fetching assessment result:', err);
        setError('Failed to load assessment result');
        toast({
          title: "Error",
          description: "Failed to load assessment result",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-[500px] w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error Loading Assessment Result
            </h1>
            <p className="text-gray-600 mb-8">
              {error || 'Assessment result not found'}
            </p>
            <Link href="/results">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/results/${resultId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Ringkasan
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <Grid3X3 className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Combined Assessment Overview
              </h1>
              <p className="text-gray-600">
                Tampilan grid lengkap untuk RIASEC, OCEAN, dan VIA assessments
              </p>
            </div>
          </div>

          {/* Assessment Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {result.persona_profile?.name || 'Assessment Result'}
                </h2>
                <p className="text-sm text-gray-600">
                  Completed on {new Date(result.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/results/${resultId}/riasec`}>
                  <Button variant="outline" size="sm">
                    Detail RIASEC
                  </Button>
                </Link>
                <Link href={`/results/${resultId}/ocean`}>
                  <Button variant="outline" size="sm">
                    Detail OCEAN
                  </Button>
                </Link>
                <Link href={`/results/${resultId}/via`}>
                  <Button variant="outline" size="sm">
                    Detail VIA
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Assessment Grid */}
        <CombinedAssessmentGrid scores={{
          riasec: result.assessment_data.riasec,
          ocean: result.assessment_data.ocean,
          viaIs: result.assessment_data.viaIs,
          industryScore: result.assessment_data.industryScore
        }} />

        {/* Additional Navigation */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Explore More Details
            </h3>
            <p className="text-gray-600 mb-4">
              Untuk analisis yang lebih mendalam, kunjungi halaman detail masing-masing assessment
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`/results/${resultId}/riasec`}>
                <Button variant="outline">
                  RIASEC Detail
                </Button>
              </Link>
              <Link href={`/results/${resultId}/ocean`}>
                <Button variant="outline">
                  OCEAN Detail
                </Button>
              </Link>
              <Link href={`/results/${resultId}/via`}>
                <Button variant="outline">
                  VIA Detail
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
