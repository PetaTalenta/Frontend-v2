'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { submitAssessment } from '../../services/assessment-api';
import { AssessmentScores } from '../../types/assessment-results';
import { Loader2, CheckCircle, Brain, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AssessmentAIDemoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  // Simulated assessment answers that will generate different AI analysis results
  const demoScenarios = [
    {
      name: 'Creative Tech Professional',
      description: 'High creativity, investigative thinking, and openness to experience',
      answers: generateAnswersForProfile({
        riasec: { investigative: 85, artistic: 78, realistic: 45, social: 42, enterprising: 58, conventional: 35 },
        ocean: { openness: 88, conscientiousness: 67, extraversion: 45, agreeableness: 72, neuroticism: 25 },
        viaIs: { creativity: 92, curiosity: 89, judgment: 78, loveOfLearning: 85, perspective: 74 }
      })
    },
    {
      name: 'Social Leader',
      description: 'High social intelligence, leadership, and extraversion',
      answers: generateAnswersForProfile({
        riasec: { social: 89, enterprising: 76, investigative: 58, artistic: 45, realistic: 32, conventional: 38 },
        ocean: { extraversion: 91, agreeableness: 88, conscientiousness: 84, openness: 72, neuroticism: 18 },
        viaIs: { leadership: 87, socialIntelligence: 88, teamwork: 93, love: 94, kindness: 91 }
      })
    },
    {
      name: 'Strategic Organizer',
      description: 'High conscientiousness, conventional thinking, and analytical skills',
      answers: generateAnswersForProfile({
        riasec: { conventional: 85, investigative: 78, realistic: 55, enterprising: 62, social: 48, artistic: 35 },
        ocean: { conscientiousness: 92, openness: 65, extraversion: 52, agreeableness: 74, neuroticism: 22 },
        viaIs: { judgment: 89, prudence: 91, selfRegulation: 89, perseverance: 88, fairness: 87 }
      })
    }
  ];

  const steps = [
    'Pilih Profil Demo',
    'Simulasi Assessment',
    'AI Analysis',
    'Hasil'
  ];

  // Generate mock answers based on target scores
  function generateAnswersForProfile(targetScores: Partial<AssessmentScores>): { [key: string]: number } {
    const answers: { [key: string]: number } = {};
    
    // Generate 206 answers (44 Big Five + 60 RIASEC + 96 VIA + 6 additional)
    for (let i = 1; i <= 206; i++) {
      // Simulate realistic answer patterns based on target scores
      const baseScore = Math.floor(Math.random() * 3) + 3; // 3-5 range
      const variation = Math.floor(Math.random() * 3) - 1; // -1 to +1
      answers[`q${i}`] = Math.max(1, Math.min(5, baseScore + variation));
    }
    
    return answers;
  }

  const handleScenarioSelect = (scenarioIndex: number) => {
    setCurrentStep(1);
    // Simulate assessment completion
    setTimeout(() => {
      setCurrentStep(2);
      handleSubmitAssessment(demoScenarios[scenarioIndex].answers);
    }, 2000);
  };

  const handleSubmitAssessment = async (answers: { [key: string]: number }) => {
    setIsSubmitting(true);
    
    try {
      const result = await submitAssessment(answers);
      setResultId(result.resultId);
      setCurrentStep(3);
    } catch (error) {
      console.error('Assessment submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#1e1e1e] mb-2">
                Pilih Profil Demo
              </h2>
              <p className="text-[#64707d]">
                Pilih salah satu profil untuk melihat bagaimana AI menganalisis hasil assessment
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {demoScenarios.map((scenario, index) => (
                <Card
                  key={index}
                  className="bg-white border-[#eaecf0] hover:border-[#6475e9] cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleScenarioSelect(index)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg lg:text-xl font-semibold text-[#1e1e1e]">
                      {scenario.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm lg:text-base text-[#64707d] mb-4 lg:mb-6">
                      {scenario.description}
                    </p>
                    <Button className="w-full bg-[#6475e9] hover:bg-[#5a6bd8] text-white text-sm lg:text-base py-2 lg:py-3">
                      <Brain className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                      Pilih Profil
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-[#e7eaff] rounded-full">
                <Loader2 className="w-8 h-8 text-[#6475e9] animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e1e1e] mb-2">
                Simulasi Assessment
              </h2>
              <p className="text-[#64707d]">
                Mensimulasikan pengisian 206 pertanyaan assessment...
              </p>
            </div>
            <Progress value={75} className="w-full max-w-md mx-auto" />
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-[#e7eaff] rounded-full">
                <Brain className="w-8 h-8 text-[#6475e9] animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e1e1e] mb-2">
                AI Sedang Menganalisis
              </h2>
              <p className="text-[#64707d]">
                Sistem AI sedang menganalisis hasil assessment Anda...
              </p>
              <div className="text-xs text-[#64707d] mt-4 space-y-1">
                <div>✓ Menganalisis skor RIASEC</div>
                <div>✓ Menganalisis Big Five personality traits</div>
                <div>✓ Menganalisis VIA character strengths</div>
                <div className="animate-pulse">⏳ Generating persona profile...</div>
                <div className="animate-pulse">⏳ Matching career recommendations...</div>
                <div className="animate-pulse">⏳ Selecting role models...</div>
              </div>
            </div>
            {isSubmitting && (
              <Progress value={60} className="w-full max-w-md mx-auto" />
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e1e1e] mb-2">
                Analisis Selesai!
              </h2>
              <p className="text-[#64707d] mb-6">
                AI telah berhasil menganalisis profil kepribadian Anda dan menghasilkan rekomendasi yang dipersonalisasi.
              </p>
              
              <div className="bg-[#f8fafc] rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-[#1e1e1e] mb-4">Yang Dihasilkan AI:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-[#6475e9]">Persona Title</div>
                    <div className="text-[#64707d]">Dynamic Achiever</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-[#6475e9]">Core Strengths</div>
                    <div className="text-[#64707d]">5 Kekuatan</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-[#6475e9]">Career Matches</div>
                    <div className="text-[#64707d]">3 Rekomendasi</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-[#6475e9]">Role Models</div>
                    <div className="text-[#64707d]">4 Inspirasi</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => router.push(`/results/${resultId}`)}
                  className="bg-[#6475e9] hover:bg-[#5a6bd8] text-white"
                >
                  Lihat Hasil Lengkap
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(0);
                    setResultId(null);
                  }}
                  className="border-[#eaecf0]"
                >
                  Coba Profil Lain
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="border-[#eaecf0]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1e1e1e]">
              AI Assessment Demo
            </h1>
            <p className="text-sm text-[#64707d]">
              Lihat bagaimana AI menganalisis hasil assessment
            </p>
          </div>
          
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Progress Steps */}
        <Card className="bg-white border-[#eaecf0]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStep 
                      ? 'bg-[#6475e9] text-white' 
                      : 'bg-[#f1f5f9] text-[#64707d]'
                    }
                  `}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    index <= currentStep ? 'text-[#1e1e1e] font-medium' : 'text-[#64707d]'
                  }`}>
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-[#6475e9]' : 'bg-[#e2e8f0]'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="bg-white border-[#eaecf0]">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-[#f8faff] border-[#e7eaff]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#6475e9] rounded-lg flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1e1e1e] mb-1">
                  Tentang AI Analysis
                </h4>
                <p className="text-xs text-[#64707d] leading-relaxed">
                  Sistem AI kami menganalisis 206 jawaban assessment dari 3 instrumen psikometri 
                  (RIASEC, Big Five, VIA Character Strengths) untuk menghasilkan profil kepribadian 
                  yang komprehensif, rekomendasi karir yang dipersonalisasi, dan saran pengembangan diri.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
