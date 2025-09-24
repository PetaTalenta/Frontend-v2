'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AssessmentTable } from '../../components/dashboard/assessment-table';
import PersonaProfileCard from '../../components/results/PersonaProfileCard';
import { fetchAssessmentHistoryFromAPI as formatAssessmentHistory, calculateUserStats } from '../../utils/user-stats';
import { PersonaProfile, AssessmentResult } from '../../types/assessment-results';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssessmentData {
  id: number;
  nama: string;
  tipe: string;
  tanggal: string;
  status: string;
  resultId: string;
}

export default function TestPersonaTitleConsistency() {
  const router = useRouter();
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentData[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [consistencyCheck, setConsistencyCheck] = useState<{
    consistent: boolean;
    issues: string[];
  }>({ consistent: true, issues: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user stats and assessment history
      const userStats = await calculateUserStats();
      const history = await formatAssessmentHistory();
      
      setAssessmentHistory(history);
      setAssessmentResults(userStats.assessmentResults);
      
      // Check consistency
      checkConsistency(history, userStats.assessmentResults);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConsistency = (history: AssessmentData[], results: AssessmentResult[]) => {
    const issues: string[] = [];
    
    // Check each history item against its corresponding result
    history.forEach(historyItem => {
      if (historyItem.resultId && historyItem.status === 'Selesai') {
        // Find corresponding result
        const result = results.find(r => r.id === historyItem.resultId);
        
        if (result) {
          const historyTitle = historyItem.nama;
          const profileTitle = result.persona_profile.title;
          
          if (historyTitle !== profileTitle) {
            issues.push(
              `Assessment ${historyItem.resultId}: History shows "${historyTitle}" but profile shows "${profileTitle}"`
            );
          }
        } else {
          // Check localStorage
          try {
            const storedResult = JSON.parse(localStorage.getItem(`assessment-result-${historyItem.resultId}`) || '{}');
            if (storedResult.persona_profile?.title) {
              const historyTitle = historyItem.nama;
              const profileTitle = storedResult.persona_profile.title;
              
              if (historyTitle !== profileTitle) {
                issues.push(
                  `Assessment ${historyItem.resultId}: History shows "${historyTitle}" but localStorage profile shows "${profileTitle}"`
                );
              }
            }
          } catch (e) {
            issues.push(`Assessment ${historyItem.resultId}: Could not verify consistency - localStorage error`);
          }
        }
      }
    });
    
    setConsistencyCheck({
      consistent: issues.length === 0,
      issues
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              {consistencyCheck.consistent ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Persona Title Consistency Test
              </h1>
              <p className="text-gray-600">
                Verifikasi konsistensi nama persona antara tabel history dan profil kepribadian
              </p>
            </div>
          </div>
        </div>

        {/* Consistency Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {consistencyCheck.consistent ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Consistency Check Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consistencyCheck.consistent ? (
              <div className="text-green-800 bg-green-50 p-4 rounded-lg">
                <p className="font-semibold">✅ All persona titles are consistent!</p>
                <p className="text-sm mt-1">
                  Assessment history table and personality profile cards show the same titles.
                </p>
              </div>
            ) : (
              <div className="text-red-800 bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">❌ Found {consistencyCheck.issues.length} consistency issue(s):</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {consistencyCheck.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <Button onClick={loadData} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Check
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assessment History Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment History Table</h2>
          <AssessmentTable data={assessmentHistory as any} />
        </div>

        {/* Sample Personality Profile Cards */}
        {assessmentResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personality Profile Cards (First 3 Results)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessmentResults.slice(0, 3).map((result) => (
                <div key={result.id}>
                  <PersonaProfileCard persona={result.persona_profile} />
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    Result ID: {result.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <strong>Assessment History Items:</strong> {assessmentHistory.length}
              </div>
              <div>
                <strong>Assessment Results:</strong> {assessmentResults.length}
              </div>
              <div>
                <strong>Completed Assessments:</strong> {assessmentHistory.filter(item => item.status === 'Selesai').length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
