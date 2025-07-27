'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { calculateUserProgress, getLatestAssessmentFromArchive } from '../../services/user-stats';

export default function TestRiasecPage() {
  const [riasecData, setRiasecData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  // Setup test data in localStorage
  const setupTestData = () => {
    const mockResult = {
      id: 'test-result-001',
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      status: 'completed',
      assessment_data: {
        riasec: {
          realistic: 75,
          investigative: 85,
          artistic: 65,
          social: 70,
          enterprising: 80,
          conventional: 60
        },
        ocean: {
          openness: 88,
          conscientiousness: 67,
          extraversion: 45,
          agreeableness: 72,
          neuroticism: 25
        },
        viaIs: {
          creativity: 92,
          curiosity: 89,
          judgment: 78
        }
      },
      persona_profile: {
        title: 'Test Assessment Result',
        description: 'This is a test assessment result for RIASEC data testing.',
        strengths: ['Analytical thinking', 'Creativity'],
        recommendations: ['Consider technical roles'],
        careerRecommendation: [],
        roleModel: []
      }
    };

    localStorage.setItem('assessment-result-test-result-001', JSON.stringify(mockResult));
    
    // Add to assessment history
    const history = [{
      id: 1,
      nama: 'Test Assessment',
      tipe: 'Personality Assessment',
      tanggal: new Date().toLocaleDateString('id-ID'),
      status: 'Selesai',
      resultId: 'test-result-001'
    }];
    
    localStorage.setItem('assessment-history', JSON.stringify(history));
    
    console.log('✅ Test data setup complete!');
  };

  // Test the calculateUserProgress function
  const testCalculateUserProgress = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing calculateUserProgress function...');
      
      // Create mock user stats
      const mockUserStats = {
        totalAnalysis: 1,
        completed: 1,
        processing: 0,
        tokenBalance: 10,
        assessmentResults: [
          {
            id: 'test-result-001',
            userId: 'current-user',
            createdAt: new Date().toISOString(),
            status: 'completed' as const,
            assessment_data: {
              riasec: {
                realistic: 75,
                investigative: 85,
                artistic: 65,
                social: 70,
                enterprising: 80,
                conventional: 60
              },
              ocean: {
                openness: 88,
                conscientiousness: 67,
                extraversion: 45,
                agreeableness: 72,
                neuroticism: 25
              },
              viaIs: {
                creativity: 92,
                curiosity: 89,
                judgment: 78
              }
            },
            persona_profile: {
              title: 'Test Assessment Result',
              description: 'Test description',
              strengths: [],
              recommendations: [],
              careerRecommendation: [],
              roleModel: []
            }
          }
        ]
      };

      const progressData = await calculateUserProgress(mockUserStats);
      setRiasecData(progressData);
      setTestResults({
        success: true,
        message: 'calculateUserProgress function executed successfully',
        data: progressData
      });
      
      console.log('✅ Test completed successfully:', progressData);
      
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Test failed');
      setTestResults({
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Test Archive API function
  const testArchiveAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing Archive API function...');
      const result = await getLatestAssessmentFromArchive();
      setTestResults({
        success: true,
        message: 'Archive API test completed',
        data: result
      });
      console.log('✅ Archive API test result:', result);
    } catch (err) {
      console.error('❌ Archive API test failed:', err);
      setTestResults({
        success: false,
        message: err instanceof Error ? err.message : 'Archive API test failed',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>RIASEC Data Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={setupTestData}>
                Setup Test Data
              </Button>
              <Button onClick={testCalculateUserProgress} disabled={loading}>
                Test calculateUserProgress
              </Button>
              <Button onClick={testArchiveAPI} disabled={loading}>
                Test Archive API
              </Button>
            </div>
            
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}
          </CardContent>
        </Card>

        {riasecData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>RIASEC Progress Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riasecData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded ${testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p><strong>Status:</strong> {testResults.success ? 'Success' : 'Failed'}</p>
                <p><strong>Message:</strong> {testResults.message}</p>
                {testResults.data && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(testResults.data, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
