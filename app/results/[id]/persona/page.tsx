'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Skeleton } from '../../../../components/ui/skeleton';
import { toast } from '../../../../components/ui/use-toast';
import { AssessmentResult } from '../../../../types/assessment-results';
import { getAssessmentResult } from '../../../../services/assessment-api';
import { ArrowLeft, User, Star, Target, Users, Briefcase, TrendingUp } from 'lucide-react';

export default function PersonaDetailPage() {
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
        const data = await getAssessmentResult(resultId);
        setResult(data);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'Assessment result not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const profile = result.persona_profile;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <User className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profil Persona Lengkap
              </h1>
              <p className="text-gray-600">
                Analisis mendalam kepribadian dan potensi Anda
              </p>
            </div>
          </div>

          {/* Persona Title Card */}
          <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="p-4 bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-2">{profile.title}</h2>
                <p className="text-white/80 text-lg">Profil Kepribadian Anda</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Description */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6 text-[#6475e9]" />
              Deskripsi Kepribadian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {profile.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Kekuatan Utama
            </CardTitle>
            <p className="text-gray-600">Area-area di mana Anda unggul dan dapat diandalkan</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium leading-relaxed">{strength}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Development Recommendations */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-green-500" />
              Rekomendasi Pengembangan
            </CardTitle>
            <p className="text-gray-600">Area-area yang dapat Anda kembangkan untuk pertumbuhan lebih lanjut</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {profile.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium leading-relaxed">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Models */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Role Model
            </CardTitle>
            <p className="text-gray-600">Tokoh-tokoh yang memiliki karakteristik serupa dengan profil Anda</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.roleModel.map((model, index) => (
                <div key={index} className="text-center">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                    <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{model}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-500" />
              Rekomendasi Karir
            </CardTitle>
            <p className="text-gray-600">Karir yang sesuai dengan profil kepribadian Anda</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.careerRecommendation.map((career, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {career.careerName}
                        </h3>
                        {career.matchPercentage && (
                          <Badge 
                            variant="secondary" 
                            className="bg-purple-100 text-purple-700 font-medium"
                          >
                            {career.matchPercentage}% Match
                          </Badge>
                        )}
                      </div>
                      {career.description && (
                        <p className="text-gray-600 leading-relaxed mb-3">
                          {career.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Career Prospect */}
                  {career.careerProspect && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900 text-sm">Prospek Karir:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Growth: </span>
                          <span className="font-medium">{career.careerProspect.growth}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Salary: </span>
                          <span className="font-medium">{career.careerProspect.salary}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Demand: </span>
                          <span className="font-medium">{career.careerProspect.demand}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights and Tips */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Tips Pengembangan Diri
                </h3>
                <div className="space-y-2 text-blue-800">
                  <p className="text-sm leading-relaxed">
                    • <strong>Manfaatkan kekuatan utama Anda</strong> dalam aktivitas sehari-hari dan pekerjaan
                  </p>
                  <p className="text-sm leading-relaxed">
                    • <strong>Fokus pada area pengembangan</strong> yang telah diidentifikasi untuk pertumbuhan optimal
                  </p>
                  <p className="text-sm leading-relaxed">
                    • <strong>Pelajari dari role model</strong> yang memiliki karakteristik serupa dengan Anda
                  </p>
                  <p className="text-sm leading-relaxed">
                    • <strong>Eksplorasi karir yang direkomendasikan</strong> melalui magang, volunteering, atau networking
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Summary */}
        <div className="text-center">
          <Link href={`/results/${resultId}`}>
            <Button size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Ringkasan Hasil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
