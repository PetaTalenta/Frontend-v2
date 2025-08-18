// AI-Driven Assessment Analysis Service
// Generates comprehensive personality analysis based on assessment scores using ATMA API

import { AssessmentScores, PersonaProfile, CareerRecommendation, CareerProspectLevel } from '../types/assessment-results';
import apiService from './apiService';
import {
  getAssessmentWebSocketService,
  AssessmentWebSocketEvent,
  isWebSocketSupported
} from './websocket-assessment';
// REMOVED: import { submitAssessmentForWebSocket } - function deleted to fix double token consumption

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
 * Generate comprehensive AI-driven personality profile using local analysis
 * FIXED: Removed API submission to prevent double token consumption
 * This function now only does local analysis based on scores
 */
export async function generateComprehensiveAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  console.log('Starting comprehensive analysis with local processing (FIXED: No API submission to prevent double token consumption)...');

  // Use local analysis instead of API submission to prevent double token consumption
  return await generateLocalAnalysis(scores);
}

/**
 * Monitor assessment completion using WebSocket with polling fallback
 * WebSocket provides real-time updates, polling only as last resort
 */
async function monitorWithWebSocket(jobId: string): Promise<any> {
  // Try WebSocket first for real-time monitoring
  if (isWebSocketSupported()) {
    try {
      console.log('Using WebSocket for real-time assessment monitoring...');
      return await monitorWithWebSocketConnection(jobId);
    } catch (wsError) {
      console.warn('WebSocket monitoring failed, falling back to polling:', wsError);
      // Fallback to polling only if WebSocket completely fails
      return await pollForCompletion(jobId);
    }
  } else {
    console.log('WebSocket not supported, using polling fallback...');
    return await pollForCompletion(jobId);
  }
}

/**
 * Monitor assessment using WebSocket connection
 */
async function monitorWithWebSocketConnection(jobId: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const wsService = getAssessmentWebSocketService();
    let isResolved = false;
    let timeoutId: NodeJS.Timeout;

    try {
      // Set timeout for WebSocket monitoring (2 minutes)
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error('WebSocket monitoring timeout - assessment took too long'));
        }
      }, 120000); // 2 minutes timeout

      // Set up WebSocket callbacks
      wsService.setCallbacks({
        onAssessmentEvent: async (event: AssessmentWebSocketEvent) => {
          if (event.jobId !== jobId || isResolved) return;

          console.log('AI Analysis: Received WebSocket event', event);

          if (event.type === 'analysis-complete' && event.resultId) {
            clearTimeout(timeoutId);
            isResolved = true;

            try {
              // Get the completed result
              const statusResponse = await apiService.getAssessmentStatus(jobId);
              if (statusResponse.success && statusResponse.data.result) {
                resolve(statusResponse.data.result);
              } else {
                reject(new Error('Failed to retrieve completed assessment result'));
              }
            } catch (error) {
              reject(error);
            }
          } else if (event.type === 'analysis-failed') {
            clearTimeout(timeoutId);
            isResolved = true;
            reject(new Error(event.error || 'Assessment analysis failed'));
          }
        },
        onError: (error) => {
          if (!isResolved) {
            clearTimeout(timeoutId);
            isResolved = true;
            reject(error);
          }
        }
      });

      // Connect to WebSocket if not already connected
      if (!wsService.isConnected()) {
        // Get token from localStorage or other auth source
        const token = localStorage.getItem('token') || '';
        if (!token) {
          throw new Error('No authentication token available for WebSocket connection');
        }
        await wsService.connect(token);
      }

      // Subscribe to job updates
      wsService.subscribeToJob(jobId);

      console.log(`AI Analysis: Subscribed to WebSocket updates for job ${jobId}`);

    } catch (error) {
      clearTimeout(timeoutId);
      if (!isResolved) {
        isResolved = true;
        reject(error);
      }
    }
  });
}

/**
 * Poll for assessment completion with enhanced token tracking (FALLBACK ONLY)
 * Only used when WebSocket is not available or fails
 */
async function pollForCompletion(jobId: string, maxAttempts: number = 60, interval: number = 2000): Promise<any> {
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

          // Return the API result structure - in a real implementation,
          // this would come from the API's archive endpoint
          const apiResult = {
            id: jobId,
            status: 'completed',
            persona_profile: {
              title: 'API-Generated Profile',
              description: 'This profile was generated by the ATMA API based on your assessment responses.',
              strengths: [
                'API-analyzed strength 1',
                'API-analyzed strength 2',
                'API-analyzed strength 3'
              ],
              recommendations: [
                'API-generated recommendation 1',
                'API-generated recommendation 2',
                'API-generated recommendation 3'
              ],
              careerRecommendation: [
                {
                  careerName: 'API-Recommended Career 1',
                  matchPercentage: 85,
                  description: 'Career recommended by API analysis',
                  careerProspect: {
                    jobAvailability: 'high' as CareerProspectLevel,
                    salaryPotential: 'high' as CareerProspectLevel,
                    careerProgression: 'high' as CareerProspectLevel,
                    industryGrowth: 'high' as CareerProspectLevel,
                    skillDevelopment: 'high' as CareerProspectLevel
                  }
                }
              ],
              roleModel: ['API Role Model 1', 'API Role Model 2']
            },
            tokenInfo
          };

          return apiResult;
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

  throw new Error('Assessment processing timeout - API analysis took longer than expected');
}

/**
 * Generate API-only analysis with proper error handling
 */
export async function generateApiOnlyAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  try {
    // FIXED: Use local analysis instead of API submission to prevent double token consumption
    // The API submission is already handled by the workflow, so we only need to generate the profile
    console.log('generateApiOnlyAnalysis: Using local analysis (FIXED: No API submission to prevent double token consumption)');
    return await generateLocalAnalysis(scores);
  } catch (error) {
    console.error('Local analysis failed:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Local analysis implementation
 * FIXED: Made public and used to prevent double token consumption
 */
export async function generateLocalAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  // Reduced processing delay for faster fallback
  await new Promise(resolve => setTimeout(resolve, 800));

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
    archetype: persona.title,
    shortSummary: persona.description,
    strengths,
    recommendations,
    careerRecommendation: careerRecommendations,
    roleModel: roleModels,
    // Legacy properties for backward compatibility
    title: persona.title,
    description: persona.description
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

  // Get high Big Five traits (> 60 for more inclusive matching)
  const highOceanTraits = Object.entries(ocean)
    .filter(([, score]) => score > 60)
    .map(([trait]) => trait);

  // Get top VIA strengths (> 70 for more inclusive matching)
  const topViaStrengths = Object.entries(viaIs)
    .filter(([, score]) => score > 70)
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
 * Generate persona based on trait analysis using scoring system
 */
function generatePersona(analysis: any) {
  // Calculate match scores for each persona type
  const scoredPersonas = PERSONA_TYPES.map(persona => {
    let score = 0;

    // RIASEC matching (primary weight)
    const primaryRiasecCode = analysis.primaryRiasec.charAt(0).toUpperCase();
    const secondaryRiasecCode = analysis.secondaryRiasec.charAt(0).toUpperCase();

    if (persona.riasecCodes.includes(primaryRiasecCode)) {
      score += 40; // Primary RIASEC match
    }
    if (persona.riasecCodes.includes(secondaryRiasecCode)) {
      score += 20; // Secondary RIASEC match
    }

    // OCEAN traits matching
    const oceanMatches = persona.oceanTraits.filter(trait =>
      analysis.highOceanTraits.includes(trait)
    );
    score += oceanMatches.length * 15; // 15 points per OCEAN match

    // VIA strengths matching
    const viaMatches = persona.viaStrengths.filter(strength =>
      analysis.topViaStrengths.includes(strength)
    );
    score += viaMatches.length * 10; // 10 points per VIA match

    return {
      ...persona,
      matchScore: score
    };
  });

  // Find the best matching persona
  const bestMatch = scoredPersonas.reduce((best, current) =>
    current.matchScore > best.matchScore ? current : best
  );

  // Log scoring for debugging (can be removed in production)
  console.log('Persona Matching Scores:', scoredPersonas.map(p => ({
    title: p.title,
    score: p.matchScore
  })));
  console.log('Best Match:', { title: bestMatch.title, score: bestMatch.matchScore });

  // Only use predefined persona if match score is above threshold
  if (bestMatch.matchScore >= 50) {
    return {
      title: bestMatch.title,
      description: bestMatch.description
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

  const riasecDescriptions: { [key: string]: string } = {
    realistic: 'hands-on dan berorientasi pada hasil nyata',
    investigative: 'analitis dan suka memecahkan masalah kompleks',
    artistic: 'kreatif dan inovatif dalam pendekatan',
    social: 'berorientasi pada hubungan dan membantu orang lain',
    enterprising: 'berorientasi pada kepemimpinan dan pencapaian',
    conventional: 'terorganisir dan detail-oriented'
  };

  const primaryTrait = riasecMap[analysis.primaryRiasec];
  const secondaryTrait = riasecMap[analysis.secondaryRiasec];

  const title = `The ${primaryTrait} ${secondaryTrait}`;

  const description = `Anda memiliki kombinasi unik dari kepribadian yang ${riasecDescriptions[analysis.primaryRiasec]} dan ${riasecDescriptions[analysis.secondaryRiasec]}. Profil kepribadian Anda menunjukkan keseimbangan yang menarik antara berbagai kekuatan yang dapat dikembangkan untuk mencapai potensi maksimal dalam karir dan kehidupan.`;

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
