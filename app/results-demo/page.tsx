'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Eye, 
  ArrowRight, 
  BarChart3, 
  User, 
  Briefcase,
  Star,
  ArrowLeft
} from 'lucide-react';

export default function ResultsDemoPage() {
  const router = useRouter();

  const demoResults = [
    {
      id: 'result-001',
      title: 'The Creative Investigator',
      description: 'Profil untuk individu dengan kreativitas tinggi dan kemampuan analitis yang kuat',
      highlights: ['Kreativitas: 92', 'Investigative: 85', 'Openness: 88'],
      careers: ['Data Scientist', 'UX/UI Designer', 'Product Manager'],
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'result-002', 
      title: 'The Inspiring Leader',
      description: 'Profil untuk pemimpin natural dengan kemampuan sosial dan empati yang tinggi',
      highlights: ['Social: 89', 'Leadership: 87', 'Extraversion: 91'],
      careers: ['HR Director', 'Management Consultant', 'Executive Coach'],
      color: 'from-green-500 to-teal-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-[#eaecf0]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#1e1e1e]">
              Demo Hasil Assessment
            </h1>
            <p className="text-lg text-[#64707d] max-w-2xl mx-auto">
              Jelajahi contoh hasil assessment ATMA untuk memahami bagaimana sistem menganalisis 
              kepribadian dan memberikan rekomendasi karir yang personal.
            </p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-[#eaecf0] text-center">
            <CardContent className="p-6">
              <div className="p-3 bg-[#e7eaff] rounded-full w-fit mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-[#6475e9]" />
              </div>
              <h3 className="font-semibold text-[#1e1e1e] mb-2">
                Analisis Komprehensif
              </h3>
              <p className="text-sm text-[#64707d]">
                Hasil dari 3 assessment psikometri: Big Five, RIASEC, dan VIA Character Strengths
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#eaecf0] text-center">
            <CardContent className="p-6">
              <div className="p-3 bg-[#e7eaff] rounded-full w-fit mx-auto mb-4">
                <User className="w-6 h-6 text-[#6475e9]" />
              </div>
              <h3 className="font-semibold text-[#1e1e1e] mb-2">
                Profil Kepribadian
              </h3>
              <p className="text-sm text-[#64707d]">
                Persona unik dengan deskripsi mendalam, kekuatan, dan rekomendasi pengembangan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#eaecf0] text-center">
            <CardContent className="p-6">
              <div className="p-3 bg-[#e7eaff] rounded-full w-fit mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-[#6475e9]" />
              </div>
              <h3 className="font-semibold text-[#1e1e1e] mb-2">
                Rekomendasi Karir
              </h3>
              <p className="text-sm text-[#64707d]">
                Saran karir dengan analisis prospek, gaji, dan pertumbuhan industri
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Results */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1e1e1e] mb-2">
              Contoh Hasil Assessment
            </h2>
            <p className="text-[#64707d]">
              Klik pada salah satu contoh di bawah untuk melihat hasil assessment lengkap
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {demoResults.map((result) => (
              <Card key={result.id} className="bg-white border-[#eaecf0] overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${result.color}`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-[#1e1e1e] mb-2">
                        {result.title}
                      </CardTitle>
                      <p className="text-sm text-[#64707d] leading-relaxed">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Highlights */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#1e1e1e] mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Skor Tertinggi
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {result.highlights.map((highlight, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="bg-[#f8fafc] text-[#1e1e1e] justify-start"
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Career Recommendations */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#1e1e1e] mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#6475e9]" />
                      Rekomendasi Karir
                    </h4>
                    <div className="space-y-1">
                      {result.careers.map((career, index) => (
                        <div key={index} className="text-sm text-[#64707d] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#6475e9] rounded-full" />
                          {career}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View Button */}
                  <Button 
                    className="w-full bg-[#6475e9] hover:bg-[#5a6bd8] text-white"
                    onClick={() => router.push(`/results/${result.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat Hasil Lengkap
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-[#6475e9] to-[#5a6bd8] text-white border-none">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">
              Siap Untuk Assessment Anda Sendiri?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Dapatkan analisis kepribadian yang personal dan rekomendasi karir yang sesuai 
              dengan potensi unik Anda melalui assessment ATMA.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                variant="secondary"
                onClick={() => router.push('/select-assessment')}
                className="bg-white text-[#6475e9] hover:bg-white/90"
              >
                Mulai Assessment
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/results')}
                className="border-white text-white hover:bg-white/10"
              >
                Lihat Semua Hasil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
