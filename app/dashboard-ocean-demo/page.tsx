'use client';

import React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { WorldMapCard } from '../../components/dashboard/world-map-card';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OceanScores } from '../../types/assessment-results';

export default function DashboardOceanDemo() {
  const router = useRouter();

  // Sample Ocean scores for demonstration
  const sampleOceanScores: OceanScores = {
    openness: 85,
    conscientiousness: 72,
    extraversion: 45,
    agreeableness: 90,
    neuroticism: 30
  };

  const lowOceanScores: OceanScores = {
    openness: 25,
    conscientiousness: 40,
    extraversion: 15,
    agreeableness: 35,
    neuroticism: 80
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <BarChart3 className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Ocean Bar Chart Demo
              </h1>
              <p className="text-gray-600">
                Demonstrasi integrasi Ocean personality statistics di dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Default Values (No Assessment Data) */}
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-900">
                  Default Values
                </CardTitle>
                <p className="text-sm text-blue-700">
                  Ketika tidak ada data assessment (oceanScores = undefined)
                </p>
              </CardHeader>
            </Card>
            
            <WorldMapCard
              title="User Default"
              description="Using default Ocean scores when no assessment data is available."
              // oceanScores prop not provided - will use defaults
            />
          </div>

          {/* High Scores */}
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900">
                  High Scores
                </CardTitle>
                <p className="text-sm text-green-700">
                  Data assessment dengan skor tinggi
                </p>
              </CardHeader>
            </Card>
            
            <WorldMapCard
              title="High Achiever"
              description="Assessment results showing high personality scores."
              oceanScores={sampleOceanScores}
            />
          </div>

          {/* Low Scores */}
          <div className="space-y-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-900">
                  Low Scores
                </CardTitle>
                <p className="text-sm text-orange-700">
                  Data assessment dengan skor rendah
                </p>
              </CardHeader>
            </Card>
            
            <WorldMapCard
              title="Introvert Profile"
              description="Assessment results showing lower personality scores."
              oceanScores={lowOceanScores}
            />
          </div>
        </div>

        {/* Score Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>High Scores Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Openness (OPNS):</span>
                  <span className="font-medium">{sampleOceanScores.openness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Conscientiousness (CONS):</span>
                  <span className="font-medium">{sampleOceanScores.conscientiousness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Extraversion (EXTN):</span>
                  <span className="font-medium">{sampleOceanScores.extraversion}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Agreeableness (AGRS):</span>
                  <span className="font-medium">{sampleOceanScores.agreeableness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Neuroticism (NESM):</span>
                  <span className="font-medium">{sampleOceanScores.neuroticism}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Scores Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Openness (OPNS):</span>
                  <span className="font-medium">{lowOceanScores.openness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Conscientiousness (CONS):</span>
                  <span className="font-medium">{lowOceanScores.conscientiousness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Extraversion (EXTN):</span>
                  <span className="font-medium">{lowOceanScores.extraversion}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Agreeableness (AGRS):</span>
                  <span className="font-medium">{lowOceanScores.agreeableness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Neuroticism (NESM):</span>
                  <span className="font-medium">{lowOceanScores.neuroticism}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Dynamic Data:</strong> Ocean bar chart sekarang menggunakan data dari hasil assessment terbaru.
              </p>
              <p>
                <strong>Fallback Values:</strong> Ketika tidak ada data assessment, menggunakan nilai default yang masuk akal.
              </p>
              <p>
                <strong>Styling Consistency:</strong> Mempertahankan tampilan visual yang sama dengan desain asli.
              </p>
              <p>
                <strong>Error Handling:</strong> Graceful fallback ketika terjadi error dalam fetching data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
