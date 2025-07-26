// AI-Driven Assessment Analysis Service
// Generates comprehensive personality analysis based on assessment scores using ATMA API

import { AssessmentScores, PersonaProfile, CareerRecommendation, CareerProspectLevel } from '../types/assessment-results';
import apiService from './apiService';

// Persona type definitions based on trait combinations
interface PersonaType {
  id: string;
  title: string;
  description: string;
  primaryTraits: string[];
  secondaryTraits: string[];
  riasecCodes: string[];
  oceanTraits: string[];
  viaStrengths: string[];
}

// Career data with RIASEC mappings and market prospects
interface CareerData {
  name: string;
  riasecCodes: string[];
  requiredTraits: string[];
  description: string;
  prospects: {
    jobAvailability: CareerProspectLevel;
    salaryPotential: CareerProspectLevel;
    careerProgression: CareerProspectLevel;
    industryGrowth: CareerProspectLevel;
    skillDevelopment: CareerProspectLevel;
  };
}

// Role model data categorized by personality types
interface RoleModelData {
  name: string;
  traits: string[];
  riasecCodes: string[];
  description: string;
}

// Persona types database
const PERSONA_TYPES: PersonaType[] = [
  {
    id: 'creative-investigator',
    title: 'The Creative Investigator',
    description: 'Anda adalah seorang pemikir kreatif yang memiliki keingintahuan tinggi dan kemampuan analitis yang kuat. Anda cenderung menyukai tantangan intelektual dan senang mengeksplorasi ide-ide baru dengan pendekatan yang inovatif.',
    primaryTraits: ['investigative', 'artistic'],
    secondaryTraits: ['openness', 'creativity'],
    riasecCodes: ['I', 'A'],
    oceanTraits: ['openness'],
    viaStrengths: ['creativity', 'curiosity', 'loveOfLearning']
  },
  {
    id: 'inspiring-leader',
    title: 'The Inspiring Leader',
    description: 'Anda adalah seorang pemimpin natural yang memiliki kemampuan luar biasa dalam memotivasi dan menginspirasi orang lain. Dengan kecerdasan sosial yang tinggi dan kemampuan komunikasi yang excellent, Anda cocok untuk peran kepemimpinan.',
    primaryTraits: ['social', 'enterprising'],
    secondaryTraits: ['extraversion', 'agreeableness'],
    riasecCodes: ['S', 'E'],
    oceanTraits: ['extraversion', 'agreeableness'],
    viaStrengths: ['leadership', 'socialIntelligence', 'teamwork']
  },
  {
    id: 'innovative-builder',
    title: 'The Innovative Builder',
    description: 'Anda adalah seorang inovator yang memiliki kemampuan untuk mengubah ide menjadi kenyataan. Anda menggabungkan kreativitas dengan kemampuan praktis untuk menciptakan solusi yang berdampak nyata.',
    primaryTraits: ['realistic', 'artistic'],
    secondaryTraits: ['conscientiousness', 'perseverance'],
    riasecCodes: ['R', 'A'],
    oceanTraits: ['conscientiousness'],
    viaStrengths: ['creativity', 'perseverance', 'zest']
  },
  {
    id: 'strategic-organizer',
    title: 'The Strategic Organizer',
    description: 'Anda adalah seorang perencana strategis yang memiliki kemampuan luar biasa dalam mengorganisir dan mengelola sistem yang kompleks. Anda cenderung detail-oriented dan memiliki kemampuan analitis yang kuat.',
    primaryTraits: ['conventional', 'investigative'],
    secondaryTraits: ['conscientiousness', 'judgment'],
    riasecCodes: ['C', 'I'],
    oceanTraits: ['conscientiousness'],
    viaStrengths: ['judgment', 'prudence', 'selfRegulation']
  },
  {
    id: 'entrepreneurial-visionary',
    title: 'The Entrepreneurial Visionary',
    description: 'Anda adalah seorang visioner yang memiliki kemampuan untuk melihat peluang dan mengambil risiko yang diperhitungkan. Anda memiliki drive yang kuat untuk menciptakan perubahan dan memimpin inovasi.',
    primaryTraits: ['enterprising', 'artistic'],
    secondaryTraits: ['extraversion', 'openness'],
    riasecCodes: ['E', 'A'],
    oceanTraits: ['extraversion', 'openness'],
    viaStrengths: ['leadership', 'creativity', 'bravery']
  },
  {
    id: 'compassionate-helper',
    title: 'The Compassionate Helper',
    description: 'Anda adalah seorang yang memiliki empati tinggi dan dedikasi untuk membantu orang lain. Anda memiliki kemampuan untuk memahami kebutuhan orang lain dan memberikan dukungan yang bermakna.',
    primaryTraits: ['social', 'conventional'],
    secondaryTraits: ['agreeableness', 'kindness'],
    riasecCodes: ['S', 'C'],
    oceanTraits: ['agreeableness'],
    viaStrengths: ['kindness', 'love', 'fairness']
  }
];

// Career database with RIASEC mappings
const CAREER_DATABASE: CareerData[] = [
  {
    name: 'Data Scientist',
    riasecCodes: ['I', 'A'],
    requiredTraits: ['curiosity', 'creativity', 'judgment'],
    description: 'Menggabungkan kemampuan analitis dengan kreativitas untuk mengekstrak insights dari data',
    prospects: {
      jobAvailability: 'super high',
      salaryPotential: 'super high',
      careerProgression: 'high',
      industryGrowth: 'super high',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'UX/UI Designer',
    riasecCodes: ['A', 'I'],
    requiredTraits: ['creativity', 'socialIntelligence', 'appreciationOfBeauty'],
    description: 'Menggabungkan kreativitas dengan pemahaman mendalam tentang perilaku pengguna',
    prospects: {
      jobAvailability: 'high',
      salaryPotential: 'high',
      careerProgression: 'high',
      industryGrowth: 'high',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'Product Manager',
    riasecCodes: ['E', 'I'],
    requiredTraits: ['leadership', 'judgment', 'socialIntelligence'],
    description: 'Memimpin pengembangan produk dengan pendekatan analitis dan strategis',
    prospects: {
      jobAvailability: 'high',
      salaryPotential: 'super high',
      careerProgression: 'super high',
      industryGrowth: 'high',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'Software Engineer',
    riasecCodes: ['I', 'R'],
    requiredTraits: ['curiosity', 'perseverance', 'judgment'],
    description: 'Mengembangkan solusi teknologi dengan pendekatan sistematis dan inovatif',
    prospects: {
      jobAvailability: 'super high',
      salaryPotential: 'high',
      careerProgression: 'high',
      industryGrowth: 'super high',
      skillDevelopment: 'super high'
    }
  },
  {
    name: 'Marketing Manager',
    riasecCodes: ['E', 'A'],
    requiredTraits: ['creativity', 'socialIntelligence', 'leadership'],
    description: 'Mengembangkan strategi pemasaran kreatif dan memimpin tim marketing',
    prospects: {
      jobAvailability: 'high',
      salaryPotential: 'high',
      careerProgression: 'high',
      industryGrowth: 'high',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'Human Resources Manager',
    riasecCodes: ['S', 'E'],
    requiredTraits: ['socialIntelligence', 'kindness', 'fairness'],
    description: 'Mengelola dan mengembangkan talenta dalam organisasi',
    prospects: {
      jobAvailability: 'high',
      salaryPotential: 'high',
      careerProgression: 'high',
      industryGrowth: 'moderate',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'Financial Analyst',
    riasecCodes: ['C', 'I'],
    requiredTraits: ['judgment', 'prudence', 'selfRegulation'],
    description: 'Menganalisis data keuangan dan memberikan rekomendasi investasi',
    prospects: {
      jobAvailability: 'high',
      salaryPotential: 'high',
      careerProgression: 'high',
      industryGrowth: 'moderate',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'Graphic Designer',
    riasecCodes: ['A', 'R'],
    requiredTraits: ['creativity', 'appreciationOfBeauty', 'perseverance'],
    description: 'Menciptakan desain visual yang menarik dan komunikatif',
    prospects: {
      jobAvailability: 'moderate',
      salaryPotential: 'moderate',
      careerProgression: 'moderate',
      industryGrowth: 'high',
      skillDevelopment: 'high'
    }
  },
  {
    name: 'Management Consultant',
    riasecCodes: ['E', 'I'],
    requiredTraits: ['judgment', 'leadership', 'socialIntelligence'],
    description: 'Memberikan solusi strategis untuk meningkatkan kinerja organisasi',
    prospects: {
      jobAvailability: 'high',
      salaryPotential: 'super high',
      careerProgression: 'super high',
      industryGrowth: 'high',
      skillDevelopment: 'super high'
    }
  },
  {
    name: 'Social Worker',
    riasecCodes: ['S', 'I'],
    requiredTraits: ['kindness', 'socialIntelligence', 'love'],
    description: 'Membantu individu dan komunitas mengatasi tantangan sosial',
    prospects: {
      jobAvailability: 'moderate',
      salaryPotential: 'moderate',
      careerProgression: 'moderate',
      industryGrowth: 'high',
      skillDevelopment: 'high'
    }
  }
];

// Role model database
const ROLE_MODELS: RoleModelData[] = [
  { name: 'Steve Jobs', traits: ['creativity', 'leadership', 'bravery'], riasecCodes: ['E', 'A'], description: 'Visionary entrepreneur' },
  { name: 'Marie Curie', traits: ['curiosity', 'perseverance', 'bravery'], riasecCodes: ['I', 'R'], description: 'Pioneering scientist' },
  { name: 'Leonardo da Vinci', traits: ['creativity', 'curiosity', 'appreciationOfBeauty'], riasecCodes: ['A', 'I'], description: 'Renaissance polymath' },
  { name: 'Elon Musk', traits: ['creativity', 'bravery', 'perseverance'], riasecCodes: ['E', 'I'], description: 'Innovative entrepreneur' },
  { name: 'Oprah Winfrey', traits: ['socialIntelligence', 'kindness', 'leadership'], riasecCodes: ['S', 'E'], description: 'Media leader and philanthropist' },
  { name: 'Albert Einstein', traits: ['curiosity', 'creativity', 'judgment'], riasecCodes: ['I', 'A'], description: 'Theoretical physicist' },
  { name: 'Maya Angelou', traits: ['creativity', 'love', 'perspective'], riasecCodes: ['A', 'S'], description: 'Poet and civil rights activist' },
  { name: 'Warren Buffett', traits: ['judgment', 'prudence', 'perspective'], riasecCodes: ['C', 'I'], description: 'Investment strategist' },
  { name: 'Nelson Mandela', traits: ['forgiveness', 'leadership', 'bravery'], riasecCodes: ['S', 'E'], description: 'Political leader and activist' },
  { name: 'Tim Cook', traits: ['leadership', 'prudence', 'teamwork'], riasecCodes: ['E', 'C'], description: 'Technology executive' }
];

/**
 * Analyze assessment scores and generate comprehensive AI-driven personality profile using ATMA API
 */
export async function generateComprehensiveAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  try {
    console.log('Starting comprehensive analysis with API integration...');

    // Prepare assessment data for API submission
    const assessmentData = {
      assessmentName: "AI-Driven Talent Mapping",
      riasec: scores.riasec,
      ocean: scores.ocean,
      viaIs: scores.viaIs
    };

    console.log('Submitting assessment data to API...');

    // Submit assessment to API (token deduction happens here)
    const submissionResponse = await apiService.submitAssessment(assessmentData);

    if (!submissionResponse.success) {
      // Handle specific token-related errors
      if (submissionResponse.error?.code === 'INSUFFICIENT_TOKENS') {
        console.warn('Insufficient tokens for API analysis, falling back to local analysis');
        throw new Error(`Insufficient tokens: ${submissionResponse.error.message}`);
      }

      throw new Error(submissionResponse.error?.message || 'Failed to submit assessment');
    }

    const jobId = submissionResponse.data.jobId;
    const tokenInfo = submissionResponse.data.tokenInfo;

    console.log('Assessment submitted successfully:', {
      jobId,
      tokenInfo: tokenInfo ? {
        tokensDeducted: tokenInfo.tokensDeducted,
        newBalance: tokenInfo.newBalance
      } : 'No token info'
    });

    // Poll for completion
    console.log('Polling for assessment completion...');
    const result = await pollForCompletion(jobId);

    // Extract persona profile from result
    if (result.persona_profile) {
      console.log('API analysis completed successfully');
      return result.persona_profile;
    }

    throw new Error('No persona profile found in assessment result');

  } catch (error) {
    console.error('API analysis failed, falling back to local analysis:', error);

    // Fallback to local analysis if API fails
    return generateLocalAnalysis(scores);
  }
}

/**
 * Poll for assessment completion with enhanced token tracking
 */
async function pollForCompletion(jobId: string, maxAttempts: number = 30, interval: number = 2000): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for job ${jobId}`);

      const statusResponse = await apiService.getAssessmentStatus(jobId);

      if (statusResponse.success) {
        const { status, tokenInfo } = statusResponse.data;

        // Log token information if available
        if (tokenInfo) {
          console.log('Token transaction info:', {
            tokensDeducted: tokenInfo.tokensDeducted,
            completionBonus: tokenInfo.completionBonus,
            finalBalance: tokenInfo.finalBalance
          });
        }

        if (status === 'completed') {
          console.log(`Assessment ${jobId} completed successfully`);

          // For mock API, generate a mock result since we don't have archive endpoint
          const mockResult = {
            id: jobId,
            status: 'completed',
            persona_profile: await generateLocalAnalysis({
              riasec: { realistic: 75, investigative: 60, artistic: 45, social: 80, enterprising: 70, conventional: 55 },
              ocean: { openness: 75, conscientiousness: 80, extraversion: 65, agreeableness: 85, neuroticism: 35 },
              viaIs: { creativity: 80, curiosity: 75, judgment: 70, love_of_learning: 85, perspective: 75, honesty: 80, bravery: 70, perseverance: 75, zest: 65, love: 90, kindness: 85, social_intelligence: 80, teamwork: 85, fairness: 80, leadership: 75, forgiveness: 70, humility: 75, prudence: 80, self_regulation: 75, appreciation_of_beauty: 70, gratitude: 85, hope: 80, humor: 70, spirituality: 60 }
            }),
            tokenInfo
          };

          return mockResult;
        } else if (status === 'failed') {
          throw new Error('Assessment processing failed');
        }

        console.log(`Assessment ${jobId} still processing (status: ${status})`);
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, interval));
      } else {
        throw new Error('Failed to check assessment status');
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);

      if (attempt === maxAttempts - 1) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw new Error('Assessment processing timeout');
}

/**
 * Fallback local analysis (original implementation)
 */
async function generateLocalAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Analyze dominant traits
  const analysis = analyzeTraits(scores);

  // Generate persona
  const persona = generatePersona(analysis);

  // Generate strengths
  const strengths = generateStrengths(analysis, scores);

  // Generate recommendations
  const recommendations = generateRecommendations(analysis, scores);

  // Generate career recommendations
  const careerRecommendations = generateCareerRecommendations(analysis, scores);

  // Generate role models
  const roleModels = generateRoleModels(analysis);

  return {
    title: persona.title,
    description: persona.description,
    strengths,
    recommendations,
    careerRecommendation: careerRecommendations,
    roleModel: roleModels
  };
}

/**
 * Analyze traits from assessment scores
 */
function analyzeTraits(scores: AssessmentScores) {
  const { riasec, ocean, viaIs } = scores;

  // Get dominant RIASEC types
  const riasecEntries = Object.entries(riasec).sort(([,a], [,b]) => b - a);
  const primaryRiasec = riasecEntries[0][0];
  const secondaryRiasec = riasecEntries[1][0];

  // Get high Big Five traits (> 70)
  const highOceanTraits = Object.entries(ocean)
    .filter(([, score]) => score > 70)
    .map(([trait]) => trait);

  // Get top VIA strengths (> 75)
  const topViaStrengths = Object.entries(viaIs)
    .filter(([, score]) => score > 75)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([strength]) => strength);

  return {
    primaryRiasec,
    secondaryRiasec,
    highOceanTraits,
    topViaStrengths,
    riasecScores: riasec,
    oceanScores: ocean,
    viaScores: viaIs
  };
}

/**
 * Generate persona based on trait analysis
 */
function generatePersona(analysis: any) {
  // Find matching persona type
  const matchingPersona = PERSONA_TYPES.find(persona => {
    const riasecMatch = persona.riasecCodes.includes(analysis.primaryRiasec.charAt(0).toUpperCase()) ||
                       persona.riasecCodes.includes(analysis.secondaryRiasec.charAt(0).toUpperCase());
    const oceanMatch = persona.oceanTraits.some(trait => analysis.highOceanTraits.includes(trait));
    const viaMatch = persona.viaStrengths.some(strength => analysis.topViaStrengths.includes(strength));
    
    return riasecMatch && (oceanMatch || viaMatch);
  });

  if (matchingPersona) {
    return {
      title: matchingPersona.title,
      description: matchingPersona.description
    };
  }

  // Fallback: generate custom persona
  return generateCustomPersona(analysis);
}

/**
 * Generate custom persona for unique trait combinations
 */
function generateCustomPersona(analysis: any) {
  const riasecMap: { [key: string]: string } = {
    realistic: 'Praktis',
    investigative: 'Analitis',
    artistic: 'Kreatif',
    social: 'Sosial',
    enterprising: 'Enterprising',
    conventional: 'Terorganisir'
  };

  const title = `The ${riasecMap[analysis.primaryRiasec]} ${riasecMap[analysis.secondaryRiasec]}`;
  const description = `Anda memiliki kombinasi unik dari sifat ${riasecMap[analysis.primaryRiasec].toLowerCase()} dan ${riasecMap[analysis.secondaryRiasec].toLowerCase()}. Profil kepribadian Anda menunjukkan keseimbangan yang menarik antara berbagai kekuatan yang dapat dikembangkan untuk mencapai potensi maksimal.`;

  return { title, description };
}

/**
 * Generate strengths based on trait analysis
 */
function generateStrengths(analysis: any, scores: AssessmentScores): string[] {
  const strengths: string[] = [];

  // Add RIASEC-based strengths
  const riasecStrengths: { [key: string]: string } = {
    realistic: 'Kemampuan praktis dan hands-on yang kuat',
    investigative: 'Kemampuan analitis dan investigatif yang mendalam',
    artistic: 'Kreativitas dan inovasi yang tinggi',
    social: 'Kecerdasan sosial dan empati yang luar biasa',
    enterprising: 'Kemampuan kepemimpinan dan motivasi yang kuat',
    conventional: 'Kemampuan organisasi dan manajemen yang excellent'
  };

  strengths.push(riasecStrengths[analysis.primaryRiasec]);
  if (analysis.riasecScores[analysis.secondaryRiasec] > 70) {
    strengths.push(riasecStrengths[analysis.secondaryRiasec]);
  }

  // Add Big Five-based strengths
  const oceanStrengths: { [key: string]: string } = {
    openness: 'Keterbukaan terhadap pengalaman dan ide baru',
    conscientiousness: 'Kedisiplinan dan tanggung jawab yang tinggi',
    extraversion: 'Kemampuan komunikasi dan networking yang excellent',
    agreeableness: 'Kemampuan bekerja sama dan empati yang tinggi',
    neuroticism: 'Stabilitas emosional dan ketahanan terhadap stress'
  };

  analysis.highOceanTraits.forEach((trait: string) => {
    if (trait !== 'neuroticism' || scores.ocean.neuroticism < 30) {
      strengths.push(oceanStrengths[trait]);
    }
  });

  // Add VIA-based strengths
  const viaStrengthsMap: { [key: string]: string } = {
    creativity: 'Kemampuan berpikir kreatif dan inovatif',
    curiosity: 'Keingintahuan dan semangat belajar yang tinggi',
    judgment: 'Kemampuan pengambilan keputusan yang bijaksana',
    loveOfLearning: 'Passion untuk pembelajaran berkelanjutan',
    perspective: 'Kemampuan melihat gambaran besar dan memberikan nasihat bijak',
    bravery: 'Keberanian dalam menghadapi tantangan',
    perseverance: 'Ketekunan dan daya tahan yang luar biasa',
    honesty: 'Integritas dan kejujuran yang tinggi',
    zest: 'Antusiasme dan energi yang menular',
    love: 'Kemampuan membangun hubungan yang bermakna',
    kindness: 'Kebaikan hati dan kepedulian terhadap orang lain',
    socialIntelligence: 'Pemahaman mendalam tentang dinamika sosial',
    teamwork: 'Kemampuan bekerja dalam tim yang luar biasa',
    fairness: 'Komitmen terhadap keadilan dan kesetaraan',
    leadership: 'Kemampuan memimpin dan menginspirasi orang lain',
    forgiveness: 'Kemampuan memaafkan dan move on',
    humility: 'Kerendahan hati dan kesadaran diri yang baik',
    prudence: 'Kehati-hatian dan pertimbangan yang matang',
    selfRegulation: 'Kemampuan mengatur diri dan emosi',
    appreciationOfBeauty: 'Apresiasi terhadap keindahan dan excellence',
    gratitude: 'Rasa syukur dan apresiasi yang mendalam',
    hope: 'Optimisme dan visi masa depan yang positif',
    humor: 'Kemampuan humor dan membawa kegembiraan',
    spirituality: 'Pencarian makna dan tujuan hidup yang mendalam'
  };

  analysis.topViaStrengths.slice(0, 3).forEach((strength: string) => {
    if (viaStrengthsMap[strength]) {
      strengths.push(viaStrengthsMap[strength]);
    }
  });

  return strengths.slice(0, 5); // Return top 5 strengths
}

/**
 * Generate development recommendations
 */
function generateRecommendations(analysis: any, scores: AssessmentScores): string[] {
  const recommendations: string[] = [];

  // Analyze growth areas (lower scores)
  const riasecGrowthAreas = Object.entries(scores.riasec)
    .filter(([, score]) => score < 50)
    .sort(([,a], [,b]) => a - b)
    .slice(0, 2);

  const oceanGrowthAreas = Object.entries(scores.ocean)
    .filter(([trait, score]) => {
      if (trait === 'neuroticism') return score > 60; // High neuroticism is a growth area
      return score < 50;
    })
    .slice(0, 2);

  // Generate RIASEC-based recommendations
  const riasecRecommendations: { [key: string]: string } = {
    realistic: 'Kembangkan kemampuan praktis melalui hands-on experience dan proyek nyata',
    investigative: 'Tingkatkan kemampuan analitis melalui penelitian dan problem-solving yang kompleks',
    artistic: 'Eksplorasi kreativitas melalui seni, desain, atau proyek inovatif',
    social: 'Kembangkan kemampuan interpersonal melalui volunteer work atau team leadership',
    enterprising: 'Tingkatkan kemampuan leadership melalui public speaking dan project management',
    conventional: 'Kembangkan kemampuan organisasi melalui sistem manajemen dan planning'
  };

  riasecGrowthAreas.forEach(([trait]) => {
    recommendations.push(riasecRecommendations[trait]);
  });

  // Generate Big Five-based recommendations
  const oceanRecommendations: { [key: string]: string } = {
    openness: 'Eksplorasi pengalaman baru dan pelajari hal-hal di luar comfort zone Anda',
    conscientiousness: 'Kembangkan kebiasaan yang lebih terstruktur dan goal-oriented',
    extraversion: 'Tingkatkan kemampuan networking dan public speaking',
    agreeableness: 'Kembangkan empati dan kemampuan kolaborasi yang lebih baik',
    neuroticism: 'Pelajari teknik stress management dan emotional regulation'
  };

  oceanGrowthAreas.forEach(([trait]) => {
    recommendations.push(oceanRecommendations[trait]);
  });

  // Add general career development recommendations
  recommendations.push('Pertimbangkan mentorship atau coaching untuk accelerated growth');
  recommendations.push('Manfaatkan kekuatan utama Anda untuk membangun personal brand yang kuat');

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Generate career recommendations based on trait analysis
 */
function generateCareerRecommendations(analysis: any, scores: AssessmentScores): CareerRecommendation[] {
  const recommendations: CareerRecommendation[] = [];

  // Score careers based on trait match
  const scoredCareers = CAREER_DATABASE.map(career => {
    let matchScore = 0;

    // RIASEC match (40% weight)
    const primaryRiasecCode = analysis.primaryRiasec.charAt(0).toUpperCase();
    const secondaryRiasecCode = analysis.secondaryRiasec.charAt(0).toUpperCase();

    if (career.riasecCodes.includes(primaryRiasecCode)) matchScore += 40;
    if (career.riasecCodes.includes(secondaryRiasecCode)) matchScore += 20;

    // VIA strengths match (40% weight)
    const matchingTraits = career.requiredTraits.filter(trait =>
      analysis.topViaStrengths.includes(trait)
    );
    matchScore += (matchingTraits.length / career.requiredTraits.length) * 40;

    return {
      ...career,
      matchPercentage: Math.min(Math.round(matchScore), 95) // Cap at 95%
    };
  });

  // Sort by match score and take top 3
  const topCareers = scoredCareers
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 3);

  return topCareers.map(career => ({
    careerName: career.name,
    careerProspect: career.prospects,
    description: career.description,
    matchPercentage: career.matchPercentage
  }));
}

/**
 * Generate role models based on trait analysis
 */
function generateRoleModels(analysis: any): string[] {
  const primaryRiasecCode = analysis.primaryRiasec.charAt(0).toUpperCase();
  const secondaryRiasecCode = analysis.secondaryRiasec.charAt(0).toUpperCase();

  // Find role models that match traits
  const matchingRoleModels = ROLE_MODELS.filter(roleModel => {
    const riasecMatch = roleModel.riasecCodes.includes(primaryRiasecCode) ||
                       roleModel.riasecCodes.includes(secondaryRiasecCode);
    const traitMatch = roleModel.traits.some(trait =>
      analysis.topViaStrengths.includes(trait)
    );

    return riasecMatch || traitMatch;
  });

  // If we have matches, return them; otherwise return a diverse set
  if (matchingRoleModels.length >= 3) {
    return matchingRoleModels.slice(0, 4).map(rm => rm.name);
  }

  // Fallback: return a diverse set based on primary trait
  const fallbackRoleModels: { [key: string]: string[] } = {
    realistic: ['Elon Musk', 'Marie Curie', 'Tim Cook', 'Steve Wozniak'],
    investigative: ['Albert Einstein', 'Marie Curie', 'Stephen Hawking', 'Ada Lovelace'],
    artistic: ['Steve Jobs', 'Leonardo da Vinci', 'Maya Angelou', 'Walt Disney'],
    social: ['Oprah Winfrey', 'Nelson Mandela', 'Mother Teresa', 'Barack Obama'],
    enterprising: ['Steve Jobs', 'Elon Musk', 'Richard Branson', 'Sheryl Sandberg'],
    conventional: ['Warren Buffett', 'Tim Cook', 'Bill Gates', 'Indra Nooyi']
  };

  return fallbackRoleModels[analysis.primaryRiasec] || ['Steve Jobs', 'Marie Curie', 'Nelson Mandela', 'Leonardo da Vinci'];
}
