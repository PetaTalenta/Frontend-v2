export interface OceanScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface ViaScores {
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

// Assessment Results API Types
export interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface TestData {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
}

export interface RoleModel {
  name: string;
  title: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
}

export interface DevelopmentActivities {
  extracurricular: string[];
  bookRecommendations: BookRecommendation[];
}

export interface CareerRecommendation {
  careerName: string;
  justification: string;
  firstSteps: string[];
  relatedMajors: string[];
  careerProspect: {
    growth: string;
    salary: string;
    demand: string;
  };
}

export interface TestResult {
  archetype: string;
  coreMotivators: string[];
  learningStyle: string;
  shortSummary: string;
  strengthSummary: string;
  strengths: string[];
  weaknessSummary: string;
  weaknesses: string[];
  careerRecommendation: CareerRecommendation[];
  insights: string[];
  skillSuggestion: string[];
  possiblePitfalls: string[];
  riskTolerance: string;
  workEnvironment: string;
  roleModel: RoleModel[];
  developmentActivities: DevelopmentActivities;
}

export interface AssessmentResultData {
  id: string;
  user_id: string;
  test_data: TestData;
  test_result: TestResult;
  status: 'completed' | 'pending' | 'failed';
  error_message: string | null;
  assessment_name: string;
  is_public: boolean;
  chatbot_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResultResponse {
  success: boolean;
  data: AssessmentResultData;
}

// Utility types for data transformation
export type AssessmentResultTransformed = Omit<AssessmentResultData, 'test_data' | 'test_result'> & {
  test_data: {
    riasec: RiasecScores & { total?: number };
    ocean: OceanScores & { total?: number };
    viaIs: ViaScores & { total?: number };
  };
  test_result: TestResult & {
    careerCount?: number;
    strengthCount?: number;
    weaknessCount?: number;
    insightCount?: number;
  };
};

// Error types for assessment results
export interface AssessmentResultError {
  code: string;
  message: string;
  details?: any;
}

// Query options types
export interface UseAssessmentResultOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  retryDelay?: number;
}

// Transformation function types
export type TransformAssessmentResultFn = (data: AssessmentResultData) => AssessmentResultTransformed;
export type TransformCareerDataFn = (data: CareerRecommendation[]) => CareerRecommendation[];
export type TransformPersonaDataFn = (data: TestResult) => TestResult;
export type TransformScoresDataFn = (data: TestData) => TestData;