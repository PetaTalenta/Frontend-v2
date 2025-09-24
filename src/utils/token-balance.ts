import { apiService } from '../services/apiService';
import { TOKEN_CONFIG, hasEnoughTokensForAssessment, getInsufficientTokensMessage } from '../config/token-config';

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

    if (response && response.success === false) {
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

      // Return standardized error object instead of throwing to reduce noisy stacks
      return {
        balance: -1,
        hasEnoughTokens: false,
        message: userMessage,
        error: true,
      };
    }

    // Enhanced parsing with validation across multiple possible response shapes
    const candidates = [
      response?.data?.tokenBalance,
      response?.data?.balance,
      response?.data?.token_balance,
      response?.data?.tokens,
      response?.data?.user?.token_balance,
      response?.data?.user?.tokenBalance,
      response?.tokenBalance,
      response?.token_balance,
      response?.balance,
      response?.tokens,
      typeof response?.data === 'number' ? response.data : undefined,
      typeof response?.data === 'string' ? response.data : undefined,
    ];
    const firstValid = candidates.find(v =>
      (typeof v === 'number' && !Number.isNaN(v)) ||
      (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))
    );
    const balance = typeof firstValid === 'string' ? Number(firstValid) : firstValid as number;
    const lastUpdated = response?.data?.lastUpdated || response?.lastUpdated || new Date().toISOString();

    console.log('Token Balance Utility: Parsed data candidates:', {
      candidates,
      chosen: balance,
      lastUpdated,
      isValidBalance: typeof balance === 'number' && !isNaN(balance as number)
    });

    // Validate balance with safe fallback
    if (typeof balance !== 'number' || Number.isNaN(balance)) {
      console.warn('Token Balance Utility: Invalid balance value received, applying safe fallback 0:', balance);
      const safeBalance = 0;
      return {
        balance: safeBalance,
        hasEnoughTokens: hasEnoughTokensForAssessment(safeBalance),
        lastUpdated,
        message: getInsufficientTokensMessage(safeBalance),
        error: true,
      };
    }

    if (balance < 0) {
      console.warn('Token Balance Utility: Negative balance received:', balance);
    }

    const result = {
      balance,
      hasEnoughTokens: hasEnoughTokensForAssessment(balance),
      lastUpdated,
      message: hasEnoughTokensForAssessment(balance)
        ? `You have ${balance} tokens available.`
        : getInsufficientTokensMessage(balance),
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
 * @deprecated Token validation is now handled by backend
 */
export async function validateTokensForAssessment(): Promise<{
  canSubmit: boolean;
  tokenInfo: TokenBalanceInfo;
  errorMessage?: string;
}> {
  console.warn('validateTokensForAssessment is deprecated - token validation is now handled by backend');
  const tokenInfo = await checkTokenBalance();

  // Always allow submission - backend will handle token validation
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
    return `Insufficient token balance. You need at least ${TOKEN_CONFIG.MIN_TOKENS_FOR_ASSESSMENT} token to submit an assessment.`;
  }

  // Handle specific token-related errors
  if (error?.code === 'INSUFFICIENT_TOKENS') {
    return error?.message || 'Insufficient token balance for this operation.';
  }

  if (error?.message?.includes('token balance') || error?.message?.includes('INSUFFICIENT_TOKENS')) {
    return error.message;
  }

  return error?.message || 'An error occurred while processing your request.';
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


// ===== Quick Fix utilities migrated from token-balance-fixes.ts to reduce utils count =====
export interface FixResult {
  success: boolean;
  message: string;
  details?: any;
  nextSteps?: string[];
}

/**
 * Clear cache and refresh data (lightweight)
 */
export async function clearCacheAndRefresh(): Promise<FixResult> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tokenBalanceCache');
      if ('caches' in window) {
        try {
          const names = await caches.keys();
          await Promise.all(names.map(n => caches.delete(n)));
        } catch (e) {
          // ignore cache errors
        }
      }
    }
    return { success: true, message: 'Cache cleared successfully' };
  } catch (error) {
    return {
      success: false,
      message: 'Cache clear failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Fix authentication issues (basic checks)
 */
export async function fixAuthenticationIssues(): Promise<FixResult> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || !user) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return {
        success: false,
        message: 'Authentication data missing or corrupted',
        nextSteps: ['Please login again', 'Clear browser cache if issues persist']
      };
    }

    // Simple token format validation
    const isJWT = token.split('.').length === 3;
    const isMock = token.startsWith('mock-jwt-token-');
    if (!isJWT && !isMock) {
      return {
        success: false,
        message: 'Invalid token format detected',
        nextSteps: ['Token appears corrupted', 'Please login again']
      };
    }

    // Probe proxy endpoint
    const resp = await fetch('/api/proxy/auth/token-balance', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (resp.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return { success: false, message: 'Token expired or invalid', nextSteps: ['Please login again'] };
    }

    return { success: true, message: 'Authentication appears to be working correctly' };
  } catch (error) {
    return {
      success: false,
      message: 'Authentication fix failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Fix API endpoint connectivity
 */
export async function fixApiEndpointIssues(): Promise<FixResult> {
  try {
    const { getApiBaseUrl } = await import('./api-health');
    const baseUrl = await getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) {
        return { success: true, message: 'Real API is accessible', details: { baseUrl } };
      }
      return { success: false, message: 'Real API responded with error', details: { baseUrl, status: res.status } };
    } catch (e) {
      return {
        success: false,
        message: 'Real API not accessible',
        details: { baseUrl, error: e instanceof Error ? e.message : 'Unknown error' }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'API endpoint fix failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Force refresh token balance (diagnostic variant)
 */
export async function forceRefreshTokenBalanceFix(): Promise<FixResult> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return { success: false, message: 'No authentication token found', nextSteps: ['Please login again'] };
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('tokenBalanceCache');
    }

    const results = await Promise.allSettled([
      fetch('/api/proxy/auth/token-balance', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      checkTokenBalance()
    ]);

    const okCount = results.filter(r => r.status === 'fulfilled').length;
    return { success: okCount > 0, message: `Successfully refreshed from ${okCount}/2 sources`, details: results };
  } catch (error) {
    return { success: false, message: 'Force refresh failed', details: { error: error instanceof Error ? error.message : 'Unknown error' } };
  }
}

/**
 * Run all quick fixes
 */
export async function runAllQuickFixes(): Promise<{ results: { [k: string]: FixResult }; overallSuccess: boolean; summary: string; }> {
  const results = {
    authentication: await fixAuthenticationIssues(),
    apiEndpoints: await fixApiEndpointIssues(),
    forceRefresh: await forceRefreshTokenBalanceFix(),
    clearCache: await clearCacheAndRefresh()
  };
  const successCount = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  const overallSuccess = successCount > total / 2;
  const summary = `${successCount}/${total} fixes successful` + (overallSuccess ? ' - Token balance should be working now' : ' - Manual intervention may be required');
  return { results, overallSuccess, summary };
}
