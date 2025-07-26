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
 * Check user's current token balance with enhanced error handling and debugging
 */
export async function checkTokenBalance(): Promise<TokenBalanceInfo> {
  console.log('Token Balance Utility: Starting token balance check...');

  try {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token Balance Utility: No authentication token found');
      return {
        balance: -1,
        hasEnoughTokens: false,
        message: 'Authentication required. Please login again.',
        error: true,
      };
    }

    console.log('Token Balance Utility: Calling API service...');
    const response = await apiService.getTokenBalance();

    console.log('Token Balance Utility: API response received:', {
      success: response.success,
      hasData: !!response.data,
      apiSource: response.apiSource,
      errorCode: response.error?.code
    });

    if (!response.success) {
      const errorMessage = response.error?.message || 'Failed to fetch token balance';
      console.error('Token Balance Utility: API request failed:', errorMessage);

      // Provide more specific error messages based on error codes
      let userMessage = errorMessage;
      if (response.error?.code === 'NETWORK_ERROR') {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (response.error?.code === 'REQUEST_FAILED') {
        userMessage = 'Server error. Please try again in a moment.';
      } else if (response.error?.code === 'MISSING_AUTHORIZATION') {
        userMessage = 'Authentication expired. Please login again.';
      }

      throw new Error(userMessage);
    }

    // Enhanced parsing with validation
    const balance = response.data?.tokenBalance;
    const lastUpdated = response.data?.lastUpdated;

    console.log('Token Balance Utility: Parsed data:', {
      balance,
      lastUpdated,
      balanceType: typeof balance,
      isValidBalance: typeof balance === 'number' && !isNaN(balance)
    });

    // Validate balance
    if (typeof balance !== 'number' || isNaN(balance)) {
      console.error('Token Balance Utility: Invalid balance value received:', balance);
      throw new Error('Invalid token balance data received from server');
    }

    if (balance < 0) {
      console.warn('Token Balance Utility: Negative balance received:', balance);
    }

    const result = {
      balance,
      hasEnoughTokens: balance >= 2,
      lastUpdated,
      message: balance >= 2
        ? `You have ${balance} tokens available.`
        : `Insufficient tokens. You have ${balance} tokens but need at least 2 to submit an assessment.`,
      error: false,
    };

    console.log('Token Balance Utility: Final result:', result);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error loading token balance';
    console.error('Token Balance Utility: Check failed:', errorMessage);
    console.error('Token Balance Utility: Error details:', error);

    return {
      balance: -1,
      hasEnoughTokens: false,
      message: errorMessage,
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

/**
 * Force refresh token balance with cache busting and enhanced debugging
 */
export async function forceRefreshTokenBalance(): Promise<TokenBalanceInfo> {
  console.log('=== FORCE REFRESH TOKEN BALANCE ===');

  // Clear all possible caches
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tokenBalanceCache');
    console.log('Cleared localStorage cache');
  }

  // Add a small delay to ensure any pending requests complete
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    console.log('Starting force refresh...');
    const result = await checkTokenBalance();
    console.log('Force refresh completed:', result);
    return result;
  } catch (error) {
    console.error('Force refresh failed:', error);
    throw error;
  }
}

/**
 * Clear all token-related caches and force complete refresh
 */
export async function clearAllCachesAndRefresh(): Promise<TokenBalanceInfo> {
  console.log('=== CLEARING ALL CACHES AND REFRESHING ===');

  if (typeof window !== 'undefined') {
    // Clear all possible cache keys
    const cacheKeys = [
      'tokenBalanceCache',
      'apiHealthCache',
      'userStatsCache',
      'assessmentCache'
    ];

    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared ${key}`);
    });
  }

  // Wait a bit longer to ensure all pending requests are done
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    console.log('Starting complete refresh...');
    const result = await checkTokenBalance();
    console.log('Complete refresh finished:', result);
    return result;
  } catch (error) {
    console.error('Complete refresh failed:', error);
    throw error;
  }
}

/**
 * Test direct API call to debug token balance issues
 */
export async function testDirectTokenBalanceCall(): Promise<any> {
  console.log('=== TESTING DIRECT API CALL ===');

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    // Test proxy endpoint with minimal headers to avoid CORS
    console.log('Testing proxy endpoint...');
    const proxyResponse = await fetch('/api/proxy/auth/token-balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const proxyData = await proxyResponse.json();
    console.log('Proxy response:', {
      status: proxyResponse.status,
      ok: proxyResponse.ok,
      headers: Object.fromEntries(proxyResponse.headers.entries()),
      data: proxyData
    });

    return {
      proxy: {
        status: proxyResponse.status,
        ok: proxyResponse.ok,
        data: proxyData
      }
    };

  } catch (error) {
    console.error('Direct API test failed:', error);
    throw error;
  }
}

/**
 * Test token balance with simple fetch to bypass all abstractions
 */
export async function testSimpleTokenBalance(): Promise<any> {
  console.log('=== TESTING SIMPLE TOKEN BALANCE ===');

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    console.log('Making simple fetch request...');
    const response = await fetch('/api/proxy/auth/token-balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);

    return data;

  } catch (error) {
    console.error('Simple test failed:', error);
    throw error;
  }
}
