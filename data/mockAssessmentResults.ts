// Mock Assessment Results Data
// For testing and demonstration purposes

import { AssessmentResult } from '../types/assessment-results';

export const mockAssessmentResults: AssessmentResult[] = [
  {
    id: 'result-001',
    userId: 'user-123',
    createdAt: '2024-01-15T10:30:00Z',
    status: 'completed',
    assessment_data: {
      riasec: {
        realistic: 45,
        investigative: 85,
        artistic: 72,
        social: 38,
        enterprising: 65,
        conventional: 42
      },
      ocean: {
        openness: 88,
        conscientiousness: 67,
        extraversion: 45,
        agreeableness: 72,
        neuroticism: 25
      },
      viaIs: {
        // Wisdom & Knowledge
        creativity: 92,
        curiosity: 89,
        judgment: 78,
        loveOfLearning: 85,
        perspective: 74,
        
        // Courage
        bravery: 65,
        perseverance: 82,
        honesty: 88,
        zest: 58,
        
        // Humanity
        love: 76,
        kindness: 84,
        socialIntelligence: 69,
        
        // Justice
        teamwork: 71,
        fairness: 86,
        leadership: 63,
        
        // Temperance
        forgiveness: 79,
        humility: 72,
        prudence: 68,
        selfRegulation: 75,
        
        // Transcendence
        appreciationOfBeauty: 91,
        gratitude: 83,
        hope: 77,
        humor: 64,
        spirituality: 52
      }
    },
    persona_profile: {
      title: 'The Creative Investigator',
      description: 'Anda adalah seorang pemikir kreatif yang memiliki keingintahuan tinggi dan kemampuan analitis yang kuat. Anda cenderung menyukai tantangan intelektual dan senang mengeksplorasi ide-ide baru. Dengan kombinasi kreativitas tinggi dan kemampuan investigatif yang excellent, Anda cocok untuk peran yang membutuhkan inovasi dan penelitian mendalam.',
      strengths: [
        'Kreativitas dan inovasi tinggi',
        'Kemampuan analitis dan investigatif yang kuat',
        'Keterbukaan terhadap pengalaman baru',
        'Kemampuan belajar yang tinggi',
        'Apresiasi terhadap keindahan dan estetika'
      ],
      recommendations: [
        'Pertimbangkan karir di bidang research & development',
        'Eksplorasi peluang di industri kreatif yang berbasis teknologi',
        'Kembangkan kemampuan leadership untuk memimpin tim inovatif',
        'Manfaatkan kemampuan analitis untuk memecahkan masalah kompleks',
        'Pertimbangkan peran yang menggabungkan seni dan sains'
      ],
      careerRecommendation: [
        {
          careerName: 'Data Scientist',
          careerProspect: {
            jobAvailability: 'super high',
            salaryPotential: 'super high',
            careerProgression: 'high',
            industryGrowth: 'super high',
            skillDevelopment: 'high'
          },
          description: 'Menggabungkan kemampuan analitis dengan kreativitas untuk mengekstrak insights dari data',
          matchPercentage: 92
        },
        {
          careerName: 'UX/UI Designer',
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'high',
            careerProgression: 'high',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          },
          description: 'Menggabungkan kreativitas dengan pemahaman mendalam tentang perilaku pengguna',
          matchPercentage: 88
        },
        {
          careerName: 'Product Manager',
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'super high',
            careerProgression: 'super high',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          },
          description: 'Memimpin pengembangan produk dengan pendekatan analitis dan kreatif',
          matchPercentage: 85
        }
      ],
      roleModel: ['Steve Jobs', 'Marie Curie', 'Leonardo da Vinci', 'Elon Musk']
    }
  },
  {
    id: 'result-002',
    userId: 'user-456',
    createdAt: '2024-01-16T14:20:00Z',
    status: 'completed',
    assessment_data: {
      riasec: {
        realistic: 32,
        investigative: 58,
        artistic: 45,
        social: 89,
        enterprising: 76,
        conventional: 38
      },
      ocean: {
        openness: 72,
        conscientiousness: 84,
        extraversion: 91,
        agreeableness: 88,
        neuroticism: 18
      },
      viaIs: {
        // Wisdom & Knowledge
        creativity: 68,
        curiosity: 75,
        judgment: 82,
        loveOfLearning: 79,
        perspective: 86,
        
        // Courage
        bravery: 78,
        perseverance: 89,
        honesty: 92,
        zest: 85,
        
        // Humanity
        love: 94,
        kindness: 91,
        socialIntelligence: 88,
        
        // Justice
        teamwork: 93,
        fairness: 89,
        leadership: 87,
        
        // Temperance
        forgiveness: 86,
        humility: 83,
        prudence: 78,
        selfRegulation: 81,
        
        // Transcendence
        appreciationOfBeauty: 74,
        gratitude: 92,
        hope: 89,
        humor: 82,
        spirituality: 76
      }
    },
    persona_profile: {
      title: 'The Inspiring Leader',
      description: 'Anda adalah seorang pemimpin natural yang memiliki kemampuan luar biasa dalam memotivasi dan menginspirasi orang lain. Dengan kombinasi kecerdasan sosial yang tinggi, empati yang kuat, dan kemampuan komunikasi yang excellent, Anda cocok untuk peran kepemimpinan yang berfokus pada pengembangan tim dan organisasi.',
      strengths: [
        'Kemampuan kepemimpinan dan motivasi yang kuat',
        'Kecerdasan sosial dan empati tinggi',
        'Kemampuan komunikasi dan networking yang excellent',
        'Integritas dan kejujuran yang tinggi',
        'Kemampuan bekerja dalam tim yang luar biasa'
      ],
      recommendations: [
        'Pertimbangkan peran kepemimpinan di organisasi atau perusahaan',
        'Eksplorasi karir di bidang human resources atau organizational development',
        'Kembangkan kemampuan public speaking dan presentasi',
        'Pertimbangkan peran dalam consulting atau coaching',
        'Manfaatkan kemampuan sosial untuk membangun network yang kuat'
      ],
      careerRecommendation: [
        {
          careerName: 'Human Resources Director',
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'high',
            careerProgression: 'super high',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          },
          description: 'Memimpin strategi SDM dan pengembangan organisasi',
          matchPercentage: 95
        },
        {
          careerName: 'Management Consultant',
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'super high',
            careerProgression: 'high',
            industryGrowth: 'moderate',
            skillDevelopment: 'super high'
          },
          description: 'Memberikan solusi strategis untuk berbagai organisasi',
          matchPercentage: 91
        },
        {
          careerName: 'Executive Coach',
          careerProspect: {
            jobAvailability: 'moderate',
            salaryPotential: 'high',
            careerProgression: 'high',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          },
          description: 'Mengembangkan kemampuan kepemimpinan eksekutif',
          matchPercentage: 89
        }
      ],
      roleModel: ['Oprah Winfrey', 'Nelson Mandela', 'Simon Sinek', 'Brené Brown']
    }
  }
];

// Helper function to get mock result by ID
export function getMockResultById(id: string): AssessmentResult | undefined {
  return mockAssessmentResults.find(result => result.id === id);
}

// Helper function to generate a new mock result with random scores
export function generateMockResult(id: string): AssessmentResult {
  const randomScore = () => Math.floor(Math.random() * 100);
  
  return {
    id,
    userId: 'user-' + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    status: 'completed',
    assessment_data: {
      riasec: {
        realistic: randomScore(),
        investigative: randomScore(),
        artistic: randomScore(),
        social: randomScore(),
        enterprising: randomScore(),
        conventional: randomScore()
      },
      ocean: {
        openness: randomScore(),
        conscientiousness: randomScore(),
        extraversion: randomScore(),
        agreeableness: randomScore(),
        neuroticism: randomScore()
      },
      viaIs: {
        creativity: randomScore(),
        curiosity: randomScore(),
        judgment: randomScore(),
        loveOfLearning: randomScore(),
        perspective: randomScore(),
        bravery: randomScore(),
        perseverance: randomScore(),
        honesty: randomScore(),
        zest: randomScore(),
        love: randomScore(),
        kindness: randomScore(),
        socialIntelligence: randomScore(),
        teamwork: randomScore(),
        fairness: randomScore(),
        leadership: randomScore(),
        forgiveness: randomScore(),
        humility: randomScore(),
        prudence: randomScore(),
        selfRegulation: randomScore(),
        appreciationOfBeauty: randomScore(),
        gratitude: randomScore(),
        hope: randomScore(),
        humor: randomScore(),
        spirituality: randomScore()
      }
    },
    persona_profile: {
      title: 'The Dynamic Achiever',
      description: 'Profil kepribadian yang unik dengan kombinasi kekuatan yang menarik untuk dieksplorasi lebih lanjut.',
      strengths: ['Adaptabilitas tinggi', 'Kemampuan problem solving', 'Motivasi internal yang kuat'],
      recommendations: ['Eksplorasi berbagai peluang karir', 'Kembangkan kekuatan utama', 'Pertimbangkan peran yang menantang'],
      careerRecommendation: [
        {
          careerName: 'Business Analyst',
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'high',
            careerProgression: 'high',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          },
          matchPercentage: 85
        }
      ],
      roleModel: ['Bill Gates', 'Sheryl Sandberg']
    }
  };
}
