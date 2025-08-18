'use client';

import React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/use-toast';
import { exportMultiPagePDF, downloadMultiPagePDF } from '../../utils/multi-page-pdf-export';
import { BookOpen, FileText, Download } from 'lucide-react';

// Mock assessment result for testing
const mockResult = {
  id: 'test-123',
  createdAt: new Date().toISOString(),
  persona_profile: {
    title: 'The Innovative Problem Solver',
    description: 'Anda adalah seseorang yang memiliki kemampuan luar biasa dalam mengidentifikasi masalah kompleks dan menemukan solusi kreatif. Dengan kombinasi pemikiran analitis dan kreativitas, Anda mampu melihat peluang di mana orang lain melihat hambatan.',
    strengths: [
      'Pemikiran analitis yang tajam',
      'Kreativitas dalam pemecahan masalah',
      'Kemampuan adaptasi yang tinggi',
      'Leadership dalam situasi sulit',
      'Komunikasi yang efektif'
    ],
    career_recommendations: [
      'Product Manager',
      'Innovation Consultant',
      'Research & Development Lead',
      'Strategic Planner',
      'Technology Architect'
    ]
  },
  assessment_data: {
    riasec: {
      realistic: 65,
      investigative: 85,
      artistic: 75,
      social: 60,
      enterprising: 80,
      conventional: 45
    },
    ocean: {
      openness: 88,
      conscientiousness: 75,
      extraversion: 70,
      agreeableness: 65,
      neuroticism: 35
    },
    viaIs: {
      creativity: 90,
      curiosity: 85,
      judgment: 80,
      loveOfLearning: 88,
      perspective: 75,
      bravery: 70,
      perseverance: 82,
      honesty: 78,
      zest: 72,
      love: 68,
      kindness: 75,
      socialIntelligence: 70,
      teamwork: 73,
      fairness: 80,
      leadership: 85,
      forgiveness: 65,
      humility: 60,
      prudence: 70,
      selfRegulation: 75,
      appreciationOfBeauty: 78,
      gratitude: 72,
      hope: 80,
      humor: 75,
      spirituality: 55
    }
  }
};

export default function TestPDFExportPage() {
  const handleTestPDFExport = async () => {
    try {
      toast({
        title: 'Memproses...',
        description: 'Sedang membuat PDF test...',
      });

      const pdfBlob = await exportMultiPagePDF('test-123', mockResult as any, {
        quality: 0.95,
        scale: 1.2,
        format: 'a4',
        orientation: 'portrait',
        margin: 5,
        waitTime: 3000
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `test-assessment-complete-${timestamp}.pdf`;

      downloadMultiPagePDF(pdfBlob, filename);
      
      toast({
        title: 'Berhasil!',
        description: 'PDF test berhasil diunduh.',
      });
      
    } catch (err) {
      console.error('Test PDF export error:', err);
      toast({
        title: 'Error',
        description: 'Gagal membuat PDF test.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test PDF Export Functionality
          </h1>
          <p className="text-gray-600">
            Test halaman untuk menguji fungsi export PDF lengkap
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Button onClick={handleTestPDFExport} className="bg-blue-600 hover:bg-blue-700" size="lg">
            <BookOpen className="w-5 h-5 mr-2" />
            Test Export PDF Lengkap
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-blue-600 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Mock Assessment Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Persona Profile:</h4>
                  <p className="text-sm text-gray-600">{mockResult.persona_profile.title}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Top RIASEC Scores:</h4>
                  <div className="text-sm text-gray-600">
                    {Object.entries(mockResult.assessment_data.riasec)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key}>{key.toUpperCase()}: {value}</div>
                      ))
                    }
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Top OCEAN Scores:</h4>
                  <div className="text-sm text-gray-600">
                    {Object.entries(mockResult.assessment_data.ocean)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-green-600 flex items-center">
                <Download className="w-5 h-5 mr-2" />
                PDF Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Cover page dengan informasi assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Screenshot halaman hasil assessment utama</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Screenshot detail RIASEC Holland Codes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Screenshot detail Big Five (OCEAN) traits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Screenshot detail VIA Character Strengths</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Footer dengan nomor halaman</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">PDF Export Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• PDF berisi screenshot dari semua halaman assessment</p>
              <p>• Format A4 dengan orientasi portrait</p>
              <p>• Kualitas tinggi dengan resolusi 1.2x</p>
              <p>• Include cover page dan footer di setiap halaman</p>
              <p>• Menggunakan popup window untuk capture setiap halaman</p>
              <p>• File akan otomatis terdownload setelah proses selesai</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            © 2024 PetaTalenta - PDF Export Test Page
          </p>
        </div>
      </div>
    </div>
  );
}
