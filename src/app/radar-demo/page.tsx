'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { AssessmentScores } from '../../types/assessment-results';
// Static imports to avoid webpack dynamic import issues
import AssessmentRadarChart from '../../components/results/AssessmentRadarChart';
import CareerStatsCard from '../../components/results/CareerStatsCard';

// Safe wrapper components with error handling
const SafeAssessmentRadarChart = ({ scores }: { scores: AssessmentScores }) => {
  const [isClient, setIsClient] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

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

  if (hasError) {
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Chart tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
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
    console.error('Error rendering AssessmentRadarChart:', error);
    setHasError(true);
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Chart tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
  }
};

const SafeCareerStatsCard = ({ scores }: { scores: AssessmentScores }) => {
  const [isClient, setIsClient] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
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
    );
  }

  if (hasError) {
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Stats tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
  }

  try {
    return (
      <React.Suspense fallback={
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
      }>
        <CareerStatsCard scores={scores} />
      </React.Suspense>
    );
  } catch (error) {
    console.error('Error rendering CareerStatsCard:', error);
    setHasError(true);
    return (
      <Card className="bg-white border-gray-200/60 shadow-sm">
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Stats tidak dapat dimuat. Silakan refresh halaman.</p>
          </div>
        </div>
      </Card>
    );
  }
};

export default function RadarDemoPage() {
  const router = useRouter();

  // Sample assessment data for demonstration
  const sampleScores: AssessmentScores = {
    riasec: {
      realistic: 65,
      investigative: 85,
      artistic: 78,
      social: 72,
      enterprising: 68,
      conventional: 58,
    },
    ocean: {
      openness: 82,
      conscientiousness: 75,
      extraversion: 68,
      agreeableness: 79,
      neuroticism: 45,
    },
    viaIs: {
      creativity: 88,
      curiosity: 85,
      judgment: 78,
      loveOfLearning: 82,
      perspective: 75,
      bravery: 70,
      perseverance: 85,
      honesty: 88,
      zest: 72,
      love: 75,
      kindness: 82,
      socialIntelligence: 78,
      teamwork: 80,
      fairness: 85,
      leadership: 68,
      forgiveness: 75,
      humility: 70,
      prudence: 72,
      selfRegulation: 68,
      appreciationOfBeauty: 78,
      gratitude: 82,
      hope: 80,
      humor: 75,
      spirituality: 65,
    },
  };

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
              className="border-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#1f2937]">
                Radar Chart Demo
              </h1>
              <p className="text-sm text-[#6b7280]">
                Preview of the new radar chart styling based on your design
              </p>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SafeAssessmentRadarChart scores={sampleScores} />
          <SafeCareerStatsCard scores={sampleScores} />
        </div>

        {/* Info Card */}
        <div className="bg-white border border-gray-200/60 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
            🎯 New Radar Chart Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#6b7280]">
            <div>
              <h4 className="font-medium text-[#374151] mb-2">Visual Improvements:</h4>
              <ul className="space-y-1">
                <li>• Hexagonal grid layout (6 categories)</li>
                <li>• Subtle color scheme matching your design</li>
                <li>• Enhanced tooltips with full category names</li>
                <li>• Professional polygon styling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#374151] mb-2">Categories Mapping:</h4>
              <ul className="space-y-1">
                <li>• DEV → Development (Investigative)</li>
                <li>• DESIGN → Design (Artistic)</li>
                <li>• MGMT → Management (Enterprising)</li>
                <li>• SALES → Sales (Enterprising + Social)</li>
                <li>• SUPPORT → Support (Social)</li>
                <li>• ADMIN → Administration (Conventional)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
