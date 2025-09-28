'use client';

import React, { useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/use-toast';
import { captureElementScreenshot, capturePageScreenshot, downloadBlob } from '../../utils/screenshot-utils';
import { Camera, Download } from 'lucide-react';

export default function TestScreenshotPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCaptureCard = async () => {
    if (!cardRef.current) return;
    
    try {
      toast({
        title: 'Memproses...',
        description: 'Mengambil screenshot card...',
      });

      const screenshot = await captureElementScreenshot(cardRef.current, {
        quality: 0.95,
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadBlob(screenshot, `test-card-${timestamp}.png`);

      toast({
        title: 'Berhasil!',
        description: 'Screenshot card berhasil diunduh.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil screenshot card.',
        variant: 'destructive'
      });
    }
  };

  const handleCaptureContent = async () => {
    if (!contentRef.current) return;
    
    try {
      toast({
        title: 'Memproses...',
        description: 'Mengambil screenshot konten...',
      });

      const screenshot = await captureElementScreenshot(contentRef.current, {
        quality: 0.95,
        scale: 2,
        backgroundColor: '#f8fafc'
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadBlob(screenshot, `test-content-${timestamp}.png`);

      toast({
        title: 'Berhasil!',
        description: 'Screenshot konten berhasil diunduh.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil screenshot konten.',
        variant: 'destructive'
      });
    }
  };

  const handleCapturePage = async () => {
    try {
      toast({
        title: 'Memproses...',
        description: 'Mengambil screenshot halaman penuh...',
      });

      const screenshot = await capturePageScreenshot({
        quality: 0.95,
        scale: 1.5,
        backgroundColor: '#ffffff'
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadBlob(screenshot, `test-page-${timestamp}.png`);

      toast({
        title: 'Berhasil!',
        description: 'Screenshot halaman berhasil diunduh.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil screenshot halaman.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-4xl mx-auto space-y-6" ref={contentRef}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Screenshot Functionality
          </h1>
          <p className="text-gray-600">
            Test halaman untuk menguji fungsi screenshot
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={handleCaptureCard} className="bg-blue-600 hover:bg-blue-700">
            <Camera className="w-4 h-4 mr-2" />
            Screenshot Card
          </Button>
          <Button onClick={handleCaptureContent} className="bg-green-600 hover:bg-green-700">
            <Camera className="w-4 h-4 mr-2" />
            Screenshot Konten
          </Button>
          <Button onClick={handleCapturePage} className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Screenshot Halaman
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card ref={cardRef} className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-blue-600">Test Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ini adalah card pertama untuk testing screenshot functionality.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Features:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• High quality screenshots</li>
                  <li>• Multiple export options</li>
                  <li>• Easy to use interface</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-green-600">Test Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Card kedua dengan konten yang berbeda untuk variasi testing.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Benefits:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Capture specific elements</li>
                  <li>• Full page screenshots</li>
                  <li>• Customizable quality</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Gradient Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Card dengan gradient background untuk testing warna dan efek visual.
            </p>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm">
                Screenshot functionality dapat menangkap berbagai jenis styling termasuk gradient dan efek transparansi.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            © 2024 FutureGuide - Screenshot Test Page
          </p>
        </div>
      </div>
    </div>
  );
}
