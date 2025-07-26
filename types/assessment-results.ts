// Assessment Results Types
// Based on assessment-calculation.md documentation

export interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface OceanScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface ViaScores {
  // Wisdom & Knowledge
  creativity: number;
  curiosity: number;
  judgment: number;
  loveOfLearning: number;
  perspective: number;
  
  // Courage
  bravery: number;
  perseverance: number;
  honesty: number;
  zest: number;
  
  // Humanity
  love: number;
  kindness: number;
  socialIntelligence: number;
  
  // Justice
  teamwork: number;
  fairness: number;
  leadership: number;
  
  // Temperance
  forgiveness: number;
  humility: number;
  prudence: number;
  selfRegulation: number;
  
  // Transcendence
  appreciationOfBeauty: number;
  gratitude: number;
  hope: number;
  humor: number;
  spirituality: number;
}

export interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

export type CareerProspectLevel = 'super high' | 'high' | 'moderate' | 'low' | 'super low';

export interface CareerProspect {
  jobAvailability: CareerProspectLevel;
  salaryPotential: CareerProspectLevel;
  careerProgression: CareerProspectLevel;
  industryGrowth: CareerProspectLevel;
  skillDevelopment: CareerProspectLevel;
}

export interface CareerRecommendation {
  careerName: string;
  careerProspect: CareerProspect;
  description?: string;
  matchPercentage?: number;
}

export interface PersonaProfile {
  title: string;
  description: string;
  strengths: string[];
  recommendations: string[];
  careerRecommendation: CareerRecommendation[];
  roleModel: string[];
}

export interface AssessmentResult {
  id: string;
  userId?: string;
  createdAt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  assessment_data: AssessmentScores;
  persona_profile: PersonaProfile;
}

// API Response Types based on Assessment Service documentation
export interface AssessmentSubmitRequest {
  assessmentName?: 'AI-Driven Talent Mapping' | 'AI-Based IQ Test' | 'Custom Assessment';
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

export interface AssessmentSubmitResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: 'queued' | 'processing';
    estimatedProcessingTime: string;
    queuePosition: number;
    tokenCost: number;
    remainingTokens: number;
  };
}

export interface AssessmentStatusResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    createdAt: string;
    updatedAt: string;
    estimatedTimeRemaining?: string;
    queuePosition?: number;
    userId: string;
    userEmail: string;
    resultId?: string;
    assessmentName: string;
    error?: string | null;
  };
}

export interface QueueStatusResponse {
  success: boolean;
  message: string;
  data: {
    queueLength: number;
    activeWorkers: number;
    averageProcessingTime: string;
    estimatedWaitTime: string;
    jobStats: {
      total: number;
      queued: number;
      processing: number;
      completed: number;
      failed: number;
    };
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  dependencies: {
    rabbitmq: {
      status: 'healthy' | 'unhealthy';
      details: {
        messageCount: number;
        consumerCount: number;
      };
    };
    authService: {
      status: 'healthy' | 'unhealthy';
    };
    archiveService: {
      status: 'healthy' | 'unhealthy';
    };
  };
  jobs: {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export interface IdempotencyHealthResponse {
  success: boolean;
  message: string;
  data: {
    status: 'healthy' | 'unhealthy';
    cacheSize: number;
    expiredEntries: number;
    lastCleanup: string;
  };
}

// Score interpretation ranges
export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

export const SCORE_RANGES: ScoreRange[] = [
  { min: 81, max: 100, label: 'Very High', color: '#22c55e', description: 'Sangat Tinggi' },
  { min: 61, max: 80, label: 'High', color: '#3b82f6', description: 'Tinggi' },
  { min: 41, max: 60, label: 'Moderate', color: '#eab308', description: 'Sedang' },
  { min: 21, max: 40, label: 'Low', color: '#f97316', description: 'Rendah' },
  { min: 0, max: 20, label: 'Very Low', color: '#ef4444', description: 'Sangat Rendah' }
];

// Helper function to get score interpretation
export function getScoreInterpretation(score: number): ScoreRange {
  return SCORE_RANGES.find(range => score >= range.min && score <= range.max) || SCORE_RANGES[4];
}

// VIA Character Strengths categories
export const VIA_CATEGORIES = {
  'Wisdom & Knowledge': ['creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective'],
  'Courage': ['bravery', 'perseverance', 'honesty', 'zest'],
  'Humanity': ['love', 'kindness', 'socialIntelligence'],
  'Justice': ['teamwork', 'fairness', 'leadership'],
  'Temperance': ['forgiveness', 'humility', 'prudence', 'selfRegulation'],
  'Transcendence': ['appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality']
} as const;

// RIASEC descriptions
export const RIASEC_DESCRIPTIONS = {
  realistic: 'Praktis, hands-on, teknis',
  investigative: 'Analitis, penelitian, sains',
  artistic: 'Kreatif, ekspresif, inovatif',
  social: 'Membantu orang, interpersonal',
  enterprising: 'Kepemimpinan, persuasif, bisnis',
  conventional: 'Terorganisir, detail, administratif'
} as const;

// Big Five descriptions
export const OCEAN_DESCRIPTIONS = {
  openness: 'Keterbukaan terhadap pengalaman baru',
  conscientiousness: 'Kehati-hatian dan kedisiplinan',
  extraversion: 'Orientasi sosial dan energi',
  agreeableness: 'Keramahan dan kerjasama',
  neuroticism: 'Stabilitas emosional (skor tinggi = kurang stabil)'
} as const;
