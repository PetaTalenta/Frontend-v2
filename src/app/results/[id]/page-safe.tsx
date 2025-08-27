'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AssessmentResult } from '../../../types/assessment-results';
import { getAssessmentResult } from '../../../services/assessment-api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Download, AlertCircle } from 'lucide-react';

// Safe results page that doesn't use any dynamic imports or complex chart libraries
export default function SafeResultsPage() {
  const params = useParams();
  const resultId = params.id as string;
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SafeResultsPage: Loading result for ID:', resultId);

    const loadResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const assessmentResult = await getAssessmentResult(resultId);
        console.log('SafeResultsPage: Result loaded:', assessmentResult);

        if (!assessmentResult) {
          console.log('SafeResultsPage: No result found for ID:', resultId);
          setError('Assessment result not found');
          return;
        }

        setResult(assessmentResult);
      } catch (err) {
        console.error('SafeResultsPage: Error loading result:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment result');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Assessment Result Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'The assessment result you\'re looking for could not be found.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-[#6475e9] text-white px-4 py-2 rounded-lg hover:bg-[#5a6bd8]"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/my-results'}
                className="border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                View All Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract scores safely
  const scores = result.assessment_data;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Assessment Results
              </h1>
              <p className="text-gray-600">
                Hasil analisis kepribadian dan minat karir Anda
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Persona Profile */}
          {result.persona_profile && (
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {result.persona_profile.archetype || result.persona_profile.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  {result.persona_profile.shortSummary || result.persona_profile.description}
                </p>

                {/* Strengths */}
                {result.persona_profile.strengths && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Kekuatan Utama</h3>
                    <ul className="space-y-2">
                      {result.persona_profile.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.persona_profile.recommendations && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Rekomendasi</h3>
                    <ul className="space-y-2">
                      {result.persona_profile.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">→</span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assessment Scores */}
          {scores && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* RIASEC */}
              {scores.riasec && (
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">RIASEC Holland Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(scores.riasec).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-gray-700 capitalize">{key}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* OCEAN */}
              {scores.ocean && (
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Big Five Personality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(scores.ocean).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-gray-700 capitalize">{key}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VIA Top Strengths */}
              {scores.viaIs && (
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Top Character Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(scores.viaIs)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 8)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-gray-700 text-sm capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-600 h-2 rounded-full"
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 w-8">{value}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Career Matches */}
          {result.persona_profile?.career_matches && (
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Career Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.persona_profile.career_matches.map((career, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{career.title}</h4>
                        <span className="text-sm font-medium text-green-600">
                          {career.match_percentage}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{career.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
