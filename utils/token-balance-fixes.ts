/**
 * Quick fixes for common token balance issues
 */

import { checkTokenBalance } from './token-balance';
import { getApiBaseUrl } from './api-health';

export interface FixResult {
  success: boolean;
  message: string;
  details?: any;
  nextSteps?: string[];
}

/**
 * Force refresh token balance from all sources
 */
export async function forceRefreshTokenBalance(): Promise<FixResult> {
  try {
    console.log('🔄 Force refreshing token balance...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        nextSteps: ['Please login again']
      };
    }

    // Clear any cached data
    localStorage.removeItem('tokenBalanceCache');
    
    // Test all endpoints (Mock API removed)
    const results = await Promise.allSettled([
      fetch('/api/proxy/auth/token-balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),

      checkTokenBalance()
    ]);

    const successful = results.filter(r => r.status === 'fulfilled');

    if (successful.length > 0) {
      return {
        success: true,
        message: `Successfully refreshed from ${successful.length}/2 sources`,
        details: results
      };
    } else {
      return {
        success: false,
        message: 'All refresh attempts failed',
        details: results,
        nextSteps: [
          'Check network connection',
          'Verify token validity',
          'Try re-login'
        ]
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Force refresh failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Fix authentication issues
 */
export async function fixAuthenticationIssues(): Promise<FixResult> {
  try {
    console.log('🔐 Fixing authentication issues...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return {
        success: false,
        message: 'Authentication data missing or corrupted',
        nextSteps: [
          'Please login again',
          'Clear browser cache if issues persist'
        ]
      };
    }

    // Validate token format
    if (token.split('.').length !== 3 && !token.startsWith('mock-jwt-token-')) {
      return {
        success: false,
        message: 'Invalid token format detected',
        nextSteps: [
          'Token appears corrupted',
          'Please login again'
        ]
      };
    }

    // Test token validity
    const testResult = await fetch('/api/proxy/auth/token-balance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (testResult.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return {
        success: false,
        message: 'Token expired or invalid',
        nextSteps: [
          'Authentication token has expired',
          'Please login again'
        ]
      };
    }

    return {
      success: true,
      message: 'Authentication appears to be working correctly'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Authentication fix failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Fix API endpoint issues
 */
export async function fixApiEndpointIssues(): Promise<FixResult> {
  try {
    console.log('🌐 Fixing API endpoint issues...');

    // Always use real API - check connectivity
    const baseUrl = await getApiBaseUrl();

    try {
      const realApiTest = await fetch(`${baseUrl}/api/health`);
      if (realApiTest.ok) {
        return {
          success: true,
          message: 'Real API is accessible',
          details: { baseUrl }
        };
      } else {
        return {
          success: false,
          message: 'Real API responded with error',
          details: { baseUrl, status: realApiTest.status },
          nextSteps: [
            'Check API server status',
            'Verify API URL is correct',
            'API might be temporarily down'
          ]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Real API not accessible',
        details: { baseUrl, error: error instanceof Error ? error.message : 'Unknown error' },
        nextSteps: [
          'Check internet connection',
          'Verify API URL is correct',
          'API might be temporarily down'
        ]
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
 * Clear cache and refresh data
 */
export async function clearCacheAndRefresh(): Promise<FixResult> {
  try {
    console.log('🔄 Clearing cache and refreshing data...');

    // Clear localStorage cache
    localStorage.removeItem('tokenBalanceCache');

    // Clear any other relevant cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    return {
      success: true,
      message: 'Cache cleared successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Cache clear failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Run all quick fixes
 */
export async function runAllQuickFixes(): Promise<{
  results: { [key: string]: FixResult };
  overallSuccess: boolean;
  summary: string;
}> {
  console.log('🛠️ Running all quick fixes...');
  
  const results = {
    authentication: await fixAuthenticationIssues(),
    apiEndpoints: await fixApiEndpointIssues(),
    forceRefresh: await forceRefreshTokenBalance(),
    clearCache: await clearCacheAndRefresh()
  };

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  const overallSuccess = successCount > totalCount / 2;
  
  let summary = `${successCount}/${totalCount} fixes successful`;
  
  if (overallSuccess) {
    summary += ' - Token balance should be working now';
  } else {
    summary += ' - Manual intervention may be required';
  }

  return {
    results,
    overallSuccess,
    summary
  };
}

/**
 * Get recommended next steps based on fix results
 */
export function getRecommendedNextSteps(fixResults: { [key: string]: FixResult }): string[] {
  const nextSteps: string[] = [];
  
  // Collect all next steps from failed fixes
  Object.values(fixResults).forEach(result => {
    if (!result.success && result.nextSteps) {
      nextSteps.push(...result.nextSteps);
    }
  });

  // Remove duplicates
  const uniqueSteps = [...new Set(nextSteps)];
  
  // Add general recommendations if no specific steps
  if (uniqueSteps.length === 0) {
    uniqueSteps.push(
      'Try refreshing the page',
      'Check browser console for errors',
      'Contact support if issues persist'
    );
  }

  return uniqueSteps;
}
