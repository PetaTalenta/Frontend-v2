// Dummy data untuk menggantikan logika bisnis dan data dinamis
// File ini berisi data statis yang digunakan untuk UI display purposes

// Interface definitions berdasarkan penggunaan di komponen
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

export interface AssessmentScores {
  riasec: RiasecScores;
  ocean: OceanScores;
  viaIs: ViaScores;
  industryScore?: IndustryScores;
}

export interface IndustryScore {
  industry: string;
  displayName: string;
  score: number;
}

export interface IndustryScores {
  [key: string]: number;
}

export interface PersonaProfile {
  archetype: string;
  title?: string;
  shortSummary?: string;
  description?: string;
  riskTolerance?: 'high' | 'moderate' | 'low';
  strengths?: string[];
  strengthSummary?: string;
  weaknessSummary?: string;
  learningStyle?: string;
  coreMotivators?: string[];
  insights?: string[];
  roleModel?: Array<{ name: string; title?: string } | string>;
  careerRecommendation?: Array<{
    careerName: string;
    description?: string;
    justification?: string;
    matchPercentage?: number;
    careerProspect?: {
      industryGrowth: string;
      salaryPotential: string;
      jobAvailability: string;
    };
  }>;
  skillSuggestion?: string[];
  workEnvironment?: string;
  possiblePitfalls?: string[];
  developmentActivities?: {
    projectIdeas?: string[];
    extracurricular?: string[];
    bookRecommendations?: Array<{
      title: string;
      author: string;
      reason: string;
    }>;
  };
}

export interface AssessmentResult {
  id: string;
  is_public?: boolean;
  persona_profile?: PersonaProfile;
  assessment_data: {
    riasec: RiasecScores;
    ocean: OceanScores;
    viaIs: ViaScores;
    industryScore?: IndustryScores;
  };
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

// VIA Categories untuk radar chart
export const VIA_CATEGORIES = {
  'Wisdom & Knowledge': ['creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective'],
  'Courage': ['bravery', 'perseverance', 'honesty', 'zest'],
  'Humanity': ['love', 'kindness', 'socialIntelligence'],
  'Justice': ['teamwork', 'fairness', 'leadership'],
  'Temperance': ['forgiveness', 'humility', 'prudence', 'selfRegulation'],
  'Transcendence': ['appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality']
};

// Dummy Data Instances
export const dummyRiasecScores: RiasecScores = {
  realistic: 75,
  investigative: 85,
  artistic: 70,
  social: 80,
  enterprising: 65,
  conventional: 60
};

export const dummyOceanScores: OceanScores = {
  openness: 82,
  conscientiousness: 78,
  extraversion: 68,
  agreeableness: 85,
  neuroticism: 45
};

export const dummyViaScores: ViaScores = {
  creativity: 80,
  curiosity: 85,
  judgment: 75,
  loveOfLearning: 88,
  perspective: 82,
  bravery: 70,
  perseverance: 85,
  honesty: 90,
  zest: 75,
  love: 85,
  kindness: 88,
  socialIntelligence: 80,
  teamwork: 85,
  fairness: 82,
  leadership: 75,
  forgiveness: 78,
  humility: 70,
  prudence: 75,
  selfRegulation: 72,
  appreciationOfBeauty: 80,
  gratitude: 85,
  hope: 88,
  humor: 75,
  spirituality: 65
};

export const dummyIndustryScores: IndustryScores = {
  teknologi: 85,
  kesehatan: 78,
  keuangan: 72,
  pendidikan: 80,
  rekayasa: 82,
  pemasaran: 68,
  hukum: 65,
  kreatif: 75,
  media: 70,
  penjualan: 73,
  sains: 84,
  manufaktur: 60,
  agrikultur: 58,
  pemerintahan: 62,
  konsultasi: 76,
  pariwisata: 68,
  logistik: 70,
  energi: 74,
  sosial: 81,
  olahraga: 72,
  properti: 66,
  kuliner: 64,
  perdagangan: 71,
  telekomunikasi: 79
};

export const dummyPersonaProfile: PersonaProfile = {
  archetype: "The Innovator",
  title: "Creative Problem Solver",
  shortSummary: "You are a creative and analytical thinker who excels at finding innovative solutions to complex problems. Your combination of technical skills and creative vision makes you well-suited for roles that require both analytical thinking and creative problem-solving.",
  riskTolerance: "moderate",
  strengths: [
    "Creative problem-solving",
    "Analytical thinking",
    "Adaptability to change",
    "Strong communication skills",
    "Leadership potential"
  ],
  strengthSummary: "Your greatest strengths lie in your ability to combine analytical thinking with creative solutions. You excel at identifying patterns and opportunities that others might miss, and you have the communication skills to articulate your vision effectively.",
  weaknessSummary: "Areas for development include building patience with routine tasks and developing more structured approaches to project management. While your creative thinking is a strength, balancing it with systematic execution will enhance your effectiveness.",
  learningStyle: "You learn best through hands-on experimentation and visual demonstrations. You prefer to understand the 'why' behind concepts rather than just memorizing facts.",
  coreMotivators: [
    "Solving complex problems",
    "Creating innovative solutions",
    "Making a meaningful impact",
    "Continuous learning and growth"
  ],
  insights: [
    "Your combination of analytical and creative skills is rare and valuable",
    "Consider roles that allow you to work on diverse, challenging projects",
    "Your leadership potential can be developed through mentoring opportunities",
    "Balance your tendency to start new projects with finishing existing ones"
  ],
  roleModel: [
    { name: "Steve Jobs", title: "Co-founder of Apple" },
    { name: "Elon Musk", title: "CEO of Tesla and SpaceX" },
    { name: "Marie Curie", title: "Pioneering Scientist" }
  ],
  careerRecommendation: [
    {
      careerName: "Product Manager",
      description: "Lead product development from concept to launch",
      justification: "Combines analytical skills with creative vision and leadership",
      matchPercentage: 92,
      careerProspect: {
        industryGrowth: "High",
        salaryPotential: "Excellent",
        jobAvailability: "Good"
      }
    },
    {
      careerName: "UX Designer",
      description: "Design user experiences for digital products",
      justification: "Perfect blend of creativity, psychology, and technical skills",
      matchPercentage: 88,
      careerProspect: {
        industryGrowth: "Very High",
        salaryPotential: "Very Good",
        jobAvailability: "Excellent"
      }
    },
    {
      careerName: "Data Scientist",
      description: "Analyze complex data to generate insights",
      justification: "Leverages your analytical skills and pattern recognition abilities",
      matchPercentage: 85,
      careerProspect: {
        industryGrowth: "Exceptional",
        salaryPotential: "Outstanding",
        jobAvailability: "Excellent"
      }
    }
  ],
  skillSuggestion: [
    "Advanced data analysis techniques",
    "Project management methodologies",
    "Public speaking and presentation skills",
    "Strategic business thinking",
    "Cross-functional collaboration"
  ],
  workEnvironment: "You thrive in environments that encourage innovation, provide autonomy, and offer opportunities for continuous learning. Ideal workplaces include tech companies, research institutions, or innovative startups where creative thinking is valued.",
  possiblePitfalls: [
    "Tendency to lose interest in routine tasks",
    "Starting too many projects without completion",
    "Impatience with bureaucratic processes",
    "Overlooking details in favor of big-picture thinking"
  ],
  developmentActivities: {
    projectIdeas: [
      "Develop a mobile app that solves a community problem",
      "Create a data visualization project",
      "Start a blog or podcast about innovation in your field",
      "Volunteer for a nonprofit's technology needs"
    ],
    extracurricular: [
      "Join innovation or entrepreneurship clubs",
      "Participate in hackathons or design challenges",
      "Attend industry conferences and networking events",
      "Take online courses in emerging technologies"
    ],
    bookRecommendations: [
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        reason: "Provides insights into decision-making and cognitive biases that will enhance your analytical thinking"
      },
      {
        title: "The Innovator's Dilemma",
        author: "Clayton Christensen",
        reason: "Explains how disruptive innovation works and will help you understand market dynamics"
      },
      {
        title: "Creativity, Inc.",
        author: "Ed Catmull",
        reason: "Offers lessons on fostering creativity and managing innovative teams from Pixar's experience"
      }
    ]
  }
};

export const dummyAssessmentScores: AssessmentScores = {
  riasec: dummyRiasecScores,
  ocean: dummyOceanScores,
  viaIs: dummyViaScores,
  industryScore: dummyIndustryScores
};

export const dummyAssessmentResult: AssessmentResult = {
  id: "dummy-result-123",
  is_public: false,
  persona_profile: dummyPersonaProfile,
  assessment_data: {
    riasec: dummyRiasecScores,
    ocean: dummyOceanScores,
    viaIs: dummyViaScores,
    industryScore: dummyIndustryScores
  },
  created_at: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-15T10:30:00Z"
};

// Helper functions untuk mendapatkan data dummy
export const getDummyAssessmentScores = (): AssessmentScores => dummyAssessmentScores;
export const getDummyAssessmentResult = (): AssessmentResult => dummyAssessmentResult;
export const getDummyPersonaProfile = (): PersonaProfile => dummyPersonaProfile;

// Helper functions untuk interpretasi skor (sederhana)
export const getScoreInterpretation = (score: number) => {
  if (score >= 80) return { label: 'Very High', color: '#22c55e' };
  if (score >= 70) return { label: 'High', color: '#3b82f6' };
  if (score >= 60) return { label: 'Above Average', color: '#8b5cf6' };
  if (score >= 50) return { label: 'Average', color: '#f59e0b' };
  if (score >= 40) return { label: 'Below Average', color: '#f97316' };
  return { label: 'Low', color: '#ef4444' };
};

// Helper functions untuk RIASEC
export const getDominantRiasecType = (riasec: RiasecScores) => {
  const entries = Object.entries(riasec) as [keyof RiasecScores, number][];
  const sorted = entries.sort(([, a], [, b]) => b - a);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];
  const tertiary = sorted[2][0];
  
  return {
    primary,
    secondary,
    tertiary,
    code: `${primary[0].toUpperCase()}${secondary[0].toUpperCase()}${tertiary[0].toUpperCase()}`
  };
};

// Helper functions untuk VIA strengths
export const getTopViaStrengths = (via: ViaScores, count: number) => {
  const entries = Object.entries(via) as [keyof ViaScores, number][];
  return entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([strength, score]) => ({ strength, score, category: getViaCategory(strength) }));
};

const getViaCategory = (strength: keyof ViaScores): string => {
  for (const [category, strengths] of Object.entries(VIA_CATEGORIES)) {
    if (strengths.includes(strength)) {
      return category;
    }
  }
  return 'Other';
};

// Helper functions untuk industry compatibility
export const getTopIndustries = (industryScores: IndustryScores, count: number) => {
  const entries = Object.entries(industryScores);
  return entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([industry, score]) => ({
      industry,
      displayName: industry.charAt(0).toUpperCase() + industry.slice(1),
      score
    }));
};

export const getIndustryCompatibilityLevel = (score: number) => {
  if (score >= 80) return { level: 'Sangat Cocok', color: 'bg-green-100 text-green-800' };
  if (score >= 70) return { level: 'Cocok', color: 'bg-blue-100 text-blue-800' };
  if (score >= 60) return { level: 'Cukup Cocok', color: 'bg-yellow-100 text-yellow-800' };
  return { level: 'Kurang Cocok', color: 'bg-red-100 text-red-800' };
};