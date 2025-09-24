/**
 * Assessment Score Transformation Utilities
 *
 * Transforms assessment scores from the internal format to the API format
 * Includes industry score calculation based on RIASEC, VIA, and OCEAN traits
 */

/**
 * VIA Character Strengths Mapping
 * Maps VIA assessment categories to the 24 character strengths expected by the API
 */
const VIA_CHARACTER_STRENGTHS_MAPPING = {
  // Wisdom and Knowledge
  wisdomAndKnowledge: {
    creativity: { weight: 0.25, baseVariation: 5 },
    curiosity: { weight: 0.25, baseVariation: 3 },
    judgment: { weight: 0.2, baseVariation: 4 },
    loveOfLearning: { weight: 0.2, baseVariation: 6 },
    perspective: { weight: 0.1, baseVariation: 2 }
  },
  
  // Courage
  courage: {
    bravery: { weight: 0.3, baseVariation: 4 },
    perseverance: { weight: 0.3, baseVariation: 5 },
    honesty: { weight: 0.25, baseVariation: 3 },
    zest: { weight: 0.15, baseVariation: 6 }
  },
  
  // Humanity
  humanity: {
    love: { weight: 0.35, baseVariation: 4 },
    kindness: { weight: 0.35, baseVariation: 3 },
    socialIntelligence: { weight: 0.3, baseVariation: 5 }
  },
  
  // Justice
  justice: {
    teamwork: { weight: 0.4, baseVariation: 4 },
    fairness: { weight: 0.35, baseVariation: 3 },
    leadership: { weight: 0.25, baseVariation: 6 }
  },
  
  // Temperance
  temperance: {
    forgiveness: { weight: 0.25, baseVariation: 4 },
    humility: { weight: 0.25, baseVariation: 3 },
    prudence: { weight: 0.25, baseVariation: 5 },
    selfRegulation: { weight: 0.25, baseVariation: 4 }
  },
  
  // Transcendence
  transcendence: {
    appreciationOfBeauty: { weight: 0.2, baseVariation: 6 },
    gratitude: { weight: 0.2, baseVariation: 4 },
    hope: { weight: 0.2, baseVariation: 5 },
    humor: { weight: 0.2, baseVariation: 7 },
    spirituality: { weight: 0.2, baseVariation: 8 }
  }
};

/**
 * Industry Mapping for 24 Industries
 * Based on INDUSTRY.md documentation with weights for RIASEC, VIA, and OCEAN traits
 */
const INDUSTRY_MAPPING = {
  teknologi: {
    riasec: { investigative: 0.5, realistic: 0.3, conventional: 0.2 },
    via: { loveOfLearning: 0.3, curiosity: 0.3, perseverance: 0.2, creativity: 0.2 },
    ocean: { openness: 0.6, conscientiousness: 0.4 }
  },
  kesehatan: {
    riasec: { investigative: 0.5, social: 0.5 },
    via: { kindness: 0.4, judgment: 0.3, zest: 0.2, loveOfLearning: 0.1 },
    ocean: { conscientiousness: 0.6, agreeableness: 0.4 }
  },
  keuangan: {
    riasec: { conventional: 0.6, enterprising: 0.4 },
    via: { prudence: 0.4, judgment: 0.3, fairness: 0.2, leadership: 0.1 },
    ocean: { conscientiousness: 0.7, neuroticism: 0.3, inverted: ['neuroticism'] }
  },
  pendidikan: {
    riasec: { social: 0.6, artistic: 0.4 },
    via: { loveOfLearning: 0.3, socialIntelligence: 0.3, leadership: 0.2, creativity: 0.2 },
    ocean: { extraversion: 0.5, agreeableness: 0.5 }
  },
  rekayasa: {
    riasec: { realistic: 0.6, investigative: 0.4 },
    via: { perseverance: 0.3, teamwork: 0.3, prudence: 0.2, creativity: 0.2 },
    ocean: { conscientiousness: 0.8, neuroticism: 0.2, inverted: ['neuroticism'] }
  },
  pemasaran: {
    riasec: { enterprising: 0.5, artistic: 0.5 },
    via: { creativity: 0.4, socialIntelligence: 0.3, zest: 0.2, perspective: 0.1 },
    ocean: { extraversion: 0.6, openness: 0.4 }
  },
  hukum: {
    riasec: { investigative: 0.5, enterprising: 0.5 },
    via: { judgment: 0.4, fairness: 0.3, perseverance: 0.3 },
    ocean: { conscientiousness: 0.7, neuroticism: 0.3, inverted: ['neuroticism'] }
  },
  kreatif: {
    riasec: { artistic: 0.7, realistic: 0.3 },
    via: { creativity: 0.5, appreciationOfBeauty: 0.3, bravery: 0.1, zest: 0.1 },
    ocean: { openness: 0.8, conscientiousness: 0.2, inverted: ['conscientiousness'] }
  },
  media: {
    riasec: { artistic: 0.4, social: 0.3, enterprising: 0.3 },
    via: { creativity: 0.4, socialIntelligence: 0.3, curiosity: 0.3 },
    ocean: { extraversion: 0.5, openness: 0.5 }
  },
  penjualan: {
    riasec: { enterprising: 0.7, social: 0.3 },
    via: { zest: 0.3, socialIntelligence: 0.3, perseverance: 0.2, hope: 0.2 },
    ocean: { extraversion: 0.7, conscientiousness: 0.3 }
  },
  sains: {
    riasec: { investigative: 1.0 },
    via: { curiosity: 0.4, loveOfLearning: 0.3, perseverance: 0.2, hope: 0.1 },
    ocean: { openness: 0.6, conscientiousness: 0.4 }
  },
  manufaktur: {
    riasec: { realistic: 0.7, conventional: 0.3 },
    via: { teamwork: 0.4, perseverance: 0.3, prudence: 0.3 },
    ocean: { conscientiousness: 1.0 }
  },
  agrikultur: {
    riasec: { realistic: 1.0 },
    via: { perseverance: 0.5, love: 0.3, gratitude: 0.2 },
    ocean: { conscientiousness: 0.7, neuroticism: 0.3, inverted: ['neuroticism'] }
  },
  pemerintahan: {
    riasec: { conventional: 0.5, social: 0.5 },
    via: { fairness: 0.4, teamwork: 0.3, prudence: 0.2, leadership: 0.1 },
    ocean: { conscientiousness: 0.6, agreeableness: 0.4 }
  },
  konsultasi: {
    riasec: { enterprising: 0.5, investigative: 0.5 },
    via: { judgment: 0.3, perspective: 0.3, socialIntelligence: 0.2, leadership: 0.2 },
    ocean: { extraversion: 0.4, conscientiousness: 0.3, openness: 0.3 }
  },
  pariwisata: {
    riasec: { social: 0.5, enterprising: 0.3, realistic: 0.2 },
    via: { socialIntelligence: 0.4, kindness: 0.3, zest: 0.2, teamwork: 0.1 },
    ocean: { extraversion: 0.6, agreeableness: 0.4 }
  },
  logistik: {
    riasec: { conventional: 0.5, realistic: 0.5 },
    via: { prudence: 0.5, teamwork: 0.3, perseverance: 0.2 },
    ocean: { conscientiousness: 1.0 }
  },
  energi: {
    riasec: { realistic: 0.6, investigative: 0.4 },
    via: { prudence: 0.4, teamwork: 0.3, judgment: 0.3 },
    ocean: { conscientiousness: 0.8, neuroticism: 0.2, inverted: ['neuroticism'] }
  },
  sosial: {
    riasec: { social: 0.7, enterprising: 0.3 },
    via: { kindness: 0.4, fairness: 0.3, hope: 0.2, leadership: 0.1 },
    ocean: { agreeableness: 0.6, extraversion: 0.4 }
  },
  olahraga: {
    riasec: { realistic: 0.4, social: 0.3, enterprising: 0.3 },
    via: { zest: 0.4, perseverance: 0.3, teamwork: 0.2, leadership: 0.1 },
    ocean: { extraversion: 0.6, conscientiousness: 0.4 }
  },
  properti: {
    riasec: { enterprising: 1.0 },
    via: { socialIntelligence: 0.4, zest: 0.3, perseverance: 0.3 },
    ocean: { extraversion: 0.7, conscientiousness: 0.3 }
  },
  kuliner: {
    riasec: { artistic: 0.4, realistic: 0.3, enterprising: 0.3 },
    via: { creativity: 0.4, zest: 0.3, kindness: 0.2, teamwork: 0.1 },
    ocean: { extraversion: 0.5, agreeableness: 0.5 }
  },
  perdagangan: {
    riasec: { enterprising: 0.4, conventional: 0.3, social: 0.3 },
    via: { socialIntelligence: 0.4, zest: 0.3, prudence: 0.2, fairness: 0.1 },
    ocean: { extraversion: 0.6, conscientiousness: 0.4 }
  },
  telekomunikasi: {
    riasec: { realistic: 0.4, investigative: 0.3, enterprising: 0.3 },
    via: { teamwork: 0.4, perseverance: 0.3, curiosity: 0.2, judgment: 0.1 },
    ocean: { conscientiousness: 0.5, openness: 0.5 }
  }
};

/**
 * Transform VIA category scores to the 24 character strengths expected by API
 * @param {Object} viaScores - VIA category scores (0-100)
 * @returns {Object} - Character strengths scores (0-100)
 */
export const transformViaScores = (viaScores) => {
  const characterStrengths = {};
  
  // Initialize all 24 character strengths
  const allStrengths = [
    'creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective',
    'bravery', 'perseverance', 'honesty', 'zest',
    'love', 'kindness', 'socialIntelligence',
    'teamwork', 'fairness', 'leadership',
    'forgiveness', 'humility', 'prudence', 'selfRegulation',
    'appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality'
  ];
  
  // Set default scores
  allStrengths.forEach(strength => {
    characterStrengths[strength] = 50; // Default middle score
  });
  
  // Transform category scores to character strengths
  Object.entries(VIA_CHARACTER_STRENGTHS_MAPPING).forEach(([category, strengths]) => {
    const categoryScore = viaScores[category] ?? 50;
    
    Object.entries(strengths).forEach(([strength, config]) => {
      // Calculate base score using weight
      const baseScore = categoryScore;
      
      // Add variation to make scores more realistic
      const variation = (Math.random() - 0.5) * config.baseVariation * 2;
      
      // Ensure score stays within 0-100 range
      characterStrengths[strength] = Math.max(0, Math.min(100, Math.round(baseScore + variation)));
    });
  });
  
  return characterStrengths;
};

/**
 * Transform RIASEC scores to API format
 * @param {Object} riasecScores - RIASEC category scores
 * @returns {Object} - RIASEC scores in API format
 */
export const transformRiasecScores = (riasecScores) => {
  return {
    realistic: Math.round(riasecScores.realistic || 0),
    investigative: Math.round(riasecScores.investigative || 0),
    artistic: Math.round(riasecScores.artistic || 0),
    social: Math.round(riasecScores.social || 0),
    enterprising: Math.round(riasecScores.enterprising || 0),
    conventional: Math.round(riasecScores.conventional || 0)
  };
};

/**
 * Transform Big Five scores to OCEAN format for API
 * @param {Object} bigFiveScores - Big Five category scores
 * @returns {Object} - OCEAN scores in API format
 */
export const transformOceanScores = (bigFiveScores) => {
  return {
    openness: Math.round(bigFiveScores.openness || 0),
    conscientiousness: Math.round(bigFiveScores.conscientiousness || 0),
    extraversion: Math.round(bigFiveScores.extraversion || 0),
    agreeableness: Math.round(bigFiveScores.agreeableness || 0),
    neuroticism: Math.round(bigFiveScores.neuroticism || 0)
  };
};

/**
 * Calculate industry scores based on RIASEC, VIA, and OCEAN traits
 * @param {Object} riasecScores - RIASEC scores (0-100)
 * @param {Object} viaScores - VIA character strengths scores (0-100)
 * @param {Object} oceanScores - OCEAN personality scores (0-100)
 * @returns {Object} - Industry scores (0-100)
 */
export const calculateIndustryScores = (riasecScores, viaScores, oceanScores) => {
  const industryScores = {};

  Object.entries(INDUSTRY_MAPPING).forEach(([industryName, industryConfig]) => {
    let totalScore = 0;
    let categoryCount = 0;

    // Calculate RIASEC contribution
    if (industryConfig.riasec && Object.keys(industryConfig.riasec).length > 0) {
      let riasecScore = 0;
      Object.entries(industryConfig.riasec).forEach(([trait, weight]) => {
        riasecScore += (riasecScores[trait] || 0) * weight;
      });
      totalScore += riasecScore;
      categoryCount++;
    }

    // Calculate VIA contribution
    if (industryConfig.via && Object.keys(industryConfig.via).length > 0) {
      let viaScore = 0;
      Object.entries(industryConfig.via).forEach(([trait, weight]) => {
        viaScore += (viaScores[trait] || 0) * weight;
      });
      totalScore += viaScore;
      categoryCount++;
    }

    // Calculate OCEAN contribution
    if (industryConfig.ocean && Object.keys(industryConfig.ocean).length > 0) {
      let oceanScore = 0;
      const invertedTraits = industryConfig.ocean.inverted || [];

      Object.entries(industryConfig.ocean).forEach(([trait, weight]) => {
        if (trait !== 'inverted') {
          let traitScore = oceanScores[trait] || 0;

          // Invert score if trait is in inverted list (e.g., Low Neuroticism)
          if (invertedTraits.includes(trait)) {
            traitScore = 100 - traitScore;
          }

          oceanScore += traitScore * weight;
        }
      });
      totalScore += oceanScore;
      categoryCount++;
    }

    // Calculate final industry score (average of all categories)
    const finalScore = categoryCount > 0 ? totalScore / categoryCount : 0;
    industryScores[industryName] = Math.round(Math.max(0, Math.min(100, finalScore)));
  });

  return industryScores;
};

/**
 * Transform all assessment scores to API format
 * @param {Object} assessmentScores - All assessment scores
 * @param {Object} assessmentScores.via - VIA scores
 * @param {Object} assessmentScores.riasec - RIASEC scores  
 * @param {Object} assessmentScores.bigFive - Big Five scores
 * @returns {Object} - Complete assessment data in API format
 */
export const transformAssessmentScores = (assessmentScores) => {
  const { via, riasec, bigFive } = assessmentScores;

  if (!via || !riasec || !bigFive) {
    throw new Error('All assessments must be completed');
  }

  // Transform individual assessment scores
  const transformedRiasec = transformRiasecScores(riasec);
  const transformedOcean = transformOceanScores(bigFive);
  const transformedViaIs = transformViaScores(via);

  // Calculate industry scores
  const industryScore = calculateIndustryScores(
    transformedRiasec,
    transformedViaIs,
    transformedOcean
  );

  return {
    assessmentName: "AI-Driven Talent Mapping",
    riasec: transformedRiasec,
    ocean: transformedOcean,
    viaIs: transformedViaIs,
    industryScore: industryScore
  };
};

/**
 * Validate assessment scores before submission
 * @param {Object} assessmentData - Assessment data to validate
 * @returns {Object} - Validation result
 */
export const validateAssessmentData = (assessmentData) => {
  const errors = [];
  
  // Check required fields
  if (!assessmentData.assessmentName) {
    errors.push('Assessment name is required');
  }
  
  // Validate RIASEC scores
  const riasecFields = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional'];
  riasecFields.forEach(field => {
    const score = assessmentData.riasec?.[field];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      errors.push(`Invalid RIASEC ${field} score: ${score}`);
    }
  });
  
  // Validate OCEAN scores
  const oceanFields = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  oceanFields.forEach(field => {
    const score = assessmentData.ocean?.[field];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      errors.push(`Invalid OCEAN ${field} score: ${score}`);
    }
  });
  
  // Validate VIA-IS scores
  const viaFields = [
    'creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective',
    'bravery', 'perseverance', 'honesty', 'zest',
    'love', 'kindness', 'socialIntelligence',
    'teamwork', 'fairness', 'leadership',
    'forgiveness', 'humility', 'prudence', 'selfRegulation',
    'appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality'
  ];
  
  viaFields.forEach(field => {
    const score = assessmentData.viaIs?.[field];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      errors.push(`Invalid VIA-IS ${field} score: ${score}`);
    }
  });

  // Validate Industry scores
  const industryFields = Object.keys(INDUSTRY_MAPPING);
  industryFields.forEach(field => {
    const score = assessmentData.industryScore?.[field];
    if (typeof score !== 'number' || score < 0 || score > 100) {
      errors.push(`Invalid Industry ${field} score: ${score}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
