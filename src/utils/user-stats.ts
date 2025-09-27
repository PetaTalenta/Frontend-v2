// User Statistics Utils (moved from services)
// Calculates real-time stats based on user's assessment data using Archive API via apiService

import { StatCard } from '../types/dashboard';
import { AssessmentResult } from '../types/assessment-results';
import type { AssessmentData } from '../types/dashboard';
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




export async function calculateUserStats(userId?: string): Promise<UserStats> { /* status mapping normalized to API raw */
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
      completed = assessmentHistory.filter(item => String(item.status).toLowerCase() === 'completed').length;
      processing = assessmentHistory.filter(item => {
        const s = String(item.status).toLowerCase();
        return s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress';
      }).length;
    } else {
      totalAnalysis = userSpecificResults.length;
      completed = userSpecificResults.filter(r => r.status === 'completed').length;
      processing = userSpecificResults.filter(r => r.status === 'processing' || r.status === 'queued' || r.status === 'pending' || r.status === 'in_progress').length;
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

export async function fetchAssessmentHistoryFromAPI(): Promise<AssessmentData[]> {
  try {
    console.log('Archive API: Fetching assessment history from /archive/jobs...');

    // Helpers
    // Helpers (date only for internal normalization)
    const toIso = (v: any): string => {
      const toDate = (x: any): Date | null => {
        if (x === null || x === undefined || x === '') return null;
        if (typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x))) {
          const n = Number(x);
          const ms = n < 1e12 ? n * 1000 : n; // seconds or ms
          const d = new Date(ms);
          return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(x);
        return isNaN(d.getTime()) ? null : d;
      };
      const candidates = [v, v?.created_at, v?.createdAt, v?.createdAtUtc, v?.updated_at, v?.updatedAt, Date.now()];
      for (const c of candidates) {
        const d = toDate(c);
        if (d) return d.toISOString();
      }
      return new Date().toISOString();
    };

    const deriveTitle = (obj: any): string => {
      const pp = obj?.persona_profile || obj?.result?.persona_profile || obj?.assessment_data?.persona_profile || obj?.test_result;
      const candidates = [
        obj?.archetype_name,               // prefer explicit archetype name if provided by jobs API
        obj?.archetype,                    // sometimes backend may flatten it here
        pp?.archetype,                     // persona_profile archetype from job/result
        pp?.title,
        obj?.assessment_name,              // generic assessment names (least preferred)
        obj?.title,
        obj?.name
      ];
      const t = candidates.find((x) => typeof x === 'string' && String(x).trim());
      return (t && String(t).trim()) || 'Assessment';
    };

    // 1) Fetch jobs (paginate if needed) — robust stop conditions to avoid endless loops
    const PAGE_LIMIT = 100;
    const MAX_PAGES = 100;        // hard cap
    const MAX_ITEMS = 5000;       // hard cap

    const first = await apiService.getJobs({ page: 1, limit: PAGE_LIMIT, sort: 'created_at', order: 'DESC' } as any);
    let jobs: any[] = [];
    if (first?.success && Array.isArray(first.data?.jobs)) {
      jobs = [...first.data.jobs];

      // Track seen IDs to prevent duplicates and detect no-progress conditions
      const seen = new Set<string>();
      const getKey = (j: any, idx: number) => String(j?.id || j?.job_id || `${j?.user_id || 'u'}-${j?.created_at || 't'}-${idx}`);
      jobs.forEach((j, idx) => seen.add(getKey(j, idx)));

      let page = 1;
      let hasMore = Boolean(first.data?.pagination?.hasMore);
      let totalFetched = jobs.length;

      // Continue while backend indicates more AND we still make progress
      while (hasMore && page < MAX_PAGES && totalFetched < MAX_ITEMS) {
        page += 1;
        const resp = await apiService.getJobs({ page, limit: PAGE_LIMIT, sort: 'created_at', order: 'DESC' } as any);
        const pageJobs = resp?.success && Array.isArray(resp.data?.jobs) ? resp.data.jobs : [];

        if (!pageJobs.length) break; // no items => stop

        // Add only new items (dedup by known fields)
        let added = 0;
        pageJobs.forEach((j: any, idx: number) => {
          const key = getKey(j, idx);
          if (!seen.has(key)) {
            seen.add(key);
            jobs.push(j);
            added++;
          }
        });

        if (added === 0) break; // no-progress => stop

        totalFetched += added;

        // Stop when this looks like last page by size
        if (pageJobs.length < PAGE_LIMIT) break;

        // Continue only if API indicates more
        hasMore = Boolean(resp?.data?.pagination?.hasMore);

        // Safety fallback if backend also returns totalPages
        const totalPages = resp?.data?.pagination?.totalPages;
        if (typeof totalPages === 'number' && page >= totalPages) break;
      }
    }

    // 2) Map dan enrich jobs. Output diselaraskan dengan field API.
    if (jobs.length > 0) {
      const GENERIC_TITLES = new Set([
        'Assessment',
        'AI-Driven Talent Mapping',
        'Personality Assessment',
        'Big Five Personality',
        'RIASEC Holland Codes',
        'VIA Character Strengths'
      ]);

      const toIso = (v: any): string => {
        if (typeof v === 'string' && v.trim()) return v;
        const d = new Date(v ?? Date.now());
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      };

      // Drop obviously deleted jobs if backend flags exist
      const aliveJobs = jobs.filter((job: any) => !(
        job?.deleted === true || job?.is_deleted === true || job?.isDeleted === true || !!job?.deleted_at
      ));

      const mapped: AssessmentData[] = aliveJobs.map((job: any, idx: number) => {
        const createdRaw = job.created_at || job.createdAt || job.createdAtUtc || job.updated_at || job.updatedAt || Date.now();
        const statusRaw = job.status || job.assessment_data?.status || '';
        const resultId = job.result_id || job.resultId || job.result_uuid || job.result?.id || undefined;
        const title = deriveTitle(job);
        const cleanTitle = (typeof title === 'string' && title.trim()) ? title.trim() : 'Assessment';
        return {
          id: idx + 1,
          archetype: cleanTitle,
          created_at: toIso(createdRaw),
          status: String(statusRaw),
          result_id: resultId,
          assessment_name: job.assessment_name || job.assessmentName,
          job_id: job.id || job.job_id
        };
      });

      // Always batch fetch recent results to both enrich titles and filter deleted ones
      let resultsArr: any[] = [];
      let resMap = new Map<string, any>();
      let resultsIdSet = new Set<string>();
      try {
        // Use conservative params to avoid 400 and large payloads; backend sorts by created_at desc by default
        const resList = await apiService.getResults({ limit: 100, page: 1 } as any);
        resultsArr = (resList?.success && Array.isArray(resList.data?.results)) ? resList.data.results : [];
        resMap = new Map<string, any>();
        resultsArr.forEach(r => {
          const isDeleted = r?.deleted === true || r?.is_deleted === true || r?.isDeleted === true || !!r?.deleted_at;
          if (!isDeleted && r?.id) resMap.set(String(r.id), r);
        });
        resultsIdSet = new Set(Array.from(resMap.keys()));
      } catch (_) {
        // ignore fetch errors; we'll skip enrichment and filtering by results existence
      }

      // Filter out completed jobs whose result was deleted (not present in results list)
      const filtered = mapped.filter((item) => {
        const s = String(item.status).toLowerCase();
        if (s === 'completed' && item.result_id) {
          return resultsIdSet.size === 0 || resultsIdSet.has(String(item.result_id));
        }
        return true; // keep non-completed or items without result_id
      });

      // Case-insensitive generic check
      const GENERIC_TITLES_LC = new Set(Array.from(GENERIC_TITLES).map((s) => String(s).toLowerCase()));
      const isGeneric = (t: any) => GENERIC_TITLES_LC.has(String(t || '').trim().toLowerCase());

      // Enrich titles from results map for completed items still showing generic
      if (resultsArr.length > 0) {
        filtered.forEach((item, idx) => {
          if (!item.result_id) return;
          if (isGeneric(item.archetype) && String(item.status).toLowerCase() === 'completed') {
            const r = resMap.get(String(item.result_id));
            if (r) {
              const better = deriveTitle(r);
              if (better && !isGeneric(better)) {
                filtered[idx].archetype = better;
              }
            }
          }
        });
      }

      // For any remaining generics, try job detail but limit to 10 to minimize requests
      const stillGeneric = filtered
        .map((it, idx) => ({ it, idx }))
        .filter(({ it }) => isGeneric(it.archetype) && String(it.status).toLowerCase() === 'completed' && it.job_id)
        .slice(0, 10);
      if (stillGeneric.length > 0) {
        await Promise.all(
          stillGeneric.map(async ({ it, idx }) => {
            try {
              const j = await apiService.getJobById(it.job_id!);
              if (j?.success && j.data) {
                const better = deriveTitle(j.data);
                if (better && !isGeneric(better)) {
                  filtered[idx].archetype = better;
                }
              }
            } catch (_) {
              // ignore
            }
          })
        );
      }

      // Final cleanup: never show generic placeholders like "AI-Driven Talent Mapping"; use a neutral label instead
      const GENERIC_PLACEHOLDERS_LC = new Set(['assessment','ai-driven talent mapping','personality assessment','big five personality','riasec holland codes','via character strengths']);
      const cleaned = filtered.map(it => ({
        ...it,
        archetype: GENERIC_PLACEHOLDERS_LC.has(String(it.archetype || '').trim().toLowerCase()) ? 'Assessment' : it.archetype
      }));
      return cleaned;
    }

    // 3) Fallback ke results bila jobs kosong
    console.log('Archive API: Jobs API returned empty. Falling back to /archive/results...');
    const res = await apiService.getResults({ limit: 100, page: 1 } as any);
    let results: any[] = (res?.success && Array.isArray(res.data?.results)) ? res.data.results : [];
    // Exclude deleted results explicitly
    results = results.filter(r => !(r?.deleted === true || r?.is_deleted === true || r?.isDeleted === true || !!r?.deleted_at));
    return results.map((r: any, idx: number): AssessmentData => {
      const createdRaw = r.created_at || r.createdAt || r.createdAtUtc || r.updated_at || r.updatedAt || Date.now();
      const title = deriveTitle(r);
      return {
        id: idx + 1,
        archetype: (typeof title === 'string' && title.trim()) ? title : 'Assessment',
        created_at: toIso(createdRaw),
        status: String(r.status || r.assessment_data?.status || ''),
        result_id: r.id,
        assessment_name: r.assessment_name || r.assessmentData?.assessmentName
      };
    });
  } catch (error) {
    console.error('Archive API: Error fetching assessment history:', error);
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
    if (latest?.assessment_data?.riasec) {
      const riasec = latest.assessment_data.riasec as any;
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

