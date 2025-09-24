// User Statistics Utils (moved from services)
// Calculates real-time stats based on user's assessment data using Archive API via apiService

import { StatCard } from '../types/dashboard';
import { AssessmentResult } from '../types/assessment-results';
import apiService from '../services/apiService';
import { checkTokenBalance } from './token-balance';

export interface UserStats {
  totalAnalysis: number;
  completed: number;
  processing: number;
  tokenBalance: number;
  assessmentResults: AssessmentResult[];
}

// Local fallback for older localStorage-based results
async function getUserAssessmentResults(userId?: string) {
  try {
    const data = typeof window !== 'undefined' ? localStorage.getItem('assessmentResults') : null;
    if (!data) return [] as AssessmentResult[];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as AssessmentResult[];
  }
}

export async function calculateUserStats(userId?: string): Promise<UserStats> {
  try {
    console.log(`UserStats: Calculating stats for user: ${userId || 'anonymous'}`);

    // Try Archive API first
    let assessmentHistory: any[] = [];
    try {
      console.log('UserStats: Fetching assessment data from Archive Service API...');
      assessmentHistory = await fetchAssessmentHistoryFromAPI();
      console.log(`UserStats: Found ${assessmentHistory.length} assessments from Archive API`);
    } catch (error) {
      console.error('UserStats: Failed to fetch from Archive API, falling back to localStorage:', error);
    }

    // Fallback to localStorage if no API data
    let userSpecificResults: AssessmentResult[] = [];
    if (assessmentHistory.length === 0) {
      console.log('UserStats: Using localStorage fallback for assessment data');
      const localResults = await getUserAssessmentResults(userId);
      userSpecificResults = userId ? localResults.filter(r => r.userId === userId) : localResults;
      console.log(`UserStats: Found ${userSpecificResults.length} results from localStorage`);
    }

    // Calculate totals
    let totalAnalysis = 0;
    let completed = 0;
    let processing = 0;

    if (assessmentHistory.length > 0) {
      totalAnalysis = assessmentHistory.length;
      completed = assessmentHistory.filter(item => item.status === 'Selesai').length;
      processing = assessmentHistory.filter(item => item.status === 'Proses' || item.status === 'Batal').length;
    } else {
      totalAnalysis = userSpecificResults.length;
      completed = userSpecificResults.filter(r => r.status === 'completed').length;
      processing = userSpecificResults.filter(r => r.status === 'processing' || r.status === 'queued').length;
    }

    // Token balance
    let tokenBalance = 0;
    try {
      const tokenInfo = await checkTokenBalance();
      tokenBalance = tokenInfo.error ? 0 : tokenInfo.balance;
    } catch (error) {
      const baseTokens = 10;
      const completedBonus = completed * 5;
      const processingCost = processing * 2;
      tokenBalance = Math.max(0, baseTokens + completedBonus - processingCost);
    }

    return { totalAnalysis, completed, processing, tokenBalance, assessmentResults: userSpecificResults };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return { totalAnalysis: 0, completed: 0, processing: 0, tokenBalance: 10, assessmentResults: [] };
  }
}

export function formatStatsForDashboard(userStats: UserStats): StatCard[] {
  return [
    { id: 'analysis', value: userStats.totalAnalysis, label: 'Total Asesmen', color: '#dbeafe', icon: 'MagnifyingGlass.svg' },
    { id: 'completed', value: userStats.completed, label: 'Selesai', color: '#dbfce7', icon: 'Check.svg' },
    { id: 'processing', value: userStats.processing, label: 'Proses', color: '#dbeafe', icon: 'Cpu.svg' },
    { id: 'balance', value: userStats.tokenBalance, label: 'Saldo Token', color: '#f3e8ff', icon: 'Command.svg' }
  ];
}

export async function fetchAssessmentHistoryFromAPI() {
  try {
    console.log('Archive API: Starting to fetch assessment history (via /api/archive/jobs)...');

    // Fetch first page of jobs to determine pagination
    const firstResponse = await apiService.getJobs({
      limit: 100,
      page: 1,
      sort: 'created_at',
      order: 'DESC'
    } as any);

    // Expected response shape: { success, data: { jobs: [...], pagination: {...} } }
    if (!firstResponse?.success || !firstResponse.data?.jobs) {
      return [];
    }

    let allJobs = [...firstResponse.data.jobs];

    if (firstResponse.data.pagination) {
      const { totalPages } = firstResponse.data.pagination;
      if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          const response = await apiService.getJobs({ limit: 100, page } as any);
          if (response?.success && response.data?.jobs) {
            allJobs = allJobs.concat(response.data.jobs);
          }
        }
      }
    }

    // Map jobs to AssessmentData for dashboard table with enrichment if title missing
    const assessmentHistory = await Promise.all(
      allJobs.map(async (job: any, index: number) => {
        let title =
          job.persona_profile?.archetype ||
          job.persona_profile?.title ||
          job.final_data?.persona_profile?.archetype ||
          job.final_data?.persona_profile?.title ||
          job.assessment_data?.persona_profile?.archetype ||
          job.assessment_data?.persona_profile?.title ||
          job.result?.persona_profile?.archetype ||
          job.result?.persona_profile?.title ||
          job.persona_title ||
          job.archetype ||
          job.title ||
          job.name ||
          '';

        // Enrich from result detail if title still unknown and resultId available
        const resultId = job.result_id || job.id;
        if ((!title || title.trim().length === 0) && resultId) {
          try {
            const full = await apiService.getResultById(resultId);
            const t = full?.data?.persona_profile?.archetype || full?.data?.persona_profile?.title;
            if (t) title = t;
          } catch (_) {
            // ignore enrichment failure
          }
        }

        const rawStatus = job.status || job.assessment_data?.status || 'completed';
        const status = (() => {
          const s = String(rawStatus).toLowerCase();
          if (s === 'completed' || s === 'done' || s === 'success') return 'Selesai';
          if (s === 'processing' || s === 'in_progress' || s === 'queued' || s === 'running') return 'Proses';
          if (s === 'failed' || s === 'error') return 'Gagal';
          if (s === 'cancelled' || s === 'canceled') return 'Batal';
          return rawStatus;
        })();

        const createdAt = job.created_at || job.createdAt || job.createdAtUtc || job.updated_at || Date.now();
        return {
          id: index + 1,
          nama: title || 'Unknown',
          tipe: 'Personality Assessment' as const,
          tanggal: new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          status,
          resultId,
        };
      })
    );

    return assessmentHistory;
  } catch (error) {
    console.error('Archive API: Error fetching assessment history (jobs):', error);
    return [];
  }
}

export async function getLatestAssessmentFromArchive() {
  try {
    const response = await apiService.getResults({
      limit: 10,
      status: 'completed',
      // @ts-ignore
      sort: 'created_at',
      order: 'DESC'
    });

    if (!response.success || !response.data?.results || response.data.results.length === 0) {
      return null;
    }

    const latestResult = response.data.results[0];
    const fullResultResponse = await apiService.getResultById(latestResult.id);

    if (!fullResultResponse.success) {
      throw new Error(`Failed to fetch full result: ${fullResultResponse.message}`);
    }

    return fullResultResponse.data;
  } catch (error) {
    console.error('Archive API: Error fetching latest assessment:', error);
    return null;
  }
}

export async function calculateUserProgress(userStats: UserStats) {
  console.log('UserProgress: Starting calculation...');
  try {
    const archiveAssessment = await getLatestAssessmentFromArchive();

    if (archiveAssessment?.assessment_data?.riasec) {
      const riasec = archiveAssessment.assessment_data.riasec;
      return [
        { label: 'Investigative', value: riasec.investigative || 0 },
        { label: 'Arts', value: riasec.artistic || 0 },
        { label: 'Practical', value: riasec.realistic || 0 },
        { label: 'Social', value: riasec.social || 0 },
        { label: 'Leadership', value: riasec.enterprising || 0 },
        { label: 'Analytical', value: riasec.conventional || 0 }
      ];
    }

    const latest = userStats.assessmentResults?.[0];
    if (latest?.scores?.riasec) {
      const riasec = latest.scores.riasec;
      return [
        { label: 'Investigative', value: riasec.investigative || 0 },
        { label: 'Arts', value: riasec.artistic || 0 },
        { label: 'Practical', value: riasec.realistic || 0 },
        { label: 'Social', value: riasec.social || 0 },
        { label: 'Leadership', value: riasec.enterprising || 0 },
        { label: 'Analytical', value: riasec.conventional || 0 }
      ];
    }

    return [
      { label: 'Investigative', value: 0 },
      { label: 'Arts', value: 0 },
      { label: 'Practical', value: 0 },
      { label: 'Social', value: 0 },
      { label: 'Leadership', value: 0 },
      { label: 'Analytical', value: 0 }
    ];
  } catch (error) {
    console.error('UserProgress: Error calculating progress:', error);
    return [
      { label: 'Investigative', value: 0 },
      { label: 'Arts', value: 0 },
      { label: 'Practical', value: 0 },
      { label: 'Social', value: 0 },
      { label: 'Leadership', value: 0 },
      { label: 'Analytical', value: 0 }
    ];
  }
}

export function getUserActivitySummary(userStats: UserStats) {
  const totalAssessments = userStats.totalAnalysis;
  const completionRate = totalAssessments > 0 ? Math.round((userStats.completed / totalAssessments) * 100) : 0;
  const activeAssessments = userStats.processing;

  return {
    totalAssessments,
    completionRate,
    activeAssessments
  };
}

export function clearDemoAssessmentData(): void {
  if (typeof window === 'undefined') return;

  // Remove legacy demo keys
  const keysToRemove: string[] = [];

  // Remove demo/mock keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('assessment-result-') || key === 'assessmentResults') {
      try {
        const result = JSON.parse(localStorage.getItem(key)!);
        if (result?.id?.includes('demo-') || result?.id?.includes('mock-') || result?.userId === 'demo-user') {
          keysToRemove.push(key);
        }
      } catch {}
    }
  }

  // Remove identified keys
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear derived stats
  localStorage.removeItem('user-stats-cache');
}

