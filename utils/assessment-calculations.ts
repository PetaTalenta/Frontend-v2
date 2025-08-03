// Assessment Calculation Utilities
// Based on assessment-calculation.md documentation

import { assessmentTypes, Question } from '../data/assessmentQuestions';
import { AssessmentScores, RiasecScores, OceanScores, ViaScores } from '../types/assessment-results';
import { calculateIndustryScores } from './industry-scoring';

/**
 * Calculate category score from raw answers
 * Converts 5-point scale (1-5) to 0-100 scale
 * Handles reverse scoring for Big Five questions
 */
export function calculateCategoryScore(
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
 * Calculate RIASEC scores from answers
 */
export function calculateRiasecScores(answers: Record<number, number | null>): RiasecScores {
  const riasecAssessment = assessmentTypes.find(a => a.id === 'riasec');
  if (!riasecAssessment) throw new Error('RIASEC assessment not found');

  return {
    realistic: calculateCategoryScore(answers, riasecAssessment.questions, 'Realistic'),
    investigative: calculateCategoryScore(answers, riasecAssessment.questions, 'Investigative'),
    artistic: calculateCategoryScore(answers, riasecAssessment.questions, 'Artistic'),
    social: calculateCategoryScore(answers, riasecAssessment.questions, 'Social'),
    enterprising: calculateCategoryScore(answers, riasecAssessment.questions, 'Enterprising'),
    conventional: calculateCategoryScore(answers, riasecAssessment.questions, 'Conventional')
  };
}

/**
 * Calculate Big Five (OCEAN) scores from answers
 */
export function calculateOceanScores(answers: Record<number, number | null>): OceanScores {
  const bigFiveAssessment = assessmentTypes.find(a => a.id === 'big-five');
  if (!bigFiveAssessment) throw new Error('Big Five assessment not found');

  return {
    openness: calculateCategoryScore(answers, bigFiveAssessment.questions, 'Openness to Experience'),
    conscientiousness: calculateCategoryScore(answers, bigFiveAssessment.questions, 'Conscientiousness'),
    extraversion: calculateCategoryScore(answers, bigFiveAssessment.questions, 'Extraversion'),
    agreeableness: calculateCategoryScore(answers, bigFiveAssessment.questions, 'Agreeableness'),
    neuroticism: calculateCategoryScore(answers, bigFiveAssessment.questions, 'Neuroticism')
  };
}

/**
 * Calculate VIA Character Strengths scores from answers
 */
export function calculateViaScores(answers: Record<number, number | null>): ViaScores {
  const viaAssessment = assessmentTypes.find(a => a.id === 'via-character');
  if (!viaAssessment) throw new Error('VIA assessment not found');

  return {
    // Wisdom & Knowledge
    creativity: calculateCategoryScore(answers, viaAssessment.questions, 'Creativity'),
    curiosity: calculateCategoryScore(answers, viaAssessment.questions, 'Curiosity'),
    judgment: calculateCategoryScore(answers, viaAssessment.questions, 'Judgment'),
    loveOfLearning: calculateCategoryScore(answers, viaAssessment.questions, 'Love of Learning'),
    perspective: calculateCategoryScore(answers, viaAssessment.questions, 'Perspective'),
    
    // Courage
    bravery: calculateCategoryScore(answers, viaAssessment.questions, 'Bravery'),
    perseverance: calculateCategoryScore(answers, viaAssessment.questions, 'Perseverance'),
    honesty: calculateCategoryScore(answers, viaAssessment.questions, 'Honesty'),
    zest: calculateCategoryScore(answers, viaAssessment.questions, 'Zest'),
    
    // Humanity
    love: calculateCategoryScore(answers, viaAssessment.questions, 'Love'),
    kindness: calculateCategoryScore(answers, viaAssessment.questions, 'Kindness'),
    socialIntelligence: calculateCategoryScore(answers, viaAssessment.questions, 'Social Intelligence'),
    
    // Justice
    teamwork: calculateCategoryScore(answers, viaAssessment.questions, 'Teamwork'),
    fairness: calculateCategoryScore(answers, viaAssessment.questions, 'Fairness'),
    leadership: calculateCategoryScore(answers, viaAssessment.questions, 'Leadership'),
    
    // Temperance
    forgiveness: calculateCategoryScore(answers, viaAssessment.questions, 'Forgiveness'),
    humility: calculateCategoryScore(answers, viaAssessment.questions, 'Humility'),
    prudence: calculateCategoryScore(answers, viaAssessment.questions, 'Prudence'),
    selfRegulation: calculateCategoryScore(answers, viaAssessment.questions, 'Self-Regulation'),
    
    // Transcendence
    appreciationOfBeauty: calculateCategoryScore(answers, viaAssessment.questions, 'Appreciation of Beauty'),
    gratitude: calculateCategoryScore(answers, viaAssessment.questions, 'Gratitude'),
    hope: calculateCategoryScore(answers, viaAssessment.questions, 'Hope'),
    humor: calculateCategoryScore(answers, viaAssessment.questions, 'Humor'),
    spirituality: calculateCategoryScore(answers, viaAssessment.questions, 'Spirituality')
  };
}

/**
 * Calculate all assessment scores from raw answers
 */
export function calculateAllScores(answers: Record<number, number | null>): AssessmentScores {
  const baseScores = {
    riasec: calculateRiasecScores(answers),
    ocean: calculateOceanScores(answers),
    viaIs: calculateViaScores(answers)
  };

  // Calculate industry scores based on personality scores
  const industryScore = calculateIndustryScores(baseScores);

  return {
    ...baseScores,
    industryScore
  };
}

/**
 * Validate that all required questions are answered
 */
export function validateAnswers(answers: Record<number, number | null>): {
  isValid: boolean;
  missingQuestions: number[];
  totalQuestions: number;
  answeredQuestions: number;
} {
  const allQuestions = assessmentTypes.flatMap(assessment => assessment.questions);
  const missingQuestions: number[] = [];
  let answeredCount = 0;

  for (const question of allQuestions) {
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
    totalQuestions: allQuestions.length,
    answeredQuestions: answeredCount
  };
}

/**
 * Get the dominant RIASEC type (Holland Code)
 */
export function getDominantRiasecType(riasecScores: RiasecScores): {
  primary: string;
  secondary: string;
  tertiary: string;
  code: string;
} {
  const entries = Object.entries(riasecScores).sort(([,a], [,b]) => b - a);
  
  return {
    primary: entries[0][0],
    secondary: entries[1][0],
    tertiary: entries[2][0],
    code: entries.slice(0, 3).map(([key]) => key.charAt(0).toUpperCase()).join('')
  };
}

/**
 * Get top VIA character strengths
 */
export function getTopViaStrengths(viaScores: ViaScores, count: number = 5): Array<{
  strength: string;
  score: number;
  category: string;
}> {
  const entries = Object.entries(viaScores).map(([key, score]) => {
    // Find which category this strength belongs to
    let category = '';
    for (const [cat, strengths] of Object.entries({
      'Wisdom & Knowledge': ['creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective'],
      'Courage': ['bravery', 'perseverance', 'honesty', 'zest'],
      'Humanity': ['love', 'kindness', 'socialIntelligence'],
      'Justice': ['teamwork', 'fairness', 'leadership'],
      'Temperance': ['forgiveness', 'humility', 'prudence', 'selfRegulation'],
      'Transcendence': ['appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality']
    })) {
      if (strengths.includes(key)) {
        category = cat;
        break;
      }
    }
    
    return { strength: key, score, category };
  });

  return entries.sort((a, b) => b.score - a.score).slice(0, count);
}
