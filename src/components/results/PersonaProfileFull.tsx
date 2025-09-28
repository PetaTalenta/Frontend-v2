'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AssessmentResult, PersonaProfile } from '../../types/assessment-results';
import { ArrowLeft, User, Star, Target, Users, Briefcase, TrendingUp, BookOpen, Lightbulb, GraduationCap, AlertTriangle, Building, Shield, Zap, Brain, Heart } from 'lucide-react';
import IndustryCompatibilityCard from './IndustryCompatibilityCard';
import { calculateIndustryScores } from '../../utils/industry-scoring';

interface PersonaProfileFullProps {
  result: AssessmentResult;
}

export default function PersonaProfileFull({ result }: PersonaProfileFullProps) {
  const profile: PersonaProfile = result.persona_profile as any;
  const industryScores = result.assessment_data.industryScore || calculateIndustryScores(result.assessment_data);

  if (!profile) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <p className="text-gray-600">Data profil tidak tersedia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Persona Title Card */}
      <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="p-3 bg-white/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{profile.archetype}</h2>
            <p className="text-white/80 text-sm">Profil Kepribadian Anda</p>
          </div>
        </CardContent>
      </Card>

      {/* Deskripsi Kepribadian + Risk Tolerance */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#6475e9]" />
            Deskripsi Kepribadian
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.shortSummary && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">{profile.shortSummary}</p>
            </div>
          )}

          {profile.riskTolerance && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-500" />
                Toleransi Risiko
              </h3>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  profile.riskTolerance === 'high' ? 'bg-red-100 text-red-700' :
                  profile.riskTolerance === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profile.riskTolerance === 'high' ? 'Tinggi' : profile.riskTolerance === 'moderate' ? 'Sedang' : 'Rendah'}
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

      {/* Kekuatan Utama */}
      {profile.strengths && profile.strengths.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Kekuatan Utama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center w-7 h-7 bg-yellow-500 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-gray-900 font-medium leading-relaxed">{strength}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ringkasan Kekuatan & Area Pengembangan */}
      {(profile.strengthSummary || profile.weaknessSummary) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {profile.strengthSummary && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-500" />
                  Ringkasan Kekuatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-gray-900 leading-relaxed">{profile.strengthSummary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {profile.weaknessSummary && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Ringkasan Area Pengembangan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-gray-900 leading-relaxed">{profile.weaknessSummary}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Kompatibilitas Industri */}
      <IndustryCompatibilityCard industryScores={industryScores} />

      {/* Gaya Belajar & Motivator Utama */}
      {(profile.learningStyle || (profile.coreMotivators && profile.coreMotivators.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {profile.learningStyle && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Gaya Belajar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-gray-900 leading-relaxed">{profile.learningStyle}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {profile.coreMotivators && profile.coreMotivators.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Motivator Utama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {profile.coreMotivators.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="flex items-center justify-center w-6 h-6 bg-pink-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-gray-900 font-medium">{m}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Insights */}
      {profile.insights && profile.insights.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Insights & Rekomendasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {profile.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center w-7 h-7 bg-blue-500 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-gray-900 font-medium leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Model */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Role Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.roleModel && profile.roleModel.length > 0 ? (
              profile.roleModel.map((model, idx) => {
                const name = typeof model === 'string' ? model : model.name;
                const title = typeof model === 'string' ? undefined : model.title;
                return (
                  <div key={idx} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        {title && <p className="text-xs text-gray-600 line-clamp-2">{title}</p>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-600 text-sm">Tidak ada role model</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rekomendasi Karir */}
      {profile.careerRecommendation && profile.careerRecommendation.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-500" />
              Rekomendasi Karir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.careerRecommendation.map((career, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{career.careerName}</h3>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-medium">Recommended</Badge>
                      </div>
                      {career.description && (
                        <p className="text-gray-700 text-sm mb-2">{career.description}</p>
                      )}
                      {career.justification && (
                        <p className="text-gray-600 leading-relaxed mb-2">{career.justification}</p>
                      )}
                    </div>
                  </div>

                  {career.careerProspect && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900 text-sm">Prospek Karir:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
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
      )}

      {/* Saran Skill & Lingkungan Kerja */}
      {(profile.skillSuggestion && profile.skillSuggestion.length > 0) || profile.workEnvironment ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {profile.skillSuggestion && profile.skillSuggestion.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Saran Pengembangan Skill
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {profile.skillSuggestion.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-gray-900 font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.workEnvironment && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-500" />
                  Lingkungan Kerja Ideal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-gray-900 leading-relaxed">{profile.workEnvironment}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Potensi Jebakan */}
      {profile.possiblePitfalls && profile.possiblePitfalls.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Potensi Jebakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {profile.possiblePitfalls.map((pit, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">!</div>
                  <p className="text-gray-900 text-sm leading-relaxed">{pit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aktivitas Pengembangan */}
      {profile.developmentActivities && (
        <div className="space-y-6">
          {profile.developmentActivities.projectIdeas && profile.developmentActivities.projectIdeas.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-500" />
                  Ide Proyek Pengembangan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {profile.developmentActivities.projectIdeas.map((proj, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-center w-7 h-7 bg-orange-500 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">{idx + 1}</div>
                      <p className="text-gray-900 font-medium leading-relaxed">{proj}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.developmentActivities.extracurricular && profile.developmentActivities.extracurricular.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                  Aktivitas Ekstrakurikuler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.developmentActivities.extracurricular.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center w-7 h-7 bg-green-500 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">{idx + 1}</div>
                      <p className="text-gray-900 font-medium leading-relaxed">{act}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.developmentActivities.bookRecommendations && profile.developmentActivities.bookRecommendations.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Rekomendasi Buku
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {profile.developmentActivities.bookRecommendations.map((book, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-0.5">{book.title}</h3>
                            <p className="text-gray-600 text-xs">oleh <span className="font-medium">{book.author}</span></p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2.5">
                            <p className="text-blue-900 text-sm leading-relaxed"><span className="font-medium">Mengapa direkomendasikan:</span> {book.reason}</p>
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

      {/* Tips ringkas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-blue-900 mb-1">Tips Pengembangan Diri</h3>
              <div className="space-y-1.5 text-blue-800 text-sm">
                <p>• <strong>Manfaatkan kekuatan utama</strong> dalam aktivitas dan pekerjaan</p>
                <p>• <strong>Fokus</strong> pada area pengembangan yang telah diidentifikasi</p>
                <p>• <strong>Pelajari dari role model</strong> yang relevan</p>
                <p>• <strong>Eksplorasi karir yang direkomendasikan</strong> lewat magang/volunteering/networking</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

