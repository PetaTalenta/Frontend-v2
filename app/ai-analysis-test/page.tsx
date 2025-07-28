'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { generateApiOnlyAnalysis } from '../../services/ai-analysis';
import { AssessmentScores, PersonaProfile } from '../../types/assessment-results';
import { Loader2, Brain, User, Star, Target, Users, Briefcase } from 'lucide-react';

export default function AIAnalysisTestPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PersonaProfile | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<string>('creative-investigator');

  // Test cases with different score patterns
  const testCases: { [key: string]: { name: string; scores: AssessmentScores } } = {
    'creative-investigator': {
      name: 'Creative Investigator Profile',
      scores: {
        riasec: {
          realistic: 45,
          investigative: 85,
          artistic: 78,
          social: 42,
          enterprising: 58,
          conventional: 35
        },
        ocean: {
          openness: 88,
          conscientiousness: 67,
          extraversion: 45,
          agreeableness: 72,
          neuroticism: 25
        },
        viaIs: {
          creativity: 92,
          curiosity: 89,
          judgment: 78,
          loveOfLearning: 85,
          perspective: 74,
          bravery: 65,
          perseverance: 82,
          honesty: 88,
          zest: 58,
          love: 76,
          kindness: 84,
          socialIntelligence: 69,
          teamwork: 71,
          fairness: 86,
          leadership: 63,
          forgiveness: 79,
          humility: 72,
          prudence: 68,
          selfRegulation: 75,
          appreciationOfBeauty: 91,
          gratitude: 83,
          hope: 77,
          humor: 64,
          spirituality: 52
        }
      }
    },
    'inspiring-leader': {
      name: 'Inspiring Leader Profile',
      scores: {
        riasec: {
          realistic: 32,
          investigative: 58,
          artistic: 45,
          social: 89,
          enterprising: 76,
          conventional: 38
        },
        ocean: {
          openness: 72,
          conscientiousness: 84,
          extraversion: 91,
          agreeableness: 88,
          neuroticism: 18
        },
        viaIs: {
          creativity: 68,
          curiosity: 75,
          judgment: 82,
          loveOfLearning: 79,
          perspective: 86,
          bravery: 78,
          perseverance: 89,
          honesty: 92,
          zest: 85,
          love: 94,
          kindness: 91,
          socialIntelligence: 88,
          teamwork: 93,
          fairness: 89,
          leadership: 87,
          forgiveness: 86,
          humility: 83,
          prudence: 78,
          selfRegulation: 81,
          appreciationOfBeauty: 74,
          gratitude: 92,
          hope: 89,
          humor: 82,
          spirituality: 76
        }
      }
    },
    'strategic-organizer': {
      name: 'Strategic Organizer Profile',
      scores: {
        riasec: {
          realistic: 55,
          investigative: 78,
          artistic: 35,
          social: 48,
          enterprising: 62,
          conventional: 85
        },
        ocean: {
          openness: 65,
          conscientiousness: 92,
          extraversion: 52,
          agreeableness: 74,
          neuroticism: 22
        },
        viaIs: {
          creativity: 58,
          curiosity: 72,
          judgment: 89,
          loveOfLearning: 76,
          perspective: 81,
          bravery: 68,
          perseverance: 88,
          honesty: 85,
          zest: 62,
          love: 71,
          kindness: 78,
          socialIntelligence: 65,
          teamwork: 82,
          fairness: 87,
          leadership: 74,
          forgiveness: 73,
          humility: 79,
          prudence: 91,
          selfRegulation: 89,
          appreciationOfBeauty: 64,
          gratitude: 76,
          hope: 78,
          humor: 58,
          spirituality: 67
        }
      }
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const scores = testCases[selectedTestCase].scores;
      const result = await generateApiOnlyAnalysis(scores);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#e7eaff] rounded-lg">
                <Brain className="w-6 h-6 text-[#6475e9]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-[#1e1e1e]">
                  AI Analysis Test
                </CardTitle>
                <p className="text-sm text-[#64707d]">
                  Test the comprehensive AI analysis system with different personality profiles
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Test Controls */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
              Test Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(testCases).map(([key, testCase]) => (
                <div
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTestCase === key
                      ? 'border-[#6475e9] bg-[#f8faff]'
                      : 'border-[#eaecf0] hover:border-[#d1d5db]'
                  }`}
                  onClick={() => setSelectedTestCase(key)}
                >
                  <h3 className="font-medium text-[#1e1e1e] mb-2">
                    {testCase.name}
                  </h3>
                  <div className="text-xs text-[#64707d] space-y-1">
                    <div>Primary RIASEC: {Object.entries(testCase.scores.riasec)
                      .sort(([,a], [,b]) => b - a)[0][0]}</div>
                    <div>High Traits: {Object.entries(testCase.scores.ocean)
                      .filter(([,score]) => score > 70)
                      .map(([trait]) => trait)
                      .join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-[#6475e9] hover:bg-[#5a6bd8] text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Persona Profile */}
            <Card className="bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] text-white border-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {analysisResult.title}
                    </CardTitle>
                    <p className="text-white/80 text-sm">AI-Generated Persona</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/90 leading-relaxed text-sm">
                    {analysisResult.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card className="bg-white border-[#eaecf0]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#6475e9]" />
                  <CardTitle className="text-lg font-semibold">Core Strengths</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#6475e9] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-[#1e1e1e]">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-white border-[#eaecf0]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#6475e9]" />
                  <CardTitle className="text-lg font-semibold">Development Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#f97316] rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-[#1e1e1e]">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role Models */}
            <Card className="bg-white border-[#eaecf0]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#6475e9]" />
                  <CardTitle className="text-lg font-semibold">Role Models</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.roleModel.map((model, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-[#e7eaff] text-[#6475e9] border-[#6475e9]/20"
                    >
                      {model}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Career Recommendations */}
        {analysisResult && (
          <Card className="bg-white border-[#eaecf0]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#6475e9]" />
                <CardTitle className="text-lg font-semibold">Career Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisResult.careerRecommendation.map((career, index) => (
                  <div key={index} className="border border-[#eaecf0] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-[#1e1e1e]">{career.careerName}</h3>
                      <Badge variant="secondary" className="bg-[#e7eaff] text-[#6475e9]">
                        {career.matchPercentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-[#64707d] mb-3">{career.description}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Job Availability:</span>
                        <span className="font-medium">{career.careerProspect.jobAvailability}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Salary Potential:</span>
                        <span className="font-medium">{career.careerProspect.salaryPotential}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
