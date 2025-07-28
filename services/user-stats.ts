// User Statistics Service
// Calculates real-time stats based on user's assessment data

import { StatCard } from '../types/dashboard';
import { AssessmentResult } from '../types/assessment-results';
import { getUserAssessmentResults } from './assessment-api';
import { checkTokenBalance } from '../utils/token-balance';

export interface UserStats {
  totalAnalysis: number;
  completed: number;
  processing: number;
  tokenBalance: number;
  assessmentResults: AssessmentResult[];
}

/**
 * Initialize demo data for new users (DISABLED for real user stats)
 * This function is now disabled to ensure each user gets personalized statistics
 * based on their actual assessment activity, not demo data.
 */
async function initializeDemoData(userId: string): Promise<void> {
  // Demo data initialization is disabled to ensure personalized user statistics
  // Users will start with clean slate and build their stats through actual usage
  console.log(`UserStats: Demo data initialization disabled for user ${userId} - using real user activity only`);
  return;
}

/**
 * Calculate user statistics based on their assessment data
 * Now uses the same Archive Service API as the assessment table for consistency
 */
export async function calculateUserStats(userId?: string): Promise<UserStats> {
  try {
    console.log(`UserStats: Calculating stats for user: ${userId || 'anonymous'}`);

    // First try to get data from Archive Service API (same source as assessment table)
    let assessmentHistory: any[] = [];
    try {
      console.log('UserStats: Fetching assessment data from Archive Service API...');
      assessmentHistory = await fetchAssessmentHistoryFromAPI();
      console.log(`UserStats: Found ${assessmentHistory.length} assessments from Archive API`);
      console.log('UserStats: Assessment history data:', assessmentHistory);
    } catch (error) {
      console.error('UserStats: Failed to fetch from Archive API, falling back to localStorage:', error);
    }

    // Fallback to localStorage if API fails or returns no data
    let userSpecificResults: AssessmentResult[] = [];
    if (assessmentHistory.length === 0) {
      console.log('UserStats: Using localStorage fallback for assessment data');
      const localResults = await getUserAssessmentResults(userId);
      userSpecificResults = userId
        ? localResults.filter(result => result.userId === userId)
        : localResults;
      console.log(`UserStats: Found ${userSpecificResults.length} results from localStorage`);
    }

    // Calculate statistics based on Archive API data if available
    let totalAnalysis = 0;
    let completed = 0;
    let processing = 0;

    if (assessmentHistory.length > 0) {
      // Use Archive API data (same as assessment table)
      totalAnalysis = assessmentHistory.length;
      completed = assessmentHistory.filter(item => item.status === "Selesai").length;
      processing = assessmentHistory.filter(item => item.status === "Belum Selesai").length;
      console.log(`UserStats: Using Archive API data - Total: ${totalAnalysis}, Completed: ${completed}, Processing: ${processing}`);
      console.log('UserStats: Sample assessment items:', assessmentHistory.slice(0, 3));
    } else {
      // Fallback to localStorage data
      totalAnalysis = userSpecificResults.length;
      completed = userSpecificResults.filter(result => result.status === 'completed').length;
      processing = userSpecificResults.filter(result =>
        result.status === 'processing' || result.status === 'queued'
      ).length;
      console.log(`UserStats: Using localStorage data - Total: ${totalAnalysis}, Completed: ${completed}, Processing: ${processing}`);
    }

    // Get real token balance from API
    let tokenBalance = 0;
    try {
      console.log('UserStats: Fetching real token balance from API...');
      const tokenInfo = await checkTokenBalance();
      tokenBalance = tokenInfo.error ? 0 : tokenInfo.balance;
      console.log(`UserStats: Real token balance from API: ${tokenBalance}`);
    } catch (error) {
      console.error('UserStats: Failed to get real token balance, using fallback calculation:', error);
      // Fallback to calculated balance if API fails
      const baseTokens = 10;
      const completedBonus = completed * 5;
      const processingCost = processing * 2;
      tokenBalance = Math.max(0, baseTokens + completedBonus - processingCost);
      console.log(`UserStats: Using fallback calculated balance: ${tokenBalance}`);
    }

    console.log(`UserStats: Final stats - Total: ${totalAnalysis}, Completed: ${completed}, Processing: ${processing}, Tokens: ${tokenBalance}`);

    return {
      totalAnalysis,
      completed,
      processing,
      tokenBalance,
      assessmentResults: userSpecificResults
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);

    // Return default stats if error occurs (clean slate for new users)
    return {
      totalAnalysis: 0,
      completed: 0,
      processing: 0,
      tokenBalance: 10, // Default starting tokens for new users
      assessmentResults: []
    };
  }
}

/**
 * Convert user stats to StatCard format for dashboard display
 * Uses actual calculated values from userStats
 */
export function formatStatsForDashboard(userStats: UserStats): StatCard[] {
  // Use the actual calculated values from userStats
  const totalAnalysis = userStats.totalAnalysis;
  const completed = userStats.completed;
  const processing = userStats.processing;

  console.log(`formatStatsForDashboard: Using actual calculated values - Total: ${totalAnalysis}, Completed: ${completed}, Processing: ${processing}`);

  return [
    {
      id: "analysis",
      value: totalAnalysis,
      label: "Total Asesmen",
      color: "#dbeafe",
      icon: "MagnifyingGlass.svg"
    },
    {
      id: "completed",
      value: completed,
      label: "Selesai",
      color: "#dbfce7",
      icon: "Check.svg"
    },
    {
      id: "processing",
      value: processing,
      label: "Proses",
      color: "#dbeafe",
      icon: "Cpu.svg"
    },
    {
      id: "balance",
      value: userStats.tokenBalance,
      label: "Saldo Token",
      color: "#f3e8ff",
      icon: "Command.svg"
    }
  ];
}

/**
 * Fetch assessment history from Archive Service API
 */
export async function fetchAssessmentHistoryFromAPI() {
  try {
    console.log('Archive API: Starting to fetch assessment history...');
    const { apiService } = await import('./apiService');

    // First, get the first page to understand total count
    console.log('Archive API: Calling apiService.getResults for first page...');
    const firstResponse = await apiService.getResults({
      limit: 100,
      page: 1,
      sort: 'created_at',
      order: 'DESC'
    });

    console.log('Archive API: First response received:', firstResponse);

    if (!firstResponse.success || !firstResponse.data?.results) {
      console.warn('Archive API: No results found or invalid response');
      console.warn('Archive API: Response details:', { success: firstResponse.success, hasData: !!firstResponse.data, hasResults: !!firstResponse.data?.results });
      return [];
    }

    let allResults = [...firstResponse.data.results];

    // Check if we need to fetch more pages
    if (firstResponse.data.pagination) {
      const { total, totalPages, page: currentPage } = firstResponse.data.pagination;
      console.log('Archive API: Pagination info:', firstResponse.data.pagination);
      console.log(`Archive API: Fetched ${allResults.length} out of ${total} total results from page ${currentPage} of ${totalPages}`);

      // Fetch remaining pages if needed
      if (totalPages > 1) {
        console.log(`Archive API: Fetching remaining ${totalPages - 1} pages...`);

        for (let page = 2; page <= totalPages; page++) {
          console.log(`Archive API: Fetching page ${page}...`);
          const pageResponse = await apiService.getResults({
            limit: 100,
            page: page,
            sort: 'created_at',
            order: 'DESC'
          });

          if (pageResponse.success && pageResponse.data?.results) {
            allResults.push(...pageResponse.data.results);
            console.log(`Archive API: Page ${page} fetched, total results so far: ${allResults.length}`);
          } else {
            console.warn(`Archive API: Failed to fetch page ${page}`);
          }
        }

        console.log(`Archive API: Successfully fetched all ${allResults.length} results from ${totalPages} pages`);
      }
    }

    // Log sample data to understand the structure
    console.log('Archive API: Sample result data:', allResults.slice(0, 2));

    // Transform API data to match AssessmentData interface
    const assessmentHistory = allResults.map((result: any, index: number) => {
      let personaTitle = 'Assessment Result';

      // First, try to get persona title from localStorage (most accurate for recent assessments)
      if (typeof window !== 'undefined' && result.id) {
        try {
          const localResult = localStorage.getItem(`assessment-result-${result.id}`);
          if (localResult) {
            const parsedLocal = JSON.parse(localResult);
            if (parsedLocal.persona_profile?.title) {
              personaTitle = parsedLocal.persona_profile.title;
              console.log(`Archive API: Assessment ${result.id} - Using localStorage persona title: "${personaTitle}"`);
            }
          }
        } catch (error) {
          console.warn(`Archive API: Error reading localStorage for ${result.id}:`, error);
        }
      }

      // If not found in localStorage, use API data as fallback
      if (personaTitle === 'Assessment Result') {
        personaTitle = result.persona_profile?.title || result.persona_profile?.archetype || 'Assessment Result';
        console.log(`Archive API: Assessment ${result.id} - Using API persona title: "${personaTitle}" (from ${result.persona_profile?.title ? 'title' : result.persona_profile?.archetype ? 'archetype' : 'fallback'})`);
      }

      return {
        id: index + 1,
        nama: personaTitle,
        tipe: "Personality Assessment" as const,
        tanggal: new Date(result.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        status: result.status === 'completed' ? "Selesai" as const : "Belum Selesai" as const,
        resultId: result.id
      };
    });

    console.log('Archive API: Successfully fetched assessment history:', assessmentHistory.length, 'items');
    return assessmentHistory;
  } catch (error) {
    console.error('Archive API: Error fetching assessment history:', error);
    // Return empty array on error - the dashboard will handle fallback
    return [];
  }
}

/**
 * Get the latest completed assessment with full data from Archive API
 */
export async function getLatestAssessmentFromArchive() {
  try {
    console.log('Archive API: Fetching latest assessment with full data...');
    const { apiService } = await import('./apiService');

    // First get the list of assessments to find the latest completed one
    const response = await apiService.getResults({
      limit: 10, // Only need the most recent ones
      status: 'completed', // Only get completed assessments
      // @ts-ignore - sort and order are supported by the API but not in the type definition
      sort: 'created_at',
      order: 'DESC'
    });

    if (!response.success || !response.data?.results || response.data.results.length === 0) {
      console.log('Archive API: No completed assessments found');
      return null;
    }

    // Get the latest completed assessment
    const latestResult = response.data.results[0];
    console.log('Archive API: Found latest assessment:', latestResult.id);

    // Fetch the complete assessment data by ID
    const fullResultResponse = await apiService.getResultById(latestResult.id);

    if (!fullResultResponse.success) {
      throw new Error(`Failed to fetch full result: ${fullResultResponse.message}`);
    }

    const fullResult = fullResultResponse.data;
    console.log('Archive API: Successfully fetched full assessment data');
    console.log('Archive API: RIASEC data available:', !!fullResult.assessment_data?.riasec);

    return fullResult;

  } catch (error) {
    console.error('Archive API: Failed to fetch latest assessment:', error);
    throw error;
  }
}

/**
 * Get assessment result from API (same source as assessment table)
 * This ensures consistency between card profil kepribadian and table riwayat
 */
export async function getAssessmentResultFromAPI(resultId: string): Promise<any> {
  try {
    console.log(`API: Getting assessment result for ID: ${resultId}`);
    const { apiService } = await import('./apiService');

    const response = await apiService.getResults({
      limit: 100,
      page: 1,
      status: 'completed',
      // @ts-ignore - jobId is optional but required in type definition
      jobId: ''
    });

    if (response.success && response.data?.results) {
      // Find the specific result by ID
      const result = response.data.results.find((r: any) => r.id === resultId);

      if (result) {
        console.log(`API: Found assessment result: ${result.persona_profile?.title || result.persona_profile?.archetype}`);
        return result;
      }
    }

    throw new Error(`Assessment result with ID ${resultId} not found in API`);
  } catch (error) {
    console.error(`API: Error fetching assessment result ${resultId}:`, error);
    throw error;
  }
}

/**
 * Get user's assessment history for the assessment table
 * Now uses Archive Service API instead of localStorage
 */
export async function formatAssessmentHistory(userStats: UserStats) {
  // First try to get data from the Archive Service API
  const apiHistory = await fetchAssessmentHistoryFromAPI();

  if (apiHistory.length > 0) {
    console.log('Using assessment history from Archive Service API');
    return apiHistory;
  }

  // Fallback to localStorage if API fails or returns no data
  console.warn('Falling back to localStorage for assessment history');
  const localHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');

  // Combine with existing assessment results from userStats
  const assessmentHistory = userStats.assessmentResults.map((result, index) => ({
    id: index + 1,
    nama: result.persona_profile.title,
    tipe: "Personality Assessment" as const,
    tanggal: new Date(result.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    status: result.status === 'completed' ? "Selesai" as const : "Belum Selesai" as const,
    resultId: result.id
  }));

  // Update local history items with persona profile titles if available
  const updatedLocalHistory = localHistory.map((item: any) => {
    if (item.resultId && item.status === "Selesai") {
      // Try to get the assessment result to extract persona profile title
      const assessmentResult = JSON.parse(localStorage.getItem(`assessment-result-${item.resultId}`) || '{}');
      if (assessmentResult.persona_profile?.title) {
        console.log(`LocalStorage: Assessment ${item.resultId} - Updated nama from "${item.nama}" to "${assessmentResult.persona_profile.title}"`);
        return {
          ...item,
          nama: assessmentResult.persona_profile.title
        };
      } else {
        console.log(`LocalStorage: Assessment ${item.resultId} - No persona profile title found, keeping original nama: "${item.nama}"`);
      }
    }
    return item;
  });

  // Add updated local history items
  const combinedHistory = [...updatedLocalHistory, ...assessmentHistory];

  // Remove duplicates based on resultId and sort by date (newest first)
  const uniqueHistory = combinedHistory.filter((item, index, self) =>
    index === self.findIndex(t => t.resultId === item.resultId)
  ).sort((a, b) => {
    // Convert tanggal back to Date for sorting
    const dateA = new Date(a.tanggal.split(' ').reverse().join('-'));
    const dateB = new Date(b.tanggal.split(' ').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  return uniqueHistory;
}

/**
 * Calculate progress data based on user's latest assessment
 */
export async function calculateUserProgress(userStats: UserStats) {
  console.log('UserProgress: Starting calculation...');

  try {
    // First try to get the latest assessment from Archive API
    const archiveAssessment = await getLatestAssessmentFromArchive();

    if (archiveAssessment && archiveAssessment.assessment_data?.riasec) {
      console.log('UserProgress: Using Archive API data for RIASEC scores');
      const riasec = archiveAssessment.assessment_data.riasec;

      return [
        { label: "Investigative", value: riasec.investigative || 0 },
        { label: "Arts", value: riasec.artistic || 0 },
        { label: "Practical", value: riasec.realistic || 0 },
        { label: "Social", value: riasec.social || 0 },
        { label: "Leadership", value: riasec.enterprising || 0 },
        { label: "Analytical", value: riasec.conventional || 0 },
      ];
    }
  } catch (error) {
    console.error('UserProgress: Failed to fetch from Archive API, falling back to localStorage:', error);
  }

  // Fallback to localStorage data
  console.log('UserProgress: Using localStorage fallback data');
  const latestAssessment = userStats.assessmentResults
    .filter(result => result.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latestAssessment) {
    // Return default progress if no completed assessments
    console.log('UserProgress: No completed assessments found, returning default values');
    return [
      { label: "Investigative", value: 0 },
      { label: "Arts", value: 0 },
      { label: "Practical", value: 0 },
      { label: "Social", value: 0 },
      { label: "Leadership", value: 0 },
      { label: "Analytical", value: 0 },
    ];
  }

  // Extract RIASEC scores from the latest assessment
  const riasec = latestAssessment.assessment_data.riasec;
  console.log('UserProgress: Using localStorage assessment data:', riasec);

  return [
    { label: "Investigative", value: riasec.investigative || 0 },
    { label: "Arts", value: riasec.artistic || 0 },
    { label: "Practical", value: riasec.realistic || 0 },
    { label: "Social", value: riasec.social || 0 },
    { label: "Leadership", value: riasec.enterprising || 0 },
    { label: "Analytical", value: riasec.conventional || 0 },
  ];
}

/**
 * Clear all assessment data for a specific user
 * This ensures clean statistics for each user account
 */
export function clearUserAssessmentData(userId: string): void {
  if (typeof window === 'undefined') return;

  console.log(`UserStats: Clearing assessment data for user: ${userId}`);

  const keysToRemove: string[] = [];

  // Find all assessment result keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('assessment-result-')) {
      try {
        const result = JSON.parse(localStorage.getItem(key)!);
        if (result.userId === userId) {
          keysToRemove.push(key);
        }
      } catch (error) {
        console.error(`UserStats: Error parsing result from key ${key}:`, error);
      }
    }
  }

  // Remove user-specific assessment data
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`UserStats: Removed ${key}`);
  });

  console.log(`UserStats: Cleared ${keysToRemove.length} assessment results for user ${userId}`);
}

/**
 * Clear all demo/mock assessment data
 * This removes any leftover demo data that might affect user statistics
 */
export function clearDemoAssessmentData(): void {
  if (typeof window === 'undefined') return;

  console.log('UserStats: Clearing demo assessment data...');

  const keysToRemove: string[] = [];

  // Find all demo/mock assessment result keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('assessment-result-')) {
      try {
        const result = JSON.parse(localStorage.getItem(key)!);
        // Remove demo results, mock results, or results without proper user IDs
        if (result.id?.includes('demo-') ||
            result.id?.includes('mock-') ||
            result.id?.includes('result-001') ||
            result.id?.includes('result-002') ||
            result.userId === 'current-user' ||
            result.userId === 'demo-user') {
          keysToRemove.push(key);
        }
      } catch (error) {
        console.error(`UserStats: Error parsing result from key ${key}:`, error);
      }
    }
  }

  // Remove demo assessment data
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`UserStats: Removed demo data ${key}`);
  });

  console.log(`UserStats: Cleared ${keysToRemove.length} demo assessment results`);
}

/**
 * Get user activity summary
 */
export function getUserActivitySummary(userStats: UserStats) {
  const totalAssessments = userStats.totalAnalysis;
  const completionRate = totalAssessments > 0 ?
    Math.round((userStats.completed / totalAssessments) * 100) : 0;

  const lastAssessment = userStats.assessmentResults
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const lastAssessmentDate = lastAssessment ?
    new Date(lastAssessment.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : 'Never';

  return {
    totalAssessments,
    completionRate,
    lastAssessmentDate,
    tokensEarned: userStats.completed * 5,
    tokensSpent: userStats.processing * 2,
    currentBalance: userStats.tokenBalance
  };
}

/**
 * Simulate adding a new assessment (for demo purposes)
 */
export async function simulateNewAssessment(userId?: string): Promise<string> {
  // This would typically call the actual assessment API
  // For demo, we'll create a mock result and store it
  const resultId = 'result-' + Date.now().toString(36);
  
  // Store in localStorage for demo
  const mockResult = {
    id: resultId,
    userId: userId || 'current-user',
    createdAt: new Date().toISOString(),
    status: 'processing',
    assessment_data: {
      riasec: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 },
      ocean: { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
      viaIs: {} // Empty for processing status
    },
    persona_profile: {
      title: 'Assessment in Progress',
      description: 'Your assessment is being processed...',
      strengths: [],
      recommendations: [],
      careerRecommendation: [],
      roleModel: []
    }
  };
  
  localStorage.setItem(`assessment-result-${resultId}`, JSON.stringify(mockResult));
  
  return resultId;
}

/**
 * Update assessment status (for demo purposes)
 */
export async function updateAssessmentStatus(resultId: string, status: 'completed' | 'failed'): Promise<void> {
  const stored = localStorage.getItem(`assessment-result-${resultId}`);
  if (stored) {
    const result = JSON.parse(stored);
    result.status = status;
    
    if (status === 'completed') {
      // Add some mock data for completed assessment
      result.assessment_data = {
        riasec: {
          realistic: Math.floor(Math.random() * 100),
          investigative: Math.floor(Math.random() * 100),
          artistic: Math.floor(Math.random() * 100),
          social: Math.floor(Math.random() * 100),
          enterprising: Math.floor(Math.random() * 100),
          conventional: Math.floor(Math.random() * 100)
        },
        ocean: {
          openness: Math.floor(Math.random() * 100),
          conscientiousness: Math.floor(Math.random() * 100),
          extraversion: Math.floor(Math.random() * 100),
          agreeableness: Math.floor(Math.random() * 100),
          neuroticism: Math.floor(Math.random() * 100)
        },
        viaIs: {} // Simplified for demo
      };
      
      result.persona_profile = {
        title: 'The Dynamic Achiever',
        description: 'A well-rounded individual with strong potential for growth.',
        strengths: ['Adaptability', 'Problem Solving', 'Communication'],
        recommendations: ['Explore leadership roles', 'Develop technical skills'],
        careerRecommendation: [{
          careerName: 'Business Analyst',
          careerProspect: {
            jobAvailability: 'high',
            salaryPotential: 'high',
            careerProgression: 'high',
            industryGrowth: 'high',
            skillDevelopment: 'high'
          },
          matchPercentage: 85
        }],
        roleModel: ['Steve Jobs', 'Oprah Winfrey']
      };
    }
    
    localStorage.setItem(`assessment-result-${resultId}`, JSON.stringify(result));
  }
}
