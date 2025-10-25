'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "../../../../components/results/ui-button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/results/ui-card"
import { Badge } from "../../../../components/results/ui-badge"
import { Skeleton } from "../../../../components/results/ui-skeleton"
import { ArrowLeft, User, Shield, Star, Target, Brain, Heart, Users, Briefcase, TrendingUp, Zap, Building, AlertTriangle, Lightbulb, GraduationCap, BookOpen } from "lucide-react"
import IndustryCompatibilityCard from "../../../../components/results/IndustryCompatibilityCard"
import { useAssessmentData } from "../../../../contexts/AssessmentDataContext"

export default function PersonaDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Using assessment data context for centralized data management
  const { getTestResult, isLoading, error } = useAssessmentData();
  const testResult = getTestResult();

  const resultId = params.id as string;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !testResult) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error?.message || 'Assessment result not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const profile = testResult as any || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/results/${resultId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Ringkasan
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#e7eaff] rounded-lg">
              <User className="w-8 h-8 text-[#6475e9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profil Persona Lengkap
              </h1>
              <p className="text-gray-600">
                Analisis mendalam kepribadian dan potensi Anda
              </p>
            </div>
          </div>

          {/* Persona Title Card */}
          <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="p-4 bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-2">{profile.archetype}</h2>
                <p className="text-white/80 text-lg">Profil Kepribadian Anda</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Description */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6 text-[#6475e9]" />
              Deskripsi Kepribadian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {profile.shortSummary}
              </p>
            </div>

            {/* Toleransi Risiko */}
            {profile.riskTolerance && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  Toleransi Risiko
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    profile.riskTolerance === 'high' ? 'bg-red-100 text-red-700' :
                    profile.riskTolerance === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {profile.riskTolerance === 'high' ? 'Tinggi' :
                     profile.riskTolerance === 'moderate' ? 'Sedang' : 'Rendah'}
                  </div>
                  <span className="text-gray-600 text-sm">
                    {profile.riskTolerance === 'high' ? 'Nyaman dengan risiko tinggi dan perubahan cepat' :
                     profile.riskTolerance === 'moderate' ? 'Menerima risiko yang terukur dan terkendali' :
                     'Lebih menyukai stabilitas dan prediktabilitas'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Kekuatan Utama
            </CardTitle>
            <p className="text-gray-600">Area-area di mana Anda unggul dan dapat diandalkan</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium leading-relaxed">{strength}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strength & Weakness Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Strength Summary */}
          {profile.strengthSummary && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-6 h-6 text-green-500" />
                  Ringkasan Kekuatan
                </CardTitle>
                <p className="text-gray-600">Analisis mendalam tentang kekuatan utama Anda</p>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-gray-900 leading-relaxed">{profile.strengthSummary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weakness Summary */}
          {profile.weaknessSummary && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-6 h-6 text-orange-500" />
                  Ringkasan Area Pengembangan
                </CardTitle>
                <p className="text-gray-600">Analisis mendalam tentang area yang perlu dikembangkan</p>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-gray-900 leading-relaxed">{profile.weaknessSummary}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Industry Compatibility */}
        {(() => {
          // Calculate industry scores if not available from API
          const industryScores = {} as any;
            {}; // Placeholder for calculateIndustryScores function

          return (
            <div className="mb-6">
              <IndustryCompatibilityCard industryScores={industryScores} />
            </div>
          );
        })()}

        {/* Learning Style & Core Motivators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Learning Style */}
          {profile.learningStyle && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-500" />
                  Gaya Belajar
                </CardTitle>
                <p className="text-gray-600">Cara belajar yang paling efektif untuk Anda</p>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-gray-900 leading-relaxed">{profile.learningStyle}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Motivators */}
          {profile.coreMotivators && profile.coreMotivators.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-500" />
                  Motivator Utama
                </CardTitle>
                <p className="text-gray-600">Hal-hal yang paling memotivasi Anda</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {profile.coreMotivators.map((motivator, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="flex items-center justify-center w-6 h-6 bg-pink-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-900 font-medium">{motivator}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Insights Section */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" />
              Insights & Rekomendasi
            </CardTitle>
            <p className="text-gray-600">Wawasan mendalam tentang kepribadian dan saran pengembangan</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {profile.insights && profile.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Models */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Role Model
            </CardTitle>
            <p className="text-gray-600">Tokoh-tokoh yang memiliki karakteristik serupa dengan profil Anda</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(profile.roleModel && profile.roleModel.length > 0) ? profile.roleModel.map((model, index) => {
                const name = typeof model === 'string' ? model : model.name;
                const title = typeof model === 'string' ? undefined : model.title;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        {title && (
                          <p className="text-xs text-gray-600 line-clamp-2">{title}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-1 w-full rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 group-hover:from-indigo-200 group-hover:to-blue-200" />
                  </div>
                );
              }) : (
                <p className="text-gray-600 text-sm col-span-full">Tidak ada role model</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-500" />
              Rekomendasi Karir
            </CardTitle>
            <p className="text-gray-600">Karir yang sesuai dengan profil kepribadian Anda</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.careerRecommendation.map((career, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {career.careerName}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 font-medium"
                        >
                          Recommended
                        </Badge>
                      </div>
                      {career.justification && (
                        <p className="text-gray-600 leading-relaxed mb-3">
                          {career.justification}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Career Prospect */}
                  {career.careerProspect && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900 text-sm">Prospek Karir:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Industry Growth: </span>
                          <span className="font-medium">{career.careerProspect.industryGrowth}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Salary: </span>
                          <span className="font-medium">{career.careerProspect.salaryPotential}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Job Availability: </span>
                          <span className="font-medium">{career.careerProspect.jobAvailability}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Skill Suggestions */}
          {profile.skillSuggestion && profile.skillSuggestion.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Saran Pengembangan Skill
                </CardTitle>
                <p className="text-gray-600">Keterampilan yang direkomendasikan untuk dikembangkan</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {profile.skillSuggestion.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-900 font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Environment */}
          {profile.workEnvironment && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-6 h-6 text-indigo-500" />
                  Lingkungan Kerja Ideal
                </CardTitle>
                <p className="text-gray-600">Kondisi kerja yang paling sesuai dengan kepribadian Anda</p>
              </CardHeader>
              <CardContent>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-gray-900 leading-relaxed">{profile.workEnvironment}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Possible Pitfalls */}
        <div className="mb-8">
          {/* Possible Pitfalls */}
          {profile.possiblePitfalls && profile.possiblePitfalls.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Potensi Jebakan
                </CardTitle>
                <p className="text-gray-600">Hal-hal yang perlu diwaspadai dalam pengembangan karir</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {profile.possiblePitfalls.map((pitfall, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">
                        !
                      </div>
                      <p className="text-gray-900 text-sm leading-relaxed">{pitfall}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Development Activities */}
        {profile.developmentActivities && (
          <div className="space-y-6 mb-8">
            {/* Project Ideas */}
            {profile.developmentActivities.projectIdeas && profile.developmentActivities.projectIdeas.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-orange-500" />
                    Ide Proyek Pengembangan
                  </CardTitle>
                  <p className="text-gray-600">Proyek-proyek yang dapat Anda kerjakan untuk mengembangkan kemampuan</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {profile.developmentActivities.projectIdeas.map((project, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium leading-relaxed">{project}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extracurricular Activities */}
            {profile.developmentActivities.extracurricular && profile.developmentActivities.extracurricular.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-green-500" />
                    Aktivitas Ekstrakurikuler
                  </CardTitle>
                  <p className="text-gray-600">Kegiatan yang direkomendasikan untuk mengembangkan soft skills</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.developmentActivities.extracurricular.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium leading-relaxed">{activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Book Recommendations */}
            {profile.developmentActivities.bookRecommendations && profile.developmentActivities.bookRecommendations.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                    Rekomendasi Buku
                  </CardTitle>
                  <p className="text-gray-600">Buku-buku yang dapat membantu pengembangan diri Anda</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    {profile.developmentActivities.bookRecommendations.map((book, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {book.title}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                oleh <span className="font-medium">{book.author}</span>
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-blue-900 text-sm leading-relaxed">
                                <span className="font-medium">Mengapa direkomendasikan:</span> {book.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Insights and Tips */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Tips Pengembangan Diri
                </h3>
                <div className="space-y-2 text-blue-800">
                  <p className="text-sm leading-relaxed">
                    • <strong>Manfaatkan kekuatan utama Anda</strong> dalam aktivitas sehari-hari dan pekerjaan
                  </p>
                  <p className="text-sm leading-relaxed">
                    • <strong>Fokus pada area pengembangan</strong> yang telah diidentifikasi untuk pertumbuhan optimal
                  </p>
                  <p className="text-sm leading-relaxed">
                    • <strong>Pelajari dari role model</strong> yang memiliki karakteristik serupa dengan Anda
                  </p>
                  <p className="text-sm leading-relaxed">
                    • <strong>Eksplorasi karir yang direkomendasikan</strong> melalui magang, volunteering, atau networking
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Summary */}
        <div className="text-center">
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
