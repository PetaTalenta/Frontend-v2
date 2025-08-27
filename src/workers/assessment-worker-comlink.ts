/**
 * Assessment Worker with Comlink Integration
 * Simplified worker communication using Comlink
 */

import * as Comlink from 'comlink';

// Types for assessment calculations
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

interface ValidationResult {
  isValid: boolean;
  missingQuestions: number[];
  totalQuestions: number;
  answeredQuestions: number;
}

interface ProgressCallback {
  (progress: number, stage: string): void;
}

// Industry weights configuration
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
  // Additional industries would be added here...
};

/**
 * Assessment Calculator Class with Comlink
 */
class AssessmentCalculator {
  /**
   * Calculate category score from raw answers
   */
  private calculateCategoryScore(
    answers: Record<number, number | null>,
    questions: Question[],
    categoryKey: string
  ): number {
    let totalScore = 0;
    let questionCount = 0;

    const categoryQuestions = questions.filter(q => 
      q.category === categoryKey || q.subcategory === categoryKey
    );

    for (const question of categoryQuestions) {
      const answer = answers[question.id];
      if (answer !== null && answer !== undefined) {
        const score = question.isReversed ? (6 - answer) : answer;
        totalScore += score;
        questionCount++;
      }
    }

    if (questionCount === 0) return 0;

    const averageScore = totalScore / questionCount;
    const finalScore = Math.round(((averageScore - 1) / 4) * 100);
    
    return Math.max(0, Math.min(100, finalScore));
  }

  /**
   * Calculate RIASEC scores with progress callback
   */
  async calculateRiasecScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: ProgressCallback
  ): Promise<RiasecScores> {
    const categories = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'];
    const scores: Partial<RiasecScores> = {};

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const key = category.toLowerCase() as keyof RiasecScores;
      
      scores[key] = this.calculateCategoryScore(answers, questions, category);
      
      if (onProgress) {
        onProgress((i + 1) / categories.length * 100, `Calculating ${category}`);
      }
      
      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return scores as RiasecScores;
  }

  /**
   * Calculate Big Five scores with progress callback
   */
  async calculateOceanScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: ProgressCallback
  ): Promise<OceanScores> {
    const categories = [
      'Openness to Experience', 
      'Conscientiousness', 
      'Extraversion', 
      'Agreeableness', 
      'Neuroticism'
    ];
    const keys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const scores: Partial<OceanScores> = {};

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const key = keys[i] as keyof OceanScores;
      
      scores[key] = this.calculateCategoryScore(answers, questions, category);
      
      if (onProgress) {
        onProgress((i + 1) / categories.length * 100, `Calculating ${category}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return scores as OceanScores;
  }

  /**
   * Calculate VIA scores with progress callback
   */
  async calculateViaScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: ProgressCallback
  ): Promise<ViaScores> {
    const categories = [
      'Creativity', 'Curiosity', 'Judgment', 'Love of Learning', 'Perspective',
      'Bravery', 'Perseverance', 'Honesty', 'Zest',
      'Love', 'Kindness', 'Social Intelligence',
      'Teamwork', 'Fairness', 'Leadership',
      'Forgiveness', 'Humility', 'Prudence', 'Self-Regulation',
      'Appreciation of Beauty', 'Gratitude', 'Hope', 'Humor', 'Spirituality'
    ];
    
    const keys = [
      'creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective',
      'bravery', 'perseverance', 'honesty', 'zest',
      'love', 'kindness', 'socialIntelligence',
      'teamwork', 'fairness', 'leadership',
      'forgiveness', 'humility', 'prudence', 'selfRegulation',
      'appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality'
    ];

    const scores: Partial<ViaScores> = {};

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const key = keys[i] as keyof ViaScores;
      
      scores[key] = this.calculateCategoryScore(answers, questions, category);
      
      if (onProgress) {
        onProgress((i + 1) / categories.length * 100, `Calculating ${category}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return scores as ViaScores;
  }

  /**
   * Calculate industry scores with progress callback
   */
  async calculateIndustryScores(
    scores: { riasec: RiasecScores; ocean: OceanScores; viaIs: ViaScores },
    onProgress?: ProgressCallback
  ): Promise<IndustryScores> {
    const industries = Object.keys(INDUSTRY_WEIGHTS);
    const industryScores: Partial<IndustryScores> = {};

    for (let i = 0; i < industries.length; i++) {
      const industryKey = industries[i];
      const weights = INDUSTRY_WEIGHTS[industryKey as keyof typeof INDUSTRY_WEIGHTS];
      
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
        const adjustedScore = weight < 0 ? (100 - traitScore) : traitScore;
        const adjustedWeight = Math.abs(weight);
        totalScore += (adjustedScore * adjustedWeight) / 100;
        totalWeight += adjustedWeight;
      });

      const normalizedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
      industryScores[industryKey as keyof IndustryScores] = Math.round(Math.min(Math.max(normalizedScore, 0), 100));
      
      if (onProgress) {
        onProgress((i + 1) / industries.length * 100, `Calculating ${industryKey}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Fill missing industries with 0
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
   * Calculate all assessment scores with progress tracking
   */
  async calculateAllScores(
    answers: Record<number, number | null>, 
    questions: Question[],
    onProgress?: ProgressCallback
  ): Promise<AssessmentScores> {
    if (onProgress) onProgress(0, 'Starting calculations...');

    // Calculate RIASEC scores (25% of progress)
    const riasec = await this.calculateRiasecScores(answers, questions, 
      (progress, stage) => onProgress && onProgress(progress * 0.25, stage)
    );

    // Calculate OCEAN scores (25% of progress)
    const ocean = await this.calculateOceanScores(answers, questions,
      (progress, stage) => onProgress && onProgress(25 + progress * 0.25, stage)
    );

    // Calculate VIA scores (25% of progress)
    const viaIs = await this.calculateViaScores(answers, questions,
      (progress, stage) => onProgress && onProgress(50 + progress * 0.25, stage)
    );

    const baseScores = { riasec, ocean, viaIs };

    // Calculate industry scores (25% of progress)
    const industryScore = await this.calculateIndustryScores(baseScores,
      (progress, stage) => onProgress && onProgress(75 + progress * 0.25, stage)
    );

    if (onProgress) onProgress(100, 'Calculations complete!');

    return {
      ...baseScores,
      industryScore
    };
  }

  /**
   * Validate answers
   */
  async validateAnswers(
    answers: Record<number, number | null>, 
    questions: Question[]
  ): Promise<ValidationResult> {
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

  /**
   * Get calculation statistics
   */
  getStatistics() {
    return {
      supportedCalculations: [
        'calculateAllScores',
        'calculateRiasecScores', 
        'calculateOceanScores',
        'calculateViaScores',
        'calculateIndustryScores',
        'validateAnswers'
      ],
      industryCount: Object.keys(INDUSTRY_WEIGHTS).length,
      workerVersion: '1.0.0'
    };
  }
}

// Create calculator instance
const calculator = new AssessmentCalculator();

// Expose calculator to Comlink
Comlink.expose(calculator);
