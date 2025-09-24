'use client';

import { useState } from 'react';
import { generateApiOnlyAnalysis } from '../../utils/ai-analysis';
import { AssessmentScores } from '../../types/assessment-results';

export default function TestPersonaPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Test data for "The Inspiring Leader" persona
  const inspiringLeaderScores: AssessmentScores = {
    riasec: {
      realistic: 32,
      investigative: 58,
      artistic: 45,
      social: 89,        // High social score
      enterprising: 76,  // High enterprising score
      conventional: 38
    },
    ocean: {
      openness: 72,
      conscientiousness: 84,
      extraversion: 91,     // High extraversion (matches inspiring leader)
      agreeableness: 88,    // High agreeableness (matches inspiring leader)
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
      socialIntelligence: 88,  // High social intelligence (matches inspiring leader)
      teamwork: 93,           // High teamwork (matches inspiring leader)
      fairness: 89,
      leadership: 87,         // High leadership (matches inspiring leader)
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
  };

  // Test data for "The Creative Investigator" persona
  const creativeInvestigatorScores: AssessmentScores = {
    riasec: {
      realistic: 45,
      investigative: 85,    // High investigative score
      artistic: 72,         // High artistic score
      social: 38,
      enterprising: 65,
      conventional: 42
    },
    ocean: {
      openness: 88,         // High openness (matches creative investigator)
      conscientiousness: 67,
      extraversion: 45,
      agreeableness: 72,
      neuroticism: 25
    },
    viaIs: {
      creativity: 92,       // High creativity (matches creative investigator)
      curiosity: 88,        // High curiosity (matches creative investigator)
      judgment: 85,
      loveOfLearning: 90,   // High love of learning (matches creative investigator)
      perspective: 80,
      bravery: 70,
      perseverance: 75,
      honesty: 78,
      zest: 70,
      love: 65,
      kindness: 70,
      socialIntelligence: 60,
      teamwork: 65,
      fairness: 72,
      leadership: 55,
      forgiveness: 68,
      humility: 70,
      prudence: 75,
      selfRegulation: 78,
      appreciationOfBeauty: 85,
      gratitude: 70,
      hope: 75,
      humor: 72,
      spirituality: 60
    }
  };

  const testPersona = async (scores: AssessmentScores, testName: string) => {
    setLoading(true);
    try {
      console.log(`Testing ${testName}...`);
      const analysis = await generateApiOnlyAnalysis(scores);
      console.log(`Result for ${testName}:`, analysis);
      setResult({ testName, analysis });
    } catch (error) {
      console.error(`Error testing ${testName}:`, error);
      setResult({ testName, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Persona Generation</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={() => testPersona(inspiringLeaderScores, 'The Inspiring Leader')}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Test Inspiring Leader Profile
        </button>
        
        <button
          onClick={() => testPersona(creativeInvestigatorScores, 'The Creative Investigator')}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          Test Creative Investigator Profile
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="text-lg">Generating persona analysis...</div>
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Test Result: {result.testName}</h2>
          
          {result.error ? (
            <div className="text-red-600">
              <strong>Error:</strong> {result.error}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <strong>Generated Title:</strong> 
                <span className="text-2xl font-bold text-blue-600 ml-2">
                  {result.analysis.title}
                </span>
              </div>
              
              <div>
                <strong>Description:</strong>
                <p className="mt-2 text-gray-700">{result.analysis.description}</p>
              </div>
              
              <div>
                <strong>Top Strengths:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {result.analysis.strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="text-gray-700">{strength}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p><strong>Note:</strong> Check the browser console for detailed scoring information.</p>
      </div>
    </div>
  );
}
