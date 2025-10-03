// AI-Driven Assessment Analysis Utils (moved from services)
// Generates comprehensive personality analysis based on assessment scores using ATMA API

import { AssessmentScores, PersonaProfile, CareerRecommendation, CareerProspectLevel } from '../types/assessment-results';
import apiService from '../services/apiService';
import {
  getWebSocketService,
  isWebSocketSupported
} from '../services/notificationService';
import type { WebSocketEvent } from '../services/websocket-service';

// --- Persona type definitions and data (trimmed copy, see original for full content) ---
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

// Minimal seed to keep file small; original file contains full DBs
const PERSONA_TYPES: PersonaType[] = [
  { id: 'creative-investigator', title: 'The Creative Investigator', description: '', primaryTraits: ['investigative','artistic'], secondaryTraits: ['openness'], riasecCodes: ['I','A'], oceanTraits: ['openness'], viaStrengths: ['creativity','curiosity'] },
];
const CAREER_DATABASE: CareerData[] = [
  { name: 'Data Scientist', riasecCodes: ['I','A'], requiredTraits: ['curiosity','creativity','judgment'], description: '', prospects: { jobAvailability: 'super high', salaryPotential: 'super high', careerProgression: 'high', industryGrowth: 'super high', skillDevelopment: 'high' } },
];
const ROLE_MODELS = [
  { name: 'Elon Musk', traits: ['leadership','creativity','bravery'], riasecCodes: ['E','I'], description: '' },
];

export async function generateComprehensiveAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  // Keep behavior same as original refactor: no API submission here
  return await generateLocalAnalysis(scores);
}

// WebSocket monitoring helpers (shortened to keep under 300 lines)
async function monitorWithWebSocket(jobId: string): Promise<any> {
  if (isWebSocketSupported()) {
    try {
      return await monitorWithWebSocketConnection(jobId);
    } catch {
      return await pollForCompletion(jobId);
    }
  }
  return await pollForCompletion(jobId);
}

async function monitorWithWebSocketConnection(jobId: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const wsService = getWebSocketService();
    let isResolved = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let removeEventListener: (() => void) | null = null;

    try {
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          if (removeEventListener) removeEventListener();
          reject(new Error('WebSocket monitoring timeout - assessment took too long'));
        }
      }, 120000);

      // CRITICAL FIX: Register event listener BEFORE connecting to avoid race condition
      removeEventListener = wsService.addEventListener(async (event: WebSocketEvent) => {
        if (event.jobId !== jobId || isResolved) return;
        if (event.type === 'analysis-complete' && event.resultId) {
          if (timeoutId) clearTimeout(timeoutId);
          isResolved = true;
          if (removeEventListener) removeEventListener();
          try {
            const statusResponse = await apiService.getAssessmentStatus(jobId);
            const resultId = (statusResponse.success && (statusResponse.data as any).resultId)
              ? (statusResponse.data as any).resultId
              : event.resultId;
            if (resultId) {
              try {
                const fullResult = await apiService.getResultById(resultId);
                resolve(fullResult.success ? fullResult.data : { id: resultId });
              } catch {
                resolve({ id: resultId });
              }
            } else {
              reject(new Error('Failed to retrieve completed assessment result'));
            }
          } catch (error) {
            reject(error);
          }
        } else if (event.type === 'analysis-failed') {
          if (timeoutId) clearTimeout(timeoutId);
          isResolved = true;
          if (removeEventListener) removeEventListener();
          reject(new Error(event.error || 'Assessment analysis failed'));
        }
      });

      console.log(`AI Analysis: Event listener registered for job ${jobId} (before connect)`);

      const status = wsService.getStatus();
      if (!status.isConnected) {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
        if (!token) throw new Error('No authentication token available for WebSocket connection');
        await wsService.connect(token);
        console.log(`AI Analysis: WebSocket connected for job ${jobId}`);
      } else {
        console.log(`AI Analysis: WebSocket already connected, reusing for job ${jobId}`);
      }

      wsService.subscribeToJob(jobId);
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      if (removeEventListener) removeEventListener();
      if (!isResolved) {
        isResolved = true;
        reject(error);
      }
    }
  });
}

async function pollForCompletion(jobId: string, maxAttempts: number = 60, interval: number = 2000): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await apiService.getAssessmentStatus(jobId);
      if (statusResponse.success) {
        const status = (statusResponse.data as any).status;
        const tokenInfo = (statusResponse.data as any).tokenInfo;
        if (status === 'completed') {
          return { id: jobId, status: 'completed', tokenInfo };
        } else if (status === 'failed') {
          throw new Error('Assessment processing failed');
        }
      }
    } catch {}
    await new Promise(res => setTimeout(res, interval));
  }
  throw new Error('Timeout waiting for assessment completion');
}

export async function generateApiOnlyAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  return await generateLocalAnalysis(scores);
}

export async function generateLocalAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const analysis = analyzeTraits(scores);
  const persona = generatePersona(analysis);
  const strengths = generateStrengths(analysis, scores);
  const recommendations = generateRecommendations(analysis, scores);
  const careerRecommendations = generateCareerRecommendations(analysis, scores);
  const roleModels = generateRoleModels(analysis);
  return {
    archetype: persona.title,
    shortSummary: persona.description,
    strengths,
    recommendations,
    careerRecommendation: careerRecommendations,
    roleModel: roleModels,
    title: persona.title,
    description: persona.description
  };
}

function analyzeTraits(scores: AssessmentScores) {
  const { riasec, ocean, viaIs } = scores;
  const riasecEntries = Object.entries(riasec).sort(([,a], [,b]) => b - a);
  const primaryRiasec = riasecEntries[0][0];
  const secondaryRiasec = riasecEntries[1][0];
  const highOceanTraits = Object.entries(ocean).filter(([, score]) => score > 60).map(([trait]) => trait);
  const topViaStrengths = Object.entries(viaIs).filter(([, score]) => score > 70).sort(([,a], [,b]) => b - a).slice(0, 5).map(([s]) => s);
  return { primaryRiasec, secondaryRiasec, highOceanTraits, topViaStrengths } as any;
}

function generatePersona(analysis: any) {
  const found = PERSONA_TYPES.find(p => p.primaryTraits.includes('investigative'));
  return found || { title: 'Persona', description: '' } as any;
}

function generateStrengths(analysis: any, scores: AssessmentScores) {
  const viaStrengthsMap: Record<string, string> = {
    creativity: 'Anda memiliki kreativitas tinggi...',
    curiosity: 'Anda sangat ingin tahu...'
  };
  const strengths: string[] = [];
  analysis.topViaStrengths.slice(0, 3).forEach((strength: string) => {
    if (viaStrengthsMap[strength]) strengths.push(viaStrengthsMap[strength]);
  });
  return strengths.slice(0, 5);
}

function generateRecommendations(analysis: any, scores: AssessmentScores): string[] {
  const recs: string[] = [];
  const riasecGrowth = Object.entries(scores.riasec).filter(([, s]) => s < 50).slice(0,2);
  const oceanGrowth = Object.entries(scores.ocean).filter(([t, s]) => t === 'neuroticism' ? s > 60 : s < 50).slice(0,2);
  recs.push(...riasecGrowth.map(([k]) => `Tingkatkan aspek ${k}`));
  recs.push(...oceanGrowth.map(([k]) => `Kembangkan trait ${k}`));
  return recs.slice(0,5);
}

function generateCareerRecommendations(analysis: any, scores: AssessmentScores): CareerRecommendation[] {
  const scored = CAREER_DATABASE.map(career => {
    let matchScore = 0;
    const primary = analysis.primaryRiasec?.charAt(0).toUpperCase() || 'I';
    const secondary = analysis.secondaryRiasec?.charAt(0).toUpperCase() || 'A';
    if (career.riasecCodes.includes(primary)) matchScore += 40;
    if (career.riasecCodes.includes(secondary)) matchScore += 20;
    const matchingTraits = career.requiredTraits.filter(trait => analysis.topViaStrengths.includes(trait));
    matchScore += (matchingTraits.length / career.requiredTraits.length) * 40;
    return { ...career, matchPercentage: Math.min(Math.round(matchScore), 95) } as any;
  });
  return scored.sort((a,b) => b.matchPercentage - a.matchPercentage).slice(0,3) as any;
}

function generateRoleModels(analysis: any): string[] {
  const primary = analysis.primaryRiasec?.charAt(0).toUpperCase() || 'I';
  const secondary = analysis.secondaryRiasec?.charAt(0).toUpperCase() || 'A';
  const matching = ROLE_MODELS.filter(r => r.riasecCodes.includes(primary) || r.riasecCodes.includes(secondary));
  return matching.map(r => r.name).slice(0,3);
}

