'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/results/ui-button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/results/ui-card';
import { Progress } from '../../../../components/results/ui-progress';
import { Badge } from '../../../../components/results/ui-badge';
import { Skeleton } from '../../../../components/results/ui-skeleton';
import { ArrowLeft, Palette, Lightbulb, Search, Heart, Shield, Scale, Flower } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for ViaRadarChart to reduce bundle size
const ViaRadarChart = dynamic(() => import('../../../../components/results/ViaRadarChart'), {
  loading: () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false
});
import {
  getDummyAssessmentResult,
  getScoreInterpretation,
  VIA_CATEGORIES,
  getTopViaStrengths
} from '../../../../data/dummy-assessment-data';

export default function ViaDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Using dummy data instead of context
  const result = getDummyAssessmentResult();
  const isLoading = false;
  const error = null;

  const resultId = params.id as string;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{(error as any)?.message || 'Assessment result not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const viaScores = result.assessment_data.viaIs;
  const topStrengths = getTopViaStrengths(viaScores, 24);

  // VIA Strengths with detailed information
  const viaStrengthsDetails: { [key: string]: any } = {
    creativity: {
      name: 'Creativity',
      description: 'Kemampuan berpikir kreatif dan inovatif',
      detailedDescription: 'Creativity melibatkan kemampuan untuk menghasilkan ide-ide baru dan orisinal, serta menemukan cara-cara baru untuk melakukan sesuatu.',
      examples: ['Menghasilkan ide-ide inovatif', 'Menemukan solusi kreatif', 'Berpikir out-of-the-box', 'Mengekspresikan diri secara artistik']
    },
    curiosity: {
      name: 'Curiosity',
      description: 'Keingintahuan dan semangat belajar yang tinggi',
      detailedDescription: 'Curiosity adalah keinginan kuat untuk belajar dan memahami, serta ketertarikan pada pengalaman yang sedang berlangsung.',
      examples: ['Selalu ingin tahu hal baru', 'Mengajukan pertanyaan mendalam', 'Mengeksplorasi topik yang menarik', 'Mencari pengalaman baru']
    },
    judgment: {
      name: 'Judgment',
      description: 'Kemampuan pengambilan keputusan yang bijaksana',
      detailedDescription: 'Judgment melibatkan kemampuan untuk berpikir kritis, mengevaluasi informasi secara objektif, dan membuat keputusan yang bijaksana.',
      examples: ['Menganalisis situasi dengan objektif', 'Membuat keputusan berdasarkan bukti', 'Melihat berbagai perspektif', 'Memberikan nasihat yang bijaksana']
    },
    loveOfLearning: {
      name: 'Love of Learning',
      description: 'Passion untuk pembelajaran berkelanjutan',
      detailedDescription: 'Love of Learning adalah kecintaan terhadap proses belajar itu sendiri, bukan hanya hasil akhirnya.',
      examples: ['Menikmati proses belajar', 'Terus mengembangkan keterampilan', 'Membaca dan belajar secara mandiri', 'Mengikuti kursus atau pelatihan']
    },
    perspective: {
      name: 'Perspective',
      description: 'Kemampuan melihat gambaran besar dan memberikan nasihat bijak',
      detailedDescription: 'Perspective adalah kemampuan untuk melihat situasi dari berbagai sudut pandang dan memberikan pandangan yang bijaksana.',
      examples: ['Melihat gambaran besar', 'Memberikan nasihat yang bijaksana', 'Memahami konteks yang lebih luas', 'Menjadi mentor bagi orang lain']
    },
    bravery: {
      name: 'Bravery',
      description: 'Keberanian dalam menghadapi tantangan',
      detailedDescription: 'Bravery adalah kemampuan untuk bertindak dengan benar meskipun menghadapi kesulitan, tantangan, atau rasa takut.',
      examples: ['Menghadapi tantangan dengan berani', 'Membela yang benar', 'Mengambil risiko yang diperhitungkan', 'Tidak mudah menyerah']
    },
    perseverance: {
      name: 'Perseverance',
      description: 'Ketekunan dan daya tahan yang luar biasa',
      detailedDescription: 'Perseverance adalah kemampuan untuk terus berusaha meskipun menghadapi rintangan, kegagalan, atau kesulitan.',
      examples: ['Tidak mudah menyerah', 'Konsisten dalam usaha', 'Mengatasi rintangan', 'Fokus pada tujuan jangka panjang']
    },
    honesty: {
      name: 'Honesty',
      description: 'Integritas dan kejujuran yang tinggi',
      detailedDescription: 'Honesty melibatkan kemampuan untuk berkata dan bertindak dengan jujur, serta menjadi diri sendiri yang autentik.',
      examples: ['Berkata jujur dalam segala situasi', 'Bertindak dengan integritas', 'Menjadi diri sendiri yang autentik', 'Dapat dipercaya']
    },
    zest: {
      name: 'Zest',
      description: 'Antusiasme dan energi yang menular',
      detailedDescription: 'Zest adalah pendekatan yang antusias dan energik terhadap kehidupan, yang menular kepada orang lain.',
      examples: ['Menunjukkan antusiasme tinggi', 'Energik dalam aktivitas', 'Menginspirasi orang lain', 'Menikmati hidup dengan penuh']
    },
    love: {
      name: 'Love',
      description: 'Kemampuan membangun hubungan yang bermakna',
      detailedDescription: 'Love adalah kemampuan untuk mencintai dan dicintai, serta membangun hubungan yang dekat dan bermakna.',
      examples: ['Membangun hubungan yang dalam', 'Menunjukkan kasih sayang', 'Peduli pada orang lain', 'Menciptakan ikatan emosional']
    },
    kindness: {
      name: 'Kindness',
      description: 'Kebaikan hati dan kepedulian terhadap orang lain',
      detailedDescription: 'Kindness adalah kemampuan untuk menunjukkan kebaikan, kemurahan hati, dan kepedulian terhadap orang lain.',
      examples: ['Membantu orang lain tanpa pamrih', 'Menunjukkan empati', 'Berbuat baik setiap hari', 'Peduli pada kesejahteraan orang lain']
    },
    socialIntelligence: {
      name: 'Social Intelligence',
      description: 'Kecerdasan sosial dan kemampuan interpersonal',
      detailedDescription: 'Social Intelligence adalah kemampuan untuk memahami situasi sosial dan berinteraksi dengan orang lain secara efektif.',
      examples: ['Memahami dinamika sosial', 'Berkomunikasi dengan efektif', 'Membaca emosi orang lain', 'Beradaptasi dalam berbagai situasi sosial']
    },
    teamwork: {
      name: 'Teamwork',
      description: 'Kemampuan bekerja sama dalam tim',
      detailedDescription: 'Teamwork adalah kemampuan untuk bekerja sama dengan orang lain untuk mencapai tujuan bersama.',
      examples: ['Berkolaborasi dengan efektif', 'Mendukung anggota tim', 'Berkontribusi pada tujuan bersama', 'Menghargai perbedaan dalam tim']
    },
    fairness: {
      name: 'Fairness',
      description: 'Keadilan dan perlakuan yang setara',
      detailedDescription: 'Fairness adalah kemampuan untuk memperlakukan semua orang dengan adil dan setara, tanpa bias atau diskriminasi.',
      examples: ['Memperlakukan semua orang dengan adil', 'Tidak memihak tanpa alasan', 'Menghargai hak setiap orang', 'Menegakkan keadilan']
    },
    leadership: {
      name: 'Leadership',
      description: 'Kemampuan memimpin dan menginspirasi',
      detailedDescription: 'Leadership adalah kemampuan untuk memimpin kelompok, menginspirasi orang lain, dan mencapai tujuan bersama.',
      examples: ['Memimpin dengan contoh', 'Menginspirasi orang lain', 'Mengorganisir aktivitas kelompok', 'Mengambil inisiatif']
    },
    forgiveness: {
      name: 'Forgiveness',
      description: 'Kemampuan memaafkan dan melepaskan dendam',
      detailedDescription: 'Forgiveness adalah kemampuan untuk memaafkan kesalahan orang lain dan memberikan kesempatan kedua.',
      examples: ['Memaafkan kesalahan orang lain', 'Tidak menyimpan dendam', 'Memberikan kesempatan kedua', 'Fokus pada hal positif']
    },
    humility: {
      name: 'Humility',
      description: 'Kerendahan hati dan kesederhanaan',
      detailedDescription: 'Humility adalah kemampuan untuk tetap rendah hati meskipun memiliki pencapaian, serta mengakui keterbatasan diri.',
      examples: ['Tidak sombong atau angkuh', 'Mengakui kesalahan', 'Menghargai kontribusi orang lain', 'Belajar dari orang lain']
    },
    prudence: {
      name: 'Prudence',
      description: 'Kehati-hatian dan pertimbangan yang matang',
      detailedDescription: 'Prudence adalah kemampuan untuk membuat pilihan yang bijaksana dan berhati-hati dalam mengambil keputusan.',
      examples: ['Berpikir sebelum bertindak', 'Mempertimbangkan konsekuensi', 'Membuat keputusan yang bijaksana', 'Tidak impulsif']
    },
    selfRegulation: {
      name: 'Self-Regulation',
      description: 'Kemampuan mengatur diri dan disiplin',
      detailedDescription: 'Self-Regulation adalah kemampuan untuk mengontrol emosi, perilaku, dan impuls diri sendiri.',
      examples: ['Mengontrol emosi', 'Disiplin dalam tindakan', 'Menahan impuls negatif', 'Mengatur waktu dengan baik']
    },
    appreciationOfBeauty: {
      name: 'Appreciation of Beauty',
      description: 'Apresiasi terhadap keindahan dan keunggulan',
      detailedDescription: 'Appreciation of Beauty adalah kemampuan untuk mengenali dan menghargai keindahan, keunggulan, dan kinerja yang luar biasa.',
      examples: ['Menghargai seni dan keindahan', 'Mengakui keunggulan orang lain', 'Menikmati alam', 'Menghargai prestasi']
    },
    gratitude: {
      name: 'Gratitude',
      description: 'Rasa syukur dan penghargaan',
      detailedDescription: 'Gratitude adalah kemampuan untuk mengenali dan menghargai hal-hal baik yang terjadi dalam hidup.',
      examples: ['Bersyukur atas yang dimiliki', 'Menghargai bantuan orang lain', 'Mengekspresikan terima kasih', 'Fokus pada hal positif']
    },
    hope: {
      name: 'Hope',
      description: 'Optimisme dan harapan untuk masa depan',
      detailedDescription: 'Hope adalah kemampuan untuk tetap optimis dan memiliki harapan positif tentang masa depan.',
      examples: ['Optimis tentang masa depan', 'Memiliki tujuan yang jelas', 'Tidak mudah putus asa', 'Menginspirasi harapan pada orang lain']
    },
    humor: {
      name: 'Humor',
      description: 'Kemampuan humor dan keceriaan',
      detailedDescription: 'Humor adalah kemampuan untuk melihat sisi lucu dari situasi dan membawa keceriaan kepada orang lain.',
      examples: ['Membuat orang lain tertawa', 'Melihat sisi lucu situasi', 'Menciptakan suasana ceria', 'Menggunakan humor dengan tepat']
    },
    spirituality: {
      name: 'Spirituality',
      description: 'Spiritualitas dan makna hidup',
      detailedDescription: 'Spirituality adalah kemampuan untuk menemukan makna dan tujuan dalam hidup, serta memiliki keyakinan yang kuat.',
      examples: ['Mencari makna hidup', 'Memiliki keyakinan yang kuat', 'Terhubung dengan yang transenden', 'Hidup sesuai nilai-nilai']
    }
  };

  // Category icons mapping
  const categoryIcons: { [key: string]: any } = {
    'Wisdom & Knowledge': Lightbulb,
    'Courage': Shield,
    'Humanity': Heart,
    'Justice': Scale,
    'Temperance': Search,
    'Transcendence': Flower
  };

  // Category colors mapping
  const categoryColors: { [key: string]: string } = {
    'Wisdom & Knowledge': '#8b5cf6',
    'Courage': '#ef4444',
    'Humanity': '#10b981',
    'Justice': '#3b82f6',
    'Temperance': '#f59e0b',
    'Transcendence': '#ec4899'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/results/${resultId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Ringkasan
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <Palette className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                VIA Character Strengths
              </h1>
              <p className="text-gray-600">
                Detail lengkap kekuatan karakter Anda (24 Strengths)
              </p>
            </div>
          </div>

          {/* Top Strength Summary */}
          <Card className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Kekuatan Utama Anda</h2>
                  <p className="text-lg font-semibold">{viaStrengthsDetails[topStrengths[0].strength]?.name}</p>
                  <p className="text-white/80">
                    {topStrengths[0].category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{topStrengths[0].score}</p>
                  <p className="text-white/80">Skor Tertinggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        <div className="mb-8">
          <ViaRadarChart scores={{
            riasec: result.assessment_data.riasec,
            ocean: result.assessment_data.ocean,
            viaIs: result.assessment_data.viaIs,
            industryScore: result.assessment_data.industryScore
          }} />
        </div>

        {/* Strengths by Category */}
        <div className="space-y-8">
          {Object.entries(VIA_CATEGORIES).map(([category, strengthKeys]) => {
            const categoryStrengths = topStrengths.filter(s => strengthKeys.includes(s.strength as any));
            const Icon = categoryIcons[category];
            const color = categoryColors[category];

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: color + '20' }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryStrengths.map((strength, index) => {
                    const details = viaStrengthsDetails[strength.strength];
                    const interpretation = getScoreInterpretation(strength.score);
                    const overallRank = topStrengths.findIndex(s => s.strength === strength.strength) + 1;

                    // Check if this is the last card and the total number is odd
                    const isLastCard = index === categoryStrengths.length - 1;
                    const isOddTotal = categoryStrengths.length % 2 === 1;
                    const shouldSpanTwoColumns = isLastCard && isOddTotal;

                    return (
                      <Card
                        key={strength.strength}
                        className={`bg-white border-gray-200 shadow-sm ${shouldSpanTwoColumns ? 'md:col-span-2' : ''}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">
                                #{overallRank}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {details?.name}
                                </h3>
                                <p className="text-sm text-gray-600">{details?.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold" style={{ color }}>
                                {strength.score}
                              </p>
                              <Badge
                                style={{
                                  backgroundColor: interpretation.color + '20',
                                  color: interpretation.color
                                }}
                                className="font-medium"
                              >
                                {interpretation.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2 mb-4">
                            <Progress
                              value={strength.score}
                              className="h-2"
                              style={{
                                '--progress-background': color,
                              } as React.CSSProperties}
                            />
                          </div>

                          {/* Detailed Description */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {details?.detailedDescription}
                            </p>
                          </div>

                          {/* Examples */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 text-sm">Contoh Penerapan:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {details?.examples.map((example: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="text-xs text-gray-600">{example}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Summary */}
        <div className="mt-8 text-center">
          <Link href={`/results/${resultId}`}>
            <Button size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Ringkasan Hasil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
