import Link from 'next/link';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Brain, 
  Target, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Star,
  Shield,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e7eaff]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-[#6475e9]">FutureGuide</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-gray-600 hover:text-[#6475e9]">
                  Masuk
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-[#6475e9] hover:bg-[#5a6bd8]">
                  Mulai Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1f2937] mb-6">
            Temukan Potensi Terbaik Anda dengan
            <span className="text-[#6475e9] block">AI-Driven Assessment</span>
          </h1>
          <p className="text-xl text-[#6b7280] mb-8 max-w-3xl mx-auto">
            Platform assessment kepribadian dan bakat yang menggunakan AI untuk memberikan 
            analisis mendalam tentang potensi karir dan pengembangan diri Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-[#6475e9] hover:bg-[#5a6bd8] text-lg px-8 py-3">
                Mulai Assessment Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">
              Mengapa Memilih FutureGuide?
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Teknologi AI terdepan untuk analisis kepribadian dan pemetaan bakat yang akurat
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-[#eaecf0] hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#e7eaff] rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-[#6475e9]" />
                </div>
                <CardTitle className="text-[#1f2937]">AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Analisis mendalam menggunakan algoritma AI untuk hasil yang lebih akurat
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#eaecf0] hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#e7eaff] rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#6475e9]" />
                </div>
                <CardTitle className="text-[#1f2937]">Personalized Insights</CardTitle>
                <CardDescription>
                  Rekomendasi karir dan pengembangan diri yang disesuaikan dengan profil Anda
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-[#eaecf0] hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#e7eaff] rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#6475e9]" />
                </div>
                <CardTitle className="text-[#1f2937]">Comprehensive Reports</CardTitle>
                <CardDescription>
                  Laporan lengkap dengan visualisasi data yang mudah dipahami
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Assessment Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">
              Jenis Assessment
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Berbagai metode assessment untuk analisis kepribadian yang komprehensif
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-[#eaecf0]">
              <CardHeader>
                <CardTitle className="text-[#1f2937]">RIASEC Assessment</CardTitle>
                <CardDescription>
                  Analisis minat karir berdasarkan teori Holland untuk menemukan bidang yang sesuai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-[#6b7280]">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Realistic, Investigative, Artistic
                  </li>
                  <li className="flex items-center text-sm text-[#6b7280]">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Social, Enterprising, Conventional
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[#eaecf0]">
              <CardHeader>
                <CardTitle className="text-[#1f2937]">Big Five (OCEAN)</CardTitle>
                <CardDescription>
                  Analisis kepribadian berdasarkan lima dimensi utama kepribadian manusia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-[#6b7280]">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Openness, Conscientiousness
                  </li>
                  <li className="flex items-center text-sm text-[#6b7280]">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Extraversion, Agreeableness, Neuroticism
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[#eaecf0]">
              <CardHeader>
                <CardTitle className="text-[#1f2937]">VIA Character Strengths</CardTitle>
                <CardDescription>
                  Identifikasi kekuatan karakter untuk pengembangan potensi diri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-[#6b7280]">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    24 Kekuatan Karakter
                  </li>
                  <li className="flex items-center text-sm text-[#6b7280]">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    6 Kategori Virtue
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#6475e9]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Menemukan Potensi Terbaik Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabunglah dengan ribuan pengguna yang telah menemukan jalur karir ideal mereka
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Mulai Assessment Sekarang
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1f2937] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FutureGuide</h3>
              <p className="text-gray-300">
                Platform assessment kepribadian dan bakat berbasis AI untuk pengembangan karir optimal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/auth" className="hover:text-white">Assessment</Link></li>
                <li><Link href="/auth" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/auth" className="hover:text-white">Hasil</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="#" className="hover:text-white">Bantuan</Link></li>
                <li><Link href="#" className="hover:text-white">FAQ</Link></li>
                <li><Link href="#" className="hover:text-white">Kontak</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="#" className="hover:text-white">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-white">Karir</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 FutureGuide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
