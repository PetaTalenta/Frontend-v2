/**
 * Token Economy Configuration
 * Centralized configuration for token costs and rewards
 */

export const TOKEN_CONFIG = {
  // Assessment costs
  ASSESSMENT_COST: 1, // Cost per assessment submission
  
  // Token rewards
  COMPLETION_REWARD: 5, // Tokens earned per completed assessment
  
  // Starting balance
  STARTING_BALANCE: 10, // Initial tokens for new users
  
  // Minimum balance
  MINIMUM_BALANCE: 0, // Prevents negative tokens
  
  // Validation
  MIN_TOKENS_FOR_ASSESSMENT: 1, // Minimum tokens required to submit assessment
} as const;

/**
 * Calculate token balance using the standard formula
 */
export function calculateTokenBalance(
  completedAssessments: number,
  processingAssessments: number
): number {
  const balance = TOKEN_CONFIG.STARTING_BALANCE + 
    (completedAssessments * TOKEN_CONFIG.COMPLETION_REWARD) - 
    (processingAssessments * TOKEN_CONFIG.ASSESSMENT_COST);
  
  return Math.max(balance, TOKEN_CONFIG.MINIMUM_BALANCE);
}

/**
 * Check if user has enough tokens for assessment
 */
export function hasEnoughTokensForAssessment(balance: number): boolean {
  return balance >= TOKEN_CONFIG.MIN_TOKENS_FOR_ASSESSMENT;
}

/**
 * Get token cost message
 */
export function getTokenCostMessage(): string {
  return `Assessment costs ${TOKEN_CONFIG.ASSESSMENT_COST} token${TOKEN_CONFIG.ASSESSMENT_COST > 1 ? 's' : ''}`;
}

/**
 * Get insufficient tokens message
 */
export function getInsufficientTokensMessage(currentBalance: number): string {
  return `Insufficient tokens. You have ${currentBalance} token${currentBalance !== 1 ? 's' : ''} but need at least ${TOKEN_CONFIG.MIN_TOKENS_FOR_ASSESSMENT} token${TOKEN_CONFIG.MIN_TOKENS_FOR_ASSESSMENT > 1 ? 's' : ''} to submit an assessment.`;
}
