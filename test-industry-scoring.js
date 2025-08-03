// Simple test to verify industry scoring functionality
const { calculateIndustryScores, getTopIndustries } = require('./utils/industry-scoring.ts');

// Mock assessment scores for testing
const mockScores = {
  riasec: {
    realistic: 75,
    investigative: 85,
    artistic: 60,
    social: 50,
    enterprising: 70,
    conventional: 55
  },
  ocean: {
    openness: 80,
    conscientiousness: 65,
    extraversion: 55,
    agreeableness: 45,
    neuroticism: 30
  },
  viaIs: {
    creativity: 85,
    curiosity: 78,
    judgment: 70,
    loveOfLearning: 82,
    perspective: 75,
    bravery: 65,
    perseverance: 80,
    honesty: 85,
    zest: 75,
    love: 80,
    kindness: 85,
    socialIntelligence: 75,
    teamwork: 80,
    fairness: 85,
    leadership: 70,
    forgiveness: 75,
    humility: 80,
    prudence: 75,
    selfRegulation: 80,
    appreciationOfBeauty: 70,
    gratitude: 85,
    hope: 80,
    humor: 75,
    spirituality: 60
  }
};

console.log('Testing Industry Scoring...');

try {
  // Test industry score calculation
  const industryScores = calculateIndustryScores(mockScores);
  console.log('Industry Scores:', industryScores);

  // Test top industries
  const topIndustries = getTopIndustries(industryScores, 5);
  console.log('Top 5 Industries:', topIndustries);

  console.log('✅ Industry scoring test passed!');
} catch (error) {
  console.error('❌ Industry scoring test failed:', error);
}
