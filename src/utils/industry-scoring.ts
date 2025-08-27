// Industry Scoring Utilities
// Based on INDUSTRY.md - 24 industries with personality trait mappings

import { AssessmentScores, RiasecScores, OceanScores, ViaScores } from '../types/assessment-results';

// Industry scoring weights based on INDUSTRY.md
export interface IndustryWeights {
  riasec: { [key in keyof RiasecScores]?: number };
  via: { [key in keyof ViaScores]?: number };
  ocean: { [key in keyof OceanScores]?: number };
}

export interface IndustryScores {
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

// Industry weights configuration based on INDUSTRY.md
export const INDUSTRY_WEIGHTS: { [key in keyof IndustryScores]: IndustryWeights } = {
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
    ocean: { conscientiousness: 70, neuroticism: -30 } // Low neuroticism
  },
  pendidikan: {
    riasec: { social: 60, artistic: 40 },
    via: { loveOfLearning: 30, socialIntelligence: 30, leadership: 20, creativity: 20 },
    ocean: { extraversion: 50, agreeableness: 50 }
  },
  rekayasa: {
    riasec: { realistic: 60, investigative: 40 },
    via: { perseverance: 30, teamwork: 30, prudence: 20, creativity: 20 },
    ocean: { conscientiousness: 80, neuroticism: -20 } // Low neuroticism
  },
  pemasaran: {
    riasec: { enterprising: 50, artistic: 50 },
    via: { creativity: 40, socialIntelligence: 30, zest: 20, perspective: 10 },
    ocean: { extraversion: 60, openness: 40 }
  },
  hukum: {
    riasec: { investigative: 50, enterprising: 50 },
    via: { judgment: 40, fairness: 30, perseverance: 30 },
    ocean: { conscientiousness: 70, neuroticism: -30 } // Low neuroticism
  },
  kreatif: {
    riasec: { artistic: 70, realistic: 30 },
    via: { creativity: 50, appreciationOfBeauty: 30, bravery: 10, zest: 10 },
    ocean: { openness: 80, conscientiousness: -20 } // Low conscientiousness
  },
  media: {
    riasec: { artistic: 40, social: 30, enterprising: 30 },
    via: { creativity: 40, socialIntelligence: 30, curiosity: 30 },
    ocean: { extraversion: 50, openness: 50 }
  },
  penjualan: {
    riasec: { enterprising: 70, social: 30 },
    via: { zest: 30, socialIntelligence: 30, perseverance: 20, hope: 20 },
    ocean: { extraversion: 70, conscientiousness: 30 }
  },
  sains: {
    riasec: { investigative: 100 },
    via: { curiosity: 40, loveOfLearning: 30, perseverance: 20, hope: 10 },
    ocean: { openness: 60, conscientiousness: 40 }
  },
  manufaktur: {
    riasec: { realistic: 70, conventional: 30 },
    via: { teamwork: 40, perseverance: 30, prudence: 30 },
    ocean: { conscientiousness: 100 }
  },
  agrikultur: {
    riasec: { realistic: 100 },
    via: { perseverance: 50, love: 30, gratitude: 20 },
    ocean: { conscientiousness: 70, neuroticism: -30 } // Low neuroticism
  },
  pemerintahan: {
    riasec: { conventional: 50, social: 50 },
    via: { fairness: 40, teamwork: 30, prudence: 20, leadership: 10 },
    ocean: { conscientiousness: 60, agreeableness: 40 }
  },
  konsultasi: {
    riasec: { enterprising: 50, investigative: 50 },
    via: { judgment: 30, perspective: 30, socialIntelligence: 20, leadership: 20 },
    ocean: { extraversion: 40, conscientiousness: 30, openness: 30 }
  },
  pariwisata: {
    riasec: { social: 50, enterprising: 30, realistic: 20 },
    via: { socialIntelligence: 40, kindness: 30, zest: 20, teamwork: 10 },
    ocean: { extraversion: 60, agreeableness: 40 }
  },
  logistik: {
    riasec: { conventional: 50, realistic: 50 },
    via: { prudence: 50, teamwork: 30, perseverance: 20 },
    ocean: { conscientiousness: 100 }
  },
  energi: {
    riasec: { realistic: 60, investigative: 40 },
    via: { prudence: 40, teamwork: 30, judgment: 30 },
    ocean: { conscientiousness: 80, neuroticism: -20 } // Low neuroticism
  },
  sosial: {
    riasec: { social: 70, enterprising: 30 },
    via: { kindness: 40, fairness: 30, hope: 20, leadership: 10 },
    ocean: { agreeableness: 60, extraversion: 40 }
  },
  olahraga: {
    riasec: { realistic: 40, social: 30, enterprising: 30 },
    via: { zest: 40, perseverance: 30, teamwork: 20, leadership: 10 },
    ocean: { extraversion: 60, conscientiousness: 40 }
  },
  properti: {
    riasec: { enterprising: 100 },
    via: { socialIntelligence: 40, zest: 30, perseverance: 30 },
    ocean: { extraversion: 70, conscientiousness: 30 }
  },
  kuliner: {
    riasec: { artistic: 40, realistic: 30, enterprising: 30 },
    via: { creativity: 40, zest: 30, kindness: 20, teamwork: 10 },
    ocean: { extraversion: 50, agreeableness: 50 }
  },
  perdagangan: {
    riasec: { enterprising: 40, conventional: 30, social: 30 },
    via: { socialIntelligence: 40, zest: 30, prudence: 20, fairness: 10 },
    ocean: { extraversion: 60, conscientiousness: 40 }
  },
  telekomunikasi: {
    riasec: { realistic: 40, investigative: 30, enterprising: 30 },
    via: { teamwork: 40, perseverance: 30, curiosity: 20, judgment: 10 },
    ocean: { conscientiousness: 50, openness: 50 }
  }
};

/**
 * Calculate industry compatibility scores based on personality assessment
 */
export function calculateIndustryScores(scores: AssessmentScores): IndustryScores {
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

  return industryScores as IndustryScores;
}

/**
 * Get top industries sorted by compatibility score
 */
export function getTopIndustries(industryScores: IndustryScores, count: number = 8): Array<{
  industry: string;
  score: number;
  displayName: string;
}> {
  const industryDisplayNames: { [key in keyof IndustryScores]: string } = {
    teknologi: 'Teknologi',
    kesehatan: 'Kesehatan',
    keuangan: 'Keuangan',
    pendidikan: 'Pendidikan',
    rekayasa: 'Rekayasa',
    pemasaran: 'Pemasaran',
    hukum: 'Hukum',
    kreatif: 'Kreatif',
    media: 'Media',
    penjualan: 'Penjualan',
    sains: 'Sains',
    manufaktur: 'Manufaktur',
    agrikultur: 'Agrikultur',
    pemerintahan: 'Pemerintahan',
    konsultasi: 'Konsultasi',
    pariwisata: 'Pariwisata',
    logistik: 'Logistik',
    energi: 'Energi',
    sosial: 'Sosial',
    olahraga: 'Olahraga',
    properti: 'Properti',
    kuliner: 'Kuliner',
    perdagangan: 'Perdagangan',
    telekomunikasi: 'Telekomunikasi'
  };

  return Object.entries(industryScores)
    .map(([industry, score]) => ({
      industry,
      score,
      displayName: industryDisplayNames[industry as keyof IndustryScores]
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/**
 * Get industry compatibility level description
 */
export function getIndustryCompatibilityLevel(score: number): {
  level: string;
  description: string;
  color: string;
} {
  if (score >= 80) {
    return {
      level: 'Sangat Cocok',
      description: 'Kepribadian Anda sangat sesuai dengan industri ini',
      color: 'text-green-600'
    };
  } else if (score >= 70) {
    return {
      level: 'Cocok',
      description: 'Kepribadian Anda cukup sesuai dengan industri ini',
      color: 'text-blue-600'
    };
  } else if (score >= 60) {
    return {
      level: 'Cukup Cocok',
      description: 'Ada beberapa aspek kepribadian yang sesuai',
      color: 'text-yellow-600'
    };
  } else {
    return {
      level: 'Kurang Cocok',
      description: 'Mungkin memerlukan pengembangan lebih lanjut',
      color: 'text-gray-600'
    };
  }
}
