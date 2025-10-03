// Assessment Calculation Utilities
// Based on assessment-calculation.md documentation

import { assessmentTypes, Question } from '../data/assessmentQuestions';
import { AssessmentScores, RiasecScores, OceanScores, ViaScores } from '../types/assessment-results';
import { calculateIndustryScores } from './industry-scoring';

// Define explicit category orders for each assessment to ensure consistency
const ASSESSMENT_CATEGORY_ORDERS = {
  'big-five': ['Openness to Experience', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
  'riasec': ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
  'via-character': ['Wisdom', 'Courage', 'Humanity', 'Justice', 'Temperance', 'Transcendence']
};

/**
 * Get ordered categories for an assessment
 */
export function getOrderedCategories(assessmentId: string, questions: Question[]): string[] {
  const predefinedOrder = ASSESSMENT_CATEGORY_ORDERS[assessmentId as keyof typeof ASSESSMENT_CATEGORY_ORDERS];

  if (predefinedOrder) {
    // Use predefined order and filter to only include categories that exist in questions
    const existingCategories = new Set(questions.map(q => q.category));
    return predefinedOrder.filter(category => existingCategories.has(category));
  }

  // Fallback to unique categories in order of appearance
  const seen = new Set<string>();
  const categories: string[] = [];

  for (const question of questions) {
    if (!seen.has(question.category)) {
      seen.add(question.category);
      categories.push(question.category);
    }
  }

  return categories;
}

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
 * Validate that all questions in a specific section are answered
 */
export function validateSectionCompletion(
  answers: Record<number, number | null>,
  assessmentIndex: number,
  sectionIndex: number
): {
  isComplete: boolean;
  answeredQuestions: number;
  totalQuestions: number;
  missingQuestions: number[];
} {
  const assessment = assessmentTypes[assessmentIndex];
  if (!assessment) {
    return { isComplete: false, answeredQuestions: 0, totalQuestions: 0, missingQuestions: [] };
  }

  // Group questions by category
  const grouped = assessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});

  // Use ordered categories instead of Object.keys to ensure consistency
  const categories = getOrderedCategories(assessment.id, assessment.questions);
  const category = categories[sectionIndex];

  if (!category) {
    return { isComplete: false, answeredQuestions: 0, totalQuestions: 0, missingQuestions: [] };
  }

  const questionsInSection = grouped[category] || [];
  const missingQuestions: number[] = [];
  let answeredCount = 0;

  for (const question of questionsInSection) {
    const answer = answers[question.id];
    if (answer === null || answer === undefined) {
      missingQuestions.push(question.id);
    } else {
      answeredCount++;
    }
  }

  return {
    isComplete: missingQuestions.length === 0,
    answeredQuestions: answeredCount,
    totalQuestions: questionsInSection.length,
    missingQuestions
  };
}

/**
 * Check if navigation to a specific section is allowed
 */
export function canNavigateToSection(
  answers: Record<number, number | null>,
  currentAssessmentIndex: number,
  currentSectionIndex: number,
  targetAssessmentIndex: number,
  targetSectionIndex: number
): {
  canNavigate: boolean;
  reason?: string;
  missingQuestions?: number;
} {
  // Always allow navigation to previous sections or current section
  if (targetAssessmentIndex < currentAssessmentIndex ||
      (targetAssessmentIndex === currentAssessmentIndex && targetSectionIndex <= currentSectionIndex)) {
    return { canNavigate: true };
  }

  // For forward navigation within the same assessment
  if (targetAssessmentIndex === currentAssessmentIndex) {
    // Check if all sections before the target section are completed
    // This allows free navigation to any section that has all previous sections completed
    const assessment = assessmentTypes[currentAssessmentIndex];
    if (!assessment) {
      return { canNavigate: false, reason: 'Assessment tidak ditemukan' };
    }

    const categories = getOrderedCategories(assessment.id, assessment.questions);
    
    // Check if all sections between current and target are completed
    for (let i = currentSectionIndex; i < targetSectionIndex; i++) {
      const sectionValidation = validateSectionCompletion(
        answers,
        currentAssessmentIndex,
        i
      );

      if (!sectionValidation.isComplete) {
        const missingCount = sectionValidation.totalQuestions - sectionValidation.answeredQuestions;
        const sectionName = categories[i] || `Bagian ${i + 1}`;
        return {
          canNavigate: false,
          reason: `Selesaikan ${missingCount} soal di "${sectionName}" terlebih dahulu`,
          missingQuestions: missingCount
        };
      }
    }

    return { canNavigate: true };
  }

  // For navigation to a different assessment
  if (targetAssessmentIndex > currentAssessmentIndex) {
    // Check if target assessment has been worked on before
    const targetAssessment = assessmentTypes[targetAssessmentIndex];
    if (!targetAssessment) {
      return { canNavigate: false, reason: 'Assessment tidak ditemukan' };
    }

    // Check if user has answered at least one question in the target assessment
    const hasAnsweredInTarget = targetAssessment.questions.some(q => 
      answers[q.id] !== null && answers[q.id] !== undefined
    );

    // If target assessment has been started, allow free navigation to any section
    if (hasAnsweredInTarget) {
      return { canNavigate: true };
    }

    // For new/unstarted assessments, only allow sequential access
    if (targetAssessmentIndex !== currentAssessmentIndex + 1) {
      const assessmentName = assessmentTypes[targetAssessmentIndex]?.name || 'Phase ini';
      return {
        canNavigate: false,
        reason: `Selesaikan phase sebelumnya untuk membuka ${assessmentName}`
      };
    }

    // Must start from the first section of a new assessment
    if (targetSectionIndex !== 0) {
      return {
        canNavigate: false,
        reason: 'Harus memulai dari bagian pertama assessment berikutnya'
      };
    }

    // Check if current assessment is completely finished
    const isCurrentAssessmentComplete = isAssessmentComplete(answers, currentAssessmentIndex);
    if (!isCurrentAssessmentComplete.isComplete) {
      return {
        canNavigate: false,
        reason: `Selesaikan semua bagian di ${assessmentTypes[currentAssessmentIndex]?.name || 'assessment saat ini'} terlebih dahulu`
      };
    }

    return { canNavigate: true };
  }

  return {
    canNavigate: false,
    reason: 'Navigasi tidak valid'
  };
}

/**
 * Check if an entire assessment is complete (all sections finished)
 */
export function isAssessmentComplete(
  answers: Record<number, number | null>,
  assessmentIndex: number
): {
  isComplete: boolean;
  completedSections: number;
  totalSections: number;
  incompleteSections: number[];
} {
  const assessment = assessmentTypes[assessmentIndex];
  if (!assessment) {
    return { isComplete: false, completedSections: 0, totalSections: 0, incompleteSections: [] };
  }

  // Group questions by category to get sections
  const grouped = assessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});

  // Use ordered categories instead of Object.keys to ensure consistency
  const categories = getOrderedCategories(assessment.id, assessment.questions);
  const incompleteSections: number[] = [];
  let completedSections = 0;

  // Check each section
  for (let sectionIndex = 0; sectionIndex < categories.length; sectionIndex++) {
    const sectionValidation = validateSectionCompletion(answers, assessmentIndex, sectionIndex);
    if (sectionValidation.isComplete) {
      completedSections++;
    } else {
      incompleteSections.push(sectionIndex);
    }
  }

  return {
    isComplete: incompleteSections.length === 0,
    completedSections,
    totalSections: categories.length,
    incompleteSections
  };
}

/**
 * Get the next available section that can be accessed
 */
export function getNextAvailableSection(
  answers: Record<number, number | null>,
  currentAssessmentIndex: number,
  currentSectionIndex: number
): {
  assessmentIndex: number;
  sectionIndex: number;
  isNextSection: boolean;
} | null {
  // Check if we can move to next section in current assessment
  const assessment = assessmentTypes[currentAssessmentIndex];
  if (!assessment) return null;

  // Group questions by category to get total sections
  const grouped = assessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  // Use ordered categories instead of Object.keys to ensure consistency
  const categories = getOrderedCategories(assessment.id, assessment.questions);
  const totalSectionsInCurrentAssessment = categories.length;

  // Check if current section is complete
  const currentSectionValidation = validateSectionCompletion(
    answers,
    currentAssessmentIndex,
    currentSectionIndex
  );

  if (!currentSectionValidation.isComplete) {
    // Stay in current section
    return {
      assessmentIndex: currentAssessmentIndex,
      sectionIndex: currentSectionIndex,
      isNextSection: false
    };
  }

  // If there's a next section in current assessment
  if (currentSectionIndex + 1 < totalSectionsInCurrentAssessment) {
    return {
      assessmentIndex: currentAssessmentIndex,
      sectionIndex: currentSectionIndex + 1,
      isNextSection: true
    };
  }

  // If current assessment is complete, check if we can move to next assessment
  const isCurrentAssessmentComplete = isAssessmentComplete(answers, currentAssessmentIndex);
  if (isCurrentAssessmentComplete.isComplete && currentAssessmentIndex + 1 < assessmentTypes.length) {
    return {
      assessmentIndex: currentAssessmentIndex + 1,
      sectionIndex: 0,
      isNextSection: true
    };
  }

  // No next section available
  return null;
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
 * Check if all three assessment phases are complete
 * Returns true only if Big Five (Phase 1), RIASEC (Phase 2), and VIA (Phase 3) are all completed
 */
export function areAllPhasesComplete(answers: Record<number, number | null>): {
  allComplete: boolean;
  phase1Complete: boolean;
  phase2Complete: boolean;
  phase3Complete: boolean;
  message?: string;
} {
  const phase1 = isAssessmentComplete(answers, 0); // Big Five
  const phase2 = isAssessmentComplete(answers, 1); // RIASEC
  const phase3 = isAssessmentComplete(answers, 2); // VIA

  const allComplete = phase1.isComplete && phase2.isComplete && phase3.isComplete;

  let message = '';
  if (!allComplete) {
    const incomplete: string[] = [];
    if (!phase1.isComplete) incomplete.push('Big Five (Phase 1)');
    if (!phase2.isComplete) incomplete.push('RIASEC (Phase 2)');
    if (!phase3.isComplete) incomplete.push('VIA Character Strengths (Phase 3)');
    message = `Harap selesaikan semua fase: ${incomplete.join(', ')}`;
  }

  return {
    allComplete,
    phase1Complete: phase1.isComplete,
    phase2Complete: phase2.isComplete,
    phase3Complete: phase3.isComplete,
    message
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
