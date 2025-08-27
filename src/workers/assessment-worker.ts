/**
 * Assessment Calculation Web Worker
 * Handles heavy assessment calculations in a separate thread
 */

// Import types and utilities for worker
interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
  industryScore: IndustryScores;
}

interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

interface OceanScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface ViaScores {
  creativity: number;
  curiosity: number;
  judgment: number;
  loveOfLearning: number;
  perspective: number;
  bravery: number;
  perseverance: number;
  honesty: number;
  zest: number;
  love: number;
  kindness: number;
  socialIntelligence: number;
  teamwork: number;
  fairness: number;
  leadership: number;
  forgiveness: number;
  humility: number;
  prudence: number;
  selfRegulation: number;
  appreciationOfBeauty: number;
  gratitude: number;
  hope: number;
  humor: number;
  spirituality: number;
}

interface IndustryScores {
  teknologi: number;
  kesehatan: number;
  keuangan: number;
  pendidikan: number;
  rekayasa: number;
  pemasaran: number;
  hukum: number;
  kreatif: number;
  media: number;
  penjualan: number;
  sains: number;
  manufaktur: number;
  agrikultur: number;
  pemerintahan: number;
  konsultasi: number;
  pariwisata: number;
  logistik: number;
  energi: number;
  sosial: number;
  olahraga: number;
  properti: number;
  kuliner: number;
  perdagangan: number;
  telekomunikasi: number;
}

interface Question {
  id: number;
  text: string;
  category: string;
  subcategory?: string;
  isReversed?: boolean;
}

interface WorkerMessage {
  type: 'CALCULATE_SCORES' | 'CALCULATE_INDUSTRY' | 'VALIDATE_ANSWERS' | 'ANALYZE_RESULTS';
  payload: any;
  requestId: string;
}

interface WorkerResponse {
  type: 'CALCULATION_COMPLETE' | 'ERROR';
  payload: any;
  requestId: string;
}

// Assessment types data (simplified for worker)
const ASSESSMENT_TYPES = {
  'riasec': {
    categories: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional']
  },
  'big-five': {
    categories: ['Openness to Experience', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism']
  },
  'via-character': {
    categories: [
      'Creativity', 'Curiosity', 'Judgment', 'Love of Learning', 'Perspective',
      'Bravery', 'Perseverance', 'Honesty', 'Zest',
      'Love', 'Kindness', 'Social Intelligence',
      'Teamwork', 'Fairness', 'Leadership',
      'Forgiveness', 'Humility', 'Prudence', 'Self-Regulation',
      'Appreciation of Beauty', 'Gratitude', 'Hope', 'Humor', 'Spirituality'
    ]
  }
};

// Industry weights (simplified version for worker)
const INDUSTRY_WEIGHTS = {
  teknologi: {
    riasec: { investigative: 50, realistic: 30, conventional: 20 },
    via: { loveOfLearning: 30, curiosity: 30, perseverance: 20, creativity: 20 },
    ocean: { openness: 60, conscientiousness: 40 }
  },
  kesehatan: {
    riasec: { investigative: 50, social: 50 },
    via: { kindness: 40, judgment: 30, zest: 20, loveOfLearning: 10 },
    ocean: { conscientiousness: 60, agreeableness: 40 }
  },
  keuangan: {
    riasec: { conventional: 60, enterprising: 40 },
    via: { prudence: 40, judgment: 30, fairness: 20, leadership: 10 },
    ocean: { conscientiousness: 70, neuroticism: -30 }
  },
  pendidikan: {
    riasec: { social: 60, artistic: 40 },
    via: { loveOfLearning: 30, socialIntelligence: 30, leadership: 20, creativity: 20 },
    ocean: { extraversion: 50, agreeableness: 50 }
  },
  rekayasa: {
    riasec: { realistic: 60, investigative: 40 },
    via: { perseverance: 30, teamwork: 30, prudence: 20, creativity: 20 },
    ocean: { conscientiousness: 80, neuroticism: -20 }
  },
  pemasaran: {
    riasec: { enterprising: 50, artistic: 50 },
    via: { creativity: 40, socialIntelligence: 30, zest: 20, perspective: 10 },
    ocean: { extraversion: 60, openness: 40 }
  },
  hukum: {
    riasec: { investigative: 50, enterprising: 50 },
    via: { judgment: 40, fairness: 30, perseverance: 30 },
    ocean: { conscientiousness: 70, neuroticism: -30 }
  },
  kreatif: {
    riasec: { artistic: 70, realistic: 30 },
    via: { creativity: 50, appreciationOfBeauty: 30, bravery: 10, zest: 10 },
    ocean: { openness: 80, conscientiousness: -20 }
  }
  // Add more industries as needed...
};

/**
 * Calculate category score from raw answers
 */
function calculateCategoryScore(
  answers: Record<number, number | null>,
  questions: Question[],
  categoryKey: string
): number {
  let totalScore = 0;
  let questionCount = 0;

  // Filter questions for this category
  const categoryQuestions = questions.filter(q => 
    q.category === categoryKey || q.subcategory === categoryKey
  );

  for (const question of categoryQuestions) {
    const answer = answers[question.id];
    if (answer !== null && answer !== undefined) {
      // Handle reverse scoring for Big Five
      const score = question.isReversed ? (6 - answer) : answer;
      totalScore += score;
      questionCount++;
    }
  }

  if (questionCount === 0) return 0;

  // Calculate average (1-5 scale)
  const averageScore = totalScore / questionCount;

  // Convert to 0-100 scale: (average - 1) / 4 * 100
  const finalScore = Math.round(((averageScore - 1) / 4) * 100);
  
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * Calculate RIASEC scores
 */
function calculateRiasecScores(answers: Record<number, number | null>, questions: Question[]): RiasecScores {
  return {
    realistic: calculateCategoryScore(answers, questions, 'Realistic'),
    investigative: calculateCategoryScore(answers, questions, 'Investigative'),
    artistic: calculateCategoryScore(answers, questions, 'Artistic'),
    social: calculateCategoryScore(answers, questions, 'Social'),
    enterprising: calculateCategoryScore(answers, questions, 'Enterprising'),
    conventional: calculateCategoryScore(answers, questions, 'Conventional')
  };
}

/**
 * Calculate Big Five (OCEAN) scores
 */
function calculateOceanScores(answers: Record<number, number | null>, questions: Question[]): OceanScores {
  return {
    openness: calculateCategoryScore(answers, questions, 'Openness to Experience'),
    conscientiousness: calculateCategoryScore(answers, questions, 'Conscientiousness'),
    extraversion: calculateCategoryScore(answers, questions, 'Extraversion'),
    agreeableness: calculateCategoryScore(answers, questions, 'Agreeableness'),
    neuroticism: calculateCategoryScore(answers, questions, 'Neuroticism')
  };
}

/**
 * Calculate VIA Character Strengths scores
 */
function calculateViaScores(answers: Record<number, number | null>, questions: Question[]): ViaScores {
  return {
    creativity: calculateCategoryScore(answers, questions, 'Creativity'),
    curiosity: calculateCategoryScore(answers, questions, 'Curiosity'),
    judgment: calculateCategoryScore(answers, questions, 'Judgment'),
    loveOfLearning: calculateCategoryScore(answers, questions, 'Love of Learning'),
    perspective: calculateCategoryScore(answers, questions, 'Perspective'),
    bravery: calculateCategoryScore(answers, questions, 'Bravery'),
    perseverance: calculateCategoryScore(answers, questions, 'Perseverance'),
    honesty: calculateCategoryScore(answers, questions, 'Honesty'),
    zest: calculateCategoryScore(answers, questions, 'Zest'),
    love: calculateCategoryScore(answers, questions, 'Love'),
    kindness: calculateCategoryScore(answers, questions, 'Kindness'),
    socialIntelligence: calculateCategoryScore(answers, questions, 'Social Intelligence'),
    teamwork: calculateCategoryScore(answers, questions, 'Teamwork'),
    fairness: calculateCategoryScore(answers, questions, 'Fairness'),
    leadership: calculateCategoryScore(answers, questions, 'Leadership'),
    forgiveness: calculateCategoryScore(answers, questions, 'Forgiveness'),
    humility: calculateCategoryScore(answers, questions, 'Humility'),
    prudence: calculateCategoryScore(answers, questions, 'Prudence'),
    selfRegulation: calculateCategoryScore(answers, questions, 'Self-Regulation'),
    appreciationOfBeauty: calculateCategoryScore(answers, questions, 'Appreciation of Beauty'),
    gratitude: calculateCategoryScore(answers, questions, 'Gratitude'),
    hope: calculateCategoryScore(answers, questions, 'Hope'),
    humor: calculateCategoryScore(answers, questions, 'Humor'),
    spirituality: calculateCategoryScore(answers, questions, 'Spirituality')
  };
}

/**
 * Calculate industry compatibility scores
 */
function calculateIndustryScores(scores: { riasec: RiasecScores; ocean: OceanScores; viaIs: ViaScores }): IndustryScores {
  const industryScores: Partial<IndustryScores> = {};

  // Calculate score for each industry
  Object.entries(INDUSTRY_WEIGHTS).forEach(([industryKey, weights]) => {
    let totalScore = 0;
    let totalWeight = 0;

    // Calculate RIASEC contribution
    Object.entries(weights.riasec || {}).forEach(([trait, weight]) => {
      const traitScore = scores.riasec[trait as keyof RiasecScores];
      totalScore += (traitScore * weight) / 100;
      totalWeight += weight;
    });

    // Calculate VIA contribution
    Object.entries(weights.via || {}).forEach(([trait, weight]) => {
      const traitScore = scores.viaIs[trait as keyof ViaScores];
      totalScore += (traitScore * weight) / 100;
      totalWeight += weight;
    });

    // Calculate OCEAN contribution
    Object.entries(weights.ocean || {}).forEach(([trait, weight]) => {
      const traitScore = scores.ocean[trait as keyof OceanScores];
      // Handle negative weights (e.g., Low Neuroticism)
      const adjustedScore = weight < 0 ? (100 - traitScore) : traitScore;
      const adjustedWeight = Math.abs(weight);
      totalScore += (adjustedScore * adjustedWeight) / 100;
      totalWeight += adjustedWeight;
    });

    // Normalize score to 0-100 range
    const normalizedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    industryScores[industryKey as keyof IndustryScores] = Math.round(Math.min(Math.max(normalizedScore, 0), 100));
  });

  // Fill in missing industries with 0
  const allIndustries: (keyof IndustryScores)[] = [
    'teknologi', 'kesehatan', 'keuangan', 'pendidikan', 'rekayasa', 'pemasaran',
    'hukum', 'kreatif', 'media', 'penjualan', 'sains', 'manufaktur',
    'agrikultur', 'pemerintahan', 'konsultasi', 'pariwisata', 'logistik',
    'energi', 'sosial', 'olahraga', 'properti', 'kuliner', 'perdagangan', 'telekomunikasi'
  ];

  allIndustries.forEach(industry => {
    if (!(industry in industryScores)) {
      industryScores[industry] = 0;
    }
  });

  return industryScores as IndustryScores;
}

/**
 * Calculate all assessment scores
 */
function calculateAllScores(answers: Record<number, number | null>, questions: Question[]): AssessmentScores {
  const baseScores = {
    riasec: calculateRiasecScores(answers, questions),
    ocean: calculateOceanScores(answers, questions),
    viaIs: calculateViaScores(answers, questions)
  };

  // Calculate industry scores based on personality scores
  const industryScore = calculateIndustryScores(baseScores);

  return {
    ...baseScores,
    industryScore
  };
}

/**
 * Validate answers
 */
function validateAnswers(answers: Record<number, number | null>, questions: Question[]): {
  isValid: boolean;
  missingQuestions: number[];
  totalQuestions: number;
  answeredQuestions: number;
} {
  const missingQuestions: number[] = [];
  let answeredCount = 0;

  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === null || answer === undefined) {
      missingQuestions.push(question.id);
    } else {
      answeredCount++;
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
    totalQuestions: questions.length,
    answeredQuestions: answeredCount
  };
}

// Worker message handler
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { type, payload, requestId } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'CALCULATE_SCORES':
        result = calculateAllScores(payload.answers, payload.questions);
        break;

      case 'CALCULATE_INDUSTRY':
        result = calculateIndustryScores(payload.scores);
        break;

      case 'VALIDATE_ANSWERS':
        result = validateAnswers(payload.answers, payload.questions);
        break;

      case 'ANALYZE_RESULTS':
        // This would include AI analysis logic
        result = { message: 'Analysis complete', scores: payload.scores };
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send successful response
    const response: WorkerResponse = {
      type: 'CALCULATION_COMPLETE',
      payload: result,
      requestId
    };

    self.postMessage(response);

  } catch (error) {
    // Send error response
    const errorResponse: WorkerResponse = {
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      requestId
    };

    self.postMessage(errorResponse);
  }
};
