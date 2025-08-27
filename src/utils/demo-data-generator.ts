// Demo Data Generator for Assessment Results
// Provides fallback demo data when real results are not available

import { AssessmentResult } from '../types/assessment-results';

/**
 * Generate a demo assessment result for testing and fallback purposes
 */
export function generateDemoAssessmentResult(resultId: string): AssessmentResult {
  console.log(`generateDemoAssessmentResult: Creating demo result for ID: ${resultId}`);

  const demoResult: AssessmentResult = {
    id: resultId,
    userId: 'demo-user',
    createdAt: new Date().toISOString(),
    status: 'completed',
    assessment_data: {
      assessmentName: 'AI-Driven Talent Mapping',
      riasec: {
        realistic: 65,
        investigative: 72,
        artistic: 58,
        social: 81,
        enterprising: 69,
        conventional: 54
      },
      ocean: {
        openness: 78,
        conscientiousness: 85,
        extraversion: 62,
        agreeableness: 89,
        neuroticism: 34
      },
      viaIs: {
        creativity: 82,
        curiosity: 76,
        judgment: 71,
        loveOfLearning: 88,
        perspective: 69,
        bravery: 65,
        perseverance: 79,
        honesty: 91,
        zest: 73,
        love: 86,
        kindness: 84,
        socialIntelligence: 77,
        teamwork: 81,
        fairness: 87,
        leadership: 68,
        forgiveness: 75,
        humility: 72,
        prudence: 74,
        selfRegulation: 70,
        appreciationOfBeauty: 66,
        gratitude: 89,
        hope: 83,
        humor: 71,
        spirituality: 58
      },
      industryScore: {
        teknologi: 85,
        kesehatan: 72,
        keuangan: 64,
        pendidikan: 89,
        rekayasa: 82,
        pemasaran: 71,
        hukum: 60,
        kreatif: 78,
        media: 70,
        penjualan: 63,
        sains: 76,
        manufaktur: 58,
        agrikultur: 52,
        pemerintahan: 55,
        konsultasi: 67,
        pariwisata: 50,
        logistik: 57,
        energi: 61,
        sosial: 91,
        olahraga: 49,
        properti: 53,
        kuliner: 56,
        perdagangan: 66,
        telekomunikasi: 62
      }
    },
    persona_profile: {
      archetype: "Compassionate Innovator",
      coreMotivators: ["Social impact", "Continuous learning", "Creative problem solving"],
      learningStyle: "Collaborative & exploratory",
      shortSummary: "Menggabungkan empati tinggi dengan kreativitas untuk menyelesaikan masalah yang kompleks.",
      strengthSummary: "Komunikasi kuat, kepemimpinan kolaboratif, kecerdasan sosial tinggi.",
      strengths: [
        "Social intelligence & empathy",
        "Creative problem-solving",
        "Collaborative leadership",
        "Emotional intelligence & self-awareness",
        "Communication & interpersonal skills"
      ],
      weaknessSummary: "Perlu memperkuat struktur eksekusi dan pengambilan keputusan teknis.",
      weaknesses: ["Perencanaan teknis", "Ketegasan keputusan"],
      careerRecommendation: [
        {
          careerName: "Social Innovation Manager",
          matchPercentage: 92,
          description: "Memimpin inisiatif berdampak sosial dengan solusi inovatif.",
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'high',
            careerProgression: 'high',
            industryGrowth: 'moderate',
            skillDevelopment: 'high'
          }
        },
        {
          careerName: "UX/UI Designer",
          matchPercentage: 87,
          description: "Merancang pengalaman pengguna yang berfokus pada kebutuhan manusia.",
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'moderate',
            careerProgression: 'moderate',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          }
        }
      ],
      insights: [
        "Lebih efektif saat bekerja dalam tim lintas disiplin",
        "Mendapat energi dari peran yang berdampak pada orang lain"
      ],
      skillSuggestion: ["Data storytelling", "Design thinking", "Stakeholder management"],
      possiblePitfalls: ["Over-collaboration", "Difficulty saying no"],
      riskTolerance: "moderate",
      workEnvironment: "Tim kolaboratif, misi berdampak",
      roleModel: ["Satya Nadella", { name: "Melinda French Gates", title: "Philanthropist" }],
      developmentActivities: {
        extracurricular: ["Community leadership", "Volunteer mentoring"],
        projectIdeas: ["EdTech for social impact", "Community analytics dashboard"],
        bookRecommendations: [
          { title: "Creative Confidence", author: "Tom & David Kelley", reason: "Menguatkan pola pikir inovatif" },
          { title: "Drive", author: "Daniel H. Pink", reason: "Memahami motivasi intrinsik" }
        ]
      },
      // Legacy fields for backward compatibility
      title: "The Compassionate Innovator",
      description: "Anda pemimpin yang menggabungkan kreativitas dengan empati, unggul memahami orang dan menyusun solusi inovatif.",
      recommendations: [
        "Pertimbangkan peran social innovation",
        "Eksplorasi kepemimpinan tim & manajemen proyek",
        "Perkuat skill kreatif & desain",
        "Cari peluang teknologi untuk dampak sosial",
        "Mentoring/coaching untuk membantu orang lain"
      ]
    }
  };

  console.log(`generateDemoAssessmentResult: Demo result created for ${resultId}`);
  return demoResult;
}

/**
 * Generate demo assessment data for dashboard display
 */
export function generateDemoAssessmentData() {
  return [
    {
      id: 1,
      nama: "Demo Assessment 1",
      tipe: "RIASEC + OCEAN + VIA",
      tanggal: new Date().toLocaleDateString('id-ID'),
      status: "Selesai",
      resultId: "demo-result-1"
    },
    {
      id: 2,
      nama: "Demo Assessment 2", 
      tipe: "RIASEC + OCEAN",
      tanggal: new Date(Date.now() - 86400000).toLocaleDateString('id-ID'),
      status: "Selesai",
      resultId: "demo-result-2"
    }
  ];
}

/**
 * Check if a result ID is a demo/test ID
 */
export function isDemoResultId(resultId: string): boolean {
  return resultId.startsWith('demo-') || resultId.startsWith('test-') || resultId.startsWith('result-');
}
