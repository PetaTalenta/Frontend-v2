'use client';

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
import { runPDFTest, testPDFGeneration, downloadTestPDF } from '../../utils/test-pdf-generation';
import { Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestPDFImprovedPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    message: string;
    pdfSize?: number;
    timestamp?: string;
  } | null>(null);

  const handleTestPDFGeneration = async () => {
    setIsGenerating(true);
    setTestResults(null);

    try {
      toast({
        title: 'Memulai Test PDF',
        description: 'Sedang menguji PDF generation yang telah diperbaiki...',
      });

      const startTime = Date.now();
      const pdfBlob = await testPDFGeneration();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Download the PDF
      downloadTestPDF(pdfBlob);

      setTestResults({
        success: true,
        message: `PDF berhasil dibuat dalam ${duration}ms`,
        pdfSize: pdfBlob.size,
        timestamp: new Date().toLocaleString('id-ID')
      });

      toast({
        title: 'Test Berhasil!',
        description: `PDF test berhasil dibuat dan diunduh. Ukuran: ${Math.round(pdfBlob.size / 1024)}KB`,
      });

    } catch (error) {
      console.error('Test PDF generation error:', error);
      
      setTestResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toLocaleString('id-ID')
      });

      toast({
        title: 'Test Gagal',
        description: 'Terjadi error saat menguji PDF generation.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCompleteTest = async () => {
    setIsGenerating(true);
    setTestResults(null);

    try {
      toast({
        title: 'Menjalankan Test Lengkap',
        description: 'Sedang menjalankan test PDF generation lengkap...',
      });

      await runPDFTest();

      setTestResults({
        success: true,
        message: 'Test lengkap berhasil dijalankan',
        timestamp: new Date().toLocaleString('id-ID')
      });

      toast({
        title: 'Test Lengkap Berhasil!',
        description: 'Semua test PDF generation berhasil dijalankan.',
      });

    } catch (error) {
      console.error('Complete PDF test error:', error);
      
      setTestResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toLocaleString('id-ID')
      });

      toast({
        title: 'Test Lengkap Gagal',
        description: 'Terjadi error saat menjalankan test lengkap.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Test PDF Generation (Improved)
          </h1>
          <p className="text-lg text-gray-600">
            Test halaman untuk menguji PDF generation yang telah diperbaiki
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Generation Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={handleTestPDFGeneration}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating PDF...' : 'Test PDF Generation'}
                </Button>

                <Button
                  onClick={handleRunCompleteTest}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Running Tests...' : 'Run Complete Test'}
                </Button>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Test PDF Generation:</strong> Membuat PDF dengan data sample dan mengunduhnya</p>
                <p><strong>Run Complete Test:</strong> Menjalankan semua test PDF generation</p>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults?.success === false ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-3">
                  <Badge 
                    variant={testResults.success ? "default" : "destructive"}
                    className="mb-2"
                  >
                    {testResults.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  
                  <div className="space-y-2 text-sm">
                    <p><strong>Message:</strong> {testResults.message}</p>
                    {testResults.pdfSize && (
                      <p><strong>PDF Size:</strong> {Math.round(testResults.pdfSize / 1024)}KB</p>
                    )}
                    <p><strong>Timestamp:</strong> {testResults.timestamp}</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada hasil test. Klik tombol di atas untuk memulai test.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Improvements Made */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Perbaikan yang Telah Dilakukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ Data Mapping Fixed</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Perbaiki mapping RIASEC (R,I,A,S,E,C → realistic, investigative, etc)</li>
                  <li>• Perbaiki mapping Big Five (O,C,E,A,N → openness, conscientiousness, etc)</li>
                  <li>• Data VIA Character Strengths sudah benar</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🎨 Layout Improvements</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Spacing dan margin yang lebih konsisten</li>
                  <li>• Bar chart yang lebih besar dan jelas</li>
                  <li>• Highlight untuk top scores</li>
                  <li>• Typography yang lebih rapi</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
