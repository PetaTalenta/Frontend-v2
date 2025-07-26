// User Statistics Service
// Calculates real-time stats based on user's assessment data

import { StatCard } from '../types/dashboard';
import { AssessmentResult } from '../types/assessment-results';
import { getUserAssessmentResults } from './assessment-api';

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
 */
export async function calculateUserStats(userId?: string): Promise<UserStats> {
  try {
    console.log(`UserStats: Calculating stats for user: ${userId || 'anonymous'}`);

    // Get user's assessment results (only real user data, no demo data)
    const assessmentResults = await getUserAssessmentResults(userId);
    console.log(`UserStats: Found ${assessmentResults.length} assessment results for user`);

    // Filter results to only include those belonging to this specific user
    const userSpecificResults = userId
      ? assessmentResults.filter(result => result.userId === userId)
      : assessmentResults;

    console.log(`UserStats: User-specific results: ${userSpecificResults.length}`);

    // Calculate stats based on real user activity
    const totalAnalysis = userSpecificResults.length;
    const completed = userSpecificResults.filter(result => result.status === 'completed').length;
    const processing = userSpecificResults.filter(result =>
      result.status === 'processing' || result.status === 'queued'
    ).length;

    // Calculate token balance based on user activity
    // Base tokens: 10, +5 for each completed assessment, -2 for each processing
    const baseTokens = 10;
    const completedBonus = completed * 5;
    const processingCost = processing * 2;
    const tokenBalance = Math.max(0, baseTokens + completedBonus - processingCost);

    console.log(`UserStats: Calculated stats - Total: ${totalAnalysis}, Completed: ${completed}, Processing: ${processing}, Tokens: ${tokenBalance}`);

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
 */
export function formatStatsForDashboard(userStats: UserStats): StatCard[] {
  return [
    {
      id: "analysis",
      value: userStats.totalAnalysis,
      label: "Total Analysis",
      color: "#dbeafe",
      icon: "MagnifyingGlass.svg"
    },
    {
      id: "completed",
      value: userStats.completed,
      label: "Completed",
      color: "#dbfce7",
      icon: "Check.svg"
    },
    {
      id: "processing",
      value: userStats.processing,
      label: "Processing",
      color: "#dbeafe",
      icon: "Cpu.svg"
    },
    {
      id: "balance",
      value: userStats.tokenBalance,
      label: "Token Balance",
      color: "#f3e8ff",
      icon: "Command.svg"
    }
  ];
}

/**
 * Get user's assessment history for the assessment table
 */
export function formatAssessmentHistory(userStats: UserStats) {
  // Get assessment history from localStorage (newly completed assessments)
  const localHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');

  // Combine with existing assessment results
  const assessmentHistory = userStats.assessmentResults.map((result, index) => ({
    id: index + 1,
    nama: result.persona_profile.title,
    tipe: "Personality Assessment",
    tanggal: new Date(result.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    status: result.status === 'completed' ? "Selesai" : "Belum Selesai",
    resultId: result.id
  }));

  // Update local history items with persona profile titles if available
  const updatedLocalHistory = localHistory.map((item: any) => {
    if (item.resultId && item.status === "Selesai") {
      // Try to get the assessment result to extract persona profile title
      const assessmentResult = JSON.parse(localStorage.getItem(`assessment-result-${item.resultId}`) || '{}');
      if (assessmentResult.persona_profile?.title) {
        return {
          ...item,
          nama: assessmentResult.persona_profile.title
        };
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
export function calculateUserProgress(userStats: UserStats) {
  // Get the most recent completed assessment
  const latestAssessment = userStats.assessmentResults
    .filter(result => result.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latestAssessment) {
    // Return default progress if no completed assessments
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
  
  return [
    { label: "Investigative", value: riasec.investigative },
    { label: "Arts", value: riasec.artistic },
    { label: "Practical", value: riasec.realistic },
    { label: "Social", value: riasec.social },
    { label: "Leadership", value: riasec.enterprising },
    { label: "Analytical", value: riasec.conventional },
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
