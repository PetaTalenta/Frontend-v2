import { apiService } from '../services/apiService';

export interface TokenBalanceInfo {
  balance: number;
  hasEnoughTokens: boolean;
  message: string;
  lastUpdated?: string;
  error?: boolean;
}

export interface TokenTransaction {
  type: 'deduction' | 'bonus';
  amount: number;
  reason: string;
  previousBalance: number;
  newBalance: number;
  timestamp: string;
}

/**
 * Check user's current token balance with enhanced error handling
 */
export async function checkTokenBalance(): Promise<TokenBalanceInfo> {
  try {
    const response = await apiService.getTokenBalance();

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch token balance');
    }

    // Handle both real API format (tokenBalance) and mock API format (balance)
    const balance = response.data?.tokenBalance || response.data?.balance || 0;
    const lastUpdated = response.data?.lastUpdated;

    console.log('Token balance check result:', { balance, lastUpdated });

    return {
      balance,
      hasEnoughTokens: balance >= 2,
      lastUpdated,
      message: balance >= 2
        ? `You have ${balance} tokens available.`
        : `Insufficient tokens. You have ${balance} tokens but need at least 2 to submit an assessment.`,
      error: false,
    };
  } catch (error) {
    console.error('Error checking token balance:', error);

    // Return error state but don't block the user completely
    return {
      balance: -1,
      hasEnoughTokens: false,
      message: 'Could not check token balance. Please try again or contact support.',
      error: true,
    };
  }
}

/**
 * Check if user has enough tokens for assessment submission
 */
export async function validateTokensForAssessment(): Promise<{
  canSubmit: boolean;
  tokenInfo: TokenBalanceInfo;
  errorMessage?: string;
}> {
  const tokenInfo = await checkTokenBalance();

  if (tokenInfo.error) {
    return {
      canSubmit: false,
      tokenInfo,
      errorMessage: 'Unable to verify token balance. Please check your connection and try again.',
    };
  }

  if (!tokenInfo.hasEnoughTokens) {
    return {
      canSubmit: false,
      tokenInfo,
      errorMessage: `Insufficient tokens. You need at least 2 tokens to submit an assessment, but you only have ${tokenInfo.balance} tokens.`,
    };
  }

  return {
    canSubmit: true,
    tokenInfo,
  };
}

/**
 * Display user-friendly error message for token balance issues
 */
export function getTokenBalanceErrorMessage(error: any): string {
  // Handle 402 Payment Required status
  if (error.response?.status === 402 || error.status === 402) {
    const details = error.response?.data?.error?.details || error.details;
    if (details) {
      return `Insufficient token balance. You have ${details.currentBalance} tokens but need ${details.requiredTokens} tokens to submit an assessment.`;
    }
    return 'Insufficient token balance. You need at least 2 tokens to submit an assessment.';
  }

  // Handle specific token-related errors
  if (error.code === 'INSUFFICIENT_TOKENS') {
    return error.message || 'Insufficient token balance for this operation.';
  }

  if (error.message?.includes('token balance') || error.message?.includes('INSUFFICIENT_TOKENS')) {
    return error.message;
  }

  return error.message || 'An error occurred while processing your request.';
}

/**
 * Format token transaction for display
 */
export function formatTokenTransaction(transaction: TokenTransaction): string {
  const { type, amount, reason, newBalance } = transaction;
  const action = type === 'deduction' ? 'deducted' : 'awarded';
  return `${amount} tokens ${action} for ${reason}. New balance: ${newBalance} tokens.`;
}
