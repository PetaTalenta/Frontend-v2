/**
 * Test utility for PDF generation
 * This file helps test and validate PDF generation with sample data
 */

import { AssessmentResult } from '../types/assessment-results';
import { exportAdvancedPDF } from './advanced-pdf-export';

// Sample assessment result with realistic data for testing
export const sampleAssessmentResult: AssessmentResult = {
  id: 'test-result-' + Date.now(),
  userId: 'test-user',
  createdAt: new Date().toISOString(),
  status: 'completed',
  assessment_data: {
    assessmentName: 'AI-Driven Talent Mapping',
    riasec: {
      realistic: 63,
      investigative: 45,
      artistic: 38,
      social: 55,
      enterprising: 53,
      conventional: 42
    },
    ocean: {
      openness: 35,
      conscientiousness: 42,
      extraversion: 68,
      agreeableness: 58,
      neuroticism: 25
    },
    viaIs: {
      creativity: 63,
      curiosity: 58,
      judgment: 56,
      loveOfLearning: 81,
      perspective: 69,
      bravery: 56,
      perseverance: 56,
      honesty: 81,
      zest: 56,
      love: 45,
      kindness: 52,
      socialIntelligence: 63,
      teamwork: 56,
      fairness: 48,
      leadership: 42,
      forgiveness: 38,
      humility: 45,
      prudence: 52,
      selfRegulation: 69,
      appreciationOfBeauty: 35,
      gratitude: 69,
      hope: 48,
      humor: 42,
      spirituality: 38
    }
  },
  persona_profile: {
    archetype: 'The Pragmatic Executor',
    title: 'The Pragmatic Executor',
    description: 'Anda adalah seorang "Pragmatic Executor", individu yang berorientasi pada tindakan, membumi, dan efektif. Kekuatan Anda terletak pada kemampuan untuk menerjemahkan rencana menjadi hasil yang nyata. Anda tidak tertarik pada teori-teori abstrak atau ide-ide yang tidak dapat diimplementasikan; sebaliknya, Anda termotivasi oleh pekerjaan yang memiliki dampak jelas dan terukur. Secara sosial, Anda enerjik dan mampu bekerja sama dengan orang lain untuk mencapai tujuan bersama, didukung oleh stabilitas emosional yang membuat Anda tenang di bawah tekanan.',
    shortSummary: 'Individu yang berorientasi pada tindakan, membumi, dan efektif dalam menerjemahkan rencana menjadi hasil nyata.',
    strengthSummary: 'Pragmatis, stabil secara emosional, pembelajar aplikatif yang cepat, jujur, dan enerjik dalam interaksi sosial.',
    strengths: [
      'Pragmatis dan Berorientasi pada Hasil',
      'Sangat Stabil Secara Emosional',
      'Pembelajar Aplikatif yang Cepat',
      'Jujur dan Berintegritas Tinggi',
      'Enerjik dalam Interaksi Sosial'
    ],
    weaknessSummary: 'Tantangan dalam perencanaan jangka panjang dan keterbukaan terhadap ide-ide baru yang radikal.',
    weaknesses: [
      'Kurang terbuka terhadap ide-ide radikal',
      'Tantangan dalam perencanaan jangka panjang',
      'Kurang tertarik pada teori abstrak'
    ],
    careerRecommendation: [
      { careerName: 'Construction Manager', matchPercentage: 85 },
      { careerName: 'Sales Engineer', matchPercentage: 82 },
      { careerName: 'Law Enforcement Officer (Police/Military)', matchPercentage: 78 },
      { careerName: 'Physical Therapist', matchPercentage: 75 },
      { careerName: 'Project Manager', matchPercentage: 73 }
    ],
    roleModel: ['Basuki Hadimuljono', 'Ignasius Jonan', 'Susi Pudjiastuti'],
    insights: [
      'Fokus pada implementasi praktis daripada teori',
      'Bekerja dengan baik dalam lingkungan yang terstruktur',
      'Membutuhkan feedback yang jelas dan terukur'
    ],
    skillSuggestion: [
      'Kembangkan keterampilan perencanaan strategis',
      'Pelajari teknik manajemen proyek',
      'Tingkatkan kemampuan komunikasi tim'
    ],
    possiblePitfalls: [
      'Menghindari inovasi yang terlalu radikal',
      'Kesulitan dengan ambiguitas',
      'Kurang sabar dengan proses yang lambat'
    ],
    riskTolerance: 'Moderat - lebih suka pendekatan yang terbukti',
    workEnvironment: 'Lingkungan yang terstruktur dengan tujuan yang jelas dan feedback yang teratur'
  }
};

/**
 * Test PDF generation with sample data
 */
export async function testPDFGeneration(): Promise<Blob> {
  console.log('Testing PDF generation with sample data...');
  
  try {
    const pdfBlob = await exportAdvancedPDF('test-result', sampleAssessmentResult, {
      quality: 0.95,
      scale: 1.2,
      format: 'a4',
      orientation: 'portrait',
      margin: 15
    });
    
    console.log('PDF generation test successful!');
    console.log('PDF size:', pdfBlob.size, 'bytes');
    
    return pdfBlob;
  } catch (error) {
    console.error('PDF generation test failed:', error);
    throw error;
  }
}

/**
 * Download test PDF
 */
export function downloadTestPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-assessment-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Run complete PDF test
 */
export async function runPDFTest(): Promise<void> {
  try {
    console.log('Starting PDF generation test...');
    const pdfBlob = await testPDFGeneration();
    
    console.log('Downloading test PDF...');
    downloadTestPDF(pdfBlob);
    
    console.log('PDF test completed successfully!');
  } catch (error) {
    console.error('PDF test failed:', error);
    throw error;
  }
}
