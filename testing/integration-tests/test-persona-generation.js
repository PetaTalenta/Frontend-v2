// Test script to verify persona title generation
// Run with: node test-persona-generation.js

const { generateComprehensiveAnalysis } = require('./services/ai-analysis.ts');

// Test data for "The Inspiring Leader" persona
const inspiringLeaderScores = {
  riasec: {
    realistic: 45,
    investigative: 55,
    artistic: 60,
    social: 85,        // High social score
    enterprising: 80,  // High enterprising score
    conventional: 50
  },
  ocean: {
    openness: 70,
    conscientiousness: 75,
    extraversion: 85,     // High extraversion (matches inspiring leader)
    agreeableness: 80,    // High agreeableness (matches inspiring leader)
    neuroticism: 30
  },
  viaIs: {
    creativity: 70,
    curiosity: 65,
    judgment: 70,
    loveOfLearning: 68,
    perspective: 72,
    bravery: 75,
    perseverance: 78,
    honesty: 80,
    zest: 75,
    love: 70,
    kindness: 78,
    socialIntelligence: 85,  // High social intelligence (matches inspiring leader)
    teamwork: 82,           // High teamwork (matches inspiring leader)
    fairness: 75,
    leadership: 88,         // High leadership (matches inspiring leader)
    forgiveness: 70,
    humility: 65,
    prudence: 72,
    selfRegulation: 70,
    appreciationOfBeauty: 60,
    gratitude: 75,
    hope: 80,
    humor: 70,
    spirituality: 65
  }
};

// Test data for "The Creative Investigator" persona
const creativeInvestigatorScores = {
  riasec: {
    realistic: 50,
    investigative: 90,    // High investigative score
    artistic: 85,         // High artistic score
    social: 45,
    enterprising: 60,
    conventional: 40
  },
  ocean: {
    openness: 92,         // High openness (matches creative investigator)
    conscientiousness: 70,
    extraversion: 50,
    agreeableness: 65,
    neuroticism: 35
  },
  viaIs: {
    creativity: 90,       // High creativity (matches creative investigator)
    curiosity: 88,        // High curiosity (matches creative investigator)
    judgment: 85,
    loveOfLearning: 92,   // High love of learning (matches creative investigator)
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

async function testPersonaGeneration() {
  console.log('Testing Persona Title Generation...\n');
  
  try {
    console.log('1. Testing Inspiring Leader Profile:');
    const inspiringResult = await generateComprehensiveAnalysis(inspiringLeaderScores);
    console.log(`   Title: ${inspiringResult.title}`);
    console.log(`   Description: ${inspiringResult.description.substring(0, 100)}...\n`);
    
    console.log('2. Testing Creative Investigator Profile:');
    const creativeResult = await generateComprehensiveAnalysis(creativeInvestigatorScores);
    console.log(`   Title: ${creativeResult.title}`);
    console.log(`   Description: ${creativeResult.description.substring(0, 100)}...\n`);
    
    console.log('✅ Persona generation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing persona generation:', error);
  }
}

testPersonaGeneration();
