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
    
    // Test all endpoints
    const results = await Promise.allSettled([
      fetch('/api/auth/token-balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      
      fetch('/api/proxy/auth/token-balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      
      checkTokenBalance()
    ]);

    const successful = results.filter(r => r.status === 'fulfilled');
    
    if (successful.length > 0) {
      return {
        success: true,
        message: `Successfully refreshed from ${successful.length}/3 sources`,
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
    const testResult = await fetch('/api/auth/token-balance', {
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
    
    // Check which APIs are available
    const baseUrl = await getApiBaseUrl();
    const isUsingMockApi = baseUrl === '';
    
    if (isUsingMockApi) {
      // Using mock API - check if development server is running
      try {
        const mockTest = await fetch('/api/auth/token-balance');
        if (mockTest.status === 401) {
          return {
            success: true,
            message: 'Mock API is working (authentication required)',
            details: { usingMockApi: true }
          };
        }
      } catch (error) {
        return {
          success: false,
          message: 'Mock API not accessible',
          nextSteps: [
            'Check if development server is running',
            'Run: npm run dev',
            'Check port 3000 is not blocked'
          ]
        };
      }
    } else {
      // Using real API - check connectivity
      try {
        const realApiTest = await fetch(`${baseUrl}/api/health`);
        if (realApiTest.ok) {
          return {
            success: true,
            message: 'Real API is accessible',
            details: { baseUrl, usingMockApi: false }
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
    }

    return {
      success: true,
      message: 'API endpoints appear to be working'
    };

  } catch (error) {
    return {
      success: false,
      message: 'API endpoint fix failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Reset mock API data
 */
export async function resetMockApiData(): Promise<FixResult> {
  try {
    console.log('🔄 Resetting mock API data...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        message: 'No token found for mock API reset'
      };
    }

    // Try to reset mock API data by calling it with a special header
    const response = await fetch('/api/auth/token-balance', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Reset-Mock-Data': 'true'
      },
      body: JSON.stringify({ action: 'reset' })
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Mock API data reset successfully'
      };
    } else {
      return {
        success: false,
        message: 'Mock API reset not supported',
        nextSteps: [
          'Restart development server to reset mock data',
          'Run: npm run dev'
        ]
      };
    }

  } catch (error) {
    return {
      success: false,
      message: 'Mock API reset failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      nextSteps: [
        'Restart development server manually',
        'Run: npm run dev'
      ]
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
    mockApiReset: await resetMockApiData()
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
